#!/bin/sh
# Substitute PORT placeholder dengan nilai $PORT dari Railway
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /app/nginx.conf
nginx -g 'daemon off;' -c /app/nginx.conf
