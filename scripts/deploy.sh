#!/bin/bash
set -Eeuo pipefail

COLOR="${1:-}"

if [[ "$COLOR" != "blue" && "$COLOR" != "green" ]]; then
  echo "Uso: $0 blue|green"
  exit 1
fi

IMAGE="${IMAGE:-}"
if [[ -z "$IMAGE" ]]; then
  echo "ERROR: variable IMAGE no definida"
  exit 1
fi

PORT=8082
[[ "$COLOR" == "blue" ]] && PORT=8081

CONTAINER_NAME="chesswiki_${COLOR}"

echo "=== Desplegando entorno ${COLOR} ==="
echo "Imagen: ${IMAGE}"
echo "Contenedor: ${CONTAINER_NAME}"
echo "Puerto host: ${PORT} -> contenedor: 3000"

docker pull "${IMAGE}"
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:3000" \
  -e APP_COLOR="${COLOR}" \
  -e APP_VERSION="${APP_VERSION:-manual}" \
  "${IMAGE}"

echo "Esperando /health en ${PORT}..."

ATTEMPTS=10
SLEEP_SECONDS=3

for i in $(seq 1 "${ATTEMPTS}"); do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    echo "Health OK en intento ${i}"
    break
  fi
  if [[ "$i" == "${ATTEMPTS}" ]]; then
    echo "ERROR: no respondió /health"
    docker logs "${CONTAINER_NAME}" || true
    docker rm -f "${CONTAINER_NAME}" || true
    exit 1
  fi
  echo "Intento ${i}/${ATTEMPTS} falló, reintentando..."
  sleep "${SLEEP_SECONDS}"
done

NGINX_CONF_DIR="/etc/nginx/conf.d"
ln -sfn "${NGINX_CONF_DIR}/app_${COLOR}.conf" "${NGINX_CONF_DIR}/app_active.conf"

nginx -t
systemctl reload nginx

echo "OK: entorno ${COLOR} activo y sirviendo tráfico."
