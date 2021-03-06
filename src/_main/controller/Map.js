Ext.define('PumaMain.controller.Map', {
	extend: 'Ext.app.Controller',
	views: [],
	requires: [],
	init: function() {
		// URBIS change
		Observer.addListener("getMap",this.newGetMap.bind(this));

		Observer.addListener("PumaMain.controller.Map.onExportMapUrl",this.onExportMapUrl.bind(this, {itemId:'top-toolbar-snapshot'}));

		this.control({
			'#map': {
				afterrender: this.afterRender,
				resize: this.onResize
			},
			'#map2': {
				afterrender: this.afterRender,
				resize: this.onResize
			},
			'component[type=extentoutline]': {
				afterrender: this.afterExtentOutlineRender,
				resize: this.onResize
			},
			'#zoomselectedbtn': {
				click: this.onZoomSelected
			},
			'initialbar #featureinfobtn': {
				toggle: this.onFeatureInfoActivated
			},
			'#measurelinebtn': {
				toggle: this.onMeasureActivated
			},
			'#measurepolygonbtn': {
				toggle: this.onMeasureActivated
			},
			'#multiplemapsbtn': {
				toggle: this.onMultipleYearsToggle
			},
			'#compareperiods': {
				toggle: this.onMultipleYearsToggle
			},
			'#savemapbtn': {
				click: this.onExportMapUrl
			},
			'#mapsnapshotbtn': {
				click: this.onExportMapUrl
			}
		});

		Select.areaStore = Ext.StoreMgr.lookup('area');
	},

	// URBIS change
	newGetMap: function(){
		OlMap.map = this.getOlMap();
		OlMap.map2 = this.getOlMap2();
	},

	onExportMapUrl: function(btn) {
		var map1 = Ext.ComponentQuery.query('#map')[0].map;
		var map2 = Ext.ComponentQuery.query('#map2')[0].map;
		var layerStore = Ext.StoreMgr.lookup('selectedlayers');
		var years = Ext.ComponentQuery.query('#selyear')[0].getValue();
		var maps = years.length>1 ? [map1,map2] : [map1];
		//var useFirst = layerStore.getAt(0).get('layer1').map == map;
		var mapCfg = {};
		var layers1 = [];
		var layers2 = [];
		var me = this;
		Puma.util.Msg.msg('Snapshot creation started','','r');
		layerStore.each(function(rec) {
			
			for (var i = 0; i < maps.length; i++) {
				var map = maps[i];
				var layer = rec.get(i == 0 ? 'layer1' : 'layer2');
				var layers = i==0 ? layers1 : layers2;
				var sldId = layer.params ? layer.params['SLD_ID'] : null;
				var layersParam = layer.params ? layer.params['LAYERS'] : null;
				var stylesParam = layer.params ? layer.params['STYLES'] : null;
				var obj = {
					type: rec.get('type'),
					opacity: layer.opacity || 1,
					sldId: sldId,
					name: rec.get('name'),
					legendSrc: rec.get('src'),
					layersParam: layersParam,
					stylesParam: stylesParam
				};

				layers.push(obj);
			}
		});
		var store = Ext.StoreMgr.lookup('year');
		mapCfg = {
			layers: layers1,
			layers2: years.length>1 ? layers2 : null,
			type: 'map',
			trafficLayer: Ext.StoreMgr.lookup('layers').getRootNode().findChild('type','livegroup').childNodes[0].get('checked'),
			year: map1.year,
			yearName: store.getById(map1.year).get('name'),
			year2: years.length>1 ? map2.year : null,
			year2Name: years.length>1 ? store.getById(map2.year).get('name') : null,
			center: map1.center,
			size: map1.size,
			zoom: map1.zoom
		}
		Ext.Ajax.request({
			url: Config.url + 'api/urlview/saveChart',
			params: {
				cfg: JSON.stringify(mapCfg)
			},
			scope: this,
			method: 'POST',
			success: function(response) {
				var id = JSON.parse(response.responseText).data;
				this.getController('Chart').onUrlCallback(id,btn.itemId=='savemapbtn')
			}
		})
	},
	
	onMultipleYearsToggle: function(btn,pressed) {
		if (!btn.leftYearsUnchanged) {
			var yearCnt = Ext.ComponentQuery.query('#selyear')[0]
			var years = yearCnt.getValue();
			if (years.length<2 && pressed) {
				var newYears = [years[0]];
				var yearsInStore = Ext.StoreMgr.lookup('year4sel').getRange();
				for (var i=yearsInStore.length-1;i>=0;i--) {
					var year = yearsInStore[i].get('_id');
					if (Ext.Array.contains(years,year)) {
						continue;
					}
					if (newYears.length<2) {
						Ext.Array.insert(newYears,i==yearsInStore.length-1 ? 1 : 0,[year])
					}
				}
				yearCnt.setValue(newYears)
			}
			if (years.length>1 && !pressed) {
				yearCnt.setValue([years[years.length-1]])
			}
			btn.toBeChanged = true;
			return;
		}
		btn.toBeChanged = false;
		var domController = this.getController('DomManipulation');
		if (pressed) {
			domController.activateMapSplit();
		} else {
			domController.deactivateMapSplit();
		}
		this.multiMap = pressed;
		this.map1.multiMap = pressed;
		this.map2.multiMap = pressed;
		var method = pressed ? 'addCls':'removeCls';
		Ext.get(this.map1.div)[method]('noattrib');
		var controlZoom = Ext.select('#app-map .olControlZoom');
		controlZoom.setVisible(!pressed);
		
		this.switchMap(pressed);
	},
	
	switchMap: function(both,second) {
		var map1 = Ext.ComponentQuery.query('#map')[0];
		var map2 = Ext.ComponentQuery.query('#map2')[0];
		
		if (both) {
			map2.map.noSync = true;
			map1.show();
			map2.show();
			map2.map.noSync = false;
			this.onMapMove(map1.map);
		}
		else {
			map2.hide();
			map1.show();
		}
	},
	onFeatureInfoActivated: function(btn,val) {
		// tady na to pozor layer uy nevisi na controlleru
		if (val) {
			this.map1.featureInfoControl.activate();
		}
		else {
			this.map1.featureInfoControl.deactivate();
		}
	},
		
	onMeasureActivated: function(btn,val) {
		// tady na to pozor layer uy nevisi na controlleru
		var control1 = btn.itemId == 'measurelinebtn' ? this.map1.measureLineControl : this.map1.measurePolyControl;
		var control2 = btn.itemId == 'measurelinebtn' ? this.map2.measureLineControl : this.map2.measurePolyControl;
		
		var window = Ext.WindowManager.get('measureWindow');
		if (val) {
			var title = 'Measure '+(btn.itemId == 'measurelinebtn' ? 'line' : 'polygon');
			var helpText = btn.itemId == 'measurelinebtn' ? 'Click to define line shape, double-click to complete.' : 'Click to define polygon shape, double-click to complete.';
			var initialText = (btn.itemId == 'measurelinebtn' ? 'Length' : 'Area') + ":";
			if (!window) {
				
				window = Ext.widget('window',{
					padding: 5,
					minWidth: 140,
					closable: false,
					maxWidth: 260,
					bodyPadding: 5,
					title: title,
					closeAction: 'hide',
					items: [{
						xtype: 'component',
						itemId: 'help',
						margin: '0 0 10 0',
						html: helpText
					},{
						xtype: 'component',
						itemId: 'measure',
						html: initialText
					}],
					id: 'measureWindow'
				})
			} else {
				window.setTitle(title);
				window.down('#help').update(helpText);
				window.down('#measure').update(initialText);
			}
			window.show();
			control1.activate();
			control2.activate();
		} else {
			if (window) {
				window.close();
			}
			control1.deactivate();
			control2.deactivate();
		}
	},
	// areas can be specified or taken from selection
	onZoomSelected: function(btn,areas) {
		var map = Ext.ComponentQuery.query('#map')[0].map;
		if (Config.cfg) {
			map.setCenter([Config.cfg.mapCfg.center.lon,Config.cfg.mapCfg.center.lat],Config.cfg.mapCfg.zoom);
			return;
		}
		
		var selectController = this.getController('Select');
		var color = selectController.actualColor;
		var sel = color ? selectController.selMap[color] : [];
		sel = areas.length ? areas : sel;
		if (!sel.length) return;
		var areaController = this.getController('Area');
		var format = new OpenLayers.Format.WKT();

		var overallExtent = {left: 180, right: -180, top: -90, bottom: 90};

		var extent = null;
		var finalExtent = null;
		for (var i=0;i<sel.length;i++) {
			var area = areas.length ? areas[i] : areaController.getArea(sel[i]);
			extent = format.read(area.get('extent')).geometry.getBounds();
			overallExtent = this.updateExtent(extent, overallExtent);
			//debugger;
			//var previousOverall = jQuery.extend(true, {}, overallExtent);
		}
		finalExtent = extent;
		finalExtent.right = overallExtent.right;
		finalExtent.left = overallExtent.left;
		finalExtent.top = overallExtent.top;
		finalExtent.bottom = overallExtent.bottom;
		finalExtent = finalExtent.transform(new OpenLayers.Projection("EPSG:4326"),new OpenLayers.Projection("EPSG:900913"));
		this.zoomToExtent(finalExtent);
	},

	/**
	 * Update overall extent with extent of current area.
	 * It is dealing with dateline issues currently. TODO deal with areas around poles
	 * @param currentExtent {OpenLayers.Bounds}
	 * @param overallExtent {Object}
	 * @returns {Object} updated extent
	 */
	updateExtent: function(currentExtent, overallExtent){
		currentExtent = this.checkIfAreaIsCrossingDateLine(currentExtent);
		var currentLeft = currentExtent.left;
		var currentRight = currentExtent.right;
		var overallLeft = overallExtent.left;
		var overallRight = overallExtent.right;

		// first iteration
		if (Math.abs(overallLeft - overallRight) == 360){
			overallExtent.right = currentRight;
			overallExtent.left = currentLeft;
		}

		// overal extent is not crossing dateline (except first iteration)
		if (overallLeft < overallRight && Math.abs(overallLeft - overallRight) != 360){
			// current extent is not crossing dateline
			if (currentRight > currentLeft){
				if (currentRight > overallRight){
					overallExtent.right = currentRight;
				}
				if (currentLeft < overallLeft){
					overallExtent.left = currentLeft;
				}
			}
			// current extent is crossing dateline
			else {
				if (currentRight < overallRight && Math.abs(currentRight - overallRight) > 180){
					overallExtent.right = currentRight;
				}
				if (currentLeft > overallLeft && Math.abs(currentLeft - overallLeft) > 180){
					overallExtent.left = currentLeft;
				}
			}
		}

		// overal extent is crossing dateline
		else {
			if (currentLeft < overallLeft && currentLeft > overallRight && Math.abs(currentLeft - overallLeft) < 180){
				overallExtent.left = currentLeft;
			}
			if (currentRight > overallRight && currentRight < overallLeft && Math.abs(currentRight - overallRight) < 180){
				overallExtent.right = currentRight;
			}
		}


		// TODO deal with areas around poles
		if (currentExtent.bottom < overallExtent.bottom){
			overallExtent.bottom = currentExtent.bottom;
		}
		if (currentExtent.top > overallExtent.top){
			overallExtent.top = currentExtent.top;
		}

		return overallExtent;
	},

	/**
	 * Check if area is crossing dateline. If so, switch left and right
	 * @param extent {OpenLayers.Bounds}
	 * @returns {OpenLayers.Bounds}
	 */
	checkIfAreaIsCrossingDateLine: function(extent){
		var left = extent.left;
		var right = extent.right;
		if (Math.abs(left -right) > 180 && left < -90 && right > 90){
			extent.left = right;
			extent.right = left;
		}
		return extent;
	},

	zoomToExtent: function(extent){
		var map = Ext.ComponentQuery.query('#map')[0].map;
		map.zoomToExtent(extent);
	},

	createBaseNodes: function() {
		var baseNode = Ext.StoreMgr.lookup('layers').getRootNode().findChild('type','basegroup');
		var liveNode = Ext.StoreMgr.lookup('layers').getRootNode().findChild('type','livegroup');
		var baseMap = Config.initialBaseMap || "osm";
		var hybridNode = Ext.create('Puma.model.MapLayer',{
			name: 'Google hybrid',
			checked: (baseMap == "hybrid"),
			allowDrag: false,
			initialized: true,
			leaf: true,
			sortIndex: 10000,
			type: 'hybrid'
		});
		var streetNode = Ext.create('Puma.model.MapLayer',{
			name: 'Google street',
			initialized: true,
			allowDrag: false,
			checked: (baseMap == "roadmap"),
			leaf: true,
			sortIndex: 10000,
			type: 'roadmap'
		});
		var terrainNode = Ext.create('Puma.model.MapLayer',{
			name: 'Google terrain',
			initialized: true,
			allowDrag: false,
			checked: (baseMap == "terrain"),
			leaf: true,
			sortIndex: 10000,
			type: 'terrain'
		});
		var osmNode = Ext.create('Puma.model.MapLayer',{
			name: 'OpenStreetMap',
			initialized: true,
			allowDrag: false,
			checked: (baseMap == "osm"),
			leaf: true,
			sortIndex: 10000,
			type: 'osm'
		});
		var trafficNode = Ext.create('Puma.model.MapLayer',{
			name: 'Google traffic',
			initialized: true,
			allowDrag: true,
			checked: false,
			leaf: true,
			sortIndex: 0,
			type: 'traffic'
		});
		Ext.StoreMgr.lookup('selectedlayers').loadData([hybridNode,streetNode,terrainNode,osmNode],true);
		baseNode.appendChild([hybridNode,streetNode,terrainNode,osmNode]);
		liveNode.appendChild([trafficNode]);
	},

	onMapMove: function(map) {
		if (!map.multiMap || map.noSync) {
			return;
		}
		var mapMoved = map;
		var mapAlt = map==this.map1 ? this.map2 : this.map1;
		if (!mapMoved || !mapAlt) return;
		if (mapMoved.artifZoom) {
			mapMoved.artifZoom = false;
			return;
		}
		mapAlt.artifZoom = true;
		mapAlt.setCenter(mapMoved.getCenter(),mapMoved.getZoom());
		mapAlt.artifZoom = false;
	},

	onMouseMove: function(e) {
		if (!this.multiMap) {
			this.cursor1.hide();
			this.cursor2.hide();
			return;
		}
		var cursor = this.cursor1;
		var offsetX = this.map1.div.offsetLeft;
		if (e.object==this.map1) {
			cursor = this.cursor2;
			offsetX = this.map2.div.offsetLeft;
		}
		var footerOffset = 0;
		if ($("#footer").css("display") == "block"){
			footerOffset = 13;
		}

		var x = e.x - e.element.offsetParent.offsetLeft + offsetX;
		var y = e.y - (e.screenY - e.offsetY) + footerOffset;
		cursor.setStyle({
			top: y + 'px',
			left: x + 'px'
		});
		cursor.show();
	},
	onMouseOut: function(e) {
		this.cursor1.hide();
		this.cursor2.hide();
	},

	/**
	 *
	 * @param rows
	 * @param filters OpenLayers.FIlter[] Array of areas that are used in the retrieval of the correct part of the map.
	 * @returns {*}
	 */
	getExtentForExtentOutline: function(rows, filters) {
		var overallExtent = null;
		var format = new OpenLayers.Format.WKT();
		for (var j = 0; j < rows.length; j++) {
			var row = rows[j];
			var filter = new OpenLayers.Filter.Comparison({type: '==', property: 'gid', value: row.gid});
			filters.push(filter);
			var extent = format.read(row.extent).geometry.getBounds();
			extent = extent.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
			if (!overallExtent) {
				overallExtent = extent;
			} else {
				overallExtent.extend(extent);
			}
		}
		return overallExtent;
	},

	generateSldForExtentOutlineAreaOutlines: function(filters, layerRefs, color) {
		var filter = filters.length < 2 ? filters[0] : new OpenLayers.Filter.Logical({type: '||', filters: filters});
		var style = new OpenLayers.Style();
		var layerName = Config.geoserver2Workspace + ':layer_' + layerRefs.areaRef._id;
		var rule = new OpenLayers.Rule({
			symbolizer: {
				"Polygon": new OpenLayers.Symbolizer.Polygon({fillOpacity: 0, strokeOpacity: 1, strokeColor: '#'+ color})
			},
			filter: filter
		});
		style.addRules([rule]);

		var namedLayers = [{
			name: layerName,
			userStyles: [style]
		}];
		var sldObject = {
			name: 'style',
			title: 'Style',
			namedLayers: namedLayers
		};
		var format = new OpenLayers.Format.SLD.Geoserver23();
		var sldNode = format.write(sldObject);
		var xmlFormat = new OpenLayers.Format.XML();
		return xmlFormat.write(sldNode);
	},

	getNamesOfLayersToDisplayForExtentOutline: function(layerRefs, atWithSymbology) {
		var layers = Ext.Array.map(layerRefs.layerRef ? [layerRefs.layerRef] : layerRefs.layerRefs,function(item) {
			return item.layer;
		});

		var symbologyId, styles = [];
		var splitted = atWithSymbology.split('_');
		if (splitted.length>1) {
			symbologyId = splitted.slice(1).join('_');
			symbologyId = symbologyId == '#blank#' ? null : symbologyId
		}
		if (symbologyId) {
			for (var i = 0; i < layers.length; i++) {
				styles.push(symbologyId);
			}
		}

		return {
			layers: layers.join(','),
			styles: styles.join(',')
		};
	},

	getDefaultMapForExtentOutline: function(id) {
		var map = new OpenLayers.Map({
			controls: [],
			numZoomLevels: 22,
			projection: new OpenLayers.Projection("EPSG:4326"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
			units: "m",
			maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34),
			featureEvents: true,
			div: id
		});
		map.addLayer(new OpenLayers.Layer.Google(
			'Google',
			{
				type: 'terrain',
				initialized: true,
				animationEnabled: true
			}
		));
		return map;
	},
	
	afterExtentOutlineRender: function(cmp) {
		var map = cmp.map = this.getDefaultMapForExtentOutline(cmp.id);
		var layerRefs = cmp.layerRefs;

		var filters = [];
		var overallExtent = this.getExtentForExtentOutline(cmp.rows, filters);

		var parent = cmp.up('chartcmp');
		var areaTemplateWithSymbology = parent.cfg.featureLayer || parent.cfg.outlineLayerTemplate;
		var layersToDisplay = this.getNamesOfLayersToDisplayForExtentOutline(layerRefs, areaTemplateWithSymbology);

		var layerToDisplay = new OpenLayers.Layer.WMS('WMS', Config.url + 'api/proxy/wms', {
			layers: layersToDisplay.layers,
			styles: layersToDisplay.styles,
			transparent: true
		}, {
			visibility: true,
			isBaseLayer: false,
			opacity: cmp.opacity
		});
		var areaOutlinesToDisplay = new OpenLayers.Layer.WMS('WMS', Config.url + 'api/proxy/wms', {
			transparent: true,
			"USE_SECOND": true,
			"SLD_BODY": this.generateSldForExtentOutlineAreaOutlines(filters, layerRefs, cmp.color)
		}, {
			visibility: true,
			isBaseLayer: false
		});

		map.addLayers([layerToDisplay, areaOutlinesToDisplay]);
		map.updateSize();

		window.setTimeout(function() {
			map.zoomToExtent(overallExtent);
		},1);

		if (cmp.ownerCt.items.getCount()==cmp.ownerCt.mapNum){
			var minZoom = 10000;
			cmp.ownerCt.items.each(function(mapCmp) {
				var zoom = mapCmp.map.getZoom();
				if (zoom<minZoom) {
					minZoom = zoom;
				}
			});
		}
	},

	getOptions: function(cmp) {
		var options = {
			projection: new OpenLayers.Projection("EPSG:4326"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
			units: "m",
			maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34),
			featureEvents: true,
			div: cmp.id
		};
		return options;
	},

	getOlMap: function(){
		return this.olMap;
	},
	getOlMap2: function(){
		return this.olMap2;
	},

	afterRender: function(cmp) {
		var options = this.getOptions(cmp);
		var map = new OpenLayers.Map(options);

		cmp.map = map;
		var el = Ext.get(cmp.id);
		el.on('contextmenu',function(e) {
			return;
		});
		if (cmp.itemId=='map') {
			this.createBaseNodes();
			this.map1 = map;
			this.olMap = this.map1;
			this.cursor1 = Ext.get('app-map').down('img')
		} else {
			this.map2 = map;
			this.olMap2 = this.map2;
			this.olMapMultipleSecond = this.map2;
			this.cursor2 = Ext.get('app-map2').down('img')
		}
		var hybridLayer = new OpenLayers.Layer.Google(
			'Google',
			{
				type: 'hybrid',
				initialized: true,
				animationEnabled: true,
				visibility: false,
				numZoomLevels: 19,
				MAX_ZOOM_LEVEL: 18
			}
		);
		map.defaultLayer = layer;
		var streetLayer = new OpenLayers.Layer.Google(
			'Google',
			{
				type: 'roadmap',
				animationEnabled: true,
				initialized: true,
				visibility: false,
				numZoomLevels: 19,
				MAX_ZOOM_LEVEL: 18
			}
		);
		var terrainLayer = new OpenLayers.Layer.Google(
			'Google',
			{
				type: 'terrain',
				animationEnabled: true,
				initialized: true,
				visibility: true
			}
		);

		var osmLayer = new OpenLayers.Layer.OSM('OSM',null,{
			initialized: true,
			visibility: false
		});
		var trafficLayer = new google.maps.TrafficLayer();

		var baseNode = Ext.StoreMgr.lookup('layers').getRootNode().findChild('type','basegroup');
		var trafficNode = Ext.StoreMgr.lookup('layers').getRootNode().findChild('type','livegroup');
		var gufNodes = Ext.StoreMgr.lookup('layers').getRootNode().findChild('type', 'customwms');
		var baseNodes = Ext.Array.merge(baseNode.childNodes,trafficNode.childNodes, gufNodes.childNodes);
		var nodes = [];
		for (var i=0;i<baseNodes.length;i++) {
			var node = baseNodes[i];
			var layer = null;
			var type = node.get('type');
			switch(type) {
				case 'hybrid': layer = hybridLayer; break;
				case 'roadmap': layer = streetLayer; break;
				case 'terrain': layer = terrainLayer; break;
				case 'osm': layer = osmLayer; break;
				case 'traffic': layer = trafficLayer; break;
			}
			var nodeProp = cmp.itemId=='map' ? 'layer1':'layer2';
			node.set(nodeProp,layer);
		}
		
		map.drawnLayer = new OpenLayers.Layer.Vector('',{
			style: {
				fillOpacity: 0,
				strokeWidth: 3,
				strokeColor: '#ff8800',
				strokeOpacity: 0.8,
				pointRadius: 2
			}
		});
		map.size = map.getCurrentSize();
		map.addLayers([terrainLayer,streetLayer,hybridLayer,osmLayer]);
		trafficLayer.oldMapObj = streetLayer.mapObject;
		if (cmp.id=='map') {
			Ext.StoreMgr.lookup('selectedlayers').loadData(nodes,true);
		}
		
		map.events.register('moveend',this,function(e) {
			this.onMapMove(e.object);
		});
		map.events.register('mousemove',this,function(e) {
			this.onMouseMove(e);
		});
		map.events.register('mouseout',this,function(e) {
			this.onMouseOut(e);
		});
		
		map.updateSize();

		var params = {
			transparent: true,
			format: 'image/png',
			info_format: 'application/vnd.ogc.gml'
		};
		//params.layers = 'puma:layer_260,puma:layer_266'
		

		map.selectInMapLayer = new OpenLayers.Layer.WMS('WMS', Config.url+'api/proxy/wms', params, {
			visibility: true
		});
		map.selectInMapLayer.projection = map.projection;
		
		map.getFeatureInfoLayer = new OpenLayers.Layer.WMS('WMS', Config.url+'api/proxy/wms', params, {
			visibility: true
		});
		map.getFeatureInfoLayer.projection = map.projection;

		// WMS Get Feature Info, together with the layers used currently to support visible gids. It is simple Jquery
		//   request to the server with data fed to the WmsCapabilities
		var infoControls = {
			click: new OpenLayers.Control.WMSGetFeatureInfo({
				url: Config.url+'api/proxy/wms',
				vendorParams: {
					propertyName: 'gid',
					expectJson: true
				},
				layers: [map.selectInMapLayer]
			}), 
			hover: new OpenLayers.Control.WMSGetFeatureInfo({
				url: Config.url+'api/proxy/wms',
				vendorParams: {
					propertyName: 'gid',
					buffer: 1
				},
				layers: [map.selectInMapLayer],
				hover: true
			})
		};
		map.featureInfoControl = new OpenLayers.Control.WMSGetFeatureInfo({
			url: Config.url+'api/proxy/wms',
			vendorParams: {
				propertyName: 'gid',
				buffer: 1,
				completeLayer: true
			},
			layers: [map.getFeatureInfoLayer]
		});
		map.drawPolygonControl = new OpenLayers.Control.DrawFeature(
			map.drawnLayer,
			OpenLayers.Handler.Polygon
		);
		map.drawPointControl = new OpenLayers.Control.DrawFeature(
			map.drawnLayer,
			OpenLayers.Handler.Point
		);
		map.selectControl = new OpenLayers.Control.SelectFeature(
			map.drawnLayer,
			{
				highlightOnly: true
			}
		);
		map.dragControl = new OpenLayers.Control.DragFeature(
			map.drawnLayer,{
				geometryTypes:['OpenLayers.Geometry.Point']
			}
		);
			
		
		var me = this; 
		var measureCallbacks = {
			'modify':function(point,feature) {
				me.handleMeasureModify(point,feature,this);
			}
		};
		map.measurePolyControl =  new OpenLayers.Control.Measure(
			OpenLayers.Handler.Polygon,
			{
				geodesic: true,
				persist: true,
				callbacks: measureCallbacks
			}
		);
		map.measureLineControl =  new OpenLayers.Control.Measure(
			OpenLayers.Handler.Path,
			{
				geodesic:true,
				persist: true,
				callbacks: measureCallbacks
			}
		);
		
		
		map.addControls([map.drawPolygonControl,map.drawPointControl,map.selectControl,map.dragControl,map.featureInfoControl,map.measurePolyControl,map.measureLineControl]);
		map.dragControl.activate();
		map.dragControl.onComplete = function(feature) {
			me.getController('UserPolygon').onFeatureDragged(feature);
		};

		for (var i in infoControls) {
			infoControls[i].events.register("getfeatureinfo", this, this.onFeatureSelected);
			map.addControl(infoControls[i]);
		}
		
		map.featureInfoControl.events.register('beforegetfeatureinfo',this,function() {
			return this.updateFeatureInfoControl();
		});
		map.featureInfoControl.events.register("getfeatureinfo", this, function(response) {
			return this.onFeatureInfo(response);
		});
		map.measureLineControl.events.register('measurepartial',this,function(obj) {
			return this.onMeasurePartial(obj);
		});
		map.measurePolyControl.events.register('measurepartial',this,function(obj) {
			return this.onMeasurePartial(obj);
		});
		
		map.infoControls = infoControls;
		if (cmp.itemId == 'map') {
			map.controls[0].deactivate();
		}

		if(Config.initialMapBounds) {
			var proj = new OpenLayers.Projection("EPSG:4326");
			var bounds = new OpenLayers.Bounds(Config.initialMapBounds);
			bounds.transform(proj, map.getProjectionObject());
			map.zoomToExtent(bounds);
		}
		// URBIS change
		OlMap.map = map;
	},

	onMeasurePartial: function(evt) {
		var html = (evt.order == 1 ? 'Length' : 'Area' )+': ';
		if (evt.measure == 0){
			return;
		}
		
		var fixedNum = evt.measure<10000 ? 1 : 0;
		fixedNum = evt.measure<100 ? 2 : fixedNum;
		html += evt.measure.toFixed(fixedNum);
		html += ' ';
		html += evt.units;
		html += evt.order == 2 ? '<sup>2</sup>' : '';
		var cmp = Ext.WindowManager.get('measureWindow').down('#measure');
		cmp.el.update(html);
	},

	onFeatureInfo: function(response) {
		var data = JSON.parse(response.text).data;
		if (!data || !data.length) {
			return;
		}
		var window = Ext.WindowManager.get('featureinfowindow');
		if (!window) {
			window = Ext.widget('window',{
				layout: 'fit',
				width: 400,
				maxHeight: 600,
				id: 'featureinfowindow',
				items: [{
					xtype: 'treepanel',
					rootVisible: false,
					columns: [{
						xtype: 'treecolumn',
						flex: 1,
						dataIndex: 'name',
						renderer: function(val,metaData,record) {
							if (record.get('attrSet')==-1) {
								metaData.style = 'font-weight:bold'
							}
							return val;
						},
						header: 'Name'
					},{
						dataIndex: 'value',
						flex: 1,
						header: 'Value'
					}],
					store: Ext.create('Ext.data.TreeStore',{
						fields: ['name','value','attrSet']
					})
				}]
			});
		}
		var store = window.items.get(0).store;
		store.getRootNode().removeAll(false,true);
		store.getRootNode().appendChild(data);
		window.show();
	},

	updateFeatureInfoControl: function() {
		var store = Ext.StoreMgr.lookup('layers');
		var root = store.getRootNode();
		var layerRefMap = this.getController('Area').areaTemplateMap;
		var layers = [];
		return;
	},

	updateGetFeatureControl: function() {
		
		var layers1 = [];
		var layers2 = [];
		var controller = this.getController('Area');
		var areaTemplates = controller.areaTemplates;
		var areaTemplateMap = controller.areaTemplateMap;
		
		var years = Ext.ComponentQuery.query('#selyear')[0].getValue();
		if (!years.length) {
			return;
		}
		
		var locations = this.getController('Area').getTreeLocations();
		var lrMap = {};
		for (var i=0;i<areaTemplates.length;i++) {
			var at = areaTemplates[i];
			if (at==-1) {
				var location = Ext.ComponentQuery.query('initialbar #locationcontainer button[pressed=true]')[0].objId;
				var year = Ext.ComponentQuery.query('initialbar #yearcontainer button[pressed=true]')[0].objId;
				var layer = Config.geoserver2Workspace + ':#userpolygon#layer_user_#userid#_loc_'+location+'_y_'+year;
			}
			var atMap = areaTemplateMap[at] || {};
			for (var j=0;j<locations.length;j++) {
				var loc = locations[j];
				var locMap = areaTemplateMap[loc] || {};
				var atMap = locMap[at] || {};
				var lr1 = atMap[years[0]];
				var lr2 = years.length>1 ? atMap[years[1]] : null;
				if (lr1) {
					lrMap[lr1._id] = {at:at,loc:loc};
					var layer = Config.geoserver2Workspace + ':layer_'+lr1._id;
					layers1.push(layer);
				}
				if (lr2) {
					lrMap[lr2._id] = {at:at,loc:loc};
					var layer = Config.geoserver2Workspace + ':layer_'+lr2._id;
					layers2.push(layer);
				}
			}
		}
		this.lrMap = lrMap;
		this.map1.selectInMapLayer.params['LAYERS'] = layers1.join(',');
		this.map2.selectInMapLayer.params['LAYERS'] = layers2.join(',');
	},
		
	onFeatureSelected: function(evt) {
		try {
            var allFeatures = JSON.parse(evt.text).features;
        } catch(e) {
			return; // At least don't break the UI.
		}

		console.log("AllFEATURES ",allFeatures);
		if (allFeatures && allFeatures.length) {
			var controller = this.getController('Area');
			var areaTemplates = controller.areaTemplates;
			var areaTemplateMap = controller.areaTemplateMap;
			var lrs = [];
			allFeatures.reverse();
			var features = [];
			for (var i=0;i<allFeatures.length;i++) {
				var layerName = allFeatures[i].id.split('.')[0];
				features[layerName] = allFeatures[i];
			}
			console.log("FEATURES ",features);

			var root = Ext.StoreMgr.lookup('area').getRootNode();
			var gid = null;
			var at = null;
			var loc = null;
			//for(var i=0;i<features.length;i++) {
			for(var layerName in features){
				var feature = features[layerName];
				gid = feature.properties.gid;
				//var layerName = feature.id.split('.')[0];
				var lr = null;
				if (layerName.indexOf('user')>=0) {
					at = -1; 
					break;
				} else {
					lr = parseInt(layerName.split('_')[1]);
				}
				var featureAt = this.lrMap[lr].at;
				var featureLoc = this.lrMap[lr].loc;
				var found = false;
				root.cascadeBy(function(node) {
					if (!node.isVisible()) return;
					if (node.get('at')==featureAt && node.get('gid')==gid && node.get('loc')==featureLoc) {
						found = true;
						at = node.get('at');
						loc = node.get('loc');
						return false;
					}
				});
				if (found) {
					break;
				}
			}
			 
			var selected = [];
			if (at && loc && gid) {
				selected.push({at:at,gid:gid,loc:loc});
			}
			var add = evt.object.handler.evt.ctrlKey;
			var hover = evt.object.hover;
			this.getController('Select').select(selected,add,hover);
		} else {
			var add = evt.object.handler.evt.ctrlKey;
			var hover = evt.object.hover;
			this.getController('Select').select([],add,hover);
		}
	},

	onResize: function(cmp) {
		if (cmp.map) {
			cmp.setWidth(cmp.container.getWidth());
			cmp.setHeight(cmp.container.getHeight());
			cmp.map.updateSize();
			if (!cmp.initialZoom) {
				if(Config.initialMapBounds) {
					var proj = new OpenLayers.Projection("EPSG:4326");
					var bounds = new OpenLayers.Bounds(Config.initialMapBounds);
					bounds.transform(proj, cmp.map.getProjectionObject());
					cmp.map.zoomToExtent(bounds);
				} else {
					// Retain previous default value.
					cmp.map.zoomToExtent(new OpenLayers.Bounds(12505423.107734384,-888123.2263567317,12576501.051026525,-784677.6168449755));
				}
				cmp.initialZoom = true;
			}
		}
		OneLevelAreas.map = cmp.map;
	},

	handleMeasureModify: function(point,feature,control) {
		var geometry = feature.geometry;
		if (geometry.components[0].components) {
			geometry.components[0].addComponent(point);
		} else {
			geometry.addPoint(point);
		}
		OpenLayers.Control.Measure.prototype.measure.apply(control,[geometry,'measurepartial']);
	}

});