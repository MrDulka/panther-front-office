define([
	'jquery'
], function ($) {

	/**
	 * It represents single FilteredSld usable in the whole thing.
	 * I need to actually ask the server side.
	 * @param fields {Object} It contains list of fields. Each field contain the name, and list of values.
	 * @param color {String} Hexadecimal value of the color used for these purposes.
	 * @constructor
	 */
	var FilteredSld = function (fields, color) {
		this._fields = fields;
		this._color = color;
		this._id = null;
	};

	FilteredSld.prototype.toString = function () {
		return '<?xml version="1.0" encoding="UTF-8"?>' +
			'<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"' +
			' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0"' +
			' xmlns:xlink="http://www.w3.org/1999/xlink"' +
			' xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd">' +
			'	<NamedLayer>' +
			'		<Name>Name</Name>' +
			'		<UserStyle>' +
			'			<Title>Name</Title>' +
			'			<FeatureTypeStyle>' +
			'				<Rule>' +
			'					<Name>Name</Name>' +
			'					<Title>Name</Title>' +
			'					<ogc:Filter>' + this.generateFilter() + '</ogc:Filter>' +
			'					<PolygonSymbolizer>' +
			'						<Fill>' +
			'							<CssParameter name="fill">'+this._color+'</CssParameter>' +
			'						</Fill>' +
			'						<Stroke>' +
			'							<CssParameter name="stroke">'+this._color+'</CssParameter>' +
			'							<CssParameter name="stroke-width">0.1</CssParameter>' +
			'						</Stroke>' +
			'					</PolygonSymbolizer>' +
			'				</Rule>' +
			'			</FeatureTypeStyle>' +
			'		</UserStyle>' +
			'	</NamedLayer>' +
			'</StyledLayerDescriptor>';
	};

	FilteredSld.prototype.generateFilter = function() {
		var result = '<ogc:And>';
		result += this._fields.map(function(attribute){
			var attributeType = attribute.attributeType;
			var name = attribute.name.replace(/-/g, '_');
			if(attributeType == 'numeric'){
				var minValue = attribute.value[0];
				var maxValue = attribute.value[1];
				result =
					'<ogc:PropertyIsGreaterThanOrEqualTo>' +
					'	<ogc:PropertyName>'+name+'</ogc:PropertyName>' +
					'	<ogc:Literal>'+minValue+'</ogc:Literal>' +
					'</ogc:PropertyIsGreaterThanOrEqualTo>'+
					'<ogc:PropertyIsLessThanOrEqualTo>' +
					'	<ogc:PropertyName>'+name+'</ogc:PropertyName>' +
					'	<ogc:Literal>'+maxValue+'</ogc:Literal>' +
					'</ogc:PropertyIsLessThanOrEqualTo>';
				return result;
			} else if(attributeType == 'text' && attribute.multioptions == true) {
				var result = '<ogc:Or>';

				result += attribute.value.map(function(value){
					var result =
						'<ogc:PropertyIsEqualTo>' +
						'	<ogc:PropertyName>'+name+'</ogc:PropertyName>' +
						'	<ogc:Literal>'+value+'</ogc:Literal>' +
						'</ogc:PropertyIsEqualTo>';
					return result;
				});

				result += '</ogc:Or>';
				return result;
			} else if(attributeType == 'boolean' || attributeType == 'text') {
				var value = attribute.value[0];
				var result =
					'<ogc:PropertyIsEqualTo>' +
					'	<ogc:PropertyName>'+name+'</ogc:PropertyName>' +
					'	<ogc:Literal>'+value+'</ogc:Literal>' +
					'</ogc:PropertyIsEqualTo>';
				return result;
			}
		});
		result += '</ogc:And>';

		return result;
	};

	return FilteredSld;
});