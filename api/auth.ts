/**
 * HTTP-адаптер: Auth API
 * POST /api/auth - Вход в админку (JWT)
 * GET /api/auth - Проверка токена
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
import { loginAdmin, verifyAdmin } from "../lib/controllers/auth.controller.js";
import type { AdminLoginInput } from "../lib/types/auth.types.js";

export const runtime = "nodejs";

function extractToken(req: VercelRequest): string {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return "";
  }
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
