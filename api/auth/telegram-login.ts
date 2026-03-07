/**
 * POST /api/auth/telegram-login
 * Telegram Login (native iOS/Android): проверка подписи, upsert пользователя, выдача JWT.
 *
 * Payload: { id, first_name, username?, auth_date, hash }
 * Response: { token: string }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { telegramLogin } from "../../lib/controllers/auth.controller.js";
import type { TelegramLoginInput } from "../../lib/types/auth.types.js";

export const runtime = "nodejs";

function parseBody(body: unknown): TelegramLoginInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  const auth_date = typeof o.auth_date === "number" ? o.auth_date : Number(o.auth_date);
  if (!Number.isInteger(id) || id < 1 || !Number.isFinite(auth_date)) return null;
  const first_name = typeof o.first_name === "string" ? o.first_name : "";
  const hash = typeof o.hash === "string" ? o.hash : "";
  if (!first_name || !hash) return null;
  const username = typeof o.username === "string" ? o.username : undefined;
  return { id, first_name, username, auth_date, hash };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Метод не разрешён. Используйте POST.",
    });
  }

  const input = parseBody(req.body);
  if (!input) {
    return res.status(400).json({
      ok: false,
      error: "Неверный payload. Ожидается: id, first_name, auth_date, hash.",
    });
  }

  const result = await telegramLogin(input);
  return res.status(result.status).json(result.data);
}
