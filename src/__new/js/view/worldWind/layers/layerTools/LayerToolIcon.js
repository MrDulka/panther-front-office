define(['../../../../error/ArgumentError',
	'../../../../error/NotFoundError',
	'../../../../util/Logger',

	'jquery',
	'css!./LayerToolIcon'
], function(ArgumentError,
			NotFoundError,
			Logger,

			$
){
	/**
	 * Class representing icon of a layer tool
	 * @param options {Object}
	 * @param options.id {string} id of the icon
	 * @param options.class {string} optional class of the icon
	 * @param options.target {JQuery} selector of a target element
	 * @param options.active {boolean} true if the icon should be active
	 * @constructor
	 */
	var LayerToolsIcon = function(options){
		if (!options.id){
			throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "LayerToolsIcon", "constructor", "missingId"));
		}
		if (!options.target || options.target.length == 0){
			throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "LayerToolsIcon", "constructor", "missingTarget"));
		}

		this._target = options.target;
		this._id = options.id;
		this._class = options.class || "";
		this._faClass = options.faClass || "fa-bug";
		this._active = options.active || false;
		this._title = options.title || "";

		this.build();
	};

	/**
	 * Build the icon
	 */
	LayerToolsIcon.prototype.build = function(){
		this._class += " layer-tool-icon";
		if (this._active){
			this._class += " open"
		}
		this._target.append('<div title="' + this._title + '" class="' + this._class + '" id="' + this._id + '">' +
			'<i class="fa ' + this._faClass + '" aria-hidden="true"></i>' +
			'</div>');

		this._iconSelector = $("#" + this._id);
	};

	/**
	 * @returns {*|jQuery|HTMLElement}
	 */
	LayerToolsIcon.prototype.getElement = function(){
		return this._iconSelector;
	};

	return LayerToolsIcon;
});