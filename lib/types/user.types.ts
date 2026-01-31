/**
 * Типы для работы с пользователями (platform-agnostic)
 */

/**
 * Входные данные для создания пользователя
 */
export interface CreateUserInput {
  telegramId: number | string;
  username?: string | null;
}

/**
 * DTO пользователя для API-ответов
 * BigInt конвертируется в string для JSON-сериализации
 */
export interface UserDto {
  id: number;
  telegramId: string;
  username: string | null;
  lastSeen: string | null;
  createdAt: string;
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
