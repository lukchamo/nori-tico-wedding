CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invitation_id` integer,
	`type` text NOT NULL,
	`author` text DEFAULT 'sistema' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_invitation_idx` ON `activities` (`invitation_id`);--> statement-breakpoint
CREATE INDEX `activities_created_idx` ON `activities` (`created_at`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`invitation_id` integer,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `chat_session_idx` ON `chat_messages` (`session_id`);--> statement-breakpoint
CREATE TABLE `guests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invitation_id` integer NOT NULL,
	`name` text NOT NULL,
	`relation` text DEFAULT '' NOT NULL,
	`is_child` integer DEFAULT false NOT NULL,
	`attending` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `guests_invitation_idx` ON `guests` (`invitation_id`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'Familia' NOT NULL,
	`seats` integer DEFAULT 1 NOT NULL,
	`phone` text,
	`tags` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'admin' NOT NULL,
	`sent_at` integer,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`first_opened_at` integer,
	`last_opened_at` integer,
	`open_count` integer DEFAULT 0 NOT NULL,
	`rsvp_status` text DEFAULT 'pending' NOT NULL,
	`rsvp_attending` integer,
	`rsvp_message` text,
	`rsvp_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_code_unique` ON `invitations` (`code`);--> statement-breakpoint
CREATE INDEX `invitations_rsvp_idx` ON `invitations` (`rsvp_status`);--> statement-breakpoint
CREATE INDEX `invitations_name_idx` ON `invitations` (`name`);