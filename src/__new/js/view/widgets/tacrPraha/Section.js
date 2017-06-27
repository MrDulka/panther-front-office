define([
    '../../../util/Logger',
    './table/Pagination',
    'jquery',
    'string'
], function (Logger,
             Pagination,
             $,
             S){

    /**
     * Basic class for section
     * @constructor
     */
    var Section = function(){
    };

    /**
     * Build basic structure of section
     * @param content {string} html content
     * @param params {Object}
     */
    Section.prototype.buildBasicStructure = function(content, params){
        var html = S(content).template(params).toString();
        this._target.prepend(html);
    };

    /**
     * Hide whole section
     */
    Section.prototype.hideSection = function(){
        this._section.css("display", "none");
    };

    /**
     * Show/hide section title and description
     * @param value {string} CSS display property value
     */
    Section.prototype.handleTitle = function(value){
        this._target.find('.instructions').css("display", value);
    };

    /**
     * Update section title
     * @param term {string}
     */
    Section.prototype.rebuildTitle = function(term){
        var title = this._target.find('.section-title');
        title.find("i").remove();
        var oldText = title.html();
        title.html(oldText + ' <i>(' + term + ')</i>');
    };

    /**
     * Show/hide section results overlay
     * @param value {string} CSS display property value
     */
    Section.prototype.overlay = function(value){
        this._target.find('.results-overlay').css("display", value);
    };

    /**
     * It builds the container for pagination
     * @returns {Pagination}
     */
    Section.prototype.buildPagination = function(){
        return new Pagination({
            targetId: this._targetId
        });
    };

    /**
     * @returns {Pagination}
     */
    Section.prototype.getPagination = function(){
        return this._pagination;
    };

    /**
     * Build the tables with results
     * @param target {Object}
     * @param keywords {Array}
     * @param data {Array} records
     */
    Section.prototype.buildTables = function(target, keywords, data){
        var rowsInTable = 10;
        var numOfRecords = data.length;
        var numOfTables = Math.ceil(data.length/rowsInTable);
        var tableClass = this._targetId + "-table";

        if (numOfTables == 0){
            target.html("<table><tr class='error'><td class='error'>Nebyla nalezena žádná data pro klíčová slova: <i>" + keywords + "</i>. Zkuste změnit nastavení a hledat znovu.</td></tr></table>");
            return;
        } else {
            this.handleTitle("block");
        }
        if (numOfTables > 1){
            this._pagination.activate(tableClass, numOfTables);
        }

        for (var i = 0; i < numOfTables; i++){
            var firstRecord = i*rowsInTable;
            var lastRecord = i*rowsInTable + rowsInTable;
            if (lastRecord > numOfRecords){
                lastRecord = numOfRecords;
            }
            var visibility = "hidden";
            if (i == 0){
                visibility = "visible"
            }

            var dataset = data.slice(firstRecord, lastRecord);
            var id = tableClass + "-" + (i + 1);

            var dataInfo = {
                firstRecord: firstRecord + 1,
                lastRecord: lastRecord,
                totalRecords: numOfRecords
            };

            this.buildTable(target, id, tableClass, keywords, visibility, dataset, dataInfo);
        }
    };

    /**
     * This is hook which is intended to be overridden in the descendants.
     */
    Section.prototype.buildTable = function(target, id, tableClass, keywords, visibility, dataset, dataInfo){
    };

    return Section;
});