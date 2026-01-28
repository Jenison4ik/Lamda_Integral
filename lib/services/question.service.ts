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

export const questionService = {
  importQuestions,
};
