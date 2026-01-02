CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"server_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"icon_url" text,
	"reward" text,
	"game" text,
	"region" text,
	"achieved_at" timestamp DEFAULT now() NOT NULL,
	"category" text,
	"type" text NOT NULL,
	"awarded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"message" text,
	"image_url" text,
	"file_url" text,
	"file_name" text,
	"reply_to_id" varchar,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar NOT NULL,
	"category_id" varchar,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"icon" text DEFAULT '📝' NOT NULL,
	"is_private" integer DEFAULT 0,
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" varchar NOT NULL,
	"team_id" varchar,
	"user_id" varchar,
	"message" text,
	"image_url" text,
	"reply_to_id" varchar,
	"is_system" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_service_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'new',
	"response" text,
	"responded_by" varchar,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friend_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"team1_id" varchar,
	"team2_id" varchar,
	"winner_id" varchar,
	"round" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"team1_score" integer,
	"team2_score" integer,
	"is_bye" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"participant_id" varchar,
	"match_id" varchar,
	"participant_name" text NOT NULL,
	"participant_avatar" text,
	"last_message" text NOT NULL,
	"last_message_sender_id" varchar,
	"last_message_time" timestamp DEFAULT now() NOT NULL,
	"unread_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"sender_id" varchar,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"is_read" integer DEFAULT 0,
	"read" integer DEFAULT 0,
	"action_url" text
);
--> statement-breakpoint
CREATE TABLE "organizer_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" varchar NOT NULL,
	"can_give_achievements" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster_template_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"tag" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"background_image_url" text NOT NULL,
	"category" text NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"requires_payment" integer DEFAULT 0,
	"entry_fee" text,
	"payment_url" text,
	"payment_instructions" text,
	"header_field_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_id" varchar NOT NULL,
	"field_type" text NOT NULL,
	"field_label" text NOT NULL,
	"field_placeholder" text,
	"is_required" integer DEFAULT 1,
	"dropdown_options" text,
	"display_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" varchar NOT NULL,
	"field_id" varchar NOT NULL,
	"response_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"step_title" text NOT NULL,
	"step_description" text
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"team_name" text NOT NULL,
	"contact_email" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"payment_proof_url" text,
	"payment_transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reported_user_id" varchar NOT NULL,
	"reported_by" varchar NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_bans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reason" text,
	"banned_by" varchar NOT NULL,
	"banned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar NOT NULL,
	"code" text NOT NULL,
	"created_by" varchar NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "server_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role_id" varchar,
	"role" text DEFAULT 'Member',
	"custom_title" text,
	"explicit_permissions" text[] DEFAULT ARRAY[]::text[],
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#99AAB5',
	"permissions" text[] DEFAULT ARRAY[]::text[],
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"welcome_message" text,
	"member_count" integer DEFAULT 0,
	"icon_url" text,
	"background_url" text,
	"category" text,
	"game_tags" text[],
	"is_public" integer DEFAULT 1,
	"is_verified" integer DEFAULT 0,
	"owner_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'Member',
	"position" text,
	"game" text,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tag" text,
	"bio" text,
	"game" text,
	"logo_url" text,
	"owner_id" varchar NOT NULL,
	"total_members" integer DEFAULT 1,
	"total_tournaments" integer DEFAULT 0,
	"total_wins" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tournament_id" varchar NOT NULL,
	"game" text,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"is_removed" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "thread_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"message" text,
	"image_url" text,
	"reply_to_id" varchar,
	"tournament_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" varchar,
	"name" text NOT NULL,
	"game" text,
	"format" text NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"total_teams" integer NOT NULL,
	"current_round" integer DEFAULT 1,
	"swiss_rounds" integer,
	"image_url" text,
	"poster_width" integer,
	"poster_height" integer,
	"prize_reward" text,
	"entry_fee" text,
	"visibility" text DEFAULT 'public',
	"payment_link" text,
	"payment_instructions" text,
	"organizer_id" varchar,
	"organizer_name" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"platform" text,
	"region" text,
	"is_frozen" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"full_name" text,
	"password_hash" text,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"language" text DEFAULT 'en',
	"is_disabled" integer DEFAULT 0,
	"is_banned" integer DEFAULT 0,
	"is_admin" integer DEFAULT 0,
	"can_host_tournaments" integer DEFAULT 1,
	"can_issue_achievements" integer DEFAULT 1,
	"role" text DEFAULT 'player',
	"level" integer DEFAULT 1,
	"xp" integer DEFAULT 0,
	"rank_title" text DEFAULT 'Rookie',
	"total_tournaments" integer DEFAULT 0,
	"total_wins" integer DEFAULT 0,
	"email_verified" integer DEFAULT 0,
	"verification_token" text,
	"verification_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_channel_categories_server_id" ON "channel_categories" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_channel_messages_channel_id" ON "channel_messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_channels_server_id" ON "channels" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_match_id" ON "chat_messages" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_matches_tournament_id" ON "matches" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "idx_matches_status" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_registrations_tournament_id" ON "registrations" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "idx_registrations_user_id" ON "registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_registrations_status" ON "registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_server_members_server_id" ON "server_members" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_server_members_user_id" ON "server_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_servers_is_public" ON "servers" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_servers_is_verified" ON "servers" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_servers_owner_id" ON "servers" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_teams_tournament_id" ON "teams" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "idx_tournaments_server_id" ON "tournaments" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_tournaments_status" ON "tournaments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tournaments_visibility" ON "tournaments" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_tournaments_organizer_id" ON "tournaments" USING btree ("organizer_id");