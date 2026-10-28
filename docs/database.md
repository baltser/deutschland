# 🗄 Схема базы данных и Prisma ORM (DNZ Platform)

Проект использует **PostgreSQL** в качестве основной реляционной базы данных и **Prisma ORM** для типобезопасного взаимодействия с ней. Конфигурация схемы и модели данных описаны в файле [`prisma/schema.prisma`](../prisma/schema.prisma).

---

## 1. Перечисления (Enums)

В схеме используются нативные перечисления PostgreSQL для строгой типизации ролей и оборудования:

### `UserRole` (Роли пользователей в системе)
* `admin` — Администратор (полный доступ к управлению персоналом, клиентами, адресами и системой).
* `installer` — Монтажник / инсталлятор (доступ к обслуживанию оборудования и объектов).
* `manager` — Менеджер (управление клиентами и заявками).
* `client` — Клиент (доступ к личным объектам и устройствам).

### `DeviceType` (Типы поддерживаемого оборудования)
* `CAMERA` — IP-видеокамера.
* `PANEL` — Вызывная панель домофона.

---

## 2. Модели данных

### Модель `users` (Пользователи системы)
Основная таблица для хранения всех учетных записей (сотрудники и клиенты).
```prisma
model users {
  user_id           Int       @id @default(autoincrement())
  user_name         String?
  phone             String    @unique
  email             String?   @unique
  password          String?
  role_name         UserRole  // Роль из перечисления UserRole
  avatar_path       String?
  activated_at      DateTime? @default(now()) // Дата создания / активации аккаунта
  email_verified_at DateTime? // Дата подтверждения электронной почты

  addresses clients_x_addresses[]
}
```
### Модель `addresses` (Физические адреса объектов)
Хернит адреса объектов обслуживания, к которым привязаны клиенты и оборудование.
```prisma
model addresses {
  address_id   Int    @id @default(autoincrement())
  address_name String @unique @db.VarChar(255) // Физический адрес объекта

  clients clients_x_addresses[]
  devices devices[]
}
```
### Модель `clients_x_addresses` (Связь пользователей с адресами)

Промежуточная таблица для реализации связи Многие-ко-многим (N:M) между пользователями (users) и объектами (addresses).
```prisma
model clients_x_addresses {
  user_id    Int
  address_id Int

  user    users     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  address addresses @relation(fields: [address_id], references: [address_id], onDelete: Cascade)

  @@id([user_id, address_id])
}
```
### Модель `devices` (Оборудование на объектах)

Хранит технические параметры устройств (камер, панелей), установленных на конкретных адресах.
```prisma
model devices {
  device_id   Int        @id @default(autoincrement())
  device_name String
  device_type DeviceType @default(CAMERA)
  ip          String?    @db.VarChar(45)
  port        Int?
  login       String?
  password    String?
  address_id  Int

  address addresses @relation(fields: [address_id], references: [address_id], onDelete: Cascade)
}
```
### Модель `email_templates` (Шаблоны почтовых уведомлений)

Хранит HTML-шаблоны и тексты для отправки системных писем (подтверждения почты, сброс пароля и др.).
```prisma
model email_templates {
  template_id Int      @id @default(autoincrement())
  slug        String   @unique // Уникальный идентификатор шаблона (например, 'email_verification')
  title       String
  subject     String
  body_html   String   @db.Text
  updated_at  DateTime @updatedAt @default(now())
}
```
## 3. Основные команды для работы с базой данных
#### Для управления схемой базы данных используются следующие команды Prisma CLI:

Синхронизация схемы в разработке (без миграций):
``` Bash
npx prisma db push
```
Генерация клиентского кода TypeScript после изменения схемы:
```Bash
npx prisma generate
```
Сброс и полное обновление структуры (при необходимости):
```Bash
npx prisma db push --accept-data-loss --force-reset
```
Применение миграций в production-окружении:
```Bash
npx prisma migrate deploy
```
