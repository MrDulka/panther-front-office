define([
	'jquery'
], function (
	$
) {
	"use strict";

	var CustomLayers = function() {
		this._target = $('#custom-layers');
		this._target.on('click.customLayers', '.ptr-btn', this.handleClick.bind(this));
		this.build();
	};


	CustomLayers.prototype.build = function(){

		this._target.empty();

		this._target.append(
			'<div id="custom-layers-container">' +
				'<div class="custom-layers-content" id="custom-layers-start">' +
					'<div>' +
						'<div class="ptr-btn primary" id="custom-layers-file-btn">Load from file…</div>' +
						'<div class="ptr-btn disabled" id="custom-layers-wms-btn">Connect to WMS…</div>' +
					'</div>' +
				'</div>' +
				'<div class="custom-layers-content" id="custom-layers-action">' +
				'</div>' +
			'</div>'
		);

		this._container = this._target.find('#custom-layers-container');

	};

	CustomLayers.prototype.handleClick = function(e) {
		// todo button & modifiers check
		var targetId = e.target.getAttribute('id');
		switch (targetId) {
			case 'custom-layers-file-btn':
				this.buildFileForm();
				this.view('action');
				break;
			case 'custom-layers-file-cancel-btn':
				this.clearAction();
				this.view();
				break;
			case 'custom-layers-file-load-btn':
				this.loadFile();
				break;
			default:
				console.log('CustomLayers#handleClick' + targetId);
		}
	};

	CustomLayers.prototype.clearAction = function() {
		this._target.find('#custom-layers-action').empty();
		this._action = null;
	};

	CustomLayers.prototype.buildFileForm = function() {
		if (this._action != 'file') {
			this.clearAction();
			this._action = 'file';
			var target = this._target.find('#custom-layers-action');
			target.append(
				'<label class="container">' +
					'File' +
					'<input type="file" id="custom-layers-file-file" />' +
				'</label>' +
				'<label class="container">' +
					'Layer name' +
					'<input type="text" id="custom-layers-file-name" />' +
				'</label>' +
				'<div class="ptr-btn-group">' +
					'<div class="ptr-btn primary" id="custom-layers-file-load-btn">Load</div>' +
					'<div class="ptr-btn" id="custom-layers-file-cancel-btn">Cancel</div>' +
				'</div>'
			);
		}
	};

	CustomLayers.prototype.view = function(view) {
		this._container.removeClass('view-action');
		if (view) this._container.addClass('view-' + view);
	};



	CustomLayers.prototype.loadFile = function() {
		var fileInput = this._container.find('#custom-layers-file-file')[0];
		var file = fileInput.files[0];
		var name = this._container.find('#custom-layers-file-name')[0].value;
		console.log('loadFile', file.name, name);
		var url = Config.url + '/rest/layerImporter/import';
		var payload = {
			file: file,
			scope: ThemeYearConfParams.dataset,
			theme: ThemeYearConfParams.theme,
			name: name
		};
		$.post(url, payload)
			.done(function(data) {
				console.log(data);
			});

	};




	return CustomLayers;
});

