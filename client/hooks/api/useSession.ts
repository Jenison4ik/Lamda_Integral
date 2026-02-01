import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSession } from "@/service/session";
import { queryKeys } from "./queryKeys";

// Тип сессии (подстрой под свой бэкенд)
export interface QuizSession {
  id: number;
  totalQuestions: number;
  difficulty: string;
  questions: unknown[]; // подстрой тип
  currentIndex: number;
  // ...
}

/**
 * useCreateSession - создание новой сессии квиза.
 *
 * Вызывается в QuizSettings при нажатии "Поехали".
 * При успехе сохраняет сессию в кэш — QuizScreen читает её оттуда.
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      // Сохраняем сессию в кэш React Query
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
}

/**
 * useCurrentSession - получить текущую сессию из кэша.
 *
 * Используется в QuizScreen для отображения вопросов.
 */
export function useCurrentSession() {
  return useQuery<QuizSession | null>({
    queryKey: queryKeys.session,
    // Не делаем запрос — только читаем из кэша
    queryFn: () => null,
    staleTime: Infinity,
    // Отключаем автоматический запрос
    enabled: false,
    // Инициализируем как null если нет в кэше
    initialData: null,
  });
}
