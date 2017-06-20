define([
	'../../../util/RemoteJQ'
], function (Remote) {
	/**
	 * Execute a search terms query
	 * @param queryString {string}
	 * @param settings {Object} searching parameters
	 * @returns {Remote}
	 */
	function searchTerms(queryString, settings) {
		return new Remote({
			url: 'iprquery/terms',
			params: {
				search: queryString,
				settings: settings
			}
		}).post();
	}

	/**
	 * Execute a search attributes query
	 * @param dataset {string}
	 * @returns {Remote}
	 */
	function searchAttributes(dataset) {
		return new Remote({
			url: 'iprquery/dataset',
			params: {
				dataset: dataset
			}
		}).post();
	}

	/**
	 * Execute a search object query
	 * @param datasetName {string}
	 * @param objectDatasetCode {string}
	 * @param objectCode {string}
	 * @returns {Remote}
	 */
	function searchObject(datasetName, objectDatasetCode, objectCode) {
		return new Remote({
			url: 'iprquery/object',
			params: {
				dataset: datasetName,
				objectDataset: objectDatasetCode,
				objectId: objectCode
			}
		}).post();
	}

	/**
	 * Execute a search dataset query
	 * @param dataset {string}
	 * @param param {string}
	 * @param value {string | Number}
	 * @param type {string}
	 * @returns {Remote}
	 */
	function searchData(dataset, param, value, type) {
		return new Remote({
			url: 'iprquery/data',
			params: {
				dataset: dataset,
				param: param,
				value: value,
				type: type
			}
		}).post();
	}

	/**
	 * Execute a conversion query
	 * @param geom {string} WKT Geometry in Krovak Eest-North coordinates
	 */
	function convertGeometry(geom) {
		return new Remote({
			url: 'iprconversion/krovak2wgs',
			params: {
				geometry: geom
			}
		}).post();
	}

	return {
		convertGeometry: convertGeometry,
		searchAttributes: searchAttributes,
		searchTerms: searchTerms,
		searchData: searchData,
		searchObject: searchObject
	};
});