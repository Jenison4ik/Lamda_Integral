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
    if (!ctx.from) {
      await ctx.reply("Ошибка: не удалось получить данные пользователя");
      return;
    }

    // Проверяем, есть ли пользователь в БД
    const existingUser = await userService.getByTelegramId(BigInt(ctx.from.id));

    if (!existingUser) {
      // Если пользователя нет, показываем EULA с кнопкой подтверждения
      await ctx.reply(BOT_MESSAGES.eula, {
        reply_markup: createConfirmEulaKeyboard(),
        parse_mode: "MarkdownV2",
      });
      return;
    }

    // Если пользователь уже есть, показываем приветствие
    await ctx.reply(BOT_MESSAGES.start, {
      reply_markup: createWebAppKeyboard(webAppUrl),
    });
  });

  // Обработчик подтверждения EULA - создаёт пользователя в БД
  composer.callbackQuery("confirm_eula", async (ctx) => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery({
        text: "Ошибка: не удалось получить данные пользователя",
      });
      return;
    }

    try {
      // Создаём пользователя в БД при нажатии на кнопку подтверждения
      await userService.create({
        telegramId: ctx.from.id.toString(),
        username: ctx.from.username || null,
      });

      await ctx.answerCallbackQuery({
        text: "✅ Спасибо! Вы подтвердили условия использования",
      });

      // Удаляем сообщение с EULA
      if (ctx.callbackQuery.message && ctx.chatId) {
        await ctx.api.deleteMessage(
          ctx.chatId,
          ctx.callbackQuery.message.message_id
        );
      }

      // Показываем приветственное сообщение
      await ctx.reply(BOT_MESSAGES.start, {
        reply_markup: createWebAppKeyboard(webAppUrl),
      });
    } catch (error) {
      console.error("Ошибка при создании пользователя:", error);
      await ctx.answerCallbackQuery({
        text: "❌ Произошла ошибка. Попробуйте позже",
      });
    }
  });

  return composer;
}
