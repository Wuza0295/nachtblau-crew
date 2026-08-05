import {
  CircleItem,
  CollectiveItem,
  ConversationItem,
  LENSES,
  LensId,
  MessageItem,
  MomentItem,
  PostItem,
  ReplyItem,
  SocialProfile,
} from "@shared/social";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

export const profiles: SocialProfile[] = [
  {
    id: "u1",
    handle: "mira.k",
    displayName: "Mira Keller",
    bio: "Produkt-Designerin. Baue Interfaces, die atmen. Coffee > meetings.",
    avatarColor: "#e85d4c",
    avatarInitials: "MK",
    location: "Berlin",
    joinedAt: "2024-03-12",
    following: 214,
    followers: 1890,
    interests: ["design", "cities", "film"],
    isVerified: true,
  },
  {
    id: "u2",
    handle: "jonah.codes",
    displayName: "Jonah Reeve",
    bio: "Open Source & Indie-Tools. Feed-Algorithmen sollten erklärbar sein.",
    avatarColor: "#2a9d8f",
    avatarInitials: "JR",
    location: "Hamburg",
    joinedAt: "2023-11-02",
    following: 412,
    followers: 3201,
    interests: ["tech", "privacy", "music"],
    isVerified: true,
  },
  {
    id: "u3",
    handle: "lena.notes",
    displayName: "Lena Vogt",
    bio: "Schreibt Essays über Städte, Stille und zweite Chancen.",
    avatarColor: "#c45c26",
    avatarInitials: "LV",
    location: "Wien",
    joinedAt: "2024-01-20",
    following: 98,
    followers: 742,
    interests: ["writing", "cities", "photo"],
  },
  {
    id: "u4",
    handle: "sam.orbit",
    displayName: "Sam Okonkwo",
    bio: "Community Builder. Circles > Follower-Zahlen.",
    avatarColor: "#3d5a80",
    avatarInitials: "SO",
    location: "Köln",
    joinedAt: "2024-06-08",
    following: 530,
    followers: 2104,
    interests: ["community", "sports", "food"],
  },
  {
    id: "u5",
    handle: "aya.lens",
    displayName: "Aya Tanaka",
    bio: "Fotografin. Moments ohne Filter-Theater.",
    avatarColor: "#7b5ea7",
    avatarInitials: "AT",
    location: "München",
    joinedAt: "2025-02-14",
    following: 176,
    followers: 980,
    interests: ["photo", "travel", "film"],
  },
  {
    id: "u6",
    handle: "theo.spark",
    displayName: "Theo Martens",
    bio: "Kurzform-Storyteller. Sparks die hängen bleiben.",
    avatarColor: "#d97706",
    avatarInitials: "TM",
    location: "Amsterdam",
    joinedAt: "2024-09-01",
    following: 320,
    followers: 5400,
    interests: ["film", "comedy", "music"],
    isVerified: true,
  },
  {
    id: "u7",
    handle: "nora.lab",
    displayName: "Nora Weiss",
    bio: "Forscherin zu Attention & Wohlbefinden online.",
    avatarColor: "#0f766e",
    avatarInitials: "NW",
    location: "Zürich",
    joinedAt: "2023-08-19",
    following: 145,
    followers: 4102,
    interests: ["science", "health", "tech"],
    isVerified: true,
  },
  {
    id: "me",
    handle: "you",
    displayName: "Du",
    bio: "Willkommen bei Lumen. Stell deine Lenses ein und tritt Circles bei.",
    avatarColor: "#1a1f1c",
    avatarInitials: "DU",
    location: "Hier",
    joinedAt: new Date().toISOString().slice(0, 10),
    following: 12,
    followers: 3,
    interests: ["design", "tech", "cities"],
  },
];

export const followingIds = new Set(["u1", "u2", "u3", "u4", "u5", "u7"]);

export const moments: MomentItem[] = [
  {
    id: "m1",
    authorId: "u5",
    mediaGradient: "linear-gradient(145deg,#f6d365 0%,#fda085 100%)",
    caption: "Morgenlicht im Atelier — kein Setup, nur Fenster.",
    prompt: "Was siehst du gerade?",
    expiresAt: hoursFromNow(18),
    viewed: false,
  },
  {
    id: "m2",
    authorId: "u1",
    mediaGradient: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)",
    caption: "Wireframes auf dem Café-Tisch. Heute: weniger Features.",
    expiresAt: hoursFromNow(14),
    viewed: false,
  },
  {
    id: "m3",
    authorId: "u4",
    mediaGradient: "linear-gradient(150deg,#89f7fe 0%,#66a6ff 100%)",
    caption: "Circle-Hangout offline. Laptops zu, Stimmen an.",
    expiresAt: hoursFromNow(9),
    viewed: true,
  },
  {
    id: "m4",
    authorId: "u6",
    mediaGradient: "linear-gradient(135deg,#ff9a9e 0%,#fecfef 99%)",
    caption: "30 Sekunden Straßenmusik. Kein Cut.",
    prompt: "Dein ungestellter Moment",
    expiresAt: hoursFromNow(20),
    viewed: false,
  },
  {
    id: "m5",
    authorId: "u3",
    mediaGradient: "linear-gradient(145deg,#cfd9df 0%,#e2ebf0 100%)",
    caption: "Regen auf dem Dachfenster. Essay-Entwurf Seite 2.",
    expiresAt: hoursFromNow(6),
    viewed: false,
  },
];

let posts: PostItem[] = [
  {
    id: "p1",
    authorId: "u2",
    kind: "depth",
    title: "Warum „For You“ dich nicht kennt",
    body: "Engagement-Algorithmen optimieren auf Verweildauer — nicht auf Absicht. Wenn du morgens Nachrichten willst und abends Freunde, braucht der Feed zwei Lenses, nicht eine Blackbox.\n\nLumen macht die Gewichte sichtbar: Frische, Nähe, Signal, Exploration. Du stellst sie ein. Du siehst, warum ein Post erscheint.",
    topics: ["tech", "privacy", "product"],
    createdAt: hoursAgo(2),
    signal: 94,
    replies: 28,
    echoes: 41,
    saves: 67,
  },
  {
    id: "p2",
    authorId: "u1",
    kind: "thought",
    body: "Kleine Regel für bessere Produkte: Wenn du eine Badge brauchst, um den Nutzen zu erklären, ist der Nutzen noch nicht klar genug.",
    topics: ["design"],
    createdAt: hoursAgo(3),
    signal: 71,
    replies: 12,
    echoes: 19,
    saves: 34,
  },
  {
    id: "p3",
    authorId: "u7",
    kind: "depth",
    title: "Signal statt Likes",
    body: "Wir haben gemessen: Posts mit hoher Antwort-Qualität korrelieren mit besserem Wohlbefinden — Vanity-Likes nicht. Deshalb gewichtet Signal Antworten und Saves stärker als schnelle Hearts.\n\nRagebait verliert. Dialog gewinnt.",
    topics: ["science", "health", "tech"],
    createdAt: hoursAgo(5),
    signal: 112,
    replies: 45,
    echoes: 88,
    saves: 120,
  },
  {
    id: "p4",
    authorId: "u3",
    kind: "thought",
    body: "Städte brauchen dritte Orte — nicht nur Cafés, sondern digitale, in denen man nicht performen muss. Circles sind das Gegenteil von Follower-Bühnen.",
    topics: ["cities", "community"],
    createdAt: hoursAgo(7),
    signal: 58,
    replies: 9,
    echoes: 14,
    saves: 22,
    circleId: "c1",
  },
  {
    id: "p5",
    authorId: "u6",
    kind: "spark",
    body: "Wenn dein Feed dich gestresster macht als der Tag davor — wechsle die Lens. Chrono heilt mehr als man denkt.",
    mediaGradient: "linear-gradient(120deg,#f093fb 0%,#f5576c 100%)",
    mediaLabel: "Spark · 0:24",
    topics: ["film", "health"],
    createdAt: hoursAgo(4),
    signal: 63,
    replies: 7,
    echoes: 52,
    saves: 18,
  },
  {
    id: "p6",
    authorId: "u4",
    kind: "thought",
    body: "Heute 40 Leute im Circle „Nachbarschaft“. Offline-Treffen organisiert in 12 Minuten. Discord-Energie, aber ohne 47 ungelesene Channels.",
    topics: ["community"],
    createdAt: hoursAgo(1),
    signal: 49,
    replies: 15,
    echoes: 8,
    saves: 11,
    circleId: "c2",
  },
  {
    id: "p7",
    authorId: "u5",
    kind: "media",
    body: "Goldene Stunde am Isar-Ufer. Kein Filter — nur Wartezeit.",
    mediaGradient: "linear-gradient(160deg,#fa709a 0%,#fee140 100%)",
    mediaLabel: "Foto",
    topics: ["photo", "travel"],
    createdAt: hoursAgo(8),
    signal: 77,
    replies: 6,
    echoes: 23,
    saves: 41,
  },
  {
    id: "p8",
    authorId: "u7",
    kind: "thought",
    body: "Hot take: Chronologische Feeds sind nicht „alt“ — sie sind ehrlich. Algorithmen sind Werkzeuge. Werkzeuge gehören in die Hand der Nutzer.",
    topics: ["tech"],
    createdAt: hoursAgo(10),
    signal: 88,
    replies: 33,
    echoes: 61,
    saves: 54,
    collectiveId: "col1",
  },
  {
    id: "p9",
    authorId: "u1",
    kind: "depth",
    title: "Design für Aufmerksamkeit ohne Manipulation",
    body: "Dark Patterns verkaufen Klicks. Lumen verkauft Klarheit: ein Compose, eine Absicht, eine Audience.\n\nMoments verschwinden. Depth bleibt. Sparks entdecken. Circles halten.",
    topics: ["design", "product"],
    createdAt: hoursAgo(12),
    signal: 81,
    replies: 19,
    echoes: 27,
    saves: 48,
  },
  {
    id: "p10",
    authorId: "u3",
    kind: "thought",
    body: "Essay-Snippet: „Wir haben das Internet gebaut, um uns nah zu sein — und dann Algorithmen, die uns auseinanderreißen, weil Streit länger hält.“",
    topics: ["writing"],
    createdAt: hoursAgo(14),
    signal: 66,
    replies: 11,
    echoes: 30,
    saves: 39,
    collectiveId: "col2",
  },
  {
    id: "p11",
    authorId: "u6",
    kind: "spark",
    body: "Unpopular: Trending Sounds machen alles gleich. Sparks hier ranken nach Originalität + Signal, nicht nach Audio-ID.",
    mediaGradient: "linear-gradient(120deg,#4facfe 0%,#00f2fe 100%)",
    mediaLabel: "Spark · 0:41",
    topics: ["music", "film"],
    createdAt: hoursAgo(6),
    signal: 55,
    replies: 4,
    echoes: 38,
    saves: 12,
  },
  {
    id: "p12",
    authorId: "u2",
    kind: "thought",
    body: "Custom Feeds ohne Erklärbarkeit sind nur Marketing. Zeig mir die Gewichte — oder es ist keine Kontrolle.",
    topics: ["tech", "privacy"],
    createdAt: hoursAgo(0.5),
    signal: 44,
    replies: 5,
    echoes: 9,
    saves: 16,
  },
];

let replies: ReplyItem[] = [
  {
    id: "r1",
    postId: "p1",
    authorId: "u7",
    body: "Genau das. Intent fidelity > engagement fidelity.",
    createdAt: hoursAgo(1.5),
    signal: 22,
  },
  {
    id: "r2",
    postId: "p1",
    authorId: "u1",
    body: "Würde ich als Produktprinzip rahmen: „Der Feed ist ein Dokument, das du autorisierst.“",
    createdAt: hoursAgo(1.2),
    signal: 18,
  },
  {
    id: "r3",
    postId: "p3",
    authorId: "u2",
    body: "Bitte als Default für alle neuen Accounts. Vanity-Metriken optional freischalten.",
    createdAt: hoursAgo(4),
    signal: 31,
  },
  {
    id: "r4",
    postId: "p6",
    authorId: "u5",
    body: "Welches Viertel? Klingt nach genau dem Format, das ich suche.",
    createdAt: hoursAgo(0.8),
    signal: 8,
  },
];

export const circles: CircleItem[] = [
  {
    id: "c1",
    name: "Stadt & Stille",
    slug: "stadt-stille",
    description: "Essays, Spaziergänge, dritte Orte. Weniger Hot Takes, mehr Beobachtung.",
    memberCount: 1284,
    accent: "#c45c26",
    coverGradient: "linear-gradient(135deg,#f3e7e9 0%,#e3eeff 100%)",
    isJoined: true,
    tags: ["cities", "writing"],
    rooms: [
      { id: "cr1", name: "Lounge", kind: "chat", unread: 3 },
      { id: "cr2", name: "Spaziergänge", kind: "board" },
      { id: "cr3", name: "Stimme", kind: "voice" },
    ],
  },
  {
    id: "c2",
    name: "Nachbarschaft Nord",
    slug: "nachbarschaft-nord",
    description: "Lokale Hilfe, Flohmarkt, gemeinsame Abende. Discord-Energie, klare Räume.",
    memberCount: 412,
    accent: "#3d5a80",
    coverGradient: "linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 100%)",
    isJoined: true,
    tags: ["community", "local"],
    rooms: [
      { id: "cr4", name: "Allgemein", kind: "chat", unread: 12 },
      { id: "cr5", name: "Events", kind: "board" },
      { id: "cr6", name: "Hilferufe", kind: "chat", unread: 1 },
    ],
  },
  {
    id: "c3",
    name: "Lens Lab",
    slug: "lens-lab",
    description: "Experimente mit Feed-Gewichten, Ranking-Transparenz und Anti-Ragebait.",
    memberCount: 2901,
    accent: "#2a9d8f",
    coverGradient: "linear-gradient(135deg,#d4fc79 0%,#96e6a1 100%)",
    isJoined: false,
    tags: ["tech", "product"],
    rooms: [
      { id: "cr7", name: "Experiments", kind: "chat" },
      { id: "cr8", name: "Papers", kind: "board" },
    ],
  },
  {
    id: "c4",
    name: "Frame & Film",
    slug: "frame-film",
    description: "Fotografie, kurze Clips, Kritik ohne Algorithmus-Druck.",
    memberCount: 876,
    accent: "#e85d4c",
    coverGradient: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)",
    isJoined: false,
    tags: ["photo", "film"],
    rooms: [
      { id: "cr9", name: "Critique", kind: "board" },
      { id: "cr10", name: "Sparks", kind: "chat" },
    ],
  },
];

export const collectives: CollectiveItem[] = [
  {
    id: "col1",
    name: "Feed Futures",
    slug: "feed-futures",
    description: "Wie sollten Empfehlungssysteme aussehen, wenn Nutzer sie besitzen?",
    members: 15400,
    postsToday: 128,
    accent: "#0f766e",
    isJoined: true,
  },
  {
    id: "col2",
    name: "Lange Texte",
    slug: "lange-texte",
    description: "Depth-Posts, Essays, Serials. Qualität vor Virality.",
    members: 8200,
    postsToday: 64,
    accent: "#c45c26",
    isJoined: true,
  },
  {
    id: "col3",
    name: "Lokalleben",
    slug: "lokalleben",
    description: "Stadtteile, Nachbarschaft, Offline-Treffen organisieren.",
    members: 5100,
    postsToday: 91,
    accent: "#3d5a80",
    isJoined: false,
  },
  {
    id: "col4",
    name: "Bild & Licht",
    slug: "bild-licht",
    description: "Fotografie und visuelle Kultur — ohne Filter-Wettbewerb.",
    members: 11200,
    postsToday: 210,
    accent: "#e85d4c",
    isJoined: false,
  },
];

export const conversations: ConversationItem[] = [
  {
    id: "cv1",
    participantIds: ["me", "u1"],
    lastMessage: "Schickst du die Lens-Skizze noch?",
    updatedAt: hoursAgo(0.4),
    unread: 2,
  },
  {
    id: "cv2",
    participantIds: ["me", "u4"],
    lastMessage: "Samstag 18 Uhr im Park — bring Decken mit.",
    updatedAt: hoursAgo(3),
    unread: 0,
  },
  {
    id: "cv3",
    participantIds: ["me", "u2"],
    lastMessage: "Der Signal-Score-PR ist ready zum Review.",
    updatedAt: hoursAgo(26),
    unread: 0,
  },
];

let messages: MessageItem[] = [
  {
    id: "msg1",
    conversationId: "cv1",
    authorId: "u1",
    body: "Hey! Die Focus-Lens fühlt sich schon richtig an.",
    createdAt: hoursAgo(2),
  },
  {
    id: "msg2",
    conversationId: "cv1",
    authorId: "u1",
    body: "Schickst du die Lens-Skizze noch?",
    createdAt: hoursAgo(0.4),
  },
  {
    id: "msg3",
    conversationId: "cv2",
    authorId: "u4",
    body: "Samstag 18 Uhr im Park — bring Decken mit.",
    createdAt: hoursAgo(3),
  },
  {
    id: "msg4",
    conversationId: "cv3",
    authorId: "u2",
    body: "Der Signal-Score-PR ist ready zum Review.",
    createdAt: hoursAgo(26),
  },
];

export const savedPostIds = new Set<string>(["p1", "p3"]);
export const echoedPostIds = new Set<string>(["p2"]);
let activeLens: LensId = "signal";

function profileMap() {
  return new Map(profiles.map((p) => [p.id, p]));
}

function scorePost(post: PostItem, lens: LensId, now = Date.now()) {
  const meta = LENSES.find((l) => l.id === lens)!;
  const ageH = Math.max(0.1, (now - new Date(post.createdAt).getTime()) / 3600_000);
  const freshness = Math.exp(-ageH / 10);
  const affinity =
    post.authorId === "me" ? 1.4 : followingIds.has(post.authorId) ? 1 : 0.25;
  const signalNorm = Math.min(1, post.signal / 100);
  const exploration =
    followingIds.has(post.authorId) || post.authorId === "me" ? 0.2 : 1;
  const kindBoost =
    lens === "focus" && (post.kind === "depth" || post.kind === "thought")
      ? 1.25
      : lens === "discover" && (post.kind === "spark" || !followingIds.has(post.authorId))
        ? 1.3
        : 1;
  // Fresh own posts surface near the top so composers see immediate feedback
  const ownBoost = post.authorId === "me" && ageH < 2 ? 1.8 : 1;

  const raw =
    meta.weights.freshness * freshness +
    meta.weights.affinity * affinity +
    meta.weights.signal * signalNorm +
    meta.weights.exploration * exploration;

  return raw * kindBoost * ownBoost;
}

function reasonsFor(post: PostItem, lens: LensId): string[] {
  const reasons: string[] = [];
  if (post.authorId === "me") reasons.push("Dein eigener Beitrag");
  else if (followingIds.has(post.authorId)) reasons.push("Du folgst dem Autor");
  else reasons.push("Entdeckung außerhalb deines Graphs");

  if (lens === "signal") reasons.push(`Hohes Signal (${post.signal})`);
  if (lens === "chrono") reasons.push("Chronologische Reihenfolge");
  if (lens === "discover") reasons.push("Interessens-Overlap: " + post.topics.slice(0, 2).join(", "));
  if (lens === "focus" && post.kind === "depth") reasons.push("Depth-Beitrag für Focus-Lens");
  if (post.saves > 30) reasons.push("Oft gespeichert");
  if (post.replies > 15) reasons.push("Starke Konversation");
  return reasons;
}

export function getFeed(lens: LensId) {
  activeLens = lens;
  const now = Date.now();
  const ranked = [...posts]
    .map((p) => ({
      post: p,
      score: lens === "chrono" ? -new Date(p.createdAt).getTime() : -scorePost(p, lens, now),
    }))
    .sort((a, b) => a.score - b.score)
    .map(({ post }) => ({
      ...post,
      reasons: reasonsFor(post, lens),
    }));

  if (lens === "chrono") {
    return ranked.filter((p) => p.authorId === "me" || followingIds.has(p.authorId));
  }
  if (lens === "focus") {
    return ranked.filter((p) => p.kind === "depth" || p.kind === "thought");
  }
  return ranked;
}

export function getPost(id: string) {
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  return { ...post, reasons: reasonsFor(post, activeLens) };
}

export function getReplies(postId: string) {
  return replies
    .filter((r) => r.postId === postId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function getProfile(id: string) {
  return profiles.find((p) => p.id === id) ?? null;
}

export function getProfileByHandle(handle: string) {
  return profiles.find((p) => p.handle === handle) ?? null;
}

export function hydrateAuthor<T extends { authorId: string }>(item: T) {
  const author = profileMap().get(item.authorId);
  return { ...item, author: author! };
}

export function getMoments() {
  return moments
    .filter((m) => +new Date(m.expiresAt) > Date.now())
    .map(hydrateAuthor);
}

export function getSparks() {
  return posts
    .filter((p) => p.kind === "spark")
    .sort((a, b) => b.signal - a.signal)
    .map(hydrateAuthor);
}

export function getCircles() {
  return circles;
}

export function getCircle(slug: string) {
  return circles.find((c) => c.slug === slug) ?? null;
}

export function getCollectives() {
  return collectives;
}

export function getCollective(slug: string) {
  return collectives.find((c) => c.slug === slug) ?? null;
}

export function getCollectivePosts(collectiveId: string) {
  return posts
    .filter((p) => p.collectiveId === collectiveId)
    .sort((a, b) => b.signal - a.signal)
    .map(hydrateAuthor);
}

export function getCirclePosts(circleId: string) {
  return posts
    .filter((p) => p.circleId === circleId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map(hydrateAuthor);
}

export function getConversations() {
  return conversations.map((c) => {
    const otherId = c.participantIds.find((id) => id !== "me")!;
    return { ...c, other: profileMap().get(otherId)! };
  });
}

export function getMessages(conversationId: string) {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map(hydrateAuthor);
}

export function getTrendingTopics() {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.topics) counts.set(t, (counts.get(t) ?? 0) + p.signal);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, heat]) => ({ topic, heat }));
}

export function createPost(input: {
  body: string;
  kind: PostItem["kind"];
  title?: string;
  topics?: string[];
  circleId?: string;
  collectiveId?: string;
}) {
  const post: PostItem = {
    id: `p${Date.now()}`,
    authorId: "me",
    kind: input.kind,
    body: input.body,
    title: input.title,
    topics: input.topics ?? [],
    createdAt: new Date().toISOString(),
    signal: 1,
    replies: 0,
    echoes: 0,
    saves: 0,
    circleId: input.circleId,
    collectiveId: input.collectiveId,
  };
  posts = [post, ...posts];
  return hydrateAuthor(post);
}

export function addReply(postId: string, body: string) {
  const reply: ReplyItem = {
    id: `r${Date.now()}`,
    postId,
    authorId: "me",
    body,
    createdAt: new Date().toISOString(),
    signal: 1,
  };
  replies = [...replies, reply];
  posts = posts.map((p) =>
    p.id === postId ? { ...p, replies: p.replies + 1, signal: p.signal + 2 } : p
  );
  return hydrateAuthor(reply);
}

export function toggleSave(postId: string) {
  if (savedPostIds.has(postId)) {
    savedPostIds.delete(postId);
    posts = posts.map((p) =>
      p.id === postId ? { ...p, saves: Math.max(0, p.saves - 1) } : p
    );
    return { saved: false };
  }
  savedPostIds.add(postId);
  posts = posts.map((p) => (p.id === postId ? { ...p, saves: p.saves + 1, signal: p.signal + 3 } : p));
  return { saved: true };
}

export function toggleEcho(postId: string) {
  if (echoedPostIds.has(postId)) {
    echoedPostIds.delete(postId);
    posts = posts.map((p) =>
      p.id === postId ? { ...p, echoes: Math.max(0, p.echoes - 1) } : p
    );
    return { echoed: false };
  }
  echoedPostIds.add(postId);
  posts = posts.map((p) =>
    p.id === postId ? { ...p, echoes: p.echoes + 1, signal: p.signal + 1 } : p
  );
  return { echoed: true };
}

export function toggleFollow(userId: string) {
  if (followingIds.has(userId)) {
    followingIds.delete(userId);
    return { following: false };
  }
  followingIds.add(userId);
  return { following: true };
}

export function isFollowing(userId: string) {
  return followingIds.has(userId);
}

export function isSaved(postId: string) {
  return savedPostIds.has(postId);
}

export function isEchoed(postId: string) {
  return echoedPostIds.has(postId);
}

export function joinCircle(id: string) {
  const c = circles.find((x) => x.id === id);
  if (!c) return null;
  c.isJoined = true;
  c.memberCount += 1;
  return c;
}

export function joinCollective(id: string) {
  const c = collectives.find((x) => x.id === id);
  if (!c) return null;
  c.isJoined = true;
  c.members += 1;
  return c;
}

export function sendMessage(conversationId: string, body: string) {
  const msg: MessageItem = {
    id: `msg${Date.now()}`,
    conversationId,
    authorId: "me",
    body,
    createdAt: new Date().toISOString(),
  };
  messages = [...messages, msg];
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = body;
    conv.updatedAt = msg.createdAt;
  }
  return hydrateAuthor(msg);
}

export function markMomentViewed(id: string) {
  const m = moments.find((x) => x.id === id);
  if (m) m.viewed = true;
  return m;
}

export function getExplore() {
  return {
    people: profiles.filter((p) => p.id !== "me" && !followingIds.has(p.id)),
    topics: getTrendingTopics(),
    circles: circles.filter((c) => !c.isJoined),
    collectives: collectives.filter((c) => !c.isJoined),
    sparks: getSparks().slice(0, 6),
  };
}

export function getMe() {
  return profiles.find((p) => p.id === "me")!;
}

export function getProfilePosts(userId: string) {
  return posts
    .filter((p) => p.authorId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map(hydrateAuthor);
}

export { LENSES };
