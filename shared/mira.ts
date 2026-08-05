/** MIRA – Intentionales Social Network (Arbeitstitel) */

export type FeedMode = "nahe" | "fokus" | "drift";

export type PostKind = "signal" | "frame" | "pulse" | "truth";

export type Facet = "personal" | "craft" | "public";

export interface MiraUser {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  cover: string;
  facets: Facet[];
  craft: string;
  villageIds: string[];
  followerCount: number;
  followingCount: number;
  isYou?: boolean;
}

export interface Moment {
  id: string;
  authorId: string;
  mediaUrl: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  facet: Facet;
  body: string;
  mediaUrl?: string;
  mediaPoster?: string;
  circleId?: string;
  resonance: number;
  replies: number;
  echoes: number;
  saved: boolean;
  resonated: boolean;
  createdAt: string;
  tags: string[];
}

export interface Circle {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover: string;
  icon: string;
  memberCount: number;
  joined: boolean;
  channels: { id: string; name: string; kind: "chat" | "board" | "voice" }[];
  tags: string[];
}

export interface FeedRecipe {
  id: string;
  name: string;
  description: string;
  intent: string;
  sources: ("village" | "circles" | "following" | "discovery")[];
  includeTags: string[];
  excludeTags: string[];
  preferKinds: PostKind[];
  active: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  updatedAt: string;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Gathering {
  id: string;
  title: string;
  description: string;
  when: string;
  where: string;
  circleId?: string;
  hostId: string;
  attendeeCount: number;
  going: boolean;
}

export interface VaultItem {
  id: string;
  postId: string;
  collection: string;
  savedAt: string;
}

export const FEED_MODES: {
  id: FeedMode;
  label: string;
  blurb: string;
  inspiredBy: string;
}[] = [
  {
    id: "nahe",
    label: "Nähe",
    blurb: "Dein Dorf – endlicher Scroll, echte Menschen.",
    inspiredBy: "BeReal · Kyagi · WhatsApp-Status",
  },
  {
    id: "fokus",
    label: "Fokus",
    blurb: "Circles & Themen – Tiefe statt Rauschen.",
    inspiredBy: "Discord · Reddit · Facebook Groups",
  },
  {
    id: "drift",
    label: "Drift",
    blurb: "Entdeckung nach Interesse – nicht nach Sucht.",
    inspiredBy: "TikTok · Pinterest · YouTube",
  },
];

export const PLATFORM_DNA = [
  {
    from: "Instagram",
    take: "Frames & Moments",
    why: "Visuelle Präsenz ohne Filter-Theater",
  },
  {
    from: "TikTok",
    take: "Drift-Entdeckung",
    why: "Interest Graph – aber du steuerst die Absicht",
  },
  {
    from: "Discord",
    take: "Circles",
    why: "Echte Community-Räume mit Kanälen",
  },
  {
    from: "Bluesky",
    take: "Feed-Rezepte",
    why: "Algorithmen als Playlists, die du baust",
  },
  {
    from: "LinkedIn",
    take: "Facets",
    why: "Eine Identität, mehrere Ebenen (privat / craft / public)",
  },
  {
    from: "Reddit",
    take: "Resonance",
    why: "Qualität durch Community-Signal, nicht durch Rage",
  },
  {
    from: "BeReal",
    take: "Truth",
    why: "Authentische Fenster statt perfekter Feeds",
  },
  {
    from: "Threads / X",
    take: "Signals",
    why: "Schnelle Gedanken, echte Gespräche",
  },
  {
    from: "Pinterest",
    take: "Vault",
    why: "Sammeln, was dich prägt – nicht was dich hält",
  },
  {
    from: "Facebook",
    take: "Gatherings",
    why: "Offline treffen, online organisieren",
  },
] as const;
