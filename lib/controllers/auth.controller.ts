/**
 * Контроллер авторизации (platform-agnostic)
 *
 * Ответственность:
 * - Оркестрация логики
 * - Преобразование входных/выходных данных
 * - Обработка доменных ошибок
 *
 * ❌ НЕ зависит от Vercel/Express/HTTP-специфики
 */

import { signAdminToken, verifyAdminToken } from "../auth/admin-auth.js";
import {
  AdminLoginInput,
  AdminLoginResult,
  AdminLoginError,
  AdminVerifyResult,
  AdminVerifyError,
  TelegramAuthInput,
  TelegramAuthResult,
  TelegramAuthError,
  TelegramLoginInput,
  TelegramLoginResult,
  TelegramLoginError,
} from "../types/auth.types.js";
import { ControllerResult } from "../types/common.types.js";
import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../errors/app.errors.js";
import { authService } from "../services/auth.service.js";
import { telegramAuthService } from "../services/telegram-auth.service.js";
import { nativeAuthTokenService } from "../services/native-auth-token.service.js";

const getAdminPassword = () => process.env.ADMIN_PASSWORD ?? "";
const getAdminSecret = () => process.env.ADMIN_JWT_SECRET ?? "";

export async function loginAdmin(
  input: AdminLoginInput,
): Promise<ControllerResult<AdminLoginResult | AdminLoginError>> {
  try {
    const password = typeof input.password === "string" ? input.password : "";
    const expectedPassword = getAdminPassword();
    const secret = getAdminSecret();

    if (!expectedPassword) {
      throw new ValidationError("ADMIN_PASSWORD не задан в окружении.");
    }
    if (!secret) {
      throw new ValidationError("ADMIN_JWT_SECRET не задан в окружении.");
    }
    if (!password) {
      throw new ValidationError("Пароль обязателен.");
    }
    if (password !== expectedPassword) {
      throw new UnauthorizedError("Неверный пароль.");
    }

    const { token, expiresIn } = signAdminToken(secret);

    return {
      status: 200,
      data: { ok: true, token, expiresIn },
    };
  } catch (error) {
    console.error("loginAdmin error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось выполнить вход" },
    };
  }
}

export async function verifyAdmin(
  token: string,
): Promise<ControllerResult<AdminVerifyResult | AdminVerifyError>> {
  try {
    const secret = getAdminSecret();
    if (!secret) {
      throw new ValidationError("ADMIN_JWT_SECRET не задан в окружении.");
    }
    if (!token) {
      throw new UnauthorizedError("Отсутствует токен.");
    }

    verifyAdminToken(token, secret);

    return {
      status: 200,
      data: { ok: true },
    };
  } catch (error) {
    console.error("verifyAdmin error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 401,
      data: { ok: false, error: "Недействительный токен" },
    };
  }
}

export async function ensureTelegramUser(
  input: TelegramAuthInput,
): Promise<ControllerResult<TelegramAuthResult | TelegramAuthError>> {
  try {
    const initData = typeof input.initData === "string" ? input.initData : "";
    if (!initData) {
      throw new ValidationError("initData обязателен.");
    }

    const user = await authService.ensureTelegramUser(initData);

    return {
      status: 200,
      data: { ok: true, user },
    };
  } catch (error) {
    console.error("ensureTelegramUser error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось выполнить авторизацию" },
    };
  }
}

/**
 * Проверяет, что запрос от настоящего пользователя Telegram и что запрашиваемый
 * telegramId совпадает с пользователем из подписанного initData.
 * При неверной подписи — UnauthorizedError (401).
 * При запросе данных другого пользователя — ForbiddenError (403, самозванец).
 */
export function verifyTelegramRequest(
  initData: string,
  requestedTelegramId: bigint,
): { user: { id: number } } {
  const payload = telegramAuthService.verifyInitData(initData);
  const fromInitData = BigInt(payload.user.id);
  if (fromInitData !== requestedTelegramId) {
    throw new ForbiddenError(
      "Запрос от имени другого пользователя. Доступ запрещён.",
    );
  }
  return payload;
}

/**
 * Mini App: initData → JWT. POST /auth/webapp.
 */
export async function webappLogin(
  input: TelegramAuthInput,
): Promise<
  ControllerResult<
    { token: string } | TelegramAuthError
  >
> {
  try {
    const initData = typeof input.initData === "string" ? input.initData : "";
    if (!initData) {
      throw new ValidationError("initData обязателен.");
    }
    const { token } = await authService.ensureTelegramUserAndIssueToken(
      initData,
    );
    return { status: 200, data: { token } };
  } catch (error) {
    console.error("webappLogin error:", error);
    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }
    return {
      status: 500,
      data: { ok: false, error: "Не удалось выполнить вход" },
    };
  }
}

export async function telegramLogin(
  input: TelegramLoginInput,
): Promise<
  ControllerResult<TelegramLoginResult | TelegramLoginError>
> {
  try {
    const payload = {
      id: input.id,
      first_name: input.first_name,
      username: input.username,
      auth_date: input.auth_date,
      hash: input.hash,
    };
    const { token } = await authService.telegramLogin(payload);
    return {
      status: 200,
      data: { token },
    };
  } catch (error) {
    console.error("telegramLogin error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось выполнить вход" },
    };
  }
}

/**
 * Native app: запрос временного токена для deep link (t.me/bot?start=auth_<token>).
 */
export async function nativeRequestToken(): Promise<
  ControllerResult<{ token: string } | { ok: false; error: string }>
> {
  try {
    const token = await nativeAuthTokenService.createToken();
    return { status: 200, data: { token } };
  } catch (error) {
    console.error("nativeRequestToken error:", error);
    return {
      status: 500,
      data: { ok: false, error: "Не удалось создать токен" },
    };
  }
}

/**
 * Native app: опрос — привязан ли токен к пользователю (бот обработал /start auth_<token>).
 * Если да — возвращает JWT и потребляет токен.
 */
export async function nativePoll(token: string): Promise<
  ControllerResult<
    | { status: "ok"; token: string }
    | { status: "pending" }
    | { ok: false; error: string }
  >
> {
  try {
    if (!token || typeof token !== "string" || token.length < 10) {
      return {
        status: 400,
        data: { ok: false, error: "Нужен валидный token" },
      };
    }
    const userId = await nativeAuthTokenService.consumeTokenAndGetUserId(token);
    if (userId == null) {
      return { status: 200, data: { status: "pending" } };
    }
    const { token: jwt } = await authService.issueJwtForUserId(userId);
    return { status: 200, data: { status: "ok", token: jwt } };
  } catch (error) {
    console.error("nativePoll error:", error);
    return {
      status: 500,
      data: { ok: false, error: "Ошибка проверки токена" },
    };
  }
}
