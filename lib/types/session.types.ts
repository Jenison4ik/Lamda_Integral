export interface CreateSessionInput {
  userId: number;
  difficulty: string;
  totalQuestions: number;
}

/**
 * DTO сессии для API-ответов.
 * questionIds — порядок показа: вопрос, затем ответы после каждого (или в конце).
 */
export interface SessionDto {
  id: number;
  userId: number;
  difficulty: string;
  totalQuestions: number;
  questionIds: number[];
  startedAt: string;
  finishedAt: string | null;
}

/**
 * Результат создания сессии
 */
export interface CreateSessionResult {
  ok: true;
  session: SessionDto;
}

/**
 * Ошибка создания сессии
 */
export interface CreateSessionError {
  ok: false;
  error: string;
}

/**
 * Результат получения последней активной сессии
 */
export interface GetLastActiveSessionResult {
  ok: true;
  session: SessionDto;
}
