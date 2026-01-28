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

const TRANSACTION_CHUNK_SIZE = 20;

async function importQuestions(
  payloads: ImportQuestionsPayload[],
): Promise<ImportQuestionsStats> {
  let createdQuestions = 0;
  let createdAnswers = 0;

  const operations: ReturnType<typeof prisma.question.create>[] = [];

  for (const payload of payloads) {
    for (const question of payload.questions) {
      createdQuestions += 1;
      createdAnswers += question.answers.length;

      const data = {
        difficulty: payload.difficulty,
        text: question.question,
        answerOptions: {
          create: question.answers.map((answer, index) => ({
            text: answer,
            isCorrect: index === question.correct,
          })),
        },
      } as unknown as Parameters<typeof prisma.question.create>[0]["data"];

      operations.push(prisma.question.create({ data }));

      if (operations.length >= TRANSACTION_CHUNK_SIZE) {
        await prisma.$transaction(operations);
        operations.length = 0;
      }
    }
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return { createdQuestions, createdAnswers };
}

export const questionService = {
  importQuestions,
};
