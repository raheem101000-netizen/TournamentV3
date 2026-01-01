/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	ObjectId: `scalar.ObjectId` as const,
	S3Scalar: `scalar.S3Scalar` as const,
	Timestamp: `scalar.Timestamp` as const,
	ModelNavigationCompiled: `scalar.ModelNavigationCompiled` as const,
	Sort: "enum" as const,
	PageInput:{

	},
	ImageFieldInput:{
		thumbnail:"S3Scalar",
		url:"S3Scalar"
	},
	VideoFieldInput:{
		previewImage:"S3Scalar",
		url:"S3Scalar"
	},
	DuplicateDocumentsInput:{
		originalRootParams:"RootParamsInput",
		newRootParams:"RootParamsInput",
		resultLanguage:"Languages"
	},
	CreateRootCMSParam:{

	},
	CreateVersion:{
		from:"Timestamp",
		to:"Timestamp"
	},
	CreateInternalLink:{

	},
	MediaOrderByInput:{
		date:"Sort"
	},
	MediaParamsInput:{
		page:"PageInput",
		sort:"MediaOrderByInput"
	},
	UploadFileInput:{

	},
	InputCMSField:{
		type:"CMSType",
		fields:"InputCMSField"
	},
	Languages: "enum" as const,
	Formality: "enum" as const,
	BackupFile: `scalar.BackupFile` as const,
	AdminQuery:{
		analytics:{

		},
		translationAnalytics:{

		}
	},
	GenerateContentInput:{
		language:"Languages"
	},
	GenerateImageModel: "enum" as const,
	GenerateImageQuality: "enum" as const,
	GenerateImageSize: "enum" as const,
	GenerateImageStyle: "enum" as const,
	GenerateImageInput:{
		model:"GenerateImageModel",
		quality:"GenerateImageQuality",
		size:"GenerateImageSize",
		style:"GenerateImageStyle"
	},
	TranslateDocInput:{
		originalRootParams:"RootParamsInput",
		newRootParams:"RootParamsInput",
		resultLanguages:"Languages",
		formality:"Formality"
	},
	CMSType: "enum" as const,
	Query:{
		listcategory:{
			rootParams:"RootParamsInput"
		},
		listPaginatedcategory:{
			page:"PageInput",
			rootParams:"RootParamsInput",
			sort:"categorySortInput"
		},
		onecategoryBySlug:{
			rootParams:"RootParamsInput"
		},
		variantscategoryBySlug:{

		},
		listpolicy:{
			rootParams:"RootParamsInput"
		},
		listPaginatedpolicy:{
			page:"PageInput",
			rootParams:"RootParamsInput",
			sort:"policySortInput"
		},
		onepolicyBySlug:{
			rootParams:"RootParamsInput"
		},
		variantspolicyBySlug:{

		},
		mediaQuery:{
			mediaParams:"MediaParamsInput",
			rootParams:"RootParamsInput"
		},
		filesQuery:{
			mediaParams:"MediaParamsInput",
			rootParams:"RootParamsInput"
		}
	},
	AdminMutation:{
		upsertModel:{
			fields:"InputCMSField"
		},
		removeModel:{

		},
		upsertVersion:{
			version:"CreateVersion"
		},
		removeVersion:{

		},
		upsertInternalLink:{
			link:"CreateInternalLink"
		},
		removeInternalLink:{

		},
		upsertParam:{
			param:"CreateRootCMSParam"
		},
		removeParam:{

		},
		uploadFile:{
			file:"UploadFileInput"
		},
		uploadImage:{
			file:"UploadFileInput"
		},
		removeFiles:{

		},
		restore:{
			backup:"BackupFile"
		},
		generateApiKey:{

		},
		revokeApiKey:{

		},
		translateDocument:{
			param:"TranslateDocInput"
		},
		generateContent:{
			input:"GenerateContentInput"
		},
		generateImage:{
			input:"GenerateImageInput"
		},
		changeLogo:{

		},
		duplicateDocuments:{
			params:"DuplicateDocumentsInput"
		},
		upsertcategory:{
			category:"Modifycategory",
			rootParams:"RootParamsInput"
		},
		removecategory:{
			rootParams:"RootParamsInput"
		},
		duplicatecategory:{
			rootParams:"RootParamsInput"
		},
		upsertpolicy:{
			policy:"Modifypolicy",
			rootParams:"RootParamsInput"
		},
		removepolicy:{
			rootParams:"RootParamsInput"
		},
		duplicatepolicy:{
			rootParams:"RootParamsInput"
		}
	},
	Modifycategory:{
		_version:"CreateVersion",
		img:"ImageFieldInput",
		avatar:"ImageFieldInput"
	},
	Modifypolicy:{
		_version:"CreateVersion"
	},
	RootParamsInput:{

	},
	categorySortInput:{
		slug:"Sort",
		createdAt:"Sort",
		updatedAt:"Sort"
	},
	policySortInput:{
		slug:"Sort",
		createdAt:"Sort",
		updatedAt:"Sort"
	}
}

export const ReturnTypes: Record<string,any> = {
	VersionField:{
		name:"String",
		from:"Timestamp",
		to:"Timestamp"
	},
	ImageField:{
		url:"S3Scalar",
		thumbnail:"S3Scalar",
		alt:"String"
	},
	VideoField:{
		url:"S3Scalar",
		previewImage:"S3Scalar",
		alt:"String"
	},
	InternalLink:{
		_id:"ObjectId",
		keys:"String",
		href:"String"
	},
	RootCMSParam:{
		name:"String",
		options:"String",
		default:"String"
	},
	ModelNavigation:{
		name:"String",
		display:"String",
		fields:"CMSField",
		fieldSet:"String"
	},
	CMSField:{
		name:"String",
		type:"CMSType",
		list:"Boolean",
		searchable:"Boolean",
		sortable:"Boolean",
		options:"String",
		relation:"String",
		fields:"CMSField",
		builtIn:"Boolean"
	},
	ObjectId: `scalar.ObjectId` as const,
	S3Scalar: `scalar.S3Scalar` as const,
	Timestamp: `scalar.Timestamp` as const,
	ModelNavigationCompiled: `scalar.ModelNavigationCompiled` as const,
	PageInfo:{
		total:"Int",
		hasNext:"Boolean"
	},
	AnalyticsResponse:{
		date:"String",
		value:"AnalyticsModelResponse"
	},
	AnalyticsModelResponse:{
		modelName:"String",
		calls:"Int",
		rootParamsKey:"String",
		tokens:"Int"
	},
	FileResponse:{
		key:"String",
		cdnURL:"String",
		modifiedAt:"String"
	},
	FileConnection:{
		items:"FileResponse",
		pageInfo:"PageInfo"
	},
	MediaResponse:{
		key:"String",
		cdnURL:"String",
		thumbnailCdnURL:"String",
		alt:"String",
		modifiedAt:"String"
	},
	MediaConnection:{
		items:"MediaResponse",
		pageInfo:"PageInfo"
	},
	UploadFileResponseBase:{
		key:"String",
		putURL:"String",
		cdnURL:"String",
		alt:"String"
	},
	ImageUploadResponse:{
		file:"UploadFileResponseBase",
		thumbnail:"UploadFileResponseBase"
	},
	ApiKey:{
		name:"String",
		createdAt:"String",
		_id:"ObjectId",
		value:"String"
	},
	BackupFile: `scalar.BackupFile` as const,
	AdminQuery:{
		analytics:"AnalyticsResponse",
		translationAnalytics:"AnalyticsResponse",
		backup:"Boolean",
		backups:"MediaResponse",
		apiKeys:"ApiKey"
	},
	Mutation:{
		admin:"AdminMutation"
	},
	Query:{
		navigation:"ModelNavigation",
		rootParams:"RootCMSParam",
		versions:"VersionField",
		links:"InternalLink",
		admin:"AdminQuery",
		isLoggedIn:"Boolean",
		logoURL:"String",
		listcategory:"category",
		listPaginatedcategory:"category__Connection",
		onecategoryBySlug:"category",
		variantscategoryBySlug:"category",
		fieldSetcategory:"String",
		modelcategory:"ModelNavigationCompiled",
		listpolicy:"policy",
		listPaginatedpolicy:"policy__Connection",
		onepolicyBySlug:"policy",
		variantspolicyBySlug:"policy",
		fieldSetpolicy:"String",
		modelpolicy:"ModelNavigationCompiled",
		mediaQuery:"MediaConnection",
		filesQuery:"FileConnection"
	},
	AdminMutation:{
		upsertModel:"Boolean",
		removeModel:"Boolean",
		upsertVersion:"Boolean",
		removeVersion:"Boolean",
		upsertInternalLink:"Boolean",
		removeInternalLink:"Boolean",
		upsertParam:"Boolean",
		removeParam:"Boolean",
		uploadFile:"UploadFileResponseBase",
		uploadImage:"ImageUploadResponse",
		removeFiles:"Boolean",
		restore:"Boolean",
		generateApiKey:"Boolean",
		revokeApiKey:"Boolean",
		translateDocument:"Boolean",
		generateContent:"String",
		generateImage:"String",
		changeLogo:"Boolean",
		removeLogo:"Boolean",
		duplicateDocuments:"Boolean",
		upsertcategory:"Boolean",
		removecategory:"Boolean",
		duplicatecategory:"Boolean",
		upsertpolicy:"Boolean",
		removepolicy:"Boolean",
		duplicatepolicy:"Boolean"
	},
	category:{
		_version:"VersionField",
		name:"String",
		img:"ImageField",
		avatar:"ImageField",
		slug:"String",
		_id:"String",
		createdAt:"Float",
		updatedAt:"Float",
		draft_version:"Boolean"
	},
	category__Connection:{
		items:"category",
		pageInfo:"PageInfo"
	},
	policy:{
		_version:"VersionField",
		title:"String",
		body:"String",
		slug:"String",
		_id:"String",
		createdAt:"Float",
		updatedAt:"Float",
		draft_version:"Boolean"
	},
	policy__Connection:{
		items:"policy",
		pageInfo:"PageInfo"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}