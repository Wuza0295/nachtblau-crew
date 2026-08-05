import type {
  AlgorithmWeights,
  Circle,
  Collection,
  FeedPost,
  IntentId,
  LensId,
  NotificationItem,
  Post,
  PostKind,
  Reply,
  SocialProfile,
  Story,
} from "@shared/social";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=900&q=80",
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=900&q=80",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=900&q=80",
];

const DEMO_VIDEOS = [
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=720&q=80",
  "https://images.unsplash.com/photo-1516280440612-4801683d27e0?w=720&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=720&q=80",
  "https://images.unsplash.com/photo-1459749411177-041415906c80?w=720&q=80",
];

function createSeed(): {
  profiles: SocialProfile[];
  posts: Post[];
  replies: Reply[];
  stories: Story[];
  circles: Circle[];
  collections: Collection[];
  notifications: NotificationItem[];
  algorithmByUser: Map<number, AlgorithmWeights>;
  intentByUser: Map<number, IntentId>;
  nextIds: { post: number; reply: number; story: number; collection: number; notification: number };
} {
  const profiles: SocialProfile[] = [
    {
      id: 1,
      handle: "mira",
      name: "Mira Solen",
      bio: "Gestalte Räume, in denen Gespräche atmen können.",
      avatarColor: "#0d9488",
      role: "Design & Community",
      location: "Hamburg",
      following: [2, 3, 5],
      followers: [2, 3, 4, 6],
      interests: ["design", "cities", "slow media"],
      isDemo: true,
    },
    {
      id: 2,
      handle: "jonah",
      name: "Jonah Reed",
      bio: "Kurzvideos ohne Lärm. Sound, Licht, Tempo.",
      avatarColor: "#0369a1",
      role: "Motion Creator",
      location: "Berlin",
      following: [1, 4],
      followers: [1, 3, 5],
      interests: ["film", "music", "night"],
      isDemo: true,
    },
    {
      id: 3,
      handle: "aya",
      name: "Aya Okonkwo",
      bio: "Essays über Arbeit, Würde und digitale Nähe.",
      avatarColor: "#b45309",
      role: "Signal Writer",
      location: "Köln",
      following: [1, 2, 6],
      followers: [1, 2, 4],
      interests: ["work", "culture", "policy"],
      isDemo: true,
    },
    {
      id: 4,
      handle: "leo",
      name: "Leo Hart",
      bio: "Sammle Orte, Rezepte und stille Bilder.",
      avatarColor: "#4f46e5",
      role: "Vault Curator",
      location: "München",
      following: [1, 5],
      followers: [2, 6],
      interests: ["travel", "food", "photo"],
      isDemo: true,
    },
    {
      id: 5,
      handle: "nox",
      name: "Nox Keller",
      bio: "Moderiert Circles. Mag klare Regeln und warme Räume.",
      avatarColor: "#0f766e",
      role: "Circle Host",
      location: "Leipzig",
      following: [1, 2, 3],
      followers: [1, 4],
      interests: ["communities", "games", "ops"],
      isDemo: true,
    },
    {
      id: 6,
      handle: "sena",
      name: "Sena Park",
      bio: "Product thoughts. Weniger Features, mehr Haltung.",
      avatarColor: "#be123c",
      role: "Builder",
      location: "Zürich",
      following: [3, 4],
      followers: [1, 3, 5],
      interests: ["product", "ethics", "tools"],
      isDemo: true,
    },
  ];

  const circles: Circle[] = [
    {
      id: 1,
      slug: "slow-feed",
      name: "Slow Feed",
      description: "Für Menschen, die Social Media bewusst und ruhig nutzen wollen.",
      topic: "Digital Wellness",
      memberCount: 1284,
      memberIds: [1, 3, 5, 6],
      channels: [
        { id: "lounge", name: "Lounge", kind: "chat" },
        { id: "reads", name: "Reads", kind: "posts" },
        { id: "rituals", name: "Rituals", kind: "events" },
      ],
      accent: "#0d9488",
    },
    {
      id: 2,
      slug: "makers-de",
      name: "Makers DE",
      description: "Builder, Designer und Indie-Hacks aus dem DACH-Raum.",
      topic: "Making",
      memberCount: 3421,
      memberIds: [2, 5, 6],
      channels: [
        { id: "ships", name: "Ships", kind: "posts" },
        { id: "help", name: "Help", kind: "chat" },
        { id: "showtime", name: "Showtime", kind: "events" },
      ],
      accent: "#0369a1",
    },
    {
      id: 3,
      slug: "night-frames",
      name: "Night Frames",
      description: "Fotografie und Kurzfilm nach Sonnenuntergang.",
      topic: "Visual Arts",
      memberCount: 892,
      memberIds: [2, 4],
      channels: [
        { id: "gallery", name: "Gallery", kind: "posts" },
        { id: "critique", name: "Critique", kind: "chat" },
      ],
      accent: "#4f46e5",
    },
    {
      id: 4,
      slug: "stadtgespraech",
      name: "Stadtgespräch",
      description: "Lokale Events, Nachbarschaft und urbanes Leben.",
      topic: "Local",
      memberCount: 2103,
      memberIds: [1, 3, 4],
      channels: [
        { id: "heute", name: "Heute", kind: "posts" },
        { id: "treffen", name: "Treffen", kind: "events" },
      ],
      accent: "#b45309",
    },
  ];

  const collections: Collection[] = [
    {
      id: 1,
      authorId: 4,
      title: "Morgenlicht",
      description: "Orte, die beim ersten Licht ruhig werden.",
      coverUrl: DEMO_IMAGES[0],
      postIds: [3, 8],
      isPublic: true,
    },
    {
      id: 2,
      authorId: 1,
      title: "Interface Poetry",
      description: "UI-Momente, die sich wie Prosa lesen.",
      coverUrl: DEMO_IMAGES[7],
      postIds: [6, 11],
      isPublic: true,
    },
    {
      id: 3,
      authorId: 3,
      title: "Arbeitswürde",
      description: "Texte und Bilder rund um gute Arbeit.",
      coverUrl: DEMO_IMAGES[9],
      postIds: [5, 10],
      isPublic: true,
    },
  ];

  const posts: Post[] = [
    {
      id: 1,
      authorId: 1,
      kind: "text",
      lenses: ["pulse"],
      body: "Was wäre, wenn dein Feed morgens fragt: Worauf hast du heute Lust — Entdecken, Verbinden oder Ruhe? Genau das baut Aether mit Session-Intent.",
      mediaUrls: [],
      tags: ["aether", "intent"],
      likeCount: 42,
      replyCount: 2,
      repostCount: 8,
      saveCount: 11,
      likedBy: [2, 3, 5],
      savedBy: [3, 6],
      createdAt: hoursAgo(1),
    },
    {
      id: 2,
      authorId: 2,
      kind: "video",
      lenses: ["motion", "pulse"],
      body: "30 Sekunden Stadtbahn bei Regen. Kein Hook-Zwang — nur Rhythmus.",
      mediaUrls: [DEMO_VIDEOS[0]],
      tags: ["motion", "city"],
      likeCount: 318,
      replyCount: 14,
      repostCount: 41,
      saveCount: 67,
      likedBy: [1, 4, 5],
      savedBy: [1, 4],
      createdAt: hoursAgo(2),
    },
    {
      id: 3,
      authorId: 4,
      kind: "image",
      lenses: ["canvas", "vault"],
      body: "Nebel über dem See. Manchmal reicht ein Bild ohne Caption-Druck.",
      mediaUrls: [DEMO_IMAGES[0]],
      tags: ["photo", "quiet"],
      collectionId: 1,
      likeCount: 156,
      replyCount: 5,
      repostCount: 12,
      saveCount: 89,
      likedBy: [1, 2],
      savedBy: [1, 3, 6],
      createdAt: hoursAgo(3),
    },
    {
      id: 4,
      authorId: 5,
      kind: "text",
      lenses: ["circles", "pulse"],
      circleId: 1,
      body: "Neue Circle-Regel in Slow Feed: Keine Engagement-Bait-Überschriften. Dafür längere Antworten und ein wöchentliches Offline-Ritual.",
      mediaUrls: [],
      tags: ["circles", "rules"],
      likeCount: 73,
      replyCount: 9,
      repostCount: 6,
      saveCount: 22,
      likedBy: [1, 3, 6],
      savedBy: [1],
      createdAt: hoursAgo(4),
    },
    {
      id: 5,
      authorId: 3,
      kind: "article",
      lenses: ["signal"],
      title: "Warum Expertise wieder langsam werden darf",
      body: "LinkedIn hat uns gelehrt, Autorität zu posten. Was fehlt, ist Raum für Unsicherheit. Signal in Aether ist Longform mit Kontext: Quellen, Gegenstimmen, und die Möglichkeit, einen Beitrag in Vault zu sammeln statt nur zu liken.\n\nDrei Thesen:\n1. Reichweite ohne Verantwortung ist Lärm.\n2. Expertise braucht Zeitachsen, nicht nur Hooks.\n3. Communities können Qualität besser schützen als Algorithmen.",
      mediaUrls: [DEMO_IMAGES[9]],
      tags: ["signal", "work", "essay"],
      likeCount: 210,
      replyCount: 28,
      repostCount: 54,
      saveCount: 101,
      likedBy: [1, 2, 6],
      savedBy: [1, 4, 5, 6],
      createdAt: hoursAgo(6),
    },
    {
      id: 6,
      authorId: 6,
      kind: "carousel",
      lenses: ["canvas", "signal"],
      body: "Vier Screens aus einem Intent-Switcher. Weniger Dashboard, mehr Atmosphäre.",
      mediaUrls: [DEMO_IMAGES[7], DEMO_IMAGES[8], DEMO_IMAGES[5], DEMO_IMAGES[2]],
      tags: ["product", "ui"],
      collectionId: 2,
      likeCount: 94,
      replyCount: 7,
      repostCount: 15,
      saveCount: 40,
      likedBy: [1, 3],
      savedBy: [2, 4],
      createdAt: hoursAgo(8),
    },
    {
      id: 7,
      authorId: 2,
      kind: "video",
      lenses: ["motion"],
      body: "Konzertflur, 12 Sekunden. Motion belohnt Präsenz, nicht Perfektion.",
      mediaUrls: [DEMO_VIDEOS[2]],
      tags: ["music", "live"],
      likeCount: 502,
      replyCount: 33,
      repostCount: 88,
      saveCount: 120,
      likedBy: [1, 4, 5, 6],
      savedBy: [1, 3],
      createdAt: hoursAgo(10),
    },
    {
      id: 8,
      authorId: 4,
      kind: "image",
      lenses: ["canvas", "vault"],
      body: "Alpengrat, blaue Stunde. In Vault landet das in „Morgenlicht“.",
      mediaUrls: [DEMO_IMAGES[3]],
      tags: ["landscape"],
      collectionId: 1,
      likeCount: 121,
      replyCount: 3,
      repostCount: 9,
      saveCount: 55,
      likedBy: [1, 5],
      savedBy: [2, 6],
      createdAt: hoursAgo(12),
    },
    {
      id: 9,
      authorId: 1,
      kind: "text",
      lenses: ["pulse", "circles"],
      circleId: 4,
      body: "Stadtgespräch-Idee: Sonntags 11 Uhr — analoges „Feed“ im Park. Handy in der Tasche, Themen auf Zetteln.",
      mediaUrls: [],
      tags: ["local", "event"],
      likeCount: 61,
      replyCount: 11,
      repostCount: 4,
      saveCount: 18,
      likedBy: [3, 4],
      savedBy: [5],
      createdAt: hoursAgo(14),
    },
    {
      id: 10,
      authorId: 3,
      kind: "article",
      lenses: ["signal", "pulse"],
      title: "Custom Feeds sind nicht genug",
      body: "Bluesky zeigt: Menschen wollen Algorithmen wählen. Der nächste Schritt ist, Gewichte zu verstehen — Recency, Relevance, Diversity, Quiet, Social — und sie live zu justieren. Transparent. Teilbar. Widerrufbar.",
      mediaUrls: [],
      tags: ["algorithm", "bluesky"],
      likeCount: 188,
      replyCount: 22,
      repostCount: 47,
      saveCount: 76,
      likedBy: [1, 5, 6],
      savedBy: [1, 2],
      createdAt: hoursAgo(18),
    },
    {
      id: 11,
      authorId: 6,
      kind: "text",
      lenses: ["pulse"],
      body: "Hot take: Die beste Social Feature der 2020er ist nicht AI. Es ist Intentionalität.",
      mediaUrls: [],
      tags: ["hot-take"],
      likeCount: 265,
      replyCount: 41,
      repostCount: 63,
      saveCount: 34,
      likedBy: [1, 2, 3, 4],
      savedBy: [3],
      createdAt: hoursAgo(20),
    },
    {
      id: 12,
      authorId: 5,
      kind: "text",
      lenses: ["circles"],
      circleId: 2,
      body: "Makers DE: Diese Woche Ship-Friday. Zeig, was du gebaut hast — auch wenn es unfertig ist.",
      mediaUrls: [],
      tags: ["makers", "ship"],
      likeCount: 49,
      replyCount: 16,
      repostCount: 5,
      saveCount: 12,
      likedBy: [2, 6],
      savedBy: [6],
      createdAt: daysAgo(1),
    },
    {
      id: 13,
      authorId: 2,
      kind: "video",
      lenses: ["motion", "canvas"],
      body: "Neon-Regen, Loop. Swipe weiter oder bleib — Motion merkt, wenn du verweilst.",
      mediaUrls: [DEMO_VIDEOS[1]],
      tags: ["neon", "loop"],
      likeCount: 411,
      replyCount: 19,
      repostCount: 70,
      saveCount: 93,
      likedBy: [1, 3, 4],
      savedBy: [4, 5],
      createdAt: daysAgo(1),
    },
    {
      id: 14,
      authorId: 4,
      kind: "collection",
      lenses: ["vault"],
      title: "Neue Sammlung: Küstenlinien",
      body: "Alles, was nach Salz und Horizont aussieht.",
      mediaUrls: [DEMO_IMAGES[5]],
      tags: ["vault", "coast"],
      likeCount: 77,
      replyCount: 4,
      repostCount: 8,
      saveCount: 61,
      likedBy: [1],
      savedBy: [1, 3],
      createdAt: daysAgo(2),
    },
    {
      id: 15,
      authorId: 1,
      kind: "image",
      lenses: ["canvas"],
      body: "Tisch, Notizbuch, Tee. Canvas darf auch Alltag sein.",
      mediaUrls: [DEMO_IMAGES[6]],
      tags: ["daily"],
      likeCount: 98,
      replyCount: 6,
      repostCount: 3,
      saveCount: 27,
      likedBy: [2, 4],
      savedBy: [4],
      createdAt: daysAgo(2),
    },
  ];

  const replies: Reply[] = [
    {
      id: 1,
      postId: 1,
      authorId: 3,
      body: "Intent als Einstieg ist genial. Morgens Focus, abends Connect.",
      createdAt: hoursAgo(0.5),
    },
    {
      id: 2,
      postId: 1,
      authorId: 6,
      body: "Bitte macht Intent teilbar — „heute Browse mit Quiet 80%“.",
      createdAt: hoursAgo(0.3),
    },
    {
      id: 3,
      postId: 5,
      authorId: 1,
      body: "Punkt 3. Circles als Qualitätsfilter schlägt jede Blackbox.",
      createdAt: hoursAgo(5),
    },
    {
      id: 4,
      postId: 11,
      authorId: 5,
      body: "Unterschreibe ich. Tools folgen Haltung — nicht umgekehrt.",
      createdAt: hoursAgo(19),
    },
  ];

  const stories: Story[] = [
    {
      id: 1,
      authorId: 1,
      mediaUrl: DEMO_IMAGES[1],
      caption: "Studio-Licht",
      createdAt: hoursAgo(2),
      expiresAt: hoursAgo(-22),
    },
    {
      id: 2,
      authorId: 2,
      mediaUrl: DEMO_VIDEOS[3],
      caption: "Soundcheck",
      createdAt: hoursAgo(1),
      expiresAt: hoursAgo(-23),
    },
    {
      id: 3,
      authorId: 4,
      mediaUrl: DEMO_IMAGES[4],
      caption: "Unterwegs",
      createdAt: hoursAgo(4),
      expiresAt: hoursAgo(-20),
    },
    {
      id: 4,
      authorId: 3,
      mediaUrl: DEMO_IMAGES[8],
      caption: "Draft lesen",
      createdAt: hoursAgo(6),
      expiresAt: hoursAgo(-18),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 1,
      type: "like",
      actorId: 2,
      postId: 1,
      message: "hat deinen Pulse geliked",
      createdAt: hoursAgo(0.4),
      read: false,
    },
    {
      id: 2,
      type: "reply",
      actorId: 3,
      postId: 1,
      message: "hat geantwortet",
      createdAt: hoursAgo(0.5),
      read: false,
    },
    {
      id: 3,
      type: "follow",
      actorId: 6,
      message: "folgt dir jetzt",
      createdAt: hoursAgo(3),
      read: true,
    },
    {
      id: 4,
      type: "circle",
      actorId: 5,
      message: "hat dich nach Slow Feed eingeladen",
      createdAt: hoursAgo(8),
      read: true,
    },
  ];

  const defaultAlgo: AlgorithmWeights = {
    recency: 55,
    relevance: 70,
    diversity: 45,
    quiet: 35,
    social: 60,
  };

  return {
    profiles,
    posts,
    replies,
    stories,
    circles,
    collections,
    notifications,
    algorithmByUser: new Map([[1, { ...defaultAlgo }]]),
    intentByUser: new Map([[1, "browse"]]),
    nextIds: { post: 16, reply: 5, story: 5, collection: 4, notification: 5 },
  };
}

const state = createSeed();

const DEFAULT_ALGO: AlgorithmWeights = {
  recency: 55,
  relevance: 70,
  diversity: 45,
  quiet: 35,
  social: 60,
};

function profileCard(p: SocialProfile) {
  return {
    id: p.id,
    handle: p.handle,
    name: p.name,
    avatarColor: p.avatarColor,
    role: p.role,
  };
}

function scorePost(
  post: Post,
  viewerId: number | null,
  weights: AlgorithmWeights,
  intent: IntentId,
  following: number[]
): number {
  const ageHours = Math.max(0.1, (Date.now() - new Date(post.createdAt).getTime()) / 3600_000);
  const recencyScore = 100 / (1 + ageHours / 6);
  const engagement = post.likeCount * 0.5 + post.replyCount * 1.2 + post.repostCount * 0.8 + post.saveCount * 0.7;
  const relevanceScore = Math.min(100, engagement / 3 + (post.tags.length > 0 ? 15 : 0));
  const isFollowed = viewerId ? following.includes(post.authorId) : false;
  const socialScore = isFollowed ? 90 : 35;
  const quietPenalty =
    post.kind === "video" || post.replyCount > 20 ? weights.quiet * 0.35 : 0;
  const diversityBoost = post.lenses.length > 1 ? weights.diversity * 0.2 : 0;

  let intentMod = 1;
  if (intent === "focus") intentMod = post.kind === "text" || post.kind === "article" ? 1.25 : 0.7;
  if (intent === "connect") intentMod = isFollowed || post.replyCount > 5 ? 1.3 : 0.85;
  if (intent === "create") intentMod = post.kind === "image" || post.kind === "carousel" ? 1.15 : 1;
  if (intent === "browse") intentMod = post.kind === "video" || engagement > 100 ? 1.2 : 1;

  const raw =
    (recencyScore * weights.recency +
      relevanceScore * weights.relevance +
      socialScore * weights.social +
      diversityBoost * 10 -
      quietPenalty) /
    (weights.recency + weights.relevance + weights.social + 1);

  return raw * intentMod;
}

export function listProfiles() {
  return state.profiles;
}

export function getProfile(idOrHandle: number | string) {
  if (typeof idOrHandle === "number") {
    return state.profiles.find((p) => p.id === idOrHandle);
  }
  return state.profiles.find((p) => p.handle === idOrHandle);
}

export function ensureViewerProfile(user: {
  id: number;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
}) {
  let existing = state.profiles.find((p) => p.id === user.id);
  if (existing) return existing;
  const handle =
    (user.name ?? "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || `user${user.id}`;
  existing = {
    id: user.id,
    handle: `${handle}${user.id}`,
    name: user.name ?? "Neues Mitglied",
    bio: user.bio ?? "Frisch angekommen im Spektrum.",
    avatarColor: "#0f766e",
    role: "Member",
    following: [1, 2, 3],
    followers: [],
    interests: ["explore"],
    isDemo: false,
  };
  state.profiles.push(existing);
  state.algorithmByUser.set(user.id, { ...DEFAULT_ALGO });
  state.intentByUser.set(user.id, "browse");
  return existing;
}

export function getStories(viewerId: number | null) {
  const following = viewerId ? getProfile(viewerId)?.following ?? [] : [1, 2, 3, 4];
  return state.stories
    .filter((s) => following.includes(s.authorId) || !viewerId)
    .map((s) => ({
      ...s,
      author: profileCard(getProfile(s.authorId)!),
    }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getFeed(options: {
  lens?: LensId | "all";
  viewerId?: number | null;
  mode?: "for-you" | "following" | "latest";
  intent?: IntentId;
  limit?: number;
}): FeedPost[] {
  const viewerId = options.viewerId ?? null;
  const lens = options.lens ?? "all";
  const mode = options.mode ?? "for-you";
  const intent =
    options.intent ??
    (viewerId ? state.intentByUser.get(viewerId) : undefined) ??
    "browse";
  const weights =
    (viewerId ? state.algorithmByUser.get(viewerId) : undefined) ?? DEFAULT_ALGO;
  const following = viewerId ? getProfile(viewerId)?.following ?? [] : [];

  let posts = [...state.posts];
  if (lens !== "all") {
    posts = posts.filter((p) => p.lenses.includes(lens));
  }
  if (mode === "following" && viewerId) {
    posts = posts.filter((p) => following.includes(p.authorId) || p.authorId === viewerId);
  }

  const scored = posts.map((post) => {
    const author = getProfile(post.authorId)!;
    const score =
      mode === "latest"
        ? +new Date(post.createdAt)
        : scorePost(post, viewerId, weights, intent, following);
    return {
      ...post,
      author: profileCard(author),
      score,
      liked: viewerId ? post.likedBy.includes(viewerId) : false,
      saved: viewerId ? post.savedBy.includes(viewerId) : false,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, options.limit ?? 30);
}

export function getPost(id: number, viewerId: number | null = null): FeedPost | undefined {
  const post = state.posts.find((p) => p.id === id);
  if (!post) return undefined;
  const author = getProfile(post.authorId)!;
  return {
    ...post,
    author: profileCard(author),
    score: 0,
    liked: viewerId ? post.likedBy.includes(viewerId) : false,
    saved: viewerId ? post.savedBy.includes(viewerId) : false,
  };
}

export function getReplies(postId: number) {
  return state.replies
    .filter((r) => r.postId === postId)
    .map((r) => ({
      ...r,
      author: profileCard(getProfile(r.authorId)!),
    }))
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function createPost(input: {
  authorId: number;
  kind: PostKind;
  lenses: LensId[];
  title?: string;
  body: string;
  mediaUrls?: string[];
  tags?: string[];
  circleId?: number;
  collectionId?: number;
}) {
  ensureViewerProfile({ id: input.authorId });
  const post: Post = {
    id: state.nextIds.post++,
    authorId: input.authorId,
    kind: input.kind,
    lenses: input.lenses,
    title: input.title,
    body: input.body,
    mediaUrls: input.mediaUrls ?? [],
    tags: input.tags ?? [],
    circleId: input.circleId,
    collectionId: input.collectionId,
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    saveCount: 0,
    likedBy: [],
    savedBy: [],
    createdAt: new Date().toISOString(),
  };
  state.posts.unshift(post);
  return getPost(post.id, input.authorId)!;
}

export function toggleLike(postId: number, userId: number) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return null;
  const idx = post.likedBy.indexOf(userId);
  if (idx >= 0) {
    post.likedBy.splice(idx, 1);
    post.likeCount = Math.max(0, post.likeCount - 1);
  } else {
    post.likedBy.push(userId);
    post.likeCount += 1;
  }
  return getPost(postId, userId);
}

export function toggleSave(postId: number, userId: number) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return null;
  const idx = post.savedBy.indexOf(userId);
  if (idx >= 0) {
    post.savedBy.splice(idx, 1);
    post.saveCount = Math.max(0, post.saveCount - 1);
  } else {
    post.savedBy.push(userId);
    post.saveCount += 1;
  }
  return getPost(postId, userId);
}

export function addReply(postId: number, authorId: number, body: string) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return null;
  ensureViewerProfile({ id: authorId });
  const reply: Reply = {
    id: state.nextIds.reply++,
    postId,
    authorId,
    body,
    createdAt: new Date().toISOString(),
  };
  state.replies.push(reply);
  post.replyCount += 1;
  return {
    ...reply,
    author: profileCard(getProfile(authorId)!),
  };
}

export function toggleFollow(viewerId: number, targetId: number) {
  const viewer = getProfile(viewerId);
  const target = getProfile(targetId);
  if (!viewer || !target || viewerId === targetId) return null;
  const idx = viewer.following.indexOf(targetId);
  if (idx >= 0) {
    viewer.following.splice(idx, 1);
    target.followers = target.followers.filter((id) => id !== viewerId);
  } else {
    viewer.following.push(targetId);
    if (!target.followers.includes(viewerId)) target.followers.push(viewerId);
  }
  return {
    following: viewer.following.includes(targetId),
    viewerFollowingCount: viewer.following.length,
    targetFollowerCount: target.followers.length,
  };
}

export function listCircles() {
  return state.circles;
}

export function getCircle(slug: string) {
  const circle = state.circles.find((c) => c.slug === slug);
  if (!circle) return undefined;
  const posts = getFeed({ lens: "circles", mode: "latest", limit: 50 }).filter(
    (p) => p.circleId === circle.id
  );
  return { ...circle, posts };
}

export function joinCircle(slug: string, userId: number) {
  const circle = state.circles.find((c) => c.slug === slug);
  if (!circle) return null;
  if (!circle.memberIds.includes(userId)) {
    circle.memberIds.push(userId);
    circle.memberCount += 1;
  }
  return circle;
}

export function listCollections() {
  return state.collections.map((c) => ({
    ...c,
    author: profileCard(getProfile(c.authorId)!),
    itemCount: c.postIds.length,
  }));
}

export function getCollection(id: number) {
  const collection = state.collections.find((c) => c.id === id);
  if (!collection) return undefined;
  return {
    ...collection,
    author: profileCard(getProfile(collection.authorId)!),
    posts: collection.postIds
      .map((pid) => getPost(pid))
      .filter(Boolean),
  };
}

export function getAlgorithm(userId: number | null) {
  if (!userId) return { ...DEFAULT_ALGO };
  return { ...(state.algorithmByUser.get(userId) ?? DEFAULT_ALGO) };
}

export function setAlgorithm(userId: number, weights: AlgorithmWeights) {
  state.algorithmByUser.set(userId, { ...weights });
  return getAlgorithm(userId);
}

export function getIntent(userId: number | null): IntentId {
  if (!userId) return "browse";
  return state.intentByUser.get(userId) ?? "browse";
}

export function setIntent(userId: number, intent: IntentId) {
  state.intentByUser.set(userId, intent);
  return intent;
}

export function getNotifications(userId: number | null) {
  if (!userId) return state.notifications.map((n) => ({
    ...n,
    actor: profileCard(getProfile(n.actorId)!),
  }));
  return state.notifications.map((n) => ({
    ...n,
    actor: profileCard(getProfile(n.actorId)!),
  }));
}

export function getTrendingTags() {
  const counts = new Map<string, number>();
  for (const post of state.posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + post.likeCount + 10);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, score]) => ({ tag, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function getConcept() {
  return {
    workingName: "Aether",
    thesis:
      "Kein weiteres Netzwerk, das alles kopiert — sondern ein Spektrum: dieselben Menschen, unterschiedliche Linsen, und ein Algorithmus, den du siehst und steuerst.",
    borrowed: [
      { from: "X / Bluesky / Threads", take: "Pulse — kurze Gedanken, Threads, Echtzeit" },
      { from: "Instagram", take: "Canvas — visuelle Präsenz, Stories, Carousel" },
      { from: "TikTok / Reels", take: "Motion — vertikale Discovery ohne App-Wechsel" },
      { from: "Discord / Reddit", take: "Circles — Communities mit Channels und Regeln" },
      { from: "LinkedIn", take: "Signal — Longform, Expertise, Kontext" },
      { from: "Pinterest", take: "Vault — Sammlungen statt flüchtiger Likes" },
      { from: "Gobo / Bonsai Research", take: "Transparenter, nutzer-gesteuerter Algorithmus" },
    ],
    unique: [
      "Linsen statt App-Silos — ein Composer, viele Erscheinungsformen",
      "Session-Intent (Browse / Connect / Create / Focus) formt Feed und UI",
      "Algorithmus-Gewichte: Recency, Relevance, Diversity, Quiet, Social",
      "Circles + Vault als Qualitäts- und Gedächtnisschicht",
    ],
  };
}

/** Demo viewer used when browsing without OAuth */
export const DEMO_VIEWER_ID = 1;
