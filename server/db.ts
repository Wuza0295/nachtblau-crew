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

const DEFAULT_FORUM_CATEGORY_SEEDS = [
  {
    name: "Allgemein",
    slug: "allgemein",
    description: "Allgemeine Diskussionen rund um die NachtBlau Crew.",
    icon: "MessageSquare",
    sortOrder: 1,
  },
  {
    name: "PC Gaming",
    slug: "pc-gaming",
    description: "Hardware, Setups und alles rund um PC-Spiele.",
    icon: "Monitor",
    sortOrder: 2,
  },
  {
    name: "Konsolen",
    slug: "konsolen",
    description: "PlayStation, Xbox, Nintendo und weitere Konsolen-Themen.",
    icon: "Gamepad2",
    sortOrder: 3,
  },
  {
    name: "Free Games & Deals",
    slug: "free-games-deals",
    description: "Kostenlose Spiele, Angebote und zeitlich begrenzte Aktionen.",
    icon: "Gift",
    sortOrder: 4,
  },
  {
    name: "Community & Events",
    slug: "community-events",
    description: "Vorstellungen, Community-Aktionen und gemeinsame Events.",
    icon: "Users",
    sortOrder: 5,
  },
] as const;

type DefaultForumCategorySeed = (typeof DEFAULT_FORUM_CATEGORY_SEEDS)[number];

function getFallbackForumCategories(): ForumCategory[] {
  const createdAt = new Date();

  return DEFAULT_FORUM_CATEGORY_SEEDS.map((category, index) => ({
    id: index + 1,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sortOrder,
    createdAt,
  }));
}

async function readForumCategories(db: ReturnType<typeof drizzle>) {
  return db.select().from(forumCategories).orderBy(forumCategories.sortOrder);
}

async function ensureForumCategories(db: ReturnType<typeof drizzle> | null): Promise<ForumCategory[]> {
  if (!db) {
    return getFallbackForumCategories();
  }

  const existingCategories = await readForumCategories(db);
  if (existingCategories.length > 0) {
    return existingCategories;
  }

  try {
    await db.insert(forumCategories).values(
      DEFAULT_FORUM_CATEGORY_SEEDS.map((category: DefaultForumCategorySeed) => ({
        ...category,
      }))
    );
  } catch (error) {
    console.warn("[Database] Failed to seed default forum categories:", error);
  }

  const seededCategories = await readForumCategories(db);
  return seededCategories.length > 0 ? seededCategories : getFallbackForumCategories();
}

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
  return ensureForumCategories(db);
}

export async function getForumCategoryBySlug(slug: string) {
  const db = await getDb();
  const categories = await ensureForumCategories(db);
  return categories.find((category) => category.slug === slug);
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
  const rawInsertResult = Array.isArray(result) ? result[0] : result;
  const insertId = Number((rawInsertResult as { insertId?: number } | undefined)?.insertId ?? 0);

  return { insertId };
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
