import { useEffect, useRef, useState } from "react";
import { ensureUser, type EnsureUserResult } from "@/service/users";

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
 */
export function useUsersInit(
  options: UseUsersInitOptions = {},
): UseUsersInitReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<EnsureUserResult | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;
    const { logResult: log } = optionsRef.current;

    (async () => {
      try {
        const data = await ensureUser();
        if (cancelled) return;
        setResult(data);
        if (log !== false) {
          console.log("users init result:", data);
        }
      } catch (e) {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        if (log !== false) {
          console.error("users init error:", err);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isReady, error, result };
}
