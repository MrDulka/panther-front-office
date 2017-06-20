define([
	'../../../../util/RemoteJQ',
	'../../Widget',
	'./Wordcloud',

	'resize',
	'jquery'
], function(Remote,
			Widget,
			Wordcloud,

			resize,
			$){
	var StatisticsWidget = function(options) {
		Widget.apply(this, arguments);

		this._wordCloudAll = null;
		this._wordCloudSuccess = null;

		this.build();
	};

	StatisticsWidget.prototype = Object.create(Widget.prototype);

	StatisticsWidget.prototype.build = function() {
		if (!this._resizeListener) {
			this._resizeListener = true;
			this.addOnResizeListener();
		}
		this._initializeResize = false;
		this.handleLoading("hide");

		$(this._widgetSelector).find(".widget-minimise").off();
		$(this._widgetSelector).find(".widget-minimise").on("click", function(){
			// TODO data
			$('#floater-datasets').hide();
		});

		this._wordCloudId = 'statistics-word-cloud';

		this.rebuild();
	};

	StatisticsWidget.prototype.rebuild = function(){
		$('#floater-statistics .floater-body').empty();

		$('#floater-statistics .floater-body').append(
			'<section id="statistics-word-cloud-successful">' +
			'	<div>' +
			'		<h2 class="section-title">Nejčastěji hledaná slova - úspěšná hledání</h2>' +
			'		<p class="section-description">Word cloud níže zobrazuje nejčastěji hledaná slova nebo spojení, která vrátila alespoň jeden výsledek. Čím je písmo větší a tmavší, tím častěji byl daný výraz při hledání použit. Kliknutím na slovo spustíte vyhledávání.</p>' +
			'		<div class="word-cloud">' +
			'			<div id="statistics-word-cloud-successful-chart" class="cloud-content"></div>' +
			'			<div class="word-cloud-box"></div>' +
			'		</div>' +
			'	</div>' +
			'</section>' +
			'<section id="statistics-word-cloud-all">' +
			'	<div>' +
			'		<h2 class="section-title">Nejčastěji hledaná slova - všechna hledání</h2>' +
			'		<p class="section-description">Word cloud níže zobrazuje nejčastěji hledaná slova nebo spojení. Čím je písmo větší a tmavší, tím častěji byl daný výraz při hledání použit. Kliknutím na slovo spustíte vyhledávání.</p>' +
			'		<div class="word-cloud">' +
			'			<div id="statistics-word-cloud-all-chart" class="cloud-content"></div>' +

			'			<div class="word-cloud-box"></div>' +
			'		</div>' +
			'	</div>' +
			'</section>'
		);

		this.generateStatistics();
	};

	StatisticsWidget.prototype.buildWordCloud = function(data, max, target){
		return new Wordcloud({
			targetId: target,
			data: data,
			max: max,
			searching: this._searching
		})
	};

	/**
	 * Generate the statistics
	 */
	StatisticsWidget.prototype.generateStatistics = function(){
		var self = this;
		if (!this._wordCloudAll){
			this.getStatistics("all").done(function(res){
				var max = self.findMaximum(res);
				var target = self._wordCloudId + "-all-chart";
				self._wordCloudAll = self.buildWordCloud(res, max, target);
			});
		}
		if (!this._wordCloudSuccess){
			this.getStatistics("successful").done(function(res){
				var max = self.findMaximum(res);
				var target = self._wordCloudId + "-successful-chart";
				self._wordCloudSuccess = self.buildWordCloud(res, max, target);
			});
		}
	};

	/**
	 * Execute statistics request
	 * @param type {string} type of statistics
	 * @returns {*}
	 */
	StatisticsWidget.prototype.getStatistics = function(type){
		return new Remote({
			url: 'iprquery/statistics',
			params: {
				type: type
			}
		}).get();
	};

	/**
	 * find maximum in data
	 * @param data {Array} keywords and their frequencies
	 * @returns {number}
	 */
	StatisticsWidget.prototype.findMaximum = function(data){
		var counts = [];
		data.forEach(function(rec){
			counts.push(rec[1]);
		});
		return _.max(counts);
	};

	/**
	 * Rebuild widget on resize
	 */
	StatisticsWidget.prototype.addOnResizeListener = function () {
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

	return StatisticsWidget;
});