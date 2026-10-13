Markdown

# 🚀 Инструкция по развертыванию (Deployment)

Проект полностью контейнеризирован и готов к деплою на любой VPS (Ubuntu / Debian) с использованием Docker и Docker Compose.

## 1. Подготовка сервера
Установите на сервер Docker и Docker Compose:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
```
## 2. Клонирование и конфигурация

Клонируйте репозиторий и создайте .env файл на основе продакшен-шаблона:
```Code-Snippet

NUXT_SESSION_PASSWORD=ваш_надежный_ключ_сессии_минимум_32_символа
NODE_ENV=production

POSTGRES_USER=dnz_user
POSTGRES_PASSWORD=сильный_пароль_бд
POSTGRES_DB=dnz_db

REDIS_HOST=redis
REDIS_PORT=6379

MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=сильный_пароль_minio
NUXT_MINIO_ENDPOINT=minio
NUXT_MINIO_PORT=9000
NUXT_MINIO_USE_SSL=false
NUXT_MINIO_ACCESS_KEY=admin
NUXT_MINIO_SECRET_KEY=сильный_пароль_minio
NUXT_MINIO_BUCKET=dnz-uploads

SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=motokawasaki@mail.ru
SMTP_PASSWORD=ваш_пароль_приложения
SMTP_FROM="Двор на замок <motokawasaki@mail.ru>"

NUXT_PUBLIC_APP_URL=[https://ваш-домен.de](https://ваш-домен.de)
```
## 3. Сборка и запуск контейнеров

Запустите сборку приложения в фоновом режиме:
```Bash
docker compose up -d --build
```
## 4. Применение миграций базы данных

После того как контейнеры поднялись, выполните миграции Prisma внутри контейнера приложения:
```Bash
docker exec -it dnz_app pnpm prisma migrate deploy
```
## 5. Настройка Nginx и SSL (Let's Encrypt)

Для проксирования запросов с порта 3000 на ваш домен по протоколу HTTPS настройте конфигурацию Nginx:
```Nginx
server {
    server_name ваш-домен.ru;

    location / {
        proxy_pass [http://127.0.0.1:3000](http://127.0.0.1:3000);
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Получите SSL сертификат с помощью certbot:
```Bash
sudo certbot --nginx -d ваш-домен.ru
```
