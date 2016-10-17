define(['../../util/Remote',
		'../../stores/Stores',
		'jquery'
],function(Remote,
		   Stores,
		   $){

	/**
	 * Class for gathering attributes metadata
	 * @constructor
	 */

	var Attributes = function(){
		this._attributeSets = null;
	};

	/**
	 * It returns information about all attributes grouped by attribute sets
	 * @returns {Promise}
	 */
	Attributes.prototype.getData = function(){
		var self = this;
		if (ThemeYearConfParams.datasetChanged || ThemeYearConfParams.themeChanged || ThemeYearConfParams.placeChanged){
			return new Remote({
				method: "POST",
				url: window.Config.url + "api/theme/getThemeYearConf",
				params: self.getThemeYearConfParams()
			}).then(function(response){
				var output = JSON.parse(response);
				if (output.data.hasOwnProperty("attrSets")){
					self._attributeSets = output.data.attrSets;
				}
				return self.getAttributesFromAllAttributeSets(self._attributeSets);
			});
		}
		else {
			return this.getAttributesFromAllAttributeSets(this._attributeSets);
		}
	};

	/**
	 * It returns a Promise of attributes metadata for all attribute sets
	 * @param attributeSets {Array} Ids of attribute sets
	 * @returns {Promise}
	 */
	Attributes.prototype.getAttributesFromAllAttributeSets = function(attributeSets){
		var self = this;
		return Promise.all(attributeSets.map(self.getAttributeSet.bind(self)));
	};

	/**
	 * Get attribute set data
	 *
	 * @param attributeSet {number} ID of attribute set
	 * @returns {*|Promise}
	 */
	Attributes.prototype.getAttributeSet = function (attributeSet) {
		var self = this;
		return Stores.retrieve("attributeSet").byId(attributeSet).then(function (attrSet) {
			return attrSet[0];
		}).then(self.getAttributesFromAttributeSet.bind(self));
	};

	/**
	 * Return the data of all atributes in give attribute set
	 * @param attributeSet {Object}
	 * @param attributeSet.attributes {Array} IDs of attributes
	 * @returns {Promise}
	 */
	Attributes.prototype.getAttributesFromAttributeSet = function(attributeSet){
		var self = this;
		return Promise.all(attributeSet.attributes.map(self.getAttribute.bind(self, attributeSet)));
	};

	/**
	 * Get the attribute data
	 *
	 * @param attributeSet {Object} attribute set
	 * @param attributeSet.id {number} attribute set id
	 * @param attributeSet.name {string} attribute set name
	 * @param attribute {number} id of the attribute
	 * @returns {*|Promise}
	 */
	Attributes.prototype.getAttribute = function(attributeSet, attribute){
		var self = this;
		return Stores.retrieve("attribute").byId(attribute).then(
			self.getAttributeDataByType.bind(self, attributeSet)
		);
	};

	/**
	 * Use the filter according to attribute type and return the attribute data
	 *
	 * @param attributeSet {Object} attribute set
	 * @param attributeSet.id {number} attribute set id
	 * @param attributeSet.name {string} attribute set name
	 * @param attribute {Object[]} attribute
	 * @param attribute.id {number} attribute id
	 * @param attribute.name {string} attribute name
	 * @param attribute.type {('numeric'|'text'|'boolean')} attribute type
	 * @param attribute.standardUnits {string}
	 * @returns {Object|Promise}
	 */
	Attributes.prototype.getAttributeDataByType = function(attributeSet, attribute) {
		debugger;
		var attr = attribute[0];
		var params = {};
		if (attr){
			params = {
				attribute: attr.id,
				attributeName: attr.name,
				attributeType: attr.type,
				attributeSet: attributeSet.id,
				attributeSetName: attributeSet.name,
				units: attr.standardUnits
			}
		}
		return params;
	};

	/**
	 * It prepares the parameters for getThemeYearConf request
	 * @returns {{theme: string, years: string, dataset: string, refreshLayers: string, refreshAreas: string}}
	 */
	Attributes.prototype.getThemeYearConfParams = function(){
		return {
			theme: ThemeYearConfParams.theme,
			years: ThemeYearConfParams.years,
			dataset: ThemeYearConfParams.dataset,
			refreshLayers: 'true',
			refreshAreas: 'true'
		};
	};

	return Attributes;
});