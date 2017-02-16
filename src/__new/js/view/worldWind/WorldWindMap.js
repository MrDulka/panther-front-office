define(['../../error/ArgumentError',
		'../../error/NotFoundError',
		'../../util/Logger',

		'./Layers',
		'./MyGoToAnimator',

		'jquery',
		'worldwind',
		'css!./WorldWindMap'
], function(ArgumentError,
			NotFoundError,
			Logger,

			Layers,
			MyGoToAnimator,

			$
){
	/**
	 * Class World Wind Map
	 * @param options {Object}
	 * @constructor
	 */
	var WorldWindMap = function(options){
		this.buildContainer();
		this.setupWebWorldWind();
	};


	/**
	 * Rebuild world wind map
	 * @param config {Object} ThemeYearsConfParams global object
	 * @param widget {JQuery} JQuery widget selector
	 */
	WorldWindMap.prototype.rebuild = function(config, widget){
		this._goToAnimator.setLocation(config, widget)
	};

	/**
	 * It builds Web World Wind container
	 */
	WorldWindMap.prototype.buildContainer = function(){
		$("#main").append('<div id="world-wind-container">' +
				'<div id="world-wind-map">' +
					'<canvas id="world-wind-canvas">' +
						'Your browser does not support HTML5 Canvas.' +
					'</canvas>' +
				'</div>' +
				'<div id="widgets3d-placeholders-container">' +
				'</div>' +
			'</div>');
	};

	/**
	 * Set up Web World Wind
	 */
	WorldWindMap.prototype.setupWebWorldWind = function(){
		this._wwd = this.buildWorldWindow();
		this._goToAnimator = new MyGoToAnimator(this._wwd);
		this._layers = new Layers();
	};

	/**
	 * Add layer to the map
	 * @param layer {WorldWind.Layer}
	 */
	WorldWindMap.prototype.addLayer = function(layer){
		this._wwd.addLayer(layer);
		this.redraw();
	};

	/**
	 * Remove layer from map
	 * @param layer {WorldWind.Layer}
	 */
	WorldWindMap.prototype.removeLayer = function(layer){
		this._wwd.removeLayer(layer);
	};

	/**
	 * Show layer on the top of the globe
	 * @param layer {WorldWind.Layer}
	 */
	WorldWindMap.prototype.showLayer = function(layer){
		layer.opacity = 1;
		this.redraw();
	};

	/**
	 * Show layer
	 * @param layer {WorldWind.Layer}
	 */
	WorldWindMap.prototype.hideLayer = function(layer){
		layer.opacity = 0;
		this.redraw();
	};

	WorldWindMap.prototype.redraw = function(){
		this._wwd.redraw();
	};

	/**
	 * Build the World Wind Window
	 * @returns {WorldWind.WorldWindow}
	 */
	WorldWindMap.prototype.buildWorldWindow = function(){
		return new WorldWind.WorldWindow("world-wind-canvas");
	};

	/**
	 * It returns container for rendering of Web World Wind
	 * @returns {*}
	 */
	WorldWindMap.prototype.getContainer = function(){
		return $("#world-wind-container");
	};

	return WorldWindMap;
});