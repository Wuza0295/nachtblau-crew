import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Board,
  Circle,
  Comment,
  InsertPost,
  InsertUser,
  Post,
  PulseDial,
  boardItems,
  boards,
  circleMembers,
  circles,
  comments,
  follows,
  posts,
  pulseDials,
  resonances,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { PULSE_TOPICS } from "../shared/site";

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

  const textFields = ["name", "email", "loginMethod", "handle"] as const;
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
  data: { name?: string; bio?: string; avatar?: string; handle?: string; mood?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function ensureDefaultPulseDials(userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(pulseDials)
    .where(eq(pulseDials.userId, userId));
  if (existing.length > 0) return;
  await db.insert(pulseDials).values(
    PULSE_TOPICS.map((t) => ({
      userId,
      topic: t.id,
      weight: 40,
    }))
  );
}

// ─── Pulse Dials ──────────────────────────────────────────────────────────────
export async function getPulseDials(userId: number): Promise<PulseDial[]> {
  const db = await getDb();
  if (!db) return [];
  await ensureDefaultPulseDials(userId);
  return db
    .select()
    .from(pulseDials)
    .where(eq(pulseDials.userId, userId))
    .orderBy(asc(pulseDials.topic));
}

export async function setPulseDial(userId: number, topic: string, weight: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await ensureDefaultPulseDials(userId);
  await db
    .insert(pulseDials)
    .values({ userId, topic, weight })
    .onDuplicateKeyUpdate({ set: { weight, updatedAt: new Date() } });
}

export async function setAllPulseDials(
  userId: number,
  dials: { topic: string; weight: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  for (const d of dials) {
    await db
      .insert(pulseDials)
      .values({ userId, topic: d.topic, weight: d.weight })
      .onDuplicateKeyUpdate({ set: { weight: d.weight, updatedAt: new Date() } });
  }
}

// ─── Circles ──────────────────────────────────────────────────────────────────
export async function getCircles(opts?: { featured?: boolean; topic?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.featured) conditions.push(eq(circles.isFeatured, true));
  if (opts?.topic) conditions.push(eq(circles.topic, opts.topic));
  const q = db.select().from(circles);
  if (conditions.length) {
    return q
      .where(and(...conditions))
      .orderBy(desc(circles.memberCount));
  }
  return q.orderBy(desc(circles.isFeatured), desc(circles.memberCount));
}

export async function getCircleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(circles).where(eq(circles.slug, slug)).limit(1);
  return rows[0];
}

export async function getCircleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  return rows[0];
}

export async function isCircleMember(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function joinCircle(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const already = await isCircleMember(circleId, userId);
  if (already) return;
  await db.insert(circleMembers).values({ circleId, userId });
  await db
    .update(circles)
    .set({ memberCount: sql`${circles.memberCount} + 1` })
    .where(eq(circles.id, circleId));
}

export async function leaveCircle(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
  await db
    .update(circles)
    .set({ memberCount: sql`GREATEST(${circles.memberCount} - 1, 0)` })
    .where(eq(circles.id, circleId));
}

// ─── Posts / Feed ─────────────────────────────────────────────────────────────
const authorSelect = {
  id: users.id,
  name: users.name,
  handle: users.handle,
  avatar: users.avatar,
};

export async function createSocialPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(posts).values(data);
  if (data.circleId) {
    await db
      .update(circles)
      .set({ postCount: sql`${circles.postCount} + 1` })
      .where(eq(circles.id, data.circleId));
  }
  return Number(result[0].insertId);
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      post: posts,
      author: authorSelect,
      circle: {
        id: circles.id,
        name: circles.name,
        slug: circles.slug,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(circles, eq(posts.circleId, circles.id))
    .where(eq(posts.id, id))
    .limit(1);
  return rows[0];
}

export async function getFeed(opts: {
  userId?: number;
  mode?: "pulse" | "following" | "latest" | "circle" | "explore";
  circleId?: number;
  topic?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const now = new Date();

  // Base query — exclude expired signals
  const notExpired = or(isNull(posts.expiresAt), gt(posts.expiresAt, now));

  if (opts.mode === "circle" && opts.circleId) {
    return db
      .select({
        post: posts,
        author: authorSelect,
        circle: { id: circles.id, name: circles.name, slug: circles.slug },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(circles, eq(posts.circleId, circles.id))
      .where(and(eq(posts.circleId, opts.circleId), notExpired))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  if (opts.mode === "following" && opts.userId) {
    const following = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, opts.userId));
    const ids = following.map((f) => f.id);
    if (ids.length === 0) return [];
    return db
      .select({
        post: posts,
        author: authorSelect,
        circle: { id: circles.id, name: circles.name, slug: circles.slug },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(circles, eq(posts.circleId, circles.id))
      .where(
        and(
          inArray(posts.authorId, ids),
          notExpired,
          sql`${posts.type} != 'signal'`
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Pulse / explore / latest — score by dial weights when available
  let dialMap: Record<string, number> = {};
  if (opts.userId && opts.mode === "pulse") {
    const dials = await getPulseDials(opts.userId);
    dialMap = Object.fromEntries(dials.map((d) => [d.topic, d.weight]));
  }

  const conditions = [notExpired, sql`${posts.type} != 'signal'`];
  if (opts.topic) conditions.push(eq(posts.topic, opts.topic));

  const rows = await db
    .select({
      post: posts,
      author: authorSelect,
      circle: { id: circles.id, name: circles.name, slug: circles.slug },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(circles, eq(posts.circleId, circles.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(Math.max(limit * 3, 40))
    .offset(0);

  if (opts.mode === "pulse" && Object.keys(dialMap).length > 0) {
    const scored = rows.map((row) => {
      const dial = dialMap[row.post.topic] ?? 20;
      const ageHours =
        (Date.now() - new Date(row.post.createdAt).getTime()) / (1000 * 60 * 60);
      const recency = Math.max(0, 48 - ageHours);
      const score = dial * 2 + row.post.resonanceScore * 3 + recency;
      return { ...row, _score: score };
    });
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(offset, offset + limit).map(({ _score, ...rest }) => rest);
  }

  if (opts.mode === "explore") {
    const scored = rows.map((row) => ({
      ...row,
      _score: row.post.resonanceScore * 2 + Math.random() * 10,
    }));
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(offset, offset + limit).map(({ _score, ...rest }) => rest);
  }

  return rows.slice(offset, offset + limit);
}

export async function getActiveSignals(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select({
      post: posts,
      author: authorSelect,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.type, "signal"), gt(posts.expiresAt, now)))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function getPostsByAuthor(authorId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      post: posts,
      author: authorSelect,
      circle: { id: circles.id, name: circles.name, slug: circles.slug },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(circles, eq(posts.circleId, circles.id))
    .where(and(eq(posts.authorId, authorId), sql`${posts.type} != 'signal'`))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

// ─── Resonance ────────────────────────────────────────────────────────────────
export async function resonate(postId: number, userId: number, weight: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(resonances)
    .where(and(eq(resonances.postId, postId), eq(resonances.userId, userId)))
    .limit(1);

  if (existing[0]) {
    const prev = existing[0].weight;
    await db
      .update(resonances)
      .set({ weight })
      .where(eq(resonances.id, existing[0].id));
    await db
      .update(posts)
      .set({ resonanceScore: sql`${posts.resonanceScore} + ${weight - prev}` })
      .where(eq(posts.id, postId));
  } else {
    await db.insert(resonances).values({ postId, userId, weight });
    await db
      .update(posts)
      .set({ resonanceScore: sql`${posts.resonanceScore} + ${weight}` })
      .where(eq(posts.id, postId));
  }
}

export async function getUserResonance(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(resonances)
    .where(and(eq(resonances.postId, postId), eq(resonances.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function getComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      comment: comments,
      author: authorSelect,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));
}

export async function createComment(data: {
  postId: number;
  authorId: number;
  content: string;
  parentId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(comments).values(data);
  await db
    .update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1` })
    .where(eq(posts.id, data.postId));
}

// ─── Follows ──────────────────────────────────────────────────────────────────
export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (followerId === followingId) return;
  await db
    .insert(follows)
    .values({ followerId, followingId })
    .onDuplicateKeyUpdate({ set: { followerId } });
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return rows.length > 0;
}

export async function getFollowerCounts(userId: number) {
  const db = await getDb();
  if (!db) return { followers: 0, following: 0 };
  const [followers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  const [following] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return {
    followers: Number(followers?.count ?? 0),
    following: Number(following?.count ?? 0),
  };
}

// ─── Boards ───────────────────────────────────────────────────────────────────
export async function getBoardsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(boards)
    .where(eq(boards.ownerId, userId))
    .orderBy(desc(boards.createdAt));
}

export async function createBoard(data: {
  ownerId: number;
  name: string;
  description?: string;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(boards).values(data);
  return Number(result[0].insertId);
}

export async function addToBoard(boardId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .insert(boardItems)
    .values({ boardId, postId })
    .onDuplicateKeyUpdate({ set: { postId } });
}

export async function getBoardItems(boardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      item: boardItems,
      post: posts,
      author: authorSelect,
    })
    .from(boardItems)
    .innerJoin(posts, eq(boardItems.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(boardItems.boardId, boardId))
    .orderBy(desc(boardItems.addedAt));
}

export async function getBoardById(id: number): Promise<Board | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(boards).where(eq(boards.id, id)).limit(1);
  return rows[0];
}

export async function getUserPostCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.authorId, userId), sql`${posts.type} != 'signal'`));
  return Number(result[0]?.count ?? 0);
}

export type { Circle, Comment, Post, PulseDial };
