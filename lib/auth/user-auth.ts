/**
 * JWT для пользователей приложения (Mini App и native Telegram Login).
 * Payload: { userId: number }.
 */

import { createRequire } from "node:module";
import type { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "../errors/app.errors.js";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");

export const USER_TOKEN_EXPIRES_SECONDS = 60 * 60 * 24 * 30; // 30 дней

export type UserTokenPayload = {
  userId: number;
};

export function signUserToken(secret: string, userId: number): string {
  const payload: UserTokenPayload = { userId };
  return jwt.sign(payload, secret, {
    expiresIn: USER_TOKEN_EXPIRES_SECONDS,
  });
}

export function verifyUserToken(
  token: string,
  secret: string,
): UserTokenPayload {
  const decoded = jwt.verify(token, secret) as JwtPayload & UserTokenPayload;
  if (
    !decoded ||
    typeof decoded.userId !== "number" ||
    !Number.isInteger(decoded.userId)
  ) {
    throw new Error("INVALID_USER_TOKEN");
  }
  return { userId: decoded.userId };
}

/**
 * Извлекает Bearer JWT из заголовка Authorization и возвращает userId.
 * Для защиты эндпоинтов: Authorization: Bearer <JWT>.
 * Пример в API: const userId = getUserIdFromBearerToken(req.headers.authorization, process.env.APP_JWT_SECRET!);
 * @throws UnauthorizedError если токен отсутствует или недействителен
 */
export function getUserIdFromBearerToken(
  authorizationHeader: string | undefined,
  secret: string,
): number {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    throw new UnauthorizedError("Отсутствует заголовок Authorization.");
  }
  const [type, token] = authorizationHeader.trim().split(/\s+/);
  if (type !== "Bearer" || !token) {
    throw new UnauthorizedError("Ожидается Authorization: Bearer <token>.");
  }
  try {
    const payload = verifyUserToken(token, secret);
    return payload.userId;
  } catch {
    throw new UnauthorizedError("Недействительный или истёкший токен.");
  }
}
