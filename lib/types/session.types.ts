export interface CreateSessionInput {
  userId: number;
  difficulty: string;
  totalQuestions: number;
}

export interface SessionDto {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
