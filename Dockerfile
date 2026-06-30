# syntax=docker/dockerfile:1
# Multi-stage build for the AdonisJS 6 + Inertia/React + Prisma app.
#   build/bin/server.js is the production entrypoint (from `node ace build`).
#   Prisma's generated client + schema/migrations are carried into the runtime
#   image so `prisma migrate deploy` works as the Fly release_command.

ARG NODE_VERSION=24-slim

# ---- Base: shared OS deps (OpenSSL for Prisma, dumb-init for clean signals) ----
FROM node:${NODE_VERSION} AS base
ENV NODE_ENV=production
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: full install (incl. dev) + generate the Prisma client ----
FROM base AS deps
# Placeholder env so `node ace build`'s env validation passes at build time.
# These are NOT used at runtime — Fly injects the real values (and secrets).
ENV APP_KEY=build_time_placeholder_key_not_used_at_runtime \
    APP_URL=http://localhost:3333 \
    HOST=0.0.0.0 \
    PORT=3333 \
    LOG_LEVEL=info \
    SESSION_DRIVER=cookie
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY prisma ./prisma
RUN npx prisma generate

# ---- build: compile TS + Vite, then assemble a pruned production tree ----
FROM deps AS build
COPY . .
RUN node ace build
# Production-only dependencies for the compiled app, plus the Prisma CLI
# (a devDependency) so the Fly release_command can run migrations.
RUN cd build \
 && npm ci --omit=dev \
 && npm install --no-save prisma@6
# Carry the generated client and the schema/migrations into the build output.
RUN cp -R node_modules/.prisma build/node_modules/.prisma \
 && cp -R prisma build/prisma

# ---- runtime: minimal image that runs the compiled app as a non-root user ----
FROM base AS runtime
# Operational (non-secret) defaults; Fly env can override. APP_KEY, APP_URL,
# and DATABASE_URL come from Fly env/secrets at runtime.
ENV HOST=0.0.0.0 \
    PORT=3333 \
    LOG_LEVEL=info \
    SESSION_DRIVER=cookie
COPY --from=build --chown=node:node /app/build /app
USER node
EXPOSE 3333
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "bin/server.js"]
