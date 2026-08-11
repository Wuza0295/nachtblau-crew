import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiPost } from "@hybrixon/contracts";
import { api } from "./api";

const FEED_CACHE_KEY = "hybrixon:feed:v1";
const FEED_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

interface CachedFeed {
  cachedAt: number;
  posts: ApiPost[];
}

export async function readFeedCache(): Promise<ApiPost[]> {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return [];
    const cached = JSON.parse(raw) as Partial<CachedFeed>;
    if (
      !Array.isArray(cached.posts)
      || typeof cached.cachedAt !== "number"
      || Date.now() - cached.cachedAt > FEED_CACHE_MAX_AGE_MS
    ) {
      return [];
    }
    return cached.posts;
  } catch {
    return [];
  }
}

export async function refreshFeedCache(): Promise<ApiPost[]> {
  const posts = (await api.feed()).posts;
  const cached: CachedFeed = { cachedAt: Date.now(), posts };
  await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(cached));
  return posts;
}
