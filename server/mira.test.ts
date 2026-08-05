import { describe, expect, it } from "vitest";
import { miraStore } from "./miraStore";

describe("miraStore", () => {
  it("returns finite village feed in Nähe mode", () => {
    const feed = miraStore.getFeed("nahe");
    expect(feed.finite).toBe(true);
    expect(feed.mode).toBe("nahe");
    expect(feed.posts.length).toBeGreaterThan(0);
    const me = miraStore.me();
    for (const post of feed.posts) {
      expect(
        post.authorId === me.id || me.villageIds.includes(post.authorId)
      ).toBe(true);
    }
  });

  it("filters Fokus feed to joined circles", () => {
    const feed = miraStore.getFeed("fokus");
    expect(feed.finite).toBe(false);
    for (const post of feed.posts) {
      expect(post.circleId).toBeTruthy();
      const circle = miraStore.circles.find((c) => c.id === post.circleId);
      expect(circle?.joined).toBe(true);
    }
  });

  it("creates posts and toggles resonance", () => {
    const before = miraStore.posts.length;
    const created = miraStore.createPost({
      kind: "signal",
      body: "Testsignal für Vitest",
      tags: ["test"],
    });
    expect(miraStore.posts.length).toBe(before + 1);
    expect(created.body).toContain("Testsignal");

    const resonated = miraStore.toggleResonance(created.id);
    expect(resonated?.resonated).toBe(true);
    expect(resonated!.resonance).toBe(1);
  });

  it("toggles circle membership", () => {
    const circle = miraStore.circles.find((c) => !c.joined);
    expect(circle).toBeTruthy();
    const members = circle!.memberCount;
    const updated = miraStore.toggleCircle(circle!.id);
    expect(updated?.joined).toBe(true);
    expect(updated?.memberCount).toBe(members + 1);
    miraStore.toggleCircle(circle!.id);
  });
});
