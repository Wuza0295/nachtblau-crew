import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ─────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  handle: varchar("handle", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Social Circles ───────────────────────────────────────────────────────────
export const circles = mysqlTable("circles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  topic: varchar("topic", { length: 64 }),
  accent: varchar("accent", { length: 32 }),
  memberCount: int("memberCount").default(0),
  isGathering: boolean("isGathering").default(false),
  gatheringTitle: text("gatheringTitle"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CircleRow = typeof circles.$inferSelect;

// ─── Posts ────────────────────────────────────────────────────────────────────
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  type: mysqlEnum("type", ["pulse", "frame", "signal", "moment"]).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  mediaGradient: text("mediaGradient"),
  mediaLabel: varchar("mediaLabel", { length: 128 }),
  circleId: int("circleId"),
  parentId: int("parentId"),
  sparkCount: int("sparkCount").default(0),
  depthCount: int("depthCount").default(0),
  echoCount: int("echoCount").default(0),
  replyCount: int("replyCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type PostRow = typeof posts.$inferSelect;

// ─── Resonances ───────────────────────────────────────────────────────────────
export const resonances = mysqlTable("resonances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  type: mysqlEnum("type", ["spark", "depth", "echo"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Follows ──────────────────────────────────────────────────────────────────
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId")
    .notNull()
    .references(() => users.id),
  followingId: int("followingId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Circle memberships ───────────────────────────────────────────────────────
export const circleMembers = mysqlTable("circle_members", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId")
    .notNull()
    .references(() => circles.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  role: mysqlEnum("role", ["member", "steward"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
