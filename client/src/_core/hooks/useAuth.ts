import { getLoginUrl, isOAuthConfigured } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

const DEMO_USER_KEY = "autic-demo-user";

export type DemoUser = {
  id: number;
  name: string;
  email: string;
};

function readDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function startDemoSession(name = "DemoSammler") {
  const user: DemoUser = {
    id: 99,
    name,
    email: "demo@autic-tresures.local",
  };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  return user;
}

export function clearDemoSession() {
  localStorage.removeItem(DEMO_USER_KEY);
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const [demoUser, setDemoUser] = useState<DemoUser | null>(() => readDemoUser());

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
    clearDemoSession();
    setDemoUser(null);
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const loginDemo = useCallback(() => {
    const user = startDemoSession();
    setDemoUser(user);
  }, []);

  const state = useMemo(() => {
    const oauthUser = meQuery.data ?? null;
    const user = oauthUser
      ? oauthUser
      : demoUser
        ? {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            openId: "demo",
            loginMethod: "demo",
            role: "user" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
          }
        : null;

    localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));

    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
      isDemo: Boolean(demoUser) && !oauthUser,
      oauthConfigured: isOAuthConfigured(),
      loginDemo,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    demoUser,
    loginDemo,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;

    const target = redirectPath ?? getLoginUrl();
    if (window.location.pathname === target) return;

    window.location.href = target;
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
