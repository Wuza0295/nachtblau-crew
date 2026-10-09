import fs from "node:fs";
import path from "node:path";
import {
  EMPTY_SNAPSHOT,
  FEED_USER_AGENT,
  GAMERPOWER_GIVEAWAYS,
  NEWS_FEEDS,
  type NewsArticle,
  type NewsCategory,
  type PublicSnapshot,
  mapGamerPowerPayload,
  mergeArticles,
  parseRssItems,
} from "../shared/publicFeeds.ts";

const OUT = path.resolve(import.meta.dirname, "../client/src/data/public-feeds.json");
const CATEGORIES = Object.keys(NEWS_FEEDS) as NewsCategory[];

function readPrevious(): PublicSnapshot {
  try {
    const parsed = JSON.parse(fs.readFileSync(OUT, "utf8")) as PublicSnapshot;
    if (!parsed || !Array.isArray(parsed.games) || !parsed.news) return EMPTY_SNAPSHOT;
    return parsed;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": FEED_USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function fetchGames() {
  const url = `${GAMERPOWER_GIVEAWAYS}?sort-by=date`;
  const response = await fetch(url, {
    headers: { "User-Agent": FEED_USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`GamerPower ${response.status}`);
  return mapGamerPowerPayload(await response.json()).slice(0, 30);
}

async function fetchCategory(category: NewsCategory): Promise<NewsArticle[]> {
  const groups = await Promise.all(
    NEWS_FEEDS[category].map(async (url) => {
      try {
        return parseRssItems(await fetchText(url), url);
      } catch (error) {
        console.warn(`Feed übersprungen (${category}): ${url} (${error instanceof Error ? error.message : error})`);
        return [];
      }
    })
  );
  return mergeArticles(groups, 12);
}

async function main() {
  const previous = readPrevious();
  const news = { ...EMPTY_SNAPSHOT.news };

  let games = previous.games;
  try {
    const fresh = await fetchGames();
    if (fresh.length > 0) games = fresh;
    console.log(`Spiele: ${fresh.length}`);
  } catch (error) {
    console.warn(`Spiele behalten den letzten Schnappschuss (${error instanceof Error ? error.message : error})`);
  }

  for (const category of CATEGORIES) {
    const fresh = await fetchCategory(category);
    news[category] = fresh.length > 0 ? fresh : (previous.news[category] ?? []);
    console.log(`News ${category}: ${news[category].length}`);
  }

  const next: PublicSnapshot = {
    generatedAt: new Date().toISOString(),
    games,
    news,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);
  const totalNews = CATEGORIES.reduce((sum, category) => sum + next.news[category].length, 0);
  if (next.games.length === 0 && totalNews === 0) {
    console.error("Kein Schnappschuss erzeugt.");
    process.exitCode = 1;
    return;
  }
  console.log(`Schnappschuss geschrieben: ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
