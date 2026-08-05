import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "http", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("social router", () => {
  it("returns feed for signal lens", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.social.feed({ lens: "signal" });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.meta?.id).toBe("signal");
    expect(result.items[0].reasons?.length).toBeGreaterThan(0);
  });

  it("creates a thought post", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const post = await caller.social.createPost({
      body: "Router-Test Post",
      kind: "thought",
      topics: ["tech"],
    });
    expect(post.body).toBe("Router-Test Post");
    expect(post.author.handle).toBe("you");
  });

  it("lists circles and dna", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const circles = await caller.social.circles();
    const dna = await caller.social.dna();
    expect(circles.length).toBeGreaterThan(0);
    expect(dna.length).toBeGreaterThan(5);
  });
});
