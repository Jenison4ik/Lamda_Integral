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

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureTelegramUser } from "../lib/controllers/auth.controller.js";
import type { TelegramAuthInput } from "../lib/types/auth.types.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Проверка метода
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте POST.",
    });
  }

  // Извлечение входных данных
  const input: TelegramAuthInput = req.body || {};

  // Вызов контроллера (platform-agnostic)
  const result = await ensureTelegramUser(input);

  // Формирование HTTP-ответа
  return res.status(result.status).json(result.data);
}
