import { describe, expect, it, beforeEach } from "vitest";
import {
  _resetPortalStore,
  getPortalMeta,
  listCommunities,
  listPosts,
  toggleReaction,
  votePoll,
} from "./socialPortalStore";

describe("social portal store", () => {
  beforeEach(() => {
    _resetPortalStore();
  });

  it("returns portal meta", () => {
    const meta = getPortalMeta();
    expect(meta.feedViews).toContain("pulse");
    expect(meta.layers).toContain("social");
  });

  it("lists seeded communities", () => {
    const communities = listCommunities();
    expect(communities.length).toBeGreaterThanOrEqual(4);
    expect(communities[0]?.slug).toBeTruthy();
  });

  it("filters posts by layer", () => {
    const pro = listPosts({ layer: "professional", sort: "trending" });
    expect(pro.every((p) => p.layer === "professional")).toBe(true);
  });

  it("toggles boost reaction and community score", () => {
    const before = listPosts({ layer: "all", sort: "trending" })[0]!;
    const boostBefore = before.reactions.boost;
    const scoreBefore = before.communityScore;
    toggleReaction(before.id, "boost", "test-user");
    const after = listPosts({ layer: "all", sort: "trending" }).find((p) => p.id === before.id)!;
    expect(after.reactions.boost).toBe(boostBefore + 1);
    expect(after.communityScore).toBe(scoreBefore + 3);
  });

  it("records poll votes", () => {
    const pollPost = listPosts({ layer: "all", sort: "trending" }).find((p) => p.poll);
    expect(pollPost?.poll).toBeDefined();
    const opt = pollPost!.poll!.options[0]!;
    const votesBefore = opt.votes;
    votePoll(pollPost!.id, opt.id, "voter-1");
    const updated = listPosts({ layer: "all", sort: "trending" }).find((p) => p.id === pollPost!.id)!;
    const updatedOpt = updated.poll!.options.find((o) => o.id === opt.id)!;
    expect(updatedOpt.votes).toBe(votesBefore + 1);
  });
});
