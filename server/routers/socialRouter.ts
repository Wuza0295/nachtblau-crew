import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  addComment,
  createSocialPost,
  followUser,
  getActiveStories,
  getCircleBySlug,
  getCircles,
  getComments,
  getDailyMomentPrompt,
  getFeedPosts,
  getFlashes,
  getPostsByHashtag,
  getTrendingHashtags,
  getUserReactionsForPosts,
  getUserSocialStats,
  isCircleMember,
  isFollowing,
  joinCircle,
  leaveCircle,
  searchPortal,
  toggleReaction,
  unfollowUser,
} from "../socialDb";

const feedModeSchema = z.enum(["following", "discover", "chronological"]);
const postTypeSchema = z.enum(["wave", "flash", "moment", "story"]);
const reactionKindSchema = z.enum(["love", "fire", "insight", "celebrate", "support"]);

async function enrichPostsWithReactions<T extends { post: { id: number } }>(
  rows: T[],
  userId: number | undefined
) {
  const reactions = await getUserReactionsForPosts(
    userId,
    rows.map((r) => r.post.id)
  );
  return rows.map((r) => ({
    ...r,
    myReaction: reactions[r.post.id] ?? null,
  }));
}

export const socialRouter = router({
  getCircles: publicProcedure.query(async () => getCircles()),

  getCircle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const circle = await getCircleBySlug(input.slug);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });
      const isMember = ctx.user ? await isCircleMember(circle.id, ctx.user.id) : false;
      return { circle, isMember };
    }),

  joinCircle: protectedProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(async ({ ctx, input }) => joinCircle(input.circleId, ctx.user.id)),

  leaveCircle: protectedProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(async ({ ctx, input }) => leaveCircle(input.circleId, ctx.user.id)),

  getFeed: publicProcedure
    .input(
      z.object({
        mode: feedModeSchema.default("discover"),
        circleId: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const rows = await getFeedPosts({
        mode: input.mode,
        userId: ctx.user?.id,
        circleId: input.circleId,
        limit: input.limit,
        offset: input.offset,
      });
      return enrichPostsWithReactions(rows, ctx.user?.id);
    }),

  getFlashes: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const rows = await getFlashes(input.limit, input.offset);
      return enrichPostsWithReactions(rows, ctx.user?.id);
    }),

  getStories: publicProcedure.query(async () => getActiveStories()),

  getMomentPrompt: publicProcedure.query(() => ({
    prompt: getDailyMomentPrompt(),
    windowHours: 24,
  })),

  createPost: protectedProcedure
    .input(
      z.object({
        type: postTypeSchema,
        content: z.string().max(2000).optional(),
        mediaUrl: z.string().url().optional(),
        mediaAspect: z.enum(["square", "portrait", "landscape"]).optional(),
        circleId: z.number().optional(),
        visibility: z.enum(["public", "followers", "circle"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "wave" && (!input.content || input.content.trim().length < 1)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Wave braucht Text" });
      }
      if (input.type === "moment") {
        const prompt = getDailyMomentPrompt();
        return createSocialPost({
          authorId: ctx.user.id,
          type: "moment",
          content: input.content,
          mediaUrl: input.mediaUrl,
          momentPrompt: prompt,
          visibility: input.visibility ?? "public",
        });
      }
      return createSocialPost({
        authorId: ctx.user.id,
        type: input.type,
        content: input.content,
        mediaUrl: input.mediaUrl,
        mediaAspect: input.mediaAspect,
        circleId: input.circleId,
        visibility: input.visibility ?? "public",
      });
    }),

  react: protectedProcedure
    .input(z.object({ postId: z.number(), kind: reactionKindSchema }))
    .mutation(async ({ ctx, input }) => toggleReaction(input.postId, ctx.user.id, input.kind)),

  getComments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => getComments(input.postId)),

  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      await addComment(input.postId, ctx.user.id, input.content);
      return { success: true };
    }),

  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => followUser(ctx.user.id, input.userId)),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => unfollowUser(ctx.user.id, input.userId)),

  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => isFollowing(ctx.user.id, input.userId)),

  getSocialStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => getUserSocialStats(input.userId)),

  search: publicProcedure
    .input(z.object({ query: z.string().min(2).max(100) }))
    .query(async ({ input }) => searchPortal(input.query)),

  getTrendingTags: publicProcedure.query(async () => getTrendingHashtags()),

  getByHashtag: publicProcedure
    .input(z.object({ tag: z.string().min(1), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const rows = await getPostsByHashtag(input.tag, input.limit);
      return enrichPostsWithReactions(rows, ctx.user?.id);
    }),
});
