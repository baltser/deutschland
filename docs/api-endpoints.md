# Контракты API (DNZ API Reference)

Все серверные эндпоинты реализованы на базе Nitro в директории `server/api/`. Большинство эндпоинтов защищены сессионной аутентификацией (`nuxt-auth-utils`).

---

## 1. Авторизация и верификация (`/api/auth/`)

### `POST /api/auth/send-code`
Инициализация звонка подтверждения номера телефона через сервис **uCaller**.
* **Content-Type:** `application/json`
* **Body (JSON):**
```json
  {
    "phone": "79112223344",
    "password": "securepassword",
    "email": "user@example.com"
  }
```
Response: 200 OK

```json
  {
  "success": true,
  "message": "Звонок отправлен",
  "ucallerId": "..."
  }
```


## 2. Пользователи и файлы (/api/users/, /api/files/)
  `` POST /api/users/[id]/avatar``

Загрузка или обновление аватара конкретного пользователя.

    Auth: Требуется авторизованная сессия.

    Content-Type: multipart/form-data

    Body (FormData):

        avatar (File, required) — Файл изображения.

    Response:

   ``` JSON

    {
      "success": true,
      "avatarUrl": "/api/files/avatars/user_123_1728421000.jpg"
    }
  ```

``GET /api/files/[...path]``

Получение (проксирование) файла из закрытого бакета MinIO.

    Params: Путь к объекту в хранилище (например, avatars/image.jpg).

    Response: Бинарный файл изображения с правильным Content-Type.

## 3. Административная панель (/api/admin/)
   `` GET /api/admin/users``

Получение списка всех пользователей системы.

    Auth: Требуются права администратора (ruleName === 'admin').

    Response: Массив объектов пользователей (без передачи паролей).

``PATCH /api/admin/users/[id]``

Обновление данных пользователя администратором (роль, аватар).

    Auth: Права администратора.

Body (JSON):
```json
{
"ruleName": "admin",
"avatar": "avatars/user_123.jpg"
}
```
Response: 
```json
{ 
  "success": true, 
  "user": "..." 
}
```
