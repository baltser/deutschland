# Руководство по разработке (DNZ Local Development)

Инструкция описывает запуск окружения в режиме гибридной разработки: инфраструктура (PostgreSQL, MinIO, Redis) работает в изолированных Docker-контейнерах, а приложение Nuxt 4 запущен локально на хосте с поддержкой мгновенного hot-reload.

---

## 1. Предварительные требования

- **Node.js** (версии 22+)
- **pnpm** (менеджер пакетов)
- **Docker** и **Docker Compose**

---

## 2. Настройка переменных окружения (`.env`)

Создайте файл `.env` в корне проекта на основе шаблона [`.env.example`](../.env.example):

```bash
cp .env.example .env
```
💡 Особенность локального запуска: Так как приложение Nuxt запускается напрямую на хосте (а не внутри Docker-сети), замените хосты инфраструктуры на localhost:

        DATABASE_URL → @localhost:5432/...

        REDIS_HOST → localhost

        NUXT_MINIO_ENDPOINT → localhost

---

## 3. Запуск проекта по шагам

1. **Запуск инфраструктурных сервисов (БД, MinIO и Redis) в фоне:**
```bash
docker compose up -d postgres minio redis

```


2. **Установка зависимостей:**
```bash
pnpm install

```


3. **Синхронизация структуры базы данных и генерация Prisma Client:**
```bash
npx prisma db push
npx prisma generate

```


4. **Запуск Nuxt в режиме разработчика:**
```bash
pnpm dev

```
Приложение будет доступно по адресу: **http://localhost:3000**

