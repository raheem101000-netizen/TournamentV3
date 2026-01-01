/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	GuestQuery:{
		categories:{
			pageInput:"PageInput"
		},
		serversByCategory:{
			filter:"ServersFilter"
		},
		serverById:{

		}
	},
	PageInput:{

	},
	MessageSortByInput:{
		field:"MessageSortFields",
		direction:"SortDirection"
	},
	OrganisatorMutation:{
		createServer:{
			server:"CreateServer"
		},
		serverOps:{

		}
	},
	ServersFilter:{
		pageInput:"PageInput"
	},
	Channel:{
		messages:{
			page:"PageInput",
			sortBy:"MessageSortByInput"
		}
	},
	Message:{
		replies:{
			page:"PageInput"
		}
	},
	ChannelOps:{
		update:{
			channel:"UpdateChannelInput"
		}
	},
	ServerOps:{
		update:{
			server:"UpdateServer"
		},
		createChannel:{
			channel:"CreateChannelInput"
		},
		channelOps:{

		},
		banUser:{

		},
		unbanUser:{

		}
	},
	UserChannelOps:{
		sendMessage:{
			message:"MessageInput"
		},
		uploadFile:{

		}
	},
	OrganisatorQuery:{
		myServers:{
			filter:"ServersFilter"
		}
	},
	MessageInput:{

	},
	CreateServer:{

	},
	CreateChannelInput:{

	},
	UpdateServer:{

	},
	UpdateChannelInput:{

	},
	SortDirection: "enum" as const,
	MessageSortFields: "enum" as const,
	User:{
		followedServers:{
			pageInput:"PageInput"
		}
	},
	PublicUsersQuery:{
		getGoogleOAuthLink:{
			setup:"GetOAuthInput"
		},
		getMicrosoftOAuthLink:{
			setup:"GetOAuthInput"
		},
		getGithubOAuthLink:{
			setup:"GetOAuthInput"
		},
		getAppleOAuthLink:{
			setup:"GetOAuthInput"
		},
		requestForForgotPassword:{

		}
	},
	AuthorizedUserQuery:{
		channelById:{

		}
	},
	AuthorizedUserMutation:{
		channel:{

		},
		followServer:{

		},
		uploadFile:{

		},
		blockUser:{

		},
		changePasswordWhenLogged:{
			changePasswordData:"ChangePasswordWhenLoggedInput"
		},
		editUser:{
			updatedUser:"UpdateUserInput"
		},
		integrateSocialAccount:{
			userData:"SimpleUserInput"
		}
	},
	GetOAuthInput:{

	},
	PublicUsersMutation:{
		register:{
			user:"RegisterInput"
		},
		verifyEmail:{
			verifyData:"VerifyEmailInput"
		},
		changePasswordWithToken:{
			token:"ChangePasswordWithTokenInput"
		},
		generateOAuthToken:{
			tokenData:"GenerateOAuthTokenInput"
		}
	},
	EditUserError: "enum" as const,
	VerifyEmailError: "enum" as const,
	ChangePasswordWhenLoggedError: "enum" as const,
	ChangePasswordWithTokenError: "enum" as const,
	SquashAccountsError: "enum" as const,
	IntegrateSocialAccountError: "enum" as const,
	GenerateOAuthTokenError: "enum" as const,
	UpdateUserInput:{

	},
	GenerateOAuthTokenInput:{
		social:"SocialKind"
	},
	SimpleUserInput:{

	},
	LoginInput:{

	},
	VerifyEmailInput:{

	},
	ChangePasswordWithTokenInput:{

	},
	ChangePasswordWhenLoggedInput:{

	},
	RegisterInput:{

	},
	SocialKind: "enum" as const,
	LoginQuery:{
		password:{
			user:"LoginInput"
		},
		provider:{
			params:"ProviderLoginInput"
		},
		refreshToken:{

		}
	},
	ProviderLoginInput:{

	},
	RegisterErrors: "enum" as const,
	LoginErrors: "enum" as const,
	ProviderErrors: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	GuestQuery:{
		categories:"CategoryConnection",
		serversByCategory:"ServerConnection",
		serverById:"Server"
	},
	Server:{
		_id:"String",
		createdAt:"String",
		title:"String",
		description:"String",
		category:"Category",
		channels:"Channel",
		interestedUsers:"InterestedUser",
		iAmInterested:"Boolean",
		host:"User"
	},
	Category:{
		slug:"String",
		image:"String",
		image_thumbnail:"String",
		name:"String"
	},
	CategoryConnection:{
		categories:"Category",
		pageInfo:"PageInfo"
	},
	PageInfo:{
		hasNext:"Boolean",
		total:"Int"
	},
	ServerConnection:{
		servers:"Server",
		pageInfo:"PageInfo"
	},
	OrganisatorMutation:{
		createServer:"String",
		serverOps:"ServerOps"
	},
	Channel:{
		open:"Boolean",
		tournament:"Boolean",
		server:"Server",
		messages:"MessageConnection",
		_id:"String",
		createdAt:"String",
		name:"String",
		description:"String"
	},
	AttachmentUrl:{
		image:"String",
		image_thumbnail:"String"
	},
	Message:{
		text:"String",
		attachmentsUrls:"AttachmentUrl",
		replies:"MessageConnection",
		channel:"Channel",
		user:"User",
		_id:"String",
		createdAt:"String"
	},
	ChannelOps:{
		update:"Boolean",
		delete:"Boolean"
	},
	ServerOps:{
		update:"Boolean",
		delete:"Boolean",
		createChannel:"String",
		channelOps:"ChannelOps",
		banUser:"Boolean",
		unbanUser:"String"
	},
	UserChannelOps:{
		sendMessage:"Boolean",
		uploadFile:"UploadResponse"
	},
	MessageConnection:{
		messages:"Message",
		pageInfo:"PageInfo"
	},
	OrganisatorQuery:{
		myServers:"ServerConnection"
	},
	InterestedUser:{
		username:"String",
		_id:"String",
		fullName:"String",
		avatarUrl:"String",
		banned:"Boolean",
		blockedByUser:"Boolean"
	},
	UploadResponse:{
		getURL:"String",
		putURL:"String",
		key:"String"
	},
	Query:{
		users:"UsersQuery"
	},
	Mutation:{
		users:"UsersMutation"
	},
	User:{
		_id:"String",
		username:"String",
		termsAccepted:"String",
		privacyPolicyAccepted:"String",
		followedServers:"ServerConnection",
		isOrganisator:"Boolean",
		fullName:"String",
		avatarUrl:"String",
		blockedUsers:"String",
		emailConfirmed:"Boolean",
		createdAt:"String"
	},
	UsersQuery:{
		user:"AuthorizedUserQuery",
		publicUsers:"PublicUsersQuery"
	},
	UsersMutation:{
		user:"AuthorizedUserMutation",
		publicUsers:"PublicUsersMutation"
	},
	PublicUsersQuery:{
		guest:"GuestQuery",
		login:"LoginQuery",
		getGoogleOAuthLink:"String",
		getMicrosoftOAuthLink:"String",
		getGithubOAuthLink:"String",
		getAppleOAuthLink:"String",
		requestForForgotPassword:"Boolean"
	},
	AuthorizedUserQuery:{
		organisator:"OrganisatorQuery",
		channelById:"Channel",
		me:"User"
	},
	AuthorizedUserMutation:{
		organisator:"OrganisatorMutation",
		channel:"UserChannelOps",
		followServer:"Boolean",
		makeMeOrganisator:"Boolean",
		uploadFile:"UploadResponse",
		blockUser:"Boolean",
		changePasswordWhenLogged:"ChangePasswordWhenLoggedResponse",
		editUser:"EditUserResponse",
		integrateSocialAccount:"IntegrateSocialAccountResponse"
	},
	PublicUsersMutation:{
		register:"RegisterResponse",
		verifyEmail:"VerifyEmailResponse",
		changePasswordWithToken:"ChangePasswordWithTokenResponse",
		generateOAuthToken:"GenerateOAuthTokenResponse"
	},
	EditUserResponse:{
		result:"Boolean",
		hasError:"EditUserError"
	},
	VerifyEmailResponse:{
		result:"Boolean",
		hasError:"VerifyEmailError"
	},
	ChangePasswordWhenLoggedResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWhenLoggedError"
	},
	ChangePasswordWithTokenResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWithTokenError"
	},
	IntegrateSocialAccountResponse:{
		result:"Boolean",
		hasError:"IntegrateSocialAccountError"
	},
	GenerateOAuthTokenResponse:{
		result:"String",
		hasError:"GenerateOAuthTokenError"
	},
	LoginQuery:{
		password:"LoginResponse",
		provider:"ProviderLoginQuery",
		refreshToken:"String"
	},
	ProviderLoginQuery:{
		apple:"ProviderResponse",
		google:"ProviderResponse",
		github:"ProviderResponse",
		microsoft:"ProviderResponse"
	},
	RegisterResponse:{
		registered:"Boolean",
		hasError:"RegisterErrors"
	},
	LoginResponse:{
		login:"String",
		accessToken:"String",
		refreshToken:"String",
		hasError:"LoginErrors"
	},
	ProviderResponse:{
		jwt:"String",
		accessToken:"String",
		refreshToken:"String",
		providerAccessToken:"String",
		register:"Boolean",
		hasError:"ProviderErrors"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}