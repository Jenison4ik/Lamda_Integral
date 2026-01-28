/**
 * HTTP-адаптер: Telegram Bot Webhook
 * POST /api/bot
 * 
 * Ответственность:
 * - Только обработка webhook-запроса от Telegram
 * - Создание бота через фабрику
 * - Передача update в grammY
 * 
 * ❌ БЕЗ бизнес-логики (вынесена в lib/bot/)
 */

import { webhookCallback } from 'grammy';
import { createBot } from '../lib/bot/index.js';

// Валидация environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const webAppUrl = process.env.WEB_APP_URL 
if(!webAppUrl){
  throw new Error('WEB_APP_URL is not set')
}

// Создаём бота через фабрику (platform-agnostic)
const bot = createBot({ token, webAppUrl });

// Экспортируем webhook callback для Vercel
export default webhookCallback(bot, 'https');
