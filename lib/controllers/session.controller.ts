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
} from "../types/session.types.js";
import { ControllerResult } from "../types/common.types.js";
import { AppError } from "../errors/app.errors.js";

/**
 * Преобразует сессию из Prisma в DTO для API (questionIds из связи questions)
 */
function toSessionDto(session: {
  id: number;
  userId: number;
  difficulty: string;
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
