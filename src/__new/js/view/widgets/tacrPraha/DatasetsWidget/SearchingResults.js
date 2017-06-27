define([
    '../../../../util/Logger',
    '../Section',
    '../table/TableTermsResults',

    'jquery',
    'string',
    'text!./searchingResults.html'
], function (Logger,
             Section,
             TableTermsResults,

             $,
             S,
             searchingResults){

    /**
     * Class representing searching results section
     * @param options {Object}
     * @param options.targetId {string} id of target element
     * @constructor
     */
    var SearchingResults = function(options){
        Section.apply(this, arguments);

        if (!options.targetId){
            throw new Error(Logger.logMessage(Logger.LEVEL_SEVERE, "SearchingResults", "constructor", "missingTargetId"));
        }

        this._targetId = options.targetId;
        this._section = $('#' + this._targetId);
        this._target = $('#' + this._targetId + " > div");

        if (this._target.length == 0){
            throw new Error(Logger.logMessage(Logger.LEVEL_SEVERE, "SearchingForm", "constructor", "missingTarget"));
        }

        this.build();
    };

    SearchingResults.prototype = Object.create(Section.prototype);

    /**
     * Build searching terms results section
     */
    SearchingResults.prototype.build = function(){
        this.buildBasicStructure(searchingResults);
        this._pagination = this.buildPagination();
    };

    /**
     * Rebuild table with results
     * @param data {Object}
     */
    SearchingResults.prototype.rebuild = function(data){
        this._pagination.destroy();
        this._section.css("display", "block");
        var target = this._target.find(".results-tables");
        target.html('');
        this.handleTitle("none");

        if (data.status == "OK"){
            if (data.hasOwnProperty('message')){
                target.html("<table><tr class='error'><td class='error'>Chyba při vyhledávání: " + data.message + "</td></tr></table>");
            } else {
                this.buildTables(target, data.keywords, data.data);
            }
        } else {
            target.html("<table><tr class='error'><td class='error'>Chyba při vyhledávání: " + data.message + "</td></tr></table>");
        }
    };

    /**
     * Build a table
     * @param target {Object} Jquery object for rendering table
     * @param id {string} id
     * @param tableClass {string} class name
     * @param keywords {Array} list of searching keywords
     * @param visibility {string} visible or hidden
     * @param dataset {Array} list of records
     * @param dataInfo {Object} totalRecords; firstRecord and lastRecord order
     * @returns {TableTerms}
     */
    SearchingResults.prototype.buildTable = function(target, id, tableClass, keywords, visibility, dataset, dataInfo){
        return new TableTermsResults({
            target: target,
            id: id,
            class: tableClass,
            keywords: keywords,
            visibility: visibility,
            data: dataset,
            dataInfo: dataInfo
        });
    };

    return SearchingResults;
});
