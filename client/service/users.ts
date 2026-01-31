/**
 * Клиентский API для работы с пользователями.
 * Единственная точка вызова /api/users — переиспользуется в хуках и компонентах.
 */

import { retrieveRawInitData } from "@tma.js/sdk";

const USERS_API = "/api/users";

export type EnsureUserResult = { ok: true; user: unknown } | { ok: false; error: string };

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }

  return data as EnsureUserResult;
}
