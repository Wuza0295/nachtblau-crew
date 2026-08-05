/** Shared social domain types for Lumen */

export type LensId = "chrono" | "signal" | "discover" | "focus";

export type PostKind = "thought" | "depth" | "spark" | "media";

export type Visibility = "public" | "followers" | "circle";

export interface SocialProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarInitials: string;
  location?: string;
  joinedAt: string;
  following: number;
  followers: number;
  interests: string[];
  isVerified?: boolean;
}

export interface MomentItem {
  id: string;
  authorId: string;
  mediaGradient: string;
  caption: string;
  prompt?: string;
  expiresAt: string;
  viewed: boolean;
}

export interface PostItem {
  id: string;
  authorId: string;
  kind: PostKind;
  body: string;
  title?: string;
  mediaGradient?: string;
  mediaLabel?: string;
  topics: string[];
  createdAt: string;
  /** Quality signal — conversation & saves weighted higher than raw likes */
  signal: number;
  replies: number;
  echoes: number;
  saves: number;
  /** Why this post appears under a given lens */
  reasons?: string[];
  circleId?: string;
  collectiveId?: string;
  quotedPostId?: string;
}

export interface ReplyItem {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  signal: number;
}

export interface CircleRoom {
  id: string;
  name: string;
  kind: "chat" | "voice" | "board";
  unread?: number;
}

export interface CircleItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  accent: string;
  coverGradient: string;
  rooms: CircleRoom[];
  isJoined: boolean;
  tags: string[];
}

export interface CollectiveItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  members: number;
  postsToday: number;
  accent: string;
  isJoined: boolean;
}

export interface ConversationItem {
  id: string;
  participantIds: string[];
  lastMessage: string;
  updatedAt: string;
  unread: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface LensMeta {
  id: LensId;
  label: string;
  description: string;
  weights: {
    freshness: number;
    affinity: number;
    signal: number;
    exploration: number;
  };
}

export const LENSES: LensMeta[] = [
  {
    id: "chrono",
    label: "Chrono",
    description: "Rein chronologisch — nur Menschen, denen du folgst.",
    weights: { freshness: 1, affinity: 0.8, signal: 0, exploration: 0 },
  },
  {
    id: "signal",
    label: "Signal",
    description: "Qualität zuerst: Dialoge & Saves schlagen Ragebait.",
    weights: { freshness: 0.4, affinity: 0.5, signal: 1, exploration: 0.15 },
  },
  {
    id: "discover",
    label: "Discover",
    description: "Interessen-Graph wie TikTok — neue Stimmen finden.",
    weights: { freshness: 0.5, affinity: 0.2, signal: 0.5, exploration: 1 },
  },
  {
    id: "focus",
    label: "Focus",
    description: "Tiefe Gedanken & Depth-Posts — weniger Noise.",
    weights: { freshness: 0.3, affinity: 0.6, signal: 0.8, exploration: 0.1 },
  },
];
