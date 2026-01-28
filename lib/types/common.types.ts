/**
 * Общие типы для контроллеров (platform-agnostic)
 */

/**
 * Результат выполнения контроллера
 * Не зависит от HTTP-фреймворка
 */
export interface ControllerResult<T = unknown> {
  status: number;
  data: T;
}

/**
 * Базовый ответ API
 */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Успешный ответ
 */
export interface SuccessResponse<T> extends ApiResponse<T> {
  ok: true;
  data: T;
}

/**
 * Ответ с ошибкой
 */
export interface ErrorResponse extends ApiResponse<never> {
  ok: false;
  error: string;
}

