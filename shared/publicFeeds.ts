export type FreeGame = {
  id: number;
  title: string;
  worth: string;
  thumbnail: string;
  image: string;
  description: string;
  platforms: string;
  type: string;
  endDate: string;
  publishedDate: string;
  openGiveawayUrl: string;
  gamerPowerUrl: string;
  status: string;
  users: number;
};

export type NewsArticle = {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image: string;
  source: string;
};

export type NewsCategory = "all" | "pc" | "konsolen" | "gaming" | "steam";

export type GameFilter = {
  platform?: string;
  type?: string;
};

export type PublicSnapshot = {
  generatedAt: string | null;
  games: FreeGame[];
  news: Record<NewsCategory, NewsArticle[]>;
};

export const GAMERPOWER_GIVEAWAYS = "https://www.gamerpower.com/api/giveaways";

export const FEED_USER_AGENT =
  "Mozilla/5.0 (compatible; NachtBlauCrew/1.0; +https://nachtblau-crew.de)";

export const NEWS_FEEDS: Record<NewsCategory, readonly string[]> = {
  pc: [
    "https://www.pcgamer.com/rss/",
    "https://feeds.feedburner.com/RockPaperShotgun",
  ],
  konsolen: [
    "https://www.eurogamer.net/feed",
    "https://blog.playstation.com/feed/",
  ],
  gaming: ["https://kotaku.com/feed", "https://www.gamespot.com/feeds/news/"],
  steam: [
    "https://store.steampowered.com/feeds/news/",
    "https://www.pcgamesn.com/mainrss.xml",
  ],
  all: [
    "https://www.pcgamer.com/rss/",
    "https://www.eurogamer.net/feed",
    "https://kotaku.com/feed",
    "https://store.steampowered.com/feeds/news/",
  ],
};

export const EMPTY_SNAPSHOT: PublicSnapshot = {
  generatedAt: null,
  games: [],
  news: { all: [], pc: [], konsolen: [], gaming: [], steam: [] },
};

/** Letzter inhaltlicher Fallback, wenn weder API noch Schnappschuss liefern. */
export const EMERGENCY_GAMES: FreeGame[] = [
  {
    id: 3809,
    title: "Pony Island (Steam) Giveaway",
    worth: "$4.99",
    thumbnail: "https://www.gamerpower.com/offers/1/6ac7d79b50528.jpg",
    image: "https://www.gamerpower.com/offers/1b/6ac7d79b50528.jpg",
    description: "Pony Island ist bei Steam über GamerPower aktuell gratis.",
    platforms: "PC, Steam",
    type: "Game",
    endDate: "2026-10-12 23:59:00",
    publishedDate: "2026-10-08 13:49:15",
    openGiveawayUrl: "https://www.gamerpower.com/open/pony-island-steam-giveaway",
    gamerPowerUrl: "https://www.gamerpower.com/pony-island-steam-giveaway",
    status: "Active",
    users: 10510,
  },
  {
    id: 3807,
    title: "TerraScape (Epic Games) Giveaway",
    worth: "$14.99",
    thumbnail: "https://www.gamerpower.com/offers/1/6ac7b1a7b298e.jpg",
    image: "https://www.gamerpower.com/offers/1b/6ac7b1a7b298e.jpg",
    description: "TerraScape liegt im Epic Games Store als Gratis-Spiel.",
    platforms: "PC, Epic Games Store",
    type: "Game",
    endDate: "2026-10-15 23:59:00",
    publishedDate: "2026-10-08 11:07:19",
    openGiveawayUrl: "https://www.gamerpower.com/open/terrascape-epic-games-giveaway",
    gamerPowerUrl: "https://www.gamerpower.com/terrascape-epic-games-giveaway",
    status: "Active",
    users: 8950,
  },
  {
    id: 3806,
    title: "Out of Sight (Epic Games) Giveaway",
    worth: "$9.99",
    thumbnail: "https://www.gamerpower.com/offers/1/6ac7b0593f3d5.jpg",
    image: "https://www.gamerpower.com/offers/1b/6ac7b0593f3d5.jpg",
    description: "Out of Sight ist im Epic Games Store aktuell kostenlos.",
    platforms: "PC, Epic Games Store",
    type: "Game",
    endDate: "2026-10-15 23:59:00",
    publishedDate: "2026-10-08 11:01:45",
    openGiveawayUrl: "https://www.gamerpower.com/open/out-of-sight-epic-games-giveaway",
    gamerPowerUrl: "https://www.gamerpower.com/out-of-sight-epic-games-giveaway",
    status: "Active",
    users: 9020,
  },
];

export const EMERGENCY_NEWS: NewsArticle[] = [
  {
    id: "pcgamer-pt",
    title: "P.T. auf dem PC: ein Port nach 21 Jahren",
    link: "https://www.pcgamer.com/news/",
    description: "PC Gamer über den Port des einflussreichen Horrorspiels P.T.",
    pubDate: "2026-10-09T00:00:00.000Z",
    image: "",
    source: "PC Gamer",
  },
  {
    id: "eurogamer-dave",
    title: "Dave the Diver und Subnautica 2: ein Crossover",
    link: "https://www.eurogamer.net/",
    description: "Eurogamer berichtet über das Crossover von Dave the Diver und Subnautica 2.",
    pubDate: "2026-10-09T00:00:00.000Z",
    image: "",
    source: "Eurogamer",
  },
  {
    id: "kotaku-gta",
    title: "GTA 6: ein Screenshot, der kaum echt wirkt",
    link: "https://kotaku.com/",
    description: "Kotaku über einen GTA-6-Screenshot, dem viele nicht trauen.",
    pubDate: "2026-10-09T00:00:00.000Z",
    image: "",
    source: "Kotaku",
  },
];

const PLATFORM_NEEDLES: Record<string, string[]> = {
  pc: ["pc"],
  steam: ["steam"],
  "epic-games-store": ["epic"],
  gog: ["gog"],
  android: ["android"],
  ios: ["ios", "iphone"],
};

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stripTags(value: string): string {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const known: Record<string, string> = {
      "pcgamer.com": "PC Gamer",
      "eurogamer.net": "Eurogamer",
      "kotaku.com": "Kotaku",
      "store.steampowered.com": "Steam",
      "steampowered.com": "Steam",
      "feeds.feedburner.com": "Rock Paper Shotgun",
      "gamespot.com": "GameSpot",
      "pcgamesn.com": "PCGamesN",
      "blog.playstation.com": "PlayStation",
    };
    if (known[host]) return known[host];
    const base = host.split(".")[0] ?? "News";
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "News";
  }
}

function stableId(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function textTag(block: string, tagName: string): string {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, "i").exec(block);
  return match ? decodeEntities(match[1]).trim() : "";
}

function extractImage(item: string, html: string): string {
  return (
    /<enclosure\b[^>]*\burl="([^"]+)"/i.exec(item)?.[1] ||
    /<media:(?:content|thumbnail)\b[^>]*\burl="([^"]+)"/i.exec(item)?.[1] ||
    /<img[^>]+src="([^"]+)"/i.exec(html)?.[1] ||
    ""
  );
}

export function mapGamerPowerPayload(data: unknown): FreeGame[] {
  if (!Array.isArray(data)) return [];
  const games: FreeGame[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const game = entry as Record<string, unknown>;
    const title = asString(game.title).trim();
    const openGiveawayUrl = asString(game.open_giveaway_url || game.open_giveaway).trim();
    if (!title || !openGiveawayUrl) continue;
    const id = asNumber(game.id);
    games.push({
      id: id || games.length + 1,
      title,
      worth: asString(game.worth) || "N/A",
      thumbnail: asString(game.thumbnail),
      image: asString(game.image) || asString(game.thumbnail),
      description: stripTags(asString(game.description)).slice(0, 200),
      platforms: asString(game.platforms),
      type: asString(game.type),
      endDate: asString(game.end_date),
      publishedDate: asString(game.published_date),
      openGiveawayUrl,
      gamerPowerUrl: asString(game.gamerpower_url),
      status: asString(game.status),
      users: asNumber(game.users),
    });
  }
  return games;
}

export function gameMatches(game: FreeGame, filter: GameFilter): boolean {
  if (filter.type) {
    const want = filter.type.toLowerCase();
    const got = game.type.toLowerCase();
    if (want === "game" && got !== "game") return false;
    if (want === "loot" && !got.includes("loot") && got !== "dlc") return false;
    if (want === "beta" && !got.includes("beta")) return false;
    if (want !== "game" && want !== "loot" && want !== "beta" && !got.includes(want)) return false;
  }
  if (filter.platform) {
    const hay = game.platforms.toLowerCase();
    const needles = PLATFORM_NEEDLES[filter.platform] ?? [filter.platform.toLowerCase()];
    if (!needles.some((needle) => hay.includes(needle))) return false;
  }
  return true;
}

export function filterGames(games: FreeGame[], filter: GameFilter): FreeGame[] {
  return games.filter((game) => gameMatches(game, filter));
}

export function fallbackGames(games: FreeGame[], filter: GameFilter): FreeGame[] {
  const filtered = filterGames(games, filter);
  if (filtered.length > 0) return filtered;
  if (filter.platform || filter.type) return filtered;
  return EMERGENCY_GAMES;
}

export function fallbackNews(articles: NewsArticle[]): NewsArticle[] {
  return articles.length > 0 ? articles : EMERGENCY_NEWS;
}

export function parseRssItems(xml: string, sourceUrl: string): NewsArticle[] {
  if (!xml) return [];
  const source = sourceName(sourceUrl);
  const articles: NewsArticle[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1] ?? "";
    const title = stripTags(textTag(item, "title"));
    let link = stripTags(textTag(item, "link"));
    if (!link.startsWith("http")) {
      const guid = stripTags(textTag(item, "guid"));
      if (guid.startsWith("http")) link = guid;
    }
    if (!title || !link.startsWith("http")) continue;
    const encoded = textTag(item, "content:encoded");
    const descriptionRaw = textTag(item, "description") || encoded;
    const description = stripTags(descriptionRaw).slice(0, 200);
    const pubDate = stripTags(textTag(item, "pubDate"));
    const image = decodeEntities(extractImage(item, descriptionRaw) || extractImage(item, encoded));
    articles.push({
      id: stableId(link),
      title,
      link,
      description,
      pubDate,
      image,
      source,
    });
  }
  return articles;
}

export function mergeArticles(groups: NewsArticle[][], limit: number): NewsArticle[] {
  const seen = new Set<string>();
  const merged: NewsArticle[] = [];
  for (const group of groups) {
    for (const article of group) {
      if (seen.has(article.link)) continue;
      seen.add(article.link);
      merged.push(article);
    }
  }
  merged.sort((a, b) => {
    const left = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const right = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
  });
  return merged.slice(0, limit);
}

export function resolveGames(input: {
  trpcReady: boolean;
  trpcGames: FreeGame[];
  liveGames?: FreeGame[];
  snapshotGames: FreeGame[];
}): FreeGame[] {
  if (input.trpcReady && input.trpcGames.length > 0) return input.trpcGames;
  if (input.liveGames && input.liveGames.length > 0) return input.liveGames;
  return input.snapshotGames;
}

export function resolveArticles(input: {
  trpcReady: boolean;
  trpcArticles: NewsArticle[];
  fallback: NewsArticle[];
  limit: number;
}): NewsArticle[] {
  const source = input.trpcReady && input.trpcArticles.length > 0 ? input.trpcArticles : input.fallback;
  return source.slice(0, input.limit);
}
