import { eq, sql } from "drizzle-orm";
import {
  communities,
  forumCategories,
  forumThreads,
  socialPosts,
  stories,
  users,
} from "../drizzle/schema";
import { getDb, getUserByOpenId } from "./db";

export const SYSTEM_USER_OPEN_ID = "nachtblau-crew-system";

export const DEFAULT_FORUM_CATEGORIES = [
  {
    name: "Allgemein",
    slug: "allgemein",
    description: "Allgemeine Diskussionen rund um Gaming",
    icon: "MessageSquare",
    sortOrder: 1,
  },
  {
    name: "PC Gaming",
    slug: "pc-gaming",
    description: "Alles über PC-Spiele, Hardware und Software",
    icon: "Monitor",
    sortOrder: 2,
  },
  {
    name: "Konsolen",
    slug: "konsolen",
    description: "PlayStation, Xbox, Nintendo und mehr",
    icon: "Gamepad2",
    sortOrder: 3,
  },
  {
    name: "Steam & Valve",
    slug: "steam-valve",
    description: "Steam Sales, Valve News und PC-Deals",
    icon: "Flame",
    sortOrder: 4,
  },
  {
    name: "Free Games & Deals",
    slug: "free-games",
    description: "Kostenlose Spiele, Giveaways und Angebote",
    icon: "Gift",
    sortOrder: 5,
  },
  {
    name: "Community",
    slug: "community",
    description: "Vorstellungen, Off-Topic und Events",
    icon: "Users",
    sortOrder: 6,
  },
] as const;

export const WELCOME_THREAD = {
  title: "Willkommen in der NachtBlau Crew! 🌙",
  content: `Herzlich willkommen in der NachtBlau Crew – deiner Gaming Community!

Hier findest du:
• Kostenlose Spiele und Giveaways unter Free Games
• Aktuelle Gaming-News für PC, Konsolen und Steam
• Ein aktives Forum zum Austausch mit der Community

Melde dich an, um Threads zu erstellen und mitzudiskutieren. Viel Spaß!

Mehr Infos: https://nacht-blau.de
Quellcode: https://github.com/Wuza0295/nachtblau-crew`,
} as const;

export async function ensureForumCategories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumCategories);

    if ((existing[0]?.count ?? 0) > 0) return;

    await db.insert(forumCategories).values([...DEFAULT_FORUM_CATEGORIES]);
    console.log(`[Seed] ${DEFAULT_FORUM_CATEGORIES.length} Forum-Kategorien angelegt`);
  } catch (error) {
    console.warn("[Seed] Forum-Kategorien konnten nicht angelegt werden:", error);
  }
}

export async function ensureWelcomeThread(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumThreads);

    if ((existing[0]?.count ?? 0) > 0) return;

    await ensureForumCategories();

    const [category] = await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.slug, "allgemein"))
      .limit(1);

    if (!category) return;

    let systemUser = await getUserByOpenId(SYSTEM_USER_OPEN_ID);
    if (!systemUser) {
      await db.insert(users).values({
        openId: SYSTEM_USER_OPEN_ID,
        name: "NachtBlau Crew",
        role: "admin",
      });
      systemUser = await getUserByOpenId(SYSTEM_USER_OPEN_ID);
    }

    if (!systemUser) return;

    await db.insert(forumThreads).values({
      categoryId: category.id,
      authorId: systemUser.id,
      title: WELCOME_THREAD.title,
      content: WELCOME_THREAD.content,
      isPinned: true,
      lastReplyAt: new Date(),
    });

    console.log("[Seed] Willkommens-Thread angelegt");
  } catch (error) {
    console.warn("[Seed] Willkommens-Thread konnte nicht angelegt werden:", error);
  }
}

const DEMO_COMMUNITIES = [
  {
    name: "Zukunft & Tech",
    slug: "zukunft-tech",
    description: "KI, Open Source, Fediverse – wie das Web morgen aussieht.",
    iconEmoji: "🚀",
    coverGradient: "from-indigo-600 to-purple-500",
  },
  {
    name: "Kreativ Studio",
    slug: "kreativ-studio",
    description: "Design, Musik, Video – Feedback ohne Algorithmus-Drama.",
    iconEmoji: "🎨",
    coverGradient: "from-pink-500 to-orange-400",
  },
  {
    name: "Echte Momente",
    slug: "echte-momente",
    description: "Ungefiltert, ehrlich, ohne Performance-Druck.",
    iconEmoji: "📸",
    coverGradient: "from-emerald-500 to-teal-400",
  },
  {
    name: "Deep Talk",
    slug: "deep-talk",
    description: "Lange Threads, kluge Fragen, Reddit-Niveau ohne Toxicity-Bingo.",
    iconEmoji: "💬",
    coverGradient: "from-slate-600 to-blue-500",
  },
] as const;

const DEMO_POSTS = [
  {
    content:
      "Willkommen im Social-Universum: Feed mit wählbarem Algorithmus, Kreise wie Reddit, Pulse wie TikTok, Stories & echter Tages-Moment. Name folgt – Features schon da. #Neu #Social #OpenWeb",
    postKind: "feed" as const,
    upvoteCount: 42,
    reactionCount: 18,
    communitySlug: "zukunft-tech",
  },
  {
    content:
      "Pro-Tipp: Wechsel zwischen „Für dich“, „Following“ und „Chronologisch“ – so wie Bluesky Custom Feeds, nur in einer App. #Algorithmus #Transparenz",
    postKind: "feed" as const,
    upvoteCount: 28,
    reactionCount: 9,
    communitySlug: "deep-talk",
  },
  {
    content: "Kurzes Pulse-Update: 15 Sekunden reichen. Kein endloses Scroll-Gefängnis. 🔥",
    postKind: "pulse" as const,
    mediaType: "video" as const,
    upvoteCount: 120,
    reactionCount: 55,
    communitySlug: "kreativ-studio",
  },
  {
    content: "Heute: Kaffee, Code, Sonne. Ungefilterter Moment – zwei Minuten, eine Wahrheit.",
    postKind: "moment" as const,
    upvoteCount: 15,
    reactionCount: 7,
    communitySlug: "echte-momente",
  },
];

export async function ensureSocialSeed(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(communities);
    if ((existing[0]?.count ?? 0) > 0) return;

    let systemUser = await getUserByOpenId(SYSTEM_USER_OPEN_ID);
    if (!systemUser) {
      await db.insert(users).values({
        openId: SYSTEM_USER_OPEN_ID,
        name: "Plattform",
        bio: "Offizieller Account – Demo-Inhalte für das Social-Universum.",
        role: "admin",
      });
      systemUser = await getUserByOpenId(SYSTEM_USER_OPEN_ID);
    }
    if (!systemUser) return;

    for (const c of DEMO_COMMUNITIES) {
      await db.insert(communities).values({
        name: c.name,
        slug: c.slug,
        description: c.description,
        iconEmoji: c.iconEmoji,
        coverGradient: c.coverGradient,
        memberCount: Math.floor(Math.random() * 200) + 50,
        creatorId: systemUser.id,
      });
    }

    const allCommunities = await db.select().from(communities);
    const bySlug = new Map(allCommunities.map((c) => [c.slug, c.id]));

    for (const p of DEMO_POSTS) {
      await db.insert(socialPosts).values({
        authorId: systemUser.id,
        communityId: bySlug.get(p.communitySlug) ?? null,
        content: p.content,
        mediaType: p.mediaType ?? "none",
        postKind: p.postKind,
        upvoteCount: p.upvoteCount,
        reactionCount: p.reactionCount,
        commentCount: Math.floor(Math.random() * 12),
        saveCount: Math.floor(Math.random() * 20),
      });
    }

    const expiresAt = new Date(Date.now() + 20 * 60 * 60 * 1000);
    await db.insert(stories).values([
      {
        authorId: systemUser.id,
        caption: "So sieht das neue Portal aus ✨",
        backgroundStyle: "aurora",
        expiresAt,
      },
      {
        authorId: systemUser.id,
        caption: "Stories – 24h, dann weg",
        backgroundStyle: "sunset",
        expiresAt,
      },
    ]);

    console.log("[Seed] Social-Demo (Kreise, Posts, Stories) angelegt");
  } catch (error) {
    console.warn("[Seed] Social-Demo konnte nicht angelegt werden:", error);
  }
}

export async function runAppSeeds(): Promise<void> {
  await ensureForumCategories();
  await ensureWelcomeThread();
  await ensureSocialSeed();
}

const isDirectRun = process.argv[1]?.includes("seed.ts");
if (isDirectRun) {
  runAppSeeds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
