# 🚀 Инструкция по деплою и CI/CD (`docs/deployment.md`)

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&labelColor=020420)](https://www.docker.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?logo=githubactions&labelColor=020420)](https://github.com/features/actions)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&labelColor=020420)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-Cache%2FStore-DC382D?logo=redis&labelColor=020420)](https://redis.io)

Проект полностью контейнеризирован с использованием **Docker** и **Docker Compose**, а процесс сборки, линтинга, проверки типов и автоматического деплоя на производственный VPS устроен через **GitHub Actions**.

---

## 1. Автоматический CI/CD пайплайн (GitHub Actions)

Рабочий процесс описан в файле `.github/workflows/ci-cd.yml` и запускается при каждом пуше в целевую ветку (`main` / `master`):

1. **Lint & Typecheck Pipeline:**
  - Автоматическая проверка кода линтером (`npm run lint`).
  - Строгий контроль типов без `any` через Nuxt/TypeScript (`npx nuxi typecheck`).
2. **Build & Push Docker Image:**
  - Сборка оптимизированного Docker-образа в изолированной среде GitHub через Docker Buildx.
  - Публикация сборки в реестре контейнеров GitHub Container Registry (`ghcr.io`).
3. **Automated SSH Deploy:**
  - Безопасное подключение к VPS по SSH.
  - Загрузка обновленного образа (`docker compose pull`).
  - Синхронизация структуры БД через Prisma (`prisma db push`).
  - Перезапуск приложения и фоновых воркеров (`docker compose up -d`).

---

## 2. Переменные окружения (`.env`)

Для развертывания на сервере скопируйте шаблон [`.env.example`](../.env.example) в файл `.env` в корне рабочей директории и заполните боевыми данными:

```bash
cp .env.example .env
````
## 3. Архитектура контейнеров (docker-compose.yml)

На сервере разворачивается единый стек изолированных контейнеров:

    postgres: PostgreSQL 16 с автоматической проверкой состояния (healthcheck).

    redis: Кэширование, хранение сессий, поддержка работы фоновых воркеров и очередей BullMQ (number.queue.ts, email.queue.ts).

    minio: S3-совместимое хранилище файлов и аватаров.

    app: Основное приложение Nuxt 4 (включая Nitro engine, BullMQ workers и API взаимодействия с ANPR-устройствами).

 ### Ручное управление деплоем на VPS:

Если требуется обновить сервер вручную без использования GitHub Actions:
``` Bash

# 1. Подтянуть изменения репозитория
git pull origin main

# 2. Обновить Docker-образы
docker compose pull

# 3. Перезапустить сервисы в фоновом режиме
docker compose up -d --remove-orphans

# 4. Проверить статус контейнеров и логи
docker compose ps
docker compose logs -f app
```
## 4. Конфигурация Nginx и SSL (Let's Encrypt)

Для проксирования веб-трафика и обеспечения защищенного HTTPS-соединения настройте конфигурационный файл Nginx:
```Nginx
server {
    listen 80;
    server_name ваш-домен.de;

    location / {
        proxy_pass [http://127.0.0.1:3000](http://127.0.0.1:3000);
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
} 
```
Выпуск и автоматическое продление SSL-сертификата:
Bash

    sudo certbot --nginx -d ваш-домен.de
