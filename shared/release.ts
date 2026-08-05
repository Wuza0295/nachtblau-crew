/** Single source of truth for Allxion release across Linux · Android · Webspace. */
export const RELEASE = {
  name: "Allxion",
  version: "1.0.0",
  /** ISO date of this platform sync */
  syncedAt: "2026-08-05",
  channels: {
    linux: "dev",
    android: "pwa",
    webspace: "https://nacht-blau.de/allxion/",
  },
} as const;

export type ReleaseInfo = typeof RELEASE;
