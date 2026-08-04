import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
      // RSS feeds per category
      const feeds: Record<string, string[]> = {
        pc: [
          "https://www.pcgamer.com/rss/",
          "https://feeds.feedburner.com/RockPaperShotgun",
        ],
        konsolen: [
          "https://www.eurogamer.net/?format=rss",
          "https://www.ign.com/articles.rss",
        ],
        gaming: [
          "https://kotaku.com/rss",
          "https://www.gamespot.com/feeds/news/",
        ],
        steam: [
          "https://store.steampowered.com/feeds/news/",
          "https://www.pcgamesn.com/feed",
        ],
        all: [
          "https://www.pcgamer.com/rss/",
          "https://www.eurogamer.net/?format=rss",
          "https://kotaku.com/rss",
          "https://store.steampowered.com/feeds/news/",
        ],
      };

      const selectedFeeds = feeds[input.category] ?? feeds.all;

      const decodeXmlEntities = (value: string) =>
        value
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          )
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .trim();

      const parseRSSFeed = async (url: string) => {
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "NachtBlauCrew/1.0" },
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) return [];
          const text = await res.text();

          // Simple RSS parser using regex
          const items: {
            title: string;
            link: string;
            description: string;
            pubDate: string;
            image: string;
            source: string;
          }[] = [];

          const sourceName = new URL(url).hostname
            .replace("www.", "")
            .replace("feeds.feedburner.com/", "")
            .split(".")[0];

          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          while ((match = itemRegex.exec(text)) !== null) {
            const item = match[1];
            const title = decodeXmlEntities(
              (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(item) ||
                /<title>(.*?)<\/title>/.exec(item))?.[1] ?? ""
            );
            const link = decodeXmlEntities(
              (/<link><!\[CDATA\[(.*?)\]\]><\/link>/.exec(item) ||
                /<link>(.*?)<\/link>/.exec(item) ||
                /<guid[^>]*><!\[CDATA\[(.*?)\]\]><\/guid>/.exec(item) ||
                /<guid[^>]*>(.*?)<\/guid>/.exec(item))?.[1] ?? ""
            );
            const descRaw =
              (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(item) ||
                /<description>([\s\S]*?)<\/description>/.exec(item))?.[1]?.trim() ?? "";
            const desc = decodeXmlEntities(descRaw);
            const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(item))?.[1]?.trim() ?? "";

            // Extract image from enclosure or media:content or description
            let image = "";
            const enclosure = /<enclosure[^>]+url="([^"]+)"/.exec(item);
            const media = /<media:content[^>]+url="([^"]+)"/.exec(item);
            const imgInDesc =
              /<img[^>]+src="([^"]+)"/i.exec(desc) ||
              /<img[^>]+src='([^']+)'/i.exec(desc);
            if (enclosure) image = enclosure[1];
            else if (media) image = media[1];
            else if (imgInDesc) image = imgInDesc[1];

            if (title && link && /^https?:\/\//i.test(link)) {
              items.push({
                title,
                link,
                description: desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200),
                pubDate,
                image,
                source: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
              });
            }
          }
          return items;
        } catch {
          return [];
        }
      };

      const results = await Promise.all(selectedFeeds.map(parseRSSFeed));
      const allItems = results.flat();

      // Sort by date
      allItems.sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return db - da;
      });

      return {
        articles: allItems.slice(0, input.limit).map((item, idx) => ({
          id: `${idx}-${Date.now()}`,
          ...item,
        })),
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
  games: gamesRouter,
  news: newsRouter,
  forum: forumRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
