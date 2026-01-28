import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';

export const runtime = "nodejs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = pathname.replace(/^\/api/, '') || '/';

  // Health check
  if (path === '/health' || path === '/') {
    return res.json({ status: 'ok', message: 'Server is running' });
  }

  // Hello endpoint
  if (path === '/hello') {
    return res.json({ message: 'Hello from Express backend!' });
  }

  // POST /users — создать пользователя (тест)
  if (path === '/users') {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Метод не разрешён' });
    }
    try {
      const body = (req.body || {}) as { telegramId?: number | string; username?: string };
      const telegramId = body.telegramId != null
        ? BigInt(body.telegramId)
        : BigInt(Date.now());
      const username = typeof body.username === 'string' ? body.username : null;

      const user = await prisma.user.create({
        data: { telegramId, username },
      });

      return res.status(201).json({
        ok: true,
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          username: user.username,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (e) {
      console.error('POST /api/users', e);
      const isUnique = e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002';
      return res.status(isUnique ? 409 : 500).json({
        ok: false,
        error: isUnique ? 'Пользователь с таким telegramId уже есть' : 'Не удалось создать пользователя',
      });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

