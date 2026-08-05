import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getUserById, updateUserProfile } from "./db";
import {
  createPost,
  getConversation,
  getCircle,
  getDiscover,
  getPost,
  getPreferences,
  getProfile,
  listBoards,
  listCircles,
  listConversations,
  listFeed,
  listMoments,
  listRooms,
  markMomentViewed,
  sendMessage,
  setActiveLens,
  setAlgorithmMix,
  toggleFollow,
  toggleJoinCircle,
  toggleSignal,
} from "./social";
import { FEED_LENSES, SIGNAL_TYPES } from "@shared/brand";
import { TRPCError } from "@trpc/server";

const lensSchema = z.enum(["pulse", "canvas", "stream", "depth"]);
const signalSchema = z.enum(["amplify", "echo", "agree", "collect"]);

const socialRouter = router({
  meta: publicProcedure.query(() => ({
    lenses: FEED_LENSES,
    signals: SIGNAL_TYPES,
  })),

  preferences: publicProcedure.query(() => getPreferences()),

  setAlgorithmMix: publicProcedure
    .input(z.object({ mix: z.number().min(0).max(100) }))
    .mutation(({ input }) => ({ algorithmMix: setAlgorithmMix(input.mix) })),

  setLens: publicProcedure
    .input(z.object({ lens: lensSchema }))
    .mutation(({ input }) => ({ activeLens: setActiveLens(input.lens) })),

  feed: publicProcedure
    .input(
      z
        .object({
          lens: z.union([lensSchema, z.literal("all")]).optional(),
          mix: z.number().min(0).max(100).optional(),
          circleId: z.string().optional(),
        })
        .optional()
    )
    .query(({ input }) => listFeed(input ?? {})),

  post: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const post = getPost(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  createPost: publicProcedure
    .input(
      z.object({
        lens: lensSchema,
        body: z.string().min(1).max(4000),
        mediaUrl: z.string().url().optional(),
        circleId: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const authorId = ctx.user ? `u${ctx.user.id}` : "u1";
      return createPost({
        authorId: authorId.startsWith("u") && authorId.length < 6 ? "u1" : "u1",
        ...input,
      });
    }),

  signal: publicProcedure
    .input(z.object({ postId: z.string(), signal: signalSchema }))
    .mutation(({ input }) => {
      const post = toggleSignal(input.postId, input.signal);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  moments: publicProcedure.query(() => listMoments()),

  viewMoment: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const moment = markMomentViewed(input.id);
      if (!moment) throw new TRPCError({ code: "NOT_FOUND" });
      return moment;
    }),

  circles: publicProcedure.query(() => listCircles()),

  circle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      const circle = getCircle(input.slug);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });
      return circle;
    }),

  toggleJoin: publicProcedure
    .input(z.object({ circleId: z.string() }))
    .mutation(({ input }) => {
      const circle = toggleJoinCircle(input.circleId);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });
      return circle;
    }),

  boards: publicProcedure.query(() => listBoards()),

  rooms: publicProcedure.query(() => listRooms()),

  conversations: publicProcedure.query(() => listConversations()),

  conversation: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const conversation = getConversation(input.id);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND" });
      return conversation;
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        body: z.string().min(1).max(2000),
      })
    )
    .mutation(({ input }) => sendMessage(input.conversationId, "u1", input.body)),

  profile: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(({ input }) => {
      const profile = getProfile(input.handle);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      return profile;
    }),

  toggleFollow: publicProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(({ input }) => {
      const profile = toggleFollow(input.profileId);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      return profile;
    }),

  discover: publicProcedure.query(() => getDiscover()),
});

const profileRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        stats: { threadCount: 0, postCount: 0 },
        recentThreads: [],
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64).optional(),
        bio: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  social: socialRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
