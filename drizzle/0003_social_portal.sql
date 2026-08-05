-- Social portal tables
CREATE TABLE `communities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`iconEmoji` varchar(16) DEFAULT '🌐',
	`coverGradient` varchar(128) DEFAULT 'from-violet-600 to-cyan-500',
	`memberCount` int DEFAULT 0,
	`creatorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communities_id` PRIMARY KEY(`id`),
	CONSTRAINT `communities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `community_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','moderator','admin') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`communityId` int,
	`content` text NOT NULL,
	`mediaUrl` text,
	`mediaType` enum('none','image','video') NOT NULL DEFAULT 'none',
	`postKind` enum('feed','pulse','moment') NOT NULL DEFAULT 'feed',
	`repostOfId` int,
	`quoteText` text,
	`upvoteCount` int DEFAULT 0,
	`reactionCount` int DEFAULT 0,
	`commentCount` int DEFAULT 0,
	`saveCount` int DEFAULT 0,
	`shareCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`value` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_saves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_saves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`mediaUrl` text,
	`caption` varchar(280),
	`backgroundStyle` varchar(64),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stories_id` PRIMARY KEY(`id`)
);
