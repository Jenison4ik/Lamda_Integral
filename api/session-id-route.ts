/**
 * Единый обработчик для /api/session/:id/results, question/:index, answer (ограничение Hobby: ≤12 функций).
 * Rewrites в vercel.json направляют сюда запросы к /api/session/:id/*.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getResults,
  getQuestion,
  submitAnswer,
} from "../lib/controllers/session.controller.js";

export const runtime = "nodejs";

function getSessionIdFromQuery(req: VercelRequest): number | null {
  const id = req.query.id;
  const raw = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const sessionId = getSessionIdFromQuery(req);
  const action = typeof req.query.action === "string" ? req.query.action : Array.isArray(req.query.action) ? req.query.action[0] : "";
  const indexRaw = req.query.index;
  const questionIndex = typeof indexRaw === "string" ? Number(indexRaw) : Array.isArray(indexRaw) ? Number(indexRaw[0]) : NaN;

  if (!sessionId) {
    return res.status(400).json({
      ok: false,
      error: "Нужен параметр id (session id).",
    });
  }

  if (action === "results") {
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте GET.",
      });
    }
    const result = await getResults(sessionId);
    return res.status(result.status).json(result.data);
  }

  if (action === "question") {
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте GET.",
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

  if (action === "answer") {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте POST.",
      });
    }
    const body = (req.body || {}) as { questionId?: number; answerId?: number };
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

  return res.status(400).json({
    ok: false,
    error: "Недопустимый action. Ожидается results | question | answer.",
  });
}
