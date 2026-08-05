import { nanoid } from "nanoid";
import type {
  Circle,
  Conversation,
  FeedMode,
  FeedRecipe,
  Gathering,
  Message,
  Moment,
  Post,
  PostKind,
  MiraUser,
  VaultItem,
} from "@shared/mira";
import {
  MIRA_CIRCLES,
  MIRA_CONVERSATIONS,
  MIRA_GATHERINGS,
  MIRA_MESSAGES,
  MIRA_MOMENTS,
  MIRA_POSTS,
  MIRA_RECIPES,
  MIRA_USERS,
  MIRA_VAULT,
} from "@shared/mira-seed";

function clone<T>(v: T): T {
  return structuredClone(v);
}

class MiraStore {
  users: MiraUser[] = clone(MIRA_USERS);
  posts: Post[] = clone(MIRA_POSTS);
  moments: Moment[] = clone(MIRA_MOMENTS);
  circles: Circle[] = clone(MIRA_CIRCLES);
  recipes: FeedRecipe[] = clone(MIRA_RECIPES);
  conversations: Conversation[] = clone(MIRA_CONVERSATIONS);
  messages: Message[] = clone(MIRA_MESSAGES);
  gatherings: Gathering[] = clone(MIRA_GATHERINGS);
  vault: VaultItem[] = clone(MIRA_VAULT);
  activeMode: FeedMode = "nahe";
  activeRecipeId: string | null = "r1";

  me() {
    return this.users.find((u) => u.isYou)!;
  }

  userById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  enrichPost(post: Post) {
    return {
      ...post,
      author: this.userById(post.authorId)!,
      circle: post.circleId
        ? this.circles.find((c) => c.id === post.circleId)
        : undefined,
    };
  }

  getFeed(mode: FeedMode, recipeId?: string | null) {
    const me = this.me();
    let posts = [...this.posts];

    if (mode === "nahe") {
      const village = new Set(me.villageIds);
      posts = posts.filter(
        (p) => village.has(p.authorId) || p.authorId === me.id
      );
      posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (mode === "fokus") {
      const joined = new Set(
        this.circles.filter((c) => c.joined).map((c) => c.id)
      );
      posts = posts.filter((p) => p.circleId && joined.has(p.circleId));
      posts.sort((a, b) => b.resonance - a.resonance);
    } else {
      // drift – interest discovery
      posts = posts.filter(
        (p) => p.kind === "pulse" || p.facet === "public" || p.resonance > 300
      );
      posts.sort((a, b) => b.resonance - a.resonance);
    }

    const recipe = this.recipes.find(
      (r) => r.id === (recipeId ?? this.activeRecipeId) && r.active
    );
    if (recipe && mode !== "nahe") {
      if (recipe.includeTags.length) {
        const boosted = posts.filter((p) =>
          p.tags.some((t) => recipe.includeTags.includes(t))
        );
        const rest = posts.filter(
          (p) => !p.tags.some((t) => recipe.includeTags.includes(t))
        );
        posts = [...boosted, ...rest];
      }
      if (recipe.excludeTags.length) {
        posts = posts.filter(
          (p) => !p.tags.some((t) => recipe.excludeTags.includes(t))
        );
      }
      if (recipe.preferKinds.length) {
        posts.sort((a, b) => {
          const ap = recipe.preferKinds.includes(a.kind) ? 1 : 0;
          const bp = recipe.preferKinds.includes(b.kind) ? 1 : 0;
          return bp - ap;
        });
      }
    }

    return {
      mode,
      recipe: recipe ?? null,
      finite: mode === "nahe",
      posts: posts.map((p) => this.enrichPost(p)),
    };
  }

  createPost(input: {
    kind: PostKind;
    body: string;
    facet?: Post["facet"];
    mediaUrl?: string;
    circleId?: string;
    tags?: string[];
  }) {
    const post: Post = {
      id: nanoid(8),
      authorId: this.me().id,
      kind: input.kind,
      facet: input.facet ?? "personal",
      body: input.body,
      mediaUrl: input.mediaUrl,
      circleId: input.circleId,
      resonance: 0,
      replies: 0,
      echoes: 0,
      saved: false,
      resonated: false,
      createdAt: new Date().toISOString(),
      tags: input.tags ?? [],
    };
    this.posts.unshift(post);
    return this.enrichPost(post);
  }

  toggleResonance(postId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return null;
    post.resonated = !post.resonated;
    post.resonance += post.resonated ? 1 : -1;
    return this.enrichPost(post);
  }

  toggleSave(postId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return null;
    post.saved = !post.saved;
    if (post.saved) {
      this.vault.unshift({
        id: nanoid(8),
        postId,
        collection: "Gespeichert",
        savedAt: new Date().toISOString(),
      });
    } else {
      this.vault = this.vault.filter((v) => v.postId !== postId);
    }
    return this.enrichPost(post);
  }

  toggleCircle(circleId: string) {
    const circle = this.circles.find((c) => c.id === circleId);
    if (!circle) return null;
    circle.joined = !circle.joined;
    circle.memberCount += circle.joined ? 1 : -1;
    return circle;
  }

  setMode(mode: FeedMode) {
    this.activeMode = mode;
    return mode;
  }

  setActiveRecipe(id: string | null) {
    this.recipes.forEach((r) => {
      r.active = r.id === id;
    });
    this.activeRecipeId = id;
    return this.recipes;
  }

  createRecipe(input: Omit<FeedRecipe, "id" | "active">) {
    const recipe: FeedRecipe = {
      ...input,
      id: nanoid(8),
      active: false,
    };
    this.recipes.push(recipe);
    return recipe;
  }

  toggleGathering(id: string) {
    const g = this.gatherings.find((x) => x.id === id);
    if (!g) return null;
    g.going = !g.going;
    g.attendeeCount += g.going ? 1 : -1;
    return g;
  }

  sendMessage(conversationId: string, body: string) {
    const msg: Message = {
      id: nanoid(8),
      conversationId,
      senderId: this.me().id,
      body,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(msg);
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = body;
      conv.updatedAt = msg.createdAt;
      conv.unread = 0;
    }
    return msg;
  }

  markMomentViewed(id: string) {
    const m = this.moments.find((x) => x.id === id);
    if (m) m.viewed = true;
    return m;
  }
}

export const miraStore = new MiraStore();
