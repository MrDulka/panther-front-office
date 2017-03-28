define(['../../../../error/ArgumentError',
	'../../../../error/NotFoundError',
	'../../../../util/Logger',

	'../../../../util/metadata/AnalyticalUnits',
	'./WorldWindWidgetPanel',

	'jquery',
	'string'
], function(ArgumentError,
			NotFoundError,
			Logger,

			AnalyticalUnits,
			WorldWindWidgetPanel,

			$,
			S
){
	/**
	 * Class representing AU Layers Panel of WorldWindWidget
	 * @param options {Object}
	 * @constructor
	 */
	var AuLayersPanel = function(options){
		WorldWindWidgetPanel.apply(this, arguments);
	};

	AuLayersPanel.prototype = Object.create(WorldWindWidgetPanel.prototype);

	/**
	 * Add content to panel
	 */
	AuLayersPanel.prototype.addContent = function(){
		this.addLayer(this._id + "-outlines", "Analytical Units outlines", this._panelBodySelector, "analyticalUnits", true);
		this.addEventsListeners();
	};

	/**
	 * Add layer to the panel and map
	 * @param elementId {string} Id of the HTML element
	 * @param name {string} Name of the layer
	 * @param container {JQuery} JQuery selector of the target element
	 * @param layerId {string} Id of the layer
	 * @param visible {boolean} true if the layer should be shown
	 */
	AuLayersPanel.prototype.addLayer = function(elementId, name, container, layerId, visible){
		this.addCheckbox(elementId, name, container, layerId, visible);
		this._auLayer = this._worldWind.layers.buildAuLayer(layerId, this._id);

		this._worldWind.layers.addLayer(this._auLayer);

		var layerData = {
			id: "analyticalUnits"

		};
		var tools = this.buildToolBox(layerData.id, this._id, container);
		this.addTools(tools, layerData, this._worldWind);
	};

	/**
	 * Add tools for the layer
	 * @param tools {LayerTools}
	 * @param layerMetadata {Object}
	 * @param worldWind {WorldWindMap}
	 */
	AuLayersPanel.prototype.addTools = function(tools, layerMetadata, worldWind){
		tools.addOpacity(layerMetadata, worldWind);
	};

	/**
	 * Rebuild panel with current configuration
	 * @param configuration {Object} configuration from global object ThemeYearConfParams
	 * @param data {Object}
	 */
	AuLayersPanel.prototype.rebuild = function(configuration, data){
		if (!configuration){
			throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "AuLayersPanel", "rebuild", "missingParameter"));
		}
		this.rebuildUnits(data.analyticalUnits);
	};

	/**
	 * Get units from server and rebuild layer
	 * @param units {Array}
	 */
	AuLayersPanel.prototype.rebuildUnits = function(units){
		if (units.length > 0){
			this._auLayer.redraw(units);
			this._worldWind.redraw();
		} else {
			console.warn(Logger.logMessage(Logger.LEVEL_WARNING, "AuLayersPanel", "constructor", "missingParameter"))
		}
	};

	/**
	 * Add listeners
	 */
	AuLayersPanel.prototype.addEventsListeners = function(){
		this.addCheckboxOnClickListener();
	};

	/**
	 * Hide/show layer
	 */
	AuLayersPanel.prototype.toggleLayer = function(){
		var self = this;
		setTimeout(function(){
			var checkbox = self._panelBodySelector.find(".checkbox-row");
			var id = checkbox.attr("data-id");
			if (checkbox.hasClass("checked")){
				self._auLayer.enableRenderables();
				self._worldWind.layers.showLayer(id);
			} else {
				self._auLayer.disableRenderables();
				self._worldWind.layers.hideLayer(id);
			}
		},50);
	};

	return AuLayersPanel;
});