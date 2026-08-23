import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./socialDb", () => ({
  getFeedPosts: vi.fn(async () => [
    {
      id: 1,
      postType: "text",
      content: "Hello hybrid world",
      mediaUrls: [],
      pollOptions: [],
      topicTags: ["test"],
      repostCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      author: { id: 1, name: "Test", handle: "test", avatar: null, bio: null },
      community: null,
      reactionCounts: {},
      viewerReaction: null,
      viewerBookmarked: false,
    },
  ]),
  getSocialCommunities: vi.fn(async () => []),
  getCommunityBySlug: vi.fn(),
  joinCommunity: vi.fn(),
  followUser: vi.fn(),
  createSocialPost: vi.fn(),
  toggleReaction: vi.fn(),
  toggleBookmark: vi.fn(),
  repostPost: vi.fn(),
  votePoll: vi.fn(),
  getPollResults: vi.fn(async () => ({ counts: [], yourVote: null })),
  addComment: vi.fn(),
  getComments: vi.fn(async () => []),
  getActiveStories: vi.fn(async () => []),
  createStory: vi.fn(),
  markStoryViewed: vi.fn(),
  getTrendingTopics: vi.fn(async () => [{ tag: "test", count: 1 }]),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("social.getFeed", () => {
  it("returns posts for discover mode", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.social.getFeed({ mode: "discover" });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]?.content).toBe("Hello hybrid world");
  });
});

describe("social.getTrending", () => {
  it("returns trending tags", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.social.getTrending();
    expect(result[0]?.tag).toBe("test");
  });
});
