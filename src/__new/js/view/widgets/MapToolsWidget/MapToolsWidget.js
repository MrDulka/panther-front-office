define(['../../../actions/Actions',
	'../../../error/ArgumentError',
	'../../../error/NotFoundError',
	'../../../util/Logger',
	'../../../util/RemoteJQ',

	'../../tools/FeatureInfoTool/LayerInfoTool',
	'./MapToolTrigger',
	'../Widget',

	'jquery',
	'css!./MapToolsWidget'
], function(Actions,
			ArgumentError,
			NotFoundError,
			Logger,
			RemoteJQ,

			LayerInfoTool,
			MapToolTrigger,
			Widget,

			$){

	/**
	 * Class representing a widget of map tools for World Wind
	 * @param options {Object}
	 * @param options.dispatcher {Object} Object for handling events in the application.
	 * @param options.featureInfo {FeatureInfoTool}
	 * @constructor
	 */
	var MapToolsWidget = function(options){
		Widget.apply(this, arguments);

		this._dispatcher = options.dispatcher;
		this._featureInfo = options.featureInfo;
		this._tools = [];

		this.build();
		this.deleteFooter(this._widgetSelector);
	};

	MapToolsWidget.prototype = Object.create(Widget.prototype);

	/**
	 * Build basic view of the widget
	 */
	MapToolsWidget.prototype.build = function(){
		this._widgetBodySelector.append('<div class="map-tools-triggers-container"></div>');
		this._triggersContainerSelector = this._widgetBodySelector.find(".map-tools-triggers-container");

		if (this._featureInfo){
			this._tools.push(this.buildFeatureInfoTrigger());
		}

		this._layerInfo = this.buildLayerInfo();
		this._tools.push(this.buildLayerInfoTrigger());

		this.handleLoading("hide");
	};

	/**
	 * Rebuild all tools in widget
	 */
	MapToolsWidget.prototype.rebuild = function(){
		this._tools.forEach(function(tool){
			tool.rebuild();
		});
	};

	/**
	 * Build tool for info about layers
	 * @returns {LayerInfoTool}
	 */
	MapToolsWidget.prototype.buildLayerInfo = function(){
		return new LayerInfoTool({
			id: 'layer-info',
			dispatcher: this._dispatcher
		})
	};

	/**
	 * Build feature info tool trigger
	 * @returns {MapToolTrigger}
	 */
	MapToolsWidget.prototype.buildFeatureInfoTrigger = function(){
		return new MapToolTrigger({
			id: 'feature-info-trigger',
			label: polyglot.t("featureInfo"),
			hasSvgIcon: true,
			iconPath: '../src/__new/icons/feature-info.svg',
			dispatcher: this._dispatcher,
			target: this._triggersContainerSelector,
			onDeactivate: this._featureInfo.deactivateFor3D.bind(this._featureInfo),
			onActivate: this._featureInfo.activateFor3D.bind(this._featureInfo)
		});
	};

	/**
	 * Build layer info tool trigger
	 * @returns {MapToolTrigger}
	 */
	MapToolsWidget.prototype.buildLayerInfoTrigger = function(){
		return new MapToolTrigger({
			id: 'layer-info-trigger',
			label: polyglot.t("layerInfo"),
			hasSvgIcon: true,
			iconPath: '../src/__new/icons/layers-info.svg',
			dispatcher: this._dispatcher,
			target: this._triggersContainerSelector,
			onDeactivate: this._layerInfo.deactivate.bind(this._layerInfo),
			onActivate: this._layerInfo.activate.bind(this._layerInfo)
		});
	};

	return MapToolsWidget;
});