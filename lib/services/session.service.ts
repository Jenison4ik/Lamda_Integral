import { prisma } from "../prisma.js";
import { CreateSessionInput } from "../types/session.types.js";

export async function createSession(input: CreateSessionInput) {
  const session = await prisma.quizSession.create({
    data: {
      userId: input.userId,
      difficulty: input.difficulty,
      totalQuestions: input.totalQuestions,
    },
  });
  return session;
}
