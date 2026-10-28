# 🚀 Инструкция по деплою и CI/CD (`docs/deployment.md`)

Проект полностью контейнеризирован с использованием Docker и Docker Compose, а процесс сборки, тестирования и непрерывной доставки (CI/CD) полностью автоматизирован.

---

## 1. Автоматический CI/CD пайплайн (GitHub Actions)

Проект использует рабочий процесс GitHub Actions (`.github/workflows/ci-cd.yml`) для автоматизации деплоя на VPS:

* **Lint & Typecheck:** При каждом пуше в ветку `master` или `main` код автоматически проверяется на соответствие стандартам линтера и типов TypeScript.


* **Build & Push Docker Image:** Сборка оптимизированного Docker-образа выполняется в изолированной среде GitHub с использованием Buildx и кэширования, после чего образ публикуется в GitHub Container Registry (`ghcr.io`).


* **Deploy to VPS:** Через защищенное SSH-подключение скрипт обновляет репозиторий на сервере, подтягивает свежий образ (`docker compose pull`), поднимает инфраструктурные сервисы, синхронизирует базу данных и перезапускает приложение.



---

## 2. Конфигурация окружения (`.env`)

Для развертывания на сервере создайте файл `.env` в корне рабочей директории со следующими актуальными параметрами:

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

## 3. Архитектура контейнеров (`docker-compose.yml`)

Оркестрация сервисов на сервере включает в себя следующие компоненты:

* **`postgres`:** Реляционная база данных PostgreSQL 16 (с healthcheck-проверкой готовности).


* **`redis`:** Сервер кэширования и временных данных Redis 7.


* **`minio`:** Объектное хранилище S3 для медиафайлов и аватаров.


* **`app`:** Основное веб-приложение Nuxt 4, собираемое через multi-stage `Dockerfile` с автоматической синхронизацией схемы базы данных через Prisma при старте.



### Ручное управление на сервере:

Если потребуется выполнить деплой вручную без GitHub Actions, выполните команды в папке проекта:

```bash
git pull origin master
docker compose pull
docker compose up -d --remove-orphans

```

---

## 4. Настройка Nginx и SSL (Let's Encrypt)

Для проксирования входящих запросов на порт `3000` и настройки безопасного соединения по протоколу HTTPS сконфигурируйте Nginx:

```nginx
server {
    listen 80;
    server_name ваш-домен.de;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

```

Получите бесплатный SSL-сертификат с помощью Certbot:

```bash
sudo certbot --nginx -d ваш-домен.ru

```
