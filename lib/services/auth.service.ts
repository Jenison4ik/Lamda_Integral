import { userService } from "./user.service.js";
import { telegramAuthService } from "./telegram-auth.service.js";
import { signUserToken } from "../auth/user-auth.js";
import { UnauthorizedError, ValidationError } from "../errors/app.errors.js";
import type { UserDto } from "../types/user.types.js";

async function ensureTelegramUser(initData: string): Promise<UserDto> {
  const { user } = telegramAuthService.verifyInitData(initData);

  return userService.create({
    telegramId: user.id,
    username: user.username ?? null,
    firstName: user.first_name ?? null,
  });
}

/**
 * Mini App: проверка initData, upsert пользователя, выдача JWT.
 * Для POST /auth/webapp → { token }.
 */
async function ensureTelegramUserAndIssueToken(
  initData: string,
): Promise<{ token: string }> {
  const user = await ensureTelegramUser(initData);
  const secret = getAppJwtSecret();
  const token = signUserToken(secret, user.id);
  return { token };
}

function getAppJwtSecret(): string {
  const secret = process.env.APP_JWT_SECRET ?? process.env.JWT_SECRET ?? "";
  if (!secret) {
    throw new ValidationError(
      "APP_JWT_SECRET или JWT_SECRET не задан в окружении.",
    );
  }
  return secret;
}

/**
 * Telegram Login (native): проверка подписи, upsert пользователя, выдача JWT.
 * Возвращает JWT токен для заголовка Authorization: Bearer <token>.
 */
async function telegramLogin(payload: {
  id: number;
  first_name: string;
  username?: string;
  auth_date: number;
  hash: string;
}): Promise<{ token: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!botToken) {
    throw new ValidationError("TELEGRAM_BOT_TOKEN не задан в окружении.");
  }

  const valid = telegramAuthService.verifyTelegramLogin(payload, botToken);
  if (!valid) {
    throw new UnauthorizedError("Недействительная подпись Telegram Login.");
  }

  const user = await userService.upsertFromTelegramLogin({
    telegramId: BigInt(payload.id),
    username: payload.username ?? null,
    firstName: payload.first_name ?? null,
  });

  const secret = getAppJwtSecret();
  const token = signUserToken(secret, user.id);
  return { token };
}

export const authService = {
  ensureTelegramUser,
  ensureTelegramUserAndIssueToken,
  telegramLogin,
};
