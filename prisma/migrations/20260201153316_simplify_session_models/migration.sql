/*
  Warnings:

  - You are about to drop the column `correctAnswers` on the `quiz_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `finishedAt` on the `quiz_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `quiz_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `quiz_sessions` table. All the data in the column will be lost.
  - The primary key for the `session_answers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `session_answers` table. All the data in the column will be lost.
  - You are about to drop the column `isCorrect` on the `session_answers` table. All the data in the column will be lost.
  - The primary key for the `session_questions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `session_questions` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quiz_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_quiz_sessions" ("difficulty", "id", "startedAt", "userId") SELECT "difficulty", "id", "startedAt", "userId" FROM "quiz_sessions";
DROP TABLE "quiz_sessions";
ALTER TABLE "new_quiz_sessions" RENAME TO "quiz_sessions";
CREATE TABLE "new_session_answers" (
    "sessionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "chosenOptionId" INTEGER NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("sessionId", "questionId"),
    CONSTRAINT "session_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "quiz_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_answers_chosenOptionId_fkey" FOREIGN KEY ("chosenOptionId") REFERENCES "answer_options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_session_answers" ("answeredAt", "chosenOptionId", "questionId", "sessionId") SELECT "answeredAt", "chosenOptionId", "questionId", "sessionId" FROM "session_answers";
DROP TABLE "session_answers";
ALTER TABLE "new_session_answers" RENAME TO "session_answers";
CREATE TABLE "new_session_questions" (
    "sessionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    PRIMARY KEY ("sessionId", "questionId"),
    CONSTRAINT "session_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "quiz_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_session_questions" ("orderIndex", "questionId", "sessionId") SELECT "orderIndex", "questionId", "sessionId" FROM "session_questions";
DROP TABLE "session_questions";
ALTER TABLE "new_session_questions" RENAME TO "session_questions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
