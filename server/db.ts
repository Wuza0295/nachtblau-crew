import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ForumCategory,
  ForumPost,
  ForumThread,
  InsertUser,
  forumCategories,
  forumPosts,
  forumThreads,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; bio?: string; avatar?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── Forum Categories ─────────────────────────────────────────────────────────
export async function getForumCategories(): Promise<ForumCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(forumCategories)
    .orderBy(forumCategories.sortOrder);
}

export async function getForumCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.slug, slug))
    .limit(1);
  return result[0];
}

// ─── Forum Threads ────────────────────────────────────────────────────────────
export async function getThreadsByCategory(categoryId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      thread: forumThreads,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(forumThreads)
    .innerJoin(users, eq(forumThreads.authorId, users.id))
    .where(eq(forumThreads.categoryId, categoryId))
    .orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastReplyAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getThreadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      thread: forumThreads,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(forumThreads)
    .innerJoin(users, eq(forumThreads.authorId, users.id))
    .where(eq(forumThreads.id, id))
    .limit(1);
  return rows[0];
}

export async function createThread(data: {
  categoryId: number;
  authorId: number;
  title: string;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(forumThreads).values({
    ...data,
    lastReplyAt: new Date(),
  });
  return result[0];
}

export async function incrementThreadView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(forumThreads)
    .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
    .where(eq(forumThreads.id, id));
}

// ─── Forum Posts ──────────────────────────────────────────────────────────────
export async function getPostsByThread(threadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      post: forumPosts,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.authorId, users.id))
    .where(and(eq(forumPosts.threadId, threadId), eq(forumPosts.isDeleted, false)))
    .orderBy(forumPosts.createdAt);
}

export async function createPost(data: {
  threadId: number;
  authorId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(forumPosts).values(data);
  // Update thread reply count and lastReplyAt
  await db
    .update(forumThreads)
    .set({
      replyCount: sql`${forumThreads.replyCount} + 1`,
      lastReplyAt: new Date(),
    })
    .where(eq(forumThreads.id, data.threadId));
}

export async function getUserThreadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(forumThreads)
    .where(eq(forumThreads.authorId, userId));
  return result[0]?.count ?? 0;
}

export async function getUserPostCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(forumPosts)
    .where(and(eq(forumPosts.authorId, userId), eq(forumPosts.isDeleted, false)));
  return result[0]?.count ?? 0;
}

export async function getUserRecentThreads(userId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      thread: forumThreads,
      category: forumCategories,
    })
    .from(forumThreads)
    .innerJoin(forumCategories, eq(forumThreads.categoryId, forumCategories.id))
    .where(eq(forumThreads.authorId, userId))
    .orderBy(desc(forumThreads.createdAt))
    .limit(limit);
}

// ─── Seed ──────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  {
    name: "Allgemein",
    slug: "allgemein",
    description: "Allgemeine Diskussionen rund um Gaming und die Community.",
    icon: "MessageSquare",
    sortOrder: 0,
  },
  {
    name: "PC Gaming",
    slug: "pc-gaming",
    description: "Alles über PC-Spiele, Hardware, Mods und mehr.",
    icon: "Monitor",
    sortOrder: 1,
  },
  {
    name: "Konsolen",
    slug: "konsolen",
    description: "PlayStation, Xbox, Nintendo Switch – hier seid ihr richtig.",
    icon: "Gamepad2",
    sortOrder: 2,
  },
  {
    name: "Steam & Deals",
    slug: "steam-deals",
    description: "Steam-Angebote, Wishlist-Tipps und Erfahrungen mit digitalen Stores.",
    icon: "Flame",
    sortOrder: 3,
  },
  {
    name: "Kostenlose Spiele",
    slug: "kostenlose-spiele",
    description: "Teile deine Erfahrungen mit Free2Play-Titeln und Giveaways.",
    icon: "Gift",
    sortOrder: 4,
  },
  {
    name: "Community",
    slug: "community",
    description: "Stell dich vor, finde Mitspieler oder organisiere Events.",
    icon: "Users",
    sortOrder: 5,
  },
];

export async function seedForumCategories(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await db.select({ id: forumCategories.id }).from(forumCategories).limit(1);
    if (existing.length > 0) return;
    await db.insert(forumCategories).values(DEFAULT_CATEGORIES);
    console.log("[DB] Forum categories seeded.");
  } catch (err) {
    console.warn("[DB] Could not seed forum categories:", err);
  }
}
