/**
 * HTTP-адаптер: Health Check
 * GET /api/health
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
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
}

