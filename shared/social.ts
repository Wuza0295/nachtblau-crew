export type LensId = "pulse" | "canvas" | "motion" | "circles" | "signal" | "vault";
export type IntentId = "browse" | "connect" | "create" | "focus";
export type PostKind = "text" | "image" | "carousel" | "video" | "article" | "collection";

export type AlgorithmWeights = {
  recency: number;
  relevance: number;
  diversity: number;
  quiet: number;
  social: number;
};

export type SocialProfile = {
  id: number;
  handle: string;
  name: string;
  bio: string;
  avatarColor: string;
  role: string;
  location?: string;
  following: number[];
  followers: number[];
  interests: string[];
  isDemo: boolean;
};

export type Story = {
  id: number;
  authorId: number;
  mediaUrl: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
};

export type Post = {
  id: number;
  authorId: number;
  kind: PostKind;
  lenses: LensId[];
  title?: string;
  body: string;
  mediaUrls: string[];
  tags: string[];
  circleId?: number;
  collectionId?: number;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  saveCount: number;
  likedBy: number[];
  savedBy: number[];
  createdAt: string;
};

export type Reply = {
  id: number;
  postId: number;
  authorId: number;
  body: string;
  createdAt: string;
};

export type Circle = {
  id: number;
  slug: string;
  name: string;
  description: string;
  topic: string;
  memberCount: number;
  memberIds: number[];
  channels: { id: string; name: string; kind: "chat" | "posts" | "events" }[];
  accent: string;
};

export type Collection = {
  id: number;
  authorId: number;
  title: string;
  description: string;
  coverUrl: string;
  postIds: number[];
  isPublic: boolean;
};

export type NotificationItem = {
  id: number;
  type: "like" | "reply" | "follow" | "mention" | "circle";
  actorId: number;
  postId?: number;
  message: string;
  createdAt: string;
  read: boolean;
};

export type FeedPost = Post & {
  author: Pick<SocialProfile, "id" | "handle" | "name" | "avatarColor" | "role">;
  score: number;
  liked: boolean;
  saved: boolean;
};
