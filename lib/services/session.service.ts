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

  // Если это был последний вопрос — помечаем сессию завершённой
  const answeredCount = await prisma.sessionAnswer.count({
    where: { sessionId },
  });
  const totalInSession = await prisma.sessionQuestion.count({
    where: { sessionId },
  });
  if (answeredCount >= totalInSession) {
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date() },
    });
  }

  return {
    isCorrect: answerOption.isCorrect,
    correctAnswerId: correctAnswer?.id ?? answerId,
  };
}

/**
 * Результат по одному вопросу для экрана результатов.
 */
export interface SessionResultDetailDto {
  questionId: number;
  questionText: string;
  chosenAnswerId: number;
  chosenAnswerText: string;
  correctAnswerId: number;
  correctAnswerText: string;
  isCorrect: boolean;
}

/**
 * Результаты завершённой сессии (для API).
 */
export interface SessionResultsDto {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  details: SessionResultDetailDto[];
}

/**
 * Получает результаты сессии (все ответы + правильные варианты).
 * Сессия может быть ещё не завершена — тогда считаем по уже данным ответам.
 */
export async function getResults(
  sessionId: number,
): Promise<SessionResultsDto | null> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      questions: { orderBy: { orderIndex: "asc" as const }, include: { question: { include: { answerOptions: true } } } },
      answers: {
        include: {
          chosenOption: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const totalQuestions = session.questions.length;
  const answersByQuestion = new Map(
    session.answers.map((a) => [a.questionId, a]),
  );

  let correctAnswers = 0;
  const details: SessionResultDetailDto[] = [];

  for (const sq of session.questions) {
    const q = sq.question;
    const userAnswer = answersByQuestion.get(q.id);
    const correctOption = q.answerOptions.find((o) => o.isCorrect);

    if (!userAnswer) {
      continue; // пропускаем неотвеченные (на случай незавершённой сессии)
    }

    const isCorrect = userAnswer.chosenOption.isCorrect;
    if (isCorrect) correctAnswers++;

    details.push({
      questionId: q.id,
      questionText: q.text,
      chosenAnswerId: userAnswer.chosenOptionId,
      chosenAnswerText: userAnswer.chosenOption.text,
      correctAnswerId: correctOption?.id ?? userAnswer.chosenOptionId,
      correctAnswerText: correctOption?.text ?? userAnswer.chosenOption.text,
      isCorrect,
    });
  }

  const percentage =
    totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    correctAnswers,
    percentage,
    details,
  };
}
