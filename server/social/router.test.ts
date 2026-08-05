import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("social router", () => {
  it("returns concept and feed without auth", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const concept = await caller.social.concept();
    const feed = await caller.social.feed({ lens: "pulse", mode: "for-you" });
    expect(concept.workingName).toBe("Aether");
    expect(feed.length).toBeGreaterThan(0);
  });

  it("creates a demo post and fetches it", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const created = await caller.social.createPost({
      kind: "text",
      lenses: ["pulse"],
      body: "Router integration post",
      tags: ["test"],
      asDemo: true,
    });
    const detail = await caller.social.post({ id: created.id });
    expect(detail.post.body).toBe("Router integration post");
  });

  it("lists circles and motion feed", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const circles = await caller.social.circles();
    const motion = await caller.social.motionFeed();
    expect(circles.some((c) => c.slug === "slow-feed")).toBe(true);
    expect(motion.every((p) => p.lenses.includes("motion"))).toBe(true);
  });
});
