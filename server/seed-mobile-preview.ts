import { db } from "./db";
import { servers, channels, messageThreads, notifications, tournaments } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedMobilePreview() {
  console.log("Seeding mobile preview data...");

  // Clear existing data to ensure clean state
  console.log("Clearing existing mobile preview data...");
  await db.delete(tournaments);
  await db.delete(notifications);
  await db.delete(messageThreads);
  await db.delete(channels);
  await db.delete(servers);

  // Seed servers
  const insertedServers = await db.insert(servers).values([
    {
      name: "Pro League Tournament",
      description: "Official tournament league for professional players",
      memberCount: 1247,
      category: "Competitive",
      isPublic: 1,
      ownerId: "user-1",
      iconUrl: "/attached_assets/generated_images/Pro_League_Tournament_Branding_dcf9285c.png",
      backgroundUrl: "/attached_assets/generated_images/Pro_League_Tournament_Branding_dcf9285c.png",
    },
    {
      name: "Casual Gaming Hub",
      description: "Relaxed community for casual matches",
      memberCount: 856,
      category: "Casual",
      isPublic: 1,
      ownerId: "user-2",
      iconUrl: "/attached_assets/generated_images/Casual_Gaming_Hub_Branding_9f9396a6.png",
      backgroundUrl: "/attached_assets/generated_images/Casual_Gaming_Hub_Branding_9f9396a6.png",
    },
    {
      name: "Esports Academy",
      description: "Training ground for aspiring esports athletes",
      memberCount: 432,
      category: "Training",
      isPublic: 1,
      ownerId: "user-1",
      iconUrl: "/attached_assets/generated_images/Esports_Academy_Branding_4a858f31.png",
      backgroundUrl: "/attached_assets/generated_images/Esports_Academy_Branding_4a858f31.png",
    },
    {
      name: "Weekend Warriors",
      description: "Weekend tournaments and friendly matches",
      memberCount: 623,
      category: "Community",
      isPublic: 1,
      ownerId: "user-3",
      iconUrl: "/attached_assets/generated_images/Weekend_Warriors_Branding_82481fd5.png",
      backgroundUrl: "/attached_assets/generated_images/Weekend_Warriors_Branding_82481fd5.png",
    },
    {
      name: "Championship Series",
      description: "High-stakes competitive championship",
      memberCount: 2104,
      category: "Competitive",
      isPublic: 1,
      ownerId: "user-1",
      iconUrl: "/attached_assets/generated_images/Championship_Series_Branding_02fa0528.png",
      backgroundUrl: "/attached_assets/generated_images/Championship_Series_Branding_02fa0528.png",
    },
  ]).returning();

  // Seed channels for each server
  for (const server of insertedServers) {
    await db.insert(channels).values([
      {
        serverId: server.id,
        name: "Announcements",
        slug: "announcements",
        type: "announcements",
        isPrivate: 0,
        position: 0,
      },
      {
        serverId: server.id,
        name: "General Chat",
        slug: "general-chat",
        type: "chat",
        isPrivate: 0,
        position: 1,
      },
      {
        serverId: server.id,
        name: "Tournament Dashboard",
        slug: "tournament-dashboard",
        type: "tournament_dashboard",
        isPrivate: 1,
        position: 2,
      },
    ]);
  }

  // Seed message threads
  const now = new Date();
  await db.insert(messageThreads).values([
    {
      participantName: "Team Alpha",
      participantAvatar: "",
      lastMessage: "GG! See you in the finals",
      lastMessageTime: new Date(now.getTime() - 1000 * 60 * 5), // 5 minutes ago
      unreadCount: 2,
    },
    {
      participantName: "Jordan Smith",
      participantAvatar: "",
      lastMessage: "When is our next match?",
      lastMessageTime: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 0,
    },
    {
      participantName: "Team Phoenix",
      participantAvatar: "",
      lastMessage: "Let's practice tomorrow",
      lastMessageTime: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 1,
    },
    {
      participantName: "Sarah Connor",
      participantAvatar: "",
      lastMessage: "Tournament starts at 3pm",
      lastMessageTime: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
      unreadCount: 0,
    },
    {
      participantName: "Team Dragons",
      participantAvatar: "",
      lastMessage: "Great game today!",
      lastMessageTime: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
      unreadCount: 3,
    },
  ]);

  // Seed tournaments (first 5 tournaments linked to first server)
  const firstServerId = insertedServers[0]?.id;
  
  await db.insert(tournaments).values([
    {
      serverId: firstServerId,
      name: "Valorant Champions Cup 2024",
      game: "Valorant",
      imageUrl: "/attached_assets/generated_images/Valorant_Championship_Tournament_Poster_f19f1be7.png",
      format: "single_elimination",
      prizeReward: "$5,000",
      entryFee: 500,
      organizerName: "Carol Martinez",
      totalTeams: 16,
      startDate: new Date(Date.now() + 86400000 * 7),
      status: "upcoming",
    },
    {
      serverId: firstServerId,
      name: "CS:GO Pro League",
      game: "CS:GO",
      imageUrl: "/attached_assets/generated_images/CS:GO_Pro_League_Poster_405d1762.png",
      format: "round_robin",
      prizeReward: "$10,000",
      entryFee: 1000,
      organizerName: "Bob Smith",
      totalTeams: 12,
      startDate: new Date(Date.now() + 86400000 * 14),
      status: "upcoming",
    },
    {
      serverId: firstServerId,
      name: "League of Legends Spring Split",
      game: "League of Legends",
      imageUrl: "/attached_assets/generated_images/League_of_Legends_Tournament_Poster_3f50b053.png",
      format: "swiss",
      prizeReward: "$15,000",
      entryFee: 1200,
      organizerName: "Alice Johnson",
      totalTeams: 20,
      startDate: new Date(Date.now() - 86400000 * 2),
      status: "upcoming",
    },
    {
      serverId: firstServerId,
      name: "Apex Legends Battle Royale",
      game: "Apex Legends",
      imageUrl: "/attached_assets/generated_images/Apex_Legends_Battle_Royale_Poster_77713e93.png",
      format: "single_elimination",
      prizeReward: "$3,000",
      entryFee: 250,
      organizerName: "Carol Martinez",
      totalTeams: 32,
      startDate: new Date(Date.now() + 86400000 * 21),
      status: "upcoming",
    },
    {
      serverId: firstServerId,
      name: "Fortnite Championship",
      game: "Fortnite",
      imageUrl: "/attached_assets/generated_images/Fortnite_Championship_Poster_a359f503.png",
      format: "single_elimination",
      prizeReward: "$8,000",
      entryFee: 750,
      organizerName: "Alice Johnson",
      totalTeams: 24,
      startDate: new Date(Date.now() + 86400000 * 10),
      status: "upcoming",
    },
    {
      name: "Rocket League Masters",
      game: "Rocket League",
      imageUrl: "/attached_assets/generated_images/Rocket_League_Masters_Poster_55ae82a5.png",
      format: "round_robin",
      prizeReward: "$6,500",
      entryFee: 600,
      organizerName: "Bob Smith",
      totalTeams: 16,
      startDate: new Date(Date.now() + 86400000 * 18),
      status: "upcoming",
    },
    {
      name: "Overwatch Invitational",
      game: "Overwatch",
      imageUrl: "/attached_assets/generated_images/Overwatch_Invitational_Poster_246ea3cc.png",
      format: "single_elimination",
      prizeReward: "$7,200",
      entryFee: 650,
      organizerName: "Carol Martinez",
      totalTeams: 20,
      startDate: new Date(Date.now() + 86400000 * 25),
      status: "upcoming",
    },
    {
      name: "PUBG Mobile Showdown",
      game: "PUBG Mobile",
      imageUrl: "/attached_assets/generated_images/PUBG_Mobile_Tournament_Poster_1815828c.png",
      format: "swiss",
      prizeReward: "$4,500",
      entryFee: 400,
      organizerName: "Alice Johnson",
      totalTeams: 28,
      startDate: new Date(Date.now() + 86400000 * 12),
      status: "upcoming",
    },
    {
      name: "Rainbow Six Siege Cup",
      game: "Rainbow Six Siege",
      imageUrl: "/attached_assets/generated_images/Rainbow_Six_Siege_Poster_9dc5fb5d.png",
      format: "single_elimination",
      prizeReward: "$9,000",
      entryFee: 800,
      organizerName: "Bob Smith",
      totalTeams: 16,
      startDate: new Date(Date.now() + 86400000 * 16),
      status: "upcoming",
    },
    {
      name: "FIFA Ultimate Championship",
      game: "FIFA",
      imageUrl: "/attached_assets/generated_images/FIFA_Ultimate_Championship_Poster_e5b1c00e.png",
      format: "single_elimination",
      prizeReward: "$500",
      entryFee: 50,
      organizerName: "Carol Martinez",
      totalTeams: 32,
      startDate: new Date(Date.now() + 86400000 * 5),
      status: "upcoming",
    },
  ]);

  // Seed notifications
  await db.insert(notifications).values([
    {
      type: "match_result",
      title: "Match Result",
      message: "Team A won 2-1 in a thrilling match!",
      timestamp: new Date(now.getTime() - 1000 * 60 * 10), // 10 minutes ago
      isRead: 0,
    },
    {
      type: "friend_request",
      title: "Friend Request",
      message: "Alex Johnson sent you a friend request",
      timestamp: new Date(now.getTime() - 1000 * 60 * 45), // 45 minutes ago
      isRead: 0,
    },
    {
      type: "tournament_alert",
      title: "Tournament Alert: Summer Cup",
      message: "The Summer Cup registration is now open!",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
      isRead: 0,
    },
    {
      type: "system",
      title: "New Message",
      message: "You have 3 unread messages",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 6), // 6 hours ago
      isRead: 1,
    },
    {
      type: "match_result",
      title: "Match Update",
      message: "Your team advanced to the semifinals",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12), // 12 hours ago
      isRead: 0,
    },
    {
      type: "system",
      title: "System Update",
      message: "App updated to version 2.1.0",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      isRead: 1,
    },
  ]);

  console.log("Mobile preview data seeded successfully!");
}

seedMobilePreview()
  .catch((error) => {
    console.error("Error seeding mobile preview data:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
