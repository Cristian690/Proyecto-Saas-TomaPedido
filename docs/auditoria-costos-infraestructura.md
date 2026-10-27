# Auditoría de costos e infraestructura de producción — OrdenFlash

**Fecha de consulta:** 20 de octubre de 2026.
**Alcance:** auditoría de repositorio y documentación/precios públicos oficiales; no se modificó infraestructura, configuración ni secretos.

## Resumen ejecutivo

La recomendación para el estado actual es **mantener temporalmente Render pago para la API y PostgreSQL, mantener el sitio estático actual, y no migrar Cloudinary todavía**. El piso realista es **USD 13/mes antes de impuestos** (web service siempre activo de USD 7 + PostgreSQL administrado de USD 6), no USD 0: las capas gratuitas no satisfacen el requisito de disponibilidad sin suspensión/cold start.

Un VPS Hetzner con API y PostgreSQL juntos puede bajar el desembolso técnico a aproximadamente **USD 9/mes**, pero ahorra sólo unos USD 4/mes y convierte al operador en responsable de parcheo, monitorización, recuperación y de un único punto de falla. Para comercios reales, esa diferencia no compensa la pérdida de PostgreSQL administrado/PITR y el tiempo operativo. Es la alternativa de **mínimo precio**, no la de **menor costo total ni menor riesgo**.

Cloudflare R2 es claramente la opción más barata al superar el free tier de Cloudinary: bajo las hipótesis normales de este informe permanece en USD 0 hasta 1.000 comercios. Sin embargo, el frontend actual sube directamente al proveedor de imágenes y usa transformaciones por URL; R2 no es un reemplazo transparente de Cloudinary. Debe tratarse como una migración futura con cambios de aplicación, pruebas y rollback, no como un ajuste de hosting.

## Hallazgos del repositorio

La revisión se limitó a archivos de código y migraciones, sin imprimir ni copiar valores de configuración.

- Hay una única API Java 21/Spring Boot empaquetada en Docker, sin colas, caché, workers ni servicios de búsqueda. Usa JPA, Spring Security/JWT y Flyway.
- PostgreSQL guarda tenants, usuarios, catálogo, configuración, pedidos e ítems. El aislamiento es lógico por `tenant_id`; los pedidos se consultan por tenant autenticado.
- La API no almacena binarios: persiste URLs de imágenes. El frontend carga imágenes directamente a Cloudinary y genera variantes de tamaño/calidad mediante URL.
- El frontend es estático y los recursos versionados incluidos en el repositorio ocupan aproximadamente 19 MB. No se halló una necesidad actual de SSR, CDN de pago ni un backend adicional.
- El Dockerfile es compatible con una VM Linux convencional. Para una futura VM ARM hay que probar el build/imagen resultante antes del corte; no se debe asumir compatibilidad sólo por el Dockerfile.
- El dominio indicado para producción es `tomapedido.com.ar`, pero las reglas CORS revisadas contienen otros orígenes de marca y el subdominio actual de Render. Antes de cualquier corte de DNS hay que verificar y aprobar la lista exacta de orígenes; no se cambió durante esta auditoría.

Por ello, el cuello de botella inicial no será transferencia ni almacenamiento, sino la memoria de JVM+PostgreSQL y la disciplina de backup/restore.

## Arquitectura recomendada ahora

```text
Usuarios
   │ HTTPS
   ├──────────────► Render Static Site (frontend actual, USD 0)
   │                         │ HTTPS/API
   │                         ▼
   │                 Render Web Service pago (Spring Boot, siempre activo)
   │                         │ red privada
   │                         ▼
   │                 Render Postgres pago + PITR
   │                         │
   │                         └── export lógico periódico a almacenamiento externo
   │
   └──────────────► Cloudinary CDN (mantener mientras esté dentro del free tier)
                              │
                    futura migración validada
                              ▼
                     Cloudflare R2 + dominio/CDN
```

**Controles mínimos desde el primer cliente:** servicio Render pago (nunca free), límite de memoria JVM acorde al plan, health check, alerta de disponibilidad, MFA para proveedores, secretos sólo en variables de entorno, PostgreSQL sin exposición pública salvo necesidad acotada, rotación de credenciales, HTTPS forzado y restauración de prueba trimestral. Se conserva el CORS explícito y la autorización por rol/tenant existentes, pero una auditoría de aplicación separada debería verificar que cada operación de escritura/lectura valida el tenant del JWT.

### Backup y recuperación propuestos

1. Render Postgres pago ofrece PITR de 3 días en workspace Hobby y 7 días en Pro o superior; no sustituye un respaldo independiente.
2. Generar un `pg_dump` lógico diario cifrado y enviarlo a un bucket independiente (R2 Standard, por ejemplo), conservar 35 diarios, 12 mensuales y documentar la clave fuera del servidor.
3. Mensualmente restaurar el último dump en una base aislada y comprobar Flyway, conteos básicos y login. Objetivo práctico: RPO <= 24 h para el backup externo y RTO <= 2 h. El PITR reduce el RPO dentro de su ventana.
4. Ante incidente: crear/restaurar una instancia aislada, validar, cambiar la URL de conexión, verificar pedidos y sólo entonces retirar la original. No restaurar sobre una base con datos sin un procedimiento aprobado.

La documentación de Render confirma el PITR de las bases pagas y explica tanto el export lógico como su restauración. También aclara que los respaldos asociados se eliminan al borrar la instancia: de ahí el respaldo externo.

## Hipótesis de cálculo

Son estimaciones deliberadamente transparentes, no una promesa de capacidad. Los precios son USD/mes salvo donde se indica EUR, sin IVA, percepciones, tipo de cambio ni comisión de tarjeta.

| Métrica mensual por comercio | Caso base | Caso conservador |
|---|---:|---:|
| Visitas a carta | 1.000 | 10.000 |
| Pedidos | 100 | 1.000 |
| Requests API | 15.500 | 155.000 |
| Impresiones de imágenes | 5.000 | 50.000 |
| Tráfico de imágenes optimizadas | 0,75 GB | 7,5 GB |
| Nuevas imágenes/almacenamiento acumulado | 10 MB | 50 MB |

Supuestos: 5 imágenes por visita, 150 KB efectivos por imagen, 30 días, catálogo mayormente cacheable. No se incluyen WhatsApp, Mercado Pago, correo/SMS, soporte, dominio ya adquirido ni costo de horas humanas. El caso conservador sí detecta temprano el punto en que Cloudinary deja de ser económico.

## Precios unitarios verificados

| Componente | Precio permanente consultado | Observación relevante |
|---|---:|---|
| Render web `0.5c-512mb` | USD 7 | Es el mínimo pago siempre activo; 512 MB es ajustado para Java. |
| Render PostgreSQL `0.1c-256mb` | USD 6 + almacenamiento desde USD 0,30/GB sobre 1 GB incluido | 100 conexiones; apto sólo para arranque muy pequeño. |
| Render web 2 GB / Postgres 1 GB / 2 GB | USD 25 / 19 / 40 | Escalones usados en las proyecciones. |
| Cloudinary Free | USD 0, 25 créditos/mes | Un crédito equivale a 1 GB de imagen, 1 GB de storage o 1.000 transformaciones; los tres consumos se suman. |
| Cloudinary Plus | USD 99/mes, 225 créditos | No es un precio por uso barato cuando el tráfico crece. |
| Cloudflare R2 Standard | USD 0,015/GB-mes; A USD 4,50/M; B USD 0,36/M | Free mensual: 10 GB, 1 M A y 10 M B; salida a Internet gratis. |
| Cloudflare DNS/SSL | USD 0 en plan Free | DNS, CDN, DDoS y Universal SSL incluidos; sin SLA. |
| Hetzner CAX11 / IPv4 / backups | USD 6,99 / 0,60 / 20% del servidor | Precio de servidor sin IVA; backup trae 7 slots. |
| AWS Lightsail Linux IPv4 | USD 12 (2 GB), 24 (4 GB), 44 (8 GB) | Incluye SSD y transferencia; snapshot USD 0,05/GB-mes. |
| AWS Lightsail PostgreSQL administrado | USD 15 (1 GB), 30 (2 GB), 60 (4 GB) | Alta disponibilidad cuesta 2x el plan Standard. |

Las capas gratuitas o créditos de bienvenida **no están incluidos** en los totales. En particular, AWS anuncia créditos de Free Tier para cuentas nuevas: son promoción temporal, no costo permanente.

## Comparación por escenario

### Total mensual — tráfico base

Incluye frontend/DNS/HTTPS en USD 0 cuando corresponde, R2 en USD 0 bajo sus franquicias y una provisión pequeña de snapshots donde aplica. No incluye dominio ni impuestos.

| Alternativa concreta | 1 comercio | 10 comercios | 100 comercios | 1.000 comercios | Operación / disponibilidad |
|---|---:|---:|---:|---:|---|
| **Render actual**: web + PG administrado + Cloudinary Free | **13** | **13** | **44** | **160** | Menor operación, PITR; sin cold start en plan pago. A 1.000 el tamaño es una estimación y requiere prueba de carga. |
| **Hetzner VPS**: CAX11/CAX21/CAX31, API+PG juntas, backups + R2 | **9** | **9** | **16** | **31** | Siempre encendido pero un único host/falla; alta administración. |
| **AWS mínimo**: Lightsail VM con API+PG juntas + snapshots + R2 | **14** | **14** | **26** | **48** | Mismo riesgo de host único; precio/operación peores que Hetzner. |
| **AWS separando DB**: Lightsail VM + PostgreSQL gestionado Standard + R2 | **28** | **28** | **56** | **104** | Mejor aislamiento de datos, pero no es el mínimo costo; HA de DB duplica la parte DB. |
| DigitalOcean: Droplet + Managed PostgreSQL | >= 30 | >= 30 | >= 45 | >= 90 | La base administrada comienza en USD 15; no mejora el costo de Render/AWS aquí. |

**Cómo se calculó Render:** 1/10 = USD 7 + 6; 100 = web 2 GB USD 25 + Postgres 1 GB USD 19; 1.000 = web 4 GB USD 85 + Postgres 4 GB/2 CPU USD 75. Hay que medir heap, consultas, conexiones y p95 antes de adoptar cualquier escalón. El storage adicional de DB y el excedente de R2 se agregarían si se superan las franquicias.

**Cómo se calculó Hetzner:** USD 6,99 + IPv4 USD 0,60 + backup 20% = USD 8,99; CAX21 = 12,49 + 0,60 + 2,50 = USD 15,59; CAX31 = 24,99 + 0,60 + 5,00 = USD 30,59, redondeado. Son servidores compartidos ARM y precios sin IVA; verificar disponibilidad/región al comprar. R2 no cobra en el caso base.

**Cómo se calculó AWS:** VM + snapshot estimado de 30/40/80 GB a USD 0,05/GB (USD 1,50/2/4). Para DB gestionada se suma VM de 12/24/44 y DB de 15/30/60, sin HA ni balanceador. En São Paulo las franquicias de transferencia de Lightsail son la mitad de las publicadas, aunque los volúmenes de estos supuestos están muy por debajo.

### Sensibilidad conservadora para imágenes

En el caso conservador, R2 recibe 50.000 lecturas de objeto por comercio/mes y 50 MB almacenados por comercio. Sus costos aproximados son:

| Comercios | Lecturas R2/mes | Storage | R2 Standard estimado |
|---|---:|---:|---:|
| 1 | 50.000 | 0,05 GB | USD 0 |
| 10 | 500.000 | 0,5 GB | USD 0 |
| 100 | 5 M | 5 GB | USD 0 |
| 1.000 | 50 M | 50 GB | **USD 15,00** (40 M lecturas facturables = 14,40; 40 GB storage = 0,60) |

En contraste, a 100 comercios conservadores hay unos 750 GB/mes de entrega de imágenes. Cloudinary Free no alcanza sus 25 créditos; su plan Plus de USD 99 aporta sólo 225 créditos y la factura/plan exacto debe validarse en su consola antes de vender esa escala. R2 es económicamente muy superior para objetos estáticos, pero no ofrece por sí mismo las transformaciones dinámicas de Cloudinary.

## Costo por comercio y punto de equilibrio

| Escenario recomendado Render | Costo plataforma | Costo de infraestructura por comercio |
|---|---:|---:|
| 1 comercio | USD 13 | USD 13,00 |
| 10 comercios | USD 13 | USD 1,30 |
| 100 comercios | USD 44 | USD 0,44 |
| 1.000 comercios | USD 160 | USD 0,16 |

El punto de equilibrio de infraestructura se logra con **un solo comercio pago cuya contribución neta sea al menos USD 13/mes** (o su equivalente al tipo de cambio efectivo). Para una tarifa mensual `P` y margen variable por comercio `m`, el punto de equilibrio es `ceil(costo fijo / m)`. No se inventa una tarifa comercial porque el proyecto no la define. Frente a Hetzner, Render cuesta unos USD 4 más a escala muy pequeña; ese ahorro no cubre ni una fracción razonable de una intervención manual de recuperación.

## Riesgos, límites y costos ocultos

- **VPS único:** host, disco, JVM y PostgreSQL caen juntos. Backup no es alta disponibilidad. Para HA real hacen falta al menos otra VM/DB, monitorización/failover y un presupuesto mayor.
- **Render mínimo:** 512 MB para Spring Boot y 256 MB para PostgreSQL dejan poco margen. Vigilar OOM, latencia p95, conexiones y disco; subir antes de afectar pedidos.
- **Cloudinary:** el consumo de storage, ancho de banda y transformaciones se suma en créditos; versiones/derivados también cuentan. Los uploads directos deben tener preset restrictivo y límites de tipo/tamaño.
- **R2:** las lecturas se cobran por operación incluso si el egress es gratis; Standard es la clase apropiada para cartas consultadas frecuentemente. No usar Infrequent Access para imágenes activas: añade lectura, operaciones más caras y mínimo de 30 días.
- **R2 no sustituye imágenes transformadas sin trabajo:** habrá que generar variantes al subir o servirlas con un servicio de transformación. No publicar credenciales S3 en navegador; usar URL firmada/presigned o un endpoint autenticado.
- **Dominio y fiscalidad:** el dominio es un costo anual separado. Precios de proveedores no incluyen impuestos; el emisor de tarjeta, IVA/impuestos locales, retenciones/percepciones, conversión USD/EUR y comisión bancaria pueden elevar el total. Confirmar el importe final en la factura y con asesor contable antes de fijar precios en ARS.
- **AWS:** snapshots, exceso de transferencia, IPs, regiones y servicios adicionales se facturan por separado. En Lightsail la transferencia entrante y saliente cuenta para la franquicia; sólo el exceso saliente se cobra.
- **Cloudflare Free:** no ofrece SLA. Es adecuado para DNS/CDN/frontend inicial, pero no debe confundirse con una garantía empresarial.
- **Seguridad operativa:** firewall restringido, SSH por clave y MFA, actualizaciones de SO/JDK, logs sin PII/secrets, rate limiting/WAF y prueba de restore son obligaciones si se elige VPS. Esto explica por qué el costo humano domina el ahorro de USD 4.

## Plan de migración por etapas (sin ejecutar durante esta auditoría)

### Etapa 0 — línea base y reversibilidad

1. Inventariar métricas de Render/Cloudinary: RAM, CPU, p95, conexiones PG, tamaño, uso de créditos y top imágenes. Exportar inventario de URLs, no credenciales.
2. Confirmar dominio, TTL y propietarios de cuentas. Crear backup lógico probado y conservar el Render actual como origen hasta aceptación.
3. Definir criterios de corte: p95, tasa de error, pedidos conciliados, RPO/RTO y responsable de rollback.

### Etapa 1 — imágenes a R2 (opcional, sólo si los créditos justifican el cambio)

1. Crear bucket R2 Standard privado, dominio de media, lifecycle, CORS mínimo y una cuenta técnica con permiso acotado.
2. Copiar primero objetos, checksums y metadatos sin borrar Cloudinary. Validar muestreo visual, MIME, cache y URLs.
3. Implementar en ambiente de prueba carga mediante URL firmada/endpoint y variantes pre-generadas; adaptar las URLs de catálogo. No exponer claves R2 en JS.
4. Canary con un comercio de prueba. Mantener las URLs Cloudinary y la posibilidad de volver al proveedor previo; recién borrar tras una ventana de retención acordada.

### Etapa 2 — si se evaluara mover Render a VPS

1. Construir una VM nueva con Docker, PostgreSQL aislado de Internet, proxy TLS, firewall, actualizaciones automáticas controladas, monitorización y backup cifrado externo.
2. Restaurar una copia de Render, ejecutar Flyway de forma controlada, probar login, aislamiento tenant, catálogo, pedido y restore completo.
3. Bajar TTL, poner el nuevo backend detrás de un hostname de staging y ejecutar carga. Corte por DNS sólo en una ventana de baja demanda.
4. **Rollback:** re-apuntar DNS al backend Render, conservar Render y Cloudinary sin cambios, y no destruir la fuente hasta reconciliar pedidos y validar backups.

### Etapa 3 — escala

Antes de 100 comercios medir; antes de 1.000 realizar prueba de carga y decidir por evidencia entre escalar Render, separar PostgreSQL o adoptar una arquitectura con réplica/HA. No migrar por el número de comercios solamente.

## Fuentes oficiales consultadas

Todos los precios y límites siguientes se consultaron el 20-10-2026. Los enlaces son parte del control de vigencia: volver a verificarlos antes de contratar.

- [Render pricing](https://render.com/pricing) — web USD 7/25/85, Postgres USD 6/19/40/75, almacenamiento y límites.
- [Render: recuperación y backups de Postgres](https://render.com/docs/postgresql-backups), [backup a S3](https://render.com/docs/backup-postgresql-to-s3) y [nota de retención/eliminación](https://render.com/tutorials/postgres-on-render/backups-and-pitr) — PITR, export, restauración y alcance de retención.
- [Cloudinary pricing](https://cloudinary.com/pricing) y [billing/credits](https://cloudinary.com/documentation/billing_and_plans) — Free 25 créditos, Plus USD 99/225 créditos y definición de crédito.
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) — storage, Class A/B, franquicias y egress gratis.
- [Cloudflare plans](https://www.cloudflare.com/plans/) y [Cloudflare Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/) — DNS/SSL/CDN Free; [límites de Pages](https://developers.cloudflare.com/pages/platform/limits/) — frontend estático y dominios custom.
- [Hetzner ajuste de precios 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [IP pricing](https://docs.hetzner.com/general/infrastructure-and-availability/ipv4-pricing/) y [FAQ de backups](https://docs.hetzner.com/cloud/billing/faq/) — CAX, IPv4 y backups al 20%.
- [AWS Lightsail pricing](https://aws.amazon.com/lightsail/pricing/) y [bundles de instancias](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-bundles.html) — VM, transferencia, snapshots y bases administradas.
- [AWS Lightsail: facturación y bases administradas](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-frequently-asked-questions-faq-billing-and-account-management.html) — DB desde USD 15 y HA a 2x.
- [DigitalOcean managed databases](https://www.digitalocean.com/pricing/managed-databases) y [backups](https://docs.digitalocean.com/products/backups/details/pricing/) — DB desde USD 15 y backup de Droplet.

## Recomendación final

**No migres ahora.** Para OrdenFlash sin clientes reales, el stack actual en planes pagos mínimos de Render tiene el mejor equilibrio: USD 13/mes fijo antes de impuestos, API sin suspensión, PostgreSQL persistente con PITR, HTTPS y mínimo trabajo operativo. Mantener Cloudinary mientras su consumo esté dentro de 25 créditos evita cambios de código prematuros.

Instrumentar consumo durante los primeros comercios y preparar R2 como siguiente optimización si Cloudinary se acerca al límite. Sólo considerar el VPS Hetzner cuando haya capacidad operativa explícita para asumir guardia, restauraciones y el riesgo de host único, o cuando el ahorro acumulado sea mayor que ese costo humano. AWS y DigitalOcean no ganan esta comparación de precio para la arquitectura concreta requerida.
