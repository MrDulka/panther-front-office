define([
	'../../Widget',

	'resize',
	'jquery'
], function(Widget,

			resize,
			$){
	/**
	 * It contains the stuff necessary for retrieval of the data and displaying them on the map.
	 * @constructor
	 */
	var DataWidget = function(options) {
		Widget.apply(this, arguments);

		this.build();
	};

	DataWidget.prototype = Object.create(Widget.prototype);

	DataWidget.prototype.build = function() {
		if (!this._resizeListener) {
			this._resizeListener = true;
			this.addOnResizeListener();
		}
		this._initializeResize = false;
		this.handleLoading("hide");

		$(this._widgetSelector).find(".widget-minimise").off();
		$(this._widgetSelector).find(".widget-minimise").on("click", function(){
			// TODO data
			$('#floater-data').hide();
		});

		this.rebuild();
	};

	DataWidget.prototype.rebuild = function() {
		// The input must be part of that. Afterwards also the results are part of that and the results needs to be integrated into the map via the geoserver.
		$('#floater-data .floater-body').empty();

		$('#floater-data .floater-body').append(
			'<div>' +
			'	<div class="instructions">' +
			'		<h2 class="section-title">1. Vyhledej pojmy v datech</h2>' +
			'		<p class="section-description">Nejprve najde datasety a nasledne ve vsech odpovidajicich datasetech najde data a a ta zobrazi na mape. </p>' +
			'	</div>' +
			'	<form id="searching-data-terms-form">' +
			'		<input class="searching-input" title="searching-data-terms-form-input" type="text" name="searching-data-terms-form-input" id="searching-data-terms-form-input" value="">' +
			'		<button class="searching-submit" type="submit" id="searching-data-terms-form-submit">' +
			'			<i class="fa fa-search" aria-hidden="true"></i>' +
			'		</button>' +
			'	</form>' +
			'</div>'
		);
	};

	/**
	 * Rebuild widget on resize
	 */
	DataWidget.prototype.addOnResizeListener = function () {
		var self = this;
		var id = this._widgetSelector.attr("id");
		var resizeElement = document.getElementById(id);

		var timeout;
		resize.addResizeListener(resizeElement, function () {
			clearTimeout(timeout);
			timeout = setTimeout(function () {
				if (self._initializeResize) {
					self.build();
				}
				self._initializeResize = true;
			}, 500);
		});
	};

	return DataWidget;
});