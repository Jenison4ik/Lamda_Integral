import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // Убираем /api из пути для обработки
  const path = pathname.replace(/^\/api/, '') || '/';
  
  // Health check
  if (path === '/health' || path === '/') {
    return res.json({ status: 'ok', message: 'Server is running' });
  }
  
  // Hello endpoint
  if (path === '/hello') {
    return res.json({ message: 'Hello from Express backend!' });
  }
  
  // 404
  return res.status(404).json({ error: 'Route not found' });
}

