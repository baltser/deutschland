
# 🌐 Спецификация API (DNZ API Reference)

Все серверные эндпоинты реализованы на базе **Nitro Engine** в директории `server/api/`. Большинство защищенных эндпоинтов используют сессионную аутентификацию через модуль **`nuxt-auth-utils`**.

---

## 1. Авторизация и сессии (`/api/auth/`)

### `POST /api/auth/login`

Авторизация пользователя в системе по номеру телефона и паролю.

* **Content-Type:** `application/json`
* **Body (JSON):**
```json
{
  "phone": "79112223344",
  "password": "securepassword"
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "role_name": "admin",
    "user_name": "Anton Balzer",
    "avatar_path": null
  }
}

```



### `POST /api/auth/logout`

Завершение сеанса и очистка кук авторизации.

* **Response (200 OK):**
```json
{
  "success": true
}

```



### `GET /api/auth/session`

Получение данных текущей активной сессии авторизованного пользователя.

* **Response (200 OK):**
```json
{
  "user": {
    "user_id": 1,
    "user_name": "Anton Balzer",
    "role_name": "admin",
    "avatar_path": null
  }
}

```



### `POST /api/auth/register/init`

Инициализация регистрации нового пользователя с проверкой предзаписанного администратором номера и вызовом Flash-call верификации через **uCaller**.

* **Content-Type:** `application/json`
* **Body (JSON):**
```json
{
  "phone": "79112223344",
  "password": "securepassword6"
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Звонок отправлен",
  "ucallerId": "..."
}

```



---

## 2. Административная панель (`/api/admin/`)

Все эндпоинты этой группы требуют наличия активной сессии с правами администратора (`session.user.role_name === 'admin'`).

### `GET /api/admin/staff`

Получение списка сотрудников системы (все учетные записи, кроме клиентов).

* **Auth:** Требуется роль `admin`.


* **Response (200 OK):**
```json
{
  "success": true,
  "users": [
    {
      "user_id": 2,
      "user_name": "Монтажник Петр",
      "email": "installer@example.com",
      "phone": "79156986390",
      "avatar_path": null,
      "activated_at": "2026-10-27T...",
      "role_name": "installer"
    }
  ]
}

```



### `GET /api/admin/clients`

Получение списка всех клиентов системы с привязанными объектами (`addresses`).

* **Auth:** Требуется роль `admin`.


* **Response (200 OK):**
```json
{
  "success": true,
  "clients": [
    {
      "user_id": 5,
      "user_name": "Клиент",
      "email": null,
      "phone": "79109409286",
      "avatar_path": null,
      "activated_at": null,
      "role_name": "client",
      "addresses": []
    }
  ]
}

```



---

## 3. Управление объектами и адресами (`/api/admin/addresses/`)

### `GET /api/admin/addresses`

Получение полного списка физических адресов обслуживания со списком привязанных жильцов.

* **Response (200 OK):**
```json
{
  "addresses": [
    {
      "address_id": 1,
      "address_name": "Hauptstraße 10, Oberursel",
      "clients": []
    }
  ]
}

```



### `POST /api/admin/addresses`

Создание нового физического адреса в системе.

* **Body (JSON):**
```json
{
  "address_name": "Taunusstraße 15, Bad Homburg"
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "address": {
    "address_id": 2,
    "address_name": "Taunusstraße 15, Bad Homburg"
  }
}

```



### `GET /api/admin/addresses/[id]`

Получение детальной информации по конкретному адресу, включая связанных клиентов и установленное оборудование (`devices`).

* **Response (200 OK):**
```json
{
  "success": true,
  "address": {
    "address_id": 1,
    "address_name": "Hauptstraße 10, Oberursel",
    "clients": [],
    "devices": []
  }
}

```



### `POST /api/admin/addresses/[id]/clients`

Привязка существующего или автоматическое создание нового пользователя-клиента к конкретному объекту по номеру телефона.

* **Body (JSON):**
```json
{
  "phone": "79109409286",
  "user_name": "Иван"
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": 5,
    "phone": "79109409286",
    "user_name": "Иван",
    "role_name": "client"
  }
}

```



### `POST /api/admin/addresses/[id]/devices`

Добавление нового оборудования (камеры или вызывной панели) к указанному адресу.

* **Body (JSON):**
```json
{
  "device_name": "Камера подъезда №1",
  "device_type": "CAMERA",
  "ip": "192.168.1.50",
  "port": 80,
  "login": "admin",
  "password": "password123"
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "device": {
    "device_id": 1,
    "device_name": "Камера подъезда №1",
    "device_type": "CAMERA",
    "ip": "192.168.1.50",
    "port": 80,
    "address_id": 1
  }
}

```



---

## 4. Кабинет клиента (`/api/client/`)

### `GET /api/client/addresses`

Получение списка адресов и доступных устройств (камер) для текущего авторизованного пользователя с ролью `client`.

* **Auth:** Требуется активная сессия клиента.
* **Response (200 OK):** Возвращает массив привязанных к клиенту объектов недвижимости с отфильтрованным списком разрешенного оборудования.
