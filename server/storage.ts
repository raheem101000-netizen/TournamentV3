import { eq, and, or, sql, ilike, isNull, desc } from "drizzle-orm";
import { db } from "./db.js";
import bcrypt from "bcrypt";
import {
  tournaments,
  teams,
  matches,
  chatMessages,
  registrationConfigs,
  registrationSteps,
  registrationFields,
  registrations,
  registrationResponses,
  servers,
  channels,
  channelCategories,
  messageThreads,
  threadMessages,
  notifications,
  posterTemplates,
  posterTemplateTags,
  users,
  achievements,
  teamProfiles,
  teamMembers,
  serverMembers,
  serverRoles,
  serverBans,
  serverInvites,
  channelMessages,
  organizerPermissions,
  reports,
  customerServiceMessages,
  type Tournament,
  type Team,
  type Match,
  type ChatMessage,
  type RegistrationConfig,
  type RegistrationStep,
  type RegistrationField,
  type Registration,
  type RegistrationResponse,
  type Server,
  type Channel,
  type ChannelCategory,
  type MessageThread,
  type ThreadMessage,
  type Notification,
  type PosterTemplate,
  type PosterTemplateTag,
  type User,
  type Achievement,
  type TeamProfile,
  type TeamMember,
  type ServerMember,
  type ServerRole,
  type ServerBan,
  type ServerInvite,
  type ChannelMessage,
  type InsertTournament,
  type InsertTeam,
  type InsertMatch,
  type InsertChatMessage,
  type InsertRegistrationConfig,
  type InsertRegistrationStep,
  type InsertRegistrationField,
  type InsertRegistration,
  type InsertRegistrationResponse,
  type InsertServer,
  type InsertChannel,
  type InsertChannelCategory,
  type InsertPosterTemplate,
  type InsertPosterTemplateTag,
  type InsertUser,
  type InsertAchievement,
  type InsertTeamProfile,
  type InsertTeamMember,
  type InsertServerMember,
  type InsertServerRole,
  type InsertServerBan,
  type OrganizerPermission,
  type Report,
  type CustomerServiceMessage,
  type InsertServerInvite,
  type InsertChannelMessage,
  type InsertMessageThread,
  type InsertThreadMessage,
  type InsertNotification,
  friendRequests,
  type FriendRequest,
  type InsertFriendRequest,
} from "../shared/schema.js";

export interface IStorage {
  // Tournament operations
  createTournament(data: InsertTournament): Promise<Tournament>;
  getTournament(id: string): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  updateTournament(id: string, data: Partial<Tournament>): Promise<Tournament | undefined>;

  // Team operations
  createTeam(data: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByTournament(tournamentId: string): Promise<Team[]>;
  updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined>;

  // Match operations
  createMatch(data: InsertMatch): Promise<Match>;
  getMatch(id: string): Promise<Match | undefined>;
  getMatchesByTournament(tournamentId: string): Promise<Match[]>;
  updateMatch(id: string, data: Partial<Match>): Promise<Match | undefined>;

  // Chat operations
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByMatch(matchId: string): Promise<ChatMessage[]>;
  updateChatMessage(id: string, data: { message?: string }): Promise<ChatMessage | undefined>;
  deleteChatMessage(id: string): Promise<void>;

  // Registration operations
  createRegistrationConfig(data: InsertRegistrationConfig): Promise<RegistrationConfig>;
  getRegistrationConfigByTournament(tournamentId: string): Promise<RegistrationConfig | undefined>;
  updateRegistrationConfig(id: string, data: Partial<RegistrationConfig>): Promise<RegistrationConfig | undefined>;
  deleteRegistrationConfig(configId: string): Promise<void>;

  createRegistrationStep(data: InsertRegistrationStep): Promise<RegistrationStep>;
  getStepsByConfig(configId: string): Promise<RegistrationStep[]>;
  updateRegistrationStep(id: string, data: Partial<RegistrationStep>): Promise<RegistrationStep | undefined>;
  deleteRegistrationStep(id: string): Promise<void>;

  createRegistrationField(data: InsertRegistrationField): Promise<RegistrationField>;
  getFieldsByStep(stepId: string): Promise<RegistrationField[]>;
  updateRegistrationField(id: string, data: Partial<RegistrationField>): Promise<RegistrationField | undefined>;
  deleteRegistrationField(id: string): Promise<void>;

  createRegistration(data: InsertRegistration): Promise<Registration>;
  getRegistration(id: string): Promise<Registration | undefined>;
  getRegistrationsByTournament(tournamentId: string): Promise<Registration[]>;
  updateRegistration(id: string, data: Partial<Registration>): Promise<Registration | undefined>;

  createRegistrationResponse(data: InsertRegistrationResponse): Promise<RegistrationResponse>;
  getResponsesByRegistration(registrationId: string): Promise<RegistrationResponse[]>;

  // Server operations
  createServer(data: InsertServer): Promise<Server>;
  getAllServers(): Promise<Server[]>;
  getServer(id: string): Promise<Server | undefined>;
  joinServer(serverId: string, userId: string): Promise<ServerMember>;
  getServersByUser(userId: string): Promise<Server[]>;
  isUserInServer(serverId: string, userId: string): Promise<boolean>;
  getServerMember(serverId: string, userId: string): Promise<ServerMember | undefined>;

  // Channel operations
  createChannel(data: InsertChannel): Promise<Channel>;
  getChannelsByServer(serverId: string): Promise<Channel[]>;
  getChannel(id: string): Promise<Channel | undefined>;
  updateChannel(id: string, data: Partial<Channel>): Promise<Channel | undefined>;
  deleteChannel(id: string): Promise<void>;

  // Channel category operations
  createChannelCategory(data: InsertChannelCategory): Promise<ChannelCategory>;
  getCategoriesByServer(serverId: string): Promise<ChannelCategory[]>;
  updateChannelCategory(id: string, data: Partial<ChannelCategory>): Promise<ChannelCategory | undefined>;
  deleteChannelCategory(id: string): Promise<void>;

  // Channel message operations
  createChannelMessage(data: InsertChannelMessage): Promise<ChannelMessage>;
  getChannelMessages(channelId: string, limit?: number): Promise<ChannelMessage[]>;
  searchChannelMessages(channelId: string, query: string): Promise<ChannelMessage[]>;
  deleteChannelMessage(id: string): Promise<void>;

  // Server role operations
  createServerRole(data: InsertServerRole): Promise<ServerRole>;
  getRolesByServer(serverId: string): Promise<ServerRole[]>;
  getRolesByUser(userId: string, serverId: string): Promise<ServerRole[]>;
  updateServerRole(id: string, data: Partial<ServerRole>): Promise<ServerRole | undefined>;
  deleteServerRole(id: string): Promise<void>;

  // Server ban operations
  createServerBan(data: InsertServerBan): Promise<ServerBan>;
  getBansByServer(serverId: string): Promise<ServerBan[]>;
  deleteBan(serverId: string, userId: string): Promise<void>;

  // Server invite operations
  createServerInvite(data: InsertServerInvite): Promise<ServerInvite>;
  getInvitesByServer(serverId: string): Promise<ServerInvite[]>;
  getInviteByCode(code: string): Promise<ServerInvite | undefined>;
  incrementInviteUse(code: string): Promise<void>;
  deleteInvite(id: string): Promise<void>;

  // Server update operations
  updateServer(id: string, data: Partial<Server>): Promise<Server | undefined>;

  // Mobile preview operations
  getAllMessageThreads(): Promise<MessageThread[]>;
  getMessageThreadsByUser(userId: string): Promise<MessageThread[]>;
  getMessageThreadsForParticipant(userId: string): Promise<MessageThread[]>;
  createMessageThread(data: InsertMessageThread): Promise<MessageThread>;
  getMessageThread(id: string): Promise<MessageThread | undefined>;
  updateMessageThread(id: string, data: Partial<MessageThread>): Promise<MessageThread | undefined>;
  createThreadMessage(data: InsertThreadMessage): Promise<ThreadMessage>;
  getThreadMessages(threadId: string): Promise<ThreadMessage[]>;
  updateThreadMessage(id: string, data: { message?: string }): Promise<ThreadMessage | undefined>;
  deleteThreadMessage(id: string): Promise<void>;
  getAllNotifications(): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  deleteFriendRequestNotifications(userId: string, senderId: string): Promise<void>;
  findExistingThread(userId: string, participantId: string): Promise<MessageThread | undefined>;
  getMatchThreadForUser(matchId: string, userId: string): Promise<MessageThread | undefined>;
  getOrCreateMatchThread(matchId: string, userId: string, participantName: string, participantAvatar?: string): Promise<MessageThread>;

  // Poster template operations
  createPosterTemplate(data: InsertPosterTemplate): Promise<PosterTemplate>;
  getAllPosterTemplates(): Promise<PosterTemplate[]>;
  getActivePosterTemplates(): Promise<PosterTemplate[]>;
  getPosterTemplate(id: string): Promise<PosterTemplate | undefined>;
  updatePosterTemplate(id: string, data: Partial<PosterTemplate>): Promise<PosterTemplate | undefined>;
  deletePosterTemplate(id: string): Promise<void>;

  createPosterTemplateTag(data: InsertPosterTemplateTag): Promise<PosterTemplateTag>;
  getTagsByTemplate(templateId: string): Promise<PosterTemplateTag[]>;
  deleteTagsByTemplate(templateId: string): Promise<void>;

  // User operations
  createUser(data: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  changeUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean>;
  deleteUser(id: string): Promise<void>;

  // Achievement operations
  createAchievement(data: InsertAchievement): Promise<Achievement>;
  getAchievementsByUser(userId: string): Promise<Achievement[]>;

  // Team profile operations
  createTeamProfile(data: InsertTeamProfile): Promise<TeamProfile>;
  getTeamProfile(id: string): Promise<TeamProfile | undefined>;
  getTeamProfilesByOwner(ownerId: string): Promise<TeamProfile[]>;
  updateTeamProfile(id: string, data: Partial<TeamProfile>): Promise<TeamProfile | undefined>;
  deleteTeamProfile(id: string): Promise<void>;

  // Team member operations
  createTeamMember(data: InsertTeamMember): Promise<TeamMember>;
  getTeamMember(memberId: string): Promise<TeamMember | undefined>;
  getMembersByTeam(teamId: string): Promise<TeamMember[]>;
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  getTeamMembersWithUsers(teamId: string): Promise<(TeamMember & { user: User | null })[]>;
  updateTeamMember(memberId: string, data: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteMemberFromTeam(teamId: string, userId: string): Promise<void>;

  // Server member operations
  createServerMember(data: InsertServerMember): Promise<ServerMember>;
  getMembersByServer(serverId: string): Promise<ServerMember[]>;
  getServerMemberByUserId(serverId: string, userId: string): Promise<ServerMember | undefined>;
  updateServerMember(serverId: string, userId: string, data: Partial<InsertServerMember>): Promise<ServerMember | undefined>;
  deleteMemberFromServer(serverId: string, userId: string): Promise<void>;
  getEffectivePermissions(serverId: string, userId: string): Promise<string[]>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getOrganizerUsers(): Promise<User[]>;
  getOrganizerPermission(organizerId: string): Promise<number | undefined>;
  updateOrganizerPermission(organizerId: string, data: Partial<OrganizerPermission>): Promise<OrganizerPermission | undefined>;
  getAllAchievements(): Promise<Achievement[]>;
  deleteAchievement(achievementId: string): Promise<void>;
  deleteTournament(tournamentId: string): Promise<void>;
  deleteServer(serverId: string): Promise<void>;
  getAllReports(): Promise<Report[]>;
  updateReport(reportId: string, data: Partial<Report>): Promise<Report | undefined>;
  getAllCustomerServiceMessages(): Promise<CustomerServiceMessage[]>;
  updateCustomerServiceMessage(messageId: string, data: Partial<CustomerServiceMessage>): Promise<CustomerServiceMessage | undefined>;

  // Admin moderation  
  banUser(userId: string): Promise<User | undefined>;
  unbanUser(userId: string): Promise<User | undefined>;
  setUserHostPermission(userId: string, canHost: boolean): Promise<User | undefined>;
  setUserAchievementPermission(userId: string, canIssue: boolean): Promise<User | undefined>;
  deleteAnyMessage(messageId: string, messageType: 'chat' | 'channel' | 'thread'): Promise<void>;

  // Friend request operations
  createFriendRequest(data: InsertFriendRequest): Promise<FriendRequest>;
  getFriendRequestBetweenUsers(userId1: string, userId2: string): Promise<FriendRequest | undefined>;
  getPendingFriendRequests(userId: string): Promise<FriendRequest[]>;
  updateFriendRequest(id: string, data: Partial<FriendRequest>): Promise<FriendRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Tournament operations
  async createTournament(data: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values(data).returning();
    return tournament;
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(tournaments.createdAt);
  }

  async updateTournament(id: string, data: Partial<Tournament>): Promise<Tournament | undefined> {
    const [tournament] = await db
      .update(tournaments)
      .set(data)
      .where(eq(tournaments.id, id))
      .returning();
    return tournament || undefined;
  }

  // Team operations
  async createTeam(data: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(data).returning();
    return team;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.tournamentId, tournamentId));
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  // Match operations
  async createMatch(data: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(data).returning();
    return match;
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();
    return match || undefined;
  }

  async deleteMatch(id: string): Promise<boolean> {
    await db.delete(matches).where(eq(matches.id, id));
    return true;
  }

  // Chat operations
  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  }

  async getChatMessagesByMatch(matchId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.matchId, matchId));
  }

  async updateChatMessage(id: string, data: { message?: string }): Promise<ChatMessage | undefined> {
    const [message] = await db
      .update(chatMessages)
      .set(data)
      .where(eq(chatMessages.id, id))
      .returning();
    return message || undefined;
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, id));
  }

  // Registration operations
  async createRegistrationConfig(data: InsertRegistrationConfig): Promise<RegistrationConfig> {
    const [config] = await db.insert(registrationConfigs).values(data).returning();
    return config;
  }

  async getRegistrationConfigByTournament(tournamentId: string): Promise<RegistrationConfig | undefined> {
    const [config] = await db.select().from(registrationConfigs).where(eq(registrationConfigs.tournamentId, tournamentId));
    return config || undefined;
  }

  async updateRegistrationConfig(id: string, data: Partial<RegistrationConfig>): Promise<RegistrationConfig | undefined> {
    const [config] = await db
      .update(registrationConfigs)
      .set(data)
      .where(eq(registrationConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteRegistrationConfig(configId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const steps = await tx
        .select()
        .from(registrationSteps)
        .where(eq(registrationSteps.configId, configId));

      if (steps.length > 0) {
        const stepIds = steps.map(s => s.id);

        const allFields: { id: string }[] = [];
        for (const stepId of stepIds) {
          const fields = await tx
            .select({ id: registrationFields.id })
            .from(registrationFields)
            .where(eq(registrationFields.stepId, stepId));
          allFields.push(...fields);
        }

        if (allFields.length > 0) {
          const fieldIds = allFields.map(f => f.id);

          for (const fieldId of fieldIds) {
            await tx
              .delete(registrationResponses)
              .where(eq(registrationResponses.fieldId, fieldId));
          }
        }

        for (const stepId of stepIds) {
          await tx
            .delete(registrationFields)
            .where(eq(registrationFields.stepId, stepId));
        }

        await tx
          .delete(registrationSteps)
          .where(eq(registrationSteps.configId, configId));
      }

      await tx
        .delete(registrationConfigs)
        .where(eq(registrationConfigs.id, configId));
    });
  }

  async createRegistrationStep(data: InsertRegistrationStep): Promise<RegistrationStep> {
    const [step] = await db.insert(registrationSteps).values(data).returning();
    return step;
  }

  async getStepsByConfig(configId: string): Promise<RegistrationStep[]> {
    return await db.select().from(registrationSteps).where(eq(registrationSteps.configId, configId));
  }

  async updateRegistrationStep(id: string, data: Partial<RegistrationStep>): Promise<RegistrationStep | undefined> {
    const [step] = await db
      .update(registrationSteps)
      .set(data)
      .where(eq(registrationSteps.id, id))
      .returning();
    return step || undefined;
  }

  async deleteRegistrationStep(id: string): Promise<void> {
    await db.delete(registrationSteps).where(eq(registrationSteps.id, id));
  }

  async createRegistrationField(data: InsertRegistrationField): Promise<RegistrationField> {
    const [field] = await db.insert(registrationFields).values(data).returning();
    return field;
  }

  async getFieldsByStep(stepId: string): Promise<RegistrationField[]> {
    return await db.select().from(registrationFields).where(eq(registrationFields.stepId, stepId));
  }

  async updateRegistrationField(id: string, data: Partial<RegistrationField>): Promise<RegistrationField | undefined> {
    const [field] = await db
      .update(registrationFields)
      .set(data)
      .where(eq(registrationFields.id, id))
      .returning();
    return field || undefined;
  }

  async deleteRegistrationField(id: string): Promise<void> {
    await db.delete(registrationFields).where(eq(registrationFields.id, id));
  }

  async createRegistration(data: InsertRegistration): Promise<Registration> {
    if (!data.userId) {
      throw new Error("userId is required for registration");
    }
    const [registration] = await db.insert(registrations).values({
      ...data,
      userId: data.userId,
      updatedAt: new Date()
    }).returning();
    return registration;
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration || undefined;
  }

  async getRegistrationsByTournament(tournamentId: string): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId));
  }

  async updateRegistration(id: string, data: Partial<Registration>): Promise<Registration | undefined> {
    const [registration] = await db
      .update(registrations)
      .set(data)
      .where(eq(registrations.id, id))
      .returning();
    return registration || undefined;
  }

  async createRegistrationResponse(data: InsertRegistrationResponse): Promise<RegistrationResponse> {
    const [response] = await db.insert(registrationResponses).values(data).returning();
    return response;
  }

  async getResponsesByRegistration(registrationId: string): Promise<RegistrationResponse[]> {
    return await db.select().from(registrationResponses).where(eq(registrationResponses.registrationId, registrationId));
  }

  // Server operations
  async createServer(data: InsertServer): Promise<Server> {
    const [server] = await db.insert(servers).values(data).returning();
    return server;
  }

  async getAllServers(): Promise<Server[]> {
    return await db.select().from(servers).orderBy(servers.createdAt);
  }

  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server || undefined;
  }

  async joinServer(serverId: string, userId: string): Promise<ServerMember> {
    const [member] = await db.insert(serverMembers).values({
      serverId,
      userId,
      role: "Member",
    }).returning();

    // Increment member count
    await db.update(servers)
      .set({ memberCount: sql`${servers.memberCount} + 1` })
      .where(eq(servers.id, serverId));

    return member;
  }

  async getServersByUser(userId: string): Promise<Server[]> {
    const userServerIds = await db
      .select({ serverId: serverMembers.serverId })
      .from(serverMembers)
      .where(eq(serverMembers.userId, userId));

    if (userServerIds.length === 0) return [];

    return await db.select()
      .from(servers)
      .where(sql`${servers.id} IN (${sql.join(userServerIds.map(s => sql`${s.serverId}`), sql`, `)})`);
  }

  async isUserInServer(serverId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(serverMembers)
      .where(sql`${serverMembers.serverId} = ${serverId} AND ${serverMembers.userId} = ${userId}`)
      .limit(1);
    return !!member;
  }

  async getServerMember(serverId: string, userId: string): Promise<ServerMember | undefined> {
    const [member] = await db
      .select()
      .from(serverMembers)
      .where(sql`${serverMembers.serverId} = ${serverId} AND ${serverMembers.userId} = ${userId}`)
      .limit(1);
    return member;
  }

  // Channel operations
  async createChannel(data: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(data).returning();
    return channel;
  }

  async getChannelsByServer(serverId: string): Promise<Channel[]> {
    return await db.select().from(channels).where(eq(channels.serverId, serverId)).orderBy(channels.position);
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  // Mobile preview operations
  async getAllMessageThreads(): Promise<MessageThread[]> {
    return await db.select().from(messageThreads).orderBy(messageThreads.lastMessageTime);
  }

  async getMessageThreadsByUser(userId: string): Promise<MessageThread[]> {
    return await db.select().from(messageThreads).where(eq(messageThreads.userId, userId)).orderBy(messageThreads.lastMessageTime);
  }

  async getMessageThreadsForParticipant(userId: string): Promise<MessageThread[]> {
    console.log("[MSG-THREADS] Starting getMessageThreadsForParticipant for user:", userId);

    // Get all tournaments where user has approved registrations  
    const userTournaments = await db
      .select({ tournamentId: registrations.tournamentId })
      .from(registrations)
      .where(
        and(
          eq(registrations.userId, userId),
          eq(registrations.status, "approved")
        )
      );

    console.log("[MSG-THREADS] User tournaments found:", userTournaments.length, userTournaments);

    // Get direct message threads for this user (where they are creator OR participant)
    // Exclude match threads (matchId IS NOT NULL) as they are fetched separately
    const directThreads = await db
      .select()
      .from(messageThreads)
      .where(
        and(
          or(
            eq(messageThreads.userId, userId),
            eq(messageThreads.participantId, userId)
          ),
          isNull(messageThreads.matchId)
        )
      );

    console.log("[MSG-THREADS] Direct threads query result:", directThreads.map(t => ({ id: t.id, userId: t.userId, participantId: t.participantId, matchId: t.matchId })));

    console.log("[MSG-THREADS] Direct threads found:", directThreads.length);

    if (userTournaments.length === 0) {
      console.log("[MSG-THREADS] No tournaments, returning direct threads only");
      return directThreads.sort(
        (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    }

    const tournamentIds = userTournaments.map(t => t.tournamentId);
    console.log("[MSG-THREADS] Tournament IDs:", tournamentIds);

    // Get all teams in those tournaments - simplified with or logic
    let teamIds: string[] = [];
    for (const tournamentId of tournamentIds) {
      const tournamentTeams = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.tournamentId, tournamentId));
      console.log("[MSG-THREADS] Teams in tournament", tournamentId, ":", tournamentTeams.length);
      teamIds.push(...tournamentTeams.map(t => t.id));
    }

    console.log("[MSG-THREADS] Total team IDs:", teamIds);

    if (teamIds.length === 0) {
      console.log("[MSG-THREADS] No teams found, returning direct threads only");
      return directThreads.sort(
        (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    }

    // Get all match threads for this user (where matchId IS NOT NULL)
    // These include both shared threads (userId IS NULL) and per-user threads (userId = current user)
    console.log("[MSG-THREADS] Querying for match threads");

    try {
      const matchThreads = await db
        .select()
        .from(messageThreads)
        .where(
          and(
            sql`${messageThreads.matchId} IS NOT NULL`,
            or(
              sql`${messageThreads.userId} IS NULL`,
              eq(messageThreads.userId, userId)
            )
          )
        );

      console.log("[MSG-THREADS] Match threads found:", matchThreads.length);

      // Combine direct threads + shared match threads
      const allThreads = [...directThreads, ...matchThreads];
      console.log("[MSG-THREADS] Combined threads:", allThreads.length);

      // Sort by most recent last message
      const finalThreads = allThreads.sort(
        (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );

      console.log("[MSG-THREADS] Final threads to return:", finalThreads.length);
      return finalThreads;
    } catch (error) {
      console.error("[MSG-THREADS] Error fetching match threads:", error);
      console.log("[MSG-THREADS] Falling back to direct threads only");
      return directThreads.sort(
        (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    }
  }

  async createMessageThread(data: InsertMessageThread): Promise<MessageThread> {
    console.log("[STORAGE] Creating message thread with data:", data);
    const [thread] = await db.insert(messageThreads).values(data).returning();
    console.log("[STORAGE] Message thread created, returned data:", {
      id: thread.id,
      matchId: thread.matchId,
      userId: thread.userId,
      participantName: thread.participantName,
    });
    return thread;
  }

  async getMessageThread(id: string): Promise<MessageThread | undefined> {
    const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, id));
    return thread || undefined;
  }

  async updateMessageThread(id: string, data: Partial<MessageThread>): Promise<MessageThread | undefined> {
    const [thread] = await db
      .update(messageThreads)
      .set(data)
      .where(eq(messageThreads.id, id))
      .returning();
    return thread || undefined;
  }

  async createThreadMessage(data: InsertThreadMessage): Promise<ThreadMessage> {
    const [message] = await db.insert(threadMessages).values(data).returning();
    return message;
  }

  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    return await db.select().from(threadMessages).where(eq(threadMessages.threadId, threadId)).orderBy(threadMessages.createdAt);
  }

  async updateThreadMessage(id: string, data: { message?: string }): Promise<ThreadMessage | undefined> {
    const [message] = await db
      .update(threadMessages)
      .set(data)
      .where(eq(threadMessages.id, id))
      .returning();
    return message || undefined;
  }

  async deleteThreadMessage(id: string): Promise<void> {
    await db.delete(threadMessages).where(eq(threadMessages.id, id));
  }

  async deleteThreadMessageAndSyncPreview(threadId: string, messageId: string): Promise<void> {
    // Delete the message first
    await db.delete(threadMessages).where(eq(threadMessages.id, messageId));

    // Query for the latest remaining message directly (fresh query after delete)
    const [latestMessage] = await db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, threadId))
      .orderBy(desc(threadMessages.createdAt))
      .limit(1);

    if (latestMessage) {
      // Update thread with the latest remaining message
      await db
        .update(messageThreads)
        .set({
          lastMessage: latestMessage.message || "[Image]",
          lastMessageSenderId: latestMessage.userId,
          lastMessageTime: new Date(latestMessage.createdAt),
        })
        .where(eq(messageThreads.id, threadId));
    } else {
      // No messages left, clear the preview
      await db
        .update(messageThreads)
        .set({
          lastMessage: "",
          lastMessageSenderId: null,
        })
        .where(eq(messageThreads.id, threadId));
    }
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(notifications.timestamp);
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async deleteFriendRequestNotifications(userId: string, senderId: string): Promise<void> {
    await db.delete(notifications).where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.senderId, senderId),
        eq(notifications.type, "friend_request")
      )
    );
  }

  async findExistingThread(userId: string, participantId: string): Promise<MessageThread | undefined> {
    // Find a thread where (userId = A AND participantId = B) OR (userId = B AND participantId = A)
    const [thread] = await db.select().from(messageThreads).where(
      or(
        and(eq(messageThreads.userId, userId), eq(messageThreads.participantId, participantId)),
        and(eq(messageThreads.userId, participantId), eq(messageThreads.participantId, userId))
      )
    );
    return thread || undefined;
  }

  async getMatchThreadForUser(matchId: string, userId: string): Promise<MessageThread | undefined> {
    const [thread] = await db.select().from(messageThreads).where(
      and(
        eq(messageThreads.matchId, matchId),
        eq(messageThreads.userId, userId)
      )
    );
    return thread || undefined;
  }

  async getOrCreateMatchThread(matchId: string, userId: string, participantName: string, participantAvatar?: string): Promise<MessageThread> {
    // Check if thread already exists for this user and match
    const existingThread = await this.getMatchThreadForUser(matchId, userId);
    if (existingThread) {
      return existingThread;
    }
    // Create new thread for this user
    const thread = await this.createMessageThread({
      userId: userId,
      matchId: matchId,
      participantName: participantName,
      participantAvatar: participantAvatar || null,
      lastMessage: "",
      lastMessageSenderId: null,
      unreadCount: 0,
    });
    return thread;
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const threads = await db.select().from(messageThreads).where(
      or(
        eq(messageThreads.userId, userId),
        eq(messageThreads.participantId, userId)
      )
    );
    return threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
  }

  async markThreadAsRead(threadId: string): Promise<void> {
    await db.update(messageThreads)
      .set({ unreadCount: 0 })
      .where(eq(messageThreads.id, threadId));
  }

  // Poster template operations
  async createPosterTemplate(data: InsertPosterTemplate): Promise<PosterTemplate> {
    const [template] = await db.insert(posterTemplates).values(data).returning();
    return template;
  }

  async getAllPosterTemplates(): Promise<PosterTemplate[]> {
    return await db.select().from(posterTemplates).orderBy(posterTemplates.displayOrder);
  }

  async getActivePosterTemplates(): Promise<PosterTemplate[]> {
    return await db.select().from(posterTemplates)
      .where(eq(posterTemplates.isActive, 1))
      .orderBy(posterTemplates.displayOrder);
  }

  async getPosterTemplate(id: string): Promise<PosterTemplate | undefined> {
    const [template] = await db.select().from(posterTemplates).where(eq(posterTemplates.id, id));
    return template || undefined;
  }

  async updatePosterTemplate(id: string, data: Partial<PosterTemplate>): Promise<PosterTemplate | undefined> {
    const [template] = await db
      .update(posterTemplates)
      .set(data)
      .where(eq(posterTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deletePosterTemplate(id: string): Promise<void> {
    await this.deleteTagsByTemplate(id);
    await db.delete(posterTemplates).where(eq(posterTemplates.id, id));
  }

  async createPosterTemplateTag(data: InsertPosterTemplateTag): Promise<PosterTemplateTag> {
    const [tag] = await db.insert(posterTemplateTags).values(data).returning();
    return tag;
  }

  async getTagsByTemplate(templateId: string): Promise<PosterTemplateTag[]> {
    return await db.select().from(posterTemplateTags).where(eq(posterTemplateTags.templateId, templateId));
  }

  async deleteTagsByTemplate(templateId: string): Promise<void> {
    await db.delete(posterTemplateTags).where(eq(posterTemplateTags.templateId, templateId));
  }

  // User operations
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    // Fallback: if returning() returns nothing, fetch the user after update
    if (!user) {
      const [fetchedUser] = await db.select().from(users).where(eq(users.id, id));
      return fetchedUser || undefined;
    }

    return user;
  }

  async changeUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user || !user.passwordHash) {
      return false;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return false;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, id));

    return true;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Achievement operations
  async createAchievement(data: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(data).returning();
    return achievement;
  }

  async getAchievementsByUser(userId: string): Promise<any[]> {
    const achievementsList = await db.select({
      id: achievements.id,
      userId: achievements.userId,
      serverId: achievements.serverId,
      title: achievements.title,
      description: achievements.description,
      iconUrl: achievements.iconUrl,
      reward: achievements.reward,
      game: achievements.game,
      region: achievements.region,
      achievedAt: achievements.achievedAt,
      category: achievements.category,
      type: achievements.type,
      awardedBy: achievements.awardedBy,
      createdAt: achievements.createdAt,
    }).from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(achievements.achievedAt);

    // Fetch server names for achievements that have a serverId
    const withServerNames = await Promise.all(
      achievementsList.map(async (ach) => {
        if (ach.serverId) {
          const [server] = await db.select().from(servers).where(eq(servers.id, ach.serverId));
          return { ...ach, serverName: server?.name };
        }
        return ach;
      })
    );

    return withServerNames;
  }

  // Team profile operations
  async createTeamProfile(data: InsertTeamProfile): Promise<TeamProfile> {
    const [teamProfile] = await db.insert(teamProfiles).values(data).returning();
    return teamProfile;
  }

  async getTeamProfile(id: string): Promise<TeamProfile | undefined> {
    const [teamProfile] = await db.select().from(teamProfiles).where(eq(teamProfiles.id, id));
    return teamProfile || undefined;
  }

  async getTeamProfilesByOwner(ownerId: string): Promise<TeamProfile[]> {
    return await db.select().from(teamProfiles).where(eq(teamProfiles.ownerId, ownerId));
  }

  async updateTeamProfile(id: string, data: Partial<TeamProfile>): Promise<TeamProfile | undefined> {
    const [teamProfile] = await db
      .update(teamProfiles)
      .set(data)
      .where(eq(teamProfiles.id, id))
      .returning();
    return teamProfile || undefined;
  }

  async deleteTeamProfile(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    await db.delete(teamProfiles).where(eq(teamProfiles.id, id));
  }

  // Team member operations
  async createTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(data).returning();
    return member;
  }

  async getTeamMember(memberId: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId));
    return member || undefined;
  }

  async getMembersByTeam(teamId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await this.getMembersByTeam(teamId);
  }

  async getTeamMembersWithUsers(teamId: string): Promise<(TeamMember & { user: User | null })[]> {
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId)).orderBy(teamMembers.id);
    const result = await Promise.all(
      members.map(async (member) => {
        const [user] = await db.select().from(users).where(eq(users.id, member.userId));
        return { ...member, user: user || null };
      })
    );
    return result;
  }

  async updateTeamMember(memberId: string, data: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set(data)
      .where(eq(teamMembers.id, memberId))
      .returning();
    return member || undefined;
  }

  async deleteMemberFromTeam(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ));
  }

  // Server member operations
  async createServerMember(data: InsertServerMember): Promise<ServerMember> {
    const [member] = await db.insert(serverMembers).values(data).returning();
    return member;
  }

  async getMembersByServer(serverId: string): Promise<ServerMember[]> {
    return await db.select().from(serverMembers).where(eq(serverMembers.serverId, serverId));
  }

  async getServerMemberByUserId(serverId: string, userId: string): Promise<ServerMember | undefined> {
    const [member] = await db.select().from(serverMembers)
      .where(and(
        eq(serverMembers.serverId, serverId),
        eq(serverMembers.userId, userId)
      ));
    return member || undefined;
  }

  async updateServerMember(serverId: string, userId: string, data: Partial<InsertServerMember>): Promise<ServerMember | undefined> {
    const [member] = await db
      .update(serverMembers)
      .set(data)
      .where(and(
        eq(serverMembers.serverId, serverId),
        eq(serverMembers.userId, userId)
      ))
      .returning();
    return member || undefined;
  }

  async deleteMemberFromServer(serverId: string, userId: string): Promise<void> {
    await db.delete(serverMembers)
      .where(and(
        eq(serverMembers.serverId, serverId),
        eq(serverMembers.userId, userId)
      ));

    // Decrement member count
    await db.update(servers)
      .set({ memberCount: sql`GREATEST(${servers.memberCount} - 1, 0)` })
      .where(eq(servers.id, serverId));
  }

  async getEffectivePermissions(serverId: string, userId: string): Promise<string[]> {
    const member = await this.getServerMemberByUserId(serverId, userId);
    if (!member) {
      return [];
    }

    const permissions = new Set<string>(member.explicitPermissions || []);

    if (member.roleId) {
      const [role] = await db.select().from(serverRoles).where(eq(serverRoles.id, member.roleId));
      if (role && role.permissions) {
        role.permissions.forEach((p: string) => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  // Channel update/delete operations
  async updateChannel(id: string, data: Partial<Channel>): Promise<Channel | undefined> {
    const [channel] = await db
      .update(channels)
      .set(data)
      .where(eq(channels.id, id))
      .returning();
    return channel || undefined;
  }

  async deleteChannel(id: string): Promise<void> {
    await db.delete(channelMessages).where(eq(channelMessages.channelId, id));
    await db.delete(channels).where(eq(channels.id, id));
  }

  // Channel category operations
  async createChannelCategory(data: InsertChannelCategory): Promise<ChannelCategory> {
    const [category] = await db.insert(channelCategories).values(data).returning();
    return category;
  }

  async getCategoriesByServer(serverId: string): Promise<ChannelCategory[]> {
    return await db.select().from(channelCategories)
      .where(eq(channelCategories.serverId, serverId))
      .orderBy(channelCategories.position);
  }

  async updateChannelCategory(id: string, data: Partial<ChannelCategory>): Promise<ChannelCategory | undefined> {
    const [category] = await db
      .update(channelCategories)
      .set(data)
      .where(eq(channelCategories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteChannelCategory(id: string): Promise<void> {
    await db.update(channels)
      .set({ categoryId: null })
      .where(eq(channels.categoryId, id));
    await db.delete(channelCategories).where(eq(channelCategories.id, id));
  }

  // Channel message operations
  async createChannelMessage(data: InsertChannelMessage): Promise<ChannelMessage> {
    const [message] = await db.insert(channelMessages).values(data).returning();
    return message;
  }

  async getChannelMessages(channelId: string, limit: number = 100): Promise<ChannelMessage[]> {
    return await db.select().from(channelMessages)
      .where(eq(channelMessages.channelId, channelId))
      .orderBy(channelMessages.createdAt)
      .limit(limit);
  }

  async searchChannelMessages(channelId: string, query: string): Promise<ChannelMessage[]> {
    return await db.select().from(channelMessages)
      .where(and(
        eq(channelMessages.channelId, channelId),
        sql`${channelMessages.message} ILIKE ${`%${query}%`}`
      ))
      .orderBy(channelMessages.createdAt);
  }

  async updateChannelMessage(id: string, data: { message?: string }): Promise<ChannelMessage> {
    const [updated] = await db
      .update(channelMessages)
      .set(data)
      .where(eq(channelMessages.id, id))
      .returning();
    return updated;
  }

  async deleteChannelMessage(id: string): Promise<void> {
    await db.delete(channelMessages).where(eq(channelMessages.id, id));
  }

  // Server role operations
  async createServerRole(data: InsertServerRole): Promise<ServerRole> {
    const [role] = await db.insert(serverRoles).values(data).returning();
    return role;
  }

  async getRolesByServer(serverId: string): Promise<ServerRole[]> {
    return await db.select().from(serverRoles)
      .where(eq(serverRoles.serverId, serverId))
      .orderBy(serverRoles.position);
  }

  async getRolesByUser(userId: string, serverId: string): Promise<ServerRole[]> {
    // Get the server member to find their roleId
    const member = await this.getServerMemberByUserId(serverId, userId);
    if (!member || !member.roleId) {
      return [];
    }

    // Get the specific role(s) assigned to this user
    const [role] = await db.select().from(serverRoles)
      .where(eq(serverRoles.id, member.roleId));

    return role ? [role] : [];
  }

  async updateServerRole(id: string, data: Partial<ServerRole>): Promise<ServerRole | undefined> {
    const [role] = await db
      .update(serverRoles)
      .set(data)
      .where(eq(serverRoles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteServerRole(id: string): Promise<void> {
    await db.delete(serverRoles).where(eq(serverRoles.id, id));
  }

  // Server ban operations
  async createServerBan(data: InsertServerBan): Promise<ServerBan> {
    const [ban] = await db.insert(serverBans).values(data).returning();
    await this.deleteMemberFromServer(data.serverId, data.userId);
    return ban;
  }

  async getBansByServer(serverId: string): Promise<ServerBan[]> {
    return await db.select().from(serverBans)
      .where(eq(serverBans.serverId, serverId))
      .orderBy(serverBans.bannedAt);
  }

  async deleteBan(serverId: string, userId: string): Promise<void> {
    await db.delete(serverBans)
      .where(and(
        eq(serverBans.serverId, serverId),
        eq(serverBans.userId, userId)
      ));
  }

  // Server invite operations
  async createServerInvite(data: InsertServerInvite): Promise<ServerInvite> {
    const [invite] = await db.insert(serverInvites).values(data).returning();
    return invite;
  }

  async getInvitesByServer(serverId: string): Promise<ServerInvite[]> {
    return await db.select().from(serverInvites)
      .where(eq(serverInvites.serverId, serverId))
      .orderBy(serverInvites.createdAt);
  }

  async getInviteByCode(code: string): Promise<ServerInvite | undefined> {
    const [invite] = await db.select().from(serverInvites)
      .where(eq(serverInvites.code, code));
    return invite || undefined;
  }

  async incrementInviteUse(code: string): Promise<void> {
    await db
      .update(serverInvites)
      .set({ currentUses: sql`${serverInvites.currentUses} + 1` })
      .where(eq(serverInvites.code, code));
  }

  async deleteInvite(id: string): Promise<void> {
    await db.delete(serverInvites).where(eq(serverInvites.id, id));
  }

  // Server update operations
  async updateServer(id: string, data: Partial<Server>): Promise<Server | undefined> {
    const [server] = await db
      .update(servers)
      .set(data)
      .where(eq(servers.id, id))
      .returning();
    return server || undefined;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getOrganizerUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "organizer"));
  }

  async getOrganizerPermission(organizerId: string): Promise<number | undefined> {
    const [perm] = await db.select().from(organizerPermissions).where(eq(organizerPermissions.organizerId, organizerId));
    return perm?.canGiveAchievements ?? 1;
  }

  async updateOrganizerPermission(organizerId: string, data: Partial<OrganizerPermission>): Promise<OrganizerPermission | undefined> {
    const existing = await this.getOrganizerPermission(organizerId);
    if (!existing) {
      const [perm] = await db.insert(organizerPermissions).values({ organizerId, ...data }).returning();
      return perm;
    }
    const [perm] = await db
      .update(organizerPermissions)
      .set(data)
      .where(eq(organizerPermissions.organizerId, organizerId))
      .returning();
    return perm || undefined;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(achievements.achievedAt);
  }

  async deleteAchievement(achievementId: string): Promise<void> {
    await db.delete(achievements).where(eq(achievements.id, achievementId));
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    await db.delete(tournaments).where(eq(tournaments.id, tournamentId));
  }

  async deleteServer(serverId: string): Promise<void> {
    // Delete related data first
    await db.delete(channelMessages).where(
      sql`${channelMessages.channelId} IN (SELECT id FROM channels WHERE server_id = ${serverId})`
    );
    await db.delete(channels).where(eq(channels.serverId, serverId));
    await db.delete(channelCategories).where(eq(channelCategories.serverId, serverId));
    await db.delete(serverMembers).where(eq(serverMembers.serverId, serverId));
    await db.delete(serverRoles).where(eq(serverRoles.serverId, serverId));
    await db.delete(serverBans).where(eq(serverBans.serverId, serverId));
    await db.delete(serverInvites).where(eq(serverInvites.serverId, serverId));
    await db.delete(servers).where(eq(servers.id, serverId));
  }

  async banUser(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBanned: 1 })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async unbanUser(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBanned: 0 })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async setUserHostPermission(userId: string, canHost: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ canHostTournaments: canHost ? 1 : 0 })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async setUserAchievementPermission(userId: string, canIssue: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ canIssueAchievements: canIssue ? 1 : 0 })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async deleteAnyMessage(messageId: string, messageType: 'chat' | 'channel' | 'thread'): Promise<void> {
    if (messageType === 'chat') {
      await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
    } else if (messageType === 'channel') {
      await db.delete(channelMessages).where(eq(channelMessages.id, messageId));
    } else if (messageType === 'thread') {
      await db.delete(threadMessages).where(eq(threadMessages.id, messageId));
    }
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(reports.createdAt);
  }

  async updateReport(reportId: string, data: Partial<Report>): Promise<Report | undefined> {
    const [report] = await db
      .update(reports)
      .set(data)
      .where(eq(reports.id, reportId))
      .returning();
    return report || undefined;
  }

  async getAllCustomerServiceMessages(): Promise<CustomerServiceMessage[]> {
    return await db.select().from(customerServiceMessages).orderBy(customerServiceMessages.createdAt);
  }

  async updateCustomerServiceMessage(messageId: string, data: Partial<CustomerServiceMessage>): Promise<CustomerServiceMessage | undefined> {
    const [message] = await db
      .update(customerServiceMessages)
      .set(data)
      .where(eq(customerServiceMessages.id, messageId))
      .returning();
    return message || undefined;
  }

  // Friend request operations
  async createFriendRequest(data: InsertFriendRequest): Promise<FriendRequest> {
    const [request] = await db.insert(friendRequests).values(data).returning();
    return request;
  }

  async getFriendRequestBetweenUsers(userId1: string, userId2: string): Promise<FriendRequest | undefined> {
    // First look for pending requests (priority)
    const [pendingRequest] = await db
      .select()
      .from(friendRequests)
      .where(
        and(
          or(
            and(eq(friendRequests.senderId, userId1), eq(friendRequests.recipientId, userId2)),
            and(eq(friendRequests.senderId, userId2), eq(friendRequests.recipientId, userId1))
          ),
          eq(friendRequests.status, 'pending')
        )
      )
      .limit(1);

    if (pendingRequest) return pendingRequest;

    // Then look for accepted friendships
    const [acceptedRequest] = await db
      .select()
      .from(friendRequests)
      .where(
        and(
          or(
            and(eq(friendRequests.senderId, userId1), eq(friendRequests.recipientId, userId2)),
            and(eq(friendRequests.senderId, userId2), eq(friendRequests.recipientId, userId1))
          ),
          eq(friendRequests.status, 'accepted')
        )
      )
      .limit(1);

    return acceptedRequest || undefined;
  }

  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    return await db
      .select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, "pending")
        )
      )
      .orderBy(friendRequests.createdAt);
  }

  async updateFriendRequest(id: string, data: Partial<FriendRequest>): Promise<FriendRequest | undefined> {
    const [request] = await db
      .update(friendRequests)
      .set(data)
      .where(eq(friendRequests.id, id))
      .returning();
    return request || undefined;
  }
}

export const storage = new DatabaseStorage();
