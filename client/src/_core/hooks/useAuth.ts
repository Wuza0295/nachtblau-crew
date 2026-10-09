import { LOCAL_LOGIN_PATH } from "@/const";
import { crewLogout, crewMe, type CrewUser } from "@/lib/crewAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export const CREW_ME_KEY = ["crew-auth", "me"] as const;

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: CREW_ME_KEY,
    queryFn: crewMe,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    try {
      await crewLogout();
    } finally {
      queryClient.setQueryData(CREW_ME_KEY, null);
      await queryClient.invalidateQueries({ queryKey: CREW_ME_KEY });
    }
  }, [queryClient]);

  const user = meQuery.data ?? null;

  const state = useMemo(() => {
    return {
      user: user as CrewUser | null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [meQuery.error, meQuery.isLoading, user]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === (redirectPath ?? LOCAL_LOGIN_PATH)) return;
    window.location.href = redirectPath ?? LOCAL_LOGIN_PATH;
  }, [redirectOnUnauthenticated, redirectPath, meQuery.isLoading, state.user]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
