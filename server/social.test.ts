import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getForumCategories: vi.fn().mockResolvedValue([]),
  getForumCategoryBySlug: vi.fn().mockResolvedValue(undefined),
  getThreadsByCategory: vi.fn().mockResolvedValue([]),
  getThreadById: vi.fn().mockResolvedValue(undefined),
  getPostsByThread: vi.fn().mockResolvedValue([]),
  createThread: vi.fn(),
  createPost: vi.fn(),
  incrementThreadView: vi.fn(),
  getUserById: vi.fn(),
  getUserThreadCount: vi.fn().mockResolvedValue(0),
  getUserPostCount: vi.fn().mockResolvedValue(0),
  getUserRecentThreads: vi.fn().mockResolvedValue([]),
  updateUserProfile: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("./socialDb", () => ({
  REACTION_EMOJIS: ["❤️", "🔥", "😂", "💡", "👏", "🎯"],
  getFeedPosts: vi.fn().mockResolvedValue([
    {
      post: {
        id: 1,
        content: "Hello #Social",
        mediaUrl: null,
        mediaType: "none",
        upvoteCount: 5,
        reactionCount: 2,
        commentCount: 1,
        saveCount: 0,
        createdAt: new Date(),
        communityId: null,
      },
      author: { id: 1, name: "Demo", avatar: null },
      viewerVote: 0,
      viewerReaction: null,
      viewerSaved: false,
    },
  ]),
  getCommunities: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Tech",
      slug: "tech",
      description: "Tech talk",
      iconEmoji: "🚀",
      coverGradient: "from-violet-600 to-cyan-500",
      memberCount: 10,
      creatorId: 1,
      createdAt: new Date(),
    },
  ]),
  getTrendingTopics: vi.fn().mockResolvedValue([{ tag: "social", score: 3 }]),
  getActiveStories: vi.fn().mockResolvedValue([]),
  getCommunityBySlug: vi.fn(),
  isCommunityMember: vi.fn(),
  joinCommunity: vi.fn(),
  createSocialPost: vi.fn(),
  togglePostVote: vi.fn(),
  setPostReaction: vi.fn(),
  togglePostSave: vi.fn(),
  getPostComments: vi.fn().mockResolvedValue([]),
  addPostComment: vi.fn(),
  toggleFollow: vi.fn(),
  getFollowStats: vi.fn().mockResolvedValue({ followers: 0, following: 0, viewerFollows: false }),
  createStory: vi.fn(),
  getTodayMoment: vi.fn(),
  getUserSocialPosts: vi.fn().mockResolvedValue([]),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("social router", () => {
  const caller = appRouter.createCaller(createPublicCtx());

  it("returns feed posts", async () => {
    const posts = await caller.social.getFeed({ mode: "discover" });
    expect(posts).toHaveLength(1);
    expect(posts[0]?.post.content).toContain("Hello");
  });

  it("lists communities", async () => {
    const communities = await caller.social.getCommunities();
    expect(communities[0]?.slug).toBe("tech");
  });

  it("exposes reaction emojis", async () => {
    const emojis = await caller.social.reactionEmojis();
    expect(emojis).toContain("❤️");
  });

  it("returns trending tags", async () => {
    const trends = await caller.social.getTrending();
    expect(trends[0]?.tag).toBe("social");
  });
});
