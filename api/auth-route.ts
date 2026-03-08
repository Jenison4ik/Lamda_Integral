/**
 * Единый обработчик для всех Auth API (ограничение Hobby: ≤12 функций).
 * Rewrites в vercel.json направляют сюда: /api/auth, /api/auth/webapp,
 * /api/auth/telegram-login, /api/auth/telegram-login-page, /api/auth/telegram-login-callback.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  loginAdmin,
  verifyAdmin,
  webappLogin,
  telegramLogin,
  nativeRequestToken,
  nativePoll,
} from "../lib/controllers/auth.controller.js";
import { getApiBaseUrl } from "../lib/url.js";
import type {
  AdminLoginInput,
  TelegramAuthInput,
  TelegramLoginInput,
} from "../lib/types/auth.types.js";

export const runtime = "nodejs";

const WIDGET_SCRIPT = "https://telegram.org/js/telegram-widget.js?22";
const APP_SCHEME = "lamdaintegral";

/**
 * После rewrite Vercel может отдавать путь как destination; сегменты из source
 * приходят в query. Определяем логический путь для роутинга.
 */
function getPath(req: VercelRequest): string {
  const url = req.url ?? "";
  const pathname = url.split("?")[0] ?? "";
  const fromUrl = pathname.replace(/\/$/, "") || "/";
  if (fromUrl.startsWith("/api/auth/")) return fromUrl;
  const pathSegment = req.query.path;
  const segment = typeof pathSegment === "string" ? pathSegment : Array.isArray(pathSegment) ? pathSegment[0] : "";
  return segment ? `/api/auth/${segment}` : "/api/auth";
}

function extractToken(req: VercelRequest): string {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  return type === "Bearer" && token ? token : "";
}

function getBotUsername(): string {
  const name = process.env.TELEGRAM_BOT_USERNAME ?? "";
  return name.replace(/^@/, "").trim();
}

function parseTelegramLoginBody(body: unknown): TelegramLoginInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  const auth_date =
    typeof o.auth_date === "number" ? o.auth_date : Number(o.auth_date);
  if (!Number.isInteger(id) || id < 1 || !Number.isFinite(auth_date))
    return null;
  const first_name = typeof o.first_name === "string" ? o.first_name : "";
  const hash = typeof o.hash === "string" ? o.hash : "";
  if (!first_name || !hash) return null;
  const username = typeof o.username === "string" ? o.username : undefined;
  return { id, first_name, username, auth_date, hash };
}

function parseTelegramLoginQuery(
  query: VercelRequest["query"],
): TelegramLoginInput | null {
  if (!query || typeof query !== "object") return null;
  const q = query as Record<string, string | string[] | undefined>;
  const idRaw = q.id;
  const id =
    typeof idRaw === "string"
      ? Number(idRaw)
      : Array.isArray(idRaw)
        ? Number(idRaw[0])
        : NaN;
  if (!Number.isInteger(id) || id < 1) return null;
  const first_name =
    typeof q.first_name === "string"
      ? q.first_name
      : Array.isArray(q.first_name)
        ? q.first_name[0]
        : "";
  if (!first_name) return null;
  const auth_dateRaw = q.auth_date;
  const auth_date =
    typeof auth_dateRaw === "string"
      ? Number(auth_dateRaw)
      : Array.isArray(auth_dateRaw)
        ? Number(auth_dateRaw[0])
        : NaN;
  if (!Number.isFinite(auth_date)) return null;
  const hash =
    typeof q.hash === "string" ? q.hash : Array.isArray(q.hash) ? q.hash[0] : "";
  if (!hash) return null;
  const username =
    typeof q.username === "string"
      ? q.username
      : Array.isArray(q.username)
        ? q.username[0]
        : undefined;
  return { id, first_name, username, auth_date, hash };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const path = getPath(req);

  // GET/POST /api/auth — админка
  if (path === "/api/auth") {
    if (req.method === "GET") {
      const token = extractToken(req);
      const result = await verifyAdmin(token);
      return res.status(result.status).json(result.data);
    }
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте GET или POST.",
      });
    }
    const input: AdminLoginInput = req.body || {};
    const result = await loginAdmin(input);
    return res.status(result.status).json(result.data);
  }

  // POST /api/auth/webapp
  if (path === "/api/auth/webapp") {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте POST.",
      });
    }
    const input: TelegramAuthInput = req.body || {};
    const result = await webappLogin(input);
    return res.status(result.status).json(result.data);
  }

  // POST /api/auth/native-request — временный токен для deep link (нативное приложение)
  if (path === "/api/auth/native-request") {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте POST.",
      });
    }
    const result = await nativeRequestToken();
    return res.status(result.status).json(result.data);
  }

  // GET /api/auth/native-poll?token=... — опрос: привязан ли токен к пользователю
  if (path === "/api/auth/native-poll") {
    if (req.method !== "GET") {
      return res.status(405).setHeader("Allow", "GET").end();
    }
    const raw = req.query.token;
    const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    const result = await nativePoll(token ?? "");
    return res.status(result.status).json(result.data);
  }

  // POST /api/auth/telegram-login
  if (path === "/api/auth/telegram-login") {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Метод не разрешён. Используйте POST.",
      });
    }
    const input = parseTelegramLoginBody(req.body);
    if (!input) {
      return res.status(400).json({
        ok: false,
        error: "Неверный payload. Ожидается: id, first_name, auth_date, hash.",
      });
    }
    const result = await telegramLogin(input);
    return res.status(result.status).json(result.data);
  }

  // GET /api/auth/telegram-login-page
  if (path === "/api/auth/telegram-login-page") {
    if (req.method !== "GET") {
      return res.status(405).setHeader("Allow", "GET").end();
    }
    const botUsername = getBotUsername();
    if (!botUsername) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(500).send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ошибка</title></head><body>
        <p>Сервер: не задан TELEGRAM_BOT_USERNAME (имя бота без @).</p>
      </body></html>`,
      );
    }
    const host =
      (req.headers["x-forwarded-host"] as string) ||
      (req.headers.host as string) ||
      "";
    const baseUrl = getApiBaseUrl(host);
    const callbackUrl = `${baseUrl}/api/auth/telegram-login-callback`;
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Вход через Telegram — Lambda Integral</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; background: #f5f5f5; }
    h1 { font-size: 1.25rem; color: #111; margin-bottom: 8px; }
    p { color: #666; text-align: center; margin-bottom: 24px; }
    .widget { margin: 16px 0; }
  </style>
</head>
<body>
  <h1>Lambda Integral</h1>
  <p>Нажмите кнопку ниже, чтобы войти через Telegram.</p>
  <div class="widget">
    <script async src="${WIDGET_SCRIPT}"
      data-telegram-login="${botUsername}"
      data-size="large"
      data-auth-url="${callbackUrl}"
      data-request-access="write"></script>
  </div>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(html);
  }

  // GET /api/auth/telegram-login-callback
  if (path === "/api/auth/telegram-login-callback") {
    if (req.method !== "GET") {
      return res.status(405).setHeader("Allow", "GET").end();
    }
    const input = parseTelegramLoginQuery(req.query);
    if (!input) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(400).send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ошибка</title></head><body>
        <p>Неверные параметры от Telegram. Повторите вход.</p>
      </body></html>`,
      );
    }
    const result = await telegramLogin(input);
    if (
      result.status !== 200 ||
      !result.data ||
      !("token" in result.data)
    ) {
      const error =
        result.data &&
        typeof result.data === "object" &&
        "error" in result.data
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

  return res.status(404).json({ ok: false, error: "Not Found" });
}
