/**
 * Query Keys — ключи для React Query запросов.
 */

export const queryKeys = {
  /** Проверка текущего пользователя в БД (GET /api/users?telegramId=...) */
  checkUser: ["user", "check"] as const,
  // Текущий пользователь (единственный в Mini App)
  currentUser: ["currentUser"] as const,

  // Сессия квиза
  session: ["session"] as const,

  // Вопрос по индексу в сессии
  sessionQuestion: (sessionId: number, index: number) =>
    ["session", sessionId, "question", index] as const,

  // Результаты сессии
  sessionResults: (sessionId: number) =>
    ["session", sessionId, "results"] as const,
} as const;
