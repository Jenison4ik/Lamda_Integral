import { createHmac, timingSafeEqual } from "node:crypto";
import { UnauthorizedError, ValidationError } from "../errors/app.errors.js";

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface TelegramAuthPayload {
  user: TelegramUser;
  authDate: number;
}

function buildDataCheckString(params: URLSearchParams): string {
  return Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token) {
    throw new ValidationError("TELEGRAM_BOT_TOKEN не задан в окружении.");
  }
  return token;
}

function verifySignature(initDataRaw: string): URLSearchParams {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get("hash");
  if (!hash) {
    throw new UnauthorizedError("Отсутствует подпись initData.");
  }

  const dataCheckString = buildDataCheckString(params);
  const secretKey = createHmac("sha256", "WebAppData")
    .update(getBotToken())
    .digest();

  const signature = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (
    hashBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(hashBuffer, signatureBuffer)
  ) {
    throw new UnauthorizedError("Недействительная подпись initData.");
  }

  return params;
}

export function verifyInitData(initDataRaw: string): TelegramAuthPayload {
  if (typeof initDataRaw !== "string" || initDataRaw.trim() === "") {
    throw new ValidationError("initData обязателен.");
  }

  const params = verifySignature(initDataRaw);
  const userRaw = params.get("user");
  if (!userRaw) {
    throw new ValidationError("В initData отсутствует user.");
  }

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    throw new ValidationError("Некорректный user в initData.");
  }

  if (!user?.id || typeof user.id !== "number") {
    throw new ValidationError("В initData отсутствует user.id.");
  }

  const authDateRaw = params.get("auth_date");
  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate)) {
    throw new ValidationError("Некорректный auth_date в initData.");
  }

  return { user, authDate };
}

export const telegramAuthService = {
  verifyInitData,
};
