import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ForumCategory,
  ForumPost,
  ForumThread,
  InsertUser,
  emailVerificationTokens,
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(data: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Datenbank ist nicht erreichbar.");
  await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "password",
    emailVerified: false,
    role: "user",
  });
  const created = await getUserByOpenId(data.openId);
  if (!created) throw new Error("Konto konnte nicht angelegt werden.");
  return created;
}

export async function markUserSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

function affectedRows(result: unknown): number {
  if (Array.isArray(result)) {
    const header = result[0] as { affectedRows?: number } | undefined;
    return header?.affectedRows ?? 0;
  }
  if (result && typeof result === "object" && "affectedRows" in result) {
    return Number((result as { affectedRows: number }).affectedRows) || 0;
  }
  return 0;
}

/** Alte ungenutzte Links ungültig machen und einen neuen Hash speichern. */
export async function replaceVerificationToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Datenbank ist nicht erreichbar.");
  const now = new Date();
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(and(eq(emailVerificationTokens.userId, userId), isNull(emailVerificationTokens.usedAt)));
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });
}

/**
 * Löst einen Token-Hash ein. Bereits bestätigte Konten bleiben beim erneuten
 * Aufruf desselben Links erfolgreich, ohne den Status noch einmal zu ändern.
 */
export async function consumeVerificationToken(
  tokenHash: string
): Promise<"confirmed" | "already" | "invalid"> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank ist nicht erreichbar.");
  const now = new Date();

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, tokenHash))
      .limit(1);
    const row = rows[0];
    if (!row) return "invalid";

    if (row.usedAt) {
      const owner = await tx.select().from(users).where(eq(users.id, row.userId)).limit(1);
      return owner[0]?.emailVerified ? "already" : "invalid";
    }

    if (row.expiresAt.getTime() <= now.getTime()) return "invalid";

    const updated = await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(and(eq(emailVerificationTokens.id, row.id), isNull(emailVerificationTokens.usedAt)));

    if (affectedRows(updated) < 1) {
      const owner = await tx.select().from(users).where(eq(users.id, row.userId)).limit(1);
      return owner[0]?.emailVerified ? "already" : "invalid";
    }

    await tx.update(users).set({ emailVerified: true }).where(eq(users.id, row.userId));
    return "confirmed";
  });
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
