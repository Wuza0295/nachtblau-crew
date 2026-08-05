import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getCircles: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Tech Pulse",
      slug: "tech-pulse",
      description: "Tech",
      topic: "technologie",
      coverGradient: "linear-gradient(#000,#fff)",
      icon: "Cpu",
      memberCount: 10,
      postCount: 2,
      isFeatured: true,
      createdAt: new Date(),
    },
  ]),
  getCircleBySlug: vi.fn().mockImplementation((slug: string) => {
    if (slug === "tech-pulse") {
      return Promise.resolve({
        id: 1,
        name: "Tech Pulse",
        slug: "tech-pulse",
        description: "Tech",
        topic: "technologie",
        coverGradient: "x",
        icon: "Cpu",
        memberCount: 10,
        postCount: 2,
        isFeatured: true,
        createdAt: new Date(),
      });
    }
    return Promise.resolve(undefined);
  }),
  isCircleMember: vi.fn().mockResolvedValue(false),
  joinCircle: vi.fn().mockResolvedValue(undefined),
  leaveCircle: vi.fn().mockResolvedValue(undefined),
  getFeed: vi.fn().mockResolvedValue([
    {
      post: {
        id: 1,
        authorId: 1,
        type: "text",
        title: null,
        content: "Hello AETHER",
        mediaUrl: null,
        topic: "technologie",
        resonanceScore: 5,
        commentCount: 0,
        isAiLabeled: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        circleId: 1,
      },
      author: { id: 1, name: "Guide", handle: "aether", avatar: null },
      circle: { id: 1, name: "Tech Pulse", slug: "tech-pulse" },
    },
  ]),
  getActiveSignals: vi.fn().mockResolvedValue([]),
  getPostById: vi.fn().mockResolvedValue({
    post: {
      id: 1,
      authorId: 1,
      type: "text",
      title: null,
      content: "Hello",
      mediaUrl: null,
      topic: "technologie",
      resonanceScore: 5,
      commentCount: 0,
      isAiLabeled: false,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      circleId: null,
    },
    author: { id: 1, name: "Guide", handle: "aether", avatar: null },
    circle: null,
  }),
  getUserResonance: vi.fn().mockResolvedValue(null),
  createSocialPost: vi.fn().mockResolvedValue(99),
  resonate: vi.fn().mockResolvedValue(undefined),
  getPulseDials: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, topic: "technologie", weight: 70, updatedAt: new Date() },
  ]),
  setPulseDial: vi.fn().mockResolvedValue(undefined),
  setAllPulseDials: vi.fn().mockResolvedValue(undefined),
  getComments: vi.fn().mockResolvedValue([]),
  createComment: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Guide",
    handle: "aether",
    avatar: null,
    bio: "Hi",
    mood: null,
    role: "admin",
    createdAt: new Date(),
  }),
  getUserPostCount: vi.fn().mockResolvedValue(3),
  getFollowerCounts: vi.fn().mockResolvedValue({ followers: 1, following: 2 }),
  getPostsByAuthor: vi.fn().mockResolvedValue([]),
  isFollowing: vi.fn().mockResolvedValue(false),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  followUser: vi.fn().mockResolvedValue(undefined),
  unfollowUser: vi.fn().mockResolvedValue(undefined),
  getBoardsByUser: vi.fn().mockResolvedValue([]),
  createBoard: vi.fn().mockResolvedValue(1),
  getBoardById: vi.fn().mockResolvedValue(undefined),
  getBoardItems: vi.fn().mockResolvedValue([]),
  addToBoard: vi.fn().mockResolvedValue(undefined),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test",
      name: "Tester",
      email: "t@test.com",
      loginMethod: "manus",
      role: "user",
      avatar: null,
      bio: null,
      handle: "tester",
      mood: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("AETHER social routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists circles publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const list = await caller.circles.list({});
    expect(list[0].slug).toBe("tech-pulse");
  });

  it("returns circle by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.circles.bySlug({ slug: "tech-pulse" });
    expect(result.circle.name).toBe("Tech Pulse");
    expect(result.isMember).toBe(false);
  });

  it("serves pulse feed", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const feed = await caller.feed.get({ mode: "pulse", limit: 10 });
    expect(feed[0].post.content).toContain("AETHER");
  });

  it("exposes pulse topics", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const topics = await caller.pulse.getTopics();
    expect(topics.length).toBe(12);
  });

  it("creates a post when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const res = await caller.feed.create({
      content: "Neuer Gedanke",
      topic: "technologie",
      type: "text",
    });
    expect(res.id).toBe(99);
  });

  it("loads profile stats", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const profile = await caller.profile.get({ userId: 1 });
    expect(profile.stats.postCount).toBe(3);
    expect(profile.user.handle).toBe("aether");
  });

  it("joins a circle when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const res = await caller.circles.join({ circleId: 1 });
    expect(res.success).toBe(true);
  });
});
