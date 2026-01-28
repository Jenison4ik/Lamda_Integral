/**
 * Обработчики команды /menu и связанных callback-ов
 */

import { Composer } from 'grammy';
import { BOT_MESSAGES } from '../messages.js';
import { createMenuKeyboard, createReplyKeyboard } from '../keyboards.js';

/**
 * Создаёт Composer с обработчиками меню
 */
export function createMenuHandler(): Composer {
  const composer = new Composer();

  // Команда /menu — показывает inline-клавиатуру
  composer.command('menu', (ctx) => {
    return ctx.reply(BOT_MESSAGES.menu.prompt, {
      reply_markup: createMenuKeyboard(),
    });
  });

  // Команда /keyboard — показывает reply-клавиатуру
  composer.command('keyboard', (ctx) => {
    return ctx.reply(BOT_MESSAGES.keyboard.prompt, {
      reply_markup: createReplyKeyboard(),
    });
  });

  // Callback для кнопки 1
  composer.callbackQuery('btn1', async (ctx) => {
    await ctx.answerCallbackQuery({ text: BOT_MESSAGES.callbacks.btn1Pressed });
  });

  // Callback для кнопки 2
  composer.callbackQuery('btn2', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(BOT_MESSAGES.callbacks.btn2Pressed);
  });

  return composer;
}

