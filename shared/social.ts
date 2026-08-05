export type LensId = "pulse" | "orbit" | "circles" | "depth";
export type PostType = "pulse" | "frame" | "signal" | "moment";
export type ResonanceType = "spark" | "depth" | "echo";

export type SocialProfile = {
  id: number;
  openId: string | null;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  accent: string;
  followerCount: number;
  followingCount: number;
  isDemo: boolean;
  createdAt: string;
};

export type Circle = {
  id: number;
  name: string;
  slug: string;
  description: string;
  topic: string;
  memberCount: number;
  accent: string;
  isGathering: boolean;
  gatheringTitle: string | null;
  norms: string[];
};

export type SocialPost = {
  id: number;
  authorId: number;
  type: PostType;
  title: string | null;
  content: string;
  mediaGradient: string | null;
  mediaLabel: string | null;
  circleId: number | null;
  parentId: number | null;
  sparkCount: number;
  depthCount: number;
  echoCount: number;
  replyCount: number;
  createdAt: string;
  expiresAt: string | null;
};

export type PostWithMeta = SocialPost & {
  author: SocialProfile;
  circle: Circle | null;
  myResonance: ResonanceType | null;
  isFollowingAuthor: boolean;
};

export type Gathering = {
  id: number;
  circleId: number;
  title: string;
  participantCount: number;
  activeUntil: string;
  circle: Circle;
};
