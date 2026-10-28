# Руководство по разработке (DNZ Local Development)

Инструкция описывает запуск окружения в режиме гибридной разработки: инфраструктура (PostgreSQL, MinIO, Redis) работает в изолированных Docker-контейнерах, а приложение Nuxt 4 запущен локально на хосте с поддержкой мгновенного hot-reload.

---

## 1. Предварительные требования

- **Node.js** (версии 22+)
- **pnpm** (менеджер пакетов)
- **Docker** и **Docker Compose**

---

## 2. Настройка переменных окружения (`.env`)

Создайте в корне проекта файл `.env` со следующим содержимым для локального подключения:

```env
NUXT_SESSION_PASSWORD=********
DATABASE_URL="postgresql://xxxx:******@postgres:5432/dnz_db?schema=public"

NODE_ENV=production

POSTGRES_USER=xxxxx
POSTGRES_PASSWORD=xxxxx
POSTGRES_DB=dnz_db

REDIS_HOST=redis
REDIS_PORT=6379

# MinIO Config
MINIO_ROOT_USER=xxxxxx
MINIO_ROOT_PASSWORD=xxxxx
NUXT_MINIO_ENDPOINT=minio
NUXT_MINIO_PORT=9000
NUXT_MINIO_USE_SSL=false
NUXT_MINIO_ACCESS_KEY=*******
NUXT_MINIO_SECRET_KEY=******
NUXT_MINIO_BUCKET=dnz-uploads

# SMTP (Mail.ru)
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=****@mail.ru
SMTP_PASSWORD=*********
SMTP_FROM=*******

# Публичный URL приложения
NUXT_PUBLIC_APP_URL=http://localhost:3000

# uCaller Flash-Call Config
UCALLER_SECRET_KEY=6LCt************************
UCALLER_SERVICE_ID=****80

# System Defaults
ADMIN_PHONE="79***"
ADMIN_NAME="Alexandr"
```

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

```

```
