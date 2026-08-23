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
  handle: varchar("handle", { length: 32 }).unique(),
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

// ─── Social Portal: Communities (Reddit/Discord hybrid) ───────────────────────
export const socialCommunities = mysqlTable("social_communities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  iconEmoji: varchar("iconEmoji", { length: 8 }).default("✨"),
  memberCount: int("memberCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialCommunity = typeof socialCommunities.$inferSelect;

export const socialCommunityMembers = mysqlTable("social_community_members", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId")
    .notNull()
    .references(() => socialCommunities.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  role: mysqlEnum("role", ["member", "moderator"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── Follow graph (Instagram/Twitter) ─────────────────────────────────────────
export const socialFollows = mysqlTable("social_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId")
    .notNull()
    .references(() => users.id),
  followingId: int("followingId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Posts (multi-format feed) ────────────────────────────────────────────────
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  communityId: int("communityId").references(() => socialCommunities.id),
  repostOfId: int("repostOfId"),
  postType: mysqlEnum("postType", [
    "text",
    "media",
    "poll",
    "spark",
    "article",
  ])
    .default("text")
    .notNull(),
  content: text("content").notNull(),
  mediaUrls: text("mediaUrls"),
  pollOptions: text("pollOptions"),
  topicTags: varchar("topicTags", { length: 512 }),
  intensityLevel: int("intensityLevel").default(2),
  repostCount: int("repostCount").default(0),
  commentCount: int("commentCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;

export const socialReactions = mysqlTable("social_reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  reactionType: mysqlEnum("reactionType", [
    "heart",
    "fire",
    "insight",
    "support",
    "laugh",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const socialBookmarks = mysqlTable("social_bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const socialPollVotes = mysqlTable("social_poll_votes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => socialPosts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  optionIndex: int("optionIndex").notNull(),
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

// ─── Stories (Instagram-style, 24h) ───────────────────────────────────────────
export const socialStories = mysqlTable("social_stories", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  mediaUrl: text("mediaUrl").notNull(),
  caption: varchar("caption", { length: 280 }),
  gradientStyle: varchar("gradientStyle", { length: 64 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialStory = typeof socialStories.$inferSelect;

export const socialStoryViews = mysqlTable("social_story_views", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId")
    .notNull()
    .references(() => socialStories.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

// ─── NachtBlau Webspace (nacht-blau.de Unterprojekt) ─────────────────────────
export const webspaceSites = mysqlTable("webspace_sites", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId")
    .notNull()
    .references(() => users.id),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  tagline: varchar("tagline", { length: 256 }),
  blocks: text("blocks").notNull(),
  theme: mysqlEnum("theme", ["midnight", "neon", "clean"]).default("midnight").notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"])
    .default("draft")
    .notNull(),
  kasProvisioned: boolean("kasProvisioned").default(false).notNull(),
  kasProvisionError: text("kasProvisionError"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WebspaceSite = typeof webspaceSites.$inferSelect;
export type InsertWebspaceSite = typeof webspaceSites.$inferInsert;
