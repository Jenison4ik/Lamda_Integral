/**
 * POST /api/auth/webapp
 * Telegram Mini App: initData → JWT.
 * Payload: { initData: string }
 * Response: { token: string }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { webappLogin } from "../../lib/controllers/auth.controller.js";
import type { TelegramAuthInput } from "../../lib/types/auth.types.js";

export const runtime = "nodejs";

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

  const input: TelegramAuthInput = req.body || {};
  const result = await webappLogin(input);
  return res.status(result.status).json(result.data);
}
