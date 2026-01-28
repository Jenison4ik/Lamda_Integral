# Миграции Prisma + Turso

Turso (libSQL) подключается по HTTP, поэтому `prisma migrate dev` и `prisma db push` **не работают** напрямую к удалённой БД. Миграции делаем так: генерируем SQL локально через Prisma, затем применяем его в Turso через CLI.

---

## 1. Подготовка

### Установить Turso CLI

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# или через Homebrew
brew install tursodatabase/tap/turso
```

Авторизация: `turso auth login`.

### Локальная SQLite для Prisma CLI

В `.env` добавь **отдельный** URL для миграций — локальный файл:

```env
# Для prisma migrate dev (обязательно при работе с миграциями)
LOCAL_DATABASE_URL="file:./prisma/dev.db"

# Turso — для приложения (Prisma Client через адаптер)
DATABASE_URL="libsql://your-db.aws-eu-west-1.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"
```

В `prisma.config.ts` используется `LOCAL_DATABASE_URL`, когда он задан, иначе `DATABASE_URL`. Для шагов ниже **нужен** `LOCAL_DATABASE_URL`.

---

## 2. Workflow миграций

### Шаг 1: Переключить Prisma на локальную БД

Убедись, что в `.env` есть:

```env
LOCAL_DATABASE_URL="file:./prisma/dev.db"
```

Тогда `prisma.config` возьмёт именно его для `migrate` и других CLI-команд.

### Шаг 2: Создать миграцию локально

Меняешь `prisma/schema.prisma`, потом:

```bash
npx prisma migrate dev --name описание_изменения
```

Например:

```bash
npx prisma migrate dev --name add_users_table
```

Так Prisma:

- создаст/обновит `prisma/dev.db`;
- положит SQL в `prisma/migrations/<timestamp>_<name>/migration.sql`;
- применит миграцию к локальной SQLite.

### Шаг 3: Применить миграцию в Turso

Узнай имя БД:

```bash
turso db list
```

Применение **одной** миграции (подставь свой `DB_NAME` и путь к `migration.sql`):

```bash
turso db shell DB_NAME < prisma/migrations/20250128120000_add_users_table/migration.sql
```

Пример для базы `lambda-db-jenison4ik`:

```bash
turso db shell lambda-db-jenison4ik < prisma/migrations/20250128120000_add_users_table/migration.sql
```

Несколько миграций — применяй по очереди в хронологическом порядке (по timestamp в имени папки):

```bash
turso db shell DB_NAME < prisma/migrations/20250128120000_init/migration.sql
turso db shell DB_NAME < prisma/migrations/20250128130000_add_sessions/migration.sql
```

### Шаг 4: Сгенерировать Prisma Client

После изменения схемы:

```bash
npx prisma generate
```

`LOCAL_DATABASE_URL` для этого не нужен.

### Применить только последнюю миграцию (опционально)

Если хочешь накатить одну последнюю миграцию без копирования пути:

```bash
LATEST=$(ls -t prisma/migrations/*/migration.sql | head -1)
turso db shell DB_NAME < "$LATEST"
```

Подставь свой `DB_NAME`.

---

## 3. Полезные команды

| Действие | Команда |
|----------|---------|
| Миграции (локально) | `npx prisma migrate dev --name <name>` |
| Только создать миграцию, не применять | `npx prisma migrate dev --name <name> --create-only` |
| Сгенерировать клиент | `npx prisma generate` |
| Список баз Turso | `turso db list` |
| Применить SQL в Turso | `turso db shell <DB_NAME> < path/to/migration.sql` |
| Интерактивная консоль Turso | `turso db shell <DB_NAME>` |

---

## 4. Важно

1. **Не применяй `prisma migrate dev` к Turso-URL**  
   В `datasource` для migrate должен использоваться `LOCAL_DATABASE_URL` (локальный `file:./...`).

2. **Порядок миграций**  
   В Turso применяй миграции строго по возрастанию timestamp в именах папок.

3. **Уже применённые миграции**  
   Таблица `_prisma_migrations` в Turso не обновляется этим workflow. Следи сам, какие миграции уже накатил (например, по логам или по скриптам деплоя).

4. **Новая БД Turso**  
   Если база пустая, сначала примени `init`-миграцию (самую раннюю), затем остальные.

5. **`dev.db`**  
   Файл `prisma/dev.db` добавлен в `.gitignore` — не коммитить.

---

## 5. Краткий чеклист

- [ ] Установлен Turso CLI, выполнен `turso auth login`
- [ ] В `.env` задан `LOCAL_DATABASE_URL="file:./prisma/dev.db"`
- [ ] В `prisma.config` для migrate используется `LOCAL_DATABASE_URL` (при наличии)
- [ ] Меняешь схему → `prisma migrate dev --name ...` → смотришь `migrations/.../migration.sql`
- [ ] Применяешь: `turso db shell DB_NAME < .../migration.sql`
- [ ] Запускаешь `prisma generate` при изменении схемы
