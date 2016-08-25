define([
    '../../../error/ArgumentError',
    '../../../error/NotFoundError',
    '../inputs/checkbox/Checkbox',
    '../../../util/Logger',
	'../../../util/Remote',
    '../inputs/selectbox/SelectBox',
    '../tools/settings/Settings',
    '../inputs/sliderbox/SliderBox',
	'../../../stores/Stores',
    '../Widget',

    'jquery',

    'css!./EvaluationWidget'
], function(ArgumentError,
            NotFoundError,
            Checkbox,
            Logger,
			Remote,
            SelectBox,
            Settings,
            SliderBox,
			Stores,
            Widget,

            $){

    /**
     * It creates an Evaluation Tool
     * @param options {Object}
     * @param options.elementId {String} ID of widget
     * @param options.targetId {String} ID of an element in which should be the widget rendered
     * @param options.name {String} Name of the widget
     * @param options.tools {Array} List of tools which should be connected with this widget
     * @constructor
     */
    var EvaluationWidget = function(options) {
        Widget.apply(this, arguments);

        if (!options.elementId){
            throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "EvaluationWidget", "constructor", "missingElementId"));
        }
        if (!options.targetId){
            throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "EvaluationWidget", "constructor", "missingTargetElementId"));
        }

        this._name = options.name || "";
        this._widgetId = options.elementId;
        this._target = $("#" + options.targetId);
        if (this._target.length == 0){
            throw new NotFoundError(Logger.logMessage(Logger.LEVEL_SEVERE, "EvaluationWidget", "constructor", "missingHTMLElement"));
        }

        // Call the method from parent
        Widget.prototype.build.call(this, this._widgetId, this._target, this._name);

        this._widgetSelector = $("#floater-" + this._widgetId);
        this._widgetBodySelector = this._widgetSelector.find(".floater-body");

        this._attributesMetadata = options.attributesMetadata;
        this._settings = null;

        this.build();
        Observer.addListener(this.rebuild.bind(this));
    };

    EvaluationWidget.prototype = Object.create(Widget.prototype);

	/**
     * It rebuilds the widget for given attributes
     */
    EvaluationWidget.prototype.rebuild = function(){
        var self = this;
        this._attributesMetadata.getData().then(function(result){
            self._attributes = [];
            result.forEach(function(attrSet){
               attrSet.forEach(function(attribute){
                   var attrMetadata = JSON.parse(attribute);
                   self._attributes.push(attrMetadata.data[0]);
               });
            });
            self.rebuildSettings();
        });
    };

    /**
     * Build the widget basic view
     */
    EvaluationWidget.prototype.build = function(){
        this.buildSettings();
        this.prepareFooter();
    };

	/**
     * Create settings icon and attach the listener for opening
     */
    EvaluationWidget.prototype.buildSettings = function(){
        var tool = "settings";
        var name = "Settings";
        this._widgetSelector.find(".floater-tools-container").append('<div title="'+ name +'" class="floater-tool widget-'+ tool +'">' +
            '<img alt="' + name + '" src="__new/img/'+ tool +'.png"/>' +
            '</div>');
        this.addSettingsListener();
    };

	/**
     * Rebuild settings with given attributes, create categories and rebuild the inputs
     */
    EvaluationWidget.prototype.rebuildSettings = function(){
        this._settings = new Settings({
            attributes: this._attributes,
            target: this._target,
            widgetId: this._widgetId
        });
        this._categories = this._settings.getCategories();
        this.rebuildInputs(this._categories);

        this._settingsConfirm = this._settings.getConfirmButton();
        this.addSettingsChangeListener(this._settingsConfirm);
    };


	/**
     * It prepares all the inputs for data filtering
     * @param categories {Object} data about categories
     */
    EvaluationWidget.prototype.rebuildInputs = function(categories){
        this._widgetBodySelector.html('');
        this._inputs = {
            checkboxes: [],
            sliders: [],
            selects: []
        };

        var self = this;
        for (var key in categories){
            if (categories.hasOwnProperty(key) && categories[key].active == true){
                var input = categories[key].input;
                var name = categories[key].name;
                var id = "attr-" + categories[key].attrData._id;
                if (input == "slider") {
                    var thresholds = [categories[key].attrData.minValue, categories[key].attrData.maxValue];
                    var slider = self.buildSliderInput(id, name, thresholds);
                    this._inputs.sliders.push(slider);
                }

                // todo modify other inputs as well
                //else if (input == "checkbox"){
                //    var checkbox = this.buildCheckboxInput(key, name);
                //    this._inputs.checkboxes.push(checkbox);
                //}

                //else if (input == "select") {
                //    var options = this._filter.getUniqueValues(this._dataSet, key);
                //    var select = this.buildSelectInput(key, name, options);
                //    this._inputs.selects.push(select);
                //}
            }
        }

        this.filter();
        this.addSliderListener();
        this.addInputsListener();
    };

    /**
     * It returns the checkbox
     * @param id {string} ID of the data theme
     * @param name {string} Name of the data theme
     * @returns {Checkbox}
     */
    EvaluationWidget.prototype.buildCheckboxInput = function(id, name){
        return new Checkbox({
            id: id,
            name: name,
            target: this._widgetBodySelector,
            containerId: "floater-" + this._widgetId
        });
    };

    /**
     * It returns the box with select input
     * @param id {string} ID of the data theme
     * @param name {string} Name of the data theme
     * @param options {Array} Select options
     * @returns {SelectBox}
     */
    EvaluationWidget.prototype.buildSelectInput = function(id, name, options){
        return new SelectBox({
            id: id,
            name: name,
            target: this._widgetBodySelector,
            data: options
        });
    };

    /**
     * It returns the slider box
     * @param id {string} ID of the data theme
     * @param name {string} Name of the data theme
     * @param thresholds {Array} Start and end value of the slider
     * @returns {SliderBox}
     */
    EvaluationWidget.prototype.buildSliderInput = function(id, name, thresholds){
        return new SliderBox({
            attributes: this._attributes,
            id: id,
            name: name,
            target: this._widgetBodySelector,
            range: thresholds,
            values: thresholds,
            isRange: true
        });
    };

    /**
     * It builds the footer button
     */
    EvaluationWidget.prototype.prepareFooter = function (){
        this._widgetSelector.find(".floater-footer").append(
            '<div class="widget-button" id="evaluation-confirm"></div>'
        );
    };

    /**
     * Filter data and redraw the footer button
     */
    EvaluationWidget.prototype.filter = function(){
        var place = this._attributesMetadata.getPlace();
        var level = JSON.parse(ThemeYearConfParams.level);
        var areas = this._attributesMetadata.levels.getAreas(level);
        var placeF = {};
        var levelF = {};
        levelF[level] = areas;
        placeF[place] = levelF;
        var areasReady = JSON.stringify(placeF);

        var dataset = ThemeYearConfParams.dataset;
        var years = ThemeYearConfParams.years;

        var attrs = [];
        var filters = [];
        this._attributes.forEach(function(attribute){
            var sliderEl = $("#attr-" + attribute._id);
            var min, max;

            if (sliderEl.hasClass("ui-slider")){
                var values = sliderEl.slider("values");
                min = values[0];
                max = values[1];
            } else {
                min = attribute.minValue;
                max = attribute.maxValue;
            }

            var filter = {
                attr: attribute._id,
                as: attribute.attrSet,
                minOrig: attribute.minValue,
                maxOrig: attribute.maxValue,
                min: min,
                max: max
            };
            var attr = {
                attr: attribute._id,
                as: attribute.attrSet
            };
            filters.push(filter);
            attrs.push(attr);
        });

        return new Remote({
            method: "POST",
            url: window.Config.url + "api/filter/filter",
            params: {
                dataset: dataset,
                years: years,
                filters: JSON.stringify(filters),
                attrs: JSON.stringify(attrs),
                areas: areasReady,
                requireData: 1
            }
        }).then(function(response){
            console.log(response);
        });
    };

    /**
     * It rebuilds hints in selectmenus and histograms in slider popups
     * @param data {JSON} filtered data
     */
    EvaluationWidget.prototype.rebuildHints = function(data){
        var self = this;
        this._inputs.sliders.forEach(function(slider){
            slider.histogram.rebuild(data);
        });

        this._inputs.selects.forEach(function(select){
            var inputs = $.extend(true, {}, self._inputs);
            inputs.selects.forEach(function(item, index){
                if (item._id == select._id){
                    inputs.selects.splice(index, 1);
                }
            });
            var filteredData = self._filter.filter(self._dataSet, inputs);
            if (inputs.checkboxes.length == 0 && inputs.sliders.length == 0 && inputs.selects.length == 0){
                filteredData = self._dataSet;
            }
            select.addSelectOpenListener(filteredData, select._id);

        });
    };

    /**
     * It adds onclick listener to settings tool
     */
    EvaluationWidget.prototype.addSettingsListener = function() {
        var self = this;
        var tool = "settings";
        $('#floater-' + self._widgetId + ' .widget-' + tool).on("click", function(){
            $('#' + self._widgetId + '-' + tool).show("drop", {direction: "up"}, 200)
                .addClass('open');
        });
    };

    /**
     * It adds the onclick listener to the tool dialog window
     * @param button {Object} JQuery object representing dailog confirm button
     */
    EvaluationWidget.prototype.addSettingsChangeListener = function(button){
        var self = this;
        button.on("click",function(){
            self._categories = self._settings.getCategories();
            self.rebuildInputs(self._categories);
        })
    };

    /**
     * It adds change listeners to inputs in widget body. Each time some change occurs, filter function is executed
     */
    EvaluationWidget.prototype.addInputsListener = function(){
        var self = this;
        //this._widgetSelector.find(".selectmenu" ).off("selectmenuselect").on( "selectmenuselect", self.filter.bind(self));
        this._widgetSelector.find(".slider-row").off("slidechange").on("slidechange", self.filter.bind(self));
        //this._widgetSelector.find(".checkbox-row").off("click.inputs").on( "click.inputs", self.filter.bind(self));
    };

    /**
     * It adds listener to all sliders for positioning of slider popups
     */
    EvaluationWidget.prototype.addSliderListener = function(){
        // todo do it better
        var isFirefox = typeof InstallTrigger !== 'undefined';
        if (!isFirefox){
            var popup = $('.slider-popup');
            var margin = popup.css("margin-top");
            this._widgetBodySelector.off("scroll").on("scroll",function(e){
                popup.css("margin-top",(margin.slice(0,-2) - e.target.scrollTop)+"px");
            });
        }
    };

    return EvaluationWidget;
});