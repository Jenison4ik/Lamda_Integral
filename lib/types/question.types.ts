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
