define(['../error/ArgumentError',
	'../error/NotFoundError',
	'./Logger',

	'./Promise',

	'jquery'
], function(ArgumentError,
			NotFoundError,
			Logger,
			Promise,
			$
){
	/**
	 * @param options {Object}
	 * @constructor
	 */
	var RemoteJQ = function(options){
		if (!options.url){
			throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "RemoteJQ", "constructor", "missingUrl"));
		}

		this._url = Config.url + options.url;
		this._params = {};
		if (options.hasOwnProperty("params")){
			this._params = options.params;
		}
	};

	/**
	 * Get request
	 * @returns {Promise}
	 */
	RemoteJQ.prototype.get = function(){
		return $.get(this._url, this._params);
	};

	RemoteJQ.prototype.post = function(){
		return $.post(this._url, this._params);
	};

	return RemoteJQ;
});