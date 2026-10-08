FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm exec prisma generate
RUN pnpm exec nuxi prepare
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Копируем билд, node_modules и схему Prisma для возможности db push на сервере
COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
