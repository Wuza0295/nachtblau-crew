import type {
  Circle,
  Gathering,
  LensId,
  PostType,
  PostWithMeta,
  ResonanceType,
  SocialPost,
  SocialProfile,
} from "@shared/social";

let nextProfileId = 1;
let nextPostId = 1;
let nextCircleId = 1;
let nextGatheringId = 1;

const profiles = new Map<number, SocialProfile>();
const posts = new Map<number, SocialPost>();
const circles = new Map<number, Circle>();
const gatherings = new Map<number, Gathering>();
const follows = new Set<string>(); // `${followerId}:${followingId}`
const circleMembers = new Set<string>(); // `${userId}:${circleId}`
const resonances = new Map<string, ResonanceType>(); // `${userId}:${postId}`

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

function addProfile(p: Omit<SocialProfile, "id" | "createdAt" | "isDemo"> & { isDemo?: boolean }): SocialProfile {
  const profile: SocialProfile = {
    ...p,
    id: nextProfileId++,
    isDemo: p.isDemo ?? true,
    createdAt: hoursAgo(24 * 30),
  };
  profiles.set(profile.id, profile);
  return profile;
}

function addCircle(c: Omit<Circle, "id">): Circle {
  const circle: Circle = { ...c, id: nextCircleId++ };
  circles.set(circle.id, circle);
  return circle;
}

function addPost(p: Omit<SocialPost, "id" | "sparkCount" | "depthCount" | "echoCount" | "replyCount"> & {
  sparkCount?: number;
  depthCount?: number;
  echoCount?: number;
  replyCount?: number;
}): SocialPost {
  const post: SocialPost = {
    ...p,
    id: nextPostId++,
    sparkCount: p.sparkCount ?? 0,
    depthCount: p.depthCount ?? 0,
    echoCount: p.echoCount ?? 0,
    replyCount: p.replyCount ?? 0,
  };
  posts.set(post.id, post);
  return post;
}

function follow(followerId: number, followingId: number) {
  follows.add(`${followerId}:${followingId}`);
}

function joinCircle(userId: number, circleId: number) {
  circleMembers.add(`${userId}:${circleId}`);
}

function seed() {
  if (profiles.size > 0) return;

  const you = addProfile({
    openId: "demo-you",
    name: "Du",
    handle: "you",
    bio: "Dein Demo-Profil — erforsche LYRA mit allen Lenses.",
    avatar: "Y",
    accent: "#0F6B5C",
    followerCount: 12,
    followingCount: 8,
    isDemo: true,
  });

  const mara = addProfile({
    openId: null,
    name: "Mara Voss",
    handle: "maravoss",
    bio: "Product thinker. Schreibt über Aufmerksamkeit und Stille.",
    avatar: "M",
    accent: "#C45C26",
    followerCount: 4820,
    followingCount: 210,
  });

  const jules = addProfile({
    openId: null,
    name: "Jules Okonkwo",
    handle: "julesok",
    bio: "Foto, Stadt, Licht. Frames statt Filter.",
    avatar: "J",
    accent: "#1B4F72",
    followerCount: 12900,
    followingCount: 340,
  });

  const noor = addProfile({
    openId: null,
    name: "Noor El-Amin",
    handle: "noor",
    bio: "Community steward. Circles > Followerzahlen.",
    avatar: "N",
    accent: "#5B3A29",
    followerCount: 3100,
    followingCount: 890,
  });

  const kai = addProfile({
    openId: null,
    name: "Kai Berg",
    handle: "kaiberg",
    bio: "Musikproduzent. Sucht Resonanz, nicht Virality.",
    avatar: "K",
    accent: "#2D6A4F",
    followerCount: 8700,
    followingCount: 150,
  });

  const elena = addProfile({
    openId: null,
    name: "Elena Ruiz",
    handle: "elenaruiz",
    bio: "Wissenschaftskommunikation. Depth-first.",
    avatar: "E",
    accent: "#7A3E5C",
    followerCount: 22000,
    followingCount: 420,
  });

  const sam = addProfile({
    openId: null,
    name: "Sam Ito",
    handle: "samito",
    bio: "Designer. Weniger Noise, mehr Signal.",
    avatar: "S",
    accent: "#3D5A40",
    followerCount: 5600,
    followingCount: 280,
  });

  const riva = addProfile({
    openId: null,
    name: "Riva Chen",
    handle: "rivachen",
    bio: "Baut Tools für echte Gespräche.",
    avatar: "R",
    accent: "#8B4513",
    followerCount: 9400,
    followingCount: 510,
  });

  const craft = addCircle({
    name: "Craft & Care",
    slug: "craft-care",
    description: "Handwerk, Design und die Kunst, Dinge langsam zu machen.",
    topic: "Maker",
    memberCount: 1840,
    accent: "#0F6B5C",
    isGathering: true,
    gatheringTitle: "Evening Studio — teile dein WIP",
    norms: ["Kritik nur mit Vorschlag", "Fotos vom Prozess willkommen", "Kein Self-Promo ohne Kontext"],
  });

  const quiet = addCircle({
    name: "Quiet Web",
    slug: "quiet-web",
    description: "Gegen den Scroll. Hier zählt Aufmerksamkeit.",
    topic: "Kultur",
    memberCount: 3260,
    accent: "#1B4F72",
    isGathering: false,
    gatheringTitle: null,
    norms: ["Keine Hot Takes", "Quellen teilen", "Zuhören vor Antworten"],
  });

  const cities = addCircle({
    name: "Cities at Dawn",
    slug: "cities-dawn",
    description: "Stadtbilder, Wege, Licht — visuelle Entdeckungen.",
    topic: "Fotografie",
    memberCount: 5120,
    accent: "#C45C26",
    isGathering: true,
    gatheringTitle: "Golden Hour Swap",
    norms: ["Ort nennen wenn möglich", "Keine Stock-Ästhetik", "Respektiere Menschen im Bild"],
  });

  const signal = addCircle({
    name: "Signal Lab",
    slug: "signal-lab",
    description: "Lange Gedanken zu Tech, Ethik und Produkt.",
    topic: "Ideen",
    memberCount: 2780,
    accent: "#5B3A29",
    isGathering: false,
    gatheringTitle: null,
    norms: ["Argumente vor Meinungen", "Links willkommen", "Widerspruch freundlich"],
  });

  const kitchen = addCircle({
    name: "Shared Table",
    slug: "shared-table",
    description: "Kochen, Rezepte, Geschichten am Tisch.",
    topic: "Food",
    memberCount: 4100,
    accent: "#7A3E5C",
    isGathering: false,
    gatheringTitle: null,
    norms: ["Rezepte vollständig", "Allergene markieren", "Gastfreundschaft zuerst"],
  });

  const sound = addCircle({
    name: "Listening Room",
    slug: "listening-room",
    description: "Musik entdecken, Tracks empfehlen, Stille teilen.",
    topic: "Musik",
    memberCount: 6300,
    accent: "#2D6A4F",
    isGathering: true,
    gatheringTitle: "Late Night Listening",
    norms: ["Ein Track, ein Kontext", "Keine Spoiler für Live-Shows", "Genre-Offenheit"],
  });

  [you, mara, jules, noor, kai, elena, sam, riva].forEach((p) => {
    joinCircle(p.id, craft.id);
    joinCircle(p.id, quiet.id);
  });
  joinCircle(jules.id, cities.id);
  joinCircle(you.id, cities.id);
  joinCircle(elena.id, signal.id);
  joinCircle(riva.id, signal.id);
  joinCircle(you.id, signal.id);
  joinCircle(kai.id, sound.id);
  joinCircle(you.id, sound.id);
  joinCircle(noor.id, kitchen.id);

  follow(you.id, mara.id);
  follow(you.id, jules.id);
  follow(you.id, noor.id);
  follow(you.id, kai.id);
  follow(you.id, elena.id);
  follow(mara.id, you.id);
  follow(jules.id, you.id);
  follow(noor.id, mara.id);
  follow(kai.id, jules.id);
  follow(elena.id, mara.id);
  follow(sam.id, riva.id);
  follow(riva.id, elena.id);

  addPost({
    authorId: mara.id,
    type: "signal",
    title: "Warum Resonance besser skaliert als Virality",
    content:
      "Virality misst Reichweite. Resonance misst, ob etwas wirklich ankommt. LYRA trennt beides bewusst: Spark für den Impuls, Depth für die Berührung, Echo für das Weitertragen. Drei Signale statt einer Zahl — und plötzlich wird klar, warum ein ruhiger Text mehr bewegt als ein lauter Clip.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: signal.id,
    parentId: null,
    sparkCount: 128,
    depthCount: 86,
    echoCount: 41,
    replyCount: 12,
    createdAt: hoursAgo(2),
    expiresAt: null,
  });

  addPost({
    authorId: jules.id,
    type: "frame",
    title: null,
    content: "Nebelschicht über dem Hafen. 6:14 Uhr. Kein Filter — nur Licht, das noch unentschieden ist.",
    mediaGradient: "linear-gradient(145deg, #1B4F72 0%, #7BA3B8 42%, #F2E8D5 100%)",
    mediaLabel: "Hafen · Morgendämmerung",
    circleId: cities.id,
    parentId: null,
    sparkCount: 412,
    depthCount: 97,
    echoCount: 63,
    replyCount: 18,
    createdAt: hoursAgo(4),
    expiresAt: null,
  });

  addPost({
    authorId: kai.id,
    type: "pulse",
    title: null,
    content:
      "Heute morgen eine Melodie gefunden, die klingt wie Regen auf Blech. Manchmal reicht ein Takt, um den Tag zu retten.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: sound.id,
    parentId: null,
    sparkCount: 89,
    depthCount: 54,
    echoCount: 22,
    replyCount: 7,
    createdAt: hoursAgo(1),
    expiresAt: null,
  });

  addPost({
    authorId: noor.id,
    type: "pulse",
    title: null,
    content:
      "Mikro-Communities gewinnen, weil Vertrauen schneller wächst als Reichweite. Circles sind keine Gruppen — sie sind geteilte Normen.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: quiet.id,
    parentId: null,
    sparkCount: 201,
    depthCount: 143,
    echoCount: 58,
    replyCount: 24,
    createdAt: hoursAgo(5),
    expiresAt: null,
  });

  addPost({
    authorId: elena.id,
    type: "signal",
    title: "Attention is a renewable resource — if you protect it",
    content:
      "Wir behandeln Aufmerksamkeit wie Öl: fördern, verbrennen, wiederholen. Aber Aufmerksamkeit regeneriert sich — in Pausen, in Spaziergängen, in Gesprächen ohne Timeline. Depth-Lens existiert, damit lange Gedanken wieder Raum haben. Nicht weil sie 'besser' sind, sondern weil manche Ideen Zeit brauchen, um zu klingen.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: signal.id,
    parentId: null,
    sparkCount: 340,
    depthCount: 290,
    echoCount: 112,
    replyCount: 31,
    createdAt: hoursAgo(8),
    expiresAt: null,
  });

  addPost({
    authorId: sam.id,
    type: "frame",
    title: null,
    content: "Skizze für ein Interface, das nicht schreit. Weißraum als Feature.",
    mediaGradient: "linear-gradient(160deg, #E8EFE9 0%, #A8C5B0 45%, #3D5A40 100%)",
    mediaLabel: "UI Sketch · Quiet Mode",
    circleId: craft.id,
    parentId: null,
    sparkCount: 156,
    depthCount: 72,
    echoCount: 29,
    replyCount: 9,
    createdAt: hoursAgo(3),
    expiresAt: null,
  });

  addPost({
    authorId: riva.id,
    type: "pulse",
    title: null,
    content:
      "Hot take: Der öffentliche Feed ist Discovery. Beziehungen leben woanders — in Circles, Gatherings und DMs. LYRA macht das explizit.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: quiet.id,
    parentId: null,
    sparkCount: 267,
    depthCount: 118,
    echoCount: 94,
    replyCount: 41,
    createdAt: hoursAgo(6),
    expiresAt: null,
  });

  addPost({
    authorId: jules.id,
    type: "moment",
    title: null,
    content: "Kaffee. Regen. Fensterbank. Genau jetzt.",
    mediaGradient: "linear-gradient(180deg, #5B3A29 0%, #C4A484 55%, #F5E6D3 100%)",
    mediaLabel: "Moment · 24h",
    circleId: null,
    parentId: null,
    sparkCount: 48,
    depthCount: 31,
    echoCount: 8,
    replyCount: 3,
    createdAt: hoursAgo(0.5),
    expiresAt: hoursFromNow(23.5),
  });

  addPost({
    authorId: mara.id,
    type: "moment",
    title: null,
    content: "Bibliothek, dritte Reihe. Ein Buch, das ich seit Jahren meide — heute öffne ich es.",
    mediaGradient: "linear-gradient(135deg, #2C3E50 0%, #6B8F71 50%, #E8D5B7 100%)",
    mediaLabel: "Moment · 24h",
    circleId: null,
    parentId: null,
    sparkCount: 72,
    depthCount: 55,
    echoCount: 14,
    replyCount: 5,
    createdAt: hoursAgo(1.2),
    expiresAt: hoursFromNow(22.8),
  });

  addPost({
    authorId: kai.id,
    type: "frame",
    title: null,
    content: "Studio-Nacht. Die Waveform sieht aus wie eine Skyline.",
    mediaGradient: "linear-gradient(120deg, #0D1B1E 0%, #2D6A4F 40%, #95D5B2 85%, #F0FFF4 100%)",
    mediaLabel: "Studio · Waveform",
    circleId: sound.id,
    parentId: null,
    sparkCount: 298,
    depthCount: 64,
    echoCount: 47,
    replyCount: 11,
    createdAt: hoursAgo(10),
    expiresAt: null,
  });

  addPost({
    authorId: noor.id,
    type: "signal",
    title: "Gatherings, die wieder verschwinden",
    content:
      "Persistente Gruppen erzeugen Zombie-Communities: Mitgliederlisten ohne Leben. Gatherings in LYRA entstehen, wenn Energie da ist — und lösen sich auf, wenn sie vorbei ist. Ehrliche Stille ist ein Feature.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: quiet.id,
    parentId: null,
    sparkCount: 188,
    depthCount: 211,
    echoCount: 76,
    replyCount: 28,
    createdAt: hoursAgo(12),
    expiresAt: null,
  });

  addPost({
    authorId: elena.id,
    type: "pulse",
    title: null,
    content: "Frage an Depth: Welche Idee hat dich diese Woche am längsten beschäftigt — und warum lässt sie dich nicht los?",
    mediaGradient: null,
    mediaLabel: null,
    circleId: signal.id,
    parentId: null,
    sparkCount: 94,
    depthCount: 167,
    echoCount: 33,
    replyCount: 52,
    createdAt: hoursAgo(7),
    expiresAt: null,
  });

  addPost({
    authorId: sam.id,
    type: "pulse",
    title: null,
    content: "Design-Regel für LYRA: Wenn du den Namen entfernst und die Seite noch wie eine andere App aussieht, ist das Branding zu schwach.",
    mediaGradient: null,
    mediaLabel: null,
    circleId: craft.id,
    parentId: null,
    sparkCount: 143,
    depthCount: 98,
    echoCount: 51,
    replyCount: 14,
    createdAt: hoursAgo(9),
    expiresAt: null,
  });

  addPost({
    authorId: riva.id,
    type: "frame",
    title: null,
    content: "Prototype: Lens-Switcher als physisches Rad. Drehen = andere soziale Welt.",
    mediaGradient: "linear-gradient(200deg, #F4EDE4 0%, #D4A574 35%, #8B4513 70%, #2C1810 100%)",
    mediaLabel: "Hardware Sketch",
    circleId: craft.id,
    parentId: null,
    sparkCount: 221,
    depthCount: 88,
    echoCount: 39,
    replyCount: 16,
    createdAt: hoursAgo(14),
    expiresAt: null,
  });

  // Replies
  const parentSignal = Array.from(posts.values()).find((p) => p.title?.includes("Resonance"));
  if (parentSignal) {
    addPost({
      authorId: riva.id,
      type: "pulse",
      title: null,
      content: "Genau das. Echo als bewusste Amplifikation statt automatischem Share-Zwang — genial.",
      mediaGradient: null,
      mediaLabel: null,
      circleId: signal.id,
      parentId: parentSignal.id,
      sparkCount: 24,
      depthCount: 18,
      echoCount: 3,
      replyCount: 0,
      createdAt: hoursAgo(1.5),
      expiresAt: null,
    });
    addPost({
      authorId: you.id,
      type: "pulse",
      title: null,
      content: "Depth-Reaktion fühlt sich an wie 'ich habe das wirklich gelesen' — endlich.",
      mediaGradient: null,
      mediaLabel: null,
      circleId: signal.id,
      parentId: parentSignal.id,
      sparkCount: 11,
      depthCount: 9,
      echoCount: 1,
      replyCount: 0,
      createdAt: hoursAgo(1),
      expiresAt: null,
    });
  }

  gatherings.set(nextGatheringId, {
    id: nextGatheringId++,
    circleId: craft.id,
    title: "Evening Studio — teile dein WIP",
    participantCount: 34,
    activeUntil: hoursFromNow(2),
    circle: craft,
  });
  gatherings.set(nextGatheringId, {
    id: nextGatheringId++,
    circleId: cities.id,
    title: "Golden Hour Swap",
    participantCount: 58,
    activeUntil: hoursFromNow(1.5),
    circle: cities,
  });
  gatherings.set(nextGatheringId, {
    id: nextGatheringId++,
    circleId: sound.id,
    title: "Late Night Listening",
    participantCount: 91,
    activeUntil: hoursFromNow(4),
    circle: sound,
  });
}

seed();

function getDemoUser(): SocialProfile {
  return Array.from(profiles.values()).find((p) => p.handle === "you")!;
}

function resolveActor(openId?: string | null): SocialProfile {
  if (openId) {
    const existing = Array.from(profiles.values()).find((p) => p.openId === openId);
    if (existing) return existing;
    const created = addProfile({
      openId,
      name: "Neues Mitglied",
      handle: `user${nextProfileId}`,
      bio: "Frisch bei LYRA.",
      avatar: "L",
      accent: "#0F6B5C",
      followerCount: 0,
      followingCount: 0,
      isDemo: false,
    });
    return created;
  }
  return getDemoUser();
}

function isFollowing(followerId: number, followingId: number) {
  return follows.has(`${followerId}:${followingId}`);
}

function enrichPost(post: SocialPost, viewerId: number): PostWithMeta {
  const author = profiles.get(post.authorId)!;
  const circle = post.circleId ? circles.get(post.circleId) ?? null : null;
  const myResonance = resonances.get(`${viewerId}:${post.id}`) ?? null;
  return {
    ...post,
    author,
    circle,
    myResonance,
    isFollowingAuthor: isFollowing(viewerId, post.authorId),
  };
}

function scoreForPulse(post: SocialPost): number {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600_000;
  const resonance = post.sparkCount + post.depthCount * 1.6 + post.echoCount * 2.2;
  return resonance / Math.pow(ageHours + 2, 1.15);
}

function scoreForDepth(post: SocialPost): number {
  return post.depthCount * 2 + post.replyCount * 1.5 + (post.type === "signal" ? 50 : 0);
}

export const socialStore = {
  getDemoUser,
  resolveActor,

  listProfiles(): SocialProfile[] {
    return Array.from(profiles.values());
  },

  getProfile(id: number): SocialProfile | undefined {
    return profiles.get(id);
  },

  getProfileByHandle(handle: string): SocialProfile | undefined {
    return Array.from(profiles.values()).find((p) => p.handle === handle);
  },

  updateProfile(id: number, data: Partial<Pick<SocialProfile, "name" | "bio" | "handle">>) {
    const p = profiles.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...data };
    profiles.set(id, updated);
    return updated;
  },

  listCircles(): Circle[] {
    return Array.from(circles.values()).sort((a, b) => b.memberCount - a.memberCount);
  },

  getCircle(slug: string): Circle | undefined {
    return Array.from(circles.values()).find((c) => c.slug === slug);
  },

  getCircleById(id: number): Circle | undefined {
    return circles.get(id);
  },

  isMember(userId: number, circleId: number) {
    return circleMembers.has(`${userId}:${circleId}`);
  },

  joinCircle(userId: number, circleId: number) {
    const circle = circles.get(circleId);
    if (!circle) return null;
    if (!circleMembers.has(`${userId}:${circleId}`)) {
      circleMembers.add(`${userId}:${circleId}`);
      circle.memberCount += 1;
      circles.set(circleId, circle);
    }
    return circle;
  },

  leaveCircle(userId: number, circleId: number) {
    const circle = circles.get(circleId);
    if (!circle) return null;
    if (circleMembers.has(`${userId}:${circleId}`)) {
      circleMembers.delete(`${userId}:${circleId}`);
      circle.memberCount = Math.max(0, circle.memberCount - 1);
      circles.set(circleId, circle);
    }
    return circle;
  },

  listGatherings(): Gathering[] {
    return Array.from(gatherings.values())
      .filter((g) => new Date(g.activeUntil).getTime() > Date.now())
      .sort((a, b) => b.participantCount - a.participantCount);
  },

  getFeed(lens: LensId, viewerId: number, circleSlug?: string): PostWithMeta[] {
    const rootPosts = Array.from(posts.values()).filter((p) => !p.parentId);
    const now = Date.now();
    const alive = rootPosts.filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now);

    let filtered = alive;
    if (lens === "orbit") {
      filtered = alive.filter(
        (p) => isFollowing(viewerId, p.authorId) || p.authorId === viewerId
      );
    } else if (lens === "circles") {
      if (circleSlug) {
        const circle = this.getCircle(circleSlug);
        filtered = alive.filter((p) => circle && p.circleId === circle.id);
      } else {
        filtered = alive.filter((p) => p.circleId && this.isMember(viewerId, p.circleId));
      }
    } else if (lens === "depth") {
      filtered = alive.filter((p) => p.type === "signal" || p.depthCount > p.sparkCount || p.replyCount > 10);
    } else {
      // pulse — interest discovery: boost frames, moments, high resonance
      filtered = alive;
    }

    const sorted = [...filtered].sort((a, b) => {
      if (lens === "pulse") return scoreForPulse(b) - scoreForPulse(a);
      if (lens === "depth") return scoreForDepth(b) - scoreForDepth(a);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted.map((p) => enrichPost(p, viewerId));
  },

  getMoments(viewerId: number): PostWithMeta[] {
    const now = Date.now();
    return Array.from(posts.values())
      .filter((p) => p.type === "moment" && p.expiresAt && new Date(p.expiresAt).getTime() > now)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => enrichPost(p, viewerId));
  },

  getPost(id: number, viewerId: number): PostWithMeta | undefined {
    const post = posts.get(id);
    if (!post) return undefined;
    return enrichPost(post, viewerId);
  },

  getReplies(postId: number, viewerId: number): PostWithMeta[] {
    return Array.from(posts.values())
      .filter((p) => p.parentId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => enrichPost(p, viewerId));
  },

  getPostsByAuthor(authorId: number, viewerId: number): PostWithMeta[] {
    return Array.from(posts.values())
      .filter((p) => p.authorId === authorId && !p.parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => enrichPost(p, viewerId));
  },

  createPost(input: {
    authorId: number;
    type: PostType;
    content: string;
    title?: string | null;
    circleId?: number | null;
    parentId?: number | null;
    mediaGradient?: string | null;
    mediaLabel?: string | null;
  }): PostWithMeta {
    const gradients = [
      "linear-gradient(145deg, #0F6B5C 0%, #7BC4B0 50%, #F0F7F4 100%)",
      "linear-gradient(160deg, #1B4F72 0%, #A8C5D4 55%, #F5F0E8 100%)",
      "linear-gradient(135deg, #C45C26 0%, #E8B89A 50%, #FFF8F0 100%)",
      "linear-gradient(180deg, #3D5A40 0%, #A8C5B0 60%, #F4F7F2 100%)",
    ];
    const isMoment = input.type === "moment";
    const isFrame = input.type === "frame";
    const post = addPost({
      authorId: input.authorId,
      type: input.type,
      title: input.title ?? null,
      content: input.content,
      mediaGradient:
        input.mediaGradient ??
        (isFrame || isMoment ? gradients[Math.floor(Math.random() * gradients.length)] : null),
      mediaLabel: input.mediaLabel ?? (isMoment ? "Moment · 24h" : isFrame ? "Frame" : null),
      circleId: input.circleId ?? null,
      parentId: input.parentId ?? null,
      createdAt: new Date().toISOString(),
      expiresAt: isMoment ? hoursFromNow(24) : null,
    });

    if (input.parentId) {
      const parent = posts.get(input.parentId);
      if (parent) {
        parent.replyCount += 1;
        posts.set(parent.id, parent);
      }
    }

    return enrichPost(post, input.authorId);
  },

  setResonance(userId: number, postId: number, type: ResonanceType | null) {
    const post = posts.get(postId);
    if (!post) return null;
    const key = `${userId}:${postId}`;
    const prev = resonances.get(key);

    if (prev) {
      if (prev === "spark") post.sparkCount = Math.max(0, post.sparkCount - 1);
      if (prev === "depth") post.depthCount = Math.max(0, post.depthCount - 1);
      if (prev === "echo") post.echoCount = Math.max(0, post.echoCount - 1);
      resonances.delete(key);
    }

    if (type && type !== prev) {
      resonances.set(key, type);
      if (type === "spark") post.sparkCount += 1;
      if (type === "depth") post.depthCount += 1;
      if (type === "echo") post.echoCount += 1;
    }

    posts.set(postId, post);
    return enrichPost(post, userId);
  },

  toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) return { following: false };
    const key = `${followerId}:${followingId}`;
    const follower = profiles.get(followerId);
    const following = profiles.get(followingId);
    if (!follower || !following) return { following: false };

    if (follows.has(key)) {
      follows.delete(key);
      follower.followingCount = Math.max(0, follower.followingCount - 1);
      following.followerCount = Math.max(0, following.followerCount - 1);
      profiles.set(followerId, follower);
      profiles.set(followingId, following);
      return { following: false };
    }

    follows.add(key);
    follower.followingCount += 1;
    following.followerCount += 1;
    profiles.set(followerId, follower);
    profiles.set(followingId, following);
    return { following: true };
  },

  getStats() {
    return {
      profiles: profiles.size,
      posts: Array.from(posts.values()).filter((p) => !p.parentId).length,
      circles: circles.size,
      gatherings: this.listGatherings().length,
    };
  },

  isFollowingUser(followerId: number, followingId: number) {
    return isFollowing(followerId, followingId);
  },
};
