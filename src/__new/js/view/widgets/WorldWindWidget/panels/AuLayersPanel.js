define(['../../../../error/ArgumentError',
	'../../../../error/NotFoundError',
	'../../../../util/Logger',

	'../../../../util/RemoteJQ',
	'./ThematicLayersPanel',

	'jquery',
	'string',
	'underscore'
], function(ArgumentError,
			NotFoundError,
			Logger,

			Remote,
			ThematicLayersPanel,

			$,
			S,
			_
){
	/**
	 * Class representing AU Layers Panel of WorldWindWidget
	 * @param options {Object}
	 * @constructor
	 */
	var AuLayersPanel = function(options){
		ThematicLayersPanel.apply(this, arguments);

		this._layers = {
			outlines: {},
			selected: {}
		};
	};

	AuLayersPanel.prototype = Object.create(ThematicLayersPanel.prototype);

	AuLayersPanel.prototype.addListeners = function(){
		Stores.listeners.push(this.rebuild.bind(this, "updateOutlines"));
		Stores.listeners.push(this.clearAllSelections.bind(this, "clearAllSelections"));
		Stores.listeners.push(this.clearActiveSelection.bind(this, "clearActiveSelection"));
	};

	/**
	 * Clear whole selection
	 * @param action
	 * @param notification
	 */
	AuLayersPanel.prototype.clearAllSelections = function(action, notification){
		if (action == notification && notification == "clearAllSelections"){
			$("#selectedareasfilled-panel-row").remove();
			this.clearLayers("selectedareasfilled");
			Stores.selectedOutlines = null;
		}
	};

	/**
	 * Clear active selection
	 * @param action
	 * @param notification
	 */
	AuLayersPanel.prototype.clearActiveSelection = function(action, notification){
		if (action == notification && notification == "clearActiveSelection") {
			this.redrawLayer(this._layers.selected, "selectedareasfilled", Stores.selectedOutlines);
		}
	};

	/**
	 * Check the list of active layers and switch them on
	 */
	AuLayersPanel.prototype.switchOnLayersFrom2D = function(){
		if(Stores.outlines){
			this.switchOnOutlines();
		}
		if(Stores.selectedOutlines){
			this.switchOnSelected();
		}
	};

	AuLayersPanel.prototype.switchOnOutlines = function(){
		this.redrawLayer(this._layers.outlines, "areaoutlines", Stores.outlines);
		this.switchOnActiveLayers("areaoutlines");
	};

	AuLayersPanel.prototype.switchOnSelected = function(){
		this.redrawLayer(this._layers.selected, "selectedareasfilled", Stores.selectedOutlines);
		this.switchOnActiveLayers("selectedareasfilled");
	};

	/**
	 * Rebuild AU layers panel.
	 * @param action
	 * @param notification
	 */
	AuLayersPanel.prototype.rebuild = function(action, notification){
		if (action == notification && notification == "updateOutlines"){
			this.clear(this._id);

			if(Stores.selectedOutlines) {
				this.rebuildControl("Selected areas filled", this._layers.selected, "selectedareasfilled");
				this.switchOnSelected();
			}

			if(Stores.outlines){
				this.rebuildControl("Area outlines", this._layers.outlines, "areaoutlines");
				this.switchOnOutlines();
			}
		}
	};

	/**
	 * Rebuild layer control
	 * @param name {string} name of the layer
	 * @param layer {Object} layer data
	 * @param id {string} id of the group
	 */
	AuLayersPanel.prototype.rebuildControl = function(name, layer, id){
		var selected = {
			id: id,
			name: name,
			opacity: 70
		};

		layer.layerData = selected;
		layer.control = this.addLayerControl(selected.id, selected.name, this._panelBodySelector, false);
	};

	/**
	 * Redraw layer
	 * @param layer {Object} layer data
	 * @param id {string} id of the group
	 * @param store {Object} store with data from 2D
	 */
	AuLayersPanel.prototype.redrawLayer = function(layer, id, store){
		this.clearLayers(id);
		if (!_.isEmpty(layer)){
			layer.layerData.layer = store.layerNames;
			layer.layerData.sldId = store.sldId;

			for (var key in this._maps){
				this._maps[key].layers.addChoroplethLayer(layer.layerData, id, false);
			}

			var toolBox = layer.control.getToolBox();
			toolBox.clear();
			toolBox.addOpacity(layer.layerData, this._maps);
		}
	};

	return AuLayersPanel;
});