import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["user", "admin"]);
export const visibility = pgEnum("visibility", ["public", "followers", "friends"]);
export const mediaKind = pgEnum("media_kind", ["image", "video"]);
export const mediaStatus = pgEnum("media_status", [
  "initiated",
  "uploaded",
  "processing",
  "ready",
  "failed",
]);
export const dmPrivacy = pgEnum("dm_privacy", ["everyone", "friends", "followers", "none"]);

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 24 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  birthdate: date("birthdate").notNull(),
  displayName: varchar("display_name", { length: 80 }).notNull().default(""),
  bio: varchar("bio", { length: 500 }).notNull().default(""),
  role: accountRole("role").notNull().default("user"),
  isAdultVerified: boolean("is_adult_verified").notNull().default(false),
  dmPrivacy: dmPrivacy("dm_privacy").notNull().default("everyone"),
  avatarObjectKey: text("avatar_object_key"),
  legacyId: integer("legacy_id").unique(),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("users_username_lower_uq").on(table.username),
  uniqueIndex("users_email_lower_uq").on(table.email),
]);

export const refreshSessions = pgTable("refresh_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  deviceName: varchar("device_name", { length: 160 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt,
}, (table) => [index("refresh_sessions_user_idx").on(table.userId)]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: varchar("body", { length: 4_000 }).notNull().default(""),
  visibility: visibility("visibility").notNull().default("public"),
  isAdult: boolean("is_adult").notNull().default(false),
  legacyId: integer("legacy_id").unique(),
  createdAt,
  updatedAt,
}, (table) => [
  index("posts_created_idx").on(table.createdAt),
  index("posts_author_created_idx").on(table.authorId, table.createdAt),
]);

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  kind: mediaKind("kind").notNull(),
  status: mediaStatus("status").notNull().default("initiated"),
  mime: varchar("mime", { length: 127 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  objectKey: text("object_key").notNull().unique(),
  uploadId: text("upload_id"),
  size: bigint("size", { mode: "number" }).notNull(),
  checksumSha256: varchar("checksum_sha256", { length: 64 }),
  posterKey: text("poster_key"),
  optimizedKey: text("optimized_key"),
  hlsManifestKey: text("hls_manifest_key"),
  durationSeconds: integer("duration_seconds"),
  width: integer("width"),
  height: integer("height"),
  error: varchar("error", { length: 1_000 }),
  legacyId: integer("legacy_id").unique(),
  createdAt,
  updatedAt,
}, (table) => [
  index("media_owner_status_idx").on(table.ownerId, table.status),
  index("media_post_order_idx").on(table.postId, table.sortOrder),
]);

export const reactions = pgTable("reactions", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt,
}, (table) => [
  primaryKey({ columns: [table.postId, table.userId] }),
  index("reactions_user_idx").on(table.userId),
]);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: varchar("body", { length: 1_000 }).notNull(),
  createdAt,
}, (table) => [index("comments_post_created_idx").on(table.postId, table.createdAt)]);

export const follows = pgTable("follows", {
  followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt,
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
  index("follows_following_idx").on(table.followingId),
]);

export const dmThreads = pgTable("dm_threads", {
  id: serial("id").primaryKey(),
  userAId: integer("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userBId: integer("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("dm_threads_pair_uq").on(table.userAId, table.userBId),
]);

export const dmMessages = pgTable("dm_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => dmThreads.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: varchar("body", { length: 4_000 }).notNull(),
  createdAt,
}, (table) => [index("dm_messages_thread_idx").on(table.threadId, table.createdAt)]);

export const pushDevices = pgTable("push_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 16 }).notNull(),
  token: text("token").notNull().unique(),
  createdAt,
  updatedAt,
}, (table) => [index("push_devices_user_idx").on(table.userId)]);

export type User = typeof users.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Post = typeof posts.$inferSelect;
