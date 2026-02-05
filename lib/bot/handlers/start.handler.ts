/**
 * Обработчик команды /start
 *
 * Вынесен в отдельный модуль для:
 * - Разделения ответственности
 * - Переиспользования
 * - Тестирования
 */
import { userService } from "../../services/user.service.js";
import { Composer, Context } from "grammy";
import { BOT_MESSAGES } from "../messages.js";
import {
  createWebAppKeyboard,
  createConfirmEulaKeyboard,
} from "../keyboards.js";

/**
 * Создаёт Composer с обработчиком команды /start
 */
export function createStartHandler(webAppUrl: string): Composer<Context> {
  const composer = new Composer();

  composer.command("start", async (ctx) => {
    //показываем приветствие
    await ctx.reply(BOT_MESSAGES.start, {
      reply_markup: createWebAppKeyboard(webAppUrl),
    });
  });

  return composer;
}
