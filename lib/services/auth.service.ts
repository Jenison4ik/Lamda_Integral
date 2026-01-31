import { userService } from "./user.service.js";
import { telegramAuthService } from "./telegram-auth.service.js";
import type { UserDto } from "../types/user.types.js";

async function ensureTelegramUser(initData: string): Promise<UserDto> {
  const { user } = telegramAuthService.verifyInitData(initData);

  return userService.create({
    telegramId: user.id,
    username: user.username ?? null,
  });
}

export const authService = {
  ensureTelegramUser,
};
