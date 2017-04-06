define([
	'jquery',
	'worldwind'
], function ($) {
	var ClickRecognizer = WorldWind.ClickRecognizer;
	var Vec2 = WorldWind.Vec2;

	/**
	 *
	 * @param wwd
	 * @constructor
	 */
	var SelectionController = function (wwd) {
		this.wwd = wwd;
		// Use the wwd to retrieve the state using the lookAt navigator.
		// Set it up so that when enabled it handles clicks alongside the LookAtNavigator.
		new ClickRecognizer(wwd, function (recognizer) {
			this.retrieveInfoForPoint(recognizer);
		}.bind(this))

		this.ctrl = false;
		$(document).keydown(function(event){
			if(event.which=="17") {
				this.ctrl = true;
			}
		}.bind(this));
		$(document).keyup(function(event){
			if(event.which=="17") {
				this.ctrl = false;
			}
		}.bind(this));
	};

	SelectionController.prototype.retrieveInfoForPoint = function (recognizer) {
		var pointObjects = this.wwd.pick(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY));

		var latitude = pointObjects.objects[0].position.latitude;
		var longitude = pointObjects.objects[0].position.longitude;

		// Selection layers.
		var layers = this.getBaseLayerIds().map(layer => {
			return 'layers[]='+layer+'&';
		});
		var url = Config.url + 'rest/area?latitude='+latitude+'&longitude='+longitude+'&' + layers;

		$.get(url, function(data){
			// On click switch among selected
			// Handle showing the layer with selected areas

			if(this.ctrl) {
				this.selectAreas(data.areas);
			} else {
				this.switchSelected(data.areas);
			}
		}.bind(this));
	};

	SelectionController.prototype.switchSelected = function(gids) {
		var areas = gids.map(function(gid){
			return {
				at: ThemeYearConfParams.auCurrentAt,
				gid: gid,
				loc: Number(ThemeYearConfParams.place)
			};
		});
		Select.select(areas, false, false, 100);
		Select.colourMap(Select.selectedAreasMap);
	};

	/**
	 * It adds all given gids among selected areas.
	 * @param gids
	 */
	SelectionController.prototype.selectAreas = function(gids) {
		var areas = [];
		var currentlySelected = Select.selectedAreasMap[Select.actualColor];

		gids.forEach(function (gid) {
			if (ThemeYearConfParams.place) {
				var unit = {
					at: ThemeYearConfParams.auCurrentAt,
					gid: gid,
					loc: Number(ThemeYearConfParams.place)
				};

				var contained = false;
				areas = currentlySelected.filter(function (selected) {
					if (selected.at === unit.at && selected.gid === unit.gid && selected.loc === unit.loc) {
						contained = true;
						return false;
					}
				});
				if (!contained) {
					areas.push(unit);
				}
			} else {
				// Handle situation where all places are selected.
			}
		});

		Select.select(areas, true, false, 100);
		Select.colourMap(Select.selectedAreasMap);
	};

	//TODO: Refactor, duplicate code.
	SelectionController.prototype.getBaseLayerIds = function() {
		var auRefMap = OlMap.auRefMap;
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

	return SelectionController;
});