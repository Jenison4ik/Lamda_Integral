/**
 * React Query хуки для работы с пользователем.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { ensureUser, type EnsureUserResult } from "@/service/users";

/**
 * useEnsureUser - инициализация текущего пользователя (POST запрос).
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
 * useCurrentUser - получить текущего пользователя из кэша.
 */
export function useCurrentUser<TUser = unknown>() {
  return useQuery<TUser | undefined>({
    queryKey: queryKeys.currentUser,
    queryFn: () => undefined,
    staleTime: Infinity,
    enabled: false,
  });
}

export type { EnsureUserResult };
