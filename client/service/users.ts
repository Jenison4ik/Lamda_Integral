/**
 * Клиентский API для работы с пользователями.
 * Единственная точка вызова /api/users — переиспользуется в хуках и компонентах.
 */

import { retrieveRawInitData } from "@tma.js/sdk";

const USERS_API = "/api/users";

function getErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string") return err;
  }
  return fallback;
}

export type EnsureUserResult =
  | { ok: true; user: unknown }
  | { ok: false; error: string };

/** Результат проверки пользователя в БД (GET /api/users?telegramId=...) */
export type CheckUserResult =
  | { ok: true; user: { id: number; telegramId: string; username: string | null; lastSeen: string | null; createdAt: string } }
  | { ok: false; error: string };

function getTelegramIdFromInitData(initData: string): string {
  const params = new URLSearchParams(initData);
  const userStr = params.get("user");
  if (!userStr) {
    throw new Error("В initData отсутствует user. Откройте Mini App в Telegram.");
  }
  try {
    const user = JSON.parse(decodeURIComponent(userStr)) as { id?: number };
    if (user?.id == null || typeof user.id !== "number") {
      throw new Error("В initData отсутствует user.id.");
    }
    return String(user.id);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Некорректный user в initData.");
  }
}

/**
 * Создаёт/обновляет пользователя на бэкенде (POST /api/users).
 * Бросает при сетевой ошибке или невалидном ответе.
 */
export async function ensureUser(): Promise<EnsureUserResult> {
  const initData = retrieveRawInitData();
  if (!initData) {
    throw new Error("initData недоступен. Откройте Mini App в Telegram.");
  }

  const response = await fetch(USERS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });

  let data: EnsureUserResult;
  try {
    data = (await response.json()) as EnsureUserResult;
  } catch {
    throw new Error(`Ответ сервера не JSON. HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Ошибка запроса (HTTP ${response.status})`));
  }

  return data;
}

/**
 * Проверяет, есть ли текущий пользователь в БД (GET /api/users?telegramId=...).
 * Использует initData для подписи и извлекает telegramId из него.
 * Бросает при отсутствии initData, сетевой ошибке или 4xx/5xx.
 */
export async function checkUser(): Promise<CheckUserResult> {
  const initData = retrieveRawInitData();
  if (!initData) {
    throw new Error("initData недоступен. Откройте Mini App в Telegram.");
  }

  const telegramId = getTelegramIdFromInitData(initData);
  const url = `${USERS_API}?telegramId=${encodeURIComponent(telegramId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "X-Telegram-Init-Data": initData },
  });

  let data: CheckUserResult;
  try {
    data = (await response.json()) as CheckUserResult;
  } catch {
    throw new Error(`Ответ сервера не JSON. HTTP ${response.status}`);
  }

  // 200 — пользователь найден; 404 — не в БД (ожидаемый ответ)
  if (response.ok || response.status === 404) {
    return data;
  }

  throw new Error(getErrorMessage(data, `Ошибка запроса (HTTP ${response.status})`));
}
