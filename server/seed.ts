import { eq, sql } from "drizzle-orm";
import { forumCategories, forumThreads, users } from "../drizzle/schema";
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

import { ensureSocialDemoContent } from "./socialSeed";

export async function runAppSeeds(): Promise<void> {
  await ensureForumCategories();
  await ensureWelcomeThread();
  await ensureSocialDemoContent();
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
