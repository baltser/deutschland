# 🚀 DNZ Platform

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt-UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&labelColor=020420)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&labelColor=020420)](https://www.postgresql.org)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queues-DD3A0A?logo=bullmq&labelColor=020420)](https://bullmq.io)
[![Redis](https://img.shields.io/badge/Redis-Cache%2FStore-DC382D?logo=redis&labelColor=020420)](https://redis.io)
[![MinIO](https://img.shields.io/badge/MinIO-Storage-C72C48?logo=minio&labelColor=020420)](https://min.io)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&labelColor=020420)](https://www.docker.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?logo=githubactions&labelColor=020420)](https://github.com/features/actions)

Современное экосистемное веб-приложение на базе **Nuxt 4** с модульной **доменной архитектурой**. Проект включает безопасную сессионную аутентификацию, Flash-call подтверждение через **uCaller**, асинхронную рассылку email-уведомлений и TTL-управление автопропусками через **BullMQ**, интеграцию с ANPR-камерами, ролевой доступ (`admin`, `installer`, `manager`, `client`) и автоматизированный CI/CD деплой.

---

## 🛠 Технологический стек & Инфраструктура

### **Core Stack**
- **Фронтенд:** Nuxt 4, Vue 3 (Composition API), Tailwind CSS, Nuxt UI.
- **Управление состоянием:** Pinia (разделение по доменам: `auth`, `admin`, `client`, `installer`, `profile`).
- **Аутентификация & Верификация:** `nuxt-auth-utils` + **uCaller.ru** (Flash-call) + Nodemailer.
- **Бэкенд (Nitro Server):** Доменные API-эндпоинты Nuxt (`server/api/`) с плагином автоматического сидирования при старте.
- **Фоновые задачи & Очереди:** **BullMQ** (управление TTL-пропусками в `number.queue.ts` и асинхронная отправка писем с повторами в `email.queue.ts`).
- **Логирование:** **Pino** (структурированные JSON-логи с ротацией в файлы для AUDIT, WARN и ERROR).
- **База данных:** PostgreSQL 16 + Prisma ORM (модели: `users`, `addresses`, `clients_x_addresses`, `devices`, `email_templates`).
- **S3 Хранилище:** MinIO (аватары пользователей, медиафайлы).
- **Кэш, Токены & Очереди:** Redis.

### **DevOps & CI/CD**
- **Контейнеризация:** Docker & Docker Compose (изолированная среда PostgreSQL, MinIO, Redis, App).
- **Automation Pipeline:** GitHub Actions (автоматический linting, typecheck, сборка Docker-образа в GHCR и деплой на VPS через SSH).

---

## 📂 Доменная структура проекта

Проект масштабирован по **Domain-Driven** принципу: каждая бизнес-сущность объединяет свои компоненты, сторы, композисы, типы и API-эндпоинты.

```text
dnz/
├── app/                        # Клиентская часть (Nuxt Client)
│   ├── components/             # UI-компоненты по доменам (admin/, app/, auth/, client/, user/)
│   ├── composables/            # Бизнес-логика и композисы по доменам
│   ├── layouts/                # Доменные макеты (admin, auth, client, installer, profile, default)
│   ├── middleware/             # Глобальный ролевой редирект (role-redirect.global.ts)
│   ├── pages/                  # Файловый роутинг по доменам
│   ├── stores/                 # Доменные Pinia-сторы
│   ├── types/                  # TypeScript-типы клиента
│   └── utils/                  # Форматирование, валидация госномеров и хелперы
│
├── server/                     # Серверная часть (Nitro Engine)
│   ├── api/                    # API-эндпоинты по доменам
│   │   ├── admin/              # Админ API (addresses/, users/, email-templates/, staff, clients)
│   │   ├── auth/               # Авторизация, сессии, верификация почты и сброс паролей
│   │   ├── client/             # Клиентский API (addresses, camera-anpr/batch)
│   │   ├── files/              # Проксирование и выдача файлов из MinIO
│   │   ├── health/             # Мониторинг сервисов (minio.get.ts)
│   │   ├── installer/          # API для монтажников (devices)
│   │   └── profile/            # Управление профилем и загрузка аватара
│   ├── plugins/                # Инициализатор приложения (startup.ts — БД, Redis, MinIO, BullMQ hook)
│   ├── queues/                 # Очереди фоновых задач BullMQ (number.queue.ts, email.queue.ts)
│   ├── services/               # Сервисы логирования (Pino: car-logger, client-logger)
│   ├── types/                  # Server-side TypeScript типы
│   └── utils/                  # Серверные синглтоны (prisma, minio, redis, bullmq, mail, device-api)
│
├── prisma/                     # Схема базы данных (schema.prisma)
├── docs/                       # Подробная техническая документация
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

Создайте файл `.env` в корне проекта. Полный список конфигурационных переменных и их описания доступны в [руководстве по настройке базы данных и сервисов](./docs/database.md).
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
