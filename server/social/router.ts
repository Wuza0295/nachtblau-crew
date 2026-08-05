import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as store from "./store";

const lensSchema = z.enum(["pulse", "canvas", "motion", "circles", "signal", "vault"]);
const intentSchema = z.enum(["browse", "connect", "create", "focus"]);
const kindSchema = z.enum(["text", "image", "carousel", "video", "article", "collection"]);

function viewerId(user: { id: number } | null | undefined, demoFallback = true) {
  if (user?.id) {
    store.ensureViewerProfile(user);
    return user.id;
  }
  return demoFallback ? store.DEMO_VIEWER_ID : null;
}

export const socialRouter = router({
  concept: publicProcedure.query(() => store.getConcept()),

  feed: publicProcedure
    .input(
      z
        .object({
          lens: z.union([lensSchema, z.literal("all")]).default("all"),
          mode: z.enum(["for-you", "following", "latest"]).default("for-you"),
          intent: intentSchema.optional(),
          limit: z.number().min(1).max(50).default(24),
          demo: z.boolean().default(true),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const opts = input ?? {
        lens: "all" as const,
        mode: "for-you" as const,
        limit: 24,
        demo: true,
      };
      return store.getFeed({
        lens: opts.lens,
        mode: opts.mode,
        intent: opts.intent,
        limit: opts.limit,
        viewerId: viewerId(ctx.user, opts.demo),
      });
    }),

  stories: publicProcedure.query(({ ctx }) => {
    return store.getStories(viewerId(ctx.user));
  }),

  post: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      const post = store.getPost(input.id, viewerId(ctx.user));
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        post,
        replies: store.getReplies(input.id),
      };
    }),

  createPost: publicProcedure
    .input(
      z.object({
        kind: kindSchema.default("text"),
        lenses: z.array(lensSchema).min(1),
        title: z.string().max(200).optional(),
        body: z.string().min(1).max(8000),
        mediaUrls: z.array(z.string().url()).max(8).optional(),
        tags: z.array(z.string().max(32)).max(8).optional(),
        circleId: z.number().optional(),
        collectionId: z.number().optional(),
        asDemo: z.boolean().default(true),
      })
    )
    .mutation(({ ctx, input }) => {
      const authorId = ctx.user?.id ?? (input.asDemo ? store.DEMO_VIEWER_ID : null);
      if (!authorId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Bitte anmelden oder Demo nutzen" });
      }
      return store.createPost({
        authorId,
        kind: input.kind,
        lenses: input.lenses,
        title: input.title,
        body: input.body,
        mediaUrls: input.mediaUrls,
        tags: input.tags,
        circleId: input.circleId,
        collectionId: input.collectionId,
      });
    }),

  like: publicProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      const post = store.toggleLike(input.postId, uid);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  save: publicProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      const post = store.toggleSave(input.postId, uid);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  reply: publicProcedure
    .input(z.object({ postId: z.number(), body: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      const reply = store.addReply(input.postId, uid, input.body);
      if (!reply) throw new TRPCError({ code: "NOT_FOUND" });
      return reply;
    }),

  profiles: publicProcedure.query(() => store.listProfiles()),

  profile: publicProcedure
    .input(z.object({ idOrHandle: z.union([z.string(), z.number()]) }))
    .query(({ ctx, input }) => {
      const profile = store.getProfile(input.idOrHandle);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      const viewer = viewerId(ctx.user);
      const posts = store
        .getFeed({ mode: "latest", limit: 50, viewerId: viewer })
        .filter((p) => p.authorId === profile.id);
      return {
        profile: {
          ...profile,
          followerCount: profile.followers.length,
          followingCount: profile.following.length,
          isFollowing: viewer ? profile.followers.includes(viewer) : false,
        },
        posts,
      };
    }),

  follow: publicProcedure
    .input(z.object({ targetId: z.number() }))
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      const result = store.toggleFollow(uid, input.targetId);
      if (!result) throw new TRPCError({ code: "BAD_REQUEST" });
      return result;
    }),

  circles: publicProcedure.query(() => store.listCircles()),

  circle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      const circle = store.getCircle(input.slug);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });
      return circle;
    }),

  joinCircle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      const circle = store.joinCircle(input.slug, uid);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });
      return circle;
    }),

  collections: publicProcedure.query(() => store.listCollections()),

  collection: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const collection = store.getCollection(input.id);
      if (!collection) throw new TRPCError({ code: "NOT_FOUND" });
      return collection;
    }),

  algorithm: publicProcedure.query(({ ctx }) => ({
    weights: store.getAlgorithm(viewerId(ctx.user)),
    intent: store.getIntent(viewerId(ctx.user)),
  })),

  setAlgorithm: publicProcedure
    .input(
      z.object({
        recency: z.number().min(0).max(100),
        relevance: z.number().min(0).max(100),
        diversity: z.number().min(0).max(100),
        quiet: z.number().min(0).max(100),
        social: z.number().min(0).max(100),
      })
    )
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      return store.setAlgorithm(uid, input);
    }),

  setIntent: publicProcedure
    .input(z.object({ intent: intentSchema }))
    .mutation(({ ctx, input }) => {
      const uid = viewerId(ctx.user);
      if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });
      return store.setIntent(uid, input.intent);
    }),

  notifications: publicProcedure.query(({ ctx }) =>
    store.getNotifications(viewerId(ctx.user))
  ),

  trending: publicProcedure.query(() => store.getTrendingTags()),

  motionFeed: publicProcedure.query(({ ctx }) =>
    store.getFeed({
      lens: "motion",
      mode: "for-you",
      viewerId: viewerId(ctx.user),
      limit: 20,
    })
  ),
});
