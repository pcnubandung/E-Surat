FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN node node_modules/vite/bin/vite.js build

FROM caddy:2-alpine

COPY --from=builder /app/dist /app/dist
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
