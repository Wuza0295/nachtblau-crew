/**
 * Hybrid social portal — shared types & seed content.
 * Combines best patterns from TikTok, Instagram, X/Threads, Reddit, LinkedIn, Pinterest, Discord.
 */

export type FeedView = "pulse" | "canvas" | "signal" | "circles";
export type ContentLayer = "all" | "social" | "professional" | "creative";
export type PostFormat = "moment" | "clip" | "thought" | "thread" | "poll" | "collection";

export type ReactionKind =
  | "resonate"
  | "insight"
  | "support"
  | "celebrate"
  | "curious"
  | "boost";

export const REACTION_META: Record<
  ReactionKind,
  { label: string; emoji: string; description: string }
> = {
  resonate: { label: "Resoniert", emoji: "💫", description: "Das trifft mich" },
  insight: { label: "Einsicht", emoji: "💡", description: "Wertvolle Perspektive" },
  support: { label: "Support", emoji: "🤝", description: "Ich stehe dahinter" },
  celebrate: { label: "Feiern", emoji: "🎉", description: "Grund zum Anstoßen" },
  curious: { label: "Neugier", emoji: "🔍", description: "Erzähl mehr" },
  boost: { label: "Boost", emoji: "⬆️", description: "Community-Push (sichtbar im Ranking)" },
};

export type SocialAuthor = {
  id: string;
  handle: string;
  displayName: string;
  avatarGradient: string;
  verified: boolean;
  headline?: string;
};

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type SocialPost = {
  id: string;
  authorId: string;
  format: PostFormat;
  layer: Exclude<ContentLayer, "all">;
  communityId?: string;
  title?: string;
  body: string;
  mediaUrl?: string;
  mediaAspect?: "9:16" | "16:9" | "1:1";
  tags: string[];
  createdAt: string;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  reactions: Record<ReactionKind, number>;
  communityScore: number;
  poll?: { question: string; options: PollOption[]; endsAt: string };
  collectionItems?: { title: string; imageUrl: string }[];
};

export type StoryRing = {
  id: string;
  authorId: string;
  previewLabel: string;
  expiresInHours: number;
  seen: boolean;
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  icon: string;
  rules: string[];
};

export type DirectThread = {
  id: string;
  participantIds: string[];
  lastMessage: string;
  unread: number;
  updatedAt: string;
};

export const SEED_AUTHORS: SocialAuthor[] = [
  {
    id: "a1",
    handle: "lena.codes",
    displayName: "Lena Weber",
    avatarGradient: "from-violet-500 to-fuchsia-500",
    verified: true,
    headline: "Indie-Dev · Accessibility",
  },
  {
    id: "a2",
    handle: "marcus.film",
    displayName: "Marcus Okonkwo",
    avatarGradient: "from-amber-500 to-orange-600",
    verified: false,
    headline: "Kurzfilm · Motion Design",
  },
  {
    id: "a3",
    handle: "sophie.research",
    displayName: "Dr. Sophie Hartmann",
    avatarGradient: "from-cyan-500 to-blue-600",
    verified: true,
    headline: "Klima · Open Science",
  },
  {
    id: "a4",
    handle: "kai.community",
    displayName: "Kai Müller",
    avatarGradient: "from-emerald-500 to-teal-600",
    verified: false,
    headline: "Community Builder",
  },
  {
    id: "a5",
    handle: "nova.studio",
    displayName: "Nova Studio",
    avatarGradient: "from-rose-500 to-pink-600",
    verified: true,
    headline: "Design Collective",
  },
];

export const SEED_COMMUNITIES: Community[] = [
  {
    id: "c1",
    name: "Zukunft der Arbeit",
    slug: "zukunft-arbeit",
    description: "Async, KI-Tools, faire Creator-Economy — ohne LinkedIn-Noise.",
    memberCount: 28400,
    onlineCount: 412,
    icon: "🚀",
    rules: ["Kein Recruiting-Spam", "Quellen bei Behauptungen", "Respektvoller Ton"],
  },
  {
    id: "c2",
    name: "Analog & Offline",
    slug: "analog-offline",
    description: "Bücher, Spaziergänge, Handwerk — Gegenmittel zum Doomscroll.",
    memberCount: 15200,
    onlineCount: 189,
    icon: "📖",
    rules: ["Keine Hot Takes über andere Communities", "Fotos willkommen"],
  },
  {
    id: "c3",
    name: "Creator Lab",
    slug: "creator-lab",
    description: "Feedback zu Schnitt, Thumbnails, Hooks — 30s bis 2min Sweet Spot.",
    memberCount: 43100,
    onlineCount: 890,
    icon: "🎬",
    rules: ["Constructive only", "Credit original work"],
  },
  {
    id: "c4",
    name: "Local Köln",
    slug: "local-koeln",
    description: "Events, Tipps, Nachbarschaft — hyperlokal statt globaler Echokammer.",
    memberCount: 8900,
    onlineCount: 124,
    icon: "📍",
    rules: ["Nur Kölner Inhalte", "Keine Politik-Flamewars"],
  },
];

const emptyReactions = (): Record<ReactionKind, number> => ({
  resonate: 0,
  insight: 0,
  support: 0,
  celebrate: 0,
  curious: 0,
  boost: 0,
});

export const SEED_POSTS: SocialPost[] = [
  {
    id: "p1",
    authorId: "a2",
    format: "clip",
    layer: "creative",
    communityId: "c3",
    body: "90-Sekunden-Regel: Hook in 2s, Payoff in 45s, CTA ohne Cringe. Hier mein Schnitt vor/nach.",
    mediaUrl:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
    mediaAspect: "9:16",
    tags: ["shortform", "editing", "creator"],
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    commentCount: 89,
    saveCount: 412,
    shareCount: 67,
    reactions: {
      resonate: 1204,
      insight: 890,
      support: 234,
      celebrate: 156,
      curious: 445,
      boost: 312,
    },
    communityScore: 2847,
  },
  {
    id: "p2",
    authorId: "a3",
    format: "thought",
    layer: "professional",
    body: "Social Search ersetzt nicht Google — aber bei „Wie mache ich X?“ gewinnt authentisches Kurzvideo. Caption + gesprochene Keywords sind SEO.",
    tags: ["socialsearch", "2026", "strategy"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    commentCount: 56,
    saveCount: 1203,
    shareCount: 201,
    reactions: {
      resonate: 445,
      insight: 2100,
      support: 89,
      celebrate: 12,
      curious: 334,
      boost: 178,
    },
    communityScore: 1920,
  },
  {
    id: "p3",
    authorId: "a4",
    format: "poll",
    layer: "social",
    communityId: "c1",
    body: "Wo trefft ihr eure engste Community 2026?",
    tags: ["community", "poll"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    commentCount: 234,
    saveCount: 89,
    shareCount: 45,
    reactions: {
      resonate: 678,
      insight: 123,
      support: 456,
      celebrate: 34,
      curious: 890,
      boost: 567,
    },
    communityScore: 1456,
    poll: {
      question: "Primärer Community-Kanal",
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      options: [
        { id: "o1", label: "Private Gruppe / Broadcast", votes: 3421 },
        { id: "o2", label: "Discord / Slack", votes: 2890 },
        { id: "o3", label: "Öffentlicher Feed", votes: 890 },
        { id: "o4", label: "Newsletter", votes: 1567 },
      ],
    },
  },
  {
    id: "p4",
    authorId: "a5",
    format: "collection",
    layer: "creative",
    body: "Moodboard: UI ohne Vanity Metrics — Inspiration für unser nächstes Produkt.",
    tags: ["design", "ux", "boards"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    commentCount: 34,
    saveCount: 2890,
    shareCount: 112,
    reactions: {
      resonate: 890,
      insight: 567,
      support: 123,
      celebrate: 45,
      curious: 234,
      boost: 89,
    },
    communityScore: 890,
    collectionItems: [
      {
        title: "Calm density",
        imageUrl:
          "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=80",
      },
      {
        title: "Typography first",
        imageUrl:
          "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80",
      },
      {
        title: "Dark humane",
        imageUrl:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
      },
      {
        title: "Micro-interactions",
        imageUrl:
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80",
      },
    ],
  },
  {
    id: "p5",
    authorId: "a1",
    format: "thread",
    layer: "professional",
    communityId: "c3",
    title: "Barrierefreiheit in 5 Minuten Video",
    body: "1/ Untertitel sind Pflicht, animiert sync > statisch.\n2/ Kontrast prüfen, nicht nur ästhetisch.\n3/ Keine Info nur in Farbe.\n4/ Pausen für Lesen.\n5/ Transkript verlinken.",
    tags: ["a11y", "video", "thread"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    commentCount: 167,
    saveCount: 2340,
    shareCount: 445,
    reactions: {
      resonate: 567,
      insight: 3400,
      support: 1200,
      celebrate: 89,
      curious: 234,
      boost: 890,
    },
    communityScore: 4102,
  },
  {
    id: "p6",
    authorId: "a4",
    format: "thought",
    layer: "social",
    communityId: "c4",
    body: "Heute Abend: Open Mic am Rhein. Wer kommt? Bringt Freunde, kein Algorithmus nötig — echte Begegnung.",
    tags: ["köln", "offline", "events"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    commentCount: 78,
    saveCount: 156,
    shareCount: 34,
    reactions: {
      resonate: 890,
      insight: 45,
      support: 1200,
      celebrate: 678,
      curious: 123,
      boost: 234,
    },
    communityScore: 756,
  },
];

export const SEED_STORIES: StoryRing[] = [
  {
    id: "s1",
    authorId: "a1",
    previewLabel: "Ship day",
    expiresInHours: 18,
    seen: false,
  },
  {
    id: "s2",
    authorId: "a2",
    previewLabel: "BTS Schnitt",
    expiresInHours: 22,
    seen: false,
  },
  {
    id: "s3",
    authorId: "a3",
    previewLabel: "Paper drop",
    expiresInHours: 8,
    seen: true,
  },
  {
    id: "s4",
    authorId: "a5",
    previewLabel: "WIP",
    expiresInHours: 14,
    seen: false,
  },
];

export const PORTAL_TAGLINE =
  "Ein Ort für alles — Pulse, Canvas, Signal & Circles in einer demokratischen, schichtbaren Erfahrung.";

export const FEED_VIEW_META: Record<
  FeedView,
  { label: string; short: string; inspiration: string }
> = {
  pulse: {
    label: "Pulse",
    short: "Vollbild",
    inspiration: "TikTok / Reels / Shorts",
  },
  canvas: {
    label: "Canvas",
    short: "Raster",
    inspiration: "Instagram / Pinterest",
  },
  signal: {
    label: "Signal",
    short: "Mikro & Threads",
    inspiration: "X / Threads / LinkedIn",
  },
  circles: {
    label: "Circles",
    short: "Communities",
    inspiration: "Reddit / Discord",
  },
};

export const LAYER_META: Record<
  Exclude<ContentLayer, "all">,
  { label: string; description: string }
> = {
  social: { label: "Sozial", description: "Freunde, Alltag, Events" },
  professional: { label: "Fach", description: "Karriere & Expertise ohne Feed-Spam" },
  creative: { label: "Kreativ", description: "Portfolio, Kunst, Experimente" },
};
