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
	 * Class representing Wms Layers Panel of WorldWindWidget
	 * @param options {Object}
	 * @constructor
	 */
	var WmsLayersPanel = function(options){
		WorldWindWidgetPanel.apply(this, arguments);
		this._groupId = "wmsLayer";
	};

	WmsLayersPanel.prototype = Object.create(WorldWindWidgetPanel.prototype);

	/**
	 * Rebuild panel
	 */
	WmsLayersPanel.prototype.rebuild = function(){
		this.clear(this._id);
		var filter = {};
		var configuration = Stores.retrieve("state").current();

		filter.scope = Number(configuration.scope);
		if (configuration.place.length > 0){
			filter.locations = Number(configuration.place);
		}
		var self = this;
		Stores.retrieve('wmsLayer').filter(filter).then(function(layers){
			if (layers.length > 0){
				layers.forEach(function(layer){
					self.addLayer(layer);
				});
				self.switchOnActiveLayers(self._groupId);
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
	WmsLayersPanel.prototype.addLayer = function(layer){
		var layerData = {
			id: "wmsLayer-" + layer.id,
			name: layer.name,
			layerPaths: layer.layer,
			opacity: 70,
			url: layer.url
		};
		for (var key in this._maps){
			this._maps[key].layers.addWmsLayer(layerData, this._id, false);
		}
		var control = this.addLayerControl(layerData.id, layerData.name, this._panelBodySelector, false);
		var tools = control.getToolBox();
		tools.addOpacity(layerData, this._maps);
	};

	return WmsLayersPanel;
});