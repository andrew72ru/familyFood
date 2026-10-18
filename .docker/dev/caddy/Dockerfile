FROM caddy:2-builder AS builder

RUN xcaddy build \
    --with github.com/dunglas/vulcain/caddy \
    --with github.com/dunglas/mercure/caddy@v1.0.0

FROM caddy:2

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
