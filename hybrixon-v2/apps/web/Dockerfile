FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @hybrixon/web... --frozen-lockfile=false
COPY packages/contracts packages/contracts
COPY apps/web apps/web
ARG VITE_API_URL=/v2
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @hybrixon/web build

FROM caddy:2.10-alpine
COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
EXPOSE 80
