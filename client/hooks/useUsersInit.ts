import { useEffect, useRef } from "react";
import { useEnsureUser, type EnsureUserResult } from "./api/useUser";

export interface UseUsersInitOptions {
  /** Логировать результат в консоль (по умолчанию true) */
  logResult?: boolean;
}

export interface UseUsersInitReturn {
  /** true после завершения запроса (успех или ошибка) */
  isReady: boolean;
  /** Ошибка запроса, если была */
  error: Error | null;
  /** Результат последнего вызова (для отладки/переиспользования) */
  result: EnsureUserResult | null;
}

/**
 * При монтировании вызывает POST /api/users (ensureUser).
 * Пока isReady === false — показывайте LoadScreen или скелетон.
 * Переиспользуется везде, где нужно "инициализировать пользователя перед контентом".
 *
 * ОБНОВЛЕНО: Теперь использует TanStack React Query под капотом!
 *
 * ПРЕИМУЩЕСТВА React Query:
 * - Автоматическое кэширование результата
 * - Дедупликация запросов (если вызвать из нескольких компонентов)
 * - Встроенная обработка состояний загрузки и ошибок
 * - Данные доступны глобально через queryClient
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isReady, error, result } = useUsersInit({ logResult: true });
 *
 *   if (!isReady) return <LoadScreen />;
 *   if (error) return <ErrorScreen error={error} />;
 *   return <MainApp />;
 * }
 * ```
 */
export function useUsersInit(
  options: UseUsersInitOptions = {},
): UseUsersInitReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Используем React Query mutation для инициализации пользователя
  const {
    mutate: initUser,
    isError,
    isSuccess,
    error: mutationError,
    data,
  } = useEnsureUser();

  // Вызываем мутацию при монтировании
  useEffect(() => {
    initUser(undefined, {
      onSuccess: (result) => {
        if (optionsRef.current.logResult !== false) {
          console.log("users init result:", result);
        }
      },
      onError: (err) => {
        if (optionsRef.current.logResult !== false) {
          console.error("users init error:", err);
        }
      },
    });
  }, [initUser]);

  // Преобразуем состояния React Query в наш интерфейс
  // isReady = true когда запрос завершён (успех или ошибка)
  const isReady = isSuccess || isError;

  // Преобразуем ошибку в Error если она есть
  const error = mutationError
    ? mutationError instanceof Error
      ? mutationError
      : new Error(String(mutationError))
    : null;

  return {
    isReady,
    error,
    result: data ?? null,
  };
}
