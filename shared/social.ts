import type { MoodId } from "./site";

export type Resonance = {
  reacts: number;
  replies: number;
  saves: number;
  shares: number;
};

export type SocialUser = {
  id: number;
  handle: string;
  name: string;
  bio: string;
  avatarGradient: string;
  mood: MoodId;
  followers: number;
  following: number;
  verified?: boolean;
  focus?: string;
};

export type Moment = {
  id: number;
  authorId: number;
  imageGradient: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
};

export type PostKind = "text" | "image" | "pulse" | "longform" | "moment";

export type SocialPost = {
  id: number;
  authorId: number;
  kind: PostKind;
  mood: MoodId;
  circleId?: number;
  title?: string;
  body: string;
  mediaGradient?: string;
  tags: string[];
  createdAt: string;
  resonance: Resonance;
  replyToId?: number;
};

export type Circle = {
  id: number;
  slug: string;
  name: string;
  description: string;
  members: number;
  online: number;
  accent: string;
  rooms: { id: string; name: string; kind: "chat" | "voice" | "board" }[];
};

export type Conversation = {
  id: number;
  participantIds: number[];
  preview: string;
  updatedAt: string;
  unread: number;
};

export type DirectMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
};

export type Collection = {
  id: number;
  ownerId: number;
  name: string;
  postIds: number[];
};

/** Weighted engagement — quality over empty likes (X/IG 2026 signals) */
export function resonanceScore(r: Resonance): number {
  return r.reacts * 1 + r.replies * 3 + r.saves * 2 + r.shares * 4;
}

export function formatScore(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
