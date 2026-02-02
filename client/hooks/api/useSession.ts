import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSession,
  getSessionQuestion,
  submitAnswer,
  getSessionResults,
} from "@/service/session";
import { queryKeys } from "./queryKeys";

// =====================
// Типы для сессии квиза (Lazy Loading)
// =====================

/**
 * Вариант ответа (без isCorrect — безопасность!)
 * Клиент НЕ знает правильный ответ до отправки.
 */
export interface AnswerOptionDto {
  id: number;
  text: string;
  // isCorrect намеренно отсутствует — защита от жульничества
}

/** Вопрос с вариантами ответов */
export interface QuestionDto {
  id: number;
  text: string;
  answers: AnswerOptionDto[];
}

/** Сессия — метаданные (вопросы загружаются отдельно) */
export interface SessionDto {
  id: number;
  difficulty: string;
  totalQuestions: number;
  showAnswersAfterEach: boolean;
  currentIndex: number; // индекс текущего вопроса (на основе answers.length)
  startedAt: string;
  finishedAt: string | null;
}

/** Ответ на GET /api/session/:id/question/:index */
export interface SessionQuestionResponse {
  question: QuestionDto;
  index: number;
  isLast: boolean;
}

/** Payload для POST /api/session/:id/answer */
export interface SubmitAnswerInput {
  questionId: number;
  answerId: number;
}

/** Ответ на POST /api/session/:id/answer */
export interface SubmitAnswerResponse {
  ok: true;
  isCorrect: boolean;
  correctAnswerId: number; // для показа правильного ответа
}

/** Детали ответа в результатах */
export interface SessionResultDetail {
  questionId: number;
  questionText: string;
  chosenAnswerId: number;
  chosenAnswerText: string;
  correctAnswerId: number;
  correctAnswerText: string;
  isCorrect: boolean;
}

/** Ответ на GET /api/session/:id/results */
export interface SessionResultsResponse {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  details: SessionResultDetail[];
}

/**
 * useCreateSession - создание новой сессии квиза.
 *
 * Вызывается в QuizSettings при нажатии "Поехали".
 * При успехе сохраняет сессию в кэш — QuizScreen читает её оттуда.
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      // Сохраняем сессию в кэш React Query
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
}

/**
 * useCurrentSession - получить текущую сессию из кэша.
 *
 * Используется в QuizScreen для получения метаданных сессии.
 */
export function useCurrentSession() {
  return useQuery<SessionDto | null>({
    queryKey: queryKeys.session,
    // Не делаем запрос — только читаем из кэша
    queryFn: () => null,
    staleTime: Infinity,
    // Отключаем автоматический запрос
    enabled: false,
    // Инициализируем как null если нет в кэше
    initialData: null,
  });
}

// =====================
// Хуки для работы с вопросами
// =====================

/**
 * useQuestion - загрузить вопрос по индексу.
 *
 * Ответы приходят БЕЗ isCorrect — защита от жульничества.
 * Используется в QuizScreen для отображения текущего вопроса.
 */
export function useQuestion(sessionId: number | undefined, index: number) {
  return useQuery<SessionQuestionResponse>({
    queryKey: queryKeys.sessionQuestion(sessionId ?? 0, index),
    queryFn: () => getSessionQuestion(sessionId!, index),
    enabled: !!sessionId && index >= 0,
    staleTime: Infinity, // вопросы не меняются
  });
}

/**
 * usePrefetchQuestion - предзагрузить следующий вопрос.
 *
 * Вызывается после загрузки текущего вопроса для плавного UX.
 */
export function usePrefetchQuestion() {
  const queryClient = useQueryClient();

  return (sessionId: number, index: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessionQuestion(sessionId, index),
      queryFn: () => getSessionQuestion(sessionId, index),
      staleTime: Infinity,
    });
  };
}

/**
 * useSubmitAnswer - отправить ответ на вопрос.
 *
 * Сразу сохраняет ответ на сервере (восстановление прогресса).
 * Возвращает isCorrect и correctAnswerId для показа результата.
 *
 * Примечание: currentIndex управляется локально в QuizScreen,
 * чтобы избежать конфликта с useEffect синхронизации.
 */
export function useSubmitAnswer() {
  return useMutation({
    mutationFn: (input: {
      sessionId: number;
      questionId: number;
      answerId: number;
    }) => submitAnswer(input),
  });
}

/**
 * useSessionResults - получить результаты завершённой сессии.
 *
 * Вызывается на ResultScreen после завершения квиза.
 */
export function useSessionResults(sessionId: number | undefined) {
  return useQuery<SessionResultsResponse>({
    queryKey: queryKeys.sessionResults(sessionId ?? 0),
    queryFn: () => getSessionResults(sessionId!),
    enabled: !!sessionId,
  });
}
