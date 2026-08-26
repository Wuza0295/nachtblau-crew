import { getLoginUrl, isOAuthConfigured } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import {
  ensureSeedAdmin,
  getAuthVersion,
  getSession,
  logoutAndNotify,
  subscribeAuth,
  type SessionUser,
} from "@/lib/localAuthStore";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  useEffect(() => {
    void ensureSeedAdmin();
  }, []);

  const localVersion = useSyncExternalStore(subscribeAuth, getAuthVersion, getAuthVersion);
  const localUser = useMemo(() => {
    void localVersion;
    return getSession();
  }, [localVersion]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    logoutAndNotify();
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      // OAuth may be unavailable on static hosting – local logout is enough
    } finally {
      utils.auth.me.setData(undefined, null);
      try {
        await utils.auth.me.invalidate();
      } catch {
        /* ignore */
      }
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const oauthUser = meQuery.data ?? null;
    const user: SessionUser | (typeof oauthUser) = oauthUser
      ? {
          id: oauthUser.id,
          name: oauthUser.name ?? "User",
          email: oauthUser.email ?? "",
          openId: oauthUser.openId,
          loginMethod: "oauth" as const,
          role: (oauthUser.role === "admin" ? "admin" : "user") as "admin" | "user",
          createdAt: oauthUser.createdAt ? new Date(oauthUser.createdAt) : new Date(),
          updatedAt: oauthUser.updatedAt ? new Date(oauthUser.updatedAt) : new Date(),
          lastSignedIn: oauthUser.lastSignedIn
            ? new Date(oauthUser.lastSignedIn)
            : new Date(),
        }
      : localUser;

    if (typeof window !== "undefined") {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    }

    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      oauthConfigured: isOAuthConfigured(),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    localUser,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;

    const target = redirectPath ?? (isOAuthConfigured() ? getLoginUrl() : "/anmelden");
    if (window.location.pathname === target) return;
    if (target.startsWith("http")) {
      window.location.href = target;
    } else {
      window.location.href = target;
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
