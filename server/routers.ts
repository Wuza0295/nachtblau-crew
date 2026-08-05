import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { socialStore } from "./socialStore";

function actorFromCtx(user?: { openId: string; name?: string | null } | null) {
  const profile = socialStore.resolveActor(user?.openId);
  if (user?.name && profile.name === "Neues Mitglied") {
    socialStore.updateProfile(profile.id, { name: user.name });
  }
  return socialStore.resolveActor(user?.openId);
}

const socialRouter = router({
  stats: publicProcedure.query(() => socialStore.getStats()),

  me: publicProcedure.query(({ ctx }) => {
    return actorFromCtx(ctx.user);
  }),

  feed: publicProcedure
    .input(
      z.object({
        lens: z.enum(["pulse", "orbit", "circles", "depth"]).default("pulse"),
        circleSlug: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.getFeed(input.lens, me.id, input.circleSlug);
    }),

  moments: publicProcedure.query(({ ctx }) => {
    const me = actorFromCtx(ctx.user);
    return socialStore.getMoments(me.id);
  }),

  gatherings: publicProcedure.query(() => socialStore.listGatherings()),

  circles: publicProcedure.query(({ ctx }) => {
    const me = actorFromCtx(ctx.user);
    return socialStore.listCircles().map((c) => ({
      ...c,
      isMember: socialStore.isMember(me.id, c.id),
    }));
  }),

  circle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      const circle = socialStore.getCircle(input.slug);
      if (!circle) return null;
      return {
        ...circle,
        isMember: socialStore.isMember(me.id, circle.id),
        posts: socialStore.getFeed("circles", me.id, circle.slug),
      };
    }),

  joinCircle: publicProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.joinCircle(me.id, input.circleId);
    }),

  leaveCircle: publicProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.leaveCircle(me.id, input.circleId);
    }),

  post: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      const post = socialStore.getPost(input.id, me.id);
      if (!post) return null;
      return {
        post,
        replies: socialStore.getReplies(input.id, me.id),
      };
    }),

  createPost: publicProcedure
    .input(
      z.object({
        type: z.enum(["pulse", "frame", "signal", "moment"]),
        content: z.string().min(1).max(8000),
        title: z.string().max(256).optional(),
        circleId: z.number().optional().nullable(),
        parentId: z.number().optional().nullable(),
        mediaLabel: z.string().max(128).optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.createPost({
        authorId: me.id,
        type: input.type,
        content: input.content,
        title: input.title,
        circleId: input.circleId,
        parentId: input.parentId,
        mediaLabel: input.mediaLabel,
      });
    }),

  resonate: publicProcedure
    .input(
      z.object({
        postId: z.number(),
        type: z.enum(["spark", "depth", "echo"]).nullable(),
      })
    )
    .mutation(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.setResonance(me.id, input.postId, input.type);
    }),

  toggleFollow: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.toggleFollow(me.id, input.userId);
    }),

  profile: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      const profile = socialStore.getProfileByHandle(input.handle);
      if (!profile) return null;
      return {
        profile,
        posts: socialStore.getPostsByAuthor(profile.id, me.id),
        isFollowing: socialStore.isFollowingUser(me.id, profile.id),
        isSelf: me.id === profile.id,
      };
    }),

  profileById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      const profile = socialStore.getProfile(input.id);
      if (!profile) return null;
      return {
        profile,
        posts: socialStore.getPostsByAuthor(profile.id, me.id),
        isFollowing: socialStore.isFollowingUser(me.id, profile.id),
        isSelf: me.id === profile.id,
      };
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80).optional(),
        bio: z.string().max(280).optional(),
        handle: z.string().min(2).max(32).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const me = actorFromCtx(ctx.user);
      return socialStore.updateProfile(me.id, input);
    }),

  suggested: publicProcedure.query(({ ctx }) => {
    const me = actorFromCtx(ctx.user);
    return socialStore
      .listProfiles()
      .filter((p) => p.id !== me.id)
      .slice(0, 5);
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
  // Keep protectedProcedure imported for template compat
  _health: protectedProcedure.query(() => ({ ok: true })),
});

export type AppRouter = typeof appRouter;
