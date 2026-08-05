import { eq, sql } from "drizzle-orm";
import { circles, socialPosts, users } from "../drizzle/schema";
import { getDb, getUserByOpenId } from "./db";
import { getDailyMomentPrompt } from "./socialDb";

export const PORTAL_SYSTEM_OPEN_ID = "portal-demo-system";

export const DEFAULT_CIRCLES = [
  {
    name: "Kreativität",
    slug: "kreativitaet",
    description: "Design, Kunst, Musik — alles, was du erschaffst.",
    icon: "Palette",
    accentColor: "oklch(0.72 0.18 330)",
    memberCount: 1284,
    isOfficial: true,
  },
  {
    name: "Tech & Zukunft",
    slug: "tech",
    description: "KI, Open Source, Gadgets — ohne Hype-Filter.",
    icon: "Cpu",
    accentColor: "oklch(0.65 0.2 245)",
    memberCount: 2103,
    isOfficial: true,
  },
  {
    name: "Wellness",
    slug: "wellness",
    description: "Mental Health, Bewegung, ehrliche Momente.",
    icon: "Heart",
    accentColor: "oklch(0.7 0.16 160)",
    memberCount: 892,
    isOfficial: true,
  },
  {
    name: "Local",
    slug: "local",
    description: "Deine Stadt, deine Leute — hyperlokal.",
    icon: "MapPin",
    accentColor: "oklch(0.75 0.15 55)",
    memberCount: 456,
    isOfficial: true,
  },
] as const;

export async function ensurePortalSystemUser() {
  const db = await getDb();
  if (!db) return undefined;
  let user = await getUserByOpenId(PORTAL_SYSTEM_OPEN_ID);
  if (!user) {
    await db.insert(users).values({
      openId: PORTAL_SYSTEM_OPEN_ID,
      name: "Portal Guide",
      handle: "portal_guide",
      bio: "Willkommen im Social-Universum — Name folgt, Features bleiben.",
      role: "admin",
    });
    user = await getUserByOpenId(PORTAL_SYSTEM_OPEN_ID);
  }
  return user;
}

export async function ensureSocialCircles(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(circles);
    if ((existing[0]?.count ?? 0) > 0) return;
    await db.insert(circles).values([...DEFAULT_CIRCLES]);
    console.log(`[Seed] ${DEFAULT_CIRCLES.length} Kreise angelegt`);
  } catch (error) {
    console.warn("[Seed] Kreise konnten nicht angelegt werden:", error);
  }
}

export async function ensureDemoSocialPosts(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(socialPosts);
    if ((existing[0]?.count ?? 0) > 0) return;

    await ensureSocialCircles();
    const systemUser = await ensurePortalSystemUser();
    if (!systemUser) return;

    const [creativeCircle] = await db
      .select()
      .from(circles)
      .where(eq(circles.slug, "kreativitaet"))
      .limit(1);

    const momentPrompt = getDailyMomentPrompt();

    const demoPosts = [
      {
        authorId: systemUser.id,
        type: "wave" as const,
        content:
          "Willkommen im ersten Social-Portal, das alles vereint: Waves wie X, Flashes wie TikTok, Kreise wie Reddit, Moments wie BeReal — und du wählst den Feed-Modus wie bei Bluesky. #NeuDenken #Community",
        visibility: "public" as const,
      },
      {
        authorId: systemUser.id,
        type: "wave" as const,
        content:
          "Chronologisch, Entdecken oder nur Following — drei Feed-Modi in einer App. Kein Algorithmus-Zwang. #Transparenz",
        circleId: creativeCircle?.id,
        visibility: "public" as const,
      },
      {
        authorId: systemUser.id,
        type: "flash" as const,
        content: "30 Sekunden ehrlich — mehr braucht es nicht.",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        mediaAspect: "portrait" as const,
        visibility: "public" as const,
      },
      {
        authorId: systemUser.id,
        type: "flash" as const,
        content: "Edutainment trifft Scroll: Lernen ohne Langeweile.",
        mediaUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        mediaAspect: "landscape" as const,
        visibility: "public" as const,
      },
      {
        authorId: systemUser.id,
        type: "moment" as const,
        content: "Ungefilterter Moment — genau so soll es sein.",
        momentPrompt,
        mediaUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
        visibility: "public" as const,
      },
      {
        authorId: systemUser.id,
        type: "story" as const,
        content: "24h Story — morgen ist sie weg.",
        mediaUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        visibility: "public" as const,
      },
    ];

    await db.insert(socialPosts).values(demoPosts);
    console.log("[Seed] Demo Social-Posts angelegt");
  } catch (error) {
    console.warn("[Seed] Demo-Posts konnten nicht angelegt werden:", error);
  }
}

export async function runSocialSeeds(): Promise<void> {
  await ensureSocialCircles();
  await ensureDemoSocialPosts();
}
