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
  craftTitle: varchar("craftTitle", { length: 128 }),
  craftBio: text("craftBio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Social posts (persisted when DB available) ───────────────────────────────
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId")
    .notNull()
    .references(() => users.id),
  lens: mysqlEnum("lens", ["pulse", "canvas", "stream", "depth"]).notNull(),
  body: text("body").notNull(),
  mediaUrl: text("mediaUrl"),
  circleSlug: varchar("circleSlug", { length: 128 }),
  tags: text("tags"),
  amplifyCount: int("amplifyCount").default(0),
  echoCount: int("echoCount").default(0),
  agreeCount: int("agreeCount").default(0),
  collectCount: int("collectCount").default(0),
  commentCount: int("commentCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;

export const socialCircles = mysqlTable("social_circles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  cover: text("cover"),
  memberCount: int("memberCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialCircle = typeof socialCircles.$inferSelect;
