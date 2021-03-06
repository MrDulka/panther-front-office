Ext.define('PumaMain.controller.Layers', {
	extend: 'Ext.app.Controller',
	views: [],
	requires: ['PumaMain.view.LayerMenu', 'Puma.util.Color'],
	init: function() {
		Observer.addListener("thematicMapsSettings",this.onConfigure.bind(this));
		Stores.listeners.push(this.checkLayerIn2d.bind(this, "checklayer"));

		this.control({
			'#layerpanel': {
				checkchange: this.onCheckChange,
				itemclick: this.onLayerClick
			},
			'#layerpanel tool[type=gear]': {
				click: this.onConfigure
			},
			'#window-layerpanel tool[type=gear]': {
				click: this.onConfigure
			},
			'layerpanel' : {
				choroplethreconfigure: this.onChoroplethReconfigureBtnClick,
				choroplethremove: this.onChoroplethRemove,
				checkchange: this.onCheckChange,
				layerup: this.onLayerUp,
				layerdown: this.onLayerDown,
				layerremove: this.onLayerRemove,
				layeropacity: this.openOpacityWindow,
				layerlegend: this.onLayerLegend,
				showmetadata: this.onShowMetadata
			},
			'slider[itemId=opacity]': {
				change: this.onOpacityChange
			},
			'#layerselectedpanel gridview': {
				drop: this.onLayerDrop,
				beforedrop: this.onBeforeLayerDrop
			},
			'choroplethpanel #numCategories': {
				change: this.onNumCategoriesChange
			},
			'choroplethpanel #classType': {
				change: this.onClassTypeChange
			},
			'choroplethpanel #useAttributeColors': {
				change: this.onUseAttrColorsChange
			},
			'choroplethpanel #fillbtn': {
				click: this.onFillColors
			},
			'choroplethpanel #addbtn': {
				click: this.onChoroplethAdd
			},

			'choroplethpanel #reconfigurebtn': {
				click: this.onChoroplethReconfigure
			}

		});
		this.scaleBorderCnst = 10000000;
		this.scaleBorder = 10000000;
		Select.colourMap = this.colourMap.bind(this);
	},

	onConfigure: function() {
		this.getController('AttributeConfig').onConfigureClick({itemId:'configurelayers'});
	},

	onLayerLegend: function(panel, rec, checked) {
		if (checked && !rec.get('legend')) {
			var img = Ext.widget('image',{
				src: rec.get('src'),
				margin: '5 0 0 0'
			});
			var window = Ext.widget('window', {
				autoScroll: true,
				collapsible: true,
				collapseLeft: true,
				minWidth: 260,
				leftMargin: 1,
				titleCollapse: true,
				islegend: 1,
				items: [img],
				factor: Ext.ComponentQuery.query('window[islegend=1]').length,
				title: rec.get('name')
			});
			img.on('resize',function(i) {
				i.el.on('load',function(a, dom) {
					this.show();
					this.setSize(dom.clientWidth+32,dom.clientHeight+52);

					if (Config.toggles.useTopToolbar) {
						this.showBy('app-map','br-br',[-43,-18]);
					} else {
						var leftPanel = Ext.ComponentQuery.query('toolspanel')[0]; // TODO - what if no ToolsPanel?

						var heightDiff = Ext.get('app-map').getBox().bottom - Ext.get('sidebar-tools').getBox().bottom;

						this.showBy(leftPanel,'bl-br',[50*this.factor+21,-50*this.factor+heightDiff]);
					}
					this.el.setOpacity(0.85)
				},this);
			},window,{single:true});
			window.showAt(1,1);
			window.hide();
			window.rec = rec;
			window.on('close', function(win) {
				win.rec.set('legend',null);
			});
			rec.set('legend',window);
		}
		if (!checked && rec.get('legend')) {
			rec.get('legend').destroy();
			rec.set('legend',null);
		}
	},

	reconfigureChoropleths: function(cfg) {
		Stores.choropleths = cfg.attrs;
		Stores.notify('choropleths');

		this.getController('AttributeConfig').layerConfig = cfg.attrs;
		var root = Ext.StoreMgr.lookup('layers').getRootNode();
		var chartNodes = [];
		root.cascadeBy(function(node) {
			if (node.get('type')=='chartlayer') {
				chartNodes.push(node);
			}
		});
		var nodesToRemove = [];
		var attrs = Ext.Array.clone(cfg.attrs);
		var oldAttrs = Ext.Array.clone(cfg.attrs);
		for (var i=0;i<chartNodes.length;i++) {
			var node = chartNodes[i];
			var attr = node.get('attribute');
			var as = node.get('attributeSet');
			var cfgAttr = node.get('cfg').attrs[0];
			var normType = cfgAttr.normType;
			var normAs = cfgAttr.normAs;
			var normAttr = cfgAttr.normAttr;
			var attrObj = null;
			var found = false;
			for (var j=0;j<attrs.length;j++) {
				attrObj = attrs[j];
				if (attrObj.as==as && attrObj.attr == attr && attrObj.normType==normType && attrObj.normAs == normAs && attrObj.normAttr == normAttr) {
					found = true;
					break;
				}
			}
			if (!found) {
				nodesToRemove.push(node);
			} else {
				Ext.Array.remove(attrs,attrObj);
				node.initialized = false;
				var oneCfg = {attrs:[attrObj]};
				oneCfg.numCategories = attrObj.numCategories || 5;
				oneCfg.classType = attrObj.classType || 'quantiles';
				oneCfg.zeroesAsNull = attrObj.zeroesAsNull!==false;
				oneCfg.useAttributeColors = true;
				var params = this.getController('Chart').getParams(oneCfg);
				node.set('params',params);
				node.set('cfg',oneCfg);
				if (attrObj.name) {
					node.set('name',attrObj.name);
				}
				this.initChartLayer(node);
			}

		}
		for (var i=0;i<nodesToRemove.length;i++) {
			var node = nodesToRemove[i];
			this.onChoroplethRemove(null,node);
		}

		for (var i=0;i<attrs.length;i++) {
			var attr = attrs[i];
			var idx = Ext.Array.indexOf(oldAttrs,attr);
			var oneCfg = Ext.clone(cfg);
			oneCfg.attrs = [attr];
			oneCfg.numCategories = attr.numCategories || 5;
			oneCfg.classType = attr.classType || 'quantiles';
			oneCfg.zeroesAsNull = attr.zeroesAsNull || true;
			oneCfg.useAttributeColors = true;
			this.addChoropleth(oneCfg,true,idx);
		}
	},

	onFillColors: function(btn) {
		var store = btn.up('grid').store;
		var count = store.getCount();
		if (count < 3){
			return;
		}
		try {
			var first = store.getAt(0).get('color');
			var last = store.getAt(count - 1).get('color');
		} catch (e) {
			return;
		}
		for (var i = 1; i < count - 1; i++) {
			var ratio = i / (count - 1);
			var rec = store.getAt(i);
			var color = Puma.util.Color.determineColorFromRange(first, last, ratio);
			rec.set('color', color);
		}
	},

	onClassTypeChange: function(combo, val) {
		var grid = Ext.ComponentQuery.query('choroplethpanel #classgrid')[0];
		grid.columns[2].setVisible(val == 'range');
	},

	onUseAttrColorsChange: function(chb, val) {
		var grid = Ext.ComponentQuery.query('choroplethpanel #classgrid')[0];
		grid.columns[1].setVisible(val ? false : true);
	},

	onNumCategoriesChange: function(combo, val) {
		var store = Ext.ComponentQuery.query('choroplethpanel #classgrid')[0].store;
		var count = store.getCount();
		if (val > count) {
			var data = [];
			for (var i = count; i < val; i++) {
				data.push({idx: i + 1});
			}
			store.loadData(data, true);
		}
		if (val < count) {
			store.removeAt(val, count - val);
		}

	},

	onShowMetadata: function(panel, rec) {
		var layer1 = rec.get('layer1');
		var layer2 = rec.get('layer2');

		// don't try to get layers for layers without layers. (for Raster Layers / Vector Layers with no linked Data Layers)
		if (! layer1.params.hasOwnProperty("LAYERS")) {
			Puma.util.Msg.msg("This layer has no linked data.", '', '1');
			return;
		}

		var layers = layer1.params.LAYERS.split(',');
		if (layer2 && layer2.params.LAYERS) {
			layers = Ext.Array.merge(layers, layer2.params.LAYERS.split(','))
		}
		Puma.util.Msg.msg('Search for metadata has started. Please wait.','','l');
		Ext.Ajax.request({
			url: Config.url + 'api/layers/getMetadata',
			rec: rec,
			params: {
				layers: JSON.stringify(layers)
			},
			scope: this,
			success: function(response) {
				var name = response.request.options.rec.get('name');
				response = JSON.parse(response.responseText).data;
				var html = [];
				var locStore = Ext.StoreMgr.lookup('location4init');
				var searchTitle = null;
				if (locStore.collect('location').length<2 && locStore.getCount()>2) {
					var locObj = this.getController('Area').getLocationObj();
					if (locObj.obj) {
						searchTitle = locObj.obj.get('name');
					}
				}

				for (var i=0;i<response.length;i++) {
					var r = response[i];

					var oneDiv= '<div class="metadata">';

					oneDiv+= '<p class="title">Title</p>';
					oneDiv+= '<p>' + r.title + '</p>';

					if(!Config.toggles.isUrbis) {
						oneDiv+= '<p class="title">Abstract</p>';
						oneDiv+= '<p>' + r.abstract + '</p>';

						oneDiv += '<p class="title">Temporal extent</p>';
						oneDiv += '<p>' + r.temporal + '</p>';

						oneDiv += '<p class="title">Keywords</p>';
						oneDiv += '<p>' + r.keywords + '</p>';

						oneDiv += '<p class="title">Producer</p>';
						oneDiv += '<p>';
						if (r.organization != r.contact && r.organization != "") {
							oneDiv += r.organization + '<br>';
						}
						if (r.contact != null && r.contact != "" && r.contact != " ") {
							oneDiv += r.contact + '<br>';
						}
						if (r.mail != "") {
							oneDiv += '<a target="_top" href="mailto:' + r.email + '">' + r.email + '</a>';
						}
						oneDiv += '</p>';

						if (r.constraints_other != null && r.constraints_other != "") {
							oneDiv += '<p>' + r.constraints_other + '</p>';
						}

						oneDiv += '<p>For more details see <a target="_blank" href="' + r.address + '">Complete Metadata</a></p>';
					} else {
						oneDiv += '<p class="title">Contact</p>';
						oneDiv+= '<p><a target="_top" href="mailto:katerina.jupova@gisat.cz">Kateřina Jupová</a></p>';

						oneDiv+= '<p>' + r.abstract + '</p>';
					}

					oneDiv+= '</div>';


					if(searchTitle && r.title.toLowerCase().search(searchTitle.toLowerCase()) != -1){
						var html = [oneDiv];
						break;
					}
					html.push(oneDiv);
				}
				Ext.widget('window',{
					height: 600,
					cls: 'metadata-window',
					title: name,
					width: 500,
					autoScroll: true,
					html: html.join("")
				}).show();
			}

		});
	},


	onBeforeLayerDrop: function(row,obj,dropPos) {
		var type = obj.records[0].get('type');
		if (!Ext.Array.contains(['topiclayer','chartlayer','areaoutlines','selectedareas','selectedareasfilled'],type)) {
			return false;
		} else if (!Ext.Array.contains(['topiclayer','chartlayer','areaoutlines','selectedareas','selectedareasfilled'],dropPos.get('type'))) {
			return false;
		}
	},

	onLayerRemove: function(panel,rec) {
		rec.set('checked',false);
		this.onCheckChange(rec,false);
	},

	onLayerDown: function(panel,rec) {
		this.resetIndexes();
		var store = Ext.StoreMgr.lookup('selectedlayers');
		var idx = store.indexOf(rec);
		var nextRec = store.getAt(idx+1);
		if (!nextRec || nextRec.get('sortIndex')>=1000) {
			return;
		}
		rec.set('sortIndex',rec.get('sortIndex')+1);
		nextRec.set('sortIndex',nextRec.get('sortIndex')-1);
		store.sort();
		this.onLayerDrop();
	},

	onLayerUp: function(panel,rec) {
		this.resetIndexes();
		var store = Ext.StoreMgr.lookup('selectedlayers');
		var idx = store.indexOf(rec);
		var prevRec = store.getAt(idx-1);
		if (!prevRec) {
			return;
		}
		rec.set('sortIndex',rec.get('sortIndex')-1);
		prevRec.set('sortIndex',prevRec.get('sortIndex')+1);
		store.sort();
		this.onLayerDrop();
	},

	/**
	 * refactor indexes of selected layers in the store to consecutive integers, maintain order
	 */
	resetIndexes: function() {
		var store = Ext.StoreMgr.lookup('selectedlayers');
		store.suspendEvents();
		var layers = store.getRange();
		for (var i=0;i<layers.length;i++) {
			var layer = layers[i];
			var type = layer.get('type');
			if (type!='topiclayer' && type!='chartlayer' && type!='selectedareas' && type!='selectedareasfilled' && type!='areaoutlines') {
				continue;
			}
			layer.set('sortIndex',i);
		}

		store.resumeEvents();
		store.sort();
	},

	onLayerDrop: function() {
		var store = Ext.StoreMgr.lookup('selectedlayers');
		var layers = store.getRange();

		var map1 = Ext.ComponentQuery.query('#map')[0].map;
		var map2 = Ext.ComponentQuery.query('#map2')[0].map;
		layers.reverse();
		var layers1 = [];
		var layers2 = [];
		for (var i = 0; i < layers.length; i++) {
			if (layers[i].get('layer1')) {
				layers1.push(layers[i].get('layer1'));
			}
			if (layers[i].get('layer2')) {
				layers2.push(layers[i].get('layer2'));
			}
		}
		for (var i = 0; i < layers.length; i++) {
			if (map1 && layers1[i]) {
				if (i==0) {
					map1.setBaseLayer(layers1[i]);
				}
				map1.setLayerIndex(layers1[i],i);
			}
			if (map2 && layers2[i]) {
				if (i==0) {
					map2.setBaseLayer(layers2[i]);
				}
				map2.setLayerIndex(layers2[i],i);
			}
		}

		// write sortIndexes of selected layers to the Store
		layers.reverse();
		for (var i = 0; i < layers.length; i++) {
			if (layers[i].parentNode.get('type') != 'basegroup') {
				layers[i].set('sortIndex', i);
				layers[i].commit();
			}
		}
		this.resetIndexes();
		this.prepareActiveLayers(layers);
	},

	/**
	 * It prepares info about active layers for exchange between Ext and Require
	 * @param layers {Array}
	 */
	prepareActiveLayers: function(layers){
		var activeLayers = [];
		layers.forEach(function(layer){
			var data = layer.data;
			var activeLayer = {};
			var id = data.type;

			if (data.type == "chartlayer"){
				id += "-" + data.attributeSet + "-" + data.attribute;
			} else if (data.type == "topiclayer"){
				if (data.symbologyId == "#blank#"){
					id += "-" + data.at;
				} else {
					id += "-" + data.at + "-" + data.symbologyId;
				}
			} else if (data.type == "wmsLayer"){
				id += "-" + data.id;
			}

			activeLayer.id = id;
			activeLayer.group = data.type;
			activeLayer.order = data.sortIndex;
			activeLayer.active = data.checked;
			activeLayers.push(activeLayer);
		});
		Stores.activeLayers = activeLayers;
	},

	onOpacityChange: function(slider, value) {
		slider.layer1.setOpacity(value / 100);
		if (slider.layer2) {
			slider.layer2.setOpacity(value / 100);
		}
	},

	openOpacityWindow: function(panel,rec) {
		var layer1 = rec.get('layer1');
		var layer2 = rec.get('layer2');
		var window = Ext.widget('window', {
			layout: 'fit',
			title: rec.get('name'),
			items: [{
				xtype: 'slider',
				itemId: 'opacity',
				layer1: layer1,
				layer2: layer2,
				width: 200,
				value: layer1.opacity * 100

			}]
		});
		window.show();
	},

	colourMap: function(selectMap, map1NoChange, map2NoChange) {
		var store = Ext.StoreMgr.lookup('layers');
		var node = store.getRootNode().findChild('type', 'selectedareas', true);
		var filledNode = store.getRootNode().findChild('type', 'selectedareasfilled', true);

		if (!node){
			return;
		}
		var layer1 = node.get('layer1');
		var layer2 = node.get('layer2');
		var filledLayer1 = filledNode.get('layer1');
		var filledLayer2 = filledNode.get('layer2');


		var years = Ext.ComponentQuery.query('#selyear')[0].getValue();
		var areaTemplates = this.getController('Area').areaTemplateMap;
		var namedLayers1 = [];
		var namedLayers2 = [];
		var namedLayersFilled1 = [];
		var namedLayersFilled2 = [];
		selectMap = selectMap || {};
		var noSelect = true;
		for (var loc in selectMap) {

			for (var at in selectMap[loc]) {
				noSelect = false;
				for (var i = 0; i < Math.max(2, years.length); i++) {
					if (i == 0 && map1NoChange){
						continue;
					}
					if (i == 1 && map2NoChange){
						continue;
					}
					var lr = (areaTemplates[loc] && areaTemplates[loc][at]) ? areaTemplates[loc][at][years[i]] : null;
					if (!lr && at != -1){
						continue;
					}
					var style = new OpenLayers.Style();
					var filledStyle = new OpenLayers.Style();
					//var layerId = at == -1 ? '#userlocation#_y_' + year : lr._id;
					var layerId = lr._id;
					var layerName = Config.geoserver2Workspace + ':layer_' + layerId;

					var defRule = new OpenLayers.Rule({
						symbolizer: {"Polygon": new OpenLayers.Symbolizer.Polygon({fillOpacity: 0, strokeOpacity: 0}
						)}
					});
					style.addRules([defRule]);
					filledStyle.addRules([defRule]);
					var recode = ['${gid}'];
					var filters = [];
					for (var gid in selectMap[loc][at]) {
						var filter = new OpenLayers.Filter.Comparison({type: '==', property: 'gid', value: gid});
						filters.push(filter);
						var color = '#' + selectMap[loc][at][gid];
						recode.push(gid);
						recode.push(color);
					}
					var recodeFc = new OpenLayers.Filter.Function({name: 'Recode', params: recode});
					var filterFc = new OpenLayers.Filter.Logical({type: '||', filters: filters});


					/**
					 * This is where switching polygons to points in small scale for choropleths and area outlines is defined.
					 * For other ~3 appearances search "maxScaleDenominator".
					 */
					var obj = {
						filter: filterFc,
						maxScaleDenominator: this.scaleBorder,
						symbolizer: {"Polygon": new OpenLayers.Symbolizer.Polygon({strokeColor: recodeFc, strokeWidth: 1, fillOpacity: 0})
							,"Text":new OpenLayers.Symbolizer.Text({label:'${name}',fontFamily:'DejaVu Sans Condensed',fontSize:12,fontWeight:'bold',labelAnchorPointX:0.5,labelAnchorPointY:0.5})
						}
					};
					var objFilled = {
						filter: filterFc,
						maxScaleDenominator: this.scaleBorder,
						symbolizer: {"Polygon": new OpenLayers.Symbolizer.Polygon({fillColor: recodeFc, strokeWidth: 1, fillOpacity: 1})
							,"Text":new OpenLayers.Symbolizer.Text({label:'${name}',fontFamily:'DejaVu Sans Condensed',fontSize:12,fontWeight:'bold',labelAnchorPointX:0.5,labelAnchorPointY:0.5})
						}
					};
					var rule2 = new OpenLayers.Rule({
						filter: filterFc,
						minScaleDenominator: this.scaleBorder,
						symbolizer: {"Point": new OpenLayers.Symbolizer.Point({geometry: {property:'centroid'},strokeColor: recodeFc, strokeWidth: 3, graphicName: 'circle', pointRadius: 8, fillOpacity: 0})}
					});
					var rule2Filled = new OpenLayers.Rule({
						filter: filterFc,
						minScaleDenominator: this.scaleBorder,
						symbolizer: {"Point": new OpenLayers.Symbolizer.Point({geometry: {property:'centroid'},strokeWidth: 1, strokeOpacity: 1, strokeColor: '#000000', graphicName: 'circle', pointRadius: 8, fillColor: recodeFc, fillOpacity: 1})}
					});
					var rule = new OpenLayers.Rule(obj);
					style.addRules([rule,rule2]);
					var ruleFilled = new OpenLayers.Rule(objFilled);
					filledStyle.addRules([ruleFilled,rule2Filled]);
					var namedLayers = i == 0 ? namedLayers1 : namedLayers2;
					var namedLayersFilled = i == 0 ? namedLayersFilled1 : namedLayersFilled2;
					namedLayers.push({
						name: layerName,
						userStyles: [style]
					});
					namedLayersFilled.push({
						name: layerName,
						userStyles: [filledStyle]
					});
				}
			}
		}

		if (noSelect) {
			layer1.setVisibility(false);
			layer1.initialized = false;
			layer2.setVisibility(false);
			layer2.initialized = false;
			filledLayer1.setVisibility(false);
			filledLayer1.initialized = false;
			filledLayer2.setVisibility(false);
			filledLayer2.initialized = false;
			return;
		}
		var namedLayersGroup = [namedLayers1, namedLayers2,namedLayersFilled1,namedLayersFilled2];
		for (var i = 0; i < namedLayersGroup.length; i++) {
			var namedLayer = namedLayersGroup[i];
			var isFilled = i>1;
			var layer = !isFilled ? (i%2 == 0 ? layer1 : layer2) : (i%2 == 0 ? filledLayer1 : filledLayer2);
			var noChange = i%2 == 0 == 0 ? map1NoChange : map2NoChange;
			if (!namedLayer.length) {
				if (noChange) {
					layer.setVisibility(false);
					layer.initialized = false;
				}

				continue;
			}
			var changedNode = isFilled ? filledNode : node;
			this.saveSld(changedNode, namedLayer, layer);
		}
	},

	saveSld: function(node, namedLayers, layer, params, legendNamedLayers) {
		var sldObject = {
			name: 'style',
			title: 'Style',
			namedLayers: namedLayers
		};

		var format = new OpenLayers.Format.SLD.Geoserver23();
		var xmlFormat = new OpenLayers.Format.XML();
		var sldNode = format.write(sldObject);
		var sldText = xmlFormat.write(sldNode);
		var legendSld =  null;
		if (legendNamedLayers) {
			var legendSldObject = {
				name: 'style',
				title: 'Style',
				namedLayers: legendNamedLayers
			};
			var legendSldNode = format.write(legendSldObject);
			legendSld = xmlFormat.write(legendSldNode);
		}
		var me = this;
		Ext.Ajax.request({
			url: Config.url + 'api/proxy/saveSld',
			params: Ext.apply({
				sldBody: sldText,
				legendSld: legendSld || ''
			}, params || {}),
			layer: layer,
			node: node,
			legendLayer: legendNamedLayers && legendNamedLayers.length ? legendNamedLayers[0].name : null,
			success: function(response) {
				var layer = response.request.options.layer;
				var node = response.request.options.node;
				var legendLayer = response.request.options.legendLayer;
				response = JSON.parse(response.responseText);
				var id = response.data;

				var attribute = node.data.attribute;
				var attributeSet = node.data.attributeSet;

				if (node.data.type == "chartlayer" && attribute > 0 && attributeSet > 0){
					var data = {
						legendLayer: legendLayer,
						sldId: id
					};
					Stores.updateChoropleths(attribute, attributeSet, data);
				} else if (node.data.type == "areaoutlines"){
					Stores.updateOutlines({
						sldId: id,
						layerNames: "outlines"
					});
				} else if(node.data.type == "selectedareasfilled") {
					Stores.updateSelectedOutlines({
						sldId: id,
						layerNames: "selectedAreasFilled"
					})
				}
				// TODO: Add information about the selected layers sldId to show the information. .

				layer.mergeNewParams({
					"SLD_ID": id
				});
				layer.initialized = true;
				node.initialized = true;
				if (legendLayer) {
					node.set('src',me.getLegendUrl(id,legendLayer));
					var panel = Ext.ComponentQuery.query('layerpanel')[0];
					var legend = node.get('legend');
					if (!legend && node.get('checked') && node.needLegend) {
						node.needLegend = null;
						panel.fireEvent('layerlegend', panel, node, true);

					}
					if (legend) {
						legend.down('image').el.set({src: node.get('src')});
					}

				}
				if (node.get('checked')) {
					me.onCheckChange(node,true);
				}

			},
			failure: function(response) {
				var layer = response.request.options.layer;
				layer.initialized = false;
				layer.setVisibility(false);
			}
		})
	},

	refreshOutlines: function() {
		var store = Ext.StoreMgr.lookup('layers');
		var node = store.getRootNode().findChild('type', 'areaoutlines', true);
		if (!node){
			return;
		}
		var layer1 = node.get('layer1');
		var layer2 = node.get('layer2');

		var years = Ext.ComponentQuery.query('#selyear')[0].getValue();
		for (var i = 0; i < Math.max(2, years.length); i++) {
			var year = years[i];
			var filterMap = this.getTreeFilters(year);
			var namedLayers = [];

			for (var layerName in filterMap) {
				var style = new OpenLayers.Style();
				var obj = {
					filter: filterMap[layerName],
					maxScaleDenominator: this.scaleBorder,
					symbolizer: {"Polygon": new OpenLayers.Symbolizer.Polygon({strokeColor: '#333333', strokeWidth: 1, fillOpacity: 0.1})}
				};
				var rule1 = new OpenLayers.Rule(obj);
				var rule2 = new OpenLayers.Rule({
					filter: filterMap[layerName],
					minScaleDenominator: this.scaleBorder,
					symbolizer: {"Point": new OpenLayers.Symbolizer.Point({geometry: {property:'centroid'}, strokeWidth: 2, strokeOpacity: 1, graphicName: 'circle', pointRadius: 6, strokeColor: '#000000', fillColor: '#000000'})}
				});
				style.addRules([rule1,rule2]);
				namedLayers.push({
					name: layerName,
					userStyles: [style]
				});
			}
			if (!namedLayers.length) {
				continue;
			}
			var layer = i == 0 ? layer1 : layer2;
			if(!OneLevelAreas.hasOneLevel) {
				this.saveSld(node, namedLayers, layer);
			}
		}

	},

	getTreeFilters: function(year) {
		var allAreas = this.getController('Area').lowestMap;
		var areaTemplates = this.getController('Area').areaTemplateMap;

		var filterMap = {};
		for (var loc in allAreas) {
			for (var at in allAreas[loc]) {
				var lr = (areaTemplates[loc] && areaTemplates[loc][at]) ? areaTemplates[loc][at][year] : null;
				if (!lr || !allAreas[loc][at].length ){
					continue;
				}
				var layerName = Config.geoserver2Workspace + ':layer_' + lr._id;
				var filters = [];
				for (var i = 0; i < allAreas[loc][at].length; i++) {
					var gid = allAreas[loc][at][i];
					var filter = new OpenLayers.Filter.Comparison({type: '==', property: 'gid', value: gid});
					filters.push(filter);
				}
				if (filters.length == 0){
					continue;
				}
				var filterFc = filters.length > 1 ? new OpenLayers.Filter.Logical({type: '||', filters: filters}) : filters[0];
				filterMap[layerName] = filterFc;
			}
		}
		return filterMap;
	},

	getSymObj: function(params) {

		var symbolizer = null;
		if (true) {
			symbolizer = {};
			var normalization = params['normalization'];
			var classConfig = params['classConfig'] ? JSON.parse(params['classConfig']) : [];
			var colors = [];
			var thresholds = [];
			for (var i = 0; i < classConfig.length; i++) {
				colors.push(classConfig[i].color);
				thresholds.push(classConfig[i].threshold);
			}
			var colorRange = null;

			var attrs = JSON.parse(params['attrs']);
			if (params['useAttributeColors']) {
				var attrStore = Ext.StoreMgr.lookup('attribute');
				var attrId = attrs[0].attr;
				var baseColor = attrStore.getById(attrId).get('color');
				if (baseColor.length == 0){
					baseColor = "#000000";
				}
				colorRange = Puma.util.Color.determineColorRange(baseColor);
			}
			normalization = attrs[0].normType || normalization;
			var normAttrSet = attrs[0].normAs || params['normalizationAttributeSet'];
			var normAttribute = attrs[0].normAttr || params['normalizationAttribute'];
			var normalizationUnits = attrs[0].normalizationUnits;
			var customFactor = attrs[0].customFactor;

			var factor = 1;
			var attrUnits = Ext.StoreMgr.lookup('attribute').getById(attrs[0].attr).get('units');
			var normAttrUnits = null;
			if (normalization == 'attribute' || normalization == 'attributeset') {
				normAttrUnits = Ext.StoreMgr.lookup('attribute').getById(normAttribute).get('units');
			}

			var units = new Units();
			customFactor = customFactor || 1;
			if (normalization=='area') {
				normAttrUnits = attrs[0].areaUnits || 'm2';
			}

			// Specific use case is when I normalize over attribute. In this case, it is necessary to first handle the
			// Basic factor handling and then use normalizationUnits to get final.
			// TODO: Make sure that the units are correctly counted.

			if(normalization) {
				factor = units.translate(attrUnits, normAttrUnits, false);
			} else {
				factor = 1;
			}
			factor = factor * customFactor;

			var props = '';
			var filtersNull = [];
			var filtersNotNull = [];
			if (normalization && normalization != 'none' && normalization != 'year') { // normalization != area only in case of stuff.
				var normAttr = normalization == 'area' ? 'area' : '';
				normAttr = normalization == 'attributeset' ? ('as_' + normAttrSet + '_attr_#attrid#') : normAttr;
				normAttr = normalization == 'attribute' ? ('as_' + normAttrSet + '_attr_' + normAttribute) : normAttr;
				normAttr = normalization == 'toptree' ? '#toptree#' : normAttr;

				if (normalization != 'toptree') {
					filtersNull.push(new OpenLayers.Filter.Comparison({type: '==', property: normAttr, value: 0}));
					filtersNotNull.push(new OpenLayers.Filter.Comparison({type: '!=', property: normAttr, value: 0}));
					normAttr = '${' + normAttr + '}';
				}

				props = new OpenLayers.Filter.Function({name: 'Mul', params: [new OpenLayers.Filter.Function({name: 'Div', params: ['${#attr#}', normAttr]}), factor]});
			} else {
				props = new OpenLayers.Filter.Function({name: 'Mul', params: ['${#attr#}', factor]});
			}
			if (params['zeroesAsNull']) {
				filtersNull.push(new OpenLayers.Filter.Comparison({type: '==', property: '#attr#', value: 0}));
				filtersNotNull.push(new OpenLayers.Filter.Comparison({type: '!=', property: '#attr#', value: 0}));
			}

			var nullFilter = new OpenLayers.Filter.Comparison({type:'NULL',property:'#attr#'});
			filtersNotNull.push(new OpenLayers.Filter.Logical({type: '!', filters:[nullFilter]}));
			filtersNull.push(nullFilter);

			var fcParams = [props];
			var numCat = params['numCategories'];

			var legendRules = [new OpenLayers.Rule({
				name: '#units#',
				symbolizer: {
					'Polygon': new OpenLayers.Symbolizer.Polygon({strokeWidth: 0, fillOpacity:0, strokeOpacity:0})
				}
			})];

			for (var i = 0; i < numCat; i++) {
				var ratio = i / (numCat - 1);
				var legendName ='';
				var color = colorRange ? Puma.util.Color.determineColorFromRange(colorRange[0], colorRange[1], ratio) : colors[i];
				if (params['classType'] == 'continuous') {
					fcParams.push('#minmax_' + (i + 1) + '#');
					fcParams.push(color);
					legendName = '#minmax_' + (i + 1) + '#';
				} else {
					fcParams.push(color);
					if (i < numCat - 1) {
						var val = params['classType'] == 'range' ? thresholds[i] : ('#val_' + (i + 1) + '#');
						fcParams.push(val);
					}
					if (i==0) {
						legendName = '< '+'#val_1#';
					} else if (i == numCat - 1) {
						legendName = '#val_'+i+'# >';
					} else {
						legendName = '#val_'+i+'#'+' - '+'#val_'+(i+1)+'#';
					}

				}

				var legendRule = new OpenLayers.Rule({
					name: legendName,
					symbolizer: {
						'Polygon': new OpenLayers.Symbolizer.Polygon({fillColor: color, strokeColor: '#000000', strokeWidth: 1})
					}
				});
				legendRules.push(legendRule);
			}
			if (params['classType'] == 'continuous') {
				fcParams.push('color');
			}
			var fcName = params['classType'] == 'continuous' ? 'Interpolate' : 'Categorize';
			var fillColor = new OpenLayers.Filter.Function({name: fcName, params: fcParams});

			symbolizer['Polygon'] = new OpenLayers.Symbolizer.Polygon({fillColor: fillColor, strokeColor: '#000000', strokeWidth: 1});
			var rule1 = {
				filter: filtersNotNull.length > 1 ? new OpenLayers.Filter.Logical({type: '&&', filters: filtersNotNull}) : filtersNotNull[0],
				//maxScaleDenominator: this.scaleBorder,
				maxScaleDenominator: 100000000,
				symbolizer: symbolizer
			};
			var rule2 = {
				filter: filtersNotNull.length > 1 ? new OpenLayers.Filter.Logical({type: '&&', filters: filtersNotNull}) : filtersNotNull[0],
				//minScaleDenominator: this.scaleBorder,
				minScaleDenominator: 100000000,
				symbolizer: {"Point": new OpenLayers.Symbolizer.Point({geometry: {property:'centroid'},strokeWidth: 1, strokeOpacity: 1, graphicName: 'square', pointRadius: 18, strokeColor: '#222222',fillColor: fillColor, fillOpacity: 1})}
			};
			var nullColor = params['nullColor'] || '#bbbbbb';
			var nullSymbolizer = {
				'Polygon': new OpenLayers.Symbolizer.Polygon({fillColor: nullColor, strokeColor: '#000000', strokeWidth: 1})
			};
			var rule3 = {
				filter: filtersNull.length > 1 ? new OpenLayers.Filter.Logical({type: '||', filters: filtersNull}) : filtersNull[0],
				symbolizer: nullSymbolizer
			};
			return {
				rules: [rule1, rule2, rule3],
				legend: legendRules
			};
		}
		if (params['showMapChart']) {
			symbolizer = {};
			var max = new OpenLayers.Filter.Function({name: 'env', params: ['maxsize']});
			var min = new OpenLayers.Filter.Function({name: 'Div', params: [max, 20]});
			var sizeRange = new OpenLayers.Filter.Function({name: 'Sub', params: [max, min]});
			var valRange = new OpenLayers.Filter.Function({name: 'Sub', params: ['#maxval#', '#minval#']});
			var valFactor = new OpenLayers.Filter.Function({name: 'Sub', params: ['${#attr#}', '#minval#']});

			var factor = new OpenLayers.Filter.Function({name: 'Div', params: [valFactor, valRange]});
			var sizeAdd = new OpenLayers.Filter.Function({name: 'Mul', params: [sizeRange, factor]});
			var size = new OpenLayers.Filter.Function({name: 'Add', params: [min, sizeAdd]});
			var sizeSqrt = new OpenLayers.Filter.Function({name: 'pow', params: [size, 0.5]});

			var url = Config.url + 'api/chart/drawChart/#url#';
			symbolizer['Point'] = new OpenLayers.Symbolizer.Point({externalGraphic: url, graphicFormat: 'image/svg+xml', graphicWidth: sizeSqrt});
			var rule1 = {
				symbolizer: symbolizer
			};
			return [rule1];
		}

	},
	getWmsLayerDefaults: function() {
		var layerParams = {
			singleTile: true,
			visibility: false,
			opacity: 0.7,
			ratio: 1.2,
			transitionEffect: 'resize',
			removeBackBufferDelay: 100
		};
		var params = {
			transparent: true,
			format: 'image/png'
		};
		return {layerParams: layerParams, params: params};
	},
	getChartNamedLayers: function(ruleObjs, year, forLegend) {

		var treeFilterMap = this.getTreeFilters(year);
		var namedLayers = [];
		for (var layerName in treeFilterMap) {
			var filter = treeFilterMap[layerName];
			var rules = [];
			for (var i = 0; i < ruleObjs.length; i++) {
				var ruleObj = ruleObjs[i];
				var newRuleObj = {
					symbolizer: ruleObj.symbolizer
				};
				if (ruleObj.filter) {
					newRuleObj.filter = new OpenLayers.Filter.Logical({type: '&&', filters: [filter, ruleObj.filter]});
				} else if (!forLegend) {
					newRuleObj.filter = filter;
				}
				if (ruleObj.minScaleDenominator) {
					newRuleObj.minScaleDenominator = ruleObj.minScaleDenominator;
				}
				if (ruleObj.maxScaleDenominator) {
					newRuleObj.maxScaleDenominator = ruleObj.maxScaleDenominator;
				}
				if (forLegend) {
					newRuleObj.name = ruleObj.name;
				}
				var rule = new OpenLayers.Rule(newRuleObj);
				rules.push(rule);
			}
			var style = new OpenLayers.Style();
			style.addRules(rules);
			namedLayers.push({
				name: layerName,
				userStyles: [style]
			});
			if (forLegend) {
				break;
			}
		}
		return namedLayers;
	},

	onLayerClick: function(panel,rec) {
	},

	/**
	 * It adds choropleth as layer for potentially both maps.
	 * @param cfg
	 * @param autoActivate
	 * @param index
	 */
	addChoropleth: function(cfg,autoActivate,index) {
		var layerStore = Ext.StoreMgr.lookup('layers');
		var choroplethNode = layerStore.getRootNode().findChild('type','choroplethgroup');

		var attr = cfg['attrs'][0];
		var attrObj = Ext.StoreMgr.lookup('attribute').getById(attr.attr);
		var attrSetObj = Ext.StoreMgr.lookup('attributeset').getById(attr.as);

		var layerDefaults = this.getWmsLayerDefaults();
		var mapController = this.getController('Map');

		var params = this.getController('Chart').getParams(cfg);


		var layer1 = new OpenLayers.Layer.WMS('WMS', Config.url + 'api/proxy/wms', Ext.clone(layerDefaults.params), Ext.clone(layerDefaults.layerParams));
		var layer2 = new OpenLayers.Layer.WMS('WMS', Config.url + 'api/proxy/wms', Ext.clone(layerDefaults.params), Ext.clone(layerDefaults.layerParams));
		layer1.events.register('visibilitychanged',{layer:layer1,me:this},function(a,b,c) {
			this.me.onLayerLegend(null,this.layer.nodeRec,this.layer.visibility);
		});
		mapController.map1.addLayers([layer1]);
		mapController.map2.addLayers([layer2]);

		// TODO at this point add new choropleth layer to their store.
		//      The same is going to happen with the Selection information. Store the tree information in memory and then
		//      It also makes sense why we have selected area generated by the geoserver.
		var node = Ext.create('Puma.model.MapLayer', {
			name: attr.name || (attrObj.get('name')+' - '+attrSetObj.get('name')),
			attribute: attr.attr,
			attributeSet: attr.as,
			type: 'chartlayer',
			leaf: true,
			params: params,
			cfg: cfg,
			sortIndex: 1.5,
			layer1: layer1,
			layer2: layer2,
			checked: autoActivate ? true : false
		});
		layer1.nodeRec = node;
		layer2.nodeRec = node;
		if (index || index===0) {
			choroplethNode.insertChild(index,node);
		} else {
			choroplethNode.appendChild(node);
		}
		Ext.StoreMgr.lookup('selectedlayers').loadData([node],true); // It actually adds layer among selectedLayers. By selected it means that it is visible in the left menu.
		if (autoActivate) {
			this.initChartLayer(node);
		}
	},

	onChoroplethAdd: function(btn) {
		var form = btn.up('choroplethpanel');
		var cfg = form.getForm().getValues();
		this.addChoropleth(cfg,true);
	},


	onChoroplethRemove: function(panel,record) {
		var mapController = this.getController('Map');
		record.get('layer1').setVisibility(false);
		record.get('layer2').setVisibility(false);
		mapController.map1.removeLayer(record.get('layer1'));
		mapController.map2.removeLayer(record.get('layer2'));
		record.destroy();
	},


	reconfigureAll: function() {
		var layerStore = Ext.StoreMgr.lookup('layers');
		var choroplethNode = layerStore.getRootNode().findChild('type','choroplethgroup');
		for (var i=0;i<choroplethNode.childNodes.length;i++) {
			var childNode = choroplethNode.childNodes[i];
			this.initChartLayer(childNode);
		}
	},

	onChoroplethReconfigure: function(btn) {
		var form = btn.up('choroplethpanel');
		var cfg = form.getForm().getValues();
		var rec = form.chart;
		var params = this.getController('Chart').getParams(cfg);

		var attr = cfg['attrs'][0];
		var attrObj = Ext.StoreMgr.lookup('attribute').getById(attr.attr);
		// var attrSetObj = Ext.StoreMgr.lookup('attributeset').getById(attr.as);

		rec.set('name',cfg['title']+' - '+attrObj.get('name'));
		rec.set('attributeSet',attr.as);
		rec.set('attribute',attr.attr);
		rec.set('cfg',cfg);
		rec.set('params',params);
		rec.commit();
		this.initChartLayer(rec);
	},

	onChoroplethReconfigureBtnClick: function(panel,rec) {
		var cfg = this.getController('Chart').getChartWindowConfig(rec, true, 'choroplethpanel');
		var window = Ext.widget('window', cfg);
		window.down('choroplethpanel').getForm().setValues(rec.get('cfg'));
		window.show();
	},

	loadVisualization: function(visId) {
		var store = Ext.StoreMgr.lookup('visualization');
		var vis = store.getById(visId);

		if (!vis && !Config.cfg) {
			return;
		}
		var attrs = Config.cfg ? Config.cfg.choroplethCfg : vis.get('choroplethCfg');
		attrs = attrs || [];
		this.reconfigureChoropleths({attrs:attrs});

	},

	getLegendUrl: function(layersOrSldId,legendLayerName,symbologyId) {
		var obj = {
			"LAYERS": layersOrSldId,
			"REQUEST": 'GetLegendGraphic',
			"FORMAT": 'image/png',
			"WIDTH": 50
		};
		if (legendLayerName) {
			obj['USE_SECOND'] = true;
			obj['LAYER'] = legendLayerName;
			delete obj['LAYERS'];
			obj['SLD_ID'] = layersOrSldId;
		}
		if (symbologyId) {
			obj['STYLE'] = symbologyId;
		}
		var query = Ext.Object.toQueryString(obj);
		return Config.url + 'api/proxy/wms?' + query;
	},

	initChartLayer: function(node) {
		//if (!node.get('checked')) {
		//	return;
		//}
		var years = Ext.ComponentQuery.query('#selyear')[0].getValue();
		var params = node.get('params');
		params['areas'] = JSON.stringify(this.getController('Area').lowestMap);
		params['showChoropleth'] = 'true';
		var symObjs = this.getSymObj(node.get('params'));
		var ruleObjs = symObjs.rules;
		var legendRules = symObjs.legend;
		for (var i = 0; i < Math.max(2, years.length); i++) {
			var year = years[i];
			var namedLayers = this.getChartNamedLayers(ruleObjs, year);
			var legendNamedLayers = this.getChartNamedLayers(legendRules, year, true);
			node.get('params')['years'] = JSON.stringify([year]);
			if (i == 0 && years.length > 1) {
				node.get('params')['altYears'] = JSON.stringify([years[1]]);
			} else if (i == 1) {
				node.get('params')['altYears'] = JSON.stringify([years[1]]);
				node.get('params')['years'] = JSON.stringify([years[0]]);
			} else {
				delete node.get('params')['altYears'];
			}
			if (!namedLayers || !namedLayers.length){
				continue;
			}
			var layer = i == 0 ? node.get('layer1') : node.get('layer2');
			this.saveSld(node, namedLayers, layer, node.get('params'), legendNamedLayers);
		}
	},

	checkLayerIn2d: function(action, notification, target){
		if (action == notification && notification == "checklayer"){
			this._multiCheck = true;
			target.trigger("click");
		}
	},

	/**
	 * This method is called whenever user clicks on the checkbox in the left menu. It should either show the layer or
	 * hide the layer. If there is another layer shown in the same layer group, it also hides the currently shown layer.
	 * Each MapLayer is actually associated with two layers. Each of them is for different map.
	 * @param node {} Node representing the layer user clicked on.
	 * @param checked {Boolean} State of the checked node.
	 */
	onCheckChange: function (node, checked) {
		var parentNode = node.parentNode;
		var parentType = parentNode.get('type');
		var nodeType = node.get('type');
		var self = this;

		// get view object of layer panel
		var view = Ext.ComponentQuery.query('#layerpanel')[0].view;

		if(node.get('type') == 'traffic') {
			this.changeVisibilityOfTrafficLayer(node, checked);
			return;
		}

		// don't uncheck basemap layer
		if(!checked && parentType == 'basegroup' && view.lastE) {
			node.set('checked', true); // recheck
			return;
		}

		// Hide legend.
		if (!checked && node.get('legend')) {
			node.get('legend').destroy();
		}

		// get store object
		var store = Ext.StoreMgr.lookup('selectedlayers');

		// multiple layers from one group, if CTRL key used
		var multi = false;
		//if (parentType != 'basegroup' && (view.lastE && view.lastE.ctrlKey || this._multiCheck)) {
		//	multi = true;
		//	this._multiCheck = false;
		//}
		if (parentType != 'basegroup') {
			multi = true;
			this._multiCheck = false;
		}

		// reset last event object
		view.lastE = null;

		// ? update store content?
		store.filter();

		// layers in map windows objects
		var layer1 = node.get('layer1');
		var layer2 = node.get('layer2');

		// new sortIndex
		if (checked) {
			var firstInCategoryIndex = 8000;
			var selectedLayers = store.getRange();

			// console.debug("\n\n#### " + node.get('name'));

			// get the lowest used sortIndex in the same or lower (higher number) category
			for(var i in selectedLayers){
				if(!selectedLayers.hasOwnProperty(i)) continue;
				var selectedLayer = selectedLayers[i];
				var selectedLayerParent = selectedLayer.parentNode;

				if(node.id == selectedLayer.id) continue; // skip the layer itself

				if(this.getLayerGroupCategory(selectedLayerParent.get('type')) >= this.getLayerGroupCategory(parentType)) {
					// console.debug(selectedLayer.get('name') + " (sortIndex: " + selectedLayer.get('sortIndex') + ") has the same or lower category");
					firstInCategoryIndex = Math.min(firstInCategoryIndex, selectedLayer.get('sortIndex'));
				}

			}

			// make new index just a bit lower then the lowest one
			var newIndex = firstInCategoryIndex - 0.1;
			// console.debug("# new sortIndex: " + newIndex);
			node.set('sortIndex', newIndex);
			node.commit();
		}

		// initialize charts if the layer should have any
		if (node.get('type') == 'chartlayer' && node.get('checked') && !node.initialized) {
			this.initChartLayer(node);
			return;
		}

		if (Ext.Array.contains(['basegroup', 'choroplethgroup', 'thematicgroup', 'systemgroup'], parentType) && checked && !multi && nodeType != 'traffic') {
			// switching off choropleths
			if (nodeType == 'areaoutlines') {
				parentNode = parentNode.parentNode.findChild('type', 'choroplethgroup');
			}
			// just one selected selected areas layer
			if (nodeType == 'selectedareas' || nodeType == 'selectedareasfilled') {
				var anotherNode = parentNode.findChild('type', nodeType == 'selectedareas' ? 'selectedareasfilled' : 'selectedareas');
				anotherNode.set('checked', false);
				self.onCheckChange(anotherNode, false);
				parentNode = {childNodes: []};
			}

			// switch off area outlines when choropleth is swithing on
			if (parentType == 'choroplethgroup') {
				var anotherNode = parentNode.parentNode.findChild('type', 'systemgroup').findChild('type', 'areaoutlines');
				anotherNode.set('checked', false);
				self.onCheckChange(anotherNode, false);
			}

			// do not switch off choropleths TODO rewrite this part
			if (nodeType != 'areaoutlines'){
				self.hideOtherLayersInTheSameLayerGroup(parentNode, node);
			}
		}

		// actual map layer visibility
		if (layer1.initialized) {
			layer1.setVisibility(checked);
		}
		if (layer2.initialized) {
			layer2.setVisibility(checked);
		}

		// refactor indexes of selected layers in the store to consecutive integers, maintain order
		store.sort();
		this.resetIndexes();

		// perform order changes
		this.onLayerDrop();

	},

	/**
	 * Get category of the layergroup
	 * @param layerGroup {String}
	 * @returns {*}
	 */
	getLayerGroupCategory: function(layerGroup) {
		var categories = [
			['systemgroup'], // 0
			['choroplethgroup'], // 1
			null, // 2 - dafault
			['basegroup'] // 3
		];
		var defaultCategory = 2;

		for(var categoryNumber in categories) {
			if(!categories.hasOwnProperty(categoryNumber)) continue;
			if(categories[categoryNumber] && categories[categoryNumber].indexOf(layerGroup) >= 0) {
				return categoryNumber;
			}
		}
		return defaultCategory;
	},

	/**
	 * It shows or hides the traffic layer.
	 * @param node
	 * @param checked {Boolean} Whether the layer should be visible.
	 * @private
	 */
	changeVisibilityOfTrafficLayer: function(node, checked) {
		var layer1 = node.get('layer1');
		var layer2 = node.get('layer2');
		if (layer1) {
			layer1.setMap(checked ? layer1.oldMapObj : null);
		}
		if (layer2) {
			layer2.setMap(checked ? layer2.oldMapObj : null);
		}
	},

	/**
	 * It gets layer group node and hides all other layers in the same layer group.
	 * @param layerGroupNode {} Node representing the layer group.
	 * @param chosenNode {} Node representing the currently chosen group.
	 */
	hideOtherLayersInTheSameLayerGroup: function(layerGroupNode, chosenNode) {
		for (var i = 0; i < layerGroupNode.childNodes.length; i++) {
			var childNode = layerGroupNode.childNodes[i];
			if (chosenNode != childNode) {
				childNode.set('checked', false);
				this.onCheckChange(childNode, false);
			}
		}
	},

	gatherVisibleLayers: function() {
		var store = Ext.StoreMgr.lookup('selectedlayers');
		var confs = [];
		store.each(function(rec) {
			var conf = {};
			var type = rec.get('type');
			conf.type = type;
			if (type=='topiclayer') {
				conf.symbologyId = rec.get('symbologyId');
				conf.at = rec.get('at');
			}
			if (type=='chartlayer') {
				conf.attr = rec.get('attribute');
				conf.as = rec.get('attributeSet');
			}
			confs.push(conf)
		});
		return confs;
	},

	// TODO: Figure out exactly what this thing does.
	checkVisibilityAndStyles: function() {
		var visId = Ext.ComponentQuery.query('#selvisualization')[0].getValue();
		var vis = Ext.StoreMgr.lookup('visualization').getById(visId);
		if (!vis && !Config.cfg) return;
		var visibleLayers = Config.cfg ? Config.cfg.layers : (vis.get('visibleLayers') || []);
		var store = Ext.StoreMgr.lookup('layers');
		var root = store.getRootNode();
		var me = this;
		root.cascadeBy(function(node) {
			var type = node.get('type');
			if (type!='topiclayer' && type!='chartlayer' && !Config.cfg) return;
			var layer1 = node.get('layer1');
			var layer2 = node.get('layer2');
			if (!layer1) return;

			var foundLayer = null;
			for (var i=0;i<visibleLayers.length;i++) {
				var selLayer = visibleLayers[i];
				if (type=='topiclayer' && selLayer.at == node.get('at') && selLayer.symbologyId==node.get('symbologyId')) {
					foundLayer = selLayer;
					break;
				} else if (type=='chartlayer' && selLayer.attributeSet == node.get('attributeSet') && selLayer.attribute==node.get('attribute')) {
					foundLayer = selLayer;
					break;
				} else if (type!='chartlayer' && type!='topiclayer' && type != 'wmsLayer' && type == selLayer.type) {
					foundLayer = selLayer;
					break;
				}

			}
			if (foundLayer) {
				if (Config.cfg) {
					node.set('sortIndex',foundLayer.sortIndex);
					layer1.setOpacity(foundLayer.opacity);
					layer2.setOpacity(foundLayer.opacity);
				}
				node.set('checked',true);
				me.onCheckChange(node,true,null,true);

			} else {
				if(type != 'wmsLayer') {
					node.set('checked', false);
					me.onCheckChange(node, false, null, true);
				}
			}
		});
		if (Config.cfg && Config.cfg.trafficLayer) {
			var node = root.findChild('type','livegroup').childNodes[0];
			node.set('checked',true);
			me.onCheckChange(node,true,null,true);
		}
		store = Ext.StoreMgr.lookup('selectedlayers');
		store.sorters = new Ext.util.MixedCollection();

		store.sort('sortIndex','ASC');

	}
});

function Units() {
	this.units = {
		m2: 1,
		ha: 10000,
		km2: 1000000
	};
	this.allowedUnits = ['m2', 'km2', 'ha'];
}

Units.prototype.translate = function(unitFrom, unitTo, percentage) {
	percentage = percentage ? 100: 1;

	if(!unitFrom && !unitTo) {
		return percentage;
	}

	if(!unitTo || this.allowedUnits.indexOf(unitTo) == -1) {
		return percentage;
	}

	if(!unitFrom || this.allowedUnits.indexOf(unitFrom) == -1) {
		return 1 / percentage;
	}

	return (this.units[unitFrom] / this.units[unitTo]) * percentage;
};
