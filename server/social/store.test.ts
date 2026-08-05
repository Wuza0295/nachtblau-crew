import { describe, expect, it } from "vitest";
import * as store from "./store";

describe("Lumen social store", () => {
  it("ranks signal lens with explainable reasons", () => {
    const feed = store.getFeed("signal");
    expect(feed.length).toBeGreaterThan(5);
    expect(feed[0].reasons?.length).toBeGreaterThan(0);
    expect(feed[0].signal).toBeGreaterThanOrEqual(feed[feed.length - 1].signal - 50);
  });

  it("chrono lens only shows followed authors", () => {
    const feed = store.getFeed("chrono");
    expect(feed.every((p) => store.isFollowing(p.authorId) || p.authorId === "me")).toBe(
      true
    );
  });

  it("focus lens prefers depth and thoughts", () => {
    const feed = store.getFeed("focus");
    expect(feed.every((p) => p.kind === "depth" || p.kind === "thought")).toBe(true);
  });

  it("creates posts and replies with signal bump", () => {
    const post = store.createPost({
      body: "Testgedanke für Vitest.",
      kind: "thought",
      topics: ["tech"],
    });
    expect(post.id).toBeTruthy();
    const before = store.getPost(post.id)!.signal;
    store.addReply(post.id, "Erste Antwort");
    const after = store.getPost(post.id)!;
    expect(after.replies).toBe(1);
    expect(after.signal).toBeGreaterThan(before);
  });

  it("exposes circles and collectives", () => {
    expect(store.getCircles().length).toBeGreaterThan(0);
    expect(store.getCollectives().length).toBeGreaterThan(0);
  });
});
