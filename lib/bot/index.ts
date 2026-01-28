/**
 * Фабрика бота (platform-agnostic)
 * 
 * Создаёт сконфигурированный экземпляр бота.
 * Может использоваться как на Vercel, так и на Express/Fastify.
 */

import { Bot } from 'grammy';
import { BotConfig } from './types.js';
import { createStartHandler, createMenuHandler } from './handlers/index.js';

/**
 * Создаёт и конфигурирует экземпляр бота
 * 
 * @param config - Конфигурация бота
 * @returns Настроенный экземпляр Bot
 */
export function createBot(config: BotConfig): Bot {
  const bot = new Bot(config.token);

  // Подключаем обработчики (Composer middleware)
  bot.use(createStartHandler(config.webAppUrl));
  bot.use(createMenuHandler());

  return bot;
}

// Реэкспорт типов и утилит
export * from './types.js';
export * from './messages.js';
export * from './keyboards.js';

