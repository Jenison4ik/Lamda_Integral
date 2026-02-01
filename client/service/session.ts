export interface CreateSessionInput {
  totalQuestions: number;
  showAnswersAfterEach: boolean; // "every" -> true, "end" -> false
}

export async function createSession(input: CreateSessionInput) {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || "Не удалось создать сессию");
  }

  return response.json();
}
