/**
 * Обработчик команды /start
 * 
 * Вынесен в отдельный модуль для:
 * - Разделения ответственности
 * - Переиспользования
 * - Тестирования
 */

import { Composer } from 'grammy';
import { BOT_MESSAGES } from '../messages.js';
import { createWebAppKeyboard } from '../keyboards.js';

/**
 * Создаёт Composer с обработчиком команды /start
 */
export function createStartHandler(webAppUrl: string): Composer {
  const composer = new Composer();

  composer.command('start', async (ctx) => {
    await ctx.reply(BOT_MESSAGES.start, {
      reply_markup: createWebAppKeyboard(webAppUrl),
    });
  });

  return composer;
}

