/**
 * Типы для работы с вопросами (platform-agnostic)
 */

export interface ImportQuestionItemInput {
  question: string;
  answers: string[];
  correct: number;
}

export interface ImportQuestionsPayload {
  difficulty: string;
  questions: ImportQuestionItemInput[];
}

export type ImportQuestionsInput =
  | ImportQuestionsPayload
  | ImportQuestionsPayload[]
  | { payloads: ImportQuestionsPayload[] };

export interface ImportQuestionsResult {
  ok: true;
  createdQuestions: number;
  createdAnswers: number;
}

export interface ImportQuestionsError {
  ok: false;
  error: string;
}

export interface QuestionAnswerDto {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDto {
  id: number;
  difficulty: string;
  text: string;
  createdAt: string;
  answers: QuestionAnswerDto[];
}

export interface GetQuestionsInput {
  difficulty?: string;
  limit?: number;
  offset?: number;
}

export interface GetQuestionsResult {
  ok: true;
  questions: QuestionDto[];
  nextOffset: number;
  hasMore: boolean;
}

export interface GetQuestionsError {
  ok: false;
  error: string;
}
