export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUri?: string;
  bio?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface Trophy {
  id: string;
  userId: string;
  tournamentId: string;
  title: string;
  description: string;
  iconUrl: string;
  awardedBy: string;
  awardedAt: string;
}

export interface ChatThread {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatarUri?: string;
  participantIds: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  imageUri?: string;
  createdAt: string;
  readBy: string[];
}

export interface DMRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  threadId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface TournamentPoster {
  id: string;
  name: string;
  game: string;
  imageUrl: string;
  format: 'single_elimination' | 'round_robin' | 'swiss';
  prizeReward?: string;
  entryFee?: number;
  organizerId: string;
  organizerName: string;
  maxTeams: number;
  currentTeams: number;
  startDate: string;
  status: 'upcoming' | 'in_progress' | 'completed';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'friend_request' | 'tournament_invite' | 'match_update';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
