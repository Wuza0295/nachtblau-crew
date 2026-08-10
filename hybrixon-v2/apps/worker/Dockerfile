FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --filter @hybrixon/media-worker... --frozen-lockfile=false
COPY apps/worker apps/worker
RUN pnpm --filter @hybrixon/media-worker build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
COPY --from=build /app /app
USER node
CMD ["pnpm", "--filter", "@hybrixon/media-worker", "start"]
