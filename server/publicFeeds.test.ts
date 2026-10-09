import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EMERGENCY_GAMES,
  fallbackGames,
  filterGames,
  mapGamerPowerPayload,
  parseRssItems,
  resolveArticles,
  resolveGames,
} from "../shared/publicFeeds";

const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Test Gaming News]]></title>
      <link>https://example.com/news/1</link>
      <description><![CDATA[A test article about gaming.]]></description>
      <pubDate>Sat, 11 Jul 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Damn, This Looks So Good People Don&#8217;t Believe It</title>
      <link>https://example.com/news/2</link>
      <description><![CDATA[<img src="https://example.com/cover.jpg" alt="">Kurztext]]></description>
      <pubDate>Fri, 10 Jul 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("öffentliche Feeds", () => {
  it("liest RSS inklusive HTML-Entity und Bild", () => {
    const articles = parseRssItems(rssFeed, "https://kotaku.com/feed");
    expect(articles).toHaveLength(2);
    expect(articles[0]?.title).toBe("Test Gaming News");
    expect(articles[0]?.link).toBe("https://example.com/news/1");
    expect(articles[0]?.source).toBe("Kotaku");
    expect(articles[1]?.title).toContain("Don’t");
    expect(articles[1]?.image).toBe("https://example.com/cover.jpg");
  });

  it("mappt GamerPower und filtert Typ sowie Plattform", () => {
    const games = mapGamerPowerPayload([
      {
        id: 1,
        title: "Steam Spiel",
        worth: "$1",
        thumbnail: "t",
        image: "i",
        description: "Text",
        platforms: "PC, Steam",
        type: "Game",
        end_date: "N/A",
        published_date: "2026-10-08",
        open_giveaway_url: "https://www.gamerpower.com/open/steam",
        gamerpower_url: "https://www.gamerpower.com/steam",
        status: "Active",
        users: 3,
      },
      {
        id: 2,
        title: "Epic Loot",
        platforms: "PC, Epic Games Store",
        type: "Loot",
        open_giveaway_url: "https://www.gamerpower.com/open/loot",
      },
    ]);
    expect(filterGames(games, { type: "game" })).toHaveLength(1);
    expect(filterGames(games, { platform: "epic-games-store" }).map((game) => game.title)).toEqual([
      "Epic Loot",
    ]);
    expect(mapGamerPowerPayload({ status: 0 })).toEqual([]);
  });

  it("bevorzugt tRPC und fällt sonst auf Live-Daten oder den Schnappschuss zurück", () => {
    const live = [EMERGENCY_GAMES[1]!];
    const snapshot = [EMERGENCY_GAMES[0]!];
    expect(
      resolveGames({
        trpcReady: true,
        trpcGames: [EMERGENCY_GAMES[2]!],
        liveGames: live,
        snapshotGames: snapshot,
      })
    ).toEqual([EMERGENCY_GAMES[2]]);
    expect(
      resolveGames({
        trpcReady: false,
        trpcGames: [],
        liveGames: live,
        snapshotGames: snapshot,
      })
    ).toEqual(live);
    expect(
      resolveGames({
        trpcReady: false,
        trpcGames: [],
        snapshotGames: snapshot,
      })
    ).toEqual(snapshot);
    expect(fallbackGames([], {})).toEqual(EMERGENCY_GAMES);
    expect(fallbackGames([], { platform: "gog" })).toEqual([]);
  });

  it("zeigt News aus dem Fallback, wenn tRPC leer ist", () => {
    const fallback = parseRssItems(rssFeed, "https://www.pcgamer.com/rss/");
    expect(
      resolveArticles({
        trpcReady: false,
        trpcArticles: [],
        fallback,
        limit: 1,
      })
    ).toHaveLength(1);
    expect(
      resolveArticles({
        trpcReady: true,
        trpcArticles: fallback,
        fallback: [],
        limit: 2,
      })
    ).toHaveLength(2);
  });

  it("entfernt die roten Fehlerkästen von der Startseite", () => {
    const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
    expect(home).not.toContain("konnten nicht geladen werden");
  });
});
