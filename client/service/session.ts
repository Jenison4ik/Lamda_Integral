import { retrieveRawInitData } from "@tma.js/sdk";

export interface CreateSessionInput {
  totalQuestions: number;
  showAnswersAfterEach: boolean; // "every" -> true, "end" -> false
  difficulty?: string;
}

/**
 * Создаёт новую сессию квиза (POST /api/session).
 * Пользователь определяется по initData Telegram WebApp.
 */
export async function createSession(input: CreateSessionInput) {
  const initData = retrieveRawInitData();
  if (!initData) {
    throw new Error("initData недоступен. Откройте Mini App в Telegram.");
  }

  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData,
      totalQuestions: input.totalQuestions,
      difficulty: input.difficulty ?? "medium",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? "Не удалось создать сессию");
  }

  return response.json();
}

/**
 * Получает последнюю активную (незавершённую) сессию пользователя (GET /api/session).
 */
export async function getLastActiveSession(userId: number) {
  const response = await fetch(
    `/api/session?userId=${encodeURIComponent(userId)}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }

  return data;
}
