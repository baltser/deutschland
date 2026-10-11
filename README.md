# 🚀 DNZ Platform

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt-UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&labelColor=020420)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&labelColor=020420)](https://www.postgresql.org)
[![MinIO](https://img.shields.io/badge/MinIO-Storage-C72C48?logo=minio&labelColor=020420)](https://min.io)

Современное веб-приложение на базе **Nuxt 4**, включающее в себя безопасную систему аутентификации, управление пользователями, загрузку файлов в объектное хранилище MinIO и административную панель.

---

## 🛠 Технологический стек

* **Фронтенд:** Nuxt 4, Vue 3 (Composition API), Tailwind CSS, Nuxt UI.
* **Управление состоянием:** Pinia (`app/stores/`).
* **Аутентификация:** `nuxt-auth-utils` (сессионная авторизация).
* **Бэкенд (Nitro Server):** Встроенные API-эндпоинты Nuxt (`server/api/`).
* **База данных:** PostgreSQL + Prisma ORM.
* **Хранилище медиафайлов:** MinIO (изображения, аватары, документы).

---

## 📂 Структура проекта

Проект разделен на клиентскую (`app/`) и серверную (`server/`) части:

```text
deutschland/
├── app/                  # Клиентская часть (Nuxt)
│   ├── components/       # UI-компоненты (admin/, auth/, user/, app/)
│   ├── composables/      # Бизнес-логика и композисы (useAuth.ts)
│   ├── stores/           # Состояние Pinia (adminUsers.ts)
│   ├── pages/            # Файловый роутинг (auth/, admin/, profile/)
│   └── layouts/          # Макеты страниц (default.vue, auth.vue)
├── server/               # Серверная часть (Nitro API)
│   ├── api/              # Эндпоинты (auth/, users/, admin/, files/)
│   └── utils/            # Системные синглтоны (prisma.ts, minio.ts)
├── prisma/               # Схема базы данных и миграции
├── docs/                 # Техническая документация для разработчиков
└── docker-compose.yml    # Инфраструктура (PostgreSQL, MinIO)
```
## ⚙️ Быстрый старт (Локальная разработка)

Инфраструктура (база данных и файловое хранилище) запускается через Docker, а само приложение Nuxt — локально на хосте с поддержкой Hot-Reload.
1. Клонирование репозитория и установка зависимостей
```Bash

git clone <url-репозитория>
cd deutschland
pnpm install
```
2. Настройка окружения

Создайте файл .env в корне проекта на основе следующего примера:
```Code-Snippet

NUXT_SESSION_PASSWORD=random_secure_32_character_string_here
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
3. Запуск инфраструктуры (Docker)

``docker compose up -d postgres minio``

4. Инициализация базы данных Prisma
```Bash 
npx prisma db push
npx prisma generate
```
5. Запуск сервера разработки
```Bash

pnpm dev
```
Приложение будет доступно по адресу http://localhost:3000.

---
## 📖 Техническая документация

Подробная документация по архитектуре, контрактам API и базе данных находится в директории docs/:

    architecture.md — Общая архитектура и паттерны проекта.

    api-endpoints.md — Описание серверных API-эндпоинтов.

    database.md — Схема базы данных и модели Prisma.

    development.md — Руководство по развертыванию.

🛠 Полезные команды

    pnpm lint — Проверка кода линтером (ESLint).

    pnpm run typecheck — Проверка типов TypeScript.

    pnpm build — Сборка приложения для продакшна.


---
