
# Руководство по разработке (DNZ Local Development)

Инструкция описывает запуск окружения в режиме гибридной разработки: инфраструктура (PostgreSQL, MinIO) работает в изолированных Docker-контейнерах, а приложение Nuxt 4 запущен локально на хосте с поддержкой мгновенного hot-reload.

---

## 1. Предварительные требования
* Node.js (версии 20+)
* pnpm (менеджер пакетов)
* Docker и Docker Compose

---

## 2. Настройка переменных окружения (`.env`)

Создайте в корне проекта файл `.env` со следующим содержимым для локального подключения:

```env
NUXT_SESSION_PASSWORD=4fe6c66c8ae64d************
DATABASE_URL="postgresql://dnz_user:dnz_password@localhost:5432/dnz_db?schema=public"

NODE_ENV=development

POSTGRES_USER=dnz_user
POSTGRES_PASSWORD=dnz_password
POSTGRES_DB=dnz_db

# MinIO Config
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password12345

NUXT_MINIO_ENDPOINT=localhost
NUXT_MINIO_PORT=9000
NUXT_MINIO_USE_SSL=false
NUXT_MINIO_ACCESS_KEY=admin
NUXT_MINIO_SECRET_KEY=password12345
NUXT_MINIO_BUCKET=dnz-uploads
```
## 3. Запуск проекта по шагам

Запуск инфраструктурных сервисов (БД и MinIO) в фоне:

```Bash
docker compose up -d postgres minio
```
Установка зависимостей:
```Bash
pnpm install
```

Синхронизация структуры базы данных:
```Bash
npx prisma db push
npx prisma generate
```
Запуск Nuxt в режиме разработчика:
```Bash

pnpm dev
```
