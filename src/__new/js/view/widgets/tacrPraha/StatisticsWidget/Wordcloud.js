define([
    'jquery',
    'wordcloud2'
], function ($,
             wordcloud2){

    /**
     * Class representing word cloud
     * @params options {Object}
     * @params options.data {Array} keywords and theirs frequencies
     * @params options.max {number} max frequency
     * @params options.targetId {string} id of target element
     * @params options.searching {Searching}
     * @constructor
     */
    var Wordcloud = function(options){
        this._data = options.data;
        this._max = options.max;
        this._targetId = options.targetId;
        this._searching = options.searching;

        this.build();
    };

    /**
     * Build a world cloud
     */
    Wordcloud.prototype.build = function(){
        wordcloud2.WordCloud(document.getElementById(this._targetId), {
            list: this._data,
            gridSize: 10,
            weightFactor: 120/this._max,
            backgroundColor: 'transparent',
            color: this.setColour.bind(this),
            rotateRatio: 0,
            minSize: 8,
            hover: this.onWordHover.bind(this),
            click: this.onWordClick.bind(this)
        });
    };

    /**
     * Set word colour
     * @param word
     * @param weight {number} frequency
     * @returns {string} HEX code of colour
     */
    Wordcloud.prototype.setColour = function(word, weight){
        var diff = this._max/5;
        var col = "#EC6F77";
        if (weight < (this._max - 4*diff)){
            col = "#F6B7BB";
        } else if (weight < (this._max - 3*diff)){
            col = "#F3A5AA";
        } else if (weight < (this._max - 2*diff)){
            col = "#F19399";
        } else if (weight < (this._max - diff)){
            col = "#EE7E86";
        }
        return col;
    };

    /**
     * Trigger a hover effect
     * @param item {Array} word and its weight
     * @param dimension
     * @param event
     */
    Wordcloud.prototype.onWordHover = function(item, dimension, event){
        var box = $("#" + this._targetId).siblings(".word-cloud-box");
        if (!dimension) {
            box.css("display", "none");
            return;
        }
        box.css("display", "block");
        box.css({
            left: (dimension.x - 5) + 'px',
            top: (dimension.y - 5) + 'px',
            width: (dimension.w + 5) + 'px',
            height: (dimension.h + 5) + 'px'
        });
    };

    /**
     * Perform searching of a chosen word
     * @param item {Array} word and its weight
     * @param dimension
     * @param event
     */
    Wordcloud.prototype.onWordClick = function(item, dimension, event){
        $("#searching-terms-form-input").val(item[0]);
        $("#searching-tab").trigger( "click" );
        this._searching.searchTerms(event);
    };

    return Wordcloud;
});