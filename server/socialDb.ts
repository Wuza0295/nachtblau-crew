import { and, desc, eq, gt, inArray, isNull, like, or, sql } from "drizzle-orm";
import {
  circleMembers,
  circles,
  follows,
  hashtags,
  postHashtags,
  postReactions,
  socialComments,
  socialPosts,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export type ReactionKind = "love" | "fire" | "insight" | "celebrate" | "support";
export type PostType = "wave" | "flash" | "moment" | "story";
export type FeedMode = "following" | "discover" | "chronological";

const authorSelect = {
  id: users.id,
  name: users.name,
  avatar: users.avatar,
  handle: users.handle,
};

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_\u00C0-\u024F]{2,32}/g) ?? [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

async function syncPostHashtags(postId: number, content: string | null | undefined) {
  const db = await getDb();
  if (!db || !content) return;
  const tags = extractHashtags(content);
  for (const tag of tags) {
    await db
      .insert(hashtags)
      .values({ tag, useCount: 1 })
      .onDuplicateKeyUpdate({ set: { useCount: sql`${hashtags.useCount} + 1` } });
    const [row] = await db.select().from(hashtags).where(eq(hashtags.tag, tag)).limit(1);
    if (row) {
      await db.insert(postHashtags).values({ postId, hashtagId: row.id });
    }
  }
}

export async function getCircles(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(circles).orderBy(desc(circles.memberCount)).limit(limit);
}

export async function getCircleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(circles).where(eq(circles.slug, slug)).limit(1);
  return row;
}

export async function isCircleMember(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);
  return !!row;
}

export async function joinCircle(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await isCircleMember(circleId, userId);
  if (existing) return { joined: false };
  await db.insert(circleMembers).values({ circleId, userId });
  await db
    .update(circles)
    .set({ memberCount: sql`${circles.memberCount} + 1` })
    .where(eq(circles.id, circleId));
  return { joined: true };
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
  return { left: true };
}

export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (followerId === followingId) return { following: false };
  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  if (existing) return { following: true };
  await db.insert(follows).values({ followerId, followingId });
  return { following: true };
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  return { following: false };
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return !!row;
}

export async function getFollowCounts(userId: number) {
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
  return { followers: followers?.count ?? 0, following: following?.count ?? 0 };
}

function activeStoryFilter() {
  return or(isNull(socialPosts.expiresAt), gt(socialPosts.expiresAt, new Date()));
}

export async function getFeedPosts(opts: {
  mode: FeedMode;
  userId?: number;
  circleId?: number;
  limit?: number;
  offset?: number;
  types?: PostType[];
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const types = opts.types ?? ["wave", "flash", "moment"];

  const baseQuery = db
    .select({
      post: socialPosts,
      author: authorSelect,
      circle: {
        id: circles.id,
        name: circles.name,
        slug: circles.slug,
      },
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .leftJoin(circles, eq(socialPosts.circleId, circles.id))
    .where(
      and(
        inArray(socialPosts.type, types),
        activeStoryFilter(),
        opts.circleId ? eq(socialPosts.circleId, opts.circleId) : undefined
      )
    );

  if (opts.mode === "chronological") {
    return baseQuery.orderBy(desc(socialPosts.createdAt)).limit(limit).offset(offset);
  }

  if (opts.mode === "following" && opts.userId) {
    const followingRows = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, opts.userId));
    const ids = followingRows.map((r) => r.id);
    if (ids.length === 0) return [];
    return db
      .select({
        post: socialPosts,
        author: authorSelect,
        circle: {
          id: circles.id,
          name: circles.name,
          slug: circles.slug,
        },
      })
      .from(socialPosts)
      .innerJoin(users, eq(socialPosts.authorId, users.id))
      .leftJoin(circles, eq(socialPosts.circleId, circles.id))
      .where(
        and(
          inArray(socialPosts.type, types),
          inArray(socialPosts.authorId, ids),
          activeStoryFilter(),
          opts.circleId ? eq(socialPosts.circleId, opts.circleId) : undefined
        )
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // discover: engagement-weighted
  return db
    .select({
      post: socialPosts,
      author: authorSelect,
      circle: {
        id: circles.id,
        name: circles.name,
        slug: circles.slug,
      },
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .leftJoin(circles, eq(socialPosts.circleId, circles.id))
    .where(
      and(
        inArray(socialPosts.type, types),
        eq(socialPosts.visibility, "public"),
        activeStoryFilter(),
        opts.circleId ? eq(socialPosts.circleId, opts.circleId) : undefined
      )
    )
    .orderBy(
      desc(sql`${socialPosts.reactionCount} * 2 + ${socialPosts.commentCount}`),
      desc(socialPosts.createdAt)
    )
    .limit(limit)
    .offset(offset);
}

export async function getFlashes(limit = 30, offset = 0) {
  return getFeedPosts({ mode: "discover", types: ["flash"], limit, offset });
}

export async function getActiveStories() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      post: socialPosts,
      author: authorSelect,
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .where(and(eq(socialPosts.type, "story"), gt(socialPosts.expiresAt, new Date())))
    .orderBy(desc(socialPosts.createdAt))
    .limit(40);
}

export async function createSocialPost(data: {
  authorId: number;
  type: PostType;
  content?: string;
  mediaUrl?: string;
  mediaAspect?: "square" | "portrait" | "landscape";
  circleId?: number;
  momentPrompt?: string;
  visibility?: "public" | "followers" | "circle";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const expiresAt =
    data.type === "story" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

  const result = await db.insert(socialPosts).values({
    authorId: data.authorId,
    type: data.type,
    content: data.content ?? null,
    mediaUrl: data.mediaUrl ?? null,
    mediaAspect: data.mediaAspect ?? null,
    circleId: data.circleId ?? null,
    momentPrompt: data.momentPrompt ?? null,
    visibility: data.visibility ?? "public",
    expiresAt,
  });

  const insertId = Number(result[0].insertId);
  await syncPostHashtags(insertId, data.content);
  return { id: insertId };
}

export async function toggleReaction(postId: number, userId: number, kind: ReactionKind) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const [existing] = await db
    .select()
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)))
    .limit(1);

  if (existing) {
    if (existing.kind === kind) {
      await db
        .delete(postReactions)
        .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
      await db
        .update(socialPosts)
        .set({ reactionCount: sql`GREATEST(${socialPosts.reactionCount} - 1, 0)` })
        .where(eq(socialPosts.id, postId));
      return { active: false, kind: null as ReactionKind | null };
    }
    await db
      .update(postReactions)
      .set({ kind })
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
    return { active: true, kind };
  }

  await db.insert(postReactions).values({ postId, userId, kind });
  await db
    .update(socialPosts)
    .set({ reactionCount: sql`${socialPosts.reactionCount} + 1` })
    .where(eq(socialPosts.id, postId));
  return { active: true, kind };
}

export async function getUserReactionsForPosts(userId: number | undefined, postIds: number[]) {
  const db = await getDb();
  if (!db || !userId || postIds.length === 0) return {};
  const rows = await db
    .select()
    .from(postReactions)
    .where(and(eq(postReactions.userId, userId), inArray(postReactions.postId, postIds)));
  const map: Record<number, ReactionKind> = {};
  for (const r of rows) map[r.postId] = r.kind;
  return map;
}

export async function getComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      comment: socialComments,
      author: authorSelect,
    })
    .from(socialComments)
    .innerJoin(users, eq(socialComments.authorId, users.id))
    .where(eq(socialComments.postId, postId))
    .orderBy(socialComments.createdAt);
}

export async function addComment(postId: number, authorId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(socialComments).values({ postId, authorId, content });
  await db
    .update(socialPosts)
    .set({ commentCount: sql`${socialPosts.commentCount} + 1` })
    .where(eq(socialPosts.id, postId));
}

export async function searchPortal(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return { users: [], hashtags: [], posts: [] };
  const q = query.trim();
  if (q.length < 2) return { users: [], hashtags: [], posts: [] };

  const tag = q.startsWith("#") ? q.slice(1).toLowerCase() : q.toLowerCase();

  const userRows = await db
    .select(authorSelect)
    .from(users)
    .where(or(like(users.name, `%${q}%`), like(users.handle, `%${q}%`)))
    .limit(8);

  const tagRows = await db
    .select()
    .from(hashtags)
    .where(like(hashtags.tag, `%${tag}%`))
    .orderBy(desc(hashtags.useCount))
    .limit(8);

  const postRows = await db
    .select({
      post: socialPosts,
      author: authorSelect,
    })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .where(and(like(socialPosts.content, `%${q}%`), inArray(socialPosts.type, ["wave", "flash", "moment"])))
    .orderBy(desc(socialPosts.createdAt))
    .limit(limit);

  return { users: userRows, hashtags: tagRows, posts: postRows };
}

export async function getTrendingHashtags(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hashtags).orderBy(desc(hashtags.useCount)).limit(limit);
}

export async function getPostsByHashtag(tag: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const [hashtag] = await db
    .select()
    .from(hashtags)
    .where(eq(hashtags.tag, tag.toLowerCase()))
    .limit(1);
  if (!hashtag) return [];

  return db
    .select({
      post: socialPosts,
      author: authorSelect,
    })
    .from(postHashtags)
    .innerJoin(socialPosts, eq(postHashtags.postId, socialPosts.id))
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .where(eq(postHashtags.hashtagId, hashtag.id))
    .orderBy(desc(socialPosts.createdAt))
    .limit(limit);
}

export async function getUserSocialStats(userId: number) {
  const db = await getDb();
  if (!db) return { postCount: 0, ...{ followers: 0, following: 0 } };
  const [posts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(socialPosts)
    .where(
      and(eq(socialPosts.authorId, userId), inArray(socialPosts.type, ["wave", "flash", "moment"]))
    );
  const followCounts = await getFollowCounts(userId);
  return { postCount: posts?.count ?? 0, ...followCounts };
}

export const DAILY_MOMENT_PROMPTS = [
  "Was hat dich heute zum Lächeln gebracht?",
  "Zeig uns deinen Arbeitsplatz — ehrlich, nicht perfekt.",
  "Ein Gericht, das du diese Woche entdeckt hast.",
  "Was lernst du gerade — freiwillig oder zufällig?",
  "Dein Lieblingsort in 10 Sekunden erklärt.",
  "Etwas, wofür du dankbar bist — ohne Filter.",
  "Ein Song, der gerade deinen Tag prägt.",
] as const;

export function getDailyMomentPrompt(): string {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % DAILY_MOMENT_PROMPTS.length;
  return DAILY_MOMENT_PROMPTS[dayIndex]!;
}
