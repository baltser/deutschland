# 🚀 DNZ Platform

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt-UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&labelColor=020420)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&labelColor=020420)](https://www.postgresql.org)
[![MinIO](https://img.shields.io/badge/MinIO-Storage-C72C48?logo=minio&labelColor=020420)](https://min.io)
[![Redis](https://img.shields.io/badge/Redis-Cache%2FStore-DC382D?logo=redis&labelColor=020420)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&labelColor=020420)](https://www.docker.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?logo=githubactions&labelColor=020420)](https://github.com/features/actions)

Современное экосистемное веб-приложение на базе **Nuxt 4** с модульной **доменной архитектурой**. Проект включает безопасную сессионную аутентификацию, Flash-call подтверждение через **uCaller**, гибкую ролевую модель (`admin`, `installer`, `manager`, `client`), управление объектами/устройствами, интеграцию с MinIO и автоматизированный CI/CD деплой.

---

## 🛠 Технологический стек & Инфраструктура

### **Core Stack**
- **Фронтенд:** Nuxt 4, Vue 3 (Composition API), Tailwind CSS, Nuxt UI.
- **Управление состоянием:** Pinia (разделение по доменам: `auth`, `admin`, `client`, `installer`, `profile`).
- **Аутентификация & Верификация:** `nuxt-auth-utils` + **uCaller.ru** (Flash-call) + Nodemailer (Email verification).
- **Бэкенд (Nitro Server):** Доменные API-эндпоинты Nuxt (`server/api/`) с плагином автоматического сидирования при старте.
- **База данных:** PostgreSQL 16 + Prisma ORM (модели: `users`, `addresses`, `clients_x_addresses`, `devices`, `email_templates`).
- **S3 Хранилище:** MinIO (аватары пользователей, медиафайлы).
- **Кэш & Токены:** Redis.

### **DevOps & CI/CD**
- **Контейнеризация:** Docker & Docker Compose (изолированная среда PostgreSQL, MinIO, Redis, App).
- **Automation Pipeline:** GitHub Actions (автоматический linting, typecheck, сборка Docker-образа в GHCR и деплой на VPS через SSH).

---

## 📂 Доменная структура проекта

Проект масштабирован по **Domain-Driven** принципу: каждая бизнес-сущность объединяет свои компоненты, сторы, композисы, типы и API-эндпоинты.

```text
deutschland/
├── app/                        # Клиентская часть (Nuxt Client)
│   ├── components/             # UI-компоненты по доменам
│   │   ├── admin/              # Компоненты админ-панели (addresses/, users/)
│   │   ├── app/                # Общие системные элементы (Header, Sidebar, Inputs)
│   │   ├── auth/               # Авторизация (Card, AvatarUpload)
│   │   ├── client/             # Домен клиентов (address/)
│   │   └── user/               # Домен пользователя (UserAvatar, ProfileBadge)
│   ├── composables/            # Бизнес-логика и композисы по доменам
│   │   ├── admin/              # Логика администратора (address/, user/, system/)
│   │   ├── auth/               # Формы аутентификации
│   │   ├── installer/          # Логика инсталлятора / монтажника
│   │   └── profile/            # Управление профилем
│   ├── layouts/                # Доменные макеты (admin, auth, client, installer, profile, default)
│   ├── middleware/             # Глобальный ролевой редирект (role-redirect.global.ts)
│   ├── pages/                  # Файловый роутинг по доменам
│   │   ├── admin/              # Панель управления (addresses/, users/, system/)
│   │   ├── auth/               # Страницы входа и регистрации (login, register)
│   │   ├── client/             # Личный кабинет клиента
│   │   ├── installer/          # Кабинет монтажника / инсталлятора
│   │   └── profile/            # Профиль пользователя
│   ├── stores/                 # Доменные Pinia-сторы (admin, auth, client, installer, profile)
│   ├── types/                  # TypeScript-типы клиента (admin, address, device, user, auth)
│   └── utils/                  # Форматирование и хелперы (phone, roles, logout)
│
├── server/                     # Серверная часть (Nitro Engine)
│   ├── api/                    # API-эндпоинты по доменам
│   │   ├── admin/              # Админ API (addresses/, users/, email-templates/, staff, clients)
│   │   ├── auth/               # Авторизация, сессии, верификация почты и сброс паролей
│   │   ├── client/             # Клиентский API (addresses)
│   │   ├── files/              # Проксирование и выдача файлов из MinIO
│   │   ├── health/             # Мониторинг сервисов (minio.get.ts)
│   │   ├── installer/          # API для монтажников (devices)
│   │   └── profile/            # Управление профилем и загрузка аватара
│   ├── plugins/                # Инициализатор приложения (startup.ts — проверка БД, Redis, MinIO, seed admin)
│   ├── types/                  # Server-side TypeScript типы
│   └── utils/                  # Серверные синглтоны (prisma, minio, redis, logger, mail, phone, adminUser)
│
├── prisma/                     # Схема базы данных (schema.prisma)
├── docs/                       # Техническая документация
└── docker-compose.yml          # Инфраструктурные сервисы
```
## ⚙️ Быстрый старт (Локальная разработка)
### 1. Клонирование и установка зависимостей
```Bash
git clone <url-репозитория>
cd deutschland
pnpm install
```
### 2. Настройка окружения (.env)

Создайте файл .env в корне проекта на основе примеров:
Code-Snippet
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
### 3. Запуск инфраструктуры в Docker
```Bash
docker compose up -d postgres minio redis
```
### 4. Синхронизация схемы базы данных
```Bash
npx prisma db push
npx prisma generate
```
### 5. Запуск сервера разработки
```Bash
pnpm dev
```
Приложение откроется по адресу: http://localhost:3000
### 🚀 CI/CD и Деплой (Production)

Проект полностью автоматизирован с помощью GitHub Actions (.github/workflows/ci-cd.yml):
```
    Lint & Typecheck: Автоматическая проверка кода при каждом push в ветку master или main.

    Docker Build: Сборка оптимизированного Docker-образа на серверах GitHub (что исключает OOM-ошибки памяти на целевом VPS) и публикация в GitHub Container Registry (GHCR).

    Automated SSH Deploy: Автоматическое подключение к VPS, обновление образа (docker compose pull), применение структуры БД (prisma db push) и перезапуск контейнеров с помощью docker compose up -d.
```
### 📖 Техническая документация

Подробные руководства по каждому модулю находятся в директории docs/:
* [**`docs/architecture.md`**](./docs/architecture.md) — Архитектура доменов, работа макетов, мидлваров и ролевой модели.
* [**`docs/api-endpoints.md`**](./docs/api-endpoints.md) — Спецификация API (авторизация через uCaller, профиль, клиенты, адреса, инсталляторы, файлы).
* [**`docs/database.md`**](./docs/database.md) — Подробное описание моделей Prisma (`users`, `addresses`, `devices`, `clients_x_addresses`, `email_templates`).
* [**`docs/development.md`**](./docs/development.md) — Гайд по написанию доменного кода, композисов и сторов.
* [**`docs/deployment.md`**](./docs/deployment.md) — Настройка VPS, Docker Compose, Nginx Reverse Proxy и SSL.
* [**`docs/auth-flow.md`**](./docs/auth-flow.md) — Пошаговый сценарий Flash-call авторизации (uCaller) и верификации почты.
* [**`docs/storage.md`**](./docs/storage.md) — Интеграция с MinIO S3 (загрузка, выдача и проксирование файлов/аватаров).
