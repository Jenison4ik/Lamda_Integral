/**
 * HTTP-адаптер: POST /api/session/:id/answer
 *
 * Отправляет ответ на вопрос.
 * Сохраняет ответ на сервере и возвращает правильность.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { submitAnswer } from "../../../lib/controllers/session.controller.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте POST.",
    });
  }

  const { id } = req.query;
  const sessionId = typeof id === "string" ? Number(id) : NaN;

  if (!Number.isInteger(sessionId) || sessionId < 1) {
    return res.status(400).json({
      ok: false,
      error: "Невалидный ID сессии",
    });
  }

  const body = (req.body || {}) as {
    questionId?: number;
    answerId?: number;
  };

  const questionId =
    typeof body.questionId === "number" ? body.questionId : NaN;
  const answerId = typeof body.answerId === "number" ? body.answerId : NaN;

  if (!Number.isInteger(questionId) || questionId < 1) {
    return res.status(400).json({
      ok: false,
      error: "Невалидный questionId",
    });
  }

  if (!Number.isInteger(answerId) || answerId < 1) {
    return res.status(400).json({
      ok: false,
      error: "Невалидный answerId",
    });
  }

  const result = await submitAnswer(sessionId, questionId, answerId);
  return res.status(result.status).json(result.data);
}
