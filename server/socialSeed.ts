import { eq, sql } from "drizzle-orm";
import {
  socialCommunities,
  socialPosts,
  socialStories,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { SYSTEM_USER_OPEN_ID } from "./seed";

export const DEMO_COMMUNITIES = [
  {
    name: "Kreative Köpfe",
    slug: "kreative-koepfe",
    description: "Design, Kunst und visuelle Experimente — wie Behance trifft Instagram.",
    iconEmoji: "🎨",
    memberCount: 12840,
  },
  {
    name: "Deep Talk",
    slug: "deep-talk",
    description: "Lange Gedanken, ehrliche Diskussionen — Reddit-Qualität ohne Toxizität.",
    iconEmoji: "💬",
    memberCount: 9320,
  },
  {
    name: "Pro Pulse",
    slug: "pro-pulse",
    description: "Karriere, Skills, Networking — das Beste aus LinkedIn in Community-Form.",
    iconEmoji: "⚡",
    memberCount: 15600,
  },
  {
    name: "Loop Lab",
    slug: "loop-lab",
    description: "Kurzvideo, Trends und Creator-Tools — TikTok-Energie mit fairer Reichweite.",
    iconEmoji: "🎬",
    memberCount: 22100,
  },
  {
    name: "Nacht & Neon",
    slug: "nacht-neon",
    description: "Gaming, Streams, Memes — Discord-Vibes mit öffentlichem Feed.",
    iconEmoji: "🌙",
    memberCount: 18750,
  },
] as const;

const DEMO_AUTHORS = [
  { handle: "mira.codes", name: "Mira Chen", bio: "Full-Stack & UX" },
  { handle: "leo_lens", name: "Leo Hartmann", bio: "Fotograf · Berlin" },
  { handle: "pro.pulse", name: "Sara Okonkwo", bio: "Product Lead" },
  { handle: "loop_kid", name: "Jamie Flux", bio: "Creator · 120k" },
  { handle: "nightowl", name: "Alex N.", bio: "Streamer & Mod" },
] as const;

export async function ensureSocialDemoContent(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(socialCommunities);
    if ((existing[0]?.count ?? 0) > 0) return;

    await db.insert(socialCommunities).values([...DEMO_COMMUNITIES]);

    const comms = await db.select().from(socialCommunities);
    const commBySlug = new Map(comms.map((c) => [c.slug, c.id]));

    let systemUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, SYSTEM_USER_OPEN_ID))
      .limit(1);

    if (systemUser.length === 0) {
      await db.insert(users).values({
        openId: SYSTEM_USER_OPEN_ID,
        name: "Portal Bot",
        handle: "portal.bot",
        bio: "Offizieller Demo-Account",
        role: "admin",
      });
      systemUser = await db
        .select()
        .from(users)
        .where(eq(users.openId, SYSTEM_USER_OPEN_ID))
        .limit(1);
    }

    const authorIds: number[] = [];
    for (const author of DEMO_AUTHORS) {
      const openId = `social-demo-${author.handle}`;
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);
      if (existingUser.length > 0) {
        authorIds.push(existingUser[0].id);
        continue;
      }
      await db.insert(users).values({
        openId,
        name: author.name,
        handle: author.handle,
        bio: author.bio,
        role: "user",
      });
      const created = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);
      if (created[0]) authorIds.push(created[0].id);
    }

    const a = (i: number) => authorIds[i % authorIds.length] ?? systemUser[0].id;
    const c = (slug: string) => commBySlug.get(slug) ?? null;

    const now = Date.now();
    const demoPosts = [
      {
        authorId: a(0),
        communityId: c("pro-pulse"),
        postType: "text" as const,
        content:
          "Hot Take: Der beste Feed ist nicht einer Algorithmus — sondern drei: Freunde, Entdecken und Kreise. Wer das trennt, reduziert Doomscrolling ohne Reichweite zu killen. 🧠",
        topicTags: "produkt,feed,design",
        intensityLevel: 1,
      },
      {
        authorId: a(1),
        communityId: c("kreative-koepfe"),
        postType: "media" as const,
        content: "Golden hour am Spreeufer — Carousel-ready.",
        mediaUrls: JSON.stringify([
          "https://images.unsplash.com/photo-1529655683829-aba2723af192?w=800",
          "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800",
        ]),
        topicTags: "foto,berlin",
        intensityLevel: 2,
      },
      {
        authorId: a(2),
        communityId: c("pro-pulse"),
        postType: "poll" as const,
        content: "Was ist 2026 wichtiger für Creator?",
        pollOptions: JSON.stringify([
          "Authentische Community",
          "KI-Assistenz beim Erstellen",
          "Direkte Monetarisierung",
          "Cross-Posting ohne Wasserzeichen",
        ]),
        topicTags: "umfrage,creator",
        intensityLevel: 1,
      },
      {
        authorId: a(3),
        communityId: c("loop-lab"),
        postType: "spark" as const,
        content:
          "POV: Du scrollst Fluss und lernst in 15 Sekunden mehr als in 2h Feed-Rabbit-Hole. 🔥",
        mediaUrls: JSON.stringify([
          "https://images.unsplash.com/photo-1611162616475-46b635cb6848?w=600",
        ]),
        topicTags: "fluss,shortform",
        intensityLevel: 3,
      },
      {
        authorId: a(4),
        communityId: c("nacht-neon"),
        postType: "article" as const,
        content:
          "## Co-op Abend\n\nWer heute **Valheim** oder **Deep Rock** zockt? Kommentiert mit Plattform — wir matchen Squads.\n\n*(Langer Beitrag wie LinkedIn-Artikel + Reddit-Thread)*",
        topicTags: "gaming,coop",
        intensityLevel: 2,
      },
      {
        authorId: a(0),
        communityId: c("deep-talk"),
        postType: "text" as const,
        content:
          "Ehrliche Frage: Wann habt ihr das letzte Mal *absichtlich* nur den Freunde-Feed geöffnet — ohne Entdecken?",
        topicTags: "mentalhealth,social",
        intensityLevel: 0,
      },
    ];

    await db.insert(socialPosts).values(demoPosts);

    const storyAuthors = authorIds.slice(0, 4);
    const gradients = ["aurora", "sunset", "ocean", "neon"];
    for (let i = 0; i < storyAuthors.length; i++) {
      await db.insert(socialStories).values({
        authorId: storyAuthors[i],
        mediaUrl: `gradient:${gradients[i]}`,
        caption: ["Neues Projekt!", "Berlin 🌆", "Hiring 💼", "Live in 5"][i],
        gradientStyle: gradients[i],
        expiresAt: new Date(now + 20 * 60 * 60 * 1000),
      });
    }

    console.log("[Seed] Social Portal Demo-Inhalte angelegt");
  } catch (error) {
    console.error("[Seed] Social demo failed:", error);
  }
}
