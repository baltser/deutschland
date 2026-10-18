
# 🚀 DNZ Platform

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt-UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&labelColor=020420)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&labelColor=020420)](https://www.postgresql.org)
[![MinIO](https://img.shields.io/badge/MinIO-Storage-C72C48?logo=minio&labelColor=020420)](https://min.io)
[![Redis](https://img.shields.io/badge/Redis-Cache%2FStore-DC382D?logo=redis&labelColor=020420)](https://redis.io)

Современное веб-приложение на базе **Nuxt 4**, включающее безопасную систему сессионной аутентификации, подтверждение телефонов через **uCaller**, управление ролями, связями пользователей с объектами/адресами, загрузку файлов в MinIO и административную панель.

---

## 🛠 Технологический стек

* **Фронтенд:** Nuxt 4, Vue 3 (Composition API), Tailwind CSS, Nuxt UI.
* **Управление состоянием:** Pinia (`app/stores/`).
* **Аутентификация & Верификация:** `nuxt-auth-utils` + **uCaller.ru** (Flash-call авторизация).
* **Бэкенд (Nitro Server):** Встроенные API-эндпоинты Nuxt (`server/api/`) с автоматическим сидированием при старте.
* **База данных:** PostgreSQL + Prisma ORM (модели: `users`, `roles`, `addresses`, `clients_x_addresses`, `email_templates`).
* **Хранилище медиафайлов:** MinIO (аватары, документы).
* **Кэш / Токены:** Redis.

---

## 📂 Структура проекта

```text
deutschland/
├── app/                  # Клиентская часть (Nuxt)
│   ├── components/       # UI-компоненты (admin/, auth/, user/, app/)
│   ├── composables/      # Бизнес-логика и композисы
│   ├── stores/           # Состояние Pinia
│   ├── pages/            # Файловый роутинг (auth/, admin/, profile/)
│   └── layouts/          # Макеты страниц (default.vue, auth.vue)
├── server/               # Серверная часть (Nitro API)
│   ├── api/              # Эндпоинты (auth/, users/, admin/, files/)
│   ├── plugins/          # Стартовые плагины инициализации (startup.ts)
│   └── utils/            # Системные синглтоны и хелперы (prisma, minio, redis, roles, adminUser)
├── prisma/               # Схема базы данных и миграции
├── docs/                 # Техническая документация для разработчиков
└── docker-compose.yml    # Инфраструктура (PostgreSQL, MinIO, Redis)
```
## ⚙️ Быстрый старт (Локальная разработка)

Клонирование репозитория и установка зависимостей:
  ```Bash
git clone <url-репозитория>
cd deutschland
pnpm install
```
Настройка окружения (.env):
Создайте файл .env в корне проекта, указав доступы к БД, MinIO, Redis и ключи uCaller:
```Code-Snippet
NUXT_SESSION_PASSWORD=random_secure_32_character_string_here
DATABASE_URL="postgresql://dnz_user:dnz_password@localhost:5432/dnz_db?schema=public"

NODE_ENV=development

POSTGRES_USER=dnz_user
POSTGRES_PASSWORD=dnz_password
POSTGRES_DB=dnz_db

# uCaller Config
UCALLER_SECRET_KEY=your_ucaller_secret_key
UCALLER_SERVICE_ID=your_ucaller_service_id

# Default Admin Credentials
ADMIN_PHONE="+49000000000"
ADMIN_NAME="System Administrator"

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
Запуск инфраструктуры (Docker):
```Bash
docker compose up -d postgres minio redis
```
Инициализация базы данных Prisma:
```Bash
npx prisma db push
npx prisma generate
```
Запуск сервера разработки:
```Bash
pnpm dev
```
  Приложение будет доступно по адресу http://localhost:3000.

## 📖 Техническая документация

Подробная документация находится в директории docs/:

    docs/architecture.md — Архитектура проекта и структура слоев.

    docs/api-endpoints.md — Спецификация API (auth с uCaller, users, admin, files).

    docs/database.md — Схема БД (модели users, roles, addresses, clients_x_addresses, email_templates).

    docs/development.md — Инструкция для локальной разработки.

    docs/deployment.md — Инструкция по деплою (Docker, Nginx, SSL).

    docs/auth-flow.md — Аутентификация, сессии и flash-call верификация через uCaller.

    docs/storage.md — Управление файлами и интеграция с MinIO.
