import { useEffect, useRef } from "react";
import {
  useEnsureUser,
  useCheckUser as useCheckUserQuery,
  type EnsureUserResult,
  type CheckUserResult,
} from "./api/useUser";

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

export interface UseCheckUserOptions {
  /** Логировать результат в консоль (по умолчанию true) */
  logResult?: boolean;
}

export interface UseCheckUserReturn {
  /** true после завершения запроса (успех или ошибка) */
  isReady: boolean;
  /** Ошибка запроса, если была */
  error: Error | null;
  /** Результат проверки: есть ли пользователь в БД */
  result: CheckUserResult | null;
  /** Есть ли пользователь в БД (true только при ok: true) */
  isInDb: boolean;
  /** Состояния TanStack Query для продвинутого использования */
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => void;
}

/**
 * Проверяет, есть ли текущий пользователь в БД (GET /api/users?telegramId=...).
 * Использует TanStack Query под капотом; результат кэшируется.
 * Удобен для экранов, где нужно "проверить пользователя перед действием".
 *
 * @example
 * ```tsx
 * const { isReady, isInDb, error, result, refetch } = useCheckUser({ logResult: true });
 * if (!isReady) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (!isInDb) return <Onboarding />;
 * return <MainContent />;
 * ```
 */
export function useCheckUser(
  options: UseCheckUserOptions = {},
): UseCheckUserReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const {
    data,
    isPending,
    isError,
    isSuccess,
    error: queryError,
    refetch,
  } = useCheckUserQuery();

  const isReady = isSuccess || isError;
  const error = queryError
    ? queryError instanceof Error
      ? queryError
      : new Error(String(queryError))
    : null;

  useEffect(() => {
    if (!isReady || optionsRef.current.logResult === false) return;
    if (isError) {
      console.error("useCheckUser error:", queryError);
    } else if (data) {
      console.log("useCheckUser result:", data);
    }
  }, [isReady, isError, data, queryError]);

  return {
    isReady,
    error,
    result: data ?? null,
    isInDb: data != null && "ok" in data && data.ok === true,
    isPending,
    isError,
    isSuccess,
    refetch,
  };
}