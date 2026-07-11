import { relations } from "drizzle-orm";
import { forumCategories, forumPosts, forumThreads, users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  threads: many(forumThreads),
  posts: many(forumPosts),
}));

export const forumCategoriesRelations = relations(forumCategories, ({ many }) => ({
  threads: many(forumThreads),
}));

export const forumThreadsRelations = relations(forumThreads, ({ one, many }) => ({
  category: one(forumCategories, {
    fields: [forumThreads.categoryId],
    references: [forumCategories.id],
  }),
  author: one(users, {
    fields: [forumThreads.authorId],
    references: [users.id],
  }),
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one }) => ({
  thread: one(forumThreads, {
    fields: [forumPosts.threadId],
    references: [forumThreads.id],
  }),
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
  }),
}));
