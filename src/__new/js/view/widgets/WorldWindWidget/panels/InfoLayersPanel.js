define(['../../../../error/ArgumentError',
	'../../../../error/NotFoundError',
	'../../../../util/Logger',

	'../../../../stores/Stores',
	'./WorldWindWidgetPanel',

	'jquery',
	'string'
], function(ArgumentError,
			NotFoundError,
			Logger,

			Stores,
			WorldWindWidgetPanel,

			$,
			S
){
	/**
	 * Class representing Info Layers Panel of WorldWindWidget
	 * @param options {Object}
	 * @constructor
	 */
	var InfoLayersPanel = function(options){
		WorldWindWidgetPanel.apply(this, arguments);
	};

	InfoLayersPanel.prototype = Object.create(WorldWindWidgetPanel.prototype);

	/**
	 * Add content to panel
	 */
	InfoLayersPanel.prototype.addContent = function(){
		this.addEventsListeners();
	};

	/**
	 * Rebuild panel with current configuration
	 * @param configuration {Object} configuration from global object ThemeYearConfParams
	 */
	InfoLayersPanel.prototype.rebuild = function(configuration){
		if (!configuration){
			throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "InfoLayersPanel", "constructor", "missingParameter"));
		}
		this.clear();

		var self = this;
		Stores.retrieve('layer').all().then(function(layers){
			if (layers.length > 0){
				layers.forEach(function(layer){
					self.addLayer(layer);
				});
				self.displayPanel("block");
			} else {
				self.displayPanel("none");
			}
		}).catch(function(err){
			throw new Error(err);
		});
	};

	/**
	 * Add layer to the panel and map
	 * @param layer {Object}
	 */
	InfoLayersPanel.prototype.addLayer = function(layer){
		var name = layer.name.split(":")[1];
		var id = this._id + "-" + name;

		this._worldWind.layers.addInfoLayer(layer, name, this._id, false);
		var wwLayer = this._worldWind.layers.getLayerById(id);
		this.addRowToPanel(id, name, wwLayer, this._worldWind);
	};

	/**
	 * Add tools for the layer
	 * @param tools {LayerTools}
	 * @param layer {WorldWind.Layer}
	 */
	InfoLayersPanel.prototype.addTools = function(tools, layer, worldWind){
		tools.addLegend(layer);
		tools.addOpacity(layer, worldWind);
	};

	/**
	 * Add listeners
	 */
	InfoLayersPanel.prototype.addEventsListeners = function(){
		this.addCheckboxOnClickListener();
	};

	/**
	 * Hide/show layers
	 */
	InfoLayersPanel.prototype.toggleLayer = function(event){
		var self = this;
		setTimeout(function(){
			var checkbox = $(event.currentTarget);
			var layerId = checkbox.attr("data-id");
			if (checkbox.hasClass("checked")){
				self._worldWind.layers.showLayer(layerId);
			} else {
				self._worldWind.layers.hideLayer(layerId);
			}
		},50);
	};

	return InfoLayersPanel;
});