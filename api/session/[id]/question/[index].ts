/**
 * HTTP-адаптер: GET /api/session/:id/question/:index
 *
 * Получает вопрос по индексу в сессии.
 * Ответы возвращаются БЕЗ isCorrect — защита от жульничества.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getQuestion } from "../../../../lib/controllers/session.controller.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте GET.",
    });
  }

  const { id, index } = req.query;

  const sessionId = typeof id === "string" ? Number(id) : NaN;
  const questionIndex = typeof index === "string" ? Number(index) : NaN;

  if (!Number.isInteger(sessionId) || sessionId < 1) {
    return res.status(400).json({
      ok: false,
      error: "Невалидный ID сессии",
    });
  }

  if (!Number.isInteger(questionIndex) || questionIndex < 0) {
    return res.status(400).json({
      ok: false,
      error: "Невалидный индекс вопроса",
    });
  }

  const result = await getQuestion(sessionId, questionIndex);
  return res.status(result.status).json(result.data);
}
