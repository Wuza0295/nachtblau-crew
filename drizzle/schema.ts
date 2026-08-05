import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  handle: varchar("handle", { length: 64 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  mood: varchar("mood", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Circles (Reddit communities × Discord servers) ───────────────────────────
export const circles = mysqlTable("circles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  topic: varchar("topic", { length: 64 }).notNull(),
  coverGradient: varchar("coverGradient", { length: 256 }),
  icon: varchar("icon", { length: 64 }),
  memberCount: int("memberCount").default(0).notNull(),
  postCount: int("postCount").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Circle = typeof circles.$inferSelect;

export const circleMembers = mysqlTable(
  "circle_members",
  {
    id: int("id").autoincrement().primaryKey(),
    circleId: int("circleId")
      .notNull()
      .references(() => circles.id),
    userId: int("userId")
      .notNull()
      .references(() => users.id),
    role: mysqlEnum("memberRole", ["member", "moderator", "owner"])
      .default("member")
      .notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("circle_user_uidx").on(t.circleId, t.userId)]
);

export type CircleMember = typeof circleMembers.$inferSelect;

// ─── Posts / Streams (multi-format: text, image, essay, signal) ────────────────
export const posts = mysqlTable(
  "posts",
  {
    id: int("id").autoincrement().primaryKey(),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id),
    circleId: int("circleId").references(() => circles.id),
    type: mysqlEnum("postType", ["text", "image", "essay", "signal"])
      .default("text")
      .notNull(),
    title: varchar("title", { length: 256 }),
    content: text("content").notNull(),
    mediaUrl: text("mediaUrl"),
    topic: varchar("topic", { length: 64 }).notNull(),
    resonanceScore: int("resonanceScore").default(0).notNull(),
    commentCount: int("commentCount").default(0).notNull(),
    isAiLabeled: boolean("isAiLabeled").default(false),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("posts_topic_idx").on(t.topic),
    index("posts_created_idx").on(t.createdAt),
    index("posts_circle_idx").on(t.circleId),
  ]
);

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Comments ─────────────────────────────────────────────────────────────────
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;

// ─── Resonance (weighted reactions that train YOUR feed) ──────────────────────
export const resonances = mysqlTable(
  "resonances",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId")
      .notNull()
      .references(() => posts.id),
    userId: int("userId")
      .notNull()
      .references(() => users.id),
    weight: int("weight").default(1).notNull(), // 1 soft / 2 strong / 3 deep
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("resonance_uidx").on(t.postId, t.userId)]
);

export type Resonance = typeof resonances.$inferSelect;

// ─── Pulse Dials (user-controlled algorithm) ──────────────────────────────────
export const pulseDials = mysqlTable(
  "pulse_dials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id),
    topic: varchar("topic", { length: 64 }).notNull(),
    weight: int("weight").default(50).notNull(), // 0–100
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("dial_uidx").on(t.userId, t.topic)]
);

export type PulseDial = typeof pulseDials.$inferSelect;

// ─── Follows ──────────────────────────────────────────────────────────────────
export const follows = mysqlTable(
  "follows",
  {
    id: int("id").autoincrement().primaryKey(),
    followerId: int("followerId")
      .notNull()
      .references(() => users.id),
    followingId: int("followingId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("follow_uidx").on(t.followerId, t.followingId)]
);

export type Follow = typeof follows.$inferSelect;

// ─── Boards (Pinterest-style collections) ─────────────────────────────────────
export const boards = mysqlTable("boards", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Board = typeof boards.$inferSelect;

export const boardItems = mysqlTable(
  "board_items",
  {
    id: int("id").autoincrement().primaryKey(),
    boardId: int("boardId")
      .notNull()
      .references(() => boards.id),
    postId: int("postId")
      .notNull()
      .references(() => posts.id),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("board_post_uidx").on(t.boardId, t.postId)]
);

export type BoardItem = typeof boardItems.$inferSelect;
