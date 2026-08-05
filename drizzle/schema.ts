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

// ─── Social: Communities (Reddit / Discord Kreise) ───────────────────────────
export const communities = mysqlTable("communities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  iconEmoji: varchar("iconEmoji", { length: 16 }).default("🌐"),
  coverGradient: varchar("coverGradient", { length: 128 }).default("from-violet-600 to-cyan-500"),
  memberCount: int("memberCount").default(0),
  creatorId: int("creatorId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Community = typeof communities.$inferSelect;

export const communityMembers = mysqlTable("community_members", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId")
    .notNull()
    .references(() => communities.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  role: mysqlEnum("role", ["member", "moderator", "admin"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── Social: Follow graph (Instagram / X) ────────────────────────────────────
export const userFollows = mysqlTable("user_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId")
    .notNull()
    .references(() => users.id),
  followingId: int("followingId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Social: Feed posts (X + Instagram + LinkedIn) ───────────────────────────
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  communityId: int("communityId").references(() => communities.id),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  mediaType: mysqlEnum("mediaType", ["none", "image", "video"]).default("none").notNull(),
  postKind: mysqlEnum("postKind", ["feed", "pulse", "moment"]).default("feed").notNull(),
  repostOfId: int("repostOfId"),
  quoteText: text("quoteText"),
  upvoteCount: int("upvoteCount").default(0),
  reactionCount: int("reactionCount").default(0),
  commentCount: int("commentCount").default(0),
  saveCount: int("saveCount").default(0),
  shareCount: int("shareCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;

export const postVotes = mysqlTable("post_votes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  value: int("value").notNull(), // 1 or -1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postReactions = mysqlTable("post_reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postComments = mysqlTable("post_comments", {
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

export const postSaves = mysqlTable("post_saves", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Social: Stories (Instagram / Snapchat, 24h) ─────────────────────────────
export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  mediaUrl: text("mediaUrl"),
  caption: varchar("caption", { length: 280 }),
  backgroundStyle: varchar("backgroundStyle", { length: 64 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Story = typeof stories.$inferSelect;
