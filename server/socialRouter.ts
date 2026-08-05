import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  REACTION_EMOJIS,
  addPostComment,
  createSocialPost,
  createStory,
  getActiveStories,
  getCommunities,
  getCommunityBySlug,
  getFeedPosts,
  getFollowStats,
  getPostComments,
  getTodayMoment,
  getTrendingTopics,
  getUserSocialPosts,
  isCommunityMember,
  joinCommunity,
  setPostReaction,
  toggleFollow,
  togglePostSave,
  togglePostVote,
} from "./socialDb";

const feedModeSchema = z.enum(["following", "discover", "chronological"]);

const reactionEmojiSchema = z.enum(["❤️", "🔥", "😂", "💡", "👏", "🎯"]);

export const socialRouter = router({
  getFeed: publicProcedure
    .input(
      z.object({
        mode: feedModeSchema.default("discover"),
        communityId: z.number().optional(),
        postKind: z.enum(["feed", "pulse", "moment"]).default("feed"),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getFeedPosts({
        mode: input.mode,
        userId: ctx.user?.id,
        communityId: input.communityId,
        postKind: input.postKind,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(4000),
        communityId: z.number().optional(),
        mediaUrl: z.string().url().optional().or(z.literal("")),
        mediaType: z.enum(["none", "image", "video"]).default("none"),
        postKind: z.enum(["feed", "pulse", "moment"]).default("feed"),
        repostOfId: z.number().optional(),
        quoteText: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.postKind === "moment") {
        const existing = await getTodayMoment(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Du hast heute bereits deinen echten Moment geteilt.",
          });
        }
      }
      const id = await createSocialPost({
        authorId: ctx.user.id,
        content: input.content,
        communityId: input.communityId,
        mediaUrl: input.mediaUrl || undefined,
        mediaType: input.mediaType,
        postKind: input.postKind,
        repostOfId: input.repostOfId,
        quoteText: input.quoteText,
      });
      return { id };
    }),

  vote: protectedProcedure
    .input(z.object({ postId: z.number(), value: z.union([z.literal(1), z.literal(-1)]) }))
    .mutation(async ({ ctx, input }) => togglePostVote(input.postId, ctx.user.id, input.value)),

  react: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        emoji: reactionEmojiSchema,
      })
    )
    .mutation(async ({ ctx, input }) => setPostReaction(input.postId, ctx.user.id, input.emoji)),

  toggleSave: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => togglePostSave(input.postId, ctx.user.id)),

  getComments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => getPostComments(input.postId)),

  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      await addPostComment(input.postId, ctx.user.id, input.content);
      return { success: true };
    }),

  getCommunities: publicProcedure.query(async () => getCommunities()),

  getCommunity: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const community = await getCommunityBySlug(input.slug);
      if (!community) throw new TRPCError({ code: "NOT_FOUND" });
      const member =
        ctx.user?.id != null
          ? await isCommunityMember(community.id, ctx.user.id)
          : false;
      return { community, isMember: member };
    }),

  joinCommunity: protectedProcedure
    .input(z.object({ communityId: z.number() }))
    .mutation(async ({ ctx, input }) => joinCommunity(input.communityId, ctx.user.id)),

  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => toggleFollow(ctx.user.id, input.userId)),

  getFollowStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => getFollowStats(input.userId, ctx.user?.id)),

  getStories: publicProcedure.query(async () => getActiveStories()),

  createStory: protectedProcedure
    .input(
      z.object({
        caption: z.string().max(280).optional(),
        mediaUrl: z.string().url().optional(),
        backgroundStyle: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createStory({ authorId: ctx.user.id, ...input });
      return { success: true };
    }),

  getTrending: publicProcedure.query(async () => getTrendingTopics()),

  getTodayMoment: protectedProcedure.query(async ({ ctx }) => getTodayMoment(ctx.user.id)),

  getUserPosts: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => getUserSocialPosts(input.userId, input.limit)),

  reactionEmojis: publicProcedure.query(() => [...REACTION_EMOJIS]),
});
