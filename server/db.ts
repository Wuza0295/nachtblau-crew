import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import type { FormatId, FrequencyId, ReactionId } from "../shared/site";
import { ENV } from "./_core/env";
import {
  getStore,
  nextId,
  publicUser,
  type StoreComment,
  type StorePost,
  type StoreUser,
} from "./store";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users (OAuth + store) ────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const store = getStore();
  const existing = store.users.find((u) => u.openId === user.openId);
  const now = new Date();

  if (existing) {
    if (user.name !== undefined) existing.name = user.name ?? existing.name;
    if (user.email !== undefined) existing.email = user.email ?? null;
    if (user.loginMethod !== undefined)
      existing.loginMethod = user.loginMethod ?? null;
    if (user.lastSignedIn !== undefined) existing.lastSignedIn = user.lastSignedIn;
    else existing.lastSignedIn = now;
    if (user.role !== undefined) existing.role = user.role;
    else if (user.openId === ENV.ownerOpenId) existing.role = "admin";
    existing.updatedAt = now;
  } else {
    const id = nextId("user");
    const handleBase =
      (user.name || "mensch")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 16) || `user${id}`;
    store.users.push({
      id,
      openId: user.openId,
      name: user.name ?? `Mensch ${id}`,
      handle: `${handleBase}${id}`,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      avatar: null,
      bio: null,
      vibe: null,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    });
  }

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  try {
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.warn("[Database] upsertUser failed, using memory store:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const store = getStore();
  const fromStore = store.users.find((u) => u.openId === openId);
  if (fromStore) return fromStore;

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  return getStore().users.find((u) => u.id === id);
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; bio?: string; avatar?: string; vibe?: string; handle?: string }
) {
  const user = getStore().users.find((u) => u.id === id);
  if (!user) return;
  if (data.name !== undefined) user.name = data.name;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.avatar !== undefined) user.avatar = data.avatar;
  if (data.vibe !== undefined) user.vibe = data.vibe;
  if (data.handle !== undefined) user.handle = data.handle;
  user.updatedAt = new Date();
}

export async function listDemoUsers() {
  return getStore().users.map(publicUser);
}

// ─── Circles ──────────────────────────────────────────────────────────────────
export async function getCircleMembers(ownerId: number, tier?: "inner" | "orbit") {
  const store = getStore();
  return store.circles
    .filter((c) => c.ownerId === ownerId && (!tier || c.tier === tier))
    .map((c) => {
      const member = store.users.find((u) => u.id === c.memberId);
      if (!member) return null;
      return { ...c, member: publicUser(member) };
    })
    .filter((c): c is NonNullable<typeof c> => c != null);
}

export async function getInnerCircleCount(ownerId: number) {
  return getStore().circles.filter((c) => c.ownerId === ownerId && c.tier === "inner")
    .length;
}

export async function setCircleTier(
  ownerId: number,
  memberId: number,
  tier: "inner" | "orbit" | null
) {
  const store = getStore();
  if (tier !== null && !store.users.some((u) => u.id === memberId)) {
    throw new Error("Mensch nicht gefunden");
  }
  const existing = store.circles.find(
    (c) => c.ownerId === ownerId && c.memberId === memberId
  );

  if (tier === null) {
    if (existing) {
      const idx = store.circles.findIndex((c) => c.id === existing.id);
      if (idx >= 0) store.circles.splice(idx, 1);
    }
    return { success: true };
  }

  if (tier === "inner") {
    const count = store.circles.filter(
      (c) => c.ownerId === ownerId && c.tier === "inner" && c.memberId !== memberId
    ).length;
    if (count >= 12) {
      throw new Error("Innenkreis ist voll (max. 12)");
    }
  }

  if (existing) {
    existing.tier = tier;
  } else {
    store.circles.push({
      id: nextId("circle"),
      ownerId,
      memberId,
      tier,
      createdAt: new Date(),
    });
  }
  return { success: true };
}

// ─── Spaces ───────────────────────────────────────────────────────────────────
export async function listSpaces() {
  return getStore().spaces;
}

export async function getSpaceBySlug(slug: string) {
  return getStore().spaces.find((s) => s.slug === slug);
}

export async function getSpaceMembers(spaceId: number) {
  const store = getStore();
  return store.spaceMembers
    .filter((m) => m.spaceId === spaceId)
    .map((m) => {
      const user = store.users.find((u) => u.id === m.userId)!;
      return { ...m, user: publicUser(user) };
    });
}

export async function isSpaceMember(spaceId: number, userId: number) {
  return getStore().spaceMembers.some((m) => m.spaceId === spaceId && m.userId === userId);
}

export async function joinSpace(spaceId: number, userId: number) {
  const store = getStore();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) throw new Error("Raum nicht gefunden");
  if (store.spaceMembers.some((m) => m.spaceId === spaceId && m.userId === userId)) {
    return { success: true, already: true };
  }
  store.spaceMembers.push({
    id: nextId("spaceMember"),
    spaceId,
    userId,
    role: "member",
    joinedAt: new Date(),
  });
  space.memberCount += 1;
  return { success: true, already: false };
}

// ─── Posts / Feed ─────────────────────────────────────────────────────────────
function enrichPost(post: StorePost, viewerId?: number) {
  const store = getStore();
  const author = store.users.find((u) => u.id === post.authorId)!;
  const space = post.spaceId
    ? store.spaces.find((s) => s.id === post.spaceId) ?? null
    : null;
  const myReactions = viewerId
    ? store.reactions
        .filter((r) => r.postId === post.id && r.userId === viewerId)
        .map((r) => r.type)
    : [];

  return {
    ...post,
    author: publicUser(author),
    space: space
      ? { id: space.id, name: space.name, slug: space.slug, tone: space.tone }
      : null,
    myReactions,
  };
}

export async function getPostById(id: number, viewerId?: number) {
  const post = getStore().posts.find((p) => p.id === id);
  if (!post) return undefined;
  if (post.isEphemeral && post.expiresAt && post.expiresAt < new Date()) {
    return undefined;
  }
  return enrichPost(post, viewerId);
}

export async function getFeed(opts: {
  frequency: FrequencyId;
  viewerId?: number;
  spaceSlug?: string;
  limit?: number;
}) {
  const store = getStore();
  const limit = opts.limit ?? 30;
  const now = new Date();
  let posts = store.posts.filter(
    (p) => !(p.isEphemeral && p.expiresAt && p.expiresAt < now)
  );

  if (opts.frequency === "inner") {
    if (!opts.viewerId) {
      // Demo: show inner-visibility posts from demo circle of user 1
      const innerIds = new Set(
        store.circles
          .filter((c) => c.ownerId === 1 && c.tier === "inner")
          .map((c) => c.memberId)
      );
      innerIds.add(1);
      posts = posts.filter(
        (p) =>
          (p.visibility === "inner" || p.format === "moment") &&
          innerIds.has(p.authorId)
      );
    } else {
      const innerIds = new Set(
        store.circles
          .filter((c) => c.ownerId === opts.viewerId && c.tier === "inner")
          .map((c) => c.memberId)
      );
      innerIds.add(opts.viewerId);
      posts = posts.filter(
        (p) =>
          innerIds.has(p.authorId) &&
          (p.visibility === "inner" ||
            p.visibility === "orbit" ||
            p.format === "moment")
      );
    }
  } else if (opts.frequency === "orbit") {
    if (!opts.viewerId) {
      const orbitIds = new Set(
        store.circles.filter((c) => c.ownerId === 1).map((c) => c.memberId)
      );
      orbitIds.add(1);
      posts = posts.filter(
        (p) =>
          orbitIds.has(p.authorId) &&
          p.visibility !== "inner" &&
          p.format !== "moment"
      );
    } else {
      const orbitIds = new Set(
        store.circles
          .filter((c) => c.ownerId === opts.viewerId)
          .map((c) => c.memberId)
      );
      orbitIds.add(opts.viewerId);
      posts = posts.filter(
        (p) =>
          orbitIds.has(p.authorId) &&
          p.visibility !== "inner"
      );
    }
  } else if (opts.frequency === "horizon") {
    if (opts.spaceSlug) {
      const space = store.spaces.find((s) => s.slug === opts.spaceSlug);
      posts = posts.filter((p) => p.spaceId === space?.id);
    } else {
      posts = posts.filter(
        (p) =>
          p.spaceId != null &&
          (p.visibility === "horizon" || p.visibility === "public")
      );
    }
  } else if (opts.frequency === "drift") {
    // Transparent discovery: public + high resonate, newest mix
    posts = posts
      .filter((p) => p.visibility === "public" || p.visibility === "horizon")
      .sort(
        (a, b) =>
          b.resonateCount +
          b.saveCount * 2 +
          b.amplifyCount * 3 -
          (a.resonateCount + a.saveCount * 2 + a.amplifyCount * 3)
      );
    return posts.slice(0, limit).map((p) => enrichPost(p, opts.viewerId));
  }

  posts = [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return posts.slice(0, limit).map((p) => enrichPost(p, opts.viewerId));
}

export async function getPostsByAuthor(authorId: number, viewerId?: number) {
  return getStore()
    .posts.filter((p) => p.authorId === authorId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((p) => enrichPost(p, viewerId));
}

export async function createPost(data: {
  authorId: number;
  format: FormatId;
  content: string;
  title?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  spaceId?: number;
  visibility: FrequencyId | "public";
  isEphemeral?: boolean;
}) {
  const store = getStore();
  const now = new Date();
  const post: StorePost = {
    id: nextId("post"),
    authorId: data.authorId,
    format: data.format,
    title: data.title ?? null,
    content: data.content,
    mediaUrl: data.mediaUrl ?? null,
    mediaAlt: data.mediaAlt ?? null,
    spaceId: data.spaceId ?? null,
    visibility: data.visibility,
    resonateCount: 0,
    saveCount: 0,
    amplifyCount: 0,
    commentCount: 0,
    isEphemeral: data.isEphemeral ?? data.format === "moment",
    expiresAt:
      data.isEphemeral || data.format === "moment"
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
        : null,
    createdAt: now,
    updatedAt: now,
  };
  store.posts.unshift(post);
  return enrichPost(post, data.authorId);
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function getComments(postId: number) {
  const store = getStore();
  return store.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((c) => {
      const author = store.users.find((u) => u.id === c.authorId)!;
      return { ...c, author: publicUser(author) };
    });
}

export async function createComment(data: {
  postId: number;
  authorId: number;
  content: string;
}) {
  const store = getStore();
  const post = store.posts.find((p) => p.id === data.postId);
  if (!post) throw new Error("Beitrag nicht gefunden");

  const comment: StoreComment = {
    id: nextId("comment"),
    postId: data.postId,
    authorId: data.authorId,
    content: data.content,
    createdAt: new Date(),
  };
  store.comments.push(comment);
  post.commentCount += 1;

  const author = store.users.find((u) => u.id === data.authorId)!;
  return { ...comment, author: publicUser(author) };
}

// ─── Reactions ────────────────────────────────────────────────────────────────
export async function toggleReaction(
  postId: number,
  userId: number,
  type: ReactionId
) {
  const store = getStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Beitrag nicht gefunden");

  const existing = store.reactions.find(
    (r) => r.postId === postId && r.userId === userId && r.type === type
  );

  const countKey =
    type === "resonate"
      ? "resonateCount"
      : type === "save"
        ? "saveCount"
        : "amplifyCount";

  if (existing) {
    const idx = store.reactions.findIndex((r) => r.id === existing.id);
    if (idx >= 0) store.reactions.splice(idx, 1);
    post[countKey] = Math.max(0, post[countKey] - 1);
    return { active: false, counts: pickCounts(post) };
  }

  store.reactions.push({
    id: nextId("reaction"),
    postId,
    userId,
    type,
    createdAt: new Date(),
  });
  post[countKey] += 1;
  return { active: true, counts: pickCounts(post) };
}

function pickCounts(post: StorePost) {
  return {
    resonateCount: post.resonateCount,
    saveCount: post.saveCount,
    amplifyCount: post.amplifyCount,
  };
}

// ─── Collections ──────────────────────────────────────────────────────────────
export async function getCollections(userId: number) {
  const store = getStore();
  return store.collections
    .filter((c) => c.userId === userId)
    .map((c) => ({
      ...c,
      itemCount: store.collectionItems.filter((i) => i.collectionId === c.id).length,
    }));
}

export async function getCollectionItems(collectionId: number, viewerId?: number) {
  const store = getStore();
  return store.collectionItems
    .filter((i) => i.collectionId === collectionId)
    .map((i) => {
      const post = store.posts.find((p) => p.id === i.postId);
      return post ? { ...i, post: enrichPost(post, viewerId) } : null;
    })
    .filter(Boolean);
}

export async function addToCollection(collectionId: number, postId: number, userId: number) {
  const store = getStore();
  const collection = store.collections.find((c) => c.id === collectionId && c.userId === userId);
  if (!collection) throw new Error("Sammlung nicht gefunden");
  if (store.collectionItems.some((i) => i.collectionId === collectionId && i.postId === postId)) {
    return { success: true, already: true };
  }
  store.collectionItems.push({
    id: nextId("collectionItem"),
    collectionId,
    postId,
    addedAt: new Date(),
  });
  return { success: true, already: false };
}

export async function createCollection(userId: number, name: string, description?: string) {
  const store = getStore();
  const collection = {
    id: nextId("collection"),
    userId,
    name,
    description: description ?? null,
    createdAt: new Date(),
  };
  store.collections.push(collection);
  return { ...collection, itemCount: 0 };
}

export async function getProfileStats(userId: number) {
  const store = getStore();
  return {
    postCount: store.posts.filter((p) => p.authorId === userId).length,
    innerCount: store.circles.filter((c) => c.ownerId === userId && c.tier === "inner")
      .length,
    orbitCount: store.circles.filter((c) => c.ownerId === userId && c.tier === "orbit")
      .length,
    spaceCount: store.spaceMembers.filter((m) => m.userId === userId).length,
  };
}

/** Resolve store user for auth context — maps OAuth users into store */
export function asStoreUser(user: {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  avatar?: string | null;
  bio?: string | null;
}): StoreUser {
  const store = getStore();
  const existing = store.users.find((u) => u.openId === user.openId);
  if (existing) return existing;

  // Bridge DB user id into store if missing
  const foundById = store.users.find((u) => u.id === user.id);
  if (foundById) return foundById;

  return {
    id: user.id,
    openId: user.openId,
    name: user.name ?? "Mensch",
    handle: `user${user.id}`,
    email: user.email,
    loginMethod: user.loginMethod,
    role: user.role,
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    vibe: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}
