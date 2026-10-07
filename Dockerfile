FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

# Передаем тестовую переменную DATABASE_URL для Prisma на этапе сборки
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Копируем манифесты зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости без запуска скриптов postinstall
RUN pnpm install --frozen-lockfile --ignore-scripts

# Копируем исходный код проекта
COPY . .

# Генерируем типы Prisma, подготавливаем Nuxt и собираем проект
RUN pnpm exec prisma generate
RUN pnpm exec nuxi prepare
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
