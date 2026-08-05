/** FLUX — Arbeitsname für das Social-Portal (finaler Name folgt). */

export const PRODUCT = {
  workingName: "FLUX",
  namePending: true,
  tagline: "Alles Soziale. Ein Ort.",
  pitch:
    "Die Stärken von Instagram, X, TikTok, Discord, Reddit, Bluesky, LinkedIn und BeReal — in einem Portal mit Modi, die du steuerst.",
} as const;

export type FeedMode = "chronik" | "nah" | "entdecken" | "fokus";

export const FEED_MODES: {
  id: FeedMode;
  label: string;
  blurb: string;
  inspiredBy: string;
}[] = [
  {
    id: "chronik",
    label: "Chronik",
    blurb: "Alles von Menschen, denen du folgst — in Reihenfolge.",
    inspiredBy: "Bluesky",
  },
  {
    id: "nah",
    label: "Nah",
    blurb: "Nur enge Kreise und echte Nähe — ohne Reichweite-Druck.",
    inspiredBy: "Snapchat / Close Friends",
  },
  {
    id: "entdecken",
    label: "Entdecken",
    blurb: "Interesse-Graph: Neues, das Resonanz erzeugen könnte.",
    inspiredBy: "TikTok / Instagram",
  },
  {
    id: "fokus",
    label: "Fokus",
    blurb: "Lange Gedanken, Expertise, Diskussionen mit Substanz.",
    inspiredBy: "LinkedIn / Reddit",
  },
];

export type PostKind = "signal" | "visual" | "essay" | "pulse" | "moment";

export type SocialAuthor = {
  id: number;
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  roleLabel: string;
  presence: "online" | "away" | "offline";
  closeness: number; // 0–100 for Presence Rings
};

export type SocialPost = {
  id: string;
  authorId: number;
  kind: PostKind;
  body: string;
  title?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  circleId?: string;
  topics: string[];
  resonance: number;
  replies: number;
  shares: number;
  crystallized: boolean;
  createdAt: string; // ISO
  modeTags: FeedMode[];
};

export type MomentItem = {
  id: string;
  authorId: number;
  mediaUrl: string;
  caption: string;
  frontCamera: boolean;
  expiresAt: string;
  resonance: number;
  crystallizeThreshold: number;
};

export type CircleChannel = {
  id: string;
  name: string;
  kind: "live" | "thread" | "voice";
};

export type Circle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl: string;
  memberCount: number;
  topics: string[];
  channels: CircleChannel[];
  isJoined: boolean;
};

export type CircleThread = {
  id: string;
  circleId: string;
  authorId: number;
  title: string;
  body: string;
  upvotes: number;
  replies: number;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participantIds: number[];
  lastMessage: string;
  updatedAt: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  authorId: number;
  body: string;
  createdAt: string;
};

export type RadarInterest = {
  topic: string;
  weight: number; // -100 to 100
};

export type PulseClip = {
  id: string;
  authorId: number;
  title: string;
  mediaUrl: string;
  body: string;
  topics: string[];
  watchHint: string;
  resonance: number;
};
