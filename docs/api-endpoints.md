# Контракты API (DNZ API Reference)

Все серверные эндпоинты реализованы на базе Nitro в директории `server/api/`. Большинство эндпоинтов защищены сессионной аутентификацией (`nuxt-auth-utils`).

---

## 1. Авторизация (`/api/auth/`)

### `POST /api/auth/register`
Регистрация нового пользователя с опциональной загрузкой аватара.
* **Content-Type:** `multipart/form-data`
* **Body (FormData):**
  * `name` (string, required) — Имя пользователя
  * `email` (string, required, unique) — Email
  * `password` (string, required) — Пароль (минимум 6 символов)
  * `avatar` (File, optional) — Изображение (JPG, PNG, WEBP, до 2 МБ)
* **Response:** `200 OK` (успешная авторизация и установка сессии).

### `POST /api/auth/login`
Авторизация существующего пользователя.
* **Content-Type:** `application/json`
* **Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "secretpassword"
  }
  ```
    Response: 200 OK.

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
```JSON

{
"ruleName": "admin",
"avatar": "avatars/user_123.jpg"
}
```
Response: { "success": true, "user": { ... } }
