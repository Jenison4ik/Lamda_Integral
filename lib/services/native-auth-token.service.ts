/**
 * Временные токены для входа в нативное приложение через deep link.
 * Flow: приложение запрашивает токен → открывает t.me/bot?start=auth_<token> →
 * пользователь нажимает Start → бот привязывает токен к user → приложение получает JWT через poll.
 */

import { prisma } from "../prisma.js";
import { randomBytes } from "node:crypto";
import type { UserDto } from "../types/user.types.js";

const TOKEN_BYTES = 24;
const TTL_MINUTES = 10;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Создаёт временный токен для native auth. Истекает через TTL_MINUTES.
 */
export async function createToken(): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
  await prisma.nativeAuthToken.create({
    data: { token, expiresAt },
  });
  return token;
}

/**
 * Привязывает токен к пользователю (вызывается ботом при /start auth_<token>).
 * Возвращает true, если токен найден и ещё не истёк; иначе false.
 */
export async function linkTokenToUser(
  token: string,
  userId: number,
): Promise<boolean> {
  const normalized = token.trim();
  if (!normalized) return false;
  const now = new Date();
  const existing = await prisma.nativeAuthToken.findFirst({
    where: { token: normalized },
  });
  if (!existing) {
    console.warn("[native-auth] linkTokenToUser: токен не найден в БД, prefix=" + normalized.slice(0, 8) + ". Проверьте, что API и бот используют один DATABASE_URL.");
    return false;
  }
  if (existing.userId != null) {
    console.warn("[native-auth] linkTokenToUser: токен уже привязан к userId=" + existing.userId);
    return true;
  }
  if (existing.expiresAt <= now) {
    console.warn("[native-auth] linkTokenToUser: токен истёк, expiresAt=" + existing.expiresAt.toISOString());
    return false;
  }
  const updated = await prisma.nativeAuthToken.updateMany({
    where: {
      token: normalized,
      userId: null,
      expiresAt: { gt: now },
    },
    data: { userId },
  });
  console.log("[native-auth] linkTokenToUser: userId=" + userId + ", updated rows=" + updated.count);
  return updated.count > 0;
}

/**
 * Если токен привязан к пользователю и не истёк — возвращает userId и удаляет токен (одноразовый).
 * Иначе возвращает null.
 */
export async function consumeTokenAndGetUserId(
  token: string,
): Promise<number | null> {
  const normalized = token.trim();
  if (!normalized) return null;
  const now = new Date();
  const record = await prisma.nativeAuthToken.findUnique({
    where: { token: normalized },
  });
  if (!record || record.expiresAt <= now || record.userId == null) {
    return null;
  }
  await prisma.nativeAuthToken.delete({ where: { token: normalized } });
  return record.userId;
}

export const nativeAuthTokenService = {
  createToken,
  linkTokenToUser,
  consumeTokenAndGetUserId,
};
