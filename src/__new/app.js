requirejs.config({
    baseUrl: './__new',

    paths: {
        'css': 'lib/css.min',
        'jquery': 'lib/jquery-3.0.0',
        'jquery-private': 'js/jquery-private',
        'jquery-ui': 'lib/jquery-ui.min',
        'resize': 'lib/detect-element-resize',
        'string': 'lib/string',
        'underscore': 'lib/underscore-min',
        'text': 'lib/text',
        'wicket': 'lib/wicket',
        'worldwind': 'lib/worldwind.min'
    },

    map: {
        // '*' means all modules will get 'jquery-private' for their 'jquery' dependency.
        '*': {
            'css': 'css',
            'jquery': 'jquery-private'
        },

        // 'jquery-private' wants the real jQuery module though. If this line was not here, there would be an unresolvable cyclic dependency.
        'jquery-private': {
            'jquery': 'jquery'
        }
    },

    shim: {
        'jquery-ui': ['jquery'],
        'underscore': {
            exports: '_'
        }
    }
});

define(['js/util/metadata/Attributes',
        'js/util/metadata/AnalyticalUnits',
        'js/view/widgets/CityWidget/CityWidget',
        'js/view/widgets/CustomDrawingWidget/CustomDrawingWidget',
        'js/view/widgets/EvaluationWidget/EvaluationWidget',
        'js/view/tools/FeatureInfoTool/FeatureInfoTool',
        'js/util/Filter',
        'js/util/Floater',
		'./FrontOffice',
        'js/util/Logger',
        'js/view/map/Map',
        'js/view/widgets_3D/MapDiagramsWidget/MapDiagramsWidget',
        'js/util/Placeholder',
		'js/util/Remote',
		'js/stores/Stores',
        'js/view/worldWind/WorldWindMap',
        'js/view/widgets/WorldWindWidget/WorldWindWidget',

        'string',
        'jquery',
        'jquery-ui',
        'underscore'
], function (Attributes,
             AnalyticalUnits,
             CityWidget,
             CustomDrawingWidget,
             EvaluationWidget,
             FeatureInfoTool,
             Filter,
             Floater,
			 FrontOffice,
             Logger,
             Map,
             MapDiagramsWidget,
             Placeholder,
			 Remote,
			 Stores,
             WorldWindMap,
             WorldWindWidget,

             S,
             $){

    $(document).ready(function() {
        var tools = [];
        var widgets = [];
        var widgets3D = [];

        var attributes = buildAttributes();
        var analyticalUnits = buildAnalyticalUnits();

        var filter = buildFilter();
        var olMap = buildOpenLayersMap();
        
        // create tools and widgets according to configuration
        if(Config.toggles.hasOwnProperty("hasNew3Dmap") && Config.toggles.hasNew3Dmap){
            var webWorldWind = buildWorldWindMap();
            widgets.push(buildWorldWindWidget(webWorldWind));
            widgets3D.push(buildMapDiagramsWidget(webWorldWind, filter));
        }
        if(Config.toggles.hasOwnProperty("hasNewEvaluationTool") && Config.toggles.hasNewEvaluationTool){
            widgets.push(buildEvaluationWidget(filter));
        }
        if(Config.toggles.hasOwnProperty("hasNewCustomPolygonsTool") && Config.toggles.hasNewCustomPolygonsTool){
            widgets.push(buildCustomDrawingWidget());
        }
        if(Config.toggles.hasOwnProperty("isMelodies") && Config.toggles.isMelodies){
            widgets.push(buildCityWidget());
        }
        if(Config.toggles.hasOwnProperty("hasNewFeatureInfo") && Config.toggles.hasNewFeatureInfo){
            tools.push(buildFeatureInfoTool());
        }

        // build app, map is class for OpenLayers map
        new FrontOffice({
            attributesMetadata: attributes,
            analyticalUnits: analyticalUnits,
            tools: tools,
            widgets: widgets,
            widgetOptions: {
                olMap: olMap
            },
            widgets3D: widgets3D
        });

        var widgetElement = $("#widget-container");
        var floater = $(".floater");

        widgetElement.on("click", ".placeholder", function(e){
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
                var placeholderSelector = "#" + $(this).attr("id");
                var floaterSelector = "#" + $(this).attr("id").replace("placeholder", "floater");
                var floater = $(floaterSelector);
                var placeholder = $(placeholderSelector);
                if (floater.hasClass("open")) {
                    Floater.minimise(floater);
                    Placeholder.floaterClosed(placeholder);
                    ExchangeParams.options.openWidgets[floaterSelector.slice(1)] = false;
                }
                else {
                    Floater.maximise(floater);
                    Placeholder.floaterOpened(placeholder);
                    $(".floater").removeClass("active");
                    floater.addClass("active");
                    ExchangeParams.options.openWidgets[floaterSelector.slice(1)] = true;
                }
            }
        });
        floater.on("click", ".widget-minimise", function(e){
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
                var floater = $(this).parent().parent().parent();
                var placeholderSelector = "#" + floater.attr("id").replace("floater", "placeholder");
                var placeholder = $(placeholderSelector);
                Floater.minimise(floater);
                Placeholder.floaterClosed(placeholder);
                ExchangeParams.options.openWidgets[floater.attr("id")] = false;
            }
        });
        floater.draggable({
            containment: "body",
            handle: ".floater-header"
        }).on("click drag", function(){
            $(".floater").removeClass("active");
            $(this).addClass("active");
        });
    });

	/**
     * Build Attributes instance
     * @returns {Attributes}
     */
    function buildAttributes (){
        return new Attributes();
    }

    /**
     * Build AnalyticalUnits instance
     * @returns {AnalyticalUnits}
     */
    function buildAnalyticalUnits (){
        return new AnalyticalUnits();
    }

	/**
	 * Build Filter instance
     * @returns {Filter}
     */
    function buildFilter (){
        return new Filter();
    }

	/**
	 * Build Map instance
     * @returns {Map}
     */
    function buildOpenLayersMap (){
        return new Map();
    }

    /**
     * Build World Wind Map instance
     * @returns {WorldWindMap}
     */
    function buildWorldWindMap (){
        return new WorldWindMap();
    }


    /**
	 * Build Evaluation Widget instance
     * @param filter {Filter}
     * @returns {EvaluationWidget}
     */
    function buildEvaluationWidget (filter){
        return new EvaluationWidget({
            filter: filter,
            elementId: 'evaluation-widget',
            name: 'Evaluation Tool',
            targetId: 'widget-container'
        });
    }

	/**
     * Build Custom Drawing Widget instance
     * @returns {CustomDrawingWidget}
     */
    function buildCustomDrawingWidget (){
        return new CustomDrawingWidget({
            elementId: 'custom-polygons-widget',
            name: 'Custom Features',
            targetId: 'widget-container'
        });
    }

	/**
	 * Build City Widget instance
     * @returns {CityWidget}
     */
    function buildCityWidget (){
        return new CityWidget({
            elementId: 'city-selection',
            name: 'UrbanDynamic Tool',
            targetId: 'widget-container',
            selections: [{
                id: 'melodies-city-selection',
                name: 'Select city',
                options: ['Brno', 'České Budějovice', 'Plzeň', 'Ostrava']
            }, {
                id: 'melodies-start-selection',
                name: 'Select start',
                options: ['2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016']
            }, {
                id: 'melodies-end-selection',
                name: 'Select end',
                options: ['2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016']
            }]
        })
    }

    /**
     * Build MapDiagramsWidget instance
     * @param webWorldWind {WorldWindMap}
     * @param filter {Filter}
     * @returns {MapDiagramsWidget}
     */
    function buildMapDiagramsWidget (webWorldWind, filter){
        return new MapDiagramsWidget({
            id: 'map-diagrams-widget',
            name: 'Map Diagrams',
            filter: filter,
            worldWind: webWorldWind
        });
    }

    /**
     * Build WorldWindWidget instance
     * @param webWorldWind {WorldWindMap}
     * @returns {WorldWindWidget}
     */
    function buildWorldWindWidget (webWorldWind){
        return new WorldWindWidget({
            elementId: 'world-wind-widget',
            name: '3D Map',
            targetId: 'widget-container',
            worldWind: webWorldWind
        });
    }

	/**
	 * Build Feature Info Tool instance
     * @returns {FeatureInfoTool}
     */
    function buildFeatureInfoTool(){
        return new FeatureInfoTool({
            elementId: 'feature-info',
            targetId: 'tools-container'
        });
    }
});