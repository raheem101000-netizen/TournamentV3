/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	ModelNavigationCompiled: `scalar.ModelNavigationCompiled` as const,
	ObjectId: `scalar.ObjectId` as const,
	S3Scalar: `scalar.S3Scalar` as const,
	Timestamp: `scalar.Timestamp` as const,
	ImageFieldInput:{
		thumbnail:"S3Scalar",
		url:"S3Scalar"
	},
	ModifyVersion:{
		from:"Timestamp",
		to:"Timestamp"
	},
	CreateRootCMSParam:{

	},
	UploadFileInput:{

	},
	InputCMSField:{
		type:"CMSType",
		fields:"InputCMSField"
	},
	PageInput:{

	},
	BackupFile: `scalar.BackupFile` as const,
	AdminQuery:{
		analytics:{

		}
	},
	CMSType: "enum" as const,
	Query:{
		listcategory:{
			rootParams:"RootParamsInput"
		},
		listPaginatedcategory:{
			page:"PageInput",
			rootParams:"RootParamsInput"
		},
		onecategoryBySlug:{
			rootParams:"RootParamsInput"
		},
		variantscategoryBySlug:{

		},
		mediaQuery:{
			rootParams:"RootParamsInput"
		},
		filesQuery:{
			rootParams:"RootParamsInput"
		}
	},
	AdminMutation:{
		upsertModel:{
			fields:"InputCMSField"
		},
		removeModel:{

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
		upsertcategory:{
			category:"Modifycategory",
			rootParams:"RootParamsInput"
		},
		removecategory:{
			rootParams:"RootParamsInput"
		}
	},
	Modifycategory:{
		_version:"ModifyVersion",
		img:"ImageFieldInput",
		avatar:"ImageFieldInput"
	},
	RootParamsInput:{

	}
}

export const ReturnTypes: Record<string,any> = {
	ModelNavigationCompiled: `scalar.ModelNavigationCompiled` as const,
	ObjectId: `scalar.ObjectId` as const,
	S3Scalar: `scalar.S3Scalar` as const,
	Timestamp: `scalar.Timestamp` as const,
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
	AnalyticsResponse:{
		date:"String",
		value:"AnalyticsModelResponse"
	},
	AnalyticsModelResponse:{
		modelName:"String",
		calls:"Int",
		rootParamsKey:"String"
	},
	RootCMSParam:{
		name:"String",
		options:"String"
	},
	FileResponse:{
		key:"String",
		cdnURL:"String"
	},
	MediaResponse:{
		key:"String",
		cdnURL:"String",
		thumbnailCdnURL:"String",
		alt:"String"
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
		options:"String",
		relation:"String",
		fields:"CMSField",
		builtIn:"Boolean"
	},
	PageInfo:{
		total:"Int",
		hasNext:"Boolean"
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
		backup:"Boolean",
		backups:"MediaResponse",
		apiKeys:"ApiKey"
	},
	Mutation:{
		admin:"AdminMutation"
	},
	Query:{
		admin:"AdminQuery",
		navigation:"ModelNavigation",
		migrateToCloud:"String",
		isLoggedIn:"Boolean",
		rootParams:"RootCMSParam",
		listcategory:"category",
		listPaginatedcategory:"category__Connection",
		onecategoryBySlug:"category",
		variantscategoryBySlug:"category",
		fieldSetcategory:"String",
		modelcategory:"ModelNavigationCompiled",
		mediaQuery:"MediaResponse",
		filesQuery:"FileResponse"
	},
	AdminMutation:{
		upsertModel:"Boolean",
		removeModel:"Boolean",
		upsertParam:"Boolean",
		removeParam:"Boolean",
		uploadFile:"UploadFileResponseBase",
		uploadImage:"ImageUploadResponse",
		removeFiles:"Boolean",
		restore:"Boolean",
		generateApiKey:"Boolean",
		revokeApiKey:"Boolean",
		upsertcategory:"Boolean",
		removecategory:"Boolean"
	},
	category:{
		_version:"VersionField",
		name:"String",
		img:"ImageField",
		avatar:"ImageField",
		slug:"String",
		_id:"String"
	},
	category__Connection:{
		items:"category",
		pageInfo:"PageInfo"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}