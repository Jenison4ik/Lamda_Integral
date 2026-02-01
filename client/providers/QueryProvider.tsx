import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * Создание QueryClient с оптимальными настройками по умолчанию.
 *
 * ВАЖНЫЕ НАСТРОЙКИ:
 * - staleTime: время, в течение которого данные считаются "свежими" и не будут перезапрашиваться
 * - gcTime (раньше cacheTime): время хранения неиспользуемых данных в кэше
 * - retry: количество повторных попыток при ошибке
 * - refetchOnWindowFocus: перезапрос при фокусе окна
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Данные свежие 1 минуту - не будет лишних запросов
        staleTime: 1000 * 60 * 1,
        // Кэш хранится 5 минут после размонтирования компонента
        gcTime: 1000 * 60 * 5,
        // 3 повторные попытки с экспоненциальной задержкой
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Не перезапрашиваем при фокусе для мобильного приложения
        refetchOnWindowFocus: false,
        // Перезапрос при восстановлении соединения
        refetchOnReconnect: true,
      },
      mutations: {
        // Мутации не повторяем автоматически
        retry: 0,
      },
    },
  });
}

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider - обёртка для React Query.
 *
 * ПОЧЕМУ useState для QueryClient?
 * При SSR или React Strict Mode компонент может рендериться несколько раз.
 * useState гарантирует, что QueryClient создаётся один раз.
 *
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // useState гарантирует создание одного инстанса QueryClient
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
