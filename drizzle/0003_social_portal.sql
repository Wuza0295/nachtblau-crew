-- Social portal tables
CREATE TABLE IF NOT EXISTS `circles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(128) NOT NULL,
  `slug` varchar(128) NOT NULL,
  `description` text,
  `icon` varchar(64),
  `accentColor` varchar(32),
  `memberCount` int DEFAULT 0,
  `isOfficial` boolean DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `circles_id` PRIMARY KEY(`id`),
  CONSTRAINT `circles_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `circle_members` (
  `id` int AUTO_INCREMENT NOT NULL,
  `circleId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('member','moderator') NOT NULL DEFAULT 'member',
  `joinedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `circle_members_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `follows` (
  `id` int AUTO_INCREMENT NOT NULL,
  `followerId` int NOT NULL,
  `followingId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `authorId` int NOT NULL,
  `circleId` int,
  `type` enum('wave','flash','moment','story') NOT NULL,
  `content` text,
  `mediaUrl` text,
  `mediaAspect` enum('square','portrait','landscape'),
  `momentPrompt` varchar(256),
  `visibility` enum('public','followers','circle') NOT NULL DEFAULT 'public',
  `expiresAt` timestamp,
  `reactionCount` int DEFAULT 0,
  `commentCount` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `post_reactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `kind` enum('love','fire','insight','celebrate','support') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `post_reactions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `social_comments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `authorId` int NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `social_comments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `hashtags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tag` varchar(64) NOT NULL,
  `useCount` int DEFAULT 0,
  CONSTRAINT `hashtags_id` PRIMARY KEY(`id`),
  CONSTRAINT `hashtags_tag_unique` UNIQUE(`tag`)
);

CREATE TABLE IF NOT EXISTS `post_hashtags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `hashtagId` int NOT NULL,
  CONSTRAINT `post_hashtags_id` PRIMARY KEY(`id`)
);

ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `handle` varchar(32);
