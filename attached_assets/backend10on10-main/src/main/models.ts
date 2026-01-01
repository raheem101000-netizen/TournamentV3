export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
export enum MessageSortFields {
  CREATED_AT = 'CREATED_AT',
}

export interface PageInput {
  limit: number;
  start?: number | undefined;
}
export interface MessageSortByInput {
  field?: MessageSortFields | undefined;
  direction?: SortDirection | undefined;
}
export interface ServersFilter {
  pageInput: PageInput;
  search?: string | undefined;
}
export interface MessageInput {
  text?: string | undefined;
  attachmentsUrls?: Array<string> | undefined;
}
export interface CreateServer {
  title: string;
  description: string;
  category: string;
}
export interface CreateChannelInput {
  open?: boolean | undefined;
  tournament?: boolean | undefined;
  name: string;
  description?: string | undefined;
}
export interface UpdateServer {
  title?: string | undefined;
  description?: string | undefined;
  category?: string | undefined;
}
export interface UpdateChannelInput {
  open?: boolean | undefined;
  tournament?: boolean | undefined;
  name?: string | undefined;
  description?: string | undefined;
}

export type Models = {
  ['Query']: {
    users: {
      args: Record<string, never>;
    };
  };
  ['Mutation']: {
    users: {
      args: Record<string, never>;
    };
  };
  ['User']: {
    _id: {
      args: Record<string, never>;
    };
    username: {
      args: Record<string, never>;
    };
    termsAccepted: {
      args: Record<string, never>;
    };
    privacyPolicyAccepted: {
      args: Record<string, never>;
    };
    followedServers: {
      args: {
        pageInput: PageInput;
      };
    };
    isOrganisator: {
      args: Record<string, never>;
    };
    fullName: {
      args: Record<string, never>;
    };
    avatarUrl: {
      args: Record<string, never>;
    };
    blockedUsers: {
      args: Record<string, never>;
    };
  };
  ['UsersQuery']: {
    user: {
      args: Record<string, never>;
    };
  };
  ['UsersMutation']: {
    user: {
      args: Record<string, never>;
    };
  };
  ['PublicUsersQuery']: {
    guest: {
      args: Record<string, never>;
    };
  };
  ['AuthorizedUserQuery']: {
    organisator: {
      args: Record<string, never>;
    };
    channelById: {
      args: {
        channelId: string;
      };
    };
  };
  ['GuestQuery']: {
    categories: {
      args: {
        pageInput: PageInput;
      };
    };
    serversByCategory: {
      args: {
        categorySlug?: string | undefined;
        filter: ServersFilter;
      };
    };
    serverById: {
      args: {
        serverId: string;
      };
    };
  };
  ['AuthorizedUserMutation']: {
    organisator: {
      args: Record<string, never>;
    };
    channel: {
      args: {
        channelId: string;
      };
    };
    followServer: {
      args: {
        serverId: string;
        follow?: boolean | undefined;
      };
    };
    makeMeOrganisator: {
      args: Record<string, never>;
    };
    uploadFile: {
      args: {
        key: string;
      };
    };
    blockUser: {
      args: {
        block?: boolean | undefined;
        userId: string;
      };
    };
  };
  ['Server']: {
    _id: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    title: {
      args: Record<string, never>;
    };
    description: {
      args: Record<string, never>;
    };
    category: {
      args: Record<string, never>;
    };
    channels: {
      args: Record<string, never>;
    };
    interestedUsers: {
      args: Record<string, never>;
    };
    iAmInterested: {
      args: Record<string, never>;
    };
    host: {
      args: Record<string, never>;
    };
  };
  ['Category']: {
    slug: {
      args: Record<string, never>;
    };
    image: {
      args: Record<string, never>;
    };
    image_thumbnail: {
      args: Record<string, never>;
    };
    name: {
      args: Record<string, never>;
    };
  };
  ['CategoryConnection']: {
    categories: {
      args: Record<string, never>;
    };
    pageInfo: {
      args: Record<string, never>;
    };
  };
  ['PageInfo']: {
    hasNext: {
      args: Record<string, never>;
    };
    total: {
      args: Record<string, never>;
    };
  };
  ['ServerConnection']: {
    servers: {
      args: Record<string, never>;
    };
    pageInfo: {
      args: Record<string, never>;
    };
  };
  ['OrganisatorMutation']: {
    createServer: {
      args: {
        server: CreateServer;
      };
    };
    serverOps: {
      args: {
        serverId: string;
      };
    };
  };
  ['Channel']: {
    open: {
      args: Record<string, never>;
    };
    tournament: {
      args: Record<string, never>;
    };
    server: {
      args: Record<string, never>;
    };
    messages: {
      args: {
        page: PageInput;
        sortBy?: MessageSortByInput | undefined;
      };
    };
    _id: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    name: {
      args: Record<string, never>;
    };
    description: {
      args: Record<string, never>;
    };
  };
  ['AttachmentUrl']: {
    image: {
      args: Record<string, never>;
    };
    image_thumbnail: {
      args: Record<string, never>;
    };
  };
  ['Message']: {
    text: {
      args: Record<string, never>;
    };
    attachmentsUrls: {
      args: Record<string, never>;
    };
    replies: {
      args: {
        page: PageInput;
      };
    };
    channel: {
      args: Record<string, never>;
    };
    user: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
  };
  ['ChannelOps']: {
    update: {
      args: {
        channel: UpdateChannelInput;
      };
    };
    delete: {
      args: Record<string, never>;
    };
  };
  ['ServerOps']: {
    update: {
      args: {
        server: UpdateServer;
      };
    };
    delete: {
      args: Record<string, never>;
    };
    createChannel: {
      args: {
        channel: CreateChannelInput;
      };
    };
    channelOps: {
      args: {
        channelId: string;
      };
    };
    banUser: {
      args: {
        userId: string;
      };
    };
    unbanUser: {
      args: {
        userId: string;
      };
    };
  };
  ['UserChannelOps']: {
    sendMessage: {
      args: {
        message: MessageInput;
      };
    };
    uploadFile: {
      args: {
        key: string;
      };
    };
  };
  ['MessageConnection']: {
    messages: {
      args: Record<string, never>;
    };
    pageInfo: {
      args: Record<string, never>;
    };
  };
  ['OrganisatorQuery']: {
    myServers: {
      args: {
        filter: ServersFilter;
      };
    };
  };
  ['InterestedUser']: {
    username: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
    fullName: {
      args: Record<string, never>;
    };
    avatarUrl: {
      args: Record<string, never>;
    };
    banned: {
      args: Record<string, never>;
    };
    blockedByUser: {
      args: Record<string, never>;
    };
  };
  ['UploadResponse']: {
    getURL: {
      args: Record<string, never>;
    };
    putURL: {
      args: Record<string, never>;
    };
    key: {
      args: Record<string, never>;
    };
  };
};

export type Directives = unknown

export type Scalars = unknown;

export interface Query {
  users?: UsersQuery | undefined;
}
export interface Mutation {
  users?: UsersMutation | undefined;
}
export interface User {
  _id: string;
  username: string;
  termsAccepted?: string | undefined;
  privacyPolicyAccepted?: string | undefined;
  followedServers: ServerConnection;
  isOrganisator?: boolean | undefined;
  fullName?: string | undefined;
  avatarUrl?: string | undefined;
  blockedUsers?: Array<string | undefined> | undefined;
}
export interface UsersQuery {
  user?: AuthorizedUserQuery | undefined;
}
export interface UsersMutation {
  user?: AuthorizedUserMutation | undefined;
}
export interface PublicUsersQuery {
  guest?: GuestQuery | undefined;
}
export interface AuthorizedUserQuery {
  organisator?: OrganisatorQuery | undefined;
  channelById?: Channel | undefined;
}
export interface GuestQuery {
  categories: CategoryConnection;
  serversByCategory: ServerConnection;
  serverById?: Server | undefined;
}
export interface AuthorizedUserMutation {
  organisator?: OrganisatorMutation | undefined;
  channel?: UserChannelOps | undefined;
  followServer?: boolean | undefined;
  makeMeOrganisator?: boolean | undefined;
  uploadFile?: UploadResponse | undefined;
  blockUser?: boolean | undefined;
}
export interface Server {
  _id: string;
  createdAt: string;
  title: string;
  description: string;
  category?: Category | undefined;
  channels?: Array<Channel> | undefined;
  interestedUsers: Array<InterestedUser>;
  iAmInterested?: boolean | undefined;
  host: User;
}
export interface Category {
  slug: string;
  image?: string | undefined;
  image_thumbnail?: string | undefined;
  name?: string | undefined;
}
export interface CategoryConnection {
  categories: Array<Category | undefined>;
  pageInfo?: PageInfo | undefined;
}
export interface PageInfo {
  hasNext?: boolean | undefined;
  total: number;
}
export interface ServerConnection {
  servers: Array<Server | undefined>;
  pageInfo?: PageInfo | undefined;
}
export interface OrganisatorMutation {
  createServer?: string | undefined;
  serverOps?: ServerOps | undefined;
}
export interface Channel {
  open?: boolean | undefined;
  tournament?: boolean | undefined;
  server: Server;
  messages?: MessageConnection | undefined;
  _id: string;
  createdAt: string;
  name: string;
  description?: string | undefined;
}
export interface AttachmentUrl {
  image?: string | undefined;
  image_thumbnail?: string | undefined;
}
export interface Message {
  text?: string | undefined;
  attachmentsUrls?: Array<AttachmentUrl> | undefined;
  replies: MessageConnection;
  channel: Channel;
  user: User;
  _id: string;
  createdAt: string;
}
export interface ChannelOps {
  update?: boolean | undefined;
  delete?: boolean | undefined;
}
export interface ServerOps {
  update?: boolean | undefined;
  delete?: boolean | undefined;
  createChannel?: string | undefined;
  channelOps?: ChannelOps | undefined;
  banUser?: boolean | undefined;
  unbanUser?: string | undefined;
}
export interface UserChannelOps {
  sendMessage?: boolean | undefined;
  uploadFile?: UploadResponse | undefined;
}
export interface MessageConnection {
  messages: Array<Message>;
  pageInfo?: PageInfo | undefined;
}
export interface OrganisatorQuery {
  myServers: ServerConnection;
}
export interface InterestedUser {
  username: string;
  _id: string;
  fullName?: string | undefined;
  avatarUrl?: string | undefined;
  banned?: boolean | undefined;
  blockedByUser?: boolean | undefined;
}
export interface UploadResponse {
  getURL: string;
  putURL: string;
  key: string;
}
