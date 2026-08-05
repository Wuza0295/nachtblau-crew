import { beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { resetStore } from "./store";

function createCtx(user?: TrpcContext["user"]): TrpcContext {
  return {
    req: {} as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
    user: user ?? null,
  };
}

describe("NAH social portal", () => {
  beforeEach(() => {
    resetStore();
  });

  it("returns orbit feed with posts", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.feed.get({ frequency: "orbit" });
    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.meta?.id).toBe("orbit");
  });

  it("returns inner circle moments", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.feed.get({ frequency: "inner" });
    expect(result.posts.some((p) => p.format === "moment" || p.visibility === "inner")).toBe(
      true
    );
  });

  it("ranks drift by transparent score", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.feed.get({ frequency: "drift" });
    expect(result.posts.length).toBeGreaterThan(1);
    const scores = result.posts.map(
      (p) => p.resonateCount + p.saveCount * 2 + p.amplifyCount * 3
    );
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });

  it("lists spaces", async () => {
    const caller = appRouter.createCaller(createCtx());
    const spaces = await caller.space.list();
    expect(spaces.length).toBeGreaterThanOrEqual(4);
    expect(spaces[0]?.slug).toBeTruthy();
  });

  it("gets space by slug with posts", async () => {
    const caller = appRouter.createCaller(createCtx());
    const space = await caller.space.get({ slug: "langsam-internet" });
    expect(space.space.name).toContain("Langsam");
    expect(space.posts.length).toBeGreaterThan(0);
  });

  it("creates a pulse post when authenticated", async () => {
    const user = {
      id: 1,
      openId: "nah-demo-mila",
      name: "Mila Orth",
      email: null,
      loginMethod: "demo",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createCtx(user));
    const post = await caller.post.create({
      format: "pulse",
      content: "Testpuls aus dem Spec.",
      visibility: "orbit",
    });
    expect(post.id).toBeGreaterThan(0);
    expect(post.format).toBe("pulse");
  });

  it("toggles resonate reaction", async () => {
    const user = {
      id: 1,
      openId: "nah-demo-mila",
      name: "Mila Orth",
      email: null,
      loginMethod: "demo",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createCtx(user));
    const first = await caller.post.react({ postId: 3, type: "resonate" });
    // may toggle off if already resonated
    const second = await caller.post.react({ postId: 3, type: "resonate" });
    expect(typeof first.active).toBe("boolean");
    expect(typeof second.active).toBe("boolean");
    expect(first.active).not.toBe(second.active);
  });

  it("enforces inner circle limit of 12", async () => {
    const store = (await import("./store")).getStore();
    // create filler users and fill inner circle
    for (let i = 0; i < 15; i++) {
      store.users.push({
        id: 200 + i,
        openId: `filler-${i}`,
        name: `Filler ${i}`,
        handle: `filler${i}`,
        email: null,
        loginMethod: "demo",
        role: "user",
        avatar: null,
        bio: null,
        vibe: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
    }
    const user = {
      id: 1,
      openId: "nah-demo-mila",
      name: "Mila Orth",
      email: null,
      loginMethod: "demo",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createCtx(user));
    let rejected = false;
    for (let i = 0; i < 15; i++) {
      try {
        await caller.circle.set({ memberId: 200 + i, tier: "inner" });
      } catch {
        rejected = true;
        break;
      }
    }
    const list = await caller.circle.list({ userId: 1 });
    expect(list.innerCount).toBe(12);
    expect(rejected).toBe(true);
  });

  it("returns concept manifesto", async () => {
    const caller = appRouter.createCaller(createCtx());
    const concept = await caller.meta.concept();
    expect(concept.manifesto.points.length).toBeGreaterThanOrEqual(5);
    expect(concept.frequencies).toHaveLength(4);
  });

  it("loads profile with stats", async () => {
    const caller = appRouter.createCaller(createCtx());
    const profile = await caller.profile.get({ userId: 1 });
    expect(profile.user.handle).toBe("mila");
    expect(profile.stats.postCount).toBeGreaterThan(0);
  });
});
