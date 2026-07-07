FROM node:22-bookworm-slim AS base
WORKDIR /app
# better-sqlite3 needs a C++ toolchain to build its native binding at install time.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN mkdir -p public && npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/package.json ./package.json
COPY scripts ./scripts
COPY src/lib ./src/lib
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN mkdir -p data && chmod +x docker/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
