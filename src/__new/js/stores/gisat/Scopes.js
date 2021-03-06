define([
	'../BaseStore',
	'../Stores',
	'../../data/Scope'
], function(BaseStore,
			Stores,
			Scope){
	"use strict";
	var scopes;

	/**
	 * Store for retrieval of Scopes from the API.
	 * @augments BaseStore
	 * @constructor
	 * @alias Scopes
	 */
	var Scopes = function() {
		BaseStore.apply(this, arguments);
	};

	Scopes.prototype = Object.create(BaseStore.prototype);

	/**
	 * @inheritDoc
	 */
	Scopes.prototype.getInstance = function(data) {
		return new Scope({data: data});
	};

	/**
	 * @inheritDoc
	 */
	Scopes.prototype.getPath = function() {
		return "rest/dataset";
	};

	if(!scopes) {
		scopes = new Scopes();
		Stores.register('scope', scopes);
	}
	return scopes;
});
