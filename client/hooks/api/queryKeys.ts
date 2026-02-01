/**
 * Query Keys — ключи для React Query запросов.
 */

export const queryKeys = {
  // Текущий пользователь (единственный в Mini App)
  currentUser: ["currentUser"] as const,

  // Сессия квиза
  session: ["session"] as const,

  // Вопросы для квиза
  questions: (count: number) => ["questions", count] as const,
} as const;
