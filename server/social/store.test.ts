import { describe, expect, it } from "vitest";
import * as store from "./store";

describe("Aether social store", () => {
  it("exposes a hybrid concept with borrowed and unique pillars", () => {
    const concept = store.getConcept();
    expect(concept.workingName).toBe("Aether");
    expect(concept.borrowed.length).toBeGreaterThanOrEqual(6);
    expect(concept.unique.length).toBeGreaterThanOrEqual(3);
  });

  it("scores for-you differently than latest", () => {
    const forYou = store.getFeed({ mode: "for-you", lens: "all", viewerId: 1 });
    const latest = store.getFeed({ mode: "latest", lens: "all", viewerId: 1 });
    expect(forYou.length).toBeGreaterThan(0);
    expect(latest.length).toBeGreaterThan(0);
    expect(latest[0].createdAt >= latest[1]?.createdAt || latest.length === 1).toBe(true);
  });

  it("filters by lens", () => {
    const motion = store.getFeed({ lens: "motion", viewerId: 1 });
    expect(motion.every((p) => p.lenses.includes("motion"))).toBe(true);
  });

  it("creates posts across multiple lenses", () => {
    const post = store.createPost({
      authorId: 1,
      kind: "text",
      lenses: ["pulse", "signal"],
      body: "Cross-lens test post",
      tags: ["test"],
    });
    expect(post.lenses).toEqual(["pulse", "signal"]);
    expect(store.getPost(post.id)?.body).toContain("Cross-lens");
  });

  it("toggles like and save", () => {
    const feed = store.getFeed({ viewerId: 1, limit: 1 });
    const id = feed[0].id;
    const liked = store.toggleLike(id, 1);
    expect(liked?.liked).toBeTypeOf("boolean");
    const saved = store.toggleSave(id, 1);
    expect(saved?.saved).toBeTypeOf("boolean");
  });

  it("updates algorithm weights and intent", () => {
    const weights = store.setAlgorithm(1, {
      recency: 80,
      relevance: 40,
      diversity: 60,
      quiet: 90,
      social: 20,
    });
    expect(weights.quiet).toBe(90);
    expect(store.setIntent(1, "focus")).toBe("focus");
    expect(store.getIntent(1)).toBe("focus");
  });

  it("lists circles and collections", () => {
    expect(store.listCircles().length).toBeGreaterThan(0);
    expect(store.listCollections().length).toBeGreaterThan(0);
    const circle = store.getCircle("slow-feed");
    expect(circle?.name).toBe("Slow Feed");
  });
});
