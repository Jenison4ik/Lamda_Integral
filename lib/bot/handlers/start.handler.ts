/**
 * Обработчик команды /start
 *
 * - Обычный /start — приветствие и кнопка Web App.
 * - /start auth_<token> — deep link из нативного приложения: привязываем токен к пользователю Telegram.
 */
import { userService } from "../../services/user.service.js";
import { nativeAuthTokenService } from "../../services/native-auth-token.service.js";
import { Composer, Context } from "grammy";
import { BOT_MESSAGES } from "../messages.js";
import { createWebAppKeyboard } from "../keyboards.js";

const AUTH_PREFIX = "auth_";

/**
 * Создаёт Composer с обработчиком команды /start
 */
export function createStartHandler(webAppUrl: string): Composer<Context> {
  const composer = new Composer();

  composer.command("start", async (ctx) => {
    const payload = ctx.match?.trim() ?? "";

    if (payload.startsWith(AUTH_PREFIX)) {
      const token = payload.slice(AUTH_PREFIX.length);
      if (token.length >= 10 && ctx.from) {
        const user = await userService.upsertFromTelegramLogin({
          telegramId: BigInt(ctx.from.id),
          firstName: ctx.from.first_name ?? null,
          username: ctx.from.username ?? null,
        });
        const linked = await nativeAuthTokenService.linkTokenToUser(token, user.id);
        if (linked) {
          await ctx.reply("Вы успешно вошли в приложение. Можете вернуться в приложение.");
          return;
        }
        await ctx.reply("Ссылка для входа устарела или уже использована. Запросите вход заново в приложении.");
        return;
      }
    }

    await ctx.reply(BOT_MESSAGES.start, {
      reply_markup: createWebAppKeyboard(webAppUrl),
    });
  });

  return composer;
}
