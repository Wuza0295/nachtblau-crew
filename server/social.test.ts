import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { resetSocialState } from "./social";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("social portal", () => {
  beforeEach(() => {
    resetSocialState();
  });

  it("returns feed posts for a lens", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const feed = await caller.social.feed({ lens: "pulse" });
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((p) => p.lens === "pulse")).toBe(true);
    expect(feed[0]?.author).toBeTruthy();
  });

  it("toggles signals on a post", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const feed = await caller.social.feed({ lens: "all" });
    const postId = feed[0]!.id;
    const before = feed[0]!.signals.amplify;
    const updated = await caller.social.signal({ postId, signal: "amplify" });
    expect(updated.signals.amplify).toBe(before + 1);
    expect(updated.mySignals).toContain("amplify");
  });

  it("lists circles and joins one", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const circles = await caller.social.circles();
    expect(circles.length).toBeGreaterThan(0);
    const target = circles.find((c) => !c.joined) ?? circles[0]!;
    const toggled = await caller.social.toggleJoin({ circleId: target.id });
    expect(toggled.joined).toBe(!target.joined);
  });

  it("returns circle detail by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const circle = await caller.social.circle({ slug: "slow-cities" });
    expect(circle.name).toBe("Slow Cities");
    expect(circle.posts.length).toBeGreaterThan(0);
  });

  it("updates algorithm mix preferences", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.social.setAlgorithmMix({ mix: 70 });
    expect(result.algorithmMix).toBe(70);
    const prefs = await caller.social.preferences();
    expect(prefs.algorithmMix).toBe(70);
  });

  it("creates a new pulse post", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const post = await caller.social.createPost({
      lens: "pulse",
      body: "Hallo Liora — Testbeitrag für den Pulse-Feed.",
      tags: ["test"],
    });
    expect(post.body).toContain("Hallo Liora");
    expect(post.lens).toBe("pulse");
  });

  it("returns discover payload", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const discover = await caller.social.discover();
    expect(discover.trendingTags.length).toBeGreaterThan(0);
    expect(discover.liveRooms.length).toBeGreaterThan(0);
  });
});
