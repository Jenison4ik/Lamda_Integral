/**
 * Доменные ошибки приложения (platform-agnostic)
 * Не зависят от HTTP-специфики
 */

/**
 * Базовый класс для доменных ошибок
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Ошибка нарушения уникальности (например, duplicate telegramId)
 */
export class UniqueConstraintError extends AppError {
  constructor(field: string, message?: string) {
    super(
      message || `Запись с таким ${field} уже существует`,
      'UNIQUE_CONSTRAINT',
      409
    );
    this.name = 'UniqueConstraintError';
  }
}

/**
 * Ошибка валидации входных данных
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Ресурс не найден
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} не найден`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Проверка, является ли ошибка Prisma ошибкой уникальности
 */
export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

