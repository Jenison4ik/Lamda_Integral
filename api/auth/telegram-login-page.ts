/**
 * GET /api/auth/telegram-login-page
 * Отдаёт HTML-страницу с Telegram Login Widget для нативного приложения.
 * После входа Telegram редиректит на /api/auth/telegram-login-callback.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApiBaseUrl } from "../../lib/url.js";

export const runtime = "nodejs";

const WIDGET_SCRIPT = "https://telegram.org/js/telegram-widget.js?22";

function getBotUsername(): string {
  const name = process.env.TELEGRAM_BOT_USERNAME ?? "";
  return name.replace(/^@/, "").trim();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
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
