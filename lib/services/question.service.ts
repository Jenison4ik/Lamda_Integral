/**
 * Сервис для работы с вопросами
 *
 * Ответственность:
 * - Работа с Prisma
 * - Бизнес-правила
 * - Транзакции
 *
 * ❌ НЕ знает, что такое HTTP (Request, Response)
 */

import { prisma } from "../prisma.js";
import {
  ImportQuestionsPayload,
  QuestionDto,
} from "../types/question.types.js";

export interface ImportQuestionsStats {
  createdQuestions: number;
  createdAnswers: number;
}

interface GetQuestionsParams {
  difficulty?: string;
  limit: number;
  offset: number;
}

async function importQuestions(
  payloads: ImportQuestionsPayload[],
): Promise<ImportQuestionsStats> {
  let createdQuestions = 0;
  let createdAnswers = 0;

  for (const payload of payloads) {
    for (const question of payload.questions) {
      createdQuestions += 1;
      createdAnswers += question.answers.length;

      await prisma.$transaction(async (tx) => {
        // В некоторых окружениях типы Prisma клиента могут быть не синхронизированы
        // со схемой, поэтому используем any для операций импорта.
        const txAny = tx as any;
        const created = await txAny.question.create({
          data: {
            difficulty: payload.difficulty,
            text: question.question,
          },
        });

        await txAny.answerOption.createMany({
          data: question.answers.map((answer, index) => ({
            questionId: created.id,
            text: answer,
            isCorrect: index === question.correct,
          })),
        });
      });
    }
  }

  return { createdQuestions, createdAnswers };
}

async function getQuestions(
  params: GetQuestionsParams,
): Promise<QuestionDto[]> {
  const questions = await prisma.question.findMany({
    where: params.difficulty ? { difficulty: params.difficulty } : undefined,
    // orderBy id asc: с Turso/libSQL orderBy "desc" даёт "no such column: desc" (слово в кавычках в SQL).
    // Нужны новые первыми — на клиенте сделать .reverse() или сортировку по id.
    orderBy: { id: "asc" },
    skip: params.offset,
    take: params.limit,
    include: {
      answerOptions: {
        orderBy: { id: "asc" },
      },
    },
  });

  return questions.map((question) => ({
    id: question.id,
    difficulty: question.difficulty,
    text: question.text,
    createdAt: question.createdAt.toISOString(),
    answers: question.answerOptions.map((answer) => ({
      id: answer.id,
      text: answer.text,
      isCorrect: answer.isCorrect,
    })),
  }));
}

export const questionService = {
  importQuestions,
  getQuestions,
};
