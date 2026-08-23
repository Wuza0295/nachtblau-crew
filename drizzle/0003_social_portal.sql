CREATE TABLE IF NOT EXISTS `social_communities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(128) NOT NULL,
  `slug` varchar(128) NOT NULL,
  `description` text,
  `iconEmoji` varchar(8) DEFAULT '✨',
  `memberCount` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_communities_id` PRIMARY KEY(`id`),
  CONSTRAINT `social_communities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_community_members` (
  `id` int AUTO_INCREMENT NOT NULL,
  `communityId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('member','moderator') NOT NULL DEFAULT 'member',
  `joinedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_community_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_follows` (
  `id` int AUTO_INCREMENT NOT NULL,
  `followerId` int NOT NULL,
  `followingId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `authorId` int NOT NULL,
  `communityId` int,
  `repostOfId` int,
  `postType` enum('text','media','poll','spark','article') NOT NULL DEFAULT 'text',
  `content` text NOT NULL,
  `mediaUrls` text,
  `pollOptions` text,
  `topicTags` varchar(512),
  `intensityLevel` int DEFAULT 2,
  `repostCount` int DEFAULT 0,
  `commentCount` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_reactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `reactionType` enum('heart','fire','insight','support','laugh') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_bookmarks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_poll_votes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `optionIndex` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_poll_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_comments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `authorId` int NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_stories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `authorId` int NOT NULL,
  `mediaUrl` text NOT NULL,
  `caption` varchar(280),
  `gradientStyle` varchar(64),
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_story_views` (
  `id` int AUTO_INCREMENT NOT NULL,
  `storyId` int NOT NULL,
  `userId` int NOT NULL,
  `viewedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_story_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `handle` varchar(32);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_handle_unique` UNIQUE(`handle`);
