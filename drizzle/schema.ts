import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
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
  vibe: varchar("vibe", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Circles (social distance graph) ──────────────────────────────────────────
export const circles = mysqlTable("circles", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId")
    .notNull()
    .references(() => users.id),
  memberId: int("memberId")
    .notNull()
    .references(() => users.id),
  tier: mysqlEnum("tier", ["inner", "orbit"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Circle = typeof circles.$inferSelect;

// ─── Spaces (interest communities) ────────────────────────────────────────────
export const spaces = mysqlTable("spaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  tone: varchar("tone", { length: 64 }),
  memberCount: int("memberCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Space = typeof spaces.$inferSelect;

export const spaceMembers = mysqlTable("space_members", {
  id: int("id").autoincrement().primaryKey(),
  spaceId: int("spaceId")
    .notNull()
    .references(() => spaces.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  role: mysqlEnum("role", ["member", "mod", "host"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── Posts ────────────────────────────────────────────────────────────────────
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  format: mysqlEnum("format", ["pulse", "frame", "depth", "moment"]).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  mediaAlt: varchar("mediaAlt", { length: 256 }),
  spaceId: int("spaceId").references(() => spaces.id),
  visibility: mysqlEnum("visibility", [
    "inner",
    "orbit",
    "horizon",
    "public",
  ])
    .default("orbit")
    .notNull(),
  resonateCount: int("resonateCount").default(0),
  saveCount: int("saveCount").default(0),
  amplifyCount: int("amplifyCount").default(0),
  commentCount: int("commentCount").default(0),
  isEphemeral: boolean("isEphemeral").default(false),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;

// ─── Reactions ────────────────────────────────────────────────────────────────
export const reactions = mysqlTable("reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  type: mysqlEnum("type", ["resonate", "save", "amplify"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reaction = typeof reactions.$inferSelect;

// ─── Collections (Pinterest-style boards) ─────────────────────────────────────
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const collectionItems = mysqlTable("collection_items", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId")
    .notNull()
    .references(() => collections.id),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});
