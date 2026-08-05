import { eq, sql } from "drizzle-orm";
import { circles, posts, users } from "../drizzle/schema";
import { getDb, getUserByOpenId } from "./db";

export const SYSTEM_USER_OPEN_ID = "aether-system";

export const DEFAULT_CIRCLES = [
  {
    name: "Design Lab",
    slug: "design-lab",
    description:
      "Typografie, Interfaces und visuelle Systeme — Inspiration statt Moodboards-Spam.",
    topic: "design",
    icon: "Palette",
    coverGradient: "linear-gradient(135deg, #0d7377 0%, #14919b 50%, #f4a261 100%)",
    isFeatured: true,
    memberCount: 128,
    postCount: 0,
  },
  {
    name: "Tech Pulse",
    slug: "tech-pulse",
    description:
      "Werkzeuge, Open Source und die Zukunft des Netzes — ohne Hype-Zyklus.",
    topic: "technologie",
    icon: "Cpu",
    coverGradient: "linear-gradient(135deg, #023e8a 0%, #0077b6 50%, #00b4d8 100%)",
    isFeatured: true,
    memberCount: 214,
    postCount: 0,
  },
  {
    name: "Kulturcafé",
    slug: "kulturcafe",
    description: "Bücher, Film, Serie und die kleinen Beobachtungen dazwischen.",
    topic: "kultur",
    icon: "BookOpen",
    coverGradient: "linear-gradient(135deg, #3d1c5c 0%, #7b2cbf 50%, #e0aaff 100%)",
    isFeatured: true,
    memberCount: 96,
    postCount: 0,
  },
  {
    name: "Outdoor & Nature",
    slug: "outdoor-nature",
    description: "Wege, Wetter und Orte, die man mitnehmen will.",
    topic: "nature",
    icon: "Trees",
    coverGradient: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #95d5b2 100%)",
    isFeatured: false,
    memberCount: 73,
    postCount: 0,
  },
  {
    name: "Musikzimmer",
    slug: "musikzimmer",
    description: "Playlists, Sessions und das Lied, das den Tag hält.",
    topic: "musik",
    icon: "Music",
    coverGradient: "linear-gradient(135deg, #240046 0%, #5a189a 50%, #ff6d00 100%)",
    isFeatured: false,
    memberCount: 151,
    postCount: 0,
  },
  {
    name: "Startup Kitchen",
    slug: "startup-kitchen",
    description: "Produkte bauen, lernen, scheitern — und ehrlich darüber sprechen.",
    topic: "business",
    icon: "Rocket",
    coverGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #e94560 100%)",
    isFeatured: true,
    memberCount: 88,
    postCount: 0,
  },
  {
    name: "Wissenschaftsbar",
    slug: "wissenschaftsbar",
    description: "Kurze Erklärungen, große Fragen — ohne Gatekeeping.",
    topic: "wissenschaft",
    icon: "FlaskConical",
    coverGradient: "linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #5bc0be 100%)",
    isFeatured: false,
    memberCount: 64,
    postCount: 0,
  },
  {
    name: "Game Night",
    slug: "game-night",
    description: "Indie-Funde, Co-op-Abende und Mechaniken, die hängen bleiben.",
    topic: "gaming",
    icon: "Gamepad2",
    coverGradient: "linear-gradient(135deg, #10002b 0%, #3c096c 50%, #ff9e00 100%)",
    isFeatured: false,
    memberCount: 177,
    postCount: 0,
  },
] as const;

const DEMO_POSTS: {
  type: "text" | "image" | "essay" | "signal";
  title?: string;
  content: string;
  topic: string;
  circleSlug?: string;
  mediaUrl?: string;
  resonanceScore: number;
  hoursAgo: number;
}[] = [
  {
    type: "essay",
    title: "Warum dein Feed dich nicht kennen sollte",
    content:
      "Die meisten Plattformen entscheiden im Dunkeln, was du siehst. AETHER dreht das um: Du stellst die Dials — Technologie, Kultur, Design — und der Feed folgt. Resonanz trainiert nur dein Modell, nicht das eines Werbenetzwerks.\n\nKontrolle ist keine Einstellung in den Privacy-Optionen. Sie ist die Oberfläche.",
    topic: "technologie",
    circleSlug: "tech-pulse",
    resonanceScore: 42,
    hoursAgo: 2,
  },
  {
    type: "image",
    title: "Morgenlicht im Studio",
    content: "Kein Filter. Nur ein Fenster nach Osten und eine Stunde vor dem ersten Call.",
    topic: "design",
    circleSlug: "design-lab",
    mediaUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    resonanceScore: 28,
    hoursAgo: 5,
  },
  {
    type: "text",
    content:
      "Kurze Beobachtung: Die besten Community-Räume fühlen sich an wie ein Café, nicht wie ein Dashboard. Weniger Widgets. Mehr Gespräch.",
    topic: "kultur",
    circleSlug: "kulturcafe",
    resonanceScore: 19,
    hoursAgo: 8,
  },
  {
    type: "text",
    content:
      "Heute drei Kilometer am Fluss, Kopf leer, Notizbuch voll. Nature-Dial auf 90 — der Rest kann warten.",
    topic: "nature",
    circleSlug: "outdoor-nature",
    resonanceScore: 15,
    hoursAgo: 12,
  },
  {
    type: "essay",
    title: "Signals sterben nach 24 Stunden. Absichtlich.",
    content:
      "Ephemere Momente aus Snap und Stories gehören hierher — aber ohne den Druck, alles zu archivieren. Ein Signal ist ein Atemzug: da, dann weg. Was bleibt, speicherst du bewusst auf einem Board.",
    topic: "kultur",
    resonanceScore: 33,
    hoursAgo: 18,
  },
  {
    type: "image",
    content: "Playlist für den Fokus-Nachmittag. Bass leise, Kick klar.",
    topic: "musik",
    circleSlug: "musikzimmer",
    mediaUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80",
    resonanceScore: 22,
    hoursAgo: 20,
  },
  {
    type: "text",
    content:
      "MVP-Regel diese Woche: Ein Feature, das Nutzer*innen den Algorithmus spüren lässt. Nicht erklären — drehen.",
    topic: "business",
    circleSlug: "startup-kitchen",
    resonanceScore: 31,
    hoursAgo: 26,
  },
  {
    type: "text",
    content:
      "Indie-Fund: Ein Puzzle-Spiel, das ohne Tutorial auskommt, weil die Mechanik selbst spricht. Mehr davon.",
    topic: "gaming",
    circleSlug: "game-night",
    resonanceScore: 17,
    hoursAgo: 30,
  },
  {
    type: "essay",
    title: "Circles ≠ Subreddits ≠ Discord-Server",
    content:
      "Ein Circle bei AETHER mischt Themenraum und Zugehörigkeit: Reddit-Tiefe für Diskussionen, Discord-Nähe für Identität — ohne den Lärm eines globalen Firehoses. Du joinest, was du pflegen willst.",
    topic: "technologie",
    circleSlug: "tech-pulse",
    resonanceScore: 38,
    hoursAgo: 36,
  },
  {
    type: "signal",
    content: "Gerade draußen: Gewitter über der Stadt. 20 Sekunden Staunen.",
    topic: "nature",
    mediaUrl:
      "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80",
    resonanceScore: 8,
    hoursAgo: 1,
  },
  {
    type: "signal",
    content: "Kaffee #3. Essay-Draft steht. Pulse-Dials neu justiert.",
    topic: "business",
    resonanceScore: 5,
    hoursAgo: 3,
  },
  {
    type: "text",
    content:
      "Wissenschaft, die man in einem Satz mitnehmen kann: Korallen bleichten nicht nur durch Hitze — auch durch Stresshormone im Wasser. Neugierig geworden?",
    topic: "wissenschaft",
    circleSlug: "wissenschaftsbar",
    resonanceScore: 24,
    hoursAgo: 40,
  },
];

export async function ensureCircles(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(circles);

    if ((existing[0]?.count ?? 0) > 0) return;

    await db.insert(circles).values([...DEFAULT_CIRCLES]);
    console.log(`[Seed] ${DEFAULT_CIRCLES.length} Circles angelegt`);
  } catch (error) {
    console.warn("[Seed] Circles:", error);
  }
}

async function ensureSystemUser(): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  let user = await getUserByOpenId(SYSTEM_USER_OPEN_ID);
  if (!user) {
    await db.insert(users).values({
      openId: SYSTEM_USER_OPEN_ID,
      name: "AETHER Guide",
      handle: "aether",
      bio: "Willkommen. Ich zeige, wie Pulse, Circles und Resonance zusammenspielen.",
      role: "admin",
      mood: "Kuratiert den ersten Feed",
    });
    user = await getUserByOpenId(SYSTEM_USER_OPEN_ID);
  }
  return user?.id ?? null;
}

export async function ensureDemoPosts(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);
    if ((existing[0]?.count ?? 0) > 0) return;

    const authorId = await ensureSystemUser();
    if (!authorId) return;

    const allCircles = await db.select().from(circles);
    const bySlug = Object.fromEntries(allCircles.map((c) => [c.slug, c.id]));

    for (const demo of DEMO_POSTS) {
      const createdAt = new Date(Date.now() - demo.hoursAgo * 60 * 60 * 1000);
      const expiresAt =
        demo.type === "signal"
          ? new Date(Date.now() + (24 - demo.hoursAgo) * 60 * 60 * 1000)
          : null;

      await db.insert(posts).values({
        authorId,
        type: demo.type,
        title: demo.title,
        content: demo.content,
        mediaUrl: demo.mediaUrl,
        topic: demo.topic,
        circleId: demo.circleSlug ? bySlug[demo.circleSlug] : null,
        resonanceScore: demo.resonanceScore,
        commentCount: 0,
        expiresAt: expiresAt ?? undefined,
        createdAt,
        updatedAt: createdAt,
      });

      if (demo.circleSlug && bySlug[demo.circleSlug]) {
        await db
          .update(circles)
          .set({ postCount: sql`${circles.postCount} + 1` })
          .where(eq(circles.id, bySlug[demo.circleSlug]));
      }
    }

    console.log(`[Seed] ${DEMO_POSTS.length} Demo-Posts angelegt`);
  } catch (error) {
    console.warn("[Seed] Posts:", error);
  }
}

export async function runSeed(): Promise<void> {
  await ensureCircles();
  await ensureDemoPosts();
}

/** Called on server boot */
export async function runAppSeeds(): Promise<void> {
  try {
    await runSeed();
  } catch (error) {
    console.warn("[Seed] Boot seed skipped:", error);
  }
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"));

if (isDirectRun) {
  runSeed()
    .then(() => {
      console.log("[Seed] Fertig");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
