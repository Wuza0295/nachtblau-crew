import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import {
  confirmEmailSchema,
  loginSchema,
  registerSchema,
  resendConfirmationSchema,
} from "@shared/emailAuth";
import type { User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  confirmEmailAddress,
  loginWithPassword,
  registerWithPassword,
  resendConfirmationEmail,
} from "./emailAuth";
import {
  createPost,
  createThread,
  getForumCategories,
  getForumCategoryBySlug,
  getPostsByThread,
  getThreadById,
  getThreadsByCategory,
  getUserById,
  getUserPostCount,
  getUserRecentThreads,
  getUserThreadCount,
  incrementThreadView,
  updateUserProfile,
} from "./db";
import { socialRouter } from "./routers/social";
import { FEED_USER_AGENT, NEWS_FEEDS, mergeArticles, parseRssItems } from "@shared/publicFeeds";

// ─── Free Games via GamerPower API ───────────────────────────────────────────
const gamesRouter = router({
  getFreeGames: publicProcedure
    .input(
      z.object({
        platform: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const maxRetries = 2;
      let lastError: unknown;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          let url = "https://www.gamerpower.com/api/giveaways?sort-by=date";
          if (input.platform) url += `&platform=${input.platform}`;
          if (input.type) url += `&type=${input.type}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(url, {
            headers: { "User-Agent": "NachtBlauCrew/1.0" },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            if (attempt < maxRetries) continue;
            return { games: [], error: `API-Fehler: ${res.status}` };
          }

          const data = await res.json();
          if (!Array.isArray(data)) {
            if (attempt < maxRetries) continue;
            return { games: [], error: "Keine Daten" };
          }

          return {
            games: data.slice(0, 20).map((g: Record<string, unknown>) => ({
              id: g.id as number,
              title: g.title as string,
              worth: g.worth as string,
              thumbnail: g.thumbnail as string,
              image: g.image as string,
              description: g.description as string,
              platforms: g.platforms as string,
              type: g.type as string,
              endDate: g.end_date as string,
              publishedDate: g.published_date as string,
              openGiveawayUrl: g.open_giveaway_url as string,
              gamerPowerUrl: g.gamerpower_url as string,
              status: g.status as string,
              users: g.users as number,
            })),
            error: null,
          };
        } catch (err) {
          lastError = err;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
            continue;
          }
        }
      }

      console.error("[GamerPower API] All retries failed:", lastError);
      return { games: [], error: "Verbindung fehlgeschlagen - bitte später erneut versuchen" };
    })
});

// ─── Gaming News via RSS Feeds ───────────────────────────────────────────────
const newsRouter = router({
  getNews: publicProcedure
    .input(
      z.object({
        category: z
          .enum(["all", "pc", "konsolen", "gaming", "steam"])
          .default("all"),
        limit: z.number().min(1).max(30).default(12),
      })
    )
    .query(async ({ input }) => {
      const selectedFeeds = NEWS_FEEDS[input.category] ?? NEWS_FEEDS.all;

      const parseRSSFeed = async (url: string) => {
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": FEED_USER_AGENT },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) return [];
          return parseRssItems(await res.text(), url);
        } catch {
          return [];
        }
      };

      const results = await Promise.all(selectedFeeds.map(parseRSSFeed));

      return {
        articles: mergeArticles(results, input.limit),
        error: null,
      };
    }),
});

// ─── Forum ────────────────────────────────────────────────────────────────────
const forumRouter = router({
  getCategories: publicProcedure.query(async () => {
    return getForumCategories();
  }),

  getCategoryBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const cat = await getForumCategoryBySlug(input.slug);
      if (!cat) throw new TRPCError({ code: "NOT_FOUND" });
      return cat;
    }),

  getThreadsByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return getThreadsByCategory(input.categoryId, input.limit, input.offset);
    }),

  getThread: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const thread = await getThreadById(input.id);
      if (!thread) throw new TRPCError({ code: "NOT_FOUND" });
      await incrementThreadView(input.id);
      return thread;
    }),

  getPosts: publicProcedure
    .input(z.object({ threadId: z.number() }))
    .query(async ({ input }) => {
      return getPostsByThread(input.threadId);
    }),

  createThread: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        title: z.string().min(3).max(256),
        content: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createThread({
        categoryId: input.categoryId,
        authorId: ctx.user.id,
        title: input.title,
        content: input.content,
      });
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        threadId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check thread exists and is not locked
      const thread = await getThreadById(input.threadId);
      if (!thread) throw new TRPCError({ code: "NOT_FOUND" });
      if (thread.thread.isLocked)
        throw new TRPCError({ code: "FORBIDDEN", message: "Thread ist gesperrt" });

      return createPost({
        threadId: input.threadId,
        authorId: ctx.user.id,
        content: input.content,
      });
    }),
});

// ─── User Profile ─────────────────────────────────────────────────────────────
const profileRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const [threadCount, postCount, recentThreads] = await Promise.all([
        getUserThreadCount(input.userId),
        getUserPostCount(input.userId),
        getUserRecentThreads(input.userId),
      ]);
      return {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        stats: { threadCount, postCount },
        recentThreads,
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

// ─── App Router ───────────────────────────────────────────────────────────────
function toPublicUser(user: User | null) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => toPublicUser(opts.ctx.user)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure.input(registerSchema).mutation(({ ctx, input }) => {
      return registerWithPassword(input, ctx.req);
    }),
    login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
      const user = await loginWithPassword(input);
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { success: true as const };
    }),
    confirmEmail: publicProcedure.input(confirmEmailSchema).mutation(({ input }) => {
      return confirmEmailAddress(input.token);
    }),
    resendConfirmation: publicProcedure
      .input(resendConfirmationSchema)
      .mutation(({ ctx, input }) => {
        return resendConfirmationEmail(input.email, ctx.req);
      }),
  }),
  games: gamesRouter,
  news: newsRouter,
  forum: forumRouter,
  profile: profileRouter,
  social: socialRouter,
});

export type AppRouter = typeof appRouter;
