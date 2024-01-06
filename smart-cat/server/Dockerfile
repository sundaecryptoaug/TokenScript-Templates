FROM node:18-alpine AS builder

COPY . /usr/src/app/
RUN --mount=type=cache,target=/root/.npm \
    apk add --no-cache python3 g++ make && \
    cd /usr/src/app/ && \
    npm ci -d --foreground-scripts && \
    npm run build

FROM node:18-alpine
LABEL org.opencontainers.image.authors="Feng Yu<abcfy2@163.com>"

COPY --from=0 /usr/src/app/dist/ /usr/src/app/
RUN apk add --no-cache tini su-exec
ENV FASTIFY_PORT=3006
ENV FASTIFY_ADDRESS=0.0.0.0
EXPOSE ${FASTIFY_PORT}

RUN adduser -s /bin/false -S -D -H app

WORKDIR /usr/src/app/
ENTRYPOINT ["/sbin/tini", "-g", "--"]
CMD ["su-exec", "app", "node", "/usr/src/app/index.js"]
