/**
 * Клиентский API для работы с пользователями.
 * Единственная точка вызова /api/users — переиспользуется в хуках и компонентах.
 */

const USERS_API = "/api/users";

export interface EnsureUserPayload {
  telegramId?: number | string;
  username?: string;
}

export type EnsureUserResult = { ok: true; user: unknown } | { ok: false; error: string };

/**
 * Создаёт/обновляет пользователя на бэкенде (POST /api/users).
 * Бросает при сетевой ошибке или невалидном ответе.
 */
export async function ensureUser(payload: EnsureUserPayload = {}): Promise<EnsureUserResult> {
  const response = await fetch(USERS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }

  return data as EnsureUserResult;
}
