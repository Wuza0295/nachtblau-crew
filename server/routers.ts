import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { FREQUENCIES, FORMATS } from "@shared/site";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addToCollection,
  createCollection,
  createComment,
  createPost,
  getCircleMembers,
  getCollectionItems,
  getCollections,
  getComments,
  getFeed,
  getInnerCircleCount,
  getPostById,
  getPostsByAuthor,
  getProfileStats,
  getSpaceBySlug,
  getSpaceMembers,
  getUserById,
  isSpaceMember,
  joinSpace,
  listDemoUsers,
  listSpaces,
  setCircleTier,
  toggleReaction,
  updateUserProfile,
} from "./db";

const frequencyEnum = z.enum(["inner", "orbit", "horizon", "drift"]);
const formatEnum = z.enum(["pulse", "frame", "depth", "moment"]);
const visibilityEnum = z.enum(["inner", "orbit", "horizon", "public"]);
const reactionEnum = z.enum(["resonate", "save", "amplify"]);

const feedRouter = router({
  get: publicProcedure
    .input(
      z.object({
        frequency: frequencyEnum.default("orbit"),
        spaceSlug: z.string().optional(),
        limit: z.number().min(1).max(50).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await getFeed({
        frequency: input.frequency,
        viewerId: ctx.user?.id,
        spaceSlug: input.spaceSlug,
        limit: input.limit,
      });
      return {
        frequency: input.frequency,
        meta: FREQUENCIES.find((f) => f.id === input.frequency),
        posts,
      };
    }),
});

const postRouter = router({
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await getPostById(input.id, ctx.user?.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      const comments = await getComments(input.id);
      return { post, comments };
    }),

  create: protectedProcedure
    .input(
      z.object({
        format: formatEnum,
        content: z.string().min(1).max(8000),
        title: z.string().max(256).optional(),
        mediaUrl: z.string().url().optional().or(z.literal("")),
        mediaAlt: z.string().max(256).optional(),
        spaceId: z.number().optional(),
        visibility: visibilityEnum.default("orbit"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.format === "depth" && !input.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tiefe-Beiträge brauchen einen Titel",
        });
      }
      if (input.visibility === "inner") {
        // ok
      }
      return createPost({
        authorId: ctx.user.id,
        format: input.format,
        content: input.content,
        title: input.title,
        mediaUrl: input.mediaUrl || undefined,
        mediaAlt: input.mediaAlt,
        spaceId: input.spaceId,
        visibility: input.visibility,
        isEphemeral: input.format === "moment",
      });
    }),

  react: protectedProcedure
    .input(z.object({ postId: z.number(), type: reactionEnum }))
    .mutation(async ({ ctx, input }) => {
      return toggleReaction(input.postId, ctx.user.id, input.type);
    }),

  comment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      return createComment({
        postId: input.postId,
        authorId: ctx.user.id,
        content: input.content,
      });
    }),
});

const circleRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          userId: z.number().optional(),
          tier: z.enum(["inner", "orbit"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = input?.userId ?? ctx.user?.id ?? 1;
      const members = await getCircleMembers(userId, input?.tier);
      const innerCount = await getInnerCircleCount(userId);
      return { members, innerCount, innerLimit: 12 };
    }),

  set: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        tier: z.enum(["inner", "orbit"]).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.memberId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Du kannst dich nicht selbst in den Kreis setzen",
        });
      }
      try {
        return await setCircleTier(ctx.user.id, input.memberId, input.tier);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Fehler",
        });
      }
    }),
});

const spaceRouter = router({
  list: publicProcedure.query(async () => listSpaces()),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const space = await getSpaceBySlug(input.slug);
      if (!space) throw new TRPCError({ code: "NOT_FOUND" });
      const members = await getSpaceMembers(space.id);
      const joined = ctx.user
        ? await isSpaceMember(space.id, ctx.user.id)
        : false;
      const feed = await getFeed({
        frequency: "horizon",
        spaceSlug: space.slug,
        viewerId: ctx.user?.id,
      });
      return { space, members, joined, posts: feed };
    }),

  join: protectedProcedure
    .input(z.object({ spaceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return joinSpace(input.spaceId, ctx.user.id);
    }),
});

const collectionRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = input?.userId ?? ctx.user?.id ?? 1;
      return getCollections(userId);
    }),

  items: publicProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getCollectionItems(input.collectionId, ctx.user?.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createCollection(ctx.user.id, input.name, input.description);
    }),

  add: protectedProcedure
    .input(z.object({ collectionId: z.number(), postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await addToCollection(input.collectionId, input.postId, ctx.user.id);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Fehler",
        });
      }
    }),
});

const profileRouter = router({
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const [stats, posts, circles, collections] = await Promise.all([
        getProfileStats(input.userId),
        getPostsByAuthor(input.userId, ctx.user?.id),
        getCircleMembers(input.userId),
        getCollections(input.userId),
      ]);
      return {
        user: {
          id: user.id,
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          bio: user.bio,
          vibe: user.vibe,
          role: user.role,
          createdAt: user.createdAt,
        },
        stats,
        posts,
        circles,
        collections,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64).optional(),
        bio: z.string().max(500).optional(),
        vibe: z.string().max(120).optional(),
        handle: z.string().min(2).max(32).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  directory: publicProcedure.query(async () => listDemoUsers()),
});

const metaRouter = router({
  concept: publicProcedure.query(() => ({
    frequencies: FREQUENCIES,
    formats: FORMATS,
    manifesto: {
      title: "Distanz statt Algorithmus",
      points: [
        "Innenkreis: max. 12 Menschen — chronologisch, intim (BeReal + Close Friends)",
        "Orbit: bewusste Following-Timeline ohne Ranking-Chaos (X / Bluesky)",
        "Horizont: Themen-Räume mit Diskussionstiefe (Reddit + Discord)",
        "Drift: Entdeckung nur auf Abruf, Ranking transparent (TikTok / Pinterest opt-in)",
        "Formate: Puls, Bild, Tiefe, Moment — das Beste jeder Plattform, ein Konto",
        "Reaktionen: Resonanz, Merken, Weitergeben — statt leerer Likes",
      ],
    },
  })),
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
  feed: feedRouter,
  post: postRouter,
  circle: circleRouter,
  space: spaceRouter,
  collection: collectionRouter,
  profile: profileRouter,
  meta: metaRouter,
});

export type AppRouter = typeof appRouter;
