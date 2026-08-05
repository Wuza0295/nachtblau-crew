import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { resonanceScore } from "@shared/social";

function createCaller() {
  return appRouter.createCaller({
    user: null,
    req: { headers: {}, protocol: "http", hostname: "localhost" } as never,
    res: { clearCookie: () => undefined } as never,
  });
}

describe("social portal", () => {
  it("exposes five moods", async () => {
    const caller = createCaller();
    const moods = await caller.social.moods();
    expect(moods).toHaveLength(5);
    expect(moods.map((m) => m.id)).toEqual([
      "nah",
      "gespraech",
      "entdecken",
      "kreise",
      "fokus",
    ]);
  });

  it("returns mood-specific feeds", async () => {
    const caller = createCaller();
    const closeFeed = await caller.social.feed({ mood: "nah" });
    const talkFeed = await caller.social.feed({ mood: "gespraech" });
    const focusFeed = await caller.social.feed({ mood: "fokus" });
    expect(closeFeed.length).toBeGreaterThan(0);
    expect(talkFeed.length).toBeGreaterThan(0);
    expect(focusFeed.some((p) => p.kind === "longform" || p.mood === "fokus")).toBe(
      true
    );
    expect(closeFeed[0]).toHaveProperty("author");
    expect(closeFeed[0]).toHaveProperty("score");
  });

  it("weights resonance toward replies and shares", () => {
    const likeHeavy = resonanceScore({
      reacts: 100,
      replies: 0,
      saves: 0,
      shares: 0,
    });
    const replyHeavy = resonanceScore({
      reacts: 10,
      replies: 30,
      saves: 5,
      shares: 5,
    });
    expect(replyHeavy).toBeGreaterThan(likeHeavy);
  });

  it("lists circles with rooms", async () => {
    const caller = createCaller();
    const list = await caller.social.circles();
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list[0].rooms.length).toBeGreaterThan(0);
    const detail = await caller.social.circleBySlug({ slug: list[0].slug });
    expect(detail?.name).toBe(list[0].name);
  });

  it("creates posts and resonates", async () => {
    const caller = createCaller();
    const post = await caller.social.createPost({
      kind: "text",
      mood: "gespraech",
      body: "Testbeitrag fuer Cadence",
      tags: ["test"],
    });
    expect(post.body).toContain("Testbeitrag");
    expect(post.score).toBe(0);
    const updated = await caller.social.resonate({
      postId: post.id,
      type: "shares",
    });
    expect(updated.resonance.shares).toBe(1);
    expect(updated.score).toBe(4);
  });

  it("documents platform research features", async () => {
    const caller = createCaller();
    const features = await caller.social.features();
    expect(features.some((f) => f.from === "Bluesky")).toBe(true);
    expect(features.some((f) => f.from === "BeReal")).toBe(true);
    expect(features.length).toBeGreaterThanOrEqual(7);
  });

  it("loads profile by handle", async () => {
    const caller = createCaller();
    const profile = await caller.social.profile({ handle: "mira" });
    expect(profile?.user.name).toBe("Mira Sol");
    expect(profile?.posts.length).toBeGreaterThan(0);
  });

  it("sends direct messages", async () => {
    const caller = createCaller();
    const before = await caller.social.messages({ conversationId: 1 });
    const msg = await caller.social.sendMessage({
      conversationId: 1,
      body: "Hallo aus dem Test",
    });
    expect(msg.body).toBe("Hallo aus dem Test");
    const after = await caller.social.moments();
    const messagesAfter = await caller.social.messages({ conversationId: 1 });
    expect(messagesAfter.length).toBe(before.length + 1);
    expect(after.length).toBeGreaterThan(0);
  });
});
