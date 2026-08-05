import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { MOODS } from "@shared/site";
import {
  circles,
  collections,
  conversations,
  createPost,
  enrichPost,
  feedForMood,
  getCircleBySlug,
  getUser,
  messages,
  moments,
  posts,
  reactToPost,
  sendMessage,
  socialUsers,
} from "./socialStore";

const moodSchema = z.enum(["nah", "gespraech", "entdecken", "kreise", "fokus"]);

export const socialRouter = router({
  moods: publicProcedure.query(() => MOODS),

  feed: publicProcedure
    .input(
      z.object({
        mood: moodSchema.default("nah"),
        limit: z.number().min(1).max(50).optional(),
      })
    )
    .query(({ input }) => feedForMood(input.mood, input.limit ?? 30)),

  moments: publicProcedure.query(() =>
    moments.map((m) => ({
      ...m,
      author: getUser(m.authorId)!,
    }))
  ),

  circles: publicProcedure.query(() => circles),

  circleBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      const circle = getCircleBySlug(input.slug);
      if (!circle) return null;
      const circlePosts = posts
        .filter((p) => p.circleId === circle.id)
        .map(enrichPost);
      return { ...circle, posts: circlePosts };
    }),

  postById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const post = posts.find((p) => p.id === input.id);
      if (!post) return null;
      const replies = posts
        .filter((p) => p.replyToId === post.id)
        .map(enrichPost);
      return { ...enrichPost(post), replies };
    }),

  profile: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(({ input }) => {
      const user = socialUsers.find(
        (u) => u.handle.toLowerCase() === input.handle.toLowerCase()
      );
      if (!user) return null;
      const userPosts = posts
        .filter((p) => p.authorId === user.id)
        .map(enrichPost);
      const userCollections = collections.filter((c) => c.ownerId === user.id);
      return { user, posts: userPosts, collections: userCollections };
    }),

  people: publicProcedure.query(() => socialUsers),

  conversations: publicProcedure.query(() =>
    conversations.map((c) => ({
      ...c,
      participants: c.participantIds.map((id) => getUser(id)!),
    }))
  ),

  messages: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(({ input }) =>
      messages
        .filter((m) => m.conversationId === input.conversationId)
        .map((m) => ({ ...m, sender: getUser(m.senderId)! }))
    ),

  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.number(),
        body: z.string().min(1).max(2000),
      })
    )
    .mutation(({ input }) => {
      // Demo: send as Mira (user 1)
      const msg = sendMessage(input.conversationId, 1, input.body);
      return { ...msg, sender: getUser(1)! };
    }),

  createPost: publicProcedure
    .input(
      z.object({
        kind: z.enum(["text", "image", "pulse", "longform", "moment"]),
        mood: moodSchema,
        body: z.string().min(1).max(8000),
        title: z.string().max(200).optional(),
        circleId: z.number().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) =>
      createPost({
        authorId: 1,
        kind: input.kind,
        mood: input.mood,
        body: input.body,
        title: input.title,
        circleId: input.circleId,
        tags: input.tags,
        mediaGradient:
          input.kind === "image" || input.kind === "pulse" || input.kind === "moment"
            ? "linear-gradient(135deg,#ccfbf1,#0f766e 50%,#134e4a)"
            : undefined,
      })
    ),

  resonate: publicProcedure
    .input(
      z.object({
        postId: z.number(),
        type: z.enum(["reacts", "replies", "saves", "shares"]),
      })
    )
    .mutation(({ input }) => {
      const updated = reactToPost(input.postId, input.type);
      if (!updated) throw new Error("Post not found");
      return updated;
    }),

  dailyPrompt: publicProcedure.query(() => ({
    prompt: "Zeig einen echten Moment — ohne Inszenierung.",
    windowClosesAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
    posted: false,
  })),

  features: publicProcedure.query(() => [
    {
      from: "Bluesky",
      take: "Wählbare Feeds statt einer Black-Box",
      inCadence: "Fünf Frequenzen, die du jederzeit wechselst",
    },
    {
      from: "BeReal",
      take: "Authentizität braucht ein Zeitfenster",
      inCadence: "Täglicher Echtzeit-Moment",
    },
    {
      from: "X / Threads",
      take: "Antworten wiegen schwerer als Likes",
      inCadence: "Resonanz-Score (Antwort×3, Share×4)",
    },
    {
      from: "Instagram",
      take: "Stories & visuelle Nähe",
      inCadence: "Nah-Frequenz mit Moment-Rail",
    },
    {
      from: "TikTok",
      take: "Entdeckung durch kurze Impulse",
      inCadence: "Pulse in Entdecken",
    },
    {
      from: "Reddit + Discord",
      take: "Themenräume statt nur Broadcast",
      inCadence: "Kreise mit Chat, Board & Voice",
    },
    {
      from: "LinkedIn / Substack",
      take: "Intentionalität und Tiefe",
      inCadence: "Fokus-Frequenz für Longform",
    },
    {
      from: "Pinterest",
      take: "Sammeln statt nur liken",
      inCadence: "Sammlungen aus gespeicherten Posts",
    },
  ]),
});
