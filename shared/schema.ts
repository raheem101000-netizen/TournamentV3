import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id"),
  name: text("name").notNull(),
  game: text("game"),
  format: text("format", { enum: ["round_robin", "single_elimination", "swiss"] }).notNull(),
  status: text("status", { enum: ["upcoming", "in_progress", "completed"] }).notNull().default("upcoming"),
  totalTeams: integer("total_teams").notNull(),
  currentRound: integer("current_round").default(1),
  swissRounds: integer("swiss_rounds"),
  imageUrl: text("image_url"),
  posterWidth: integer("poster_width"),
  posterHeight: integer("poster_height"),
  prizeReward: text("prize_reward"),
  entryFee: text("entry_fee"),
  visibility: text("visibility", { enum: ["public", "private"] }).default("public"),
  paymentLink: text("payment_link"),
  paymentInstructions: text("payment_instructions"),
  organizerId: varchar("organizer_id"),
  organizerName: text("organizer_name"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  platform: text("platform"),
  region: text("region"),
  isFrozen: integer("is_frozen").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tournaments_server_id").on(table.serverId),
  index("idx_tournaments_status").on(table.status),
  index("idx_tournaments_visibility").on(table.visibility),
  index("idx_tournaments_organizer_id").on(table.organizerId),
]);

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tournamentId: varchar("tournament_id").notNull(),
  game: text("game"),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  points: integer("points").default(0),
  isRemoved: integer("is_removed").default(0),
}, (table) => [
  index("idx_teams_tournament_id").on(table.tournamentId),
]);

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull(),
  team1Id: varchar("team1_id"),
  team2Id: varchar("team2_id"),
  winnerId: varchar("winner_id"),
  round: integer("round").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).notNull().default("pending"),
  team1Score: integer("team1_score"),
  team2Score: integer("team2_score"),
  isBye: integer("is_bye").default(0),
}, (table) => [
  index("idx_matches_tournament_id").on(table.tournamentId),
  index("idx_matches_status").on(table.status),
]);

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull(),
  teamId: varchar("team_id"),
  userId: varchar("user_id"),
  message: text("message"),
  imageUrl: text("image_url"),
  replyToId: varchar("reply_to_id"),
  isSystem: integer("is_system").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_messages_match_id").on(table.matchId),
]);

export const registrationConfigs = pgTable("registration_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull(),
  requiresPayment: integer("requires_payment").default(0),
  entryFee: text("entry_fee"),
  paymentUrl: text("payment_url"),
  paymentInstructions: text("payment_instructions"),
  headerFieldId: varchar("header_field_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registrationSteps = pgTable("registration_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configId: varchar("config_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  stepTitle: text("step_title").notNull(),
  stepDescription: text("step_description"),
});

export const registrationFields = pgTable("registration_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stepId: varchar("step_id").notNull(),
  fieldType: text("field_type", { enum: ["text", "dropdown", "yesno"] }).notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldPlaceholder: text("field_placeholder"),
  isRequired: integer("is_required").default(1),
  dropdownOptions: text("dropdown_options"),
  displayOrder: integer("display_order").notNull(),
});

export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull(),
  userId: varchar("user_id").notNull(),
  teamName: text("team_name").notNull(),
  contactEmail: text("contact_email"),
  status: text("status", { enum: ["draft", "submitted", "approved", "rejected"] }).notNull().default("draft"),
  paymentStatus: text("payment_status", { enum: ["pending", "submitted", "verified", "rejected"] }).default("pending"),
  paymentProofUrl: text("payment_proof_url"),
  paymentTransactionId: text("payment_transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_registrations_tournament_id").on(table.tournamentId),
  index("idx_registrations_user_id").on(table.userId),
  index("idx_registrations_status").on(table.status),
]);

export const registrationResponses = pgTable("registration_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").notNull(),
  fieldId: varchar("field_id").notNull(),
  responseValue: text("response_value").notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments)
  .omit({
    id: true,
    createdAt: true,
    currentRound: true,
    status: true,
  })
  .extend({
    startDate: z.union([z.string(), z.date()]).transform((val) =>
      typeof val === 'string' ? new Date(val) : val
    ).nullable().optional(),
    endDate: z.union([z.string(), z.date()]).transform((val) =>
      typeof val === 'string' ? new Date(val) : val
    ).nullable().optional(),
    visibility: z.enum(["public", "private"]).optional(),
    // Allow extra fields needed by POST endpoint but not in DB
    teamNames: z.array(z.string()).optional(),
    registrationConfig: z.any().optional(),
    serverId: z.string().optional(),
  }).passthrough();

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  wins: true,
  losses: true,
  points: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().optional(),
  message: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  replyToId: z.string().optional().nullable(),
});

export const insertRegistrationConfigSchema = createInsertSchema(registrationConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertRegistrationStepSchema = createInsertSchema(registrationSteps).omit({
  id: true,
});

export const insertRegistrationFieldSchema = createInsertSchema(registrationFields).omit({
  id: true,
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().optional(),
});

export const insertRegistrationResponseSchema = createInsertSchema(registrationResponses).omit({
  id: true,
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect & {
  username?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
};
export type EnrichedChatMessage = ChatMessage & { username: string };
export type InsertRegistrationConfig = z.infer<typeof insertRegistrationConfigSchema>;
export type RegistrationConfig = typeof registrationConfigs.$inferSelect;
export type InsertRegistrationStep = z.infer<typeof insertRegistrationStepSchema>;
export type RegistrationStep = typeof registrationSteps.$inferSelect;
export type InsertRegistrationField = z.infer<typeof insertRegistrationFieldSchema>;
export type RegistrationField = typeof registrationFields.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistrationResponse = z.infer<typeof insertRegistrationResponseSchema>;
export type RegistrationResponse = typeof registrationResponses.$inferSelect;

export const servers = pgTable("servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  welcomeMessage: text("welcome_message"),
  memberCount: integer("member_count").default(0),
  iconUrl: text("icon_url"),
  backgroundUrl: text("background_url"),
  category: text("category"),
  gameTags: text("game_tags").array(),
  isPublic: integer("is_public").default(1),
  isVerified: integer("is_verified").default(0),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_servers_is_public").on(table.isPublic),
  index("idx_servers_is_verified").on(table.isVerified),
  index("idx_servers_owner_id").on(table.ownerId),
]);

export const channelCategories = pgTable("channel_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull(),
  name: text("name").notNull(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_channel_categories_server_id").on(table.serverId),
]);

export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull(),
  categoryId: varchar("category_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull(),
  icon: text("icon").notNull().default("📝"),
  isPrivate: integer("is_private").default(0),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_channels_server_id").on(table.serverId),
]);

export const channelMessages = pgTable("channel_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  message: text("message"),
  imageUrl: text("image_url"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  replyToId: varchar("reply_to_id"),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_channel_messages_channel_id").on(table.channelId),
]);

export const messageThreads = pgTable("message_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  participantId: varchar("participant_id"),
  matchId: varchar("match_id"),
  participantName: text("participant_name").notNull(),
  participantAvatar: text("participant_avatar"),
  lastMessage: text("last_message").notNull(),
  lastMessageSenderId: varchar("last_message_sender_id"),
  lastMessageTime: timestamp("last_message_time").defaultNow().notNull(),
  unreadCount: integer("unread_count").default(0),
});

export const threadMessages = pgTable("thread_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  message: text("message"),
  imageUrl: text("image_url"),
  replyToId: varchar("reply_to_id"),
  tournamentId: varchar("tournament_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enriched version with user data
export type EnrichedThreadMessage = typeof threadMessages.$inferSelect & {
  displayName?: string;
  avatarUrl?: string;
};

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  senderId: varchar("sender_id"),
  type: text("type", { enum: ["match_result", "friend_request", "tournament_alert", "system"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: integer("is_read").default(0),
  read: integer("read").default(0),
  actionUrl: text("action_url"),
});

export const friendRequests = pgTable("friend_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
  createdAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.string().min(1, "Channel type is required"),
  icon: z.string().min(1, "Channel icon is required"),
});

export const insertChannelMessageSchema = createInsertSchema(channelMessages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
  deletedAt: true,
});

export const insertMessageThreadSchema = createInsertSchema(messageThreads).omit({
  id: true,
  lastMessageTime: true,
});

export const insertThreadMessageSchema = createInsertSchema(threadMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  message: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  replyToId: z.string().optional().nullable(),
  tournamentId: z.string().optional().nullable(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  timestamp: true,
});

export const insertFriendRequestSchema = createInsertSchema(friendRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannelMessage = z.infer<typeof insertChannelMessageSchema>;
export type ChannelMessage = typeof channelMessages.$inferSelect;
export type InsertMessageThread = z.infer<typeof insertMessageThreadSchema>;
export type MessageThread = typeof messageThreads.$inferSelect;
export type InsertThreadMessage = z.infer<typeof insertThreadMessageSchema>;
export type ThreadMessage = typeof threadMessages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type FriendRequest = typeof friendRequests.$inferSelect;

export const posterTemplates = pgTable("poster_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  backgroundImageUrl: text("background_image_url").notNull(),
  category: text("category").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const posterTemplateTags = pgTable("poster_template_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  tag: text("tag").notNull(),
});

export const insertPosterTemplateSchema = createInsertSchema(posterTemplates).omit({
  id: true,
});

export const insertPosterTemplateTagSchema = createInsertSchema(posterTemplateTags).omit({
  id: true,
});

export type InsertPosterTemplate = z.infer<typeof insertPosterTemplateSchema>;
export type PosterTemplate = typeof posterTemplates.$inferSelect;
export type InsertPosterTemplateTag = z.infer<typeof insertPosterTemplateTagSchema>;
export type PosterTemplateTag = typeof posterTemplateTags.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  passwordHash: text("password_hash"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  language: text("language").default("en"),
  isDisabled: integer("is_disabled").default(0),
  isBanned: integer("is_banned").default(0),
  isAdmin: integer("is_admin").default(0),
  canHostTournaments: integer("can_host_tournaments").default(1),
  canIssueAchievements: integer("can_issue_achievements").default(1),
  role: text("role", { enum: ["player", "organizer", "admin"] }).default("player"),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  rankTitle: text("rank_title").default("Rookie"),
  totalTournaments: integer("total_tournaments").default(0),
  totalWins: integer("total_wins").default(0),
  emailVerified: integer("email_verified").default(0),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  serverId: varchar("server_id"),
  title: text("title").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  reward: text("reward"),
  game: text("game"),
  region: text("region"),
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
  category: text("category"),
  type: text("type", { enum: ["solo", "team"] }).notNull(),
  awardedBy: varchar("awarded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamProfiles = pgTable("team_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tag: text("tag"),
  bio: text("bio"),
  game: text("game"),
  logoUrl: text("logo_url"),
  ownerId: varchar("owner_id").notNull(),
  totalMembers: integer("total_members").default(1),
  totalTournaments: integer("total_tournaments").default(0),
  totalWins: integer("total_wins").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").default("Member"),
  position: text("position"),
  game: text("game"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const serverMembers = pgTable("server_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull(),
  userId: varchar("user_id").notNull(),
  roleId: varchar("role_id"),
  role: text("role").default("Member"),
  customTitle: text("custom_title"),
  explicitPermissions: text("explicit_permissions").array().default(sql`ARRAY[]::text[]`),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  index("idx_server_members_server_id").on(table.serverId),
  index("idx_server_members_user_id").on(table.userId),
]);

export const serverRoles = pgTable("server_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#99AAB5"),
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serverBans = pgTable("server_bans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull(),
  userId: varchar("user_id").notNull(),
  reason: text("reason"),
  bannedBy: varchar("banned_by").notNull(),
  bannedAt: timestamp("banned_at").defaultNow().notNull(),
});

export const serverInvites = pgTable("server_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull(),
  code: text("code").notNull().unique(),
  createdBy: varchar("created_by").notNull(),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizerPermissions = pgTable("organizer_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: varchar("organizer_id").notNull(),
  canGiveAchievements: integer("can_give_achievements").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportedUserId: varchar("reported_user_id").notNull(),
  reportedBy: varchar("reported_by").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "resolved", "dismissed"] }).default("pending"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerServiceMessages = pgTable("customer_service_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(),
  status: text("status", { enum: ["new", "in_progress", "resolved"] }).default("new"),
  response: text("response"),
  respondedBy: varchar("responded_by"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  level: true,
  xp: true,
  totalTournaments: true,
  totalWins: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  achievedAt: true,
});

export const insertTeamProfileSchema = createInsertSchema(teamProfiles).omit({
  id: true,
  createdAt: true,
  totalMembers: true,
  totalTournaments: true,
  totalWins: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertServerMemberSchema = createInsertSchema(serverMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertChannelCategorySchema = createInsertSchema(channelCategories).omit({
  id: true,
  createdAt: true,
});

export const insertServerRoleSchema = createInsertSchema(serverRoles).omit({
  id: true,
  createdAt: true,
});

export const insertServerBanSchema = createInsertSchema(serverBans).omit({
  id: true,
  bannedAt: true,
});

export const insertServerInviteSchema = createInsertSchema(serverInvites).omit({
  id: true,
  createdAt: true,
  currentUses: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertTeamProfile = z.infer<typeof insertTeamProfileSchema>;
export type TeamProfile = typeof teamProfiles.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertServerMember = z.infer<typeof insertServerMemberSchema>;
export type ServerMember = typeof serverMembers.$inferSelect;
export type InsertChannelCategory = z.infer<typeof insertChannelCategorySchema>;
export type ChannelCategory = typeof channelCategories.$inferSelect;
export type InsertServerRole = z.infer<typeof insertServerRoleSchema>;
export type ServerRole = typeof serverRoles.$inferSelect;
export type InsertServerBan = z.infer<typeof insertServerBanSchema>;
export type ServerBan = typeof serverBans.$inferSelect;
export type InsertServerInvite = z.infer<typeof insertServerInviteSchema>;
export type ServerInvite = typeof serverInvites.$inferSelect;

export const insertOrganizerPermissionSchema = createInsertSchema(organizerPermissions).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertCustomerServiceMessageSchema = createInsertSchema(customerServiceMessages).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type InsertOrganizerPermission = z.infer<typeof insertOrganizerPermissionSchema>;
export type OrganizerPermission = typeof organizerPermissions.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertCustomerServiceMessage = z.infer<typeof insertCustomerServiceMessageSchema>;
export type CustomerServiceMessage = typeof customerServiceMessages.$inferSelect;

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { mode: 'date' }).notNull(),
});

export type Session = typeof session.$inferSelect;

export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // Base64 encoded content
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
