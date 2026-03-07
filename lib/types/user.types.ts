/**
 * Типы для работы с пользователями (platform-agnostic)
 */

/**
 * Входные данные для создания пользователя
 */
export interface CreateUserInput {
  telegramId: number | string;
  username?: string | null;
  firstName?: string | null;
}

/**
 * DTO пользователя для API-ответов
 * BigInt конвертируется в string для JSON-сериализации
 */
export interface UserDto {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastSeen: string | null;
  createdAt: string;
}

/**
 * Входные данные для upsert при Telegram Login (native)
 */
export interface TelegramLoginUserInput {
  telegramId: bigint;
  username?: string | null;
  firstName?: string | null;
}

/**
 * Результат создания пользователя
 */
export interface CreateUserResult {
  ok: true;
  user: UserDto;
}

/**
 * Ошибка создания пользователя
 */
export interface CreateUserError {
  ok: false;
  error: string;
}
