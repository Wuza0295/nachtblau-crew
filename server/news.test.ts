import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Test Gaming News]]></title>
      <link>https://example.com/news/1</link>
      <description><![CDATA[A test article about gaming.]]></description>
      <pubDate>Sat, 11 Jul 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("news.getNews", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses RSS feeds and returns articles", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => rssFeed,
      })
    );

    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.news.getNews({ category: "pc", limit: 5 });

    expect(result.error).toBeNull();
    expect(result.articles.length).toBeGreaterThan(0);
    expect(result.articles[0].title).toBe("Test Gaming News");
    expect(result.articles[0].link).toBe("https://example.com/news/1");
  });

  it("returns empty articles when feeds fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.news.getNews({ category: "all", limit: 5 });

    expect(result.error).toBeNull();
    expect(result.articles).toEqual([]);
  });
});
