# 🗄 Управление состоянием и хранилище (Pinia Stores & MinIO Storage)

В клиентской части приложения (`app/stores/`) для управления глобальными данными, кэшированием и бизнес-логикой используются изолированные сторы **Pinia**. Все они полностью типизированы с помощью TypeScript, взаимодействуют с Nitro API и интегрированы с системой нотификаций (`useToast` из Nuxt UI).

Ниже представлена актуальная архитектура сторов и файлового хранилища S3/MinIO.

---

## 📁 1. Управление файлами и интеграция с MinIO

Для хранения пользовательских аватаров и медиафайлов используется локальное объектное хранилище **MinIO**, совместимое с S3 API.

### Архитектура хранилища

* **Бакет по умолчанию:** `dnz-uploads`
* **Структура путей:** Файлы сохраняются в директорию `avatars/` с уникальными именами для предотвращения коллизий.

### Интеграция в коде

* **Инициализация:** Настройка S3/MinIO клиента находится в `server/utils/minio.ts`.
* **Загрузка:** Функция `uploadFileToMinio()` принимает бинарный буфер, тип файла и папку, возвращая относительный путь для сохранения в базе данных (`avatar_path`).
* **Раздача файлов:** Эндпоинты бэкенда отдают файлы через безопасный проксирующий слой.

---

## 🗄 2. Доменные Pinia-сторы

### 1. `useAuthLoginStore` (`auth/login.ts`)

Управление процессом авторизации пользователей.

* **Состояние (`state`):** `isLoading` (флаг загрузки), `errorMessage` (текст ошибки).


* **Действия (`actions`):**
* `login(credentials)`: Выполняет POST-запрос на `/api/auth/login`, обновляет глобальную сессию, сбрасывает данные профиля и осуществляет ролевую маршрутизацию (`/admin`, `/installer`, `/client` или `/profile`).





### 2. `useAuthRegisterStore` (`auth/register.ts`)

Управление двухшаговым процессом регистрации через uCaller.

* **Состояние (`state`):** `step` (`'input'` / `'verify'`), `phone`, `password`, `isLoading`, `errorMessage`.


* **Действия (`actions`):**
* `sendCode()`: Запрос на инициализацию звонка (`/api/auth/register/init`) и переход к шагу верификации.


* `verifyCode(code)`: Отправка 4 цифр кода подтверждения (`/api/auth/register/verify`) и авторизация пользователя.





### 3. `useAuthSessionStore` (`auth/session.ts`)

Управление глобальной сессией текущего пользователя.

* **Состояние (`state`):** `user` (объект сессии или `null`), `isLoaded` (флаг инициализации).


* **Вычисляемые свойства (`getters`):** `isAuthenticated`, `roleName`, `isAdmin`, `isInstaller`, `isClient`.


* **Действия (`actions`):** `initSession()` (получение данных с `/api/auth/session`), `logout()`.



### 4. `useAdminAddressesStore` (`admin/addresses.ts`)

Управление физическими адресами и объектами недвижимости в панели администратора.

* **Состояние (`state`):** `addresses`, `currentAddress`, `loading`, `error`.


* **Действия (`actions`):**
* `fetchAddresses()`: Загрузка списка всех адресов (`GET /api/admin/addresses`).


* `createAddress(addressText)`: Добавление нового объекта (`POST /api/admin/addresses`).


* `fetchAddressById(id)`: Загрузка детальной информации по адресу и связанному оборудованию.


* `addClientToAddress(addressId, payload)`: Привязка клиента к объекту.





### 5. `useEmailTemplatesStore` (`admin/emailTemplates.ts`)

Управление системными шаблонами почтовых уведомлений.

* **Состояние (`state`):** `templates`, `selectedSlug`, `isLoading`, `isSaving`, `form` (реактивный объект с полями `title`, `subject`, `body_html`).


* **Действия (`actions`):** `fetchTemplates()`, `selectTemplate(slug)`, `saveTemplate()` (обновление через `PUT /api/admin/email-templates/[slug]`).



### 6. `useAdminUsersStore` (`admin/staff.ts` & `admin/users.ts`)

Управление персоналом и клиентами в административной панели.

* **Состояние (`state`):** Списки сотрудников (`staffList`) и клиентов (`clientsList`), флаги загрузки и ошибки.


* **Действия (`actions`):**
* `fetchUsers()` / `refreshAll()`: Получение актуальных данных с эндпоинтов `/api/admin/staff` и `/api/admin/clients`.


* `createStaff(payload)`: Предзапись нового сотрудника в систему.


* `updateUser(userId, payload)`: Частичное обновление данных пользователя, ролей и загрузка аватаров через multipart-форму.





### 7. `useInstallerDevicesStore` (`installer/devices.ts`)

Управление оборудованием для монтажников.

* **Состояние & Действия:** Использует `useLazyFetch` для получения списка адресов и доступных устройств с эндпоинта `/api/installer/devices`.



### 8. `useProfileStore` (`profile/index.ts`)

Управление личным профилем пользователя.

* **Состояние (`state`):** `profile` (данные профиля), `isLoading`, `errorMessage`.


* **Действия (`actions`):** `fetchProfile(force)`, `updateProfile(payload)` (обновление через `PATCH /api/profile/`), `clearStore()`.



### 9. `useAuthMailStore` (`auth/mail.ts`)

Управление повторной отправкой писем для верификации электронной почты (`POST /api/auth/mail/verify`) с выводом нотификаций через `useToast`.
