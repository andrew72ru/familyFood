FROM caddy:2-builder AS builder

RUN xcaddy build \
    --with github.com/dunglas/vulcain/caddy

FROM caddy:2

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
