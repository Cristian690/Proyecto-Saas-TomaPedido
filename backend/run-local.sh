#!/usr/bin/env bash

set -euo pipefail

readonly LOCAL_DB_URL="jdbc:postgresql://localhost:5432/tomapedido"
readonly LOCAL_DB_HOST="localhost"
readonly LOCAL_DB_NAME="tomapedido"
readonly LOCAL_DB_USERNAME="postgres"
readonly LOCAL_ENV_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/ordenflash/.env.local"

load_local_cloudinary_environment() {
    local file_mode
    local line
    local line_number=0
    local variable_name
    local variable_value
    declare -A loaded_variables=()

    if [[ ! -e "$LOCAL_ENV_FILE" ]]; then
        return
    fi

    if [[ ! -f "$LOCAL_ENV_FILE" ]] || [[ -L "$LOCAL_ENV_FILE" ]]; then
        echo "Error: $LOCAL_ENV_FILE debe ser un archivo regular." >&2
        exit 1
    fi

    file_mode="$(stat -c '%a' "$LOCAL_ENV_FILE")"

    if (( (8#$file_mode & 8#077) != 0 )); then
        echo "Error: $LOCAL_ENV_FILE tiene permisos demasiado abiertos ($file_mode)." >&2
        echo "Corregilos manualmente con: chmod 600 $LOCAL_ENV_FILE" >&2
        exit 1
    fi

    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_number += 1))
        line="${line%$'\r'}"
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"

        if [[ -z "$line" ]] || [[ "$line" == \#* ]]; then
            continue
        fi

        if [[ "$line" != *=* ]]; then
            echo "Error: formato inválido en $LOCAL_ENV_FILE (línea $line_number)." >&2
            exit 1
        fi

        variable_name="${line%%=*}"
        variable_value="${line#*=}"
        variable_name="${variable_name#"${variable_name%%[![:space:]]*}"}"
        variable_name="${variable_name%"${variable_name##*[![:space:]]}"}"

        case "$variable_name" in
            CLOUDINARY_CLOUD_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET)
                ;;
            *)
                echo "Error: $LOCAL_ENV_FILE solo admite variables de Cloudinary (línea $line_number)." >&2
                exit 1
                ;;
        esac

        if [[ -z "$variable_value" ]]; then
            echo "Error: $variable_name no puede estar vacía en $LOCAL_ENV_FILE." >&2
            exit 1
        fi

        if [[ -n "${loaded_variables[$variable_name]:-}" ]]; then
            echo "Error: $variable_name está definida más de una vez en $LOCAL_ENV_FILE." >&2
            exit 1
        fi

        export "$variable_name=$variable_value"
        loaded_variables["$variable_name"]=1
    done < "$LOCAL_ENV_FILE"
}

load_local_cloudinary_environment

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
JWT_SECRET="$(openssl rand -base64 48)"
export JWT_SECRET

trap 'unset DB_PASSWORD JWT_SECRET' EXIT

cd "$(dirname "$0")"
./mvnw spring-boot:run
