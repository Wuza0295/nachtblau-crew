// Build-Zeit-Schnappschuss. scripts/snapshot-public-feeds.ts schreibt die JSON-Datei.
import raw from "./public-feeds.json";
import type { PublicSnapshot } from "@shared/publicFeeds";

export const publicSnapshot = raw as PublicSnapshot;
