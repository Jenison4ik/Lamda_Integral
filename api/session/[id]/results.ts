/**
 * HTTP-адаптер: GET /api/session/:id/results
 *
 * Возвращает результаты сессии (количество правильных, процент, детали по вопросам).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getResults } from "../../../lib/controllers/session.controller.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте GET.",
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

  const result = await getResults(sessionId);
  return res.status(result.status).json(result.data);
}
