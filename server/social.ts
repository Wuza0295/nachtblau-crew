import {
  createInitialSocialState,
  type Board,
  type Circle,
  type Conversation,
  type DirectMessage,
  type Moment,
  type Post,
  type Room,
  type SocialProfile,
  type SocialState,
} from "../shared/social-data";
import type { FeedLens, SignalType } from "../shared/brand";

let state: SocialState = createInitialSocialState();

export function getSocialState(): SocialState {
  return state;
}

export function resetSocialState() {
  state = createInitialSocialState();
}

function profileMap() {
  return new Map(state.profiles.map((p) => [p.id, p]));
}

export function enrichPost(post: Post) {
  const author = profileMap().get(post.authorId);
  const circle = post.circleId
    ? state.circles.find((c) => c.id === post.circleId)
    : undefined;
  return {
    ...post,
    author: author ?? null,
    circle: circle
      ? { id: circle.id, name: circle.name, slug: circle.slug }
      : null,
    mySignals: state.userSignals[post.id] ?? [],
  };
}

export function listFeed(opts: {
  lens?: FeedLens | "all";
  mix?: number;
  circleId?: string;
}) {
  const lens = opts.lens ?? state.activeLens;
  const mix = opts.mix ?? state.algorithmMix;
  let posts = [...state.posts];

  if (opts.circleId) {
    posts = posts.filter((p) => p.circleId === opts.circleId);
  } else if (lens !== "all") {
    posts = posts.filter((p) => p.lens === lens);
  }

  // Chronological vs discovery blend
  posts.sort((a, b) => {
    const chrono = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const engagement =
      Object.values(b.signals).reduce((s, n) => s + n, 0) -
      Object.values(a.signals).reduce((s, n) => s + n, 0);
    const score = (chrono * (100 - mix) + engagement * mix) / 100;
    return score > 0 ? -1 : score < 0 ? 1 : 0;
  });

  return posts.map(enrichPost);
}

export function getPost(id: string) {
  const post = state.posts.find((p) => p.id === id);
  return post ? enrichPost(post) : null;
}

export function createPost(input: {
  authorId: string;
  lens: FeedLens;
  body: string;
  mediaUrl?: string;
  circleId?: string;
  tags?: string[];
}) {
  const post: Post = {
    id: `p${Date.now()}`,
    authorId: input.authorId,
    lens: input.lens,
    body: input.body,
    mediaUrl: input.mediaUrl,
    circleId: input.circleId,
    createdAt: new Date().toISOString(),
    signals: { amplify: 0, echo: 0, agree: 0, collect: 0 },
    comments: 0,
    tags: input.tags ?? [],
  };
  state.posts.unshift(post);
  return enrichPost(post);
}

export function toggleSignal(postId: string, signal: SignalType) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return null;

  const current = new Set(state.userSignals[postId] ?? []);
  if (current.has(signal)) {
    current.delete(signal);
    post.signals[signal] = Math.max(0, post.signals[signal] - 1);
  } else {
    current.add(signal);
    post.signals[signal] += 1;
  }
  state.userSignals[postId] = Array.from(current);
  return enrichPost(post);
}

export function listMoments() {
  const map = profileMap();
  return state.moments.map((m) => ({
    ...m,
    author: map.get(m.authorId) ?? null,
  }));
}

export function markMomentViewed(id: string) {
  const moment = state.moments.find((m) => m.id === id);
  if (moment) moment.viewed = true;
  return moment ?? null;
}

export function listCircles() {
  return state.circles.map((c) => ({
    ...c,
    joined: state.joinedCircleIds.includes(c.id),
    rooms: state.rooms.filter((r) => r.circleId === c.id),
  }));
}

export function getCircle(slug: string) {
  const circle = state.circles.find((c) => c.slug === slug);
  if (!circle) return null;
  return {
    ...circle,
    joined: state.joinedCircleIds.includes(circle.id),
    rooms: state.rooms.filter((r) => r.circleId === circle.id),
    posts: listFeed({ lens: "all", circleId: circle.id }),
  };
}

export function toggleJoinCircle(circleId: string) {
  const idx = state.joinedCircleIds.indexOf(circleId);
  if (idx >= 0) state.joinedCircleIds.splice(idx, 1);
  else state.joinedCircleIds.push(circleId);
  return listCircles().find((c) => c.id === circleId) ?? null;
}

export function listBoards() {
  const map = profileMap();
  return state.boards.map((b) => ({
    ...b,
    owner: map.get(b.ownerId) ?? null,
  }));
}

export function listRooms() {
  return state.rooms
    .filter((r) => r.isLive)
    .map((r) => ({
      ...r,
      circle: state.circles.find((c) => c.id === r.circleId) ?? null,
    }));
}

export function listConversations(viewerId = "u1") {
  const map = profileMap();
  return state.conversations.map((c) => {
    const otherId = c.participantIds.find((id) => id !== viewerId) ?? c.participantIds[0];
    return {
      ...c,
      other: map.get(otherId) ?? null,
    };
  });
}

export function getConversation(id: string, viewerId = "u1") {
  const conversation = state.conversations.find((c) => c.id === id);
  if (!conversation) return null;
  const map = profileMap();
  const otherId =
    conversation.participantIds.find((pid) => pid !== viewerId) ??
    conversation.participantIds[0];
  return {
    ...conversation,
    other: map.get(otherId) ?? null,
    messages: state.messages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
  };
}

export function sendMessage(conversationId: string, senderId: string, body: string) {
  const msg: DirectMessage = {
    id: `dm${Date.now()}`,
    conversationId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
  };
  state.messages.push(msg);
  const conv = state.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = body;
    conv.updatedAt = msg.createdAt;
  }
  return msg;
}

export function getProfile(handleOrId: string) {
  const profile =
    state.profiles.find((p) => p.handle === handleOrId || p.id === handleOrId) ?? null;
  if (!profile) return null;
  return {
    ...profile,
    isFollowing: state.followingIds.includes(profile.id),
    posts: state.posts.filter((p) => p.authorId === profile.id).map(enrichPost),
    boards: state.boards.filter((b) => b.ownerId === profile.id),
    moments: state.moments.filter((m) => m.authorId === profile.id),
  };
}

export function toggleFollow(profileId: string) {
  const idx = state.followingIds.indexOf(profileId);
  if (idx >= 0) state.followingIds.splice(idx, 1);
  else state.followingIds.push(profileId);
  return getProfile(profileId);
}

export function setAlgorithmMix(mix: number) {
  state.algorithmMix = Math.min(100, Math.max(0, Math.round(mix)));
  return state.algorithmMix;
}

export function setActiveLens(lens: FeedLens) {
  state.activeLens = lens;
  return state.activeLens;
}

export function getPreferences() {
  return {
    algorithmMix: state.algorithmMix,
    activeLens: state.activeLens,
    joinedCircleIds: state.joinedCircleIds,
    followingIds: state.followingIds,
  };
}

export function getDiscover() {
  return {
    trendingTags: [
      { tag: "algorithm", count: 1280 },
      { tag: "ritual", count: 940 },
      { tag: "architecture", count: 720 },
      { tag: "commons", count: 610 },
      { tag: "gamedev", count: 540 },
      { tag: "running", count: 480 },
    ],
    suggestedPeople: state.profiles
      .filter((p) => !state.followingIds.includes(p.id) && p.id !== "u1")
      .slice(0, 4),
    featuredCircles: listCircles().slice(0, 3),
    liveRooms: listRooms(),
  };
}

export type { SocialProfile, Post, Moment, Circle, Board, Room, Conversation };
