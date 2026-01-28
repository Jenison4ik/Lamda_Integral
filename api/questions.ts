/**
 * HTTP-адаптер: Questions API
 * POST /api/questions - Импорт вопросов
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
import { importQuestions } from "../lib/controllers/question.controller.js";
import type { ImportQuestionsInput } from "../lib/types/question.types.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте POST.",
    });
  }

  const input: ImportQuestionsInput = req.body || {};
  const result = await importQuestions(input);

  return res.status(result.status).json(result.data);
}
