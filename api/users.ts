/**
 * HTTP-адаптер: Users API
 * GET  /api/users?telegramId=... - Проверка пользователя по telegramId
 * POST /api/users - Создание/обновление пользователя (ensure)
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
  ensureTelegramUser,
  verifyTelegramRequest,
} from "../lib/controllers/auth.controller.js";
import { checkUser } from "../lib/controllers/user.controller.js";
import type { TelegramAuthInput } from "../lib/types/auth.types.js";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../lib/errors/app.errors.js";

export const runtime = "nodejs";

function getInitData(req: VercelRequest): string | undefined {
  const header = req.headers["x-telegram-init-data"];
  if (typeof header === "string" && header) return header;
  const raw = req.query.initData;
  return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET — проверка пользователя по telegramId (только для себя, с верификацией initData)
  if (req.method === "GET") {
    const raw = req.query.telegramId;
    const telegramId =
      typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

    if (telegramId == null || telegramId === "") {
      return res.status(400).json({
        ok: false,
        error: "Параметр telegramId обязателен",
      });
    }

    let id: bigint;
    try {
      id = BigInt(telegramId);
    } catch {
      return res.status(400).json({
        ok: false,
        error: "telegramId должен быть числом",
      });
    }

    const initData = getInitData(req);
    if (!initData) {
      return res.status(401).json({
        ok: false,
        error: "Требуется initData (заголовок X-Telegram-Init-Data или параметр initData)",
      });
    }

    try {
      verifyTelegramRequest(initData, id);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return res.status(403).json({ ok: false, error: err.message });
      }
      if (err instanceof UnauthorizedError) {
        return res.status(401).json({ ok: false, error: err.message });
      }
      if (err instanceof ValidationError) {
        return res.status(400).json({ ok: false, error: err.message });
      }
      throw err;
    }

    const result = await checkUser(id);
    return res.status(result.status).json(result.data);
  }

  // POST — создание/обновление пользователя (ensure)
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте GET или POST.",
    });
  }

  const input: TelegramAuthInput = req.body || {};
  const result = await ensureTelegramUser(input);

  return res.status(result.status).json(result.data);
}
