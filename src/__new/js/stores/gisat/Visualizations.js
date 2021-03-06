define([
	'../BaseStore',
	'../Stores',
	'../../data/Visualization'
], function(BaseStore,
			Stores,
			Visualization){
	"use strict";
	var visualizations;

	/**
	 * Store for retrieval of Visualizations from the API.
	 * @augments BaseStore
	 * @constructor
	 * @alias Visualizations
	 */
	var Visualizations = function() {
		BaseStore.apply(this, arguments);
	};

	Visualizations.prototype = Object.create(BaseStore.prototype);

	/**
	 * @inheritDoc
	 */
	Visualizations.prototype.getInstance = function(visualizationData) {
		return new Visualization({data: visualizationData});
	};

	/**
	 * @inheritDoc
	 */
	Visualizations.prototype.getPath = function() {
		return "rest/visualization";
	};

	if(!visualizations) {
		visualizations = new Visualizations();
		Stores.register('visualization', visualizations);
	}
	return visualizations;
});
