CREATE TABLE `account` (
	`id` varchar(36) PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `Characters` (
	`series` tinyint unsigned NOT NULL,
	`sort` tinyint unsigned NOT NULL,
	`name` varchar(20) NOT NULL,
	CONSTRAINT PRIMARY KEY(`series`,`sort`),
	CONSTRAINT `name_unique` UNIQUE INDEX(`name`)
);
--> statement-breakpoint
CREATE TABLE `DailyOshiCount` (
	`snapshot_date` date NOT NULL,
	`oshi` varchar(20) NOT NULL,
	`related_chara` varchar(20) NOT NULL,
	`count` int unsigned NOT NULL,
	CONSTRAINT PRIMARY KEY(`snapshot_date`,`oshi`,`related_chara`)
);
--> statement-breakpoint
CREATE TABLE `LatestVotes` (
	`twitter_id` varchar(32) NOT NULL,
	`voted_date` date NOT NULL,
	`character_name` varchar(20) NOT NULL,
	`level` tinyint unsigned NOT NULL,
	CONSTRAINT PRIMARY KEY(`twitter_id`,`character_name`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) PRIMARY KEY,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `token_unique` UNIQUE INDEX(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`twitter_id` varchar(32),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `email_unique` UNIQUE INDEX(`email`),
	CONSTRAINT `twitter_id_unique` UNIQUE INDEX(`twitter_id`)
);
--> statement-breakpoint
CREATE TABLE `UserStates` (
	`twitter_id` varchar(20) NOT NULL,
	`recorded_date` date NOT NULL,
	`series` tinyint unsigned NOT NULL,
	`status` varchar(20) NOT NULL,
	CONSTRAINT PRIMARY KEY(`twitter_id`,`recorded_date`,`series`)
);
--> statement-breakpoint
CREATE TABLE `UserStatesMaster` (
	`state` varchar(20) PRIMARY KEY,
	`sort` tinyint unsigned NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) PRIMARY KEY,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `Votes` (
	`twitter_id` varchar(32) NOT NULL,
	`voted_date` date NOT NULL,
	`character_name` varchar(20) NOT NULL,
	`level` tinyint unsigned NOT NULL,
	CONSTRAINT PRIMARY KEY(`twitter_id`,`voted_date`,`character_name`)
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_oshi_date` ON `DailyOshiCount` (`oshi`,`snapshot_date`);--> statement-breakpoint
CREATE INDEX `idx_character_name` ON `LatestVotes` (`character_name`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `DailyOshiCount` ADD CONSTRAINT `DailyOshiCount_oshi_Characters_name_fkey` FOREIGN KEY (`oshi`) REFERENCES `Characters`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `DailyOshiCount` ADD CONSTRAINT `DailyOshiCount_related_chara_Characters_name_fkey` FOREIGN KEY (`related_chara`) REFERENCES `Characters`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `LatestVotes` ADD CONSTRAINT `LatestVotes_character_name_Characters_name_fkey` FOREIGN KEY (`character_name`) REFERENCES `Characters`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `UserStates` ADD CONSTRAINT `UserStates_status_UserStatesMaster_state_fkey` FOREIGN KEY (`status`) REFERENCES `UserStatesMaster`(`state`) ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `Votes` ADD CONSTRAINT `Votes_character_name_Characters_name_fkey` FOREIGN KEY (`character_name`) REFERENCES `Characters`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;