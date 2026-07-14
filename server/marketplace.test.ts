import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "test-user",
      name: "TestSammler",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("marketplace router", () => {
  const caller = appRouter.createCaller(createPublicContext());

  it("returns marketplace stats", async () => {
    const stats = await caller.marketplace.getStats();
    expect(stats.totalCards).toBeGreaterThan(0);
    expect(stats.activeListings).toBeGreaterThan(0);
    expect(stats.games.length).toBeGreaterThan(0);
  });

  it("searches cards by game filter", async () => {
    const result = await caller.marketplace.search({ game: "pokemon", limit: 10 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.results.every((r) => r.card.game === "pokemon")).toBe(true);
  });

  it("returns card with listings", async () => {
    const cards = await caller.marketplace.getCards();
    const card = await caller.marketplace.getCard({ cardId: cards[0].id });
    expect(card.card.name).toBeTruthy();
    expect(card.listings.length).toBeGreaterThan(0);
  });

  it("returns seller profile with reviews", async () => {
    const seller = await caller.marketplace.getSeller({ sellerId: 1 });
    expect(seller.seller.name).toBeTruthy();
    expect(seller.reviews.length).toBeGreaterThan(0);
  });

  it("creates listing when authenticated", async () => {
    const authCaller = appRouter.createCaller(createAuthContext());
    const cards = await authCaller.marketplace.getCards();
    const listing = await authCaller.marketplace.createListing({
      cardId: cards[0].id,
      price: 19.99,
      condition: "near_mint",
      language: "DE",
      quantity: 1,
      isFoil: false,
      description: "Test-Angebot in sehr gutem Zustand",
    });
    expect(listing.sellerId).toBe(99);
    expect(listing.price).toBe(19.99);
  });

  it("purchases listing and allows review", async () => {
    const authCaller = appRouter.createCaller(createAuthContext());
    const { listings } = await authCaller.marketplace.getCard({ cardId: "card-002" });
    const active = listings.find((l) => l.status === "active");
    expect(active).toBeTruthy();

    const purchase = await authCaller.marketplace.purchase({ listingId: active!.id });
    expect(purchase.success).toBe(true);

    const review = await authCaller.marketplace.createReview({
      sellerId: active!.sellerId,
      listingId: active!.id,
      rating: 5,
      comment: "Super Verkäufer, schneller Versand!",
    });
    expect(review.rating).toBe(5);
  });
});
