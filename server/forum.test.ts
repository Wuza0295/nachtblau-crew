import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getForumCategories: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Allgemein",
      slug: "allgemein",
      description: "Allgemeine Diskussionen",
      icon: "MessageSquare",
      sortOrder: 1,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "PC Gaming",
      slug: "pc-gaming",
      description: "PC-Spiele",
      icon: "Monitor",
      sortOrder: 2,
      createdAt: new Date(),
    },
  ]),
  getForumCategoryBySlug: vi.fn().mockImplementation((slug: string) => {
    if (slug === "allgemein") {
      return Promise.resolve({
        id: 1,
        name: "Allgemein",
        slug: "allgemein",
        description: "Allgemeine Diskussionen",
        icon: "MessageSquare",
        sortOrder: 1,
        createdAt: new Date(),
      });
    }
    return Promise.resolve(undefined);
  }),
  getThreadsByCategory: vi.fn().mockResolvedValue([]),
  getThreadById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        thread: {
          id: 1,
          categoryId: 1,
          authorId: 1,
          title: "Test Thread",
          content: "Test content",
          isPinned: false,
          isLocked: false,
          viewCount: 0,
          replyCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastReplyAt: new Date(),
        },
        author: { id: 1, name: "Test User", avatar: null },
      });
    }
    return Promise.resolve(undefined);
  }),
  getPostsByThread: vi.fn().mockResolvedValue([]),
  createThread: vi.fn().mockResolvedValue({ insertId: 42 }),
  createPost: vi.fn().mockResolvedValue(undefined),
  incrementThreadView: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue(undefined),
  getUserThreadCount: vi.fn().mockResolvedValue(0),
  getUserPostCount: vi.fn().mockResolvedValue(0),
  getUserRecentThreads: vi.fn().mockResolvedValue([]),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      avatar: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("forum.getCategories", () => {
  it("returns forum categories for public users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const categories = await caller.forum.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(2);
    expect(categories[0].name).toBe("Allgemein");
    expect(categories[1].slug).toBe("pc-gaming");
  });
});

describe("forum.getCategoryBySlug", () => {
  it("returns category by slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const cat = await caller.forum.getCategoryBySlug({ slug: "allgemein" });
    expect(cat.name).toBe("Allgemein");
    expect(cat.slug).toBe("allgemein");
  });

  it("throws NOT_FOUND for unknown slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.forum.getCategoryBySlug({ slug: "unknown-slug" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("forum.createThread", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.forum.createThread({
        categoryId: 1,
        title: "Test Thread",
        content: "This is test content for the thread",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates thread when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.forum.createThread({
      categoryId: 1,
      title: "Test Thread",
      content: "This is test content for the thread",
    });
    expect(result).toEqual({ insertId: 42 });
  });

  it("validates minimum title length", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    await expect(
      caller.forum.createThread({
        categoryId: 1,
        title: "ab",
        content: "This is test content for the thread",
      })
    ).rejects.toThrow();
  });
});

describe("forum.getThread", () => {
  it("returns thread by id", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.forum.getThread({ id: 1 });
    expect(result.thread.title).toBe("Test Thread");
    expect(result.author.name).toBe("Test User");
  });

  it("throws NOT_FOUND for unknown thread", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.forum.getThread({ id: 9999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("forum.createPost", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.forum.createPost({ threadId: 1, content: "Test reply" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates post when authenticated and thread exists", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.forum.createPost({
      threadId: 1,
      content: "Test reply content",
    });
    expect(result).toBeUndefined(); // createPost returns void
  });
});
