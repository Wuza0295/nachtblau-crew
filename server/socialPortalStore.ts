import {
  type Community,
  type ContentLayer,
  type DirectThread,
  type FeedView,
  type ReactionKind,
  SEED_COMMUNITIES,
  SEED_POSTS as INITIAL_POSTS,
  SEED_STORIES,
  type SocialPost,
  type StoryRing,
} from "@shared/socialPortal";

type UserReactionState = Record<string, Record<string, Partial<Record<ReactionKind, boolean>>>>;

type PollVoteState = Record<string, string>;

let posts: SocialPost[] = structuredClone(INITIAL_POSTS);
let stories: StoryRing[] = structuredClone(SEED_STORIES);
const userReactions: UserReactionState = {};
const pollVotes: PollVoteState = {};
const savedPosts = new Set<string>();

export function getPortalMeta() {
  return {
    tagline: "Hybrid Social — Name folgt",
    feedViews: ["pulse", "canvas", "signal", "circles"] as FeedView[],
    layers: ["social", "professional", "creative"] as const,
  };
}

export function listCommunities(): Community[] {
  return SEED_COMMUNITIES;
}

export function getCommunityBySlug(slug: string): Community | undefined {
  return SEED_COMMUNITIES.find((c) => c.slug === slug);
}

export function listPosts(filters: {
  layer: ContentLayer;
  communityId?: string;
  format?: SocialPost["format"];
  sort?: "trending" | "new" | "boosted";
}): SocialPost[] {
  let result = [...posts];

  if (filters.layer !== "all") {
    result = result.filter((p) => p.layer === filters.layer);
  }
  if (filters.communityId) {
    result = result.filter((p) => p.communityId === filters.communityId);
  }
  if (filters.format) {
    result = result.filter((p) => p.format === filters.format);
  }

  switch (filters.sort ?? "trending") {
    case "new":
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "boosted":
      result.sort((a, b) => b.reactions.boost - a.reactions.boost);
      break;
    case "trending":
    default:
      result.sort((a, b) => b.communityScore - a.communityScore);
  }

  return result;
}

export function getPostById(id: string): SocialPost | undefined {
  return posts.find((p) => p.id === id);
}

export function listStories(): StoryRing[] {
  return stories;
}

export function markStorySeen(storyId: string, userKey: string) {
  void userKey;
  stories = stories.map((s) => (s.id === storyId ? { ...s, seen: true } : s));
}

export function toggleReaction(
  postId: string,
  kind: ReactionKind,
  userKey: string
): { post: SocialPost; active: boolean } {
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("NOT_FOUND");

  if (!userReactions[userKey]) userReactions[userKey] = {};
  if (!userReactions[userKey][postId]) userReactions[userKey][postId] = {};
  const prev = userReactions[userKey][postId];
  const wasActive = !!prev[kind];

  if (wasActive) {
    post.reactions[kind] = Math.max(0, post.reactions[kind] - 1);
    if (kind === "boost") post.communityScore = Math.max(0, post.communityScore - 3);
    delete prev[kind];
  } else {
    post.reactions[kind] = post.reactions[kind] + 1;
    if (kind === "boost") post.communityScore += 3;
    prev[kind] = true;
  }
  userReactions[userKey][postId] = prev;

  return { post: { ...post }, active: !wasActive };
}

export function votePoll(
  postId: string,
  optionId: string,
  userKey: string
): SocialPost {
  const post = posts.find((p) => p.id === postId);
  if (!post?.poll) throw new Error("NO_POLL");

  const prevVote = pollVotes[`${userKey}:${postId}`];
  if (prevVote === optionId) return { ...post };

  if (prevVote) {
    const opt = post.poll.options.find((o) => o.id === prevVote);
    if (opt) opt.votes = Math.max(0, opt.votes - 1);
  }

  const target = post.poll.options.find((o) => o.id === optionId);
  if (!target) throw new Error("INVALID_OPTION");
  target.votes += 1;
  pollVotes[`${userKey}:${postId}`] = optionId;

  return { ...post };
}

export function toggleSave(postId: string, userKey: string): { saved: boolean } {
  const key = `${userKey}:${postId}`;
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("NOT_FOUND");

  if (savedPosts.has(key)) {
    savedPosts.delete(key);
    post.saveCount = Math.max(0, post.saveCount - 1);
    return { saved: false };
  }
  savedPosts.add(key);
  post.saveCount += 1;
  return { saved: true };
}

export function createThoughtPost(input: {
  body: string;
  layer: Exclude<ContentLayer, "all">;
  communityId?: string;
  authorKey: string;
}): SocialPost {
  void input.authorKey;
  const id = `p${Date.now()}`;
  const post: SocialPost = {
    id,
    authorId: "a4",
    format: "thought",
    layer: input.layer,
    communityId: input.communityId,
    body: input.body.slice(0, 500),
    tags: [],
    createdAt: new Date().toISOString(),
    commentCount: 0,
    saveCount: 0,
    shareCount: 0,
    reactions: {
      resonate: 0,
      insight: 0,
      support: 0,
      celebrate: 0,
      curious: 0,
      boost: 0,
    },
    communityScore: 0,
  };
  posts = [post, ...posts];
  return post;
}

export function listDmThreads(): DirectThread[] {
  return [
    {
      id: "d1",
      participantIds: ["a1", "a4"],
      lastMessage: "Lass uns das Pulse-Layout testen!",
      unread: 2,
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "d2",
      participantIds: ["a2", "a4"],
      lastMessage: "Rohschnitt ist im Drive.",
      unread: 0,
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ];
}

/** Reset for tests */
export function _resetPortalStore() {
  posts = structuredClone(INITIAL_POSTS);
  stories = structuredClone(SEED_STORIES);
  Object.keys(userReactions).forEach((k) => delete userReactions[k]);
  Object.keys(pollVotes).forEach((k) => delete pollVotes[k]);
  savedPosts.clear();
}
