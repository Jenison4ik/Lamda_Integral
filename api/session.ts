/**
 * HTTP-адаптер: Session API
 * GET  /api/session - Последняя активная (незавершённая) сессия пользователя
 * POST /api/session - Создание новой сессии
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
import {
  createSession,
  getLastActiveSession,
} from "../lib/controllers/session.controller.js";
import type { CreateSessionInput } from "../lib/types/session.types.js";
import type { TelegramAuthInput } from "../lib/types/auth.types.js";

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const rawUserId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;
    const userId = rawUserId ? Number(rawUserId) : NaN;

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({
        ok: false,
        error: "Нужен валидный query-параметр userId",
      });
    }

    const result = await getLastActiveSession(userId);
    return res.status(result.status).json(result.data);
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте GET или POST.",
    });
  }

  const body = (req.body || {}) as TelegramAuthInput & {
    difficulty?: string;
    totalQuestions?: number;
    showAnswersAfterEach?: boolean;
  };

  const initData =
    typeof body.initData === "string" && body.initData.trim()
      ? body.initData.trim()
      : "";

  if (!initData) {
    return res.status(400).json({
      ok: false,
      error: "Для создания сессии нужен initData (Telegram WebApp).",
    });
  }

  const authResult = await ensureTelegramUser({ initData });
  if (!authResult.data.ok) {
    return res.status(authResult.status).json(authResult.data);
  }

  const totalQuestions =
    typeof body.totalQuestions === "number" && body.totalQuestions > 0
      ? body.totalQuestions
      : 10;
  const difficulty =
    typeof body.difficulty === "string" && body.difficulty.trim()
      ? body.difficulty.trim()
      : "medium";
  const showAnswersAfterEach =
    typeof body.showAnswersAfterEach === "boolean"
      ? body.showAnswersAfterEach
      : false;

  const input: CreateSessionInput = {
    userId: authResult.data.user.id,
    difficulty,
    totalQuestions,
    showAnswersAfterEach,
  };

  const result = await createSession(input);
  return res.status(result.status).json(result.data);
}
