import type {
  Circle,
  Collection,
  Conversation,
  DirectMessage,
  Moment,
  SocialPost,
  SocialUser,
} from "@shared/social";
import { resonanceScore } from "@shared/social";
import type { MoodId } from "@shared/site";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const hoursFrom = (h: number) => new Date(now + h * 3600_000).toISOString();

export const socialUsers: SocialUser[] = [
  {
    id: 1,
    handle: "mira",
    name: "Mira Sol",
    bio: "Designerin · sammelt Stille und gute Typografie",
    avatarGradient: "linear-gradient(135deg,#0d9488,#134e4a)",
    mood: "nah",
    followers: 12840,
    following: 312,
    verified: true,
    focus: "Produkt & Kultur",
  },
  {
    id: 2,
    handle: "jonas",
    name: "Jonas Kehl",
    bio: "Baut Tools für Menschen, nicht für Metriken",
    avatarGradient: "linear-gradient(135deg,#1e3a5f,#0ea5e9)",
    mood: "fokus",
    followers: 8920,
    following: 190,
    verified: true,
    focus: "Technik & Ethik",
  },
  {
    id: 3,
    handle: "aya",
    name: "Aya Nouri",
    bio: "Fotografiert Licht, das man nicht speichern kann",
    avatarGradient: "linear-gradient(135deg,#b45309,#78350f)",
    mood: "entdecken",
    followers: 45200,
    following: 88,
    focus: "Visuelle Kultur",
  },
  {
    id: 4,
    handle: "leo",
    name: "Leo Brandt",
    bio: "Community-Architekt. Weniger Scrollen, mehr Räume.",
    avatarGradient: "linear-gradient(135deg,#365314,#84cc16)",
    mood: "kreise",
    followers: 6100,
    following: 540,
    focus: "Communities",
  },
  {
    id: 5,
    handle: "nova",
    name: "Nova Park",
    bio: "Kurzform, lange Gedanken. Antworten > Likes.",
    avatarGradient: "linear-gradient(135deg,#7c2d12,#ea580c)",
    mood: "gespraech",
    followers: 22100,
    following: 401,
    verified: true,
    focus: "Kulturkritik",
  },
  {
    id: 6,
    handle: "sam",
    name: "Sam Rivera",
    bio: "Täglich ein echter Moment. Kein Filter-Theater.",
    avatarGradient: "linear-gradient(135deg,#312e81,#6366f1)",
    mood: "nah",
    followers: 3400,
    following: 290,
    focus: "Authentizität",
  },
];

export const circles: Circle[] = [
  {
    id: 1,
    slug: "stadtlicht",
    name: "Stadtlicht",
    description: "Nächtliche Spaziergänge, Architektur und urbane Rituale.",
    members: 18420,
    online: 312,
    accent: "#0d9488",
    rooms: [
      { id: "lobby", name: "Lobby", kind: "chat" },
      { id: "foto", name: "Foto-Board", kind: "board" },
      { id: "walk", name: "Abendrunde", kind: "voice" },
    ],
  },
  {
    id: 2,
    slug: "slow-tech",
    name: "Slow Tech",
    description: "Technologie, die Ruhe lässt statt Aufmerksamkeit frisst.",
    members: 9600,
    online: 144,
    accent: "#0369a1",
    rooms: [
      { id: "lesen", name: "Lesezimmer", kind: "chat" },
      { id: "bauen", name: "Bauen", kind: "board" },
      { id: "office", name: "Office Hours", kind: "voice" },
    ],
  },
  {
    id: 3,
    slug: "kueche-der-welt",
    name: "Küche der Welt",
    description: "Rezepte, Märkte, Gerüche — geteilt wie Briefe.",
    members: 27300,
    online: 501,
    accent: "#b45309",
    rooms: [
      { id: "heute", name: "Heute gekocht", kind: "chat" },
      { id: "markt", name: "Marktnotiz", kind: "board" },
    ],
  },
  {
    id: 4,
    slug: "wortklang",
    name: "Wortklang",
    description: "Lyrik, Essays und Gespräche, die nachhallen.",
    members: 11200,
    online: 89,
    accent: "#7c2d12",
    rooms: [
      { id: "salon", name: "Salon", kind: "chat" },
      { id: "lesen", name: "Gemeinsam lesen", kind: "voice" },
    ],
  },
];

export let posts: SocialPost[] = [
  {
    id: 1,
    authorId: 6,
    kind: "moment",
    mood: "nah",
    body: "Fenster auf. Regen. Kein Setup — nur der Moment, den Cadence heute verlangt hat.",
    mediaGradient:
      "linear-gradient(160deg, rgba(15,23,42,0.2), rgba(13,148,136,0.45)), linear-gradient(45deg,#94a3b8,#0f766e)",
    tags: ["echtzeit"],
    createdAt: hoursAgo(0.4),
    resonance: { reacts: 84, replies: 12, saves: 31, shares: 9 },
  },
  {
    id: 2,
    authorId: 1,
    kind: "image",
    mood: "nah",
    body: "Morgenlicht auf dem Schreibtisch. Drei Stunden ohne Benachrichtigungen — und plötzlich wieder Ideen.",
    mediaGradient:
      "linear-gradient(135deg,#f8fafc 0%,#ccfbf1 40%,#0f766e 100%)",
    tags: ["ruhe", "machen"],
    createdAt: hoursAgo(2),
    resonance: { reacts: 420, replies: 38, saves: 156, shares: 44 },
  },
  {
    id: 3,
    authorId: 5,
    kind: "text",
    mood: "gespraech",
    body: "Die Plattformen messen Aufmerksamkeit. Cadence misst Resonanz: eine Antwort zählt dreimal so viel wie ein leeres Like. Was würde sich ändern, wenn Reichweite an Gesprächsqualität gebunden wäre?",
    tags: ["these", "algorithmen"],
    createdAt: hoursAgo(3),
    resonance: { reacts: 890, replies: 210, saves: 340, shares: 120 },
  },
  {
    id: 4,
    authorId: 3,
    kind: "pulse",
    mood: "entdecken",
    body: "30 Sekunden aus Lissabon: Straßenbahn, Zitronenschale, ein Hund, der den Takt vorgibt.",
    mediaGradient:
      "linear-gradient(120deg,#fef3c7,#fb923c 45%,#7c2d12)",
    tags: ["pulse", "reisen"],
    createdAt: hoursAgo(1.5),
    resonance: { reacts: 2100, replies: 64, saves: 880, shares: 410 },
  },
  {
    id: 5,
    authorId: 4,
    kind: "text",
    mood: "kreise",
    circleId: 1,
    body: "Neuer Raum in Stadtlicht: „Abendrunde“ — voice-only, 20 Minuten, kein Streaming-Druck. Wer mitgeht, lässt das Handy auf dem Tisch.",
    tags: ["stadtlicht", "stimmen"],
    createdAt: hoursAgo(5),
    resonance: { reacts: 310, replies: 72, saves: 95, shares: 28 },
  },
  {
    id: 6,
    authorId: 2,
    kind: "longform",
    mood: "fokus",
    title: "Warum Feeds wählbar sein müssen",
    body: "Ein Algorithmus ist eine Meinung mit Mathematik. Bluesky hat gezeigt, dass Menschen Custom Feeds wollen. Discord zeigt, dass Räume wichtiger sind als Broadcast. BeReal erinnert daran, dass Authentizität ein Zeitfenster braucht.\n\nCadence verbindet das: Du wählst eine Frequenz — Nah, Gespräch, Entdecken, Kreise oder Fokus — und die Oberfläche folgt. Kein dunkler Funnel. Keine eine Ranking-Maschine für alles.\n\nResonanz ersetzt Likes als Leitwährung. Shares und Antworten wiegen schwerer. Speichern baut Sammlungen wie bei Pinterest — aber für Gedanken, nicht nur Boards.",
    tags: ["essay", "design", "ethik"],
    createdAt: hoursAgo(8),
    resonance: { reacts: 1200, replies: 186, saves: 920, shares: 305 },
  },
  {
    id: 7,
    authorId: 5,
    kind: "text",
    mood: "gespraech",
    body: "Unpopular: Chronologisch ist nicht automatisch besser. Kontrolle ist besser. Chronologisch ist nur eine von vielen Frequenzen.",
    tags: ["debatte"],
    createdAt: hoursAgo(6),
    resonance: { reacts: 540, replies: 320, saves: 110, shares: 80 },
  },
  {
    id: 8,
    authorId: 1,
    kind: "image",
    mood: "entdecken",
    body: "Typografie im Straßenraum — Buchstaben, die wetterfest denken.",
    mediaGradient:
      "linear-gradient(160deg,#e2e8f0,#64748b 50%,#0f172a)",
    tags: ["design", "stadt"],
    createdAt: hoursAgo(10),
    resonance: { reacts: 760, replies: 41, saves: 500, shares: 90 },
  },
  {
    id: 9,
    authorId: 4,
    kind: "text",
    mood: "kreise",
    circleId: 2,
    body: "Slow Tech Lesezimmer: Diese Woche „Digital Minimalism“ — aber ohne Moralkeule. Was habt ihr wirklich abgeschaltet und nie vermisst?",
    tags: ["slow-tech"],
    createdAt: hoursAgo(12),
    resonance: { reacts: 190, replies: 95, saves: 70, shares: 22 },
  },
  {
    id: 10,
    authorId: 2,
    kind: "longform",
    mood: "fokus",
    title: "Intentionales Netzwerken ohne LinkedIn-Theater",
    body: "Fokus-Modus ist kein Karriere-Feed. Es ist ein Raum für Beiträge mit Absicht: Projekte, Fragen, Essays. Kein Growth-Hack. Kein „Excited to announce“.\n\nZeig, woran du arbeitest. Frag präzise. Antworte gründlich. Das ist alles.",
    tags: ["fokus", "arbeit"],
    createdAt: hoursAgo(14),
    resonance: { reacts: 680, replies: 140, saves: 410, shares: 155 },
  },
  {
    id: 11,
    authorId: 3,
    kind: "pulse",
    mood: "entdecken",
    body: "Markt am Morgen. Dampf, Stahl, Zitrus.",
    mediaGradient:
      "linear-gradient(145deg,#ecfccb,#65a30d 40%,#14532d)",
    tags: ["pulse"],
    createdAt: hoursAgo(0.8),
    resonance: { reacts: 1500, replies: 28, saves: 620, shares: 270 },
  },
  {
    id: 12,
    authorId: 6,
    kind: "text",
    mood: "nah",
    body: "Wer heute schon den Echtzeit-Moment gepostet hat: Ihr seid mutiger als mein Kaffee.",
    tags: ["nah"],
    createdAt: hoursAgo(1),
    resonance: { reacts: 220, replies: 45, saves: 18, shares: 6 },
  },
];

export const moments: Moment[] = [
  {
    id: 1,
    authorId: 6,
    imageGradient:
      "linear-gradient(160deg, rgba(15,23,42,0.25), rgba(13,148,136,0.5)), linear-gradient(45deg,#94a3b8,#0f766e)",
    caption: "Regenfenster",
    createdAt: hoursAgo(0.4),
    expiresAt: hoursFrom(23),
    viewed: false,
  },
  {
    id: 2,
    authorId: 1,
    imageGradient:
      "linear-gradient(135deg,#fef9c3,#fde68a 40%,#ca8a04)",
    caption: "Erste Skizze",
    createdAt: hoursAgo(1.2),
    expiresAt: hoursFrom(22),
    viewed: false,
  },
  {
    id: 3,
    authorId: 3,
    imageGradient:
      "linear-gradient(120deg,#ffe4e6,#fb7185,#9f1239)",
    caption: "Lichtkante",
    createdAt: hoursAgo(2),
    expiresAt: hoursFrom(20),
    viewed: true,
  },
  {
    id: 4,
    authorId: 4,
    imageGradient:
      "linear-gradient(160deg,#dcfce7,#22c55e,#14532d)",
    caption: "Kreis-Lobby",
    createdAt: hoursAgo(3),
    expiresAt: hoursFrom(18),
    viewed: true,
  },
];

export const conversations: Conversation[] = [
  {
    id: 1,
    participantIds: [1, 2],
    preview: "Sollen wir den Fokus-Essay als Pulse kürzen?",
    updatedAt: hoursAgo(0.5),
    unread: 2,
  },
  {
    id: 2,
    participantIds: [1, 5],
    preview: "Deine These zu Resonanz — stark.",
    updatedAt: hoursAgo(3),
    unread: 0,
  },
  {
    id: 3,
    participantIds: [1, 4],
    preview: "Abendrunde heute 20 Uhr — bist du da?",
    updatedAt: hoursAgo(5),
    unread: 1,
  },
];

export let messages: DirectMessage[] = [
  {
    id: 1,
    conversationId: 1,
    senderId: 2,
    body: "Sollen wir den Fokus-Essay als Pulse kürzen?",
    createdAt: hoursAgo(0.6),
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 1,
    body: "Lieber als Thread im Gespräch-Modus — Pulse wäre zu eng.",
    createdAt: hoursAgo(0.55),
  },
  {
    id: 3,
    conversationId: 1,
    senderId: 2,
    body: "Stimmt. Dann mit klarer These oben.",
    createdAt: hoursAgo(0.5),
  },
  {
    id: 4,
    conversationId: 2,
    senderId: 5,
    body: "Deine These zu Resonanz — stark.",
    createdAt: hoursAgo(3),
  },
  {
    id: 5,
    conversationId: 3,
    senderId: 4,
    body: "Abendrunde heute 20 Uhr — bist du da?",
    createdAt: hoursAgo(5),
  },
];

export const collections: Collection[] = [
  { id: 1, ownerId: 1, name: "Ideen zum Bauen", postIds: [6, 3, 10] },
  { id: 2, ownerId: 1, name: "Licht & Stadt", postIds: [2, 8, 4] },
];

let nextPostId = 100;
let nextMsgId = 100;

export function getUser(id: number) {
  return socialUsers.find((u) => u.id === id);
}

export function getCircle(id: number) {
  return circles.find((c) => c.id === id);
}

export function getCircleBySlug(slug: string) {
  return circles.find((c) => c.slug === slug);
}

export function enrichPost(post: SocialPost) {
  const author = getUser(post.authorId)!;
  const circle = post.circleId ? getCircle(post.circleId) : undefined;
  return {
    ...post,
    author,
    circle: circle
      ? { id: circle.id, name: circle.name, slug: circle.slug, accent: circle.accent }
      : null,
    score: resonanceScore(post.resonance),
  };
}

export function feedForMood(mood: MoodId, limit = 30) {
  const filtered =
    mood === "entdecken"
      ? [...posts].sort((a, b) => resonanceScore(b.resonance) - resonanceScore(a.resonance))
      : mood === "gespraech"
        ? posts
            .filter((p) => p.mood === "gespraech" || p.kind === "text")
            .sort(
              (a, b) =>
                b.resonance.replies * 3 + b.resonance.shares * 2 -
                (a.resonance.replies * 3 + a.resonance.shares * 2)
            )
        : mood === "nah"
          ? posts
              .filter((p) => p.mood === "nah" || p.kind === "moment" || p.kind === "image")
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          : mood === "kreise"
            ? posts
                .filter((p) => p.circleId || p.mood === "kreise")
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            : posts
                .filter((p) => p.mood === "fokus" || p.kind === "longform")
                .sort((a, b) => b.resonance.saves - a.resonance.saves);

  return filtered.slice(0, limit).map(enrichPost);
}

export function createPost(input: {
  authorId: number;
  kind: SocialPost["kind"];
  mood: MoodId;
  body: string;
  title?: string;
  circleId?: number;
  tags?: string[];
  mediaGradient?: string;
}) {
  const post: SocialPost = {
    id: nextPostId++,
    authorId: input.authorId,
    kind: input.kind,
    mood: input.mood,
    body: input.body,
    title: input.title,
    circleId: input.circleId,
    tags: input.tags ?? [],
    mediaGradient: input.mediaGradient,
    createdAt: new Date().toISOString(),
    resonance: { reacts: 0, replies: 0, saves: 0, shares: 0 },
  };
  posts = [post, ...posts];
  return enrichPost(post);
}

export function reactToPost(postId: number, type: keyof SocialPost["resonance"]) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  post.resonance[type] += 1;
  return enrichPost(post);
}

export function sendMessage(conversationId: number, senderId: number, body: string) {
  const msg: DirectMessage = {
    id: nextMsgId++,
    conversationId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
  };
  messages = [...messages, msg];
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.preview = body;
    conv.updatedAt = msg.createdAt;
  }
  return msg;
}
