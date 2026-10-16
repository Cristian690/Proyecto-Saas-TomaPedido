#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly API_FILE="$PROJECT_ROOT/frontend/js/api/api.js"
readonly FRONTEND_DIR="$PROJECT_ROOT/frontend"
readonly FRONTEND_PORT="5500"
readonly FRONTEND_START_ATTEMPTS="10"
readonly LOCAL_API_URL="http://192.168.100.32:8080"
readonly PRODUCTION_API_URL="https://ordenflash-api.onrender.com"

frontend_pid=""

usage() {
    echo "Uso: $0 {local|produccion|preparar}" >&2
}

require_python() {
    if ! command -v python3 >/dev/null 2>&1; then
        echo "Error: se requiere python3 para servir el frontend." >&2
        return 1
    fi
}

set_api_url() {
    local api_url="$1"
    local active_declaration_count

    active_declaration_count="$(grep -Ec '^export const API_URL = "[^"]+";$' "$API_FILE" || true)"

    if [[ "$active_declaration_count" -ne 1 ]]; then
        echo "Error: se esperaba una única declaración activa de API_URL en $API_FILE." >&2
        exit 1
    fi

    sed -i \
        "s|^export const API_URL = \"[^\"]*\";$|export const API_URL = \"$api_url\";|" \
        "$API_FILE"
}

get_api_url() {
    sed -nE 's/^export const API_URL = "([^"]+)";$/\1/p' "$API_FILE"
}

stop_frontend() {
    if [[ -n "$frontend_pid" ]] &&
        [[ "$(ps -o ppid= -p "$frontend_pid" 2>/dev/null | tr -d ' ')" == "$$" ]]; then
        kill "$frontend_pid" >/dev/null 2>&1 || true
    fi

    wait "$frontend_pid" 2>/dev/null || true
    frontend_pid=""
}

is_frontend_port_available() {
    python3 - "$FRONTEND_PORT" <<'PY'
import socket
import sys

try:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("", int(sys.argv[1])))
except OSError:
    sys.exit(1)
PY
}

is_frontend_available() {
    python3 - "$FRONTEND_PORT" "$FRONTEND_DIR/index.html" <<'PY'
from pathlib import Path
import sys
from urllib.request import urlopen

try:
    with urlopen(
        f"http://127.0.0.1:{sys.argv[1]}/index.html",
        timeout=0.2
    ) as response:
        served_content = response.read()
except OSError:
    sys.exit(1)

sys.exit(served_content != Path(sys.argv[2]).read_bytes())
PY
}

start_frontend_in_background() {
    if ! require_python; then
        return 1
    fi

    if ! is_frontend_port_available; then
        echo "Error: el puerto $FRONTEND_PORT ya está en uso." >&2
        return 1
    fi

    python3 -m http.server "$FRONTEND_PORT" --directory "$FRONTEND_DIR" &
    frontend_pid="$!"

    for ((attempt = 1; attempt <= FRONTEND_START_ATTEMPTS; attempt++)); do
        if ! kill -0 "$frontend_pid" >/dev/null 2>&1; then
            wait "$frontend_pid" 2>/dev/null || true
            echo "Error: no se pudo iniciar el frontend en el puerto $FRONTEND_PORT." >&2
            return 1
        fi

        if is_frontend_available; then
            return 0
        fi

        sleep 0.1
    done

    stop_frontend
    echo "Error: el frontend no respondió en el puerto $FRONTEND_PORT." >&2
    return 1
}

run_local() {
    set_api_url "$LOCAL_API_URL"
    trap stop_frontend EXIT

    if ! start_frontend_in_background; then
        set_api_url "$PRODUCTION_API_URL"
        return 1
    fi

    echo "Frontend local disponible en http://localhost:$FRONTEND_PORT"
    echo "API configurada en $LOCAL_API_URL"
    echo "El backend solicitará la contraseña local de PostgreSQL."

    "$PROJECT_ROOT/backend/run-local.sh"
}

run_production() {
    set_api_url "$PRODUCTION_API_URL"
    require_python

    echo "Frontend disponible en http://localhost:$FRONTEND_PORT"
    echo "API configurada en $PRODUCTION_API_URL"

    python3 -m http.server "$FRONTEND_PORT" --directory "$FRONTEND_DIR"
}

prepare_production() {
    local current_api_url

    current_api_url="$(get_api_url)"

    if [[ "$current_api_url" != "$PRODUCTION_API_URL" ]]; then
        echo "La API activa no apunta a producción: $current_api_url" >&2
        echo "Ejecutá ./dev.sh produccion antes de preparar el deploy." >&2
        git status --short
        exit 1
    fi

    echo "API configurada correctamente para producción: $PRODUCTION_API_URL"
    git status --short
}

case "${1:-}" in
    local)
        run_local
        ;;
    produccion)
        run_production
        ;;
    preparar)
        prepare_production
        ;;
    *)
        usage
        exit 1
        ;;
esac
