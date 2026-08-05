import type { FormatId, FrequencyId, ReactionId } from "../shared/site";

export type StoreUser = {
  id: number;
  openId: string;
  name: string;
  handle: string;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  avatar: string | null;
  bio: string | null;
  vibe: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type StoreCircle = {
  id: number;
  ownerId: number;
  memberId: number;
  tier: "inner" | "orbit";
  createdAt: Date;
};

export type StoreSpace = {
  id: number;
  name: string;
  slug: string;
  description: string;
  tone: string;
  memberCount: number;
  createdAt: Date;
};

export type StoreSpaceMember = {
  id: number;
  spaceId: number;
  userId: number;
  role: "member" | "mod" | "host";
  joinedAt: Date;
};

export type StorePost = {
  id: number;
  authorId: number;
  format: FormatId;
  title: string | null;
  content: string;
  mediaUrl: string | null;
  mediaAlt: string | null;
  spaceId: number | null;
  visibility: FrequencyId | "public";
  resonateCount: number;
  saveCount: number;
  amplifyCount: number;
  commentCount: number;
  isEphemeral: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreComment = {
  id: number;
  postId: number;
  authorId: number;
  content: string;
  createdAt: Date;
};

export type StoreReaction = {
  id: number;
  postId: number;
  userId: number;
  type: ReactionId;
  createdAt: Date;
};

export type StoreCollection = {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type StoreCollectionItem = {
  id: number;
  collectionId: number;
  postId: number;
  addedAt: Date;
};

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

const AVATAR = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}`;

const FRAME = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

function buildSeed() {
  const users: StoreUser[] = [
    {
      id: 1,
      openId: "nah-demo-mila",
      name: "Mila Orth",
      handle: "mila",
      email: null,
      loginMethod: "demo",
      role: "admin",
      avatar: AVATAR("mila", "c8ddd0"),
      bio: "Produktgestalterin. Schreibt langsam, liest schnell.",
      vibe: "Heute: ruhiger Fokus",
      createdAt: daysAgo(120),
      updatedAt: hoursAgo(2),
      lastSignedIn: hoursAgo(1),
    },
    {
      id: 2,
      openId: "nah-demo-jonas",
      name: "Jonas Kehl",
      handle: "jonas",
      email: null,
      loginMethod: "demo",
      role: "user",
      avatar: AVATAR("jonas", "d4cfc4"),
      bio: "Stadtspaziergänge und analoge Kameras.",
      vibe: "Unterwegs in Altona",
      createdAt: daysAgo(90),
      updatedAt: hoursAgo(5),
      lastSignedIn: hoursAgo(3),
    },
    {
      id: 3,
      openId: "nah-demo-sara",
      name: "Sara Nguyen",
      handle: "sara",
      email: null,
      loginMethod: "demo",
      role: "user",
      avatar: AVATAR("sara", "e8d5c4"),
      bio: "Baut Communities, die Menschen atmen lassen.",
      vibe: "Raum öffnen",
      createdAt: daysAgo(80),
      updatedAt: hoursAgo(8),
      lastSignedIn: hoursAgo(4),
    },
    {
      id: 4,
      openId: "nah-demo-leo",
      name: "Leo Hartmann",
      handle: "leo",
      email: null,
      loginMethod: "demo",
      role: "user",
      avatar: AVATAR("leo", "b8c9c2"),
      bio: "Musik, Essays, lange Abende.",
      vibe: "Platte drehen",
      createdAt: daysAgo(60),
      updatedAt: hoursAgo(12),
      lastSignedIn: hoursAgo(6),
    },
    {
      id: 5,
      openId: "nah-demo-amina",
      name: "Amina Diallo",
      handle: "amina",
      email: null,
      loginMethod: "demo",
      role: "user",
      avatar: AVATAR("amina", "dcc9b8"),
      bio: "Forschung zu Aufmerksamkeit & Fürsorge online.",
      vibe: "Tiefes Lesen",
      createdAt: daysAgo(45),
      updatedAt: hoursAgo(1),
      lastSignedIn: hoursAgo(0.5),
    },
    {
      id: 6,
      openId: "nah-demo-timo",
      name: "Timo Brandt",
      handle: "timo",
      email: null,
      loginMethod: "demo",
      role: "user",
      avatar: AVATAR("timo", "c5d0c8"),
      bio: "Kochbuch im Kopf, Skizzenbuch in der Tasche.",
      vibe: "Brot backen",
      createdAt: daysAgo(30),
      updatedAt: hoursAgo(20),
      lastSignedIn: hoursAgo(10),
    },
  ];

  const circles: StoreCircle[] = [
    { id: 1, ownerId: 1, memberId: 2, tier: "inner", createdAt: daysAgo(40) },
    { id: 2, ownerId: 1, memberId: 3, tier: "inner", createdAt: daysAgo(38) },
    { id: 3, ownerId: 1, memberId: 5, tier: "inner", createdAt: daysAgo(20) },
    { id: 4, ownerId: 1, memberId: 4, tier: "orbit", createdAt: daysAgo(25) },
    { id: 5, ownerId: 1, memberId: 6, tier: "orbit", createdAt: daysAgo(15) },
    { id: 6, ownerId: 2, memberId: 1, tier: "inner", createdAt: daysAgo(40) },
    { id: 7, ownerId: 3, memberId: 1, tier: "orbit", createdAt: daysAgo(30) },
    { id: 8, ownerId: 5, memberId: 1, tier: "inner", createdAt: daysAgo(18) },
  ];

  const spaces: StoreSpace[] = [
    {
      id: 1,
      name: "Langsam Internet",
      slug: "langsam-internet",
      description:
        "Für Menschen, die Online weniger performen und mehr sein wollen. Essays, Rituale, Kritik.",
      tone: "nachdenklich",
      memberCount: 1840,
      createdAt: daysAgo(200),
    },
    {
      id: 2,
      name: "Stadtspuren",
      slug: "stadtspuren",
      description: "Fotografien, Spaziergänge, Orte die man übersieht.",
      tone: "visuell",
      memberCount: 920,
      createdAt: daysAgo(150),
    },
    {
      id: 3,
      name: "Handwerk & Kopf",
      slug: "handwerk-kopf",
      description: "Machen mit den Händen, denken mit Ruhe. Rezepte, Skizzen, Tools.",
      tone: "praktisch",
      memberCount: 610,
      createdAt: daysAgo(100),
    },
    {
      id: 4,
      name: "Klangräume",
      slug: "klangraeume",
      description: "Playlists, Konzerte, die Stille dazwischen.",
      tone: "musikalisch",
      memberCount: 1280,
      createdAt: daysAgo(180),
    },
  ];

  const spaceMembers: StoreSpaceMember[] = [
    { id: 1, spaceId: 1, userId: 1, role: "host", joinedAt: daysAgo(180) },
    { id: 2, spaceId: 1, userId: 5, role: "mod", joinedAt: daysAgo(40) },
    { id: 3, spaceId: 1, userId: 3, role: "member", joinedAt: daysAgo(60) },
    { id: 4, spaceId: 2, userId: 2, role: "host", joinedAt: daysAgo(140) },
    { id: 5, spaceId: 2, userId: 1, role: "member", joinedAt: daysAgo(50) },
    { id: 6, spaceId: 3, userId: 6, role: "host", joinedAt: daysAgo(90) },
    { id: 7, spaceId: 4, userId: 4, role: "host", joinedAt: daysAgo(160) },
    { id: 8, spaceId: 4, userId: 1, role: "member", joinedAt: daysAgo(70) },
  ];

  const posts: StorePost[] = [
    {
      id: 1,
      authorId: 2,
      format: "moment",
      title: null,
      content:
        "Fenster offen, Regen auf dem Blechdach. Kein Filter. Genau so fühlt sich Dienstag an.",
      mediaUrl: FRAME("photo-1500530855697-b586d89ba3ee"),
      mediaAlt: "Regenfenster in einer Wohnung",
      spaceId: null,
      visibility: "inner",
      resonateCount: 8,
      saveCount: 2,
      amplifyCount: 0,
      commentCount: 2,
      isEphemeral: true,
      expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 2,
      authorId: 5,
      format: "pulse",
      title: null,
      content:
        "Algorithmus-Müdigkeit ist kein persönliches Versagen. Es ist ein Designproblem. Wir können Nähe bauen, ohne Aufmerksamkeit zu erpressen.",
      mediaUrl: null,
      mediaAlt: null,
      spaceId: 1,
      visibility: "horizon",
      resonateCount: 142,
      saveCount: 67,
      amplifyCount: 31,
      commentCount: 18,
      isEphemeral: false,
      expiresAt: null,
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
    {
      id: 3,
      authorId: 2,
      format: "frame",
      title: null,
      content: "Goldene Stunde am Hafen. Niemand posierte. Alle warteten einfach.",
      mediaUrl: FRAME("photo-1507525428034-b723cf961d3e"),
      mediaAlt: "Strand und Abendlicht",
      spaceId: 2,
      visibility: "orbit",
      resonateCount: 54,
      saveCount: 29,
      amplifyCount: 7,
      commentCount: 4,
      isEphemeral: false,
      expiresAt: null,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(8),
    },
    {
      id: 4,
      authorId: 1,
      format: "depth",
      title: "Warum Distanz das bessere Ranking ist",
      content: `Die großen Netzwerke sortieren nach Engagement. Das belohnt Extremes.

NAH sortiert nach Distanz:
1. Innenkreis — wer dir wirklich nah ist
2. Orbit — wen du bewusst gewählt hast
3. Horizont — Räume, denen du beigetreten bist
4. Drift — Entdeckung, nur auf Abruf

Kein Feed mischt das heimlich. Du drehst die Frequenz selbst.

Das Beste von Close Friends, Following-Timelines, Communities und Discovery — ohne Black Box.`,
      mediaUrl: null,
      mediaAlt: null,
      spaceId: 1,
      visibility: "public",
      resonateCount: 210,
      saveCount: 118,
      amplifyCount: 45,
      commentCount: 22,
      isEphemeral: false,
      expiresAt: null,
      createdAt: hoursAgo(14),
      updatedAt: hoursAgo(14),
    },
    {
      id: 5,
      authorId: 4,
      format: "pulse",
      title: null,
      content:
        "Heute Abend: Coltrane, wenig Licht, kein Scrollen. Manchmal ist Stille der bessere Feed.",
      mediaUrl: null,
      mediaAlt: null,
      spaceId: 4,
      visibility: "horizon",
      resonateCount: 89,
      saveCount: 41,
      amplifyCount: 12,
      commentCount: 9,
      isEphemeral: false,
      expiresAt: null,
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(18),
    },
    {
      id: 6,
      authorId: 6,
      format: "frame",
      title: null,
      content: "Sauerteig nach 18 Stunden. Der Geruch allein ist schon ein Status.",
      mediaUrl: FRAME("photo-1509440159596-0249088772ff"),
      mediaAlt: "Frisch gebackenes Brot",
      spaceId: 3,
      visibility: "orbit",
      resonateCount: 73,
      saveCount: 52,
      amplifyCount: 6,
      commentCount: 11,
      isEphemeral: false,
      expiresAt: null,
      createdAt: hoursAgo(22),
      updatedAt: hoursAgo(22),
    },
    {
      id: 7,
      authorId: 3,
      format: "depth",
      title: "Community-Regeln, die wirklich helfen",
      content: `Drei Regeln, die Räume menschlich halten:

• Keine Hot Takes als Einstieg — teile, was dich bewegt, nicht was provoziert
• Antworten vor Reichweite — ein guter Kommentar zählt mehr als 100 Likes
• Offline-Fenster respektieren — Presence ist Soft-Signal, kein Druck

Discord-Nähe + Reddit-Tiefe, ohne Moderations-Burnout.`,
      mediaUrl: null,
      mediaAlt: null,
      spaceId: 1,
      visibility: "horizon",
      resonateCount: 156,
      saveCount: 94,
      amplifyCount: 28,
      commentCount: 15,
      isEphemeral: false,
      expiresAt: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 8,
      authorId: 5,
      format: "moment",
      title: null,
      content: "Schreibtisch um 7:42. Kaffee, offenes Notebook, keine Notifications.",
      mediaUrl: FRAME("photo-1484480974693-6ca0a78fb36b"),
      mediaAlt: "Schreibtisch am Morgen",
      spaceId: null,
      visibility: "inner",
      resonateCount: 11,
      saveCount: 3,
      amplifyCount: 0,
      commentCount: 3,
      isEphemeral: true,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      id: 9,
      authorId: 4,
      format: "frame",
      title: null,
      content: "Plattenregal als Stimmungslandkarte. Heute: linke Hälfte.",
      mediaUrl: FRAME("photo-1511379938547-c1f69419868d"),
      mediaAlt: "Schallplatten und Instrumente",
      spaceId: 4,
      visibility: "public",
      resonateCount: 198,
      saveCount: 76,
      amplifyCount: 22,
      commentCount: 8,
      isEphemeral: false,
      expiresAt: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: 10,
      authorId: 3,
      format: "pulse",
      title: null,
      content:
        "Kleine Gruppen skalieren besser als große Feeds. Zwölf Menschen, die dich kennen, schlagen zwölftausend, die dich scrollen.",
      mediaUrl: null,
      mediaAlt: null,
      spaceId: null,
      visibility: "orbit",
      resonateCount: 64,
      saveCount: 33,
      amplifyCount: 14,
      commentCount: 5,
      isEphemeral: false,
      expiresAt: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ];

  const comments: StoreComment[] = [
    {
      id: 1,
      postId: 1,
      authorId: 1,
      content: "Das klingt nach genau der Art Dienstag, die man braucht.",
      createdAt: hoursAgo(1.5),
    },
    {
      id: 2,
      postId: 1,
      authorId: 5,
      content: "Regen + Blechdach ist meine Lieblingsfrequenz.",
      createdAt: hoursAgo(1),
    },
    {
      id: 3,
      postId: 2,
      authorId: 1,
      content: "Genau deshalb existiert NAH. Distanz als Interface.",
      createdAt: hoursAgo(4),
    },
    {
      id: 4,
      postId: 2,
      authorId: 3,
      content: "Das sollte auf jeder Product-Roadmap stehen.",
      createdAt: hoursAgo(3.5),
    },
    {
      id: 5,
      postId: 4,
      authorId: 5,
      content: "Transparentes Ranking ist eine zivilisatorische Entscheidung.",
      createdAt: hoursAgo(10),
    },
    {
      id: 6,
      postId: 6,
      authorId: 1,
      content: "Rezept teilen? Bitte.",
      createdAt: hoursAgo(20),
    },
    {
      id: 7,
      postId: 8,
      authorId: 1,
      content: "7:42 ist die ehrlichste Uhrzeit.",
      createdAt: hoursAgo(2.5),
    },
  ];

  const reactions: StoreReaction[] = [
    { id: 1, postId: 2, userId: 1, type: "resonate", createdAt: hoursAgo(4) },
    { id: 2, postId: 2, userId: 1, type: "save", createdAt: hoursAgo(4) },
    { id: 3, postId: 4, userId: 5, type: "resonate", createdAt: hoursAgo(12) },
    { id: 4, postId: 4, userId: 5, type: "amplify", createdAt: hoursAgo(11) },
    { id: 5, postId: 3, userId: 1, type: "resonate", createdAt: hoursAgo(7) },
    { id: 6, postId: 6, userId: 1, type: "save", createdAt: hoursAgo(19) },
  ];

  const collections: StoreCollection[] = [
    {
      id: 1,
      userId: 1,
      name: "Ideen für ruhige Interfaces",
      description: "Referenzen und Gedanken zum Distanz-Modell",
      createdAt: daysAgo(10),
    },
    {
      id: 2,
      userId: 1,
      name: "Orte & Licht",
      description: "Visuelle Momente die bleiben",
      createdAt: daysAgo(5),
    },
  ];

  const collectionItems: StoreCollectionItem[] = [
    { id: 1, collectionId: 1, postId: 2, addedAt: hoursAgo(3) },
    { id: 2, collectionId: 1, postId: 4, addedAt: hoursAgo(10) },
    { id: 3, collectionId: 2, postId: 3, addedAt: hoursAgo(6) },
    { id: 4, collectionId: 2, postId: 9, addedAt: daysAgo(1) },
  ];

  return {
    users,
    circles,
    spaces,
    spaceMembers,
    posts,
    comments,
    reactions,
    collections,
    collectionItems,
    seq: {
      user: 6,
      circle: 8,
      space: 4,
      spaceMember: 8,
      post: 10,
      comment: 7,
      reaction: 6,
      collection: 2,
      collectionItem: 4,
    },
  };
}

export type MemoryStore = ReturnType<typeof buildSeed>;

let store: MemoryStore = buildSeed();

export function getStore(): MemoryStore {
  return store;
}

export function resetStore() {
  store = buildSeed();
  return store;
}

export function nextId(key: keyof MemoryStore["seq"]) {
  store.seq[key] += 1;
  return store.seq[key];
}

export function publicUser(u: StoreUser) {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatar,
    bio: u.bio,
    vibe: u.vibe,
    role: u.role,
    createdAt: u.createdAt,
  };
}
