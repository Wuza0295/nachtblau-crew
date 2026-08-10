import {
  and,
  count,
  desc,
  eq,
  inArray,
  lt,
  or,
} from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createPostSchema,
  type ApiPost,
  type FeedResponse,
} from "@hybrixon/contracts";
import { publicUser, requireAuth } from "../auth.js";
import {
  comments,
  mediaAssets,
  posts,
  reactions,
  users,
} from "../db/schema.js";
import { db } from "../services.js";
import { serializeMedia } from "./media.js";

const feedQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const idParams = z.object({ id: z.coerce.number().int().positive() });

async function optionalAuth(request: FastifyRequest): Promise<void> {
  if (!request.headers.authorization) return;
  try {
    await request.jwtVerify();
  } catch {
    // Public feed remains available; invalid token has no viewer privileges.
  }
}

export async function postRoutes(app: FastifyInstance): Promise<void> {
  app.get("/posts", { preHandler: optionalAuth }, async (request) => {
    const input = feedQuery.parse(request.query);
    const viewerId = request.user?.sub;
    const conditions = [
      viewerId
        ? or(eq(posts.visibility, "public"), eq(posts.authorId, viewerId))
        : eq(posts.visibility, "public"),
      input.cursor ? lt(posts.id, input.cursor) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const rows = await db.select({ post: posts, author: users })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.id))
      .limit(input.limit + 1);
    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const postIds = page.map((row) => row.post.id);

    const [assets, reactionCounts, commentCounts, viewerReactions] = postIds.length
      ? await Promise.all([
          db.select().from(mediaAssets)
            .where(inArray(mediaAssets.postId, postIds))
            .orderBy(mediaAssets.sortOrder),
          db.select({ postId: reactions.postId, value: count() })
            .from(reactions)
            .where(inArray(reactions.postId, postIds))
            .groupBy(reactions.postId),
          db.select({ postId: comments.postId, value: count() })
            .from(comments)
            .where(inArray(comments.postId, postIds))
            .groupBy(comments.postId),
          viewerId
            ? db.select({ postId: reactions.postId }).from(reactions)
                .where(and(
                  eq(reactions.userId, viewerId),
                  inArray(reactions.postId, postIds),
                ))
            : Promise.resolve([]),
        ])
      : [[], [], [], []];

    const byPost = new Map<number, typeof assets>();
    assets.forEach((asset) => {
      if (!asset.postId) return;
      const list = byPost.get(asset.postId) ?? [];
      list.push(asset);
      byPost.set(asset.postId, list);
    });
    const likes = new Map(reactionCounts.map((row) => [row.postId, Number(row.value)]));
    const commentMap = new Map(commentCounts.map((row) => [row.postId, Number(row.value)]));
    const liked = new Set(viewerReactions.map((row) => row.postId));

    const result: FeedResponse = {
      posts: page.map(({ post, author }): ApiPost => ({
        id: post.id,
        body: post.body,
        isAdult: post.isAdult,
        visibility: post.visibility,
        createdAt: post.createdAt.toISOString(),
        author: publicUser(author),
        media: (byPost.get(post.id) ?? []).map(serializeMedia),
        likeCount: likes.get(post.id) ?? 0,
        commentCount: commentMap.get(post.id) ?? 0,
        likedByViewer: liked.has(post.id),
      })),
      nextCursor: hasMore ? String(page.at(-1)?.post.id ?? "") : null,
    };
    return result;
  });

  app.post("/posts", { preHandler: requireAuth }, async (request, reply) => {
    const input = createPostSchema.parse(request.body);
    const created = await db.transaction(async (tx) => {
      const assets = input.mediaIds.length
        ? await tx.select().from(mediaAssets).where(and(
            inArray(mediaAssets.id, input.mediaIds),
            eq(mediaAssets.ownerId, request.user.sub),
          ))
        : [];
      if (assets.length !== input.mediaIds.length) {
        const error = new Error("Mindestens ein Medium ist ungültig.") as Error & { statusCode: number };
        error.statusCode = 400;
        throw error;
      }
      if (assets.some((asset) => asset.postId || ["initiated", "failed"].includes(asset.status))) {
        const error = new Error("Ein Medium ist nicht bereit oder wurde bereits verwendet.") as Error & { statusCode: number };
        error.statusCode = 409;
        throw error;
      }
      const [post] = await tx.insert(posts).values({
        authorId: request.user.sub,
        body: input.body,
        isAdult: input.isAdult,
        visibility: input.visibility,
      }).returning();
      if (!post) throw new Error("Beitrag konnte nicht gespeichert werden.");
      for (const [sortOrder, mediaId] of input.mediaIds.entries()) {
        await tx.update(mediaAssets).set({
          postId: post.id,
          sortOrder,
          updatedAt: new Date(),
        }).where(eq(mediaAssets.id, mediaId));
      }
      return post;
    });
    return reply.code(201).send({ postId: created.id });
  });

  app.post("/posts/:id/like", { preHandler: requireAuth }, async (request) => {
    const { id } = idParams.parse(request.params);
    const [existing] = await db.select().from(reactions).where(and(
      eq(reactions.postId, id),
      eq(reactions.userId, request.user.sub),
    )).limit(1);
    if (existing) {
      await db.delete(reactions).where(and(
        eq(reactions.postId, id),
        eq(reactions.userId, request.user.sub),
      ));
      return { liked: false };
    }
    await db.insert(reactions).values({ postId: id, userId: request.user.sub });
    return { liked: true };
  });
}
