define(['../../../../error/ArgumentError',
	'../../../../error/NotFoundError',
	'../../../../util/Logger',

	'./WorldWindWidgetPanel',

	'jquery',
	'string'
], function(ArgumentError,
			NotFoundError,
			Logger,

			WorldWindWidgetPanel,

			$,
			S
){
	/**
	 * Class representing Background Layers Panel of WorldWindWidget
	 * @param options {Object}
	 * @constructor
	 */
	var BackgroundLayersPanel = function(options){
		WorldWindWidgetPanel.apply(this, arguments);
		this.addContent();
	};

	BackgroundLayersPanel.prototype = Object.create(WorldWindWidgetPanel.prototype);

	/**
	 * Add content to panel
	 */
	BackgroundLayersPanel.prototype.addContent = function(){
		if(Config.toggles.isTacrPraha) {
			this.addLayer(this._id + "-jstk", "JSTK", this._panelBodySelector, "jstk", true);
			this.addLayer(this._id + "-osm", "OpenStreetMap", this._panelBodySelector, "osm", false);
		} else {
			this.addLayer(this._id + "-osm", "OpenStreetMap", this._panelBodySelector, "osm", true);
		}

		this.addLayer(this._id + "-carto-db", "Carto DB basemap", this._panelBodySelector, "cartoDb", false);
		//this.addLayer(this._id + "-bing-roads", "Bing roads", this._panelBodySelector, "bingRoads", false);
		this.addLayer(this._id + "-bing-aerial", "Bing Aerial", this._panelBodySelector, "bingAerial", false);
		this.addLayer(this._id + "-landsat", "Blue Marble", this._panelBodySelector, "landsat", false);

		this.toggleLayers();
		this.addEventsListeners();
	};

	/**
	 * Add layers to panel and map
	 * @param elementId {string} Id of the HTML element
	 * @param name {string} Name of the layer
	 * @param container {JQuery} JQuery selector of the target element
	 * @param layerId {string} Id of the layer
	 * @param visible {boolean} true if the layer should be shown
	 */
	BackgroundLayersPanel.prototype.addLayer = function(elementId, name, container, layerId, visible){
		this.addRadio(elementId, name, container, layerId, visible);
		this._worldWind.layers.addBackgroundLayer(layerId, this._id);
	};

	/**
	 * Add listeners
	 */
	BackgroundLayersPanel.prototype.addEventsListeners = function(){
		this.addRadioOnClickListener();
	};

	/**
	 * Hide all background layers and show only selected one
	 */
	BackgroundLayersPanel.prototype.toggleLayers = function(){
		var self = this;
		var radios = this._panelBodySelector.find(".radiobox-row");
		setTimeout(function(){
			radios.each(function(index, item){
				var radio = $(item);
				var dataId = radio.attr("data-id");
				if (radio.hasClass("checked")){
					self._worldWind.layers.showBackgroundLayer(dataId);
				} else {
					self._worldWind.layers.hideBackgroundLayer(dataId);
				}
			});
		},50);
	};

	return BackgroundLayersPanel;
});