# Wishlist demo API (infra phase). Zero runtime dependencies — Node runs the
# TypeScript directly via type stripping (Node >= 23.6), so there is no build step
# and no node_modules to install.
FROM node:24-alpine

WORKDIR /app

# Only source is needed (no deps). package.json first for layer caching.
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Least-privilege: drop to the built-in non-root user.
USER node

# Liveness probe hits the /healthz route.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["node", "src/main.ts"]
