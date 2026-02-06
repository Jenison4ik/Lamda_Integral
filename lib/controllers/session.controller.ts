/**
 * Контроллер сессий (platform-agnostic)
 *
 * Ответственность:
 * - Оркестрация логики
 * - Преобразование входных/выходных данных
 * - Обработка доменных ошибок
 *
 * ❌ НЕ зависит от Vercel/Express/HTTP-специфики
 */

import * as sessionService from "../services/session.service.js";
import {
  CreateSessionInput,
  CreateSessionResult,
  CreateSessionError,
  GetLastActiveSessionResult,
  SessionDto,
  SessionQuestionResult,
  SubmitAnswerResult,
  SessionResultsResult,
} from "../types/session.types.js";
import { ControllerResult } from "../types/common.types.js";
import { AppError } from "../errors/app.errors.js";

/**
 * Преобразует сессию из Prisma в DTO для API.
 * totalQuestions — единственный источник правды: длина questionIds (session_questions).
 */
function toSessionDto(session: {
  id: number;
  userId: number;
  difficulty: string;
  showAnswersAfterEach?: boolean;
  startedAt: Date;
  finishedAt?: Date | null;
  questions?: { questionId: number; orderIndex: number }[];
}): SessionDto {
  const questionIds = (session.questions ?? [])
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((sq) => sq.questionId);
  return {
    id: session.id,
    userId: session.userId,
    difficulty: session.difficulty,
    totalQuestions: questionIds.length,
    showAnswersAfterEach: session.showAnswersAfterEach ?? false,
    questionIds,
    startedAt: session.startedAt.toISOString(),
    finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
  };
}

/**
 * Создание новой сессии
 *
 * @param input - Данные для создания сессии
 * @returns ControllerResult с результатом операции
 */
export async function createSession(
  input: CreateSessionInput,
): Promise<ControllerResult<CreateSessionResult | CreateSessionError>> {
  try {
    const session = await sessionService.create(input);

    return {
      status: 201,
      data: { ok: true, session: toSessionDto(session) },
    };
  } catch (error) {
    console.error("createSession error:", error);

    // Обработка известных доменных ошибок
    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    // Неизвестная ошибка
    return {
      status: 500,
      data: { ok: false, error: "Не удалось создать сессию" },
    };
  }
}

/**
 * Получение последней активной (незавершённой) сессии пользователя
 *
 * @param userId - ID пользователя
 * @returns ControllerResult с сессией или ошибкой (404 если не найдена)
 */
export async function getLastActiveSession(
  userId: number,
): Promise<ControllerResult<GetLastActiveSessionResult | CreateSessionError>> {
  try {
    const session = await sessionService.getLastActiveSession(userId);

    if (!session) {
      return {
        status: 404,
        data: { ok: false, error: "Сессия не найдена" },
      };
    }

    return {
      status: 200,
      data: { ok: true, session: toSessionDto(session) },
    };
  } catch (error) {
    console.error("getLastActiveSession error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: {
        ok: false,
        error: "Не удалось получить последнюю активную сессию",
      },
    };
  }
}

/**
 * Получение вопроса по индексу в сессии.
 * Ответы возвращаются БЕЗ isCorrect — защита от жульничества.
 */
export async function getQuestion(
  sessionId: number,
  index: number,
): Promise<ControllerResult<SessionQuestionResult | CreateSessionError>> {
  try {
    const result = await sessionService.getQuestionByIndex(sessionId, index);

    if (!result) {
      return {
        status: 404,
        data: { ok: false, error: "Вопрос не найден" },
      };
    }

    // Преобразуем в DTO без isCorrect
    const questionDto = {
      id: result.question.id,
      text: result.question.text,
      answers: result.question.answerOptions.map((a) => ({
        id: a.id,
        text: a.text,
        // isCorrect намеренно НЕ передаём
      })),
    };

    return {
      status: 200,
      data: {
        ok: true,
        question: questionDto,
        index: result.index,
        isLast: result.isLast,
      },
    };
  } catch (error) {
    console.error("getQuestion error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось получить вопрос" },
    };
  }
}

/**
 * Отправка ответа на вопрос.
 * Сохраняет ответ и возвращает правильность.
 */
export async function submitAnswer(
  sessionId: number,
  questionId: number,
  answerId: number,
): Promise<ControllerResult<SubmitAnswerResult | CreateSessionError>> {
  try {
    const result = await sessionService.submitAnswer(
      sessionId,
      questionId,
      answerId,
    );

    return {
      status: 200,
      data: {
        ok: true,
        isCorrect: result.isCorrect,
        correctAnswerId: result.correctAnswerId,
      },
    };
  } catch (error) {
    console.error("submitAnswer error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось сохранить ответ" },
    };
  }
}

/**
 * Получение результатов сессии (ответы и правильность).
 */
export async function getResults(
  sessionId: number,
): Promise<ControllerResult<SessionResultsResult | CreateSessionError>> {
  try {
    const result = await sessionService.getResults(sessionId);

    if (!result) {
      return {
        status: 404,
        data: { ok: false, error: "Сессия не найдена" },
      };
    }

    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    console.error("getResults error:", error);

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось получить результаты" },
    };
  }
}
