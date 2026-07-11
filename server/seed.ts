import { sql } from "drizzle-orm";
import { forumCategories } from "../drizzle/schema";
import { getDb } from "./db";

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
