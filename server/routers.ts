import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { PULSE_TOPICS } from "@shared/site";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addToBoard,
  createBoard,
  createComment,
  createSocialPost,
  followUser,
  getActiveSignals,
  getBoardById,
  getBoardItems,
  getBoardsByUser,
  getCircleBySlug,
  getCircles,
  getComments,
  getFeed,
  getFollowerCounts,
  getPostById,
  getPostsByAuthor,
  getPulseDials,
  getUserById,
  getUserPostCount,
  getUserResonance,
  isCircleMember,
  isFollowing,
  joinCircle,
  leaveCircle,
  resonate,
  setAllPulseDials,
  setPulseDial,
  unfollowUser,
  updateUserProfile,
} from "./db";

const topicEnum = z.enum(
  PULSE_TOPICS.map((t) => t.id) as [string, ...string[]]
);

// ─── Pulse (user-controlled algorithm dials) ──────────────────────────────────
const pulseRouter = router({
  getDials: protectedProcedure.query(async ({ ctx }) => {
    return getPulseDials(ctx.user.id);
  }),

  getTopics: publicProcedure.query(() => PULSE_TOPICS),

  setDial: protectedProcedure
    .input(z.object({ topic: topicEnum, weight: z.number().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await setPulseDial(ctx.user.id, input.topic, input.weight);
      return { success: true };
    }),

  setAll: protectedProcedure
    .input(
      z.object({
        dials: z.array(
          z.object({ topic: topicEnum, weight: z.number().min(0).max(100) })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await setAllPulseDials(ctx.user.id, input.dials);
      return { success: true };
    }),
});

// ─── Feed & Posts ─────────────────────────────────────────────────────────────
const feedRouter = router({
  get: publicProcedure
    .input(
      z.object({
        mode: z
          .enum(["pulse", "following", "latest", "circle", "explore"])
          .default("pulse"),
        circleId: z.number().optional(),
        topic: topicEnum.optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getFeed({
        userId: ctx.user?.id,
        mode: input.mode,
        circleId: input.circleId,
        topic: input.topic,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  signals: publicProcedure.query(async () => getActiveSignals(24)),

  getPost: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const row = await getPostById(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const myResonance = ctx.user
        ? await getUserResonance(input.id, ctx.user.id)
        : null;
      return { ...row, myResonance };
    }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["text", "image", "essay", "signal"]).default("text"),
        title: z.string().max(256).optional(),
        content: z.string().min(1).max(8000),
        mediaUrl: z.string().url().optional().or(z.literal("")),
        topic: topicEnum,
        circleId: z.number().optional(),
        isAiLabeled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt =
        input.type === "signal"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : undefined;

      const id = await createSocialPost({
        authorId: ctx.user.id,
        type: input.type,
        title: input.title,
        content: input.content,
        mediaUrl: input.mediaUrl || null,
        topic: input.topic,
        circleId: input.circleId,
        isAiLabeled: input.isAiLabeled ?? false,
        expiresAt,
      });
      return { id };
    }),

  resonate: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        weight: z.number().min(1).max(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await resonate(input.postId, ctx.user.id, input.weight);
      // Soft-boost dial for the post's topic
      const post = await getPostById(input.postId);
      if (post) {
        const dials = await getPulseDials(ctx.user.id);
        const current = dials.find((d) => d.topic === post.post.topic);
        const bump = input.weight === 3 ? 4 : input.weight === 2 ? 2 : 1;
        const next = Math.min(100, (current?.weight ?? 40) + bump);
        await setPulseDial(ctx.user.id, post.post.topic, next);
      }
      return { success: true };
    }),

  comments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => getComments(input.postId)),

  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1).max(2000),
        parentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      await createComment({
        postId: input.postId,
        authorId: ctx.user.id,
        content: input.content,
        parentId: input.parentId,
      });
      return { success: true };
    }),
});

// ─── Circles ──────────────────────────────────────────────────────────────────
const circlesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          featured: z.boolean().optional(),
          topic: topicEnum.optional(),
        })
        .optional()
    )
    .query(async ({ input }) => getCircles(input)),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const circle = await getCircleBySlug(input.slug);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });
      const member = ctx.user
        ? await isCircleMember(circle.id, ctx.user.id)
        : false;
      return { circle, isMember: member };
    }),

  join: protectedProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await joinCircle(input.circleId, ctx.user.id);
      return { success: true };
    }),

  leave: protectedProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await leaveCircle(input.circleId, ctx.user.id);
      return { success: true };
    }),
});

// ─── Boards ───────────────────────────────────────────────────────────────────
const boardsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => getBoardsByUser(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createBoard({
        ownerId: ctx.user.id,
        name: input.name,
        description: input.description,
      });
      return { id };
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const board = await getBoardById(input.id);
      if (!board) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getBoardItems(input.id);
      return { board, items };
    }),

  savePost: protectedProcedure
    .input(z.object({ boardId: z.number(), postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const board = await getBoardById(input.boardId);
      if (!board || board.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await addToBoard(input.boardId, input.postId);
      return { success: true };
    }),
});

// ─── Profile ──────────────────────────────────────────────────────────────────
const profileRouter = router({
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const [postCount, counts, recent, following] = await Promise.all([
        getUserPostCount(input.userId),
        getFollowerCounts(input.userId),
        getPostsByAuthor(input.userId, 12),
        ctx.user
          ? isFollowing(ctx.user.id, input.userId)
          : Promise.resolve(false),
      ]);
      return {
        user: {
          id: user.id,
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          bio: user.bio,
          mood: user.mood,
          role: user.role,
          createdAt: user.createdAt,
        },
        stats: { postCount, ...counts },
        recent,
        isFollowing: following,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64).optional(),
        handle: z
          .string()
          .min(2)
          .max(32)
          .regex(/^[a-z0-9_]+$/i)
          .optional(),
        bio: z.string().max(500).optional(),
        mood: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await followUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await unfollowUser(ctx.user.id, input.userId);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
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
  pulse: pulseRouter,
  feed: feedRouter,
  circles: circlesRouter,
  boards: boardsRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
