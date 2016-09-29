define([
	'js/stores/Stores',
	'js/stores/gisat/Attributes',
	'js/stores/gisat/AttributeSets'
], function(Stores,
			Attributes,
			AttributeSets){
	/**
	 * Constructor for assembling current application.
	 * @constructor
	 */
	var FrontOffice = function() {
		this.loadData();
	};

	FrontOffice.prototype.loadData = function(){
		if (Config.toggles.hasOwnProperty("hasNewEvaluationTool") && Config.toggles.hasNewEvaluationTool){
			//setTimeout(function(){
			Stores.retrieve('attribute').load();
			Stores.retrieve('attributeSet').load();
			//},200)
		}
	};

	return FrontOffice;
});