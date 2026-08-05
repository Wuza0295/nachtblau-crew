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
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  handle: varchar("handle", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Forum Categories ─────────────────────────────────────────────────────────
export const forumCategories = mysqlTable("forum_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ForumCategory = typeof forumCategories.$inferSelect;

// ─── Forum Threads ────────────────────────────────────────────────────────────
export const forumThreads = mysqlTable("forum_threads", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId")
    .notNull()
    .references(() => forumCategories.id),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false),
  isLocked: boolean("isLocked").default(false),
  viewCount: int("viewCount").default(0),
  replyCount: int("replyCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastReplyAt: timestamp("lastReplyAt").defaultNow().notNull(),
});

export type ForumThread = typeof forumThreads.$inferSelect;

// ─── Forum Posts (replies) ────────────────────────────────────────────────────
export const forumPosts = mysqlTable("forum_posts", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId")
    .notNull()
    .references(() => forumThreads.id),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumPost = typeof forumPosts.$inferSelect;

// ─── Social Portal: Circles (Reddit/Discord-style communities) ───────────────
export const circles = mysqlTable("circles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  accentColor: varchar("accentColor", { length: 32 }),
  memberCount: int("memberCount").default(0),
  isOfficial: boolean("isOfficial").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Circle = typeof circles.$inferSelect;

export const circleMembers = mysqlTable("circle_members", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId")
    .notNull()
    .references(() => circles.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  role: mysqlEnum("role", ["member", "moderator"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── Follow graph (Instagram/X-style) ───────────────────────────────────────
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

// ─── Unified posts: Wave / Flash / Moment / Story ───────────────────────────
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  circleId: int("circleId").references(() => circles.id),
  type: mysqlEnum("type", ["wave", "flash", "moment", "story"]).notNull(),
  content: text("content"),
  mediaUrl: text("mediaUrl"),
  mediaAspect: mysqlEnum("mediaAspect", ["square", "portrait", "landscape"]),
  momentPrompt: varchar("momentPrompt", { length: 256 }),
  visibility: mysqlEnum("visibility", ["public", "followers", "circle"])
    .default("public")
    .notNull(),
  expiresAt: timestamp("expiresAt"),
  reactionCount: int("reactionCount").default(0),
  commentCount: int("commentCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;

export const postReactions = mysqlTable("post_reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  kind: mysqlEnum("kind", ["love", "fire", "insight", "celebrate", "support"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const socialComments = mysqlTable("social_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const hashtags = mysqlTable("hashtags", {
  id: int("id").autoincrement().primaryKey(),
  tag: varchar("tag", { length: 64 }).notNull().unique(),
  useCount: int("useCount").default(0),
});

export const postHashtags = mysqlTable("post_hashtags", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  hashtagId: int("hashtagId")
    .notNull()
    .references(() => hashtags.id),
});
