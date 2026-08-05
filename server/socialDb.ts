import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  socialBookmarks,
  socialComments,
  socialCommunities,
  socialCommunityMembers,
  socialFollows,
  socialPollVotes,
  socialPosts,
  socialReactions,
  socialStories,
  socialStoryViews,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export type FeedMode = "friends" | "discover" | "loops" | "community";

export type ReactionType = "heart" | "fire" | "insight" | "support" | "laugh";

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parsePollOptions(raw: string | null): string[] {
  return parseJsonArray(raw);
}

export async function getSocialCommunities(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(socialCommunities)
    .orderBy(desc(socialCommunities.memberCount))
    .limit(limit);
}

export async function getCommunityBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(socialCommunities)
    .where(eq(socialCommunities.slug, slug))
    .limit(1);
  return rows[0];
}

export async function joinCommunity(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.communityId, communityId),
        eq(socialCommunityMembers.userId, userId)
      )
    )
    .limit(1);
  if (existing.length > 0) return { joined: true as const, already: true as const };
  await db.insert(socialCommunityMembers).values({ communityId, userId });
  await db
    .update(socialCommunities)
    .set({ memberCount: sql`${socialCommunities.memberCount} + 1` })
    .where(eq(socialCommunities.id, communityId));
  return { joined: true as const, already: false as const };
}

export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (followerId === followingId) throw new Error("Cannot follow yourself");
  const existing = await db
    .select()
    .from(socialFollows)
    .where(
      and(
        eq(socialFollows.followerId, followerId),
        eq(socialFollows.followingId, followingId)
      )
    )
    .limit(1);
  if (existing.length > 0) return { following: true as const };
  await db.insert(socialFollows).values({ followerId, followingId });
  return { following: true as const };
}

async function getFollowingIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: socialFollows.followingId })
    .from(socialFollows)
    .where(eq(socialFollows.followerId, userId));
  return rows.map((r) => r.id);
}

async function enrichPosts(
  postRows: (typeof socialPosts.$inferSelect)[],
  viewerId?: number
) {
  const db = await getDb();
  if (!db || postRows.length === 0) return [];

  const authorIds = Array.from(new Set(postRows.map((p) => p.authorId)));
  const postIds = postRows.map((p) => p.id);

  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      handle: users.handle,
      bio: users.bio,
    })
    .from(users)
    .where(inArray(users.id, authorIds));
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  const reactionCounts = await db
    .select({
      postId: socialReactions.postId,
      reactionType: socialReactions.reactionType,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(socialReactions)
    .where(inArray(socialReactions.postId, postIds))
    .groupBy(socialReactions.postId, socialReactions.reactionType);

  const countsByPost = new Map<number, Record<string, number>>();
  for (const row of reactionCounts) {
    const map = countsByPost.get(row.postId) ?? {};
    map[row.reactionType] = Number(row.count);
    countsByPost.set(row.postId, map);
  }

  let viewerReactions: Map<number, ReactionType> = new Map();
  let viewerBookmarks: Set<number> = new Set();
  if (viewerId) {
    const myReactions = await db
      .select()
      .from(socialReactions)
      .where(
        and(
          inArray(socialReactions.postId, postIds),
          eq(socialReactions.userId, viewerId)
        )
      );
    viewerReactions = new Map(
      myReactions.map((r) => [r.postId, r.reactionType as ReactionType])
    );
    const bookmarks = await db
      .select({ postId: socialBookmarks.postId })
      .from(socialBookmarks)
      .where(
        and(
          inArray(socialBookmarks.postId, postIds),
          eq(socialBookmarks.userId, viewerId)
        )
      );
    viewerBookmarks = new Set(bookmarks.map((b) => b.postId));
  }

  const communityIds = Array.from(
    new Set(postRows.map((p) => p.communityId).filter((id): id is number => id != null))
  );
  let communityMap = new Map<number, { id: number; name: string; slug: string }>();
  if (communityIds.length > 0) {
    const comms = await db
      .select({
        id: socialCommunities.id,
        name: socialCommunities.name,
        slug: socialCommunities.slug,
      })
      .from(socialCommunities)
      .where(inArray(socialCommunities.id, communityIds));
    communityMap = new Map(comms.map((c) => [c.id, c]));
  }

  return postRows.map((post) => ({
    ...post,
    mediaUrls: parseJsonArray(post.mediaUrls),
    pollOptions: parsePollOptions(post.pollOptions),
    topicTags: post.topicTags
      ? post.topicTags.split(",").filter(Boolean)
      : [],
    author: authorMap.get(post.authorId) ?? null,
    community: post.communityId ? communityMap.get(post.communityId) ?? null : null,
    reactionCounts: countsByPost.get(post.id) ?? {},
    viewerReaction: viewerReactions.get(post.id) ?? null,
    viewerBookmarked: viewerBookmarks.has(post.id),
  }));
}

export async function getPostsByAuthor(authorId: number, limit = 12, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const postRows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.authorId, authorId))
    .orderBy(desc(socialPosts.createdAt))
    .limit(limit);
  return enrichPosts(postRows, viewerId);
}

export async function getFeedPosts(options: {
  mode: FeedMode;
  viewerId?: number;
  communityId?: number;
  maxIntensity?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const maxIntensity = options.maxIntensity ?? 5;

  let postRows: (typeof socialPosts.$inferSelect)[] = [];

  if (options.mode === "loops") {
    postRows = await db
      .select()
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.postType, "spark"),
          sql`${socialPosts.intensityLevel} <= ${maxIntensity}`
        )
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
  } else if (options.mode === "community" && options.communityId) {
    postRows = await db
      .select()
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.communityId, options.communityId),
          sql`${socialPosts.intensityLevel} <= ${maxIntensity}`
        )
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
  } else if (options.mode === "friends" && options.viewerId) {
    const following = await getFollowingIds(options.viewerId);
    if (following.length === 0) return [];
    postRows = await db
      .select()
      .from(socialPosts)
      .where(
        and(
          inArray(socialPosts.authorId, following),
          sql`${socialPosts.intensityLevel} <= ${maxIntensity}`
        )
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    postRows = await db
      .select()
      .from(socialPosts)
      .where(sql`${socialPosts.intensityLevel} <= ${maxIntensity}`)
      .orderBy(
        desc(
          sql`(${socialPosts.repostCount} * 2 + ${socialPosts.commentCount})`
        ),
        desc(socialPosts.createdAt)
      )
      .limit(limit)
      .offset(offset);
  }

  return enrichPosts(postRows, options.viewerId);
}

export async function createSocialPost(data: {
  authorId: number;
  postType: "text" | "media" | "poll" | "spark" | "article";
  content: string;
  communityId?: number;
  mediaUrls?: string[];
  pollOptions?: string[];
  topicTags?: string[];
  intensityLevel?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(socialPosts).values({
    authorId: data.authorId,
    postType: data.postType,
    content: data.content,
    communityId: data.communityId ?? null,
    mediaUrls: data.mediaUrls?.length ? JSON.stringify(data.mediaUrls) : null,
    pollOptions: data.pollOptions?.length ? JSON.stringify(data.pollOptions) : null,
    topicTags: data.topicTags?.join(",") ?? null,
    intensityLevel: data.intensityLevel ?? 2,
  });
  const rows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.authorId, data.authorId))
    .orderBy(desc(socialPosts.createdAt))
    .limit(1);
  const enriched = await enrichPosts(rows, data.authorId);
  return enriched[0];
}

export async function toggleReaction(
  postId: number,
  userId: number,
  reactionType: ReactionType
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(socialReactions)
    .where(
      and(
        eq(socialReactions.postId, postId),
        eq(socialReactions.userId, userId)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    if (existing[0].reactionType === reactionType) {
      await db
        .delete(socialReactions)
        .where(eq(socialReactions.id, existing[0].id));
      return { active: false as const, reactionType: null };
    }
    await db
      .update(socialReactions)
      .set({ reactionType })
      .where(eq(socialReactions.id, existing[0].id));
    return { active: true as const, reactionType };
  }
  await db.insert(socialReactions).values({ postId, userId, reactionType });
  return { active: true as const, reactionType };
}

export async function toggleBookmark(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(socialBookmarks)
    .where(
      and(
        eq(socialBookmarks.postId, postId),
        eq(socialBookmarks.userId, userId)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    await db.delete(socialBookmarks).where(eq(socialBookmarks.id, existing[0].id));
    return { bookmarked: false as const };
  }
  await db.insert(socialBookmarks).values({ postId, userId });
  return { bookmarked: true as const };
}

export async function repostPost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const original = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, postId))
    .limit(1);
  if (!original[0]) throw new Error("Post not found");
  await db.insert(socialPosts).values({
    authorId: userId,
    repostOfId: postId,
    postType: "text",
    content: original[0].content,
    communityId: original[0].communityId,
    mediaUrls: original[0].mediaUrls,
    intensityLevel: original[0].intensityLevel,
  });
  await db
    .update(socialPosts)
    .set({ repostCount: sql`${socialPosts.repostCount} + 1` })
    .where(eq(socialPosts.id, postId));
  return { success: true as const };
}

export async function votePoll(postId: number, userId: number, optionIndex: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(socialPollVotes)
    .where(
      and(eq(socialPollVotes.postId, postId), eq(socialPollVotes.userId, userId))
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(socialPollVotes)
      .set({ optionIndex })
      .where(eq(socialPollVotes.id, existing[0].id));
  } else {
    await db.insert(socialPollVotes).values({ postId, userId, optionIndex });
  }
  const votes = await db
    .select({
      optionIndex: socialPollVotes.optionIndex,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(socialPollVotes)
    .where(eq(socialPollVotes.postId, postId))
    .groupBy(socialPollVotes.optionIndex);
  return {
    counts: votes.map((v) => ({ optionIndex: v.optionIndex, count: Number(v.count) })),
    yourVote: optionIndex,
  };
}

export async function getPollResults(postId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return { counts: [] as { optionIndex: number; count: number }[], yourVote: null as number | null };
  const votes = await db
    .select({
      optionIndex: socialPollVotes.optionIndex,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(socialPollVotes)
    .where(eq(socialPollVotes.postId, postId))
    .groupBy(socialPollVotes.optionIndex);
  let yourVote: number | null = null;
  if (viewerId) {
    const mine = await db
      .select()
      .from(socialPollVotes)
      .where(
        and(eq(socialPollVotes.postId, postId), eq(socialPollVotes.userId, viewerId))
      )
      .limit(1);
    yourVote = mine[0]?.optionIndex ?? null;
  }
  return {
    counts: votes.map((v) => ({ optionIndex: v.optionIndex, count: Number(v.count) })),
    yourVote,
  };
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

export async function getComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      comment: socialComments,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        handle: users.handle,
      },
    })
    .from(socialComments)
    .innerJoin(users, eq(socialComments.authorId, users.id))
    .where(eq(socialComments.postId, postId))
    .orderBy(socialComments.createdAt);
}

export async function getActiveStories(viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const stories = await db
    .select({
      story: socialStories,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        handle: users.handle,
      },
    })
    .from(socialStories)
    .innerJoin(users, eq(socialStories.authorId, users.id))
    .where(gt(socialStories.expiresAt, now))
    .orderBy(desc(socialStories.createdAt));

  if (!viewerId) return stories.map((s) => ({ ...s, viewed: false }));

  const storyIds = stories.map((s) => s.story.id);
  if (storyIds.length === 0) return [];
  const views = await db
    .select({ storyId: socialStoryViews.storyId })
    .from(socialStoryViews)
    .where(
      and(
        inArray(socialStoryViews.storyId, storyIds),
        eq(socialStoryViews.userId, viewerId)
      )
    );
  const viewedSet = new Set(views.map((v) => v.storyId));
  return stories.map((s) => ({ ...s, viewed: viewedSet.has(s.story.id) }));
}

export async function createStory(data: {
  authorId: number;
  mediaUrl: string;
  caption?: string;
  gradientStyle?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(socialStories).values({
    authorId: data.authorId,
    mediaUrl: data.mediaUrl,
    caption: data.caption ?? null,
    gradientStyle: data.gradientStyle ?? "aurora",
    expiresAt,
  });
}

export async function markStoryViewed(storyId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(socialStoryViews)
    .where(
      and(
        eq(socialStoryViews.storyId, storyId),
        eq(socialStoryViews.userId, userId)
      )
    )
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(socialStoryViews).values({ storyId, userId });
}

export async function getTrendingTopics(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ topicTags: socialPosts.topicTags })
    .from(socialPosts)
    .orderBy(desc(socialPosts.createdAt))
    .limit(50);
  const freq = new Map<string, number>();
  for (const row of rows) {
    if (!row.topicTags) continue;
    for (const tag of row.topicTags.split(",")) {
      const t = tag.trim();
      if (t) freq.set(t, (freq.get(t) ?? 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
