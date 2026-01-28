/**
 * HTTP-адаптер: Users API
 * POST /api/users - Создание пользователя
 * 
 * Ответственность:
 * - Разбор HTTP-запроса
 * - Проверка метода
 * - Вызов контроллера
 * - Формирование HTTP-ответа
 * 
 * ❌ БЕЗ бизнес-логики
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUser } from '../lib/controllers/user.controller.js';
import type { CreateUserInput } from '../lib/types/user.types.js';

export const runtime = 'nodejs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Проверка метода
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Метод не разрешён. Используйте POST.',
    });
  }

  // Извлечение входных данных
  const input: CreateUserInput = req.body || {};

  // Вызов контроллера (platform-agnostic)
  const result = await createUser(input);

  // Формирование HTTP-ответа
  return res.status(result.status).json(result.data);
}

