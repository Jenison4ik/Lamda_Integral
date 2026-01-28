/**
 * Контроллер вопросов (platform-agnostic)
 *
 * Ответственность:
 * - Оркестрация логики
 * - Преобразование входных/выходных данных
 * - Обработка доменных ошибок
 *
 * ❌ НЕ зависит от Vercel/Express/HTTP-специфики
 */

import { questionService } from "../services/question.service.js";
import {
  ImportQuestionsInput,
  ImportQuestionsPayload,
  ImportQuestionsResult,
  ImportQuestionsError,
  GetQuestionsInput,
  GetQuestionsResult,
  GetQuestionsError,
} from "../types/question.types.js";
import { ControllerResult } from "../types/common.types.js";
import { AppError, ValidationError } from "../errors/app.errors.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeTextArray = (value: unknown, label: string): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`Поле ${label} должно быть непустым массивом.`);
  }
  const cleaned = value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new ValidationError(
        `Поле ${label}[${index + 1}] должно быть непустой строкой.`,
      );
    }
    return item.trim();
  });
  return cleaned;
};

const validatePayloads = (payloads: unknown[]): ImportQuestionsPayload[] => {
  if (payloads.length === 0) {
    throw new ValidationError("Передан пустой список вопросов.");
  }

  return payloads.map((payload, payloadIndex) => {
    if (!isRecord(payload)) {
      throw new ValidationError(
        `Элемент #${payloadIndex + 1} должен быть объектом.`,
      );
    }

    const difficulty = payload.difficulty;
    if (typeof difficulty !== "string" || !difficulty.trim()) {
      throw new ValidationError(
        `Элемент #${payloadIndex + 1}: поле difficulty обязательно и должно быть строкой.`,
      );
    }

    const rawQuestions = payload.questions;
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new ValidationError(
        `Элемент #${payloadIndex + 1}: поле questions должно быть непустым массивом.`,
      );
    }

    const questions = rawQuestions.map((question, questionIndex) => {
      if (!isRecord(question)) {
        throw new ValidationError(
          `Вопрос #${questionIndex + 1} должен быть объектом.`,
        );
      }

      const text = question.question;
      if (typeof text !== "string" || !text.trim()) {
        throw new ValidationError(
          `Вопрос #${questionIndex + 1}: поле question обязательно.`,
        );
      }

      const answers = normalizeTextArray(
        question.answers,
        `answers (вопрос #${questionIndex + 1})`,
      );

      const correct = question.correct;
      if (typeof correct !== "number" || !Number.isInteger(correct)) {
        throw new ValidationError(
          `Вопрос #${questionIndex + 1}: поле correct должно быть целым числом.`,
        );
      }
      if (correct < 0 || correct >= answers.length) {
        throw new ValidationError(
          `Вопрос #${questionIndex + 1}: поле correct выходит за пределы answers.`,
        );
      }

      return {
        question: text.trim(),
        answers,
        correct,
      };
    });

    return {
      difficulty: difficulty.trim(),
      questions,
    };
  });
};

const normalizeInput = (
  input: ImportQuestionsInput,
): ImportQuestionsPayload[] => {
  if (Array.isArray(input)) {
    return validatePayloads(input);
  }
  if (isRecord(input)) {
    if (Array.isArray(input.payloads)) {
      return validatePayloads(input.payloads);
    }
    if ("difficulty" in input && "questions" in input) {
      return validatePayloads([input]);
    }
  }
  throw new ValidationError(
    "Ожидается объект с difficulty/questions или массив таких объектов.",
  );
};

/**
 * Импорт вопросов
 */
export async function importQuestions(
  input: ImportQuestionsInput,
): Promise<ControllerResult<ImportQuestionsResult | ImportQuestionsError>> {
  try {
    const payloads = normalizeInput(input);
    const stats = await questionService.importQuestions(payloads);

    return {
      status: 201,
      data: {
        ok: true,
        createdQuestions: stats.createdQuestions,
        createdAnswers: stats.createdAnswers,
      },
    };
  } catch (error) {
    console.error("importQuestions error:", error);

    if (error instanceof ValidationError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось импортировать вопросы" },
    };
  }
}

const parseNumberParam = (
  value: unknown,
  fallback: number,
  label: string,
): number => {
  if (value == null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError(
      `Параметр ${label} должен быть целым числом >= 0.`,
    );
  }
  return parsed;
};

/**
 * Получение списка вопросов с пагинацией
 */
export async function getQuestions(
  input: GetQuestionsInput,
): Promise<ControllerResult<GetQuestionsResult | GetQuestionsError>> {
  try {
    const limit = parseNumberParam(input.limit, 30, "limit");
    const offset = parseNumberParam(input.offset, 0, "offset");
    const difficulty =
      typeof input.difficulty === "string" && input.difficulty.trim()
        ? input.difficulty.trim()
        : undefined;

    const questions = await questionService.getQuestions({
      difficulty,
      limit,
      offset,
    });

    return {
      status: 200,
      data: {
        ok: true,
        questions,
        nextOffset: offset + questions.length,
        hasMore: questions.length === limit,
      },
    };
  } catch (error) {
    console.error("getQuestions error:", error);

    if (error instanceof ValidationError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        data: { ok: false, error: error.message },
      };
    }

    return {
      status: 500,
      data: { ok: false, error: "Не удалось получить вопросы" },
    };
  }
}
