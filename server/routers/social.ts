import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  addComment,
  createSocialPost,
  createStory,
  followUser,
  getActiveStories,
  getComments,
  getCommunityBySlug,
  getFeedPosts,
  getPollResults,
  getSocialCommunities,
  getTrendingTopics,
  joinCommunity,
  markStoryViewed,
  repostPost,
  toggleBookmark,
  toggleReaction,
  votePoll,
} from "../socialDb";

const feedModeSchema = z.enum(["friends", "discover", "loops", "community"]);
const reactionSchema = z.enum(["heart", "fire", "insight", "support", "laugh"]);
const postTypeSchema = z.enum(["text", "media", "poll", "spark", "article"]);

export const socialRouter = router({
  getFeed: publicProcedure
    .input(
      z.object({
        mode: feedModeSchema.default("discover"),
        communitySlug: z.string().optional(),
        maxIntensity: z.number().min(0).max(5).default(5),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let communityId: number | undefined;
      if (input.mode === "community" && input.communitySlug) {
        const community = await getCommunityBySlug(input.communitySlug);
        if (!community) throw new TRPCError({ code: "NOT_FOUND" });
        communityId = community.id;
      }
      const posts = await getFeedPosts({
        mode: input.mode,
        viewerId: ctx.user?.id,
        communityId,
        maxIntensity: input.maxIntensity,
        limit: input.limit,
        offset: input.offset,
      });
      return { posts };
    }),

  getCommunities: publicProcedure.query(async () => {
    return getSocialCommunities();
  }),

  getCommunity: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const community = await getCommunityBySlug(input.slug);
      if (!community) throw new TRPCError({ code: "NOT_FOUND" });
      return community;
    }),

  joinCommunity: protectedProcedure
    .input(z.object({ communityId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return joinCommunity(input.communityId, ctx.user.id);
    }),

  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return followUser(ctx.user.id, input.userId);
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        postType: postTypeSchema.default("text"),
        content: z.string().min(1).max(4000),
        communityId: z.number().optional(),
        mediaUrls: z.array(z.string()).max(4).optional(),
        pollOptions: z.array(z.string().min(1).max(120)).min(2).max(4).optional(),
        topicTags: z.array(z.string().max(32)).max(5).optional(),
        intensityLevel: z.number().min(0).max(5).default(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.postType === "poll" && !input.pollOptions?.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Umfrage braucht Optionen" });
      }
      const post = await createSocialPost({
        authorId: ctx.user.id,
        postType: input.postType,
        content: input.content,
        communityId: input.communityId,
        mediaUrls: input.mediaUrls,
        pollOptions: input.pollOptions,
        topicTags: input.topicTags,
        intensityLevel: input.intensityLevel,
      });
      return post;
    }),

  react: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        reactionType: reactionSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return toggleReaction(input.postId, ctx.user.id, input.reactionType);
    }),

  bookmark: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return toggleBookmark(input.postId, ctx.user.id);
    }),

  repost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return repostPost(input.postId, ctx.user.id);
    }),

  votePoll: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        optionIndex: z.number().min(0).max(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return votePoll(input.postId, ctx.user.id, input.optionIndex);
    }),

  getPollResults: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getPollResults(input.postId, ctx.user?.id);
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return getComments(input.postId);
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await addComment(input.postId, ctx.user.id, input.content);
      return { success: true as const };
    }),

  getStories: publicProcedure.query(async ({ ctx }) => {
    return getActiveStories(ctx.user?.id);
  }),

  createStory: protectedProcedure
    .input(
      z.object({
        mediaUrl: z.string().min(1),
        caption: z.string().max(280).optional(),
        gradientStyle: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createStory({
        authorId: ctx.user.id,
        mediaUrl: input.mediaUrl,
        caption: input.caption,
        gradientStyle: input.gradientStyle,
      });
      return { success: true as const };
    }),

  viewStory: protectedProcedure
    .input(z.object({ storyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markStoryViewed(input.storyId, ctx.user.id);
      return { success: true as const };
    }),

  getTrending: publicProcedure.query(async () => {
    return getTrendingTopics();
  }),
});
