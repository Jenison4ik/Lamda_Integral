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
import { ImportQuestionsPayload } from "../types/question.types.js";

export interface ImportQuestionsStats {
  createdQuestions: number;
  createdAnswers: number;
}

async function importQuestions(
  payloads: ImportQuestionsPayload[],
): Promise<ImportQuestionsStats> {
  let createdQuestions = 0;
  let createdAnswers = 0;

  const operations = payloads.flatMap((payload) =>
    payload.questions.map((question) => {
      createdQuestions += 1;
      createdAnswers += question.answers.length;

      return prisma.question.create({
        data: {
          difficulty: payload.difficulty,
          text: question.question,
          answerOptions: {
            create: question.answers.map((answer, index) => ({
              text: answer,
              isCorrect: index === question.correct,
            })),
          },
        },
      });
    }),
  );

  if (operations.length === 0) {
    return { createdQuestions: 0, createdAnswers: 0 };
  }

  await prisma.$transaction(operations);

  return { createdQuestions, createdAnswers };
}

export const questionService = {
  importQuestions,
};
