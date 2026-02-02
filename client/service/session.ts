import { retrieveRawInitData } from "@tma.js/sdk";

export interface CreateSessionInput {
  totalQuestions: number;
  showAnswersAfterEach: boolean; // "every" -> true, "end" -> false
  difficulty?: string;
}

/** Тип ответа от API при создании сессии */
interface CreateSessionResponse {
  ok: true;
  session: {
    id: number;
    difficulty: string;
    totalQuestions: number;
    showAnswersAfterEach: boolean;
    questionIds: number[];
    startedAt: string;
    finishedAt: string | null;
  };
}

/**
 * Создаёт новую сессию квиза (POST /api/session).
 * Пользователь определяется по initData Telegram WebApp.
 * Возвращает SessionDto с currentIndex = 0 (новая сессия).
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
      showAnswersAfterEach: input.showAnswersAfterEach,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? "Не удалось создать сессию");
  }

  const data: CreateSessionResponse = await response.json();

  // Преобразуем в SessionDto для фронта (добавляем currentIndex)
  return {
    id: data.session.id,
    difficulty: data.session.difficulty,
    totalQuestions: data.session.totalQuestions,
    showAnswersAfterEach: data.session.showAnswersAfterEach,
    currentIndex: 0, // новая сессия — начинаем с 0
    startedAt: data.session.startedAt,
    finishedAt: data.session.finishedAt,
  };
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

/**
 * Получает вопрос по индексу в сессии (GET /api/session/:id/question/:index).
 * Ответы приходят БЕЗ isCorrect — защита от жульничества.
 */
export async function getSessionQuestion(sessionId: number, index: number) {
  const response = await fetch(`/api/session/${sessionId}/question/${index}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }

  return data;
}

export interface SubmitAnswerInput {
  sessionId: number;
  questionId: number;
  answerId: number;
}

/**
 * Отправляет ответ на вопрос (POST /api/session/:id/answer).
 * Возвращает isCorrect и correctAnswerId для показа результата.
 */
export async function submitAnswer(input: SubmitAnswerInput) {
  const response = await fetch(`/api/session/${input.sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId: input.questionId,
      answerId: input.answerId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }

  return data;
}

/**
 * Получает результаты завершённой сессии (GET /api/session/:id/results).
 */
export async function getSessionResults(sessionId: number) {
  const response = await fetch(`/api/session/${sessionId}/results`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }

  return data;
}
