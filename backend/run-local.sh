#!/usr/bin/env bash

set -euo pipefail

readonly LOCAL_DB_URL="jdbc:postgresql://localhost:5432/tomapedido"
readonly LOCAL_DB_HOST="localhost"
readonly LOCAL_DB_NAME="tomapedido"
readonly LOCAL_DB_USERNAME="postgres"

if ! command -v openssl >/dev/null 2>&1; then
    echo "Error: se requiere openssl para generar el JWT local." >&2
    exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
    echo "Error: se requiere psql para validar la conexión local." >&2
    exit 1
fi

read -r -s -p "Contraseña de PostgreSQL local: " DB_PASSWORD
echo

if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: la contraseña de PostgreSQL es obligatoria." >&2
    exit 1
fi

if ! PGPASSWORD="$DB_PASSWORD" psql \
    -h "$LOCAL_DB_HOST" \
    -U "$LOCAL_DB_USERNAME" \
    -d "$LOCAL_DB_NAME" \
    -Atqc "SELECT 1" >/dev/null; then
    echo "Error: no se pudo conectar a PostgreSQL local." >&2
    exit 1
fi

export DB_URL="$LOCAL_DB_URL"
export DB_USERNAME="$LOCAL_DB_USERNAME"
export DB_PASSWORD
export JWT_SECRET
JWT_SECRET="$(openssl rand -base64 48)"

trap 'unset DB_PASSWORD JWT_SECRET' EXIT

./mvnw spring-boot:run
