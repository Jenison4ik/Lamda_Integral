-- Вариант миграции для Turso: существующие сессии получают totalQuestions из подсчёта session_questions
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quiz_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "showAnswersAfterEach" BOOLEAN NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "quiz_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_quiz_sessions" ("id", "userId", "difficulty", "totalQuestions", "showAnswersAfterEach", "startedAt", "finishedAt")
SELECT q.id, q."userId", q.difficulty,
  (SELECT COUNT(*) FROM session_questions sq WHERE sq."sessionId" = q.id),
  0,
  q."startedAt", q."finishedAt"
FROM quiz_sessions q;
DROP TABLE "quiz_sessions";
ALTER TABLE "new_quiz_sessions" RENAME TO "quiz_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
