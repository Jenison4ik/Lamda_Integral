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

/**
 * Получает вопрос по индексу в сессии.
 * Возвращает вопрос с ответами (без isCorrect — безопасность).
 */
export async function getQuestionByIndex(sessionId: number, index: number) {
  // Получаем связь сессия-вопрос по индексу
  const sessionQuestion = await prisma.sessionQuestion.findFirst({
    where: {
      sessionId,
      orderIndex: index,
    },
    include: {
      question: {
        include: {
          answerOptions: true,
        },
      },
    },
  });

  if (!sessionQuestion) {
    return null;
  }

  // Получаем общее количество вопросов в сессии
  const totalQuestions = await prisma.sessionQuestion.count({
    where: { sessionId },
  });

  return {
    question: sessionQuestion.question,
    index,
    totalQuestions,
    isLast: index === totalQuestions - 1,
  };
}

/**
 * Сохраняет ответ пользователя на вопрос.
 * Возвращает правильность ответа.
 */
export async function submitAnswer(
  sessionId: number,
  questionId: number,
  answerId: number,
) {
  // Проверяем, что ответ принадлежит вопросу
  const answerOption = await prisma.answerOption.findFirst({
    where: {
      id: answerId,
      questionId,
    },
  });

  if (!answerOption) {
    throw new ValidationError("Ответ не принадлежит данному вопросу");
  }

  // Проверяем, что вопрос входит в сессию
  const sessionQuestion = await prisma.sessionQuestion.findFirst({
    where: {
      sessionId,
      questionId,
    },
  });

  if (!sessionQuestion) {
    throw new ValidationError("Вопрос не входит в данную сессию");
  }

  // Сохраняем ответ (upsert — если уже отвечал, перезаписываем)
  await prisma.sessionAnswer.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId,
      },
    },
    update: {
      chosenOptionId: answerId,
      answeredAt: new Date(),
    },
    create: {
      sessionId,
      questionId,
      chosenOptionId: answerId,
    },
  });

  // Находим правильный ответ
  const correctAnswer = await prisma.answerOption.findFirst({
    where: {
      questionId,
      isCorrect: true,
    },
  });

  return {
    isCorrect: answerOption.isCorrect,
    correctAnswerId: correctAnswer?.id ?? answerId,
  };
}
