FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @hybrixon/api... --frozen-lockfile=false
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @hybrixon/api build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
USER node
EXPOSE 8080
CMD ["pnpm", "--filter", "@hybrixon/api", "start"]
