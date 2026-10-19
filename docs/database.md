Markdown

# Схема базы данных и Prisma ORM (DNZ Database)

Проект использует **PostgreSQL** в качестве основной реляционной базы данных и **Prisma ORM** для работы с ней. Схема находится в файле `prisma/schema.prisma`.

---

## 1. Модели данных

### Модель `roles` (Роли в системе)
Определяет права доступа пользователей (например: `admin`, `installer`, `manager`, `client`).
```prisma
model roles {
  role_id   Int     @id @default(autoincrement())
  role_name String  @unique
  users     users[]
}
```
### Модель users (Сотрудники и предзаписанные клиенты)

Основная таблица пользователей системы. Регистрация доступна только для пользователей, предзанесенных в систему администратором.
```prisma
model users {
  user_id      Int       @id @default(autoincrement())
  user_name    String?
  phone        String    @unique
  email        String?   @unique
  password     String?
  role_id      Int
  avatar_path  String?
  activated_at DateTime? @default(now()) // Null до активации, заполняется при подтверждении

  role      roles                 @relation(fields: [role_id], references: [role_id])
  addresses clients_x_addresses[]
}
```
### Модель addresses (Адреса объектов)

Физические адреса объектов обслуживания.
```prisma
model addresses {
  address_id   Int    @id @default(autoincrement())
  address_name String @unique @db.VarChar(255)

  clients clients_x_addresses[]
}
```
### Модель clients_x_addresses (Связь клиентов с адресами)

Таблица связей многие-ко-многим (N:M) между пользователями и адресами.
```prisma
model clients_x_addresses {
  user_id    Int
  address_id Int

  user    users     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  address addresses @relation(fields: [address_id], references: [address_id], onDelete: Cascade)

  @@id([user_id, address_id])
}
```
### Модель email_templates (Шаблоны писем)

Хранение шаблонов для почтовых рассылок и уведомлений.
```prisma
model email_templates {
  template_id Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  subject     String
  body_html   String   @db.Text
  updated_at  DateTime @updatedAt @default(now())
}
```
## 2. Основные команды для работы с базой

Применение изменений схемы напрямую (для разработки):

```Bash
npx prisma db push
```
Генерация клиентского кода TypeScript:
```Bash
npx prisma generate
```
Управление миграциями в продакшене:
```Bash
npx prisma migrate deploy
```
### Enum `DeviceType`
Поддерживаемые типы оборудования: `CAMERA` (камера), `PANEL` (вызывная панель).

### Модель `devices` (Устройства на объектах)
Хранит параметры оборудования, установленного на конкретных адресах.
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

  address     addresses  @relation(fields: [address_id], references: [address_id], onDelete: Cascade)
}
```
