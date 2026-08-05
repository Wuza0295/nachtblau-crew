import { and, desc, eq, gt, gte, inArray, or, sql } from "drizzle-orm";
import {
  communities,
  communityMembers,
  postComments,
  postReactions,
  postSaves,
  postVotes,
  socialPosts,
  stories,
  userFollows,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export type FeedMode = "following" | "discover" | "chronological";
export const REACTION_EMOJIS = ["❤️", "🔥", "😂", "💡", "👏", "🎯"] as const;

const authorSelect = {
  id: users.id,
  name: users.name,
  avatar: users.avatar,
};

type AuthorSummary = { id: number; name: string | null; avatar: string | null };
type PostRow = { post: typeof socialPosts.$inferSelect; author: AuthorSummary };

async function enrichPosts(rows: PostRow[], viewerId?: number) {
  if (rows.length === 0) return [];
  const postIds = rows.map((r) => r.post.id);
  const db = await getDb();
  if (!db) return rows.map((r) => ({ ...r, viewerVote: 0, viewerReaction: null, viewerSaved: false }));

  let viewerVotes: { postId: number; value: number }[] = [];
  let viewerReactions: { postId: number; emoji: string }[] = [];
  let viewerSaves: number[] = [];

  if (viewerId) {
    [viewerVotes, viewerReactions, viewerSaves] = await Promise.all([
      db
        .select({ postId: postVotes.postId, value: postVotes.value })
        .from(postVotes)
        .where(and(inArray(postVotes.postId, postIds), eq(postVotes.userId, viewerId))),
      db
        .select({ postId: postReactions.postId, emoji: postReactions.emoji })
        .from(postReactions)
        .where(and(inArray(postReactions.postId, postIds), eq(postReactions.userId, viewerId))),
      db
        .select({ postId: postSaves.postId })
        .from(postSaves)
        .where(and(inArray(postSaves.postId, postIds), eq(postSaves.userId, viewerId)))
        .then((s) => s.map((x) => x.postId)),
    ]);
  }

  const voteMap = new Map(viewerVotes.map((v) => [v.postId, v.value]));
  const reactionMap = new Map(viewerReactions.map((r) => [r.postId, r.emoji]));
  const saveSet = new Set(viewerSaves);

  return rows.map((r) => ({
    ...r,
    viewerVote: voteMap.get(r.post.id) ?? 0,
    viewerReaction: reactionMap.get(r.post.id) ?? null,
    viewerSaved: saveSet.has(r.post.id),
  }));
}

export async function getFeedPosts(opts: {
  mode: FeedMode;
  userId?: number;
  communityId?: number;
  postKind?: "feed" | "pulse" | "moment";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const kind = opts.postKind ?? "feed";

  const baseQuery = db
    .select({ post: socialPosts, author: authorSelect })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .where(
      and(
        eq(socialPosts.postKind, kind),
        opts.communityId ? eq(socialPosts.communityId, opts.communityId) : undefined
      )
    );

  let rows: PostRow[];

  if (opts.mode === "chronological") {
    rows = await baseQuery.orderBy(desc(socialPosts.createdAt)).limit(limit).offset(offset);
  } else if (opts.mode === "discover") {
    rows = await baseQuery
      .orderBy(
        desc(
          sql`(${socialPosts.upvoteCount} * 2 + ${socialPosts.reactionCount} * 3 + ${socialPosts.commentCount} * 4 + ${socialPosts.saveCount} * 5 + ${socialPosts.shareCount})`
        ),
        desc(socialPosts.createdAt)
      )
      .limit(limit)
      .offset(offset);
  } else if (opts.userId) {
    const following = await db
      .select({ id: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, opts.userId));
    const memberOf = await db
      .select({ id: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, opts.userId));

    const authorIds = following.map((f) => f.id);
    const communityIds = memberOf.map((m) => m.id);

    if (authorIds.length === 0 && communityIds.length === 0) {
      rows = await baseQuery.orderBy(desc(socialPosts.createdAt)).limit(limit).offset(offset);
    } else {
      rows = await db
        .select({ post: socialPosts, author: authorSelect })
        .from(socialPosts)
        .innerJoin(users, eq(socialPosts.authorId, users.id))
        .where(
          and(
            eq(socialPosts.postKind, kind),
            opts.communityId ? eq(socialPosts.communityId, opts.communityId) : undefined,
            or(
              authorIds.length ? inArray(socialPosts.authorId, authorIds) : undefined,
              communityIds.length ? inArray(socialPosts.communityId, communityIds) : undefined
            )
          )
        )
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }
  } else {
    rows = await baseQuery.orderBy(desc(socialPosts.createdAt)).limit(limit).offset(offset);
  }

  return enrichPosts(rows, opts.userId);
}

export async function createSocialPost(data: {
  authorId: number;
  content: string;
  communityId?: number;
  mediaUrl?: string;
  mediaType?: "none" | "image" | "video";
  postKind?: "feed" | "pulse" | "moment";
  repostOfId?: number;
  quoteText?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(socialPosts).values({
    authorId: data.authorId,
    content: data.content,
    communityId: data.communityId ?? null,
    mediaUrl: data.mediaUrl ?? null,
    mediaType: data.mediaType ?? "none",
    postKind: data.postKind ?? "feed",
    repostOfId: data.repostOfId ?? null,
    quoteText: data.quoteText ?? null,
  });
  return result[0].insertId as number;
}

export async function togglePostVote(postId: number, userId: number, value: 1 | -1) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select()
    .from(postVotes)
    .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].value === value) {
      await db
        .delete(postVotes)
        .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
      await db
        .update(socialPosts)
        .set({ upvoteCount: sql`${socialPosts.upvoteCount} - ${value}` })
        .where(eq(socialPosts.id, postId));
      return { active: false, value: 0 };
    }
    await db
      .update(postVotes)
      .set({ value })
      .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
    await db
      .update(socialPosts)
      .set({ upvoteCount: sql`${socialPosts.upvoteCount} + ${value * 2}` })
      .where(eq(socialPosts.id, postId));
    return { active: true, value };
  }

  await db.insert(postVotes).values({ postId, userId, value });
  await db
    .update(socialPosts)
    .set({ upvoteCount: sql`${socialPosts.upvoteCount} + ${value}` })
    .where(eq(socialPosts.id, postId));
  return { active: true, value };
}

export async function setPostReaction(postId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select()
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].emoji === emoji) {
      await db
        .delete(postReactions)
        .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
      await db
        .update(socialPosts)
        .set({ reactionCount: sql`GREATEST(${socialPosts.reactionCount} - 1, 0)` })
        .where(eq(socialPosts.id, postId));
      return { emoji: null };
    }
    await db
      .update(postReactions)
      .set({ emoji })
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
    return { emoji };
  }

  await db.insert(postReactions).values({ postId, userId, emoji });
  await db
    .update(socialPosts)
    .set({ reactionCount: sql`${socialPosts.reactionCount} + 1` })
    .where(eq(socialPosts.id, postId));
  return { emoji };
}

export async function togglePostSave(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select()
    .from(postSaves)
    .where(and(eq(postSaves.postId, postId), eq(postSaves.userId, userId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(postSaves)
      .where(and(eq(postSaves.postId, postId), eq(postSaves.userId, userId)));
    await db
      .update(socialPosts)
      .set({ saveCount: sql`GREATEST(${socialPosts.saveCount} - 1, 0)` })
      .where(eq(socialPosts.id, postId));
    return { saved: false };
  }

  await db.insert(postSaves).values({ postId, userId });
  await db
    .update(socialPosts)
    .set({ saveCount: sql`${socialPosts.saveCount} + 1` })
    .where(eq(socialPosts.id, postId));
  return { saved: true };
}

export async function addPostComment(postId: number, authorId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(postComments).values({ postId, authorId, content });
  await db
    .update(socialPosts)
    .set({ commentCount: sql`${socialPosts.commentCount} + 1` })
    .where(eq(socialPosts.id, postId));
}

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ comment: postComments, author: authorSelect })
    .from(postComments)
    .innerJoin(users, eq(postComments.authorId, users.id))
    .where(eq(postComments.postId, postId))
    .orderBy(postComments.createdAt);
}

export async function getCommunities(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communities).orderBy(desc(communities.memberCount)).limit(limit);
}

export async function getCommunityBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
  return rows[0];
}

export async function joinCommunity(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1);
  if (existing[0]) return { joined: true };
  await db.insert(communityMembers).values({ communityId, userId });
  await db
    .update(communities)
    .set({ memberCount: sql`${communities.memberCount} + 1` })
    .where(eq(communities.id, communityId));
  return { joined: true };
}

export async function isCommunityMember(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (followerId === followingId) throw new Error("Cannot follow yourself");

  const existing = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
    return { following: false };
  }

  await db.insert(userFollows).values({ followerId, followingId });
  return { following: true };
}

export async function getFollowStats(userId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return { followers: 0, following: 0, viewerFollows: false };

  const [followers, following, viewerRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId)),
    viewerId
      ? db
          .select()
          .from(userFollows)
          .where(
            and(eq(userFollows.followerId, viewerId), eq(userFollows.followingId, userId))
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    followers: followers[0]?.count ?? 0,
    following: following[0]?.count ?? 0,
    viewerFollows: viewerRow.length > 0,
  };
}

export async function getActiveStories() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select({ story: stories, author: authorSelect })
    .from(stories)
    .innerJoin(users, eq(stories.authorId, users.id))
    .where(gt(stories.expiresAt, now))
    .orderBy(desc(stories.createdAt));
}

export async function createStory(data: {
  authorId: number;
  caption?: string;
  mediaUrl?: string;
  backgroundStyle?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(stories).values({
    authorId: data.authorId,
    caption: data.caption ?? null,
    mediaUrl: data.mediaUrl ?? null,
    backgroundStyle: data.backgroundStyle ?? "aurora",
    expiresAt,
  });
}

export async function getUserSocialPosts(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ post: socialPosts, author: authorSelect })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .where(eq(socialPosts.authorId, userId))
    .orderBy(desc(socialPosts.createdAt))
    .limit(limit);
  return enrichPosts(rows);
}

export async function getTrendingTopics(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ content: socialPosts.content, score: socialPosts.upvoteCount })
    .from(socialPosts)
    .orderBy(desc(socialPosts.createdAt))
    .limit(100);

  const tagCounts = new Map<string, number>();
  const hashtag = /#([a-zA-Z0-9_\u00C0-\u024F]{2,32})/g;
  for (const row of rows) {
    let match;
    while ((match = hashtag.exec(row.content)) !== null) {
      const tag = match[1].toLowerCase();
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1 + (row.score ?? 0) * 0.1);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, score]) => ({ tag, score: Math.round(score) }));
}

export async function getTodayMoment(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ post: socialPosts, author: authorSelect })
    .from(socialPosts)
    .innerJoin(users, eq(socialPosts.authorId, users.id))
    .where(
      and(
        eq(socialPosts.authorId, userId),
        eq(socialPosts.postKind, "moment"),
        gte(socialPosts.createdAt, start)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}
