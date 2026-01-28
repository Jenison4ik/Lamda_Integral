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
import {
  getQuestions,
  importQuestions,
} from "../lib/controllers/question.controller.js";
import type {
  ImportQuestionsInput,
  GetQuestionsInput,
} from "../lib/types/question.types.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const rawLimit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const rawOffset =
      typeof req.query.offset === "string" ? Number(req.query.offset) : undefined;

    const input: GetQuestionsInput = {
      difficulty:
        typeof req.query.difficulty === "string"
          ? req.query.difficulty
          : undefined,
      limit: Number.isFinite(rawLimit) ? rawLimit : undefined,
      offset: Number.isFinite(rawOffset) ? rawOffset : undefined,
    };

    const result = await getQuestions(input);
    return res.status(result.status).json(result.data);
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте GET или POST.",
    });
  }

  const input: ImportQuestionsInput = req.body || {};
  const result = await importQuestions(input);

  return res.status(result.status).json(result.data);
}
