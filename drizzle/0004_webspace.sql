CREATE TABLE `webspace_sites` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `slug` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `tagline` varchar(256),
  `blocks` text NOT NULL,
  `theme` enum('midnight','neon','clean') NOT NULL DEFAULT 'midnight',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `kasProvisioned` boolean NOT NULL DEFAULT false,
  `kasProvisionError` text,
  `publishedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `webspace_sites_id` PRIMARY KEY(`id`),
  CONSTRAINT `webspace_sites_slug_unique` UNIQUE(`slug`),
  CONSTRAINT `webspace_sites_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
