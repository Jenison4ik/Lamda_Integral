# TG Integral App 2.0

Телеграм‑бот и веб‑клиент для тренировки интегралов. Фронтенд — Vite/React, backend — serverless функции Vercel. Prisma используется с Turso (libSQL).

## Структура

```
.
├── api/                # Vercel Serverless Functions
│   ├── index.ts        # API: /api/health, /api/hello, /api/users
│   └── bot.ts          # Telegram webhook
├── client/             # React фронтенд (Vite)
├── lib/                # Общие модули (Prisma client)
├── prisma/             # Prisma схема и миграции
│   ├── schema.prisma
│   └── migrations/
├── docs/               # Документация
└── vercel.json         # Настройки Vercel
```

## Быстрый старт

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env`:

```bash
cp .env.template .env
```

3. Запуск dev:

```bash
npm run dev
```

## Команды

- `npm run dev` — локальный фронтенд
- `npm run dev:client` — локальный фронтенд
- `npm run build` — сборка фронтенда
- `npm run preview` — превью сборки

## Prisma + Turso

Prisma подключается через адаптер `@prisma/adapter-libsql` в `lib/prisma.ts`.

### Переменные окружения

```env
DATABASE_URL="libsql://your-db.aws-eu-west-1.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"

# Для локальных миграций
LOCAL_DATABASE_URL="file:./prisma/dev.db"
```

### Миграции (кратко)

Полный гайд: `docs/TURSO_MIGRATIONS.md`.

1. Изменяем `prisma/schema.prisma`.
2. Генерируем миграцию локально:

```bash
npx prisma migrate dev --name описание_изменения
```

3. Применяем SQL в Turso:

```bash
turso db shell DB_NAME < prisma/migrations/<timestamp>_<name>/migration.sql
```

4. Обновляем Prisma Client:

```bash
npx prisma generate
```

## Vercel

- Serverless функции: `api/*`
- Webhook бота: `https://<app>.vercel.app/api/bot`
