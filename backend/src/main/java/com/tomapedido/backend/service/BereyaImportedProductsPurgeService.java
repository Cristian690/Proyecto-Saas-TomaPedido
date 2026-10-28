package com.tomapedido.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tomapedido.backend.dto.PurgeBereyaImportedProductsRequest;
import com.tomapedido.backend.dto.PurgeBereyaImportedProductsResponse;
import com.tomapedido.backend.entity.Product;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.repository.ProductRepository;
import com.tomapedido.backend.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

/**
 * One-time, tenant-scoped cleanup for the exact test catalog imported for Bereya.
 * This is deliberately not a generic bulk-delete operation.
 */
@Service
@RequiredArgsConstructor
public class BereyaImportedProductsPurgeService {

    static final String BEREYA_SLUG = "bereya-juegos-didacticos";
    static final String REQUIRED_CONFIRMATION =
            "ELIMINAR 57 PRODUCTOS DE PRUEBA DE BEREYA (bereya-juegos-didacticos)";
    static final Set<Long> PROTECTED_ORIGINAL_PRODUCT_IDS = Set.of(18L, 19L, 20L, 21L, 22L, 23L, 24L);

    static final Map<Long, String> EXPECTED_PRODUCTS = Map.ofEntries(
            Map.entry(98L, "Juego de tiro al blanco con dinosaurio azul"),
            Map.entry(99L, "Juego de tiro al blanco Spider-Man"),
            Map.entry(100L, "Juego de tiro al blanco Avengers"),
            Map.entry(101L, "Bloques de construcción rosas y pastel"),
            Map.entry(102L, "Bloques de construcción multicolores"),
            Map.entry(103L, "Rompecabezas infantiles variados"),
            Map.entry(104L, "Set de masas y moldes infantiles"),
            Map.entry(105L, "Rompecabezas de animales y personajes"),
            Map.entry(106L, "Set de encastre y actividades infantiles"),
            Map.entry(107L, "Juego didáctico de encastre"),
            Map.entry(108L, "Juego de memoria con botones de colores"),
            Map.entry(109L, "Set de juguetes y accesorios infantiles"),
            Map.entry(110L, "Rompecabezas de madera con figuras"),
            Map.entry(111L, "Set de láminas para colorear"),
            Map.entry(112L, "Lámina didáctica de números"),
            Map.entry(113L, "Rompecabezas de osito"),
            Map.entry(114L, "Rompecabezas de dinosaurios"),
            Map.entry(115L, "Set de dibujos para colorear de personajes"),
            Map.entry(116L, "Lámina para colorear de capibara"),
            Map.entry(117L, "Lámina para colorear de chica animada"),
            Map.entry(118L, "Lámina para colorear de gatito"),
            Map.entry(119L, "Lámina para colorear de unicornio"),
            Map.entry(120L, "Set de rompecabezas infantiles ilustrados"),
            Map.entry(121L, "Máquina de juguetes con accesorios"),
            Map.entry(122L, "Juego de encastre geométrico"),
            Map.entry(123L, "Juego de té infantil"),
            Map.entry(124L, "Juego de cocina infantil"),
            Map.entry(125L, "Set de bloques de construcción"),
            Map.entry(126L, "Juego de construcción con herramientas"),
            Map.entry(127L, "Set de juguetes marinos"),
            Map.entry(128L, "Set de sonajeros y juguetes para bebé"),
            Map.entry(129L, "Juego de construcción Track Maze"),
            Map.entry(130L, "Set de cocina y accesorios infantiles"),
            Map.entry(131L, "Rompecabezas de animales encastrables"),
            Map.entry(132L, "Set de juguetes de comida"),
            Map.entry(133L, "Set de baldes y accesorios de playa"),
            Map.entry(134L, "Pizarra infantil para dibujar"),
            Map.entry(135L, "Juego didáctico de construcción y encastre"),
            Map.entry(136L, "Rompecabezas de animales de madera"),
            Map.entry(137L, "Rompecabezas de animales variados"),
            Map.entry(138L, "Juego de agua con diseño de fútbol"),
            Map.entry(139L, "Juego de agua con diseño de princesa"),
            Map.entry(140L, "Juego de agua con diseño marino"),
            Map.entry(141L, "Set de juguetes de agua y animales"),
            Map.entry(142L, "Set de tarjetas y actividades didácticas"),
            Map.entry(143L, "Juego electrónico de memoria con animales"),
            Map.entry(144L, "Juego de asociación de imágenes"),
            Map.entry(145L, "Juego de asociación por colores"),
            Map.entry(146L, "Tarjetas educativas de objetos"),
            Map.entry(147L, "Set de cocina infantil con accesorios"),
            Map.entry(148L, "Set de cocina infantil Space"),
            Map.entry(149L, "Set de construcción con piezas plásticas"),
            Map.entry(150L, "Set de dibujo y actividades de animales"),
            Map.entry(151L, "Pizarra educativa de letras y números"),
            Map.entry(152L, "Set de juguetes de vehículos y accesorios"),
            Map.entry(153L, "Set de pizarras para dibujar"),
            Map.entry(154L, "Libros infantiles de cuentos ilustrados"));

    static {
        if (EXPECTED_PRODUCTS.size() != 57
                || EXPECTED_PRODUCTS.keySet().stream().anyMatch(PROTECTED_ORIGINAL_PRODUCT_IDS::contains)
                || java.util.stream.LongStream.rangeClosed(98L, 154L)
                        .anyMatch(id -> !EXPECTED_PRODUCTS.containsKey(id))) {
            throw new IllegalStateException("El manifiesto fijo de limpieza de Bereya no es válido");
        }
    }

    private final ProductRepository productRepository;
    private final SecurityUtils securityUtils;
    private final TenantStatusService tenantStatusService;

    @Transactional
    public PurgeBereyaImportedProductsResponse purge(
            PurgeBereyaImportedProductsRequest request) {

        Tenant tenant = securityUtils.getAuthenticatedUser().getTenant();
        tenantStatusService.requireAdministrationAllowed(tenant);
        requireBereyaTenant(tenant);
        requireExplicitConfirmation(request);

        List<Long> targetIds = EXPECTED_PRODUCTS.keySet().stream().sorted().toList();
        List<Product> products = productRepository
                .findAllByIdInAndTenantIdForUpdate(targetIds, tenant.getId());

        validateManifest(products, tenant, targetIds);

        productRepository.deleteAll(products);
        productRepository.flush();

        return new PurgeBereyaImportedProductsResponse(tenant.getSlug(), products.size());
    }

    private void requireBereyaTenant(Tenant tenant) {
        if (!BEREYA_SLUG.equals(tenant.getSlug())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "La limpieza solicitada no está autorizada para este comercio");
        }
    }

    private void requireExplicitConfirmation(PurgeBereyaImportedProductsRequest request) {
        if (!REQUIRED_CONFIRMATION.equals(request.getConfirmation())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La confirmación explícita no coincide con la operación solicitada");
        }
    }

    private void validateManifest(
            List<Product> products,
            Tenant tenant,
            List<Long> targetIds) {

        if (products.size() != EXPECTED_PRODUCTS.size()) {
            throw conflict("No se encontraron exactamente los 57 productos esperados para eliminar");
        }

        Map<Long, Product> productsById = products.stream()
                .collect(java.util.stream.Collectors.toMap(Product::getId, product -> product));

        for (Long id : targetIds) {
            Product product = productsById.get(id);
            if (product == null
                    || !Objects.equals(product.getTenant().getId(), tenant.getId())
                    || !Objects.equals(product.getName(), EXPECTED_PRODUCTS.get(id))) {
                throw conflict("El manifiesto de productos de Bereya no coincide con el estado actual");
            }
        }
    }

    private ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
