import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as store from "./store";

export const socialRouter = router({
  lenses: publicProcedure.query(() => store.LENSES),

  feed: publicProcedure
    .input(
      z.object({
        lens: z.enum(["chrono", "signal", "discover", "focus"]).default("signal"),
      })
    )
    .query(({ input }) => {
      const feed = store.getFeed(input.lens).map(store.hydrateAuthor);
      return {
        lens: input.lens,
        items: feed,
        meta: store.LENSES.find((l) => l.id === input.lens),
      };
    }),

  moments: publicProcedure.query(() => store.getMoments()),

  markMomentViewed: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => store.markMomentViewed(input.id)),

  sparks: publicProcedure.query(() => store.getSparks()),

  post: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const post = store.getPost(input.id);
      if (!post) return null;
      return {
        post: store.hydrateAuthor(post),
        replies: store.getReplies(input.id).map(store.hydrateAuthor),
        saved: store.isSaved(input.id),
        echoed: store.isEchoed(input.id),
      };
    }),

  createPost: publicProcedure
    .input(
      z.object({
        body: z.string().min(1).max(5000),
        kind: z.enum(["thought", "depth", "spark", "media"]).default("thought"),
        title: z.string().max(200).optional(),
        topics: z.array(z.string()).max(8).optional(),
        circleId: z.string().optional(),
        collectiveId: z.string().optional(),
      })
    )
    .mutation(({ input }) => store.createPost(input)),

  reply: publicProcedure
    .input(z.object({ postId: z.string(), body: z.string().min(1).max(2000) }))
    .mutation(({ input }) => store.addReply(input.postId, input.body)),

  toggleSave: publicProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ input }) => store.toggleSave(input.postId)),

  toggleEcho: publicProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ input }) => store.toggleEcho(input.postId)),

  circles: publicProcedure.query(() => store.getCircles()),

  circle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      const circle = store.getCircle(input.slug);
      if (!circle) return null;
      return {
        circle,
        posts: store.getCirclePosts(circle.id),
      };
    }),

  joinCircle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => store.joinCircle(input.id)),

  collectives: publicProcedure.query(() => store.getCollectives()),

  collective: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      const collective = store.getCollective(input.slug);
      if (!collective) return null;
      return {
        collective,
        posts: store.getCollectivePosts(collective.id),
      };
    }),

  joinCollective: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => store.joinCollective(input.id)),

  conversations: publicProcedure.query(() => store.getConversations()),

  messages: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => store.getMessages(input.conversationId)),

  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        body: z.string().min(1).max(2000),
      })
    )
    .mutation(({ input }) => store.sendMessage(input.conversationId, input.body)),

  explore: publicProcedure.query(() => store.getExplore()),

  trending: publicProcedure.query(() => store.getTrendingTopics()),

  profile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const profile = store.getProfile(input.id);
      if (!profile) return null;
      return {
        profile,
        posts: store.getProfilePosts(input.id),
        following: store.isFollowing(input.id),
      };
    }),

  profileByHandle: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(({ input }) => {
      const profile = store.getProfileByHandle(input.handle);
      if (!profile) return null;
      return {
        profile,
        posts: store.getProfilePosts(profile.id),
        following: store.isFollowing(profile.id),
      };
    }),

  me: publicProcedure.query(() => ({
    profile: store.getMe(),
    followingCount: store.getMe().following,
  })),

  toggleFollow: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => store.toggleFollow(input.userId)),

  dna: publicProcedure.query(async () => {
    const { PLATFORM_DNA } = await import("@shared/site");
    return PLATFORM_DNA;
  }),
});
