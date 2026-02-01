/*
  Warnings:

  - You are about to drop the column `totalQuestions` on the `quiz_sessions` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quiz_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "showAnswersAfterEach" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "quiz_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_quiz_sessions" ("difficulty", "finishedAt", "id", "showAnswersAfterEach", "startedAt", "userId") SELECT "difficulty", "finishedAt", "id", "showAnswersAfterEach", "startedAt", "userId" FROM "quiz_sessions";
DROP TABLE "quiz_sessions";
ALTER TABLE "new_quiz_sessions" RENAME TO "quiz_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
