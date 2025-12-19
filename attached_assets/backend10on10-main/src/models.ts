export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
export enum MessageSortFields {
  CREATED_AT = 'CREATED_AT',
}
export enum EditUserError {
  USERNAME_ALREADY_TAKEN = 'USERNAME_ALREADY_TAKEN',
  FAILED_MONGO_UPDATE = 'FAILED_MONGO_UPDATE',
  USER_DOES_NOT_EXIST = 'USER_DOES_NOT_EXIST',
}
export enum VerifyEmailError {
  TOKEN_CANNOT_BE_FOUND = 'TOKEN_CANNOT_BE_FOUND',
}
export enum ChangePasswordWhenLoggedError {
  CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = 'CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL',
  OLD_PASSWORD_IS_INVALID = 'OLD_PASSWORD_IS_INVALID',
  PASSWORD_WEAK = 'PASSWORD_WEAK',
}
export enum ChangePasswordWithTokenError {
  CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = 'CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL',
  TOKEN_IS_INVALID = 'TOKEN_IS_INVALID',
  PASSWORD_IS_TOO_WEAK = 'PASSWORD_IS_TOO_WEAK',
}
export enum SquashAccountsError {
  YOU_HAVE_ONLY_ONE_ACCOUNT = 'YOU_HAVE_ONLY_ONE_ACCOUNT',
  YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL = 'YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL',
  INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
}
export enum IntegrateSocialAccountError {
  YOU_HAVE_ONLY_ONE_ACCOUNT = 'YOU_HAVE_ONLY_ONE_ACCOUNT',
  YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE = 'YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE',
  INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
  CANNOT_FIND_USER = 'CANNOT_FIND_USER',
  YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL = 'YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL',
}
export enum GenerateOAuthTokenError {
  TOKEN_NOT_GENERATED = 'TOKEN_NOT_GENERATED',
  CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE = 'CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE',
}
export enum SocialKind {
  Google = 'Google',
  Github = 'Github',
  Apple = 'Apple',
  Microsoft = 'Microsoft',
}
export enum RegisterErrors {
  USERNAME_EXISTS = 'USERNAME_EXISTS',
  PASSWORD_WEAK = 'PASSWORD_WEAK',
  INVITE_DOMAIN_INCORRECT = 'INVITE_DOMAIN_INCORRECT',
  LINK_EXPIRED = 'LINK_EXPIRED',
  USERNAME_INVALID = 'USERNAME_INVALID',
  FULLNAME_EXISTS = 'FULLNAME_EXISTS',
}
export enum LoginErrors {
  CONFIRM_EMAIL_BEFOR_LOGIN = 'CONFIRM_EMAIL_BEFOR_LOGIN',
  INVALID_LOGIN_OR_PASSWORD = 'INVALID_LOGIN_OR_PASSWORD',
  CANNOT_FIND_CONNECTED_USER = 'CANNOT_FIND_CONNECTED_USER',
  YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL = 'YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}
export enum ProviderErrors {
  CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN = 'CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN',
  CANNOT_FIND_EMAIL_FOR_THIS_PROFIL = 'CANNOT_FIND_EMAIL_FOR_THIS_PROFIL',
  CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE = 'CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE',
  CODE_IS_NOT_EXIST_IN_ARGS = 'CODE_IS_NOT_EXIST_IN_ARGS',
  CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN = 'CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN',
  CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT = 'CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT',
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
export interface GetOAuthInput {
  scopes?: Array<string> | undefined;
  state?: string | undefined;
  redirectUri?: string | undefined;
}
export interface UpdateUserInput {
  username?: string | undefined;
  fullName?: string | undefined;
  avatarUrl?: string | undefined;
}
export interface GenerateOAuthTokenInput {
  social: SocialKind;
  code: string;
}
export interface SimpleUserInput {
  username: string;
  password: string;
}
export interface LoginInput {
  username: string;
  password: string;
}
export interface VerifyEmailInput {
  token: string;
}
export interface ChangePasswordWithTokenInput {
  username: string;
  forgotToken: string;
  newPassword: string;
}
export interface ChangePasswordWhenLoggedInput {
  oldPassword: string;
  newPassword: string;
}
export interface RegisterInput {
  username: string;
  password: string;
  fullName?: string | undefined;
  invitationToken?: string | undefined;
}
export interface ProviderLoginInput {
  code: string;
  redirectUri: string;
}

export type Models = {
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
    emailConfirmed: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
  };
  ['UsersQuery']: {
    user: {
      args: Record<string, never>;
    };
    publicUsers: {
      args: Record<string, never>;
    };
  };
  ['UsersMutation']: {
    user: {
      args: Record<string, never>;
    };
    publicUsers: {
      args: Record<string, never>;
    };
  };
  ['PublicUsersQuery']: {
    guest: {
      args: Record<string, never>;
    };
    login: {
      args: Record<string, never>;
    };
    getGoogleOAuthLink: {
      args: {
        setup: GetOAuthInput;
      };
    };
    getMicrosoftOAuthLink: {
      args: {
        setup: GetOAuthInput;
      };
    };
    getGithubOAuthLink: {
      args: {
        setup: GetOAuthInput;
      };
    };
    getAppleOAuthLink: {
      args: {
        setup: GetOAuthInput;
      };
    };
    requestForForgotPassword: {
      args: {
        username: string;
      };
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
    me: {
      args: Record<string, never>;
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
    changePasswordWhenLogged: {
      args: {
        changePasswordData: ChangePasswordWhenLoggedInput;
      };
    };
    editUser: {
      args: {
        updatedUser: UpdateUserInput;
      };
    };
    integrateSocialAccount: {
      args: {
        userData: SimpleUserInput;
      };
    };
  };
  ['PublicUsersMutation']: {
    register: {
      args: {
        user: RegisterInput;
      };
    };
    verifyEmail: {
      args: {
        verifyData: VerifyEmailInput;
      };
    };
    changePasswordWithToken: {
      args: {
        token: ChangePasswordWithTokenInput;
      };
    };
    generateOAuthToken: {
      args: {
        tokenData: GenerateOAuthTokenInput;
      };
    };
  };
  ['EditUserResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['VerifyEmailResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['ChangePasswordWhenLoggedResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['ChangePasswordWithTokenResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['IntegrateSocialAccountResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['GenerateOAuthTokenResponse']: {
    result: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['LoginQuery']: {
    password: {
      args: {
        user: LoginInput;
      };
    };
    provider: {
      args: {
        params: ProviderLoginInput;
      };
    };
    refreshToken: {
      args: {
        refreshToken: string;
      };
    };
  };
  ['ProviderLoginQuery']: {
    apple: {
      args: Record<string, never>;
    };
    google: {
      args: Record<string, never>;
    };
    github: {
      args: Record<string, never>;
    };
    microsoft: {
      args: Record<string, never>;
    };
  };
  ['RegisterResponse']: {
    registered: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['LoginResponse']: {
    login: {
      args: Record<string, never>;
    };
    accessToken: {
      args: Record<string, never>;
    };
    refreshToken: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
  ['ProviderResponse']: {
    jwt: {
      args: Record<string, never>;
    };
    accessToken: {
      args: Record<string, never>;
    };
    refreshToken: {
      args: Record<string, never>;
    };
    providerAccessToken: {
      args: Record<string, never>;
    };
    register: {
      args: Record<string, never>;
    };
    hasError: {
      args: Record<string, never>;
    };
  };
};

export type Directives = unknown

export type Scalars = unknown;

export interface GuestQuery {
  categories: CategoryConnection;
  serversByCategory: ServerConnection;
  serverById?: Server | undefined;
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
  emailConfirmed: boolean;
  createdAt?: string | undefined;
}
export interface UsersQuery {
  user?: AuthorizedUserQuery | undefined;
  publicUsers?: PublicUsersQuery | undefined;
}
export interface UsersMutation {
  user?: AuthorizedUserMutation | undefined;
  publicUsers?: PublicUsersMutation | undefined;
}
export interface PublicUsersQuery {
  guest?: GuestQuery | undefined;
  login: LoginQuery;
  getGoogleOAuthLink: string;
  getMicrosoftOAuthLink: string;
  getGithubOAuthLink: string;
  getAppleOAuthLink: string;
  requestForForgotPassword: boolean;
}
export interface AuthorizedUserQuery {
  organisator?: OrganisatorQuery | undefined;
  channelById?: Channel | undefined;
  me?: User | undefined;
}
export interface AuthorizedUserMutation {
  organisator?: OrganisatorMutation | undefined;
  channel?: UserChannelOps | undefined;
  followServer?: boolean | undefined;
  makeMeOrganisator?: boolean | undefined;
  uploadFile?: UploadResponse | undefined;
  blockUser?: boolean | undefined;
  changePasswordWhenLogged: ChangePasswordWhenLoggedResponse;
  editUser: EditUserResponse;
  integrateSocialAccount: IntegrateSocialAccountResponse;
}
export interface PublicUsersMutation {
  register: RegisterResponse;
  verifyEmail: VerifyEmailResponse;
  changePasswordWithToken: ChangePasswordWithTokenResponse;
  generateOAuthToken: GenerateOAuthTokenResponse;
}
export interface EditUserResponse {
  result?: boolean | undefined;
  hasError?: EditUserError | undefined;
}
export interface VerifyEmailResponse {
  result?: boolean | undefined;
  hasError?: VerifyEmailError | undefined;
}
export interface ChangePasswordWhenLoggedResponse {
  result?: boolean | undefined;
  hasError?: ChangePasswordWhenLoggedError | undefined;
}
export interface ChangePasswordWithTokenResponse {
  result?: boolean | undefined;
  hasError?: ChangePasswordWithTokenError | undefined;
}
export interface IntegrateSocialAccountResponse {
  result?: boolean | undefined;
  hasError?: IntegrateSocialAccountError | undefined;
}
export interface GenerateOAuthTokenResponse {
  result?: string | undefined;
  hasError?: GenerateOAuthTokenError | undefined;
}
export interface LoginQuery {
  password: LoginResponse;
  provider: ProviderLoginQuery;
  refreshToken: string;
}
export interface ProviderLoginQuery {
  apple?: ProviderResponse | undefined;
  google?: ProviderResponse | undefined;
  github?: ProviderResponse | undefined;
  microsoft?: ProviderResponse | undefined;
}
export interface RegisterResponse {
  registered?: boolean | undefined;
  hasError?: RegisterErrors | undefined;
}
export interface LoginResponse {
  login?: string | undefined;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  hasError?: LoginErrors | undefined;
}
export interface ProviderResponse {
  jwt?: string | undefined;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  providerAccessToken?: string | undefined;
  register?: boolean | undefined;
  hasError?: ProviderErrors | undefined;
}
