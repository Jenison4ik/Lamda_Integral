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
} from "../types/auth.types.js";
import { ControllerResult } from "../types/common.types.js";
import {
  AppError,
  UnauthorizedError,
  ValidationError,
} from "../errors/app.errors.js";
import { authService } from "../services/auth.service.js";

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
