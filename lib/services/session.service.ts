import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { CreateSessionInput } from "../types/session.types.js";
import { ValidationError } from "../errors/app.errors.js";

/**
 * Выбирает случайные вопросы по сложности и количеству, создаёт сессию и связи SessionQuestion (как answerOptions у Question).
 */
export async function create(input: CreateSessionInput) {
  const rows = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT id FROM questions
      WHERE difficulty = ${input.difficulty}
      ORDER BY RANDOM()
      LIMIT ${input.totalQuestions}
    `,
  );

  if (rows.length < input.totalQuestions) {
    throw new ValidationError(
      `Недостаточно вопросов выбранной сложности (есть ${rows.length}, нужно ${input.totalQuestions})`,
    );
  }

  const questionIds = rows.map((r) => r.id);

  const session = await prisma.quizSession.create({
    data: {
      userId: input.userId,
      difficulty: input.difficulty,
      showAnswersAfterEach: input.showAnswersAfterEach,
      questions: {
        create: questionIds.map((questionId, orderIndex) => ({
          questionId,
          orderIndex,
        })),
      },
    },
    include: {
      questions: { orderBy: { orderIndex: "asc" as const } },
    },
  });
  return session;
}

export async function getLastActiveSession(userId: number) {
  const session = await prisma.quizSession.findFirst({
    where: {
      userId,
      finishedAt: null, // сессия ещё не завершена
    },
    include: {
      questions: { orderBy: { orderIndex: "asc" as const } },
    },
  });
  return session ?? null;
}
