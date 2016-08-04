var Config = {
	url: 'http://localhost/',
	signupAddress: 'http://localhost/geonode/account/signup/',
	geoserver2Workspace: "puma",
	initialBaseMap: "terrain",
	initialMapBounds: [
		112.4251556396,
		-7.7001045314,
		113.0046844482,
		-6.9809544265
	],

	toggles: {
		noGeoserverLayerGroups: false,
		useWBAgreement: false,
		useWBHeader: false,
		useHeader: false,
		useWBFooter: false,
		allowPumaHelp: false,
		allowDownloadsLink: false,
		usePumaLogo: false,
		advancedFiltersFirst: true,
		hasNewEvaluationTool: false,
		isNewDesign: true,
		isUrbis: false,
		isEea: true
	},

	texts: {
		advancedFiltersName: "Evaluation Tool",
		areasSectionName: "Selection level",
		appTitle: "URBIS tool",
		appName: "&nbsp;",
		scopeName: "Scale",
		scopeAbout: "Different type of data and information address different scales of analysis, which correspond to different levels of urban-related decision making. Please choose your scale of interest first.",
		placeName: "Pilot",
		placeAbout: "URBIS services are demonstrated thought implementation on three pilot sites, represented by city-regions distributed across Europe. The basic portfolio of URBIS services is prepared for all three pilots, advanced types of services must not be implemented for all pilots. You can start with analysis for single pilot of your interest or with benchmarking of all three pilots.",
		themeName: "Theme",
		themeAbout: "URBIS services are focused on different thematic information, including Green and Grey infrastructure or Urban Land Typology and Dynamics. Please select theme/service according your thematic interests."
	},
	googleAnalyticsTracker: '',
	googleAnalyticsCookieDomain: 'auto',
	environment: 'development'
};