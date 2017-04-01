define(['../../../error/ArgumentError',
	'../../../error/NotFoundError',
	'../../../util/Logger',

	'../MyUrlBuilder',

	'jquery',
	'worldwind'
], function(ArgumentError,
			NotFoundError,
			Logger,

			MyUrlBuilder,

			$
){
	var WmsLayer = WorldWind.WmsLayer;

	/**
	 * Class extending WorldWind.WmsLayer.
	 * @param options {Object}
	 * @augments WorldWind.WmsLayer
	 * @constructor
	 */
	var MyWmsLayer = function(options){
		WmsLayer.call(this, options);

		this.sldId = options.sldId;
		this.urlBuilder = new MyUrlBuilder(
				options.service, options.layerNames, options.styleNames, options.version,
			options.timeString, this.sldId);
	};

	MyWmsLayer.prototype = Object.create(WmsLayer.prototype);

	return MyWmsLayer;
});