/**
 * React Query хуки для работы с пользователем.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  ensureUser,
  checkUser,
  type EnsureUserResult,
  type CheckUserResult,
} from "@/service/users";

/**
 * useEnsureUser — инициализация текущего пользователя (POST /api/users).
 * После успеха кладёт user в кэш по queryKeys.currentUser.
 */
export function useEnsureUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ensureUser,
    onSuccess: (data) => {
      if (data.ok && data.user) {
        queryClient.setQueryData(queryKeys.currentUser, data.user);
      }
    },
    retry: false,
  });
}

/**
 * useCurrentUser — чтение текущего пользователя из кэша (без запроса).
 */
export function useCurrentUser<TUser = unknown>() {
  return useQuery<TUser | undefined>({
    queryKey: queryKeys.currentUser,
    queryFn: () => undefined,
    staleTime: Infinity,
    enabled: false,
  });
}

/**
 * useCheckUser — проверка наличия текущего пользователя в БД (GET /api/users?telegramId=...).
 * Запрос выполняется с подписанным initData; кэш по queryKeys.checkUser, без ретраев.
 */
export function useCheckUser() {
  return useQuery({
    queryKey: queryKeys.checkUser,
    queryFn: checkUser,
    staleTime: Infinity,
    retry: false,
  });
}

export type { EnsureUserResult, CheckUserResult };
