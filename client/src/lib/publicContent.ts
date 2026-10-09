import { useQuery } from "@tanstack/react-query";
import {
  GAMERPOWER_GIVEAWAYS,
  type FreeGame,
  type GameFilter,
  type NewsArticle,
  type NewsCategory,
  fallbackGames,
  fallbackNews,
  mapGamerPowerPayload,
  resolveArticles,
  resolveGames,
} from "@shared/publicFeeds";
import { trpc } from "@/lib/trpc";
import { publicSnapshot } from "@/data/publicFeeds";

function cleanFilter(filter: GameFilter): GameFilter {
  return {
    platform: filter.platform || undefined,
    type: filter.type || undefined,
  };
}

export async function loadPublicGames(filter: GameFilter): Promise<FreeGame[]> {
  const normalized = cleanFilter(filter);
  try {
    const url = new URL(GAMERPOWER_GIVEAWAYS);
    url.searchParams.set("sort-by", "date");
    if (normalized.platform) url.searchParams.set("platform", normalized.platform);
    if (normalized.type) url.searchParams.set("type", normalized.type);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(String(response.status));
    const games = mapGamerPowerPayload(await response.json()).slice(0, 20);
    if (games.length > 0) return games;
  } catch {
    // Öffentliche API gerade nicht erreichbar: Schnappschuss oder inhaltlicher Fallback.
  }
  return fallbackGames(publicSnapshot.games, normalized).slice(0, 20);
}

export function snapshotNews(category: NewsCategory): NewsArticle[] {
  return fallbackNews(publicSnapshot.news[category] ?? []);
}

export function useFreeGames(filter: GameFilter) {
  const normalized = cleanFilter(filter);
  const trpcQuery = trpc.games.getFreeGames.useQuery(
    { platform: normalized.platform, type: normalized.type },
    { retry: false, staleTime: 60_000 }
  );
  const liveQuery = useQuery({
    queryKey: ["public-games", normalized.platform ?? "", normalized.type ?? ""],
    queryFn: () => loadPublicGames(normalized),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const snapshot = fallbackGames(publicSnapshot.games, normalized);
  const trpcReady =
    !trpcQuery.isLoading &&
    !trpcQuery.error &&
    !!trpcQuery.data &&
    !trpcQuery.data.error &&
    (trpcQuery.data.games?.length ?? 0) > 0;
  const games = resolveGames({
    trpcReady,
    trpcGames: trpcQuery.data?.games ?? [],
    liveGames: liveQuery.data,
    snapshotGames: snapshot,
  });
  return {
    games,
    isLoading: games.length === 0 && (trpcQuery.isLoading || liveQuery.isLoading),
    isFetching: trpcQuery.isFetching || liveQuery.isFetching,
    refetch: () => {
      void trpcQuery.refetch();
      void liveQuery.refetch();
    },
  };
}

export function useNewsFeed(category: NewsCategory, limit: number) {
  const trpcQuery = trpc.news.getNews.useQuery(
    { category, limit },
    { retry: false, staleTime: 60_000 }
  );
  const trpcReady =
    !trpcQuery.isLoading && !trpcQuery.error && (trpcQuery.data?.articles?.length ?? 0) > 0;
  const articles = resolveArticles({
    trpcReady,
    trpcArticles: trpcQuery.data?.articles ?? [],
    fallback: snapshotNews(category),
    limit,
  });
  return {
    articles,
    isLoading: articles.length === 0 && trpcQuery.isLoading,
    isFetching: trpcQuery.isFetching,
    refetch: () => {
      void trpcQuery.refetch();
    },
  };
}
