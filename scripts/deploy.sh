#!/usr/bin/env bash
set -euo pipefail

COLOR="${1:-}"

if [[ "$COLOR" != "blue" && "$COLOR" != "green" ]]; then
  echo "Uso: $0 blue|green"
  exit 1
fi

# Imagen que queremos desplegar (la pasa el pipeline)
IMAGE="${IMAGE:-}"
if [[ -z "$IMAGE" ]]; then
  echo "ERROR: variable IMAGE no definida"
  exit 1
fi

# Puerto host según el color (docker -p HOST:CONTAINER)
if [[ "$COLOR" == "blue" ]]; then
  PORT=8081
else
  PORT=8082
fi

CONTAINER_NAME="chesswiki_${COLOR}"

echo "=== Desplegando entorno ${COLOR} ==="
echo "Imagen: ${IMAGE}"
echo "Contenedor: ${CONTAINER_NAME}"
echo "Puerto host: ${PORT} -> contenedor: 3000"

# 1. Traer imagen del registry
docker pull "${IMAGE}"

# 2. Parar/eliminar cualquier contenedor previo de ese color
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

# 3. Levantar nueva versión (aquí va el docker -p que quería el profe)
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:3000" \
  -e APP_COLOR="${COLOR}" \
  -e APP_VERSION="${APP_VERSION:-${CI_COMMIT_SHORT_SHA:-local}}" \
  "${IMAGE}"

# 4. Apuntar Nginx al color correcto
NGINX_CONF_DIR="/etc/nginx/conf.d"
ln -sfn "${NGINX_CONF_DIR}/app_${COLOR}.conf" "${NGINX_CONF_DIR}/app_active.conf"

echo "Recargando Nginx..."
if command -v nginx >/dev/null 2>&1; then
  nginx -s reload || systemctl reload nginx
else
  systemctl reload nginx
fi

echo "OK: entorno ${COLOR} activo y sirviendo tráfico."
