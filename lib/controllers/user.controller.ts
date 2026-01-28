/**
 * Контроллер пользователей (platform-agnostic)
 * 
 * Ответственность:
 * - Оркестрация логики
 * - Преобразование входных/выходных данных
 * - Обработка доменных ошибок
 * 
 * ❌ НЕ зависит от Vercel/Express/HTTP-специфики
 */

import { userService } from '../services/user.service.js';
import { CreateUserInput, CreateUserResult, CreateUserError } from '../types/user.types.js';
import { ControllerResult } from '../types/common.types.js';
import { AppError, UniqueConstraintError } from '../errors/app.errors.js';

/**
 * Создание нового пользователя
 * 
 * @param input - Данные для создания пользователя
 * @returns ControllerResult с результатом операции
 */
export async function createUser(
  input: CreateUserInput
): Promise<ControllerResult<CreateUserResult | CreateUserError>> {
  try {
    const user = await userService.create(input);

    return {
      status: 201,
      data: { ok: true, user },
    };
  } catch (error) {
    console.error('createUser error:', error);

    // Обработка известных доменных ошибок
    if (error instanceof UniqueConstraintError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    // Обработка других AppError
    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    // Неизвестная ошибка
    return {
      status: 500,
      data: { ok: false, error: 'Не удалось создать пользователя' },
    };
  }
}

