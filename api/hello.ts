/**
 * HTTP-адаптер: Hello
 * GET /api/hello
 * 
 * Ответственность:
 * - Разбор HTTP-запроса
 * - Формирование HTTP-ответа
 * 
 * ❌ БЕЗ бизнес-логики
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const runtime = 'nodejs';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    message: 'Hello from Lambda Integral backend!',
  });
}

