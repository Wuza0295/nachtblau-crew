import { randomUUID } from "crypto";
import type {
  ChatMessage,
  Circle,
  CircleThread,
  Conversation,
  FeedMode,
  MomentItem,
  PulseClip,
  RadarInterest,
  SocialAuthor,
  SocialPost,
} from "@shared/social";

const now = Date.now();
const hours = (h: number) => new Date(now - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * 3600_000).toISOString();

const AUTHORS: SocialAuthor[] = [
  {
    id: 1,
    handle: "mira",
    name: "Mira Solano",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    bio: "Designerin · schreibt über Städte und Stille",
    roleLabel: "Creator",
    presence: "online",
    closeness: 92,
  },
  {
    id: 2,
    handle: "kai",
    name: "Kai Okonkwo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    bio: "Produkt · Community-Architekt · Nachtmensch",
    roleLabel: "Builder",
    presence: "online",
    closeness: 78,
  },
  {
    id: 3,
    handle: "lena",
    name: "Lena Hartmann",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    bio: "Journalistín · Fokus auf Tech & Gesellschaft",
    roleLabel: "Denkerin",
    presence: "away",
    closeness: 55,
  },
  {
    id: 4,
    handle: "jonas",
    name: "Jonas Berg",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    bio: "Indie-Dev · Open Source · Lo-Fi Beats",
    roleLabel: "Maker",
    presence: "online",
    closeness: 88,
  },
  {
    id: 5,
    handle: "aya",
    name: "Aya Nakamura",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    bio: "Fotografin · analog & digital · Reisen langsam",
    roleLabel: "Visuell",
    presence: "offline",
    closeness: 41,
  },
  {
    id: 6,
    handle: "noah",
    name: "Noah Richter",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    bio: "Gaming · Speedruns · Circle-Moderator",
    roleLabel: "Host",
    presence: "online",
    closeness: 67,
  },
];

let posts: SocialPost[] = [
  {
    id: "p1",
    authorId: 1,
    kind: "visual",
    body: "Morgenlicht über der Elbe. Kein Filter — nur Geduld.",
    mediaUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
    mediaAlt: "Berge im Morgenlicht",
    topics: ["fotografie", "ruhe", "natur"],
    resonance: 248,
    replies: 34,
    shares: 12,
    crystallized: false,
    createdAt: hours(1.2),
    modeTags: ["chronik", "nah", "entdecken"],
  },
  {
    id: "p2",
    authorId: 3,
    kind: "essay",
    title: "Warum Algorithmen uns die Wahl zurückgeben müssen",
    body: "Die großen Plattformen optimieren auf Verweildauer. FLUX dreht das um: Du sagst dem Radar, was du willst — und der Feed folgt. Nicht umgekehrt.\n\nDrei Prinzipien: Transparenz der Themen, explizite Modi (Chronik / Nah / Entdecken / Fokus), und Resonanz statt Likes. Resonanz zählt nur, wenn jemand länger bleibt, speichert oder antwortet — nicht wenn jemand schnell doppelt tippt.",
    topics: ["gesellschaft", "produkt", "medien"],
    resonance: 512,
    replies: 89,
    shares: 64,
    crystallized: true,
    createdAt: hours(3),
    modeTags: ["fokus", "entdecken", "chronik"],
  },
  {
    id: "p3",
    authorId: 2,
    kind: "signal",
    body: "Hot take: Communities brauchen beides — Reddit-Threads für Wissen und Discord-Räume für Präsenz. Ein Circle ohne Live-Kanal ist ein Archiv. Ein Live-Kanal ohne Threads ist Lärm.",
    topics: ["community", "produkt"],
    resonance: 176,
    replies: 41,
    shares: 22,
    crystallized: false,
    createdAt: hours(0.5),
    modeTags: ["chronik", "fokus"],
    circleId: "c1",
  },
  {
    id: "p4",
    authorId: 4,
    kind: "pulse",
    body: "60 Sekunden: So baue ich Offline-first Feeds.",
    mediaUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&h=1600&fit=crop",
    mediaAlt: "Code auf dem Bildschirm",
    topics: ["dev", "tutorial"],
    resonance: 890,
    replies: 56,
    shares: 110,
    crystallized: false,
    createdAt: hours(5),
    modeTags: ["entdecken"],
  },
  {
    id: "p5",
    authorId: 5,
    kind: "visual",
    body: "Kyoto, 6:14. Der Moment vor dem Touristenstrom.",
    mediaUrl:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=900&fit=crop",
    mediaAlt: "Tempel in Kyoto",
    topics: ["reisen", "fotografie", "japan"],
    resonance: 421,
    replies: 28,
    shares: 45,
    crystallized: false,
    createdAt: hours(8),
    modeTags: ["entdecken", "chronik"],
  },
  {
    id: "p6",
    authorId: 6,
    kind: "signal",
    body: "Wer heute Abend um 21 Uhr in den Circle »Nachtlauf« kommt: Voice-Room ist offen. Speedrun-Night, kein Gatekeeping.",
    topics: ["gaming", "live"],
    resonance: 94,
    replies: 19,
    shares: 8,
    crystallized: false,
    createdAt: hours(0.2),
    modeTags: ["nah", "chronik"],
    circleId: "c2",
  },
  {
    id: "p7",
    authorId: 1,
    kind: "essay",
    title: "Presence Rings: Nähe sichtbar machen",
    body: "Follower-Zahlen lügen. Presence Rings zeigen, mit wem du tatsächlich interagierst — Antworten, Moments, gemeinsame Circles. Die äußeren Ringe sind Bekanntschaften. Der Kern sind Menschen, die zählen.",
    topics: ["produkt", "beziehung"],
    resonance: 303,
    replies: 47,
    shares: 31,
    crystallized: false,
    createdAt: hours(12),
    modeTags: ["fokus", "nah"],
  },
  {
    id: "p8",
    authorId: 4,
    kind: "signal",
    body: "Ship it. Dann lerne. Dann ship wieder. 🚀",
    topics: ["dev", "motivation"],
    resonance: 67,
    replies: 9,
    shares: 4,
    crystallized: false,
    createdAt: hours(0.8),
    modeTags: ["nah", "chronik"],
  },
];

let moments: MomentItem[] = [
  {
    id: "m1",
    authorId: 1,
    mediaUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&h=800&fit=crop",
    caption: "Kaffee. Regen. Playlist.",
    frontCamera: false,
    expiresAt: hoursFromNow(18),
    resonance: 42,
    crystallizeThreshold: 80,
  },
  {
    id: "m2",
    authorId: 4,
    mediaUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=800&fit=crop",
    caption: "Build-Session bis 2 Uhr",
    frontCamera: true,
    expiresAt: hoursFromNow(12),
    resonance: 71,
    crystallizeThreshold: 80,
  },
  {
    id: "m3",
    authorId: 2,
    mediaUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=800&fit=crop",
    caption: "Team-Sync im Park",
    frontCamera: false,
    expiresAt: hoursFromNow(20),
    resonance: 28,
    crystallizeThreshold: 80,
  },
  {
    id: "m4",
    authorId: 6,
    mediaUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop",
    caption: "Boss fight. Keine Spoiler.",
    frontCamera: false,
    expiresAt: hoursFromNow(8),
    resonance: 55,
    crystallizeThreshold: 80,
  },
  {
    id: "m5",
    authorId: 5,
    mediaUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=800&fit=crop",
    caption: "Unterwegs. Analog.",
    frontCamera: false,
    expiresAt: hoursFromNow(22),
    resonance: 33,
    crystallizeThreshold: 80,
  },
];

let circles: Circle[] = [
  {
    id: "c1",
    name: "Produkt & Menschen",
    slug: "produkt-menschen",
    description:
      "Wo Builder und Community-Hosts sich treffen. Threads für Wissen, Live-Räume fürs Machen.",
    coverUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=500&fit=crop",
    memberCount: 12840,
    topics: ["produkt", "community", "ux"],
    isJoined: true,
    channels: [
      { id: "ch1", name: "ankommen", kind: "live" },
      { id: "ch2", name: "ideen-threads", kind: "thread" },
      { id: "ch3", name: "office-hours", kind: "voice" },
    ],
  },
  {
    id: "c2",
    name: "Nachtlauf",
    slug: "nachtlauf",
    description: "Gaming ohne Gatekeeping. Speedruns, Co-Op, Voice bis spät.",
    coverUrl:
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=500&fit=crop",
    memberCount: 45200,
    topics: ["gaming", "live", "pc"],
    isJoined: true,
    channels: [
      { id: "ch4", name: "lobby", kind: "live" },
      { id: "ch5", name: "guides", kind: "thread" },
      { id: "ch6", name: "party-voice", kind: "voice" },
    ],
  },
  {
    id: "c3",
    name: "Langsam Reisen",
    slug: "langsam-reisen",
    description: "Fotos, Routen, Orte ohne Check-in-Druck. Authentische Momente willkommen.",
    coverUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=500&fit=crop",
    memberCount: 8930,
    topics: ["reisen", "fotografie"],
    isJoined: false,
    channels: [
      { id: "ch7", name: "routen", kind: "thread" },
      { id: "ch8", name: "bilder", kind: "live" },
    ],
  },
  {
    id: "c4",
    name: "Fokus Schreiben",
    slug: "fokus-schreiben",
    description: "Essays, Kritik, lange Gedanken. Upvotes für Substanz, nicht für Lautstärke.",
    coverUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=500&fit=crop",
    memberCount: 6120,
    topics: ["schreiben", "medien", "gesellschaft"],
    isJoined: false,
    channels: [
      { id: "ch9", name: "essays", kind: "thread" },
      { id: "ch10", name: "feedback", kind: "live" },
    ],
  },
];

let circleThreads: CircleThread[] = [
  {
    id: "t1",
    circleId: "c1",
    authorId: 2,
    title: "Wie organisiert ihr Onboarding ohne Discord-Chaos?",
    body: "Wir testen einen Hybrid: kurzer Live-Kanal + gepinnter Thread mit FAQ. Was funktioniert bei euch?",
    upvotes: 214,
    replies: 48,
    createdAt: hours(6),
  },
  {
    id: "t2",
    circleId: "c1",
    authorId: 3,
    title: "Resonanz vs. Like — erste Messwerte",
    body: "Nach zwei Wochen: Posts mit Speichern+Antwort haben 3× mehr nachhaltige Reichweite als reine Doppeltap-Posts.",
    upvotes: 389,
    replies: 72,
    createdAt: hours(14),
  },
  {
    id: "t3",
    circleId: "c2",
    authorId: 6,
    title: "Empfohlene Settings für Couch-Co-Op (2026)",
    body: "Liste aktualisiert — bitte in den Kommentaren ergänzen, was fehlt.",
    upvotes: 156,
    replies: 33,
    createdAt: hours(4),
  },
  {
    id: "t4",
    circleId: "c3",
    authorId: 5,
    title: "Beste Nebenstrecken zwischen Kyoto und Kanazawa",
    body: "Ohne Shinkansen. Mit Licht und Tee.",
    upvotes: 98,
    replies: 21,
    createdAt: hours(20),
  },
];

let conversations: Conversation[] = [
  {
    id: "cv1",
    participantIds: [1, 4],
    lastMessage: "Moment fast kristallisiert — willst du ihn pinnen?",
    updatedAt: hours(0.3),
    unread: 2,
  },
  {
    id: "cv2",
    participantIds: [2, 6],
    lastMessage: "Voice um 21 Uhr — ich bringe Snacks (virtuell).",
    updatedAt: hours(1),
    unread: 0,
  },
  {
    id: "cv3",
    participantIds: [3, 1],
    lastMessage: "Dein Essay trifft genau den Punkt mit dem Radar.",
    updatedAt: hours(5),
    unread: 1,
  },
];

let messages: ChatMessage[] = [
  {
    id: "msg1",
    conversationId: "cv1",
    authorId: 1,
    body: "Hey — dein Moment von gestern hat 71 Resonanz.",
    createdAt: hours(1),
  },
  {
    id: "msg2",
    conversationId: "cv1",
    authorId: 1,
    body: "Moment fast kristallisiert — willst du ihn pinnen?",
    createdAt: hours(0.3),
  },
  {
    id: "msg3",
    conversationId: "cv2",
    authorId: 2,
    body: "Nachtlauf heute?",
    createdAt: hours(2),
  },
  {
    id: "msg4",
    conversationId: "cv2",
    authorId: 6,
    body: "Voice um 21 Uhr — ich bringe Snacks (virtuell).",
    createdAt: hours(1),
  },
  {
    id: "msg5",
    conversationId: "cv3",
    authorId: 3,
    body: "Dein Essay trifft genau den Punkt mit dem Radar.",
    createdAt: hours(5),
  },
];

let radar: RadarInterest[] = [
  { topic: "fotografie", weight: 72 },
  { topic: "produkt", weight: 58 },
  { topic: "reisen", weight: 45 },
  { topic: "gaming", weight: 20 },
  { topic: "drama", weight: -80 },
  { topic: "clickbait", weight: -95 },
  { topic: "community", weight: 40 },
  { topic: "dev", weight: 35 },
];

let pulseClips: PulseClip[] = [
  {
    id: "pu1",
    authorId: 4,
    title: "Offline-first Feed in 60s",
    mediaUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&h=1600&fit=crop",
    body: "Local-first, dann Sync. So bleibt Chronik auch im Zug nutzbar.",
    topics: ["dev", "tutorial"],
    watchHint: "Hook in Sekunde 1",
    resonance: 1204,
  },
  {
    id: "pu2",
    authorId: 5,
    title: "Goldene Stunde, eine Regel",
    mediaUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=1600&fit=crop",
    body: "Warte auf das Licht. Nicht auf Likes.",
    topics: ["fotografie", "reisen"],
    watchHint: "Visuell stark",
    resonance: 876,
  },
  {
    id: "pu3",
    authorId: 6,
    title: "Boss in under 40",
    mediaUrl:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=900&h=1600&fit=crop",
    body: "Pattern lesen, nicht spammen. Clip aus der Nightlauf-Session.",
    topics: ["gaming"],
    watchHint: "Completion-Rate hoch",
    resonance: 2103,
  },
  {
    id: "pu4",
    authorId: 2,
    title: "Circle-Setup: Live + Thread",
    mediaUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&h=1600&fit=crop",
    body: "Zwei Flächen, eine Community. So vermeidest du Kanal-Chaos.",
    topics: ["community", "produkt"],
    watchHint: "Fokus-Mode geeignet",
    resonance: 654,
  },
];

let following = new Set<number>([1, 2, 4, 6]);
let resonatedPosts = new Set<string>();
let currentMode: FeedMode = "chronik";

function authorMap() {
  return new Map(AUTHORS.map((a) => [a.id, a]));
}

function withAuthor<T extends { authorId: number }>(item: T) {
  return { ...item, author: authorMap().get(item.authorId)! };
}

function scoreForMode(post: SocialPost, mode: FeedMode, interests: RadarInterest[]) {
  const interestScore = post.topics.reduce((sum, t) => {
    const hit = interests.find((i) => i.topic === t);
    return sum + (hit?.weight ?? 0);
  }, 0);

  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600_000;
  const freshness = Math.max(0, 48 - ageHours);

  switch (mode) {
    case "chronik":
      return -ageHours * 10 + (following.has(post.authorId) ? 1000 : 0);
    case "nah": {
      const author = authorMap().get(post.authorId);
      return (author?.closeness ?? 0) * 5 + freshness;
    }
    case "entdecken":
      return post.resonance * 0.4 + interestScore * 2 + freshness * 3;
    case "fokus":
      return (
        (post.kind === "essay" ? 200 : 0) +
        post.replies * 4 +
        interestScore * 1.5 +
        (post.crystallized ? 80 : 0)
      );
    default:
      return 0;
  }
}

export const socialStore = {
  getAuthors: () => AUTHORS,
  getAuthor: (id: number) => AUTHORS.find((a) => a.id === id),

  getFeed(mode: FeedMode) {
    const list = posts
      .filter((p) => {
        if (mode === "chronik") return following.has(p.authorId) || p.modeTags.includes("chronik");
        if (mode === "nah") {
          const a = authorMap().get(p.authorId);
          return (a?.closeness ?? 0) >= 60 || p.modeTags.includes("nah");
        }
        return p.modeTags.includes(mode) || mode === "entdecken";
      })
      .map((p) => ({ ...withAuthor(p), userResonated: resonatedPosts.has(p.id) }))
      .sort((a, b) => scoreForMode(b, mode, radar) - scoreForMode(a, mode, radar));
    return list;
  },

  getPost(id: string) {
    const post = posts.find((p) => p.id === id);
    if (!post) return null;
    return { ...withAuthor(post), userResonated: resonatedPosts.has(post.id) };
  },

  createPost(input: {
    authorId: number;
    kind: SocialPost["kind"];
    body: string;
    title?: string;
    topics?: string[];
    circleId?: string;
  }) {
    const post: SocialPost = {
      id: randomUUID(),
      authorId: input.authorId,
      kind: input.kind,
      body: input.body,
      title: input.title,
      topics: input.topics ?? [],
      circleId: input.circleId,
      resonance: 0,
      replies: 0,
      shares: 0,
      crystallized: false,
      createdAt: new Date().toISOString(),
      modeTags: ["chronik", "nah", input.kind === "essay" ? "fokus" : "entdecken"],
    };
    posts = [post, ...posts];
    return withAuthor(post);
  },

  resonate(postId: string) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return null;
    if (resonatedPosts.has(postId)) {
      resonatedPosts.delete(postId);
      post.resonance = Math.max(0, post.resonance - 1);
    } else {
      resonatedPosts.add(postId);
      post.resonance += 1;
    }
    return { ...withAuthor(post), userResonated: resonatedPosts.has(postId) };
  },

  getMoments() {
    return moments
      .filter((m) => new Date(m.expiresAt).getTime() > Date.now())
      .map(withAuthor)
      .sort((a, b) => b.resonance - a.resonance);
  },

  addMomentResonance(id: string) {
    const m = moments.find((x) => x.id === id);
    if (!m) return null;
    m.resonance += 1;
    // Crystallize into permanent post when threshold reached
    if (m.resonance >= m.crystallizeThreshold) {
      const existing = posts.find((p) => p.id === `crystal-${m.id}`);
      if (!existing) {
        posts = [
          {
            id: `crystal-${m.id}`,
            authorId: m.authorId,
            kind: "moment",
            body: `Kristallisiert aus Moment: ${m.caption}`,
            mediaUrl: m.mediaUrl,
            topics: ["moment", "authentisch"],
            resonance: m.resonance,
            replies: 0,
            shares: 0,
            crystallized: true,
            createdAt: new Date().toISOString(),
            modeTags: ["chronik", "nah", "entdecken"],
          },
          ...posts,
        ];
      }
    }
    return withAuthor(m);
  },

  getCircles() {
    return circles;
  },

  getCircle(slug: string) {
    const circle = circles.find((c) => c.slug === slug);
    if (!circle) return null;
    const threads = circleThreads
      .filter((t) => t.circleId === circle.id)
      .map(withAuthor)
      .sort((a, b) => b.upvotes - a.upvotes);
    return { circle, threads };
  },

  toggleJoinCircle(id: string) {
    const c = circles.find((x) => x.id === id);
    if (!c) return null;
    c.isJoined = !c.isJoined;
    c.memberCount += c.isJoined ? 1 : -1;
    return c;
  },

  upvoteThread(id: string) {
    const t = circleThreads.find((x) => x.id === id);
    if (!t) return null;
    t.upvotes += 1;
    return withAuthor(t);
  },

  getConversations() {
    return conversations
      .map((c) => ({
        ...c,
        participants: c.participantIds.map((id) => authorMap().get(id)!),
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getMessages(conversationId: string) {
    return messages
      .filter((m) => m.conversationId === conversationId)
      .map(withAuthor)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  sendMessage(conversationId: string, authorId: number, body: string) {
    const msg: ChatMessage = {
      id: randomUUID(),
      conversationId,
      authorId,
      body,
      createdAt: new Date().toISOString(),
    };
    messages = [...messages, msg];
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = body;
      conv.updatedAt = msg.createdAt;
    }
    return withAuthor(msg);
  },

  getRadar() {
    return [...radar].sort((a, b) => b.weight - a.weight);
  },

  setRadarInterest(topic: string, weight: number) {
    const existing = radar.find((r) => r.topic.toLowerCase() === topic.toLowerCase());
    if (existing) {
      existing.weight = Math.max(-100, Math.min(100, weight));
    } else {
      radar.push({ topic, weight: Math.max(-100, Math.min(100, weight)) });
    }
    return this.getRadar();
  },

  applyRadarPrompt(prompt: string) {
    const lower = prompt.toLowerCase();
    const more = lower.match(/mehr\s+([a-zäöüß\s]+)/i);
    const less = lower.match(/weniger\s+([a-zäöüß\s]+)/i);
    if (more) {
      const topic = more[1].trim().split(/\s+/).slice(0, 2).join(" ");
      this.setRadarInterest(topic, 70);
    }
    if (less) {
      const topic = less[1].trim().split(/\s+/).slice(0, 2).join(" ");
      this.setRadarInterest(topic, -70);
    }
    if (!more && !less && prompt.trim()) {
      this.setRadarInterest(prompt.trim().slice(0, 32), 55);
    }
    return this.getRadar();
  },

  getPulse() {
    return pulseClips.map(withAuthor);
  },

  getPresence() {
    return AUTHORS.filter((a) => following.has(a.id)).sort((a, b) => b.closeness - a.closeness);
  },

  getMode() {
    return currentMode;
  },

  setMode(mode: FeedMode) {
    currentMode = mode;
    return currentMode;
  },

  getManifesto() {
    return {
      workingName: "FLUX",
      namePending: true,
      pillars: [
        {
          title: "Modi statt Einheits-Feed",
          from: "Bluesky Custom Feeds + LinkedIn Intent",
          text: "Chronik, Nah, Entdecken und Fokus — du wechselst bewusst, statt einem Algorithmus ausgeliefert zu sein.",
        },
        {
          title: "Radar: Du steuerst Interessen",
          from: "Instagram Your Algorithm",
          text: "Sag »mehr Reisen, weniger Drama« — der Feed folgt. Transparenz statt Blackbox.",
        },
        {
          title: "Moments, die kristallisieren",
          from: "BeReal + Stories",
          text: "Ephemere Authentizität. Erreicht ein Moment genug Resonanz, wird er dauerhaft — ohne Performance-Druck am Start.",
        },
        {
          title: "Circles = Threads + Live",
          from: "Reddit + Discord",
          text: "Wissen bleibt suchbar. Präsenz bleibt lebendig. Eine Community, zwei Oberflächen.",
        },
        {
          title: "Resonanz statt Like",
          from: "Reddit Upvotes + IG Saves",
          text: "Zählt, was hält: Speichern, Antworten, Teilen — nicht der schnelle Doppeltap.",
        },
        {
          title: "Presence Rings",
          from: "Snap Close Friends",
          text: "Nähe sichtbar machen. Der Kern deines Graphen sind echte Interaktionen, keine Follower-Zahlen.",
        },
        {
          title: "Pulse mit Absicht",
          from: "TikTok Discovery",
          text: "Vertikales Entdecken — plus Sofort-Korrektur »mehr / weniger davon«.",
        },
        {
          title: "Signale & Essays",
          from: "X + LinkedIn",
          text: "Kurz denken oder tief schreiben — derselbe Graph, verschiedene Tiefen.",
        },
      ],
    };
  },
};
