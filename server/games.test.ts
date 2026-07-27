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

const mockGame = {
  id: 1,
  title: "Test Game",
  worth: "N/A",
  thumbnail: "https://example.com/thumb.jpg",
  image: "https://example.com/image.jpg",
  description: "A test game",
  platforms: "PC",
  type: "game",
  end_date: "N/A",
  published_date: "2026-01-01",
  open_giveaway_url: "https://example.com/giveaway",
  gamerpower_url: "https://gamerpower.com/giveaway",
  status: "Active",
  users: 100,
};

describe("games.getFreeGames", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns games from GamerPower API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockGame],
      })
    );

    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.games.getFreeGames({ type: "game" });

    expect(result.error).toBeNull();
    expect(result.games).toHaveLength(1);
    expect(result.games[0].title).toBe("Test Game");
    expect(result.games[0].openGiveawayUrl).toBe("https://example.com/giveaway");
  });

  it("returns error when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.games.getFreeGames({});

    expect(result.games).toEqual([]);
    expect(result.error).toContain("API-Fehler");
  });
});
