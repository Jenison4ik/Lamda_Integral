export interface CreateSessionInput {
  userId: number;
  difficulty: string;
  totalQuestions: number;
  /** true: показывать ответы после каждого вопроса, false: в конце квиза */
  showAnswersAfterEach: boolean;
}

/**
 * DTO сессии для API-ответов.
 * questionIds — порядок показа; showAnswersAfterEach — настройка показа ответов.
 */
export interface SessionDto {
  id: number;
  userId: number;
  difficulty: string;
  totalQuestions: number;
  showAnswersAfterEach: boolean;
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
