define(['../../../../error/ArgumentError',
        '../../../../util/histogram/Histogram',
        '../../../../util/Logger',
        '../../../../util/Slider',
        '../../../View',
        '../../../../util/viewUtils',

        'jquery',
        'string',

        'text!./SliderBox.html',
        'css!./SliderBox'
], function (ArgumentError,
             Histogram,
             Logger,
             Slider,
             View,
             viewUtils,

             $,
             S,

             htmlContent) {
    "use strict";

    /**
     * This class represents the row with the slider
     * @param options {Object}
     * @param options.data {JSON}
     * @param options.id {string} ID of the slider
     * @param options.name {string} slider label
     * @param options.target {Object} JQuery selector representing the target element where should be the slider rendered
     * @param options.range {Array} min and max value of the slider
     * @param options.values {Array} current slider values
     * @param options.isRange {boolean} true, if the slider should have two handles
     * @constructor
     */
    var SliderBox = function(options) {
        View.apply(this, arguments);

        if (!options.id){
            throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "SliderBox", "constructor", "missingBoxId"));
        }
        if (!options.name){
            throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "SliderBox", "constructor", "missingBoxName"));
        }
        if (!options.target){
            throw new ArgumentError(Logger.logMessage(Logger.LEVEL_SEVERE, "SliderBox", "constructor", "missingTarget"));
        }

        this._dataSet = options.data;
        this._id = options.id;
        this._name = options.name;
        this._target = options.target;

        this._range = options.range;
        this._values = options.values;
        this._isRange = options.isRange;

        this.build();
    };

    SliderBox.prototype = Object.create(View.prototype);

    /**
     * Build the SelectBox and add a listener to it
     */
    SliderBox.prototype.build = function (){
        var self = this;

        var html = S(htmlContent).template({
            id: this._id,
            name: this._name,
            labelMin: viewUtils.thousandSeparator(this._range[0]),
            labelMax: viewUtils.thousandSeparator(this._range[1])
        }).toString();

        this._target.append(html).ready(function(){
                self.buildSlider();
                self.histogram = self.buildHistogram();
                self.histogram.rebuild(self._dataSet);
                self.addSlideListeners(self._id, self._isRange);
        });
    };

    /**
     * It builds the slider
     * @returns {Slider}
     */
    SliderBox.prototype.buildSlider = function(){
        return new Slider({
            id: this._id,
            type: this._isRange,
            range: this._range,
            values: this._values
        });
    };

    /**
     * It builds the histogram
     * @returns {Histogram}
     */
    SliderBox.prototype.buildHistogram = function(){
        return new Histogram({
            id: this._id,
            numClasses: 30,
            minimum: this._range[0],
            maximum: this._range[1]
        });
    };

    /**
     * Add listener to slider and remove the old one
     * @param id {string}
     * @param isRange {boolean} true, if slider has two handles
     */
    SliderBox.prototype.addSlideListeners = function(id, isRange){
        var self = this;
        var selector = $("#" + id);
        selector.off('slidestop');
        selector.on('slidestop', function(e){
            if (isRange){
                self._values = $(this).slider("values");
            }
            else {
                var minVal = $(this).slider("option", "min");
                var currentVal = $(this).slider("value");
                self._values = [minVal, currentVal];
            }
        });

        selector.off('slide').on('slide', function(e){
            if (isRange){
                var values = $(this).slider("values");
                self.histogram.redrawColours(values);
            }
        })
    };

    /**
     * It returns the current values of slider handles
     * @returns {Array} current values of the handles
     */
    SliderBox.prototype.getValues = function(){
        return this._values;
    };

    return SliderBox;
});