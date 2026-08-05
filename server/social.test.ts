import { describe, expect, it } from "vitest";
import { socialStore } from "./socialStore";

describe("socialStore", () => {
  it("seeds demo content", () => {
    const stats = socialStore.getStats();
    expect(stats.profiles).toBeGreaterThan(5);
    expect(stats.posts).toBeGreaterThan(5);
    expect(stats.circles).toBeGreaterThan(3);
  });

  it("returns pulse feed sorted by interest score", () => {
    const me = socialStore.getDemoUser();
    const feed = socialStore.getFeed("pulse", me.id);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].author).toBeDefined();
  });

  it("creates posts and applies resonance", () => {
    const me = socialStore.getDemoUser();
    const post = socialStore.createPost({
      authorId: me.id,
      type: "pulse",
      content: "Test resonance flow",
    });
    expect(post.id).toBeGreaterThan(0);

    const sparked = socialStore.setResonance(me.id, post.id, "spark");
    expect(sparked?.sparkCount).toBe(1);
    expect(sparked?.myResonance).toBe("spark");

    const cleared = socialStore.setResonance(me.id, post.id, null);
    expect(cleared?.sparkCount).toBe(0);
    expect(cleared?.myResonance).toBeNull();
  });

  it("filters orbit to followed authors", () => {
    const me = socialStore.getDemoUser();
    const orbit = socialStore.getFeed("orbit", me.id);
    expect(orbit.every((p) => p.authorId === me.id || p.isFollowingAuthor)).toBe(true);
  });

  it("joins and leaves circles", () => {
    const me = socialStore.getDemoUser();
    const circle = socialStore.listCircles()[0];
    socialStore.leaveCircle(me.id, circle.id);
    const left = socialStore.isMember(me.id, circle.id);
    expect(left).toBe(false);
    socialStore.joinCircle(me.id, circle.id);
    expect(socialStore.isMember(me.id, circle.id)).toBe(true);
  });
});
