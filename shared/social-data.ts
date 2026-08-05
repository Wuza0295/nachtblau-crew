import type { FeedLens, PrivacyRing, SignalType } from "./brand";

export type SocialProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  cover: string;
  bio: string;
  craftTitle: string;
  craftBio: string;
  location: string;
  followers: number;
  following: number;
  verified: boolean;
};

export type Moment = {
  id: string;
  authorId: string;
  mediaUrl: string;
  caption: string;
  privacy: PrivacyRing;
  expiresAt: string;
  viewed: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  lens: FeedLens;
  body: string;
  mediaUrl?: string;
  mediaAlt?: string;
  circleId?: string;
  createdAt: string;
  signals: Record<SignalType, number>;
  comments: number;
  tags: string[];
};

export type Circle = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover: string;
  members: number;
  roomsOnline: number;
  tags: string[];
};

export type Board = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  cover: string;
  itemCount: number;
  isPublic: boolean;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage: string;
  updatedAt: string;
  unread: number;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type Room = {
  id: string;
  circleId: string;
  name: string;
  topic: string;
  listeners: number;
  isLive: boolean;
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

export const DEMO_PROFILES: SocialProfile[] = [
  {
    id: "u1",
    handle: "mira.k",
    displayName: "Mira Keller",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop",
    bio: "Stadtspaziergänge, Analogfotografie, leise Playlists.",
    craftTitle: "Produktgestalterin",
    craftBio: "Ich baue Interfaces, die sich wie Orte anfühlen — nicht wie Dashboards.",
    location: "Hamburg",
    followers: 12840,
    following: 392,
    verified: true,
  },
  {
    id: "u2",
    handle: "jonas.rivera",
    displayName: "Jonas Rivera",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop",
    bio: "Koch · Community-Host · schreibt über Rituale.",
    craftTitle: "Culinary Writer",
    craftBio: "Essays über Tischkultur, Migration und warum Rezepte Geschichten sind.",
    location: "Berlin",
    followers: 22100,
    following: 510,
    verified: true,
  },
  {
    id: "u3",
    handle: "aisha.n",
    displayName: "Aisha Nwosu",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop",
    bio: "Climate tech · Night runs · Vinyl.",
    craftTitle: "Research Lead",
    craftBio: "Offene Forschung zu Energie-Commons und lokalen Netzen.",
    location: "München",
    followers: 8740,
    following: 280,
    verified: false,
  },
  {
    id: "u4",
    handle: "leo.park",
    displayName: "Leo Park",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop",
    bio: "Indie-Spiele · Pixel art · Late-night streams.",
    craftTitle: "Game Designer",
    craftBio: "Baue Spiele, die sich wie Tagebücher anfühlen.",
    location: "Köln",
    followers: 15600,
    following: 640,
    verified: true,
  },
  {
    id: "u5",
    handle: "sofia.m",
    displayName: "Sofia Mendes",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop",
    bio: "Architektur-Skizzen und Stadtklang.",
    craftTitle: "Architektin",
    craftBio: "Öffentliche Räume, die Begegnung erzwingen — auf die gute Art.",
    location: "Lissabon / Wien",
    followers: 9300,
    following: 410,
    verified: false,
  },
];

export const DEMO_CIRCLES: Circle[] = [
  {
    id: "c1",
    slug: "slow-cities",
    name: "Slow Cities",
    description: "Stadtspaziergänge, lokale Orte, analoge Routinen — ohne Hustle.",
    cover: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=500&fit=crop",
    members: 18420,
    roomsOnline: 3,
    tags: ["urban", "analog", "ritual"],
  },
  {
    id: "c2",
    slug: "kitchen-tables",
    name: "Kitchen Tables",
    description: "Rezepte, Tischgespräche und die Kultur des Teilens.",
    cover: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=500&fit=crop",
    members: 22100,
    roomsOnline: 5,
    tags: ["food", "culture", "home"],
  },
  {
    id: "c3",
    slug: "signal-lab",
    name: "Signal Lab",
    description: "Produkt, Design und die Frage: Was wäre, wenn Social Media heilt?",
    cover: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=500&fit=crop",
    members: 9600,
    roomsOnline: 2,
    tags: ["product", "ethics", "design"],
  },
  {
    id: "c4",
    slug: "night-runners",
    name: "Night Runners",
    description: "Training nach Sonnenuntergang, Playlists und Strecken-Tipps.",
    cover: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=500&fit=crop",
    members: 11200,
    roomsOnline: 1,
    tags: ["sport", "night", "health"],
  },
];

export const DEMO_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "u1",
    lens: "pulse",
    body: "Was, wenn der Feed dich nicht festhält — sondern dich freigibt? Heute habe ich meinen Algorithmus-Regler auf 80% Chronologie gestellt. Plötzlich klingt das Internet wieder nach Menschen.",
    createdAt: hoursAgo(1),
    signals: { amplify: 428, echo: 91, agree: 612, collect: 74 },
    comments: 48,
    tags: ["algorithm", "attention"],
    circleId: "c3",
  },
  {
    id: "p2",
    authorId: "u2",
    lens: "canvas",
    body: "Sonntagsbrot mit Nachbarn. Kein Event. Kein Content-Plan. Nur Mehl, Zeit und Gespräche.",
    mediaUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&h=1100&fit=crop",
    mediaAlt: "Frisch gebackenes Brot auf Holztisch",
    createdAt: hoursAgo(3),
    signals: { amplify: 1204, echo: 220, agree: 890, collect: 510 },
    comments: 96,
    tags: ["ritual", "bread"],
    circleId: "c2",
  },
  {
    id: "p3",
    authorId: "u4",
    lens: "stream",
    body: "60 Sekunden Prototyp: Ein Spiel, in dem du Erinnerungen sammelst statt Punkte.",
    mediaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=720&h=1280&fit=crop",
    mediaAlt: "Retro Gaming Setup",
    createdAt: hoursAgo(5),
    signals: { amplify: 3400, echo: 880, agree: 2100, collect: 640 },
    comments: 210,
    tags: ["gamedev", "prototype"],
  },
  {
    id: "p4",
    authorId: "u3",
    lens: "depth",
    body: "Essay-Skizze: Warum lokale Energienetze dieselben Designmuster brauchen wie gesunde Online-Communities — klare Grenzen, geteilte Verantwortung, sichtbare Moderation.\n\n1. Grenzen sind Features, keine Bugs.\n2. Reputation muss verdient und verlierbar sein.\n3. Discovery ohne Surveillance ist möglich, wenn Interessen opt-in und exportierbar sind.\n\nMehr in den Kommentaren — ich sammle Gegenargumente.",
    createdAt: hoursAgo(8),
    signals: { amplify: 756, echo: 340, agree: 1200, collect: 890 },
    comments: 167,
    tags: ["essay", "commons", "climate"],
    circleId: "c3",
  },
  {
    id: "p5",
    authorId: "u5",
    lens: "canvas",
    body: "Skizze einer Bank, die Gespräche erzwingt — zwei Sitzflächen, ein geteiltes Dach.",
    mediaUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8624?w=900&h=700&fit=crop",
    mediaAlt: "Architekturzeichnung und Betonfassade",
    createdAt: hoursAgo(12),
    signals: { amplify: 540, echo: 120, agree: 430, collect: 980 },
    comments: 55,
    tags: ["architecture", "publicspace"],
    circleId: "c1",
  },
  {
    id: "p6",
    authorId: "u1",
    lens: "pulse",
    body: "Kleine UX-Wahrheit: „Close Friends“ war nie genug. Wir brauchen Intimitätsringe — Welt / Kreise / Nah — und sie müssen für Moments und Posts gelten.",
    createdAt: hoursAgo(14),
    signals: { amplify: 980, echo: 410, agree: 1500, collect: 320 },
    comments: 203,
    tags: ["privacy", "design"],
    circleId: "c3",
  },
  {
    id: "p7",
    authorId: "u2",
    lens: "stream",
    body: "Rezept in Bewegung: Risotto rühren ist Meditation mit Butter.",
    mediaUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=720&h=1280&fit=crop",
    mediaAlt: "Risotto in der Pfanne",
    createdAt: hoursAgo(18),
    signals: { amplify: 2100, echo: 450, agree: 1600, collect: 1200 },
    comments: 88,
    tags: ["cooking", "flow"],
    circleId: "c2",
  },
  {
    id: "p8",
    authorId: "u3",
    lens: "pulse",
    body: "Night run, 8K. Der Kopf wird leise, die Stadt wird Soundtrack.",
    createdAt: hoursAgo(20),
    signals: { amplify: 310, echo: 40, agree: 520, collect: 28 },
    comments: 22,
    tags: ["running"],
    circleId: "c4",
  },
];

export const DEMO_MOMENTS: Moment[] = [
  {
    id: "m1",
    authorId: "u1",
    mediaUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=720&h=1280&fit=crop",
    caption: "Morgenlicht auf dem Deich",
    privacy: "world",
    expiresAt: hoursFromNow(18),
    viewed: false,
  },
  {
    id: "m2",
    authorId: "u2",
    mediaUrl: "https://images.unsplash.com/photo-1466637574441-749b8f2c0c53?w=720&h=1280&fit=crop",
    caption: "Marktstand, 7:40",
    privacy: "circles",
    expiresAt: hoursFromNow(12),
    viewed: false,
  },
  {
    id: "m3",
    authorId: "u4",
    mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=720&h=1280&fit=crop",
    caption: "Build in public — Frame 12",
    privacy: "world",
    expiresAt: hoursFromNow(20),
    viewed: true,
  },
  {
    id: "m4",
    authorId: "u5",
    mediaUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=720&h=1280&fit=crop",
    caption: "Baustelle als Skizze",
    privacy: "close",
    expiresAt: hoursFromNow(8),
    viewed: false,
  },
  {
    id: "m5",
    authorId: "u3",
    mediaUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=720&h=1280&fit=crop",
    caption: "Km 6 · Playlist: soft drums",
    privacy: "world",
    expiresAt: hoursFromNow(15),
    viewed: false,
  },
];

export const DEMO_BOARDS: Board[] = [
  {
    id: "b1",
    ownerId: "u1",
    title: "Orte die atmen",
    description: "Cafés, Parks und Ecken mit guter Akustik.",
    cover: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&h=400&fit=crop",
    itemCount: 34,
    isPublic: true,
  },
  {
    id: "b2",
    ownerId: "u5",
    title: "Material & Licht",
    description: "Referenzen für Fassaden und Innenräume.",
    cover: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    itemCount: 58,
    isPublic: true,
  },
  {
    id: "b3",
    ownerId: "u2",
    title: "Tischkultur",
    description: "Gedecke, Gesten, Geschichten.",
    cover: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    itemCount: 41,
    isPublic: true,
  },
];

export const DEMO_ROOMS: Room[] = [
  {
    id: "r1",
    circleId: "c2",
    name: "Sunday Prep",
    topic: "Was kocht ihr diese Woche?",
    listeners: 48,
    isLive: true,
  },
  {
    id: "r2",
    circleId: "c3",
    name: "Algo Ethics",
    topic: "Können Feeds heilen?",
    listeners: 112,
    isLive: true,
  },
  {
    id: "r3",
    circleId: "c1",
    name: "Walk & Talk",
    topic: "Spaziergänge als Praxis",
    listeners: 27,
    isLive: true,
  },
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "cv1",
    participantIds: ["u1", "u2"],
    lastMessage: "Bringst du das Sauerteig-Starter mit?",
    updatedAt: hoursAgo(0.5),
    unread: 2,
  },
  {
    id: "cv2",
    participantIds: ["u1", "u3"],
    lastMessage: "Dein Essay-Punkt zu Grenzen ist stark.",
    updatedAt: hoursAgo(4),
    unread: 0,
  },
  {
    id: "cv3",
    participantIds: ["u1", "u4"],
    lastMessage: "Prototype-Clip ist live im Stream.",
    updatedAt: hoursAgo(9),
    unread: 1,
  },
];

export const DEMO_MESSAGES: DirectMessage[] = [
  {
    id: "dm1",
    conversationId: "cv1",
    senderId: "u2",
    body: "Bringst du das Sauerteig-Starter mit?",
    createdAt: hoursAgo(0.5),
  },
  {
    id: "dm2",
    conversationId: "cv1",
    senderId: "u2",
    body: "Und falls ja — Roggen oder Weizen?",
    createdAt: hoursAgo(0.4),
  },
  {
    id: "dm3",
    conversationId: "cv2",
    senderId: "u3",
    body: "Dein Essay-Punkt zu Grenzen ist stark.",
    createdAt: hoursAgo(4),
  },
];

/** Mutable in-memory state for the demo portal (works without DB). */
export type SocialState = {
  profiles: SocialProfile[];
  posts: Post[];
  moments: Moment[];
  circles: Circle[];
  boards: Board[];
  rooms: Room[];
  conversations: Conversation[];
  messages: DirectMessage[];
  joinedCircleIds: string[];
  followingIds: string[];
  userSignals: Record<string, SignalType[]>;
  algorithmMix: number; // 0 = chronological, 100 = discovery
  activeLens: FeedLens;
};

export function createInitialSocialState(): SocialState {
  return {
    profiles: structuredClone(DEMO_PROFILES),
    posts: structuredClone(DEMO_POSTS),
    moments: structuredClone(DEMO_MOMENTS),
    circles: structuredClone(DEMO_CIRCLES),
    boards: structuredClone(DEMO_BOARDS),
    rooms: structuredClone(DEMO_ROOMS),
    conversations: structuredClone(DEMO_CONVERSATIONS),
    messages: structuredClone(DEMO_MESSAGES),
    joinedCircleIds: ["c1", "c3"],
    followingIds: ["u2", "u3", "u4"],
    userSignals: {},
    algorithmMix: 35,
    activeLens: "pulse",
  };
}
