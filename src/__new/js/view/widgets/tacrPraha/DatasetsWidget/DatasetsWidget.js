define([
	'../../Widget',
	'resize',

	'jquery'
], function (Widget,
			 resize,

			 $) {
	/**
	 * This widget contains the information about the data.
	 * @constructor
	 */
	var DatasetsWidget = function (options) {
		Widget.apply(this, arguments);

		this.build();
	};

	DatasetsWidget.prototype = Object.create(Widget.prototype);

	DatasetsWidget.prototype.build = function () {
		if (!this._resizeListener) {
			this._resizeListener = true;
			this.addOnResizeListener();
		}
		this._initializeResize = false;
		this.handleLoading("hide");

		this.rebuild();

		$(this._widgetSelector).find(".widget-minimise").off();
		$(this._widgetSelector).find(".widget-minimise").on("click", function(){
			// TODO data
			$('#floater-dataset').hide();
		});

		$('#searching-terms-form-submit').on('click', function(){
			// Search for datasets.
		})
	};

	/**
	 *
	 */
	DatasetsWidget.prototype.rebuild = function () {
		$('#floater-dataset .floater-body').empty();

		$('#floater-dataset .floater-body').append(
			'<div>' +
			'	<div class="instructions">' +
			'		<h2 class="section-title">1. Vyhledej pojmy v datasetech</h2>' +
			'		<p class="section-description">Základní hledání, které vybere všechny pojmy v datasetech, které korespondují se zadanými klíčovými slovy. Způsob hledání je možné ovlivnit v nastavení.</p>' +
			'	</div>' +
			'		<input class="searching-input" title="searching-terms-form-input" type="text" name="searching-terms-form-input" id="searching-terms-form-input" value="">' +
			'		<button class="searching-submit" type="button" id="searching-terms-form-submit">' +
			'			<i class="fa fa-search" aria-hidden="true"></i>' +
			'		</button>' +
			'</div>'
		);

		if(this._datasets) {
			this.buildTable();
		}


	};

	DatasetsWidget.prototype.buildTable = function() {
		return '' +
			'<div class="instructions">'+
			'	<h2 class="section-title">2. Vyber dataset</h2>'+
			'	<p class="section-description">Kliknutím na řádek tabulky vyberete dataset.</p>'+
			'</div>'+
			'<div class="results">'+
			'	<div class="results-tables"></div>'+
			'	<div class="pagination"></div>'+
			'	<div class="results-overlay"></div>'+
			'</div>'+
			'';
	};

	/**
	 * Rebuild widget on resize
	 */
	DatasetsWidget.prototype.addOnResizeListener = function () {
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

	return DatasetsWidget;
});