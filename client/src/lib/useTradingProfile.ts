import { useCallback, useSyncExternalStore } from "react";
import {
  getTradingProfile,
  isTradingProfileComplete,
  saveTradingProfile,
  type TradingProfile,
} from "./userProfileStore";

let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return version;
}

export function useTradingProfile(userId: number | undefined | null) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const profile = getTradingProfile(userId);
  const isComplete = isTradingProfileComplete(profile);

  const save = useCallback(
    (input: { displayName: string; country: string; city: string; avatarUrl?: string }) => {
      if (!userId) throw new Error("Nicht angemeldet");
      const next = saveTradingProfile(userId, input);
      emit();
      return next;
    },
    [userId]
  );

  return { profile, isComplete, save } as {
    profile: TradingProfile | null;
    isComplete: boolean;
    save: typeof save;
  };
}

export function profileSetupPath(returnTo?: string) {
  const q = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
  return `/profil-erstellen${q}`;
}
