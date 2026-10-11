# Схема базы данных и Prisma ORM (DNZ Database)

Проект использует **PostgreSQL** в качестве основной реляционной базы данных и **Prisma ORM** для работы с ней. Схема находится в файле `prisma/schema.prisma`.

---

## 1. Описание модели User

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // Хэш пароля (bcrypt / argon2)
  ruleName  String   @default("user") // Роль: "user" | "admin"
  avatar    String?  // Относительный путь к файлу в MinIO (например, "avatars/...")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
## 2. Основные команды для работы с базой
``
Поскольку база данных запускается внутри Docker-контейнера, а Nuxt — локально на хосте, миграции и синхронизация выполняются через следующие команды:
``

Применение изменений схемы в базу данных (без создания миграций, для разработки):

```Bash
npx prisma db push
```
Генерация клиентского кода TypeScript (обязательно после изменения схемы):
```Bash
npx prisma generate
```
Визуальный осмотр базы данных через Prisma Studio:
```Bash
npx prisma studio
```
