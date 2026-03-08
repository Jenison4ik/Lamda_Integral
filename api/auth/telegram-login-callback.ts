/**
 * GET /api/auth/telegram-login-callback
 * Callback от Telegram Login Widget: проверка hash, выдача JWT, редирект в приложение.
 * Редирект: lamdaintegral://auth?token=<JWT>
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { telegramLogin } from "../../lib/controllers/auth.controller.js";
import type { TelegramLoginInput } from "../../lib/types/auth.types.js";

export const runtime = "nodejs";

const APP_SCHEME = "lamdaintegral";

function parseQuery(query: VercelRequest["query"]): TelegramLoginInput | null {
  if (!query || typeof query !== "object") return null;
  const q = query as Record<string, string | string[] | undefined>;
  const idRaw = q.id;
  const id = typeof idRaw === "string" ? Number(idRaw) : Array.isArray(idRaw) ? Number(idRaw[0]) : NaN;
  if (!Number.isInteger(id) || id < 1) return null;

  const first_name = typeof q.first_name === "string" ? q.first_name : Array.isArray(q.first_name) ? q.first_name[0] : "";
  if (!first_name) return null;

  const auth_dateRaw = q.auth_date;
  const auth_date = typeof auth_dateRaw === "string" ? Number(auth_dateRaw) : Array.isArray(auth_dateRaw) ? Number(auth_dateRaw[0]) : NaN;
  if (!Number.isFinite(auth_date)) return null;

  const hash = typeof q.hash === "string" ? q.hash : Array.isArray(q.hash) ? q.hash[0] : "";
  if (!hash) return null;

  const username = typeof q.username === "string" ? q.username : Array.isArray(q.username) ? q.username[0] : undefined;

  return { id, first_name, username, auth_date, hash };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).setHeader("Allow", "GET").end();
  }

  const input = parseQuery(req.query);
  if (!input) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ошибка</title></head><body>
        <p>Неверные параметры от Telegram. Повторите вход.</p>
      </body></html>`,
    );
  }

  const result = await telegramLogin(input);

  if (result.status !== 200 || !result.data || !("token" in result.data)) {
    const error = result.data && typeof result.data === "object" && "error" in result.data
      ? String((result.data as { error: string }).error)
      : "Ошибка входа";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(result.status).send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ошибка</title></head><body>
        <p>${escapeHtml(error)}</p>
      </body></html>`,
    );
  }

  const token = (result.data as { token: string }).token;
  const redirectUrl = `${APP_SCHEME}://auth?token=${encodeURIComponent(token)}`;
  res.setHeader("Location", redirectUrl);
  res.setHeader("Cache-Control", "no-store");
  return res.status(302).end();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
