define([
	'../../error/ArgumentError',
	'../../util/Logger',

	'jquery'
], function (ArgumentError,
			 Logger,

			 $) {
	"use strict";

	/**
	 * Handling with map
	 * @param options {Object}
	 * @param options.map {Object} Open Layers map
	 * @constructor
	 */
	var Map = function (options) {
		if (options){
			this._map = options.map;
		}
		this._layers = [];
	};
	
	Map.prototype.rebuild = function(map){
		if (map){
			this._map = map;
		}
	};

	/**
	 * Add layer to map
	 * @param data {Array}
	 * @param color {String}
	 */
	Map.prototype.addLayer = function(data, color){
		var vectorLayer = this.createVectorLayer(data, color);
		if(!this._layers[color]) {
			this._layers[color] = [];
		}
		this._layers[color].push(vectorLayer);
		this._map.addLayer(vectorLayer);
	};

	/**
	 * Create vector layer
	 * @param data {Array}
	 * @param color {String}
	 * @returns {*}
	 */
	Map.prototype.createVectorLayer = function(data, color){
		var vectorLayer = new OpenLayers.Layer.Vector("SelectedAreas", {
			styleMap: this.setStyle(color)
		});

		var features = [];
		var self = this;
		data.forEach(function(area){
			var feature = self.createVectorFeatruefromWKT(area.geom);
			features.push(feature);
		});
		vectorLayer.addFeatures(features);
		return vectorLayer;
	};

	/**
	 *
	 * @param geom {string} WKT geometry format
	 * @returns {*}
	 */
	Map.prototype.createVectorFeatruefromWKT = function(geom){
		return new OpenLayers.Feature.Vector(
			new OpenLayers.Geometry.fromWKT(geom)
		);
	};

	/**
	 * Add
	 * @returns {*}
	 */
	Map.prototype.setStyle = function(color){
		return new OpenLayers.StyleMap({
			strokeWidth: 1,
			strokeColor: color,
			fillColor: color,
			fillOpacity: 0.5
		});
	};

	/**
	 * Remove all previously added layers from map
	 */
	Map.prototype.removeLayers = function(color){
		if(!this._layers[color]){
			return;
		}

		var self = this;
		this._layers[color].forEach(function(layer){
			self._map.removeLayer(layer);
			self._layers.pop();
		});
	};

	Map.prototype.addOnClickListener = function(attributes, infoWindow){
		var layers = this.getBaseLayersIds();
		this._attributes = attributes;
		this._map.selectInMapLayer.params['LAYERS'] = layers.join(',');
		if (!this._newInfoControl){
			this._newInfoControl = new OpenLayers.Control.WMSGetFeatureInfo({
				url: Config.url+'api/proxy/wms',
				vendorParams: {
					propertyName: 'gid'
				},
				layers: [this._map.selectInMapLayer]
			});
			this._newInfoControl.events.register("getfeatureinfo", this, this.getInfoAboutArea.bind(this, infoWindow));
			this._map.addControl(this._newInfoControl);
		}
	};

	Map.prototype.getInfoAboutArea = function(infoWindow, e){
		var allFeatures = JSON.parse(e.text).features;
		if (allFeatures.length > 0){
			infoWindow.setVisibility("show");
			infoWindow.setScreenPosition(e.xy);

			var featureGid = allFeatures[allFeatures.length - 1].properties.gid;
			infoWindow.rebuild(this._attributes, featureGid);
		}
		else {
			infoWindow.setVisibility("hide");
		}
	};

	Map.prototype.onClickActivate = function(){
		this._newInfoControl.activate();
	};

	Map.prototype.onClickDeactivate = function(infoWindow){
		this._newInfoControl.deactivate();
		infoWindow.setVisibility("hide");
	};

	Map.prototype.getBaseLayersIds = function(){
		var auRefMap = FeatureInfo.auRefMap;
		var locations;
		if (ThemeYearConfParams.place.length > 0){
			locations = [Number(ThemeYearConfParams.place)];
		} else {
			locations = ThemeYearConfParams.allPlaces;
		}
		var year = JSON.parse(ThemeYearConfParams.years)[0];
		var areaTemplate = ThemeYearConfParams.auCurrentAt;

		var layers = [];
		for (var place in auRefMap){
			locations.forEach(function(location){
				if (auRefMap.hasOwnProperty(place) && place == location){
					for (var aTpl in auRefMap[place]){
						if (auRefMap[place].hasOwnProperty(aTpl) && aTpl == areaTemplate){
							for (var currentYear in auRefMap[place][aTpl]){
								if (auRefMap[place][aTpl].hasOwnProperty(currentYear) && currentYear == year){
									var unit = auRefMap[place][aTpl][currentYear];
									if (unit.hasOwnProperty("_id")){
										layers.push(Config.geoserver2Workspace + ':layer_'+unit._id);
									}
								}
							}
						}
					}
				}
			});
		}
		return layers;
	};

	return Map;
});