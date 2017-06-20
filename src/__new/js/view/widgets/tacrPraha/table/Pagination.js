define([
    '../../util/Logger',
    'string',
    'text!./pagination.html',

    'jquery',
    'jquery-pagination'
], function (Logger,
             S,
             pagination,
             $){

    /**
     * Class for pagination of table
     * @param options {Object}
     * @constructor
     */
    var Pagination = function(options){
        if (!options.targetId){
            throw new Error(Logger.logMessage(Logger.LEVEL_SEVERE, "Pagination", "constructor", "missingTargetId"));
        }

        this._targetId = options.targetId;
        this._target = $('#' + this._targetId + " > div");
        this._id = this._targetId + "-pagination";

        if (this._target.length == 0){
            throw new Error(Logger.logMessage(Logger.LEVEL_SEVERE, "Pagination", "constructor", "missingTarget"));
        }

        this.build();
    };

    /**
     * Build the pagination container
     */
    Pagination.prototype.build = function(){
        var html = S(pagination).template({
            id: this._id
        }).toString();
        this._target.find(".pagination").append(html);
        this._pagination = $('#' + this._id + '-list');
    };

    /**
     * Activate pagination functionality
     * @param tableClass {string} name of connected table class
     * @param numOfPages {number} number of available pages
     */
    Pagination.prototype.activate = function(tableClass, numOfPages){
        this._pagination.css("display", "block");
        this._pagination.twbsPagination({
            first: "<<",
            last: ">>",
            next: ">",
            prev: "<",
            totalPages: numOfPages,
            visiblePages: 5,
            onPageClick: function (event, page) {
                $("." + tableClass).hide();
                $("#" + tableClass + "-" + page).show();
            }
        });
    };

    /**
     * Destroy the pagination functionality
     */
    Pagination.prototype.destroy = function(){
        this._pagination.twbsPagination('destroy');
        this._pagination.css("display", "none");
    };

    return Pagination;
});