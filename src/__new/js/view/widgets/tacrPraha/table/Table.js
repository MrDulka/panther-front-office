define(['../../../config',
        '../../util/Logger',

    'jquery',
    'lodash'
], function (config,
             Logger,
             $,
             _
){

    /**
     * Basic class for building HTML table
     * @param options {Object}
     * @param options.target {Object}
     * @param options.id {string} id of the table
     * @param options.visibility {string} visible or hidden
     * @param options.class {string} name of table class
     * @param options.data {Array} records to show
     * @param options.dataInfo {Object} totalRecords; firstRecord and lastRecord order
     * @param options.keywords {Array} searching keywords
     * @constructor
     */
    var Table = function(options){
        if (!options.target){
            throw new Error(Logger.logMessage(Logger.LEVEL_SEVERE, "TableTerms", "constructor", "missingTarget"));
        }

        this._target = options.target;
        this._id = options.id;
        this._class = options.class;
        this._data = options.data;
        this._dataInfo = options.dataInfo;
        this._keywords = options.keywords;
        this._visibility = options.visibility ;

        this.build();
    };

    /**
     * This is hook which is intended to be overridden in the descendants.
     */
    Table.prototype.build = function(){

    };

    /**
     * Generate info about currently displayed records
     * @param first {number} first record in currently displayed table
     * @param last {number} last record in currently displayed table
     * @param total {number} total number of records
     * @returns {string} info message
     */
    Table.prototype.addDisplayedRecordsInfo = function(first, last, total){
        var info = "Zobrazeny záznamy " + first + " - " + last + " z " + total;
        if (total == 1){
            info = "Zobrazen 1 záznam z 1";
        }
        return info;
    };

    /**
     * Build table header
     * @param columns {Array} list of columns
     * @returns {string} html content
     */
    Table.prototype.buildHeader = function(columns){
        var content = '<tr class="header">';
        columns.forEach(function(column){
            content += '<th>' + column + '</th>';
        });
        content += '</tr>';

        this._table.append(content);
    };

    /**
     * Redraw table content
     * @param columns {Array}
     * @param data {Array}
     */
    Table.prototype.redrawBody = function(columns, data){
        var content = '';
        var self = this;
        data.forEach(function(row){
            content += self.addRow(columns, row)
        });
        if (data.length < 10){
            for (var i = data.length; i < 10; i++){
                content += this.addEmptyRow(columns);
            }
        }

        this._table.append(content);
        this.addUriPrefixOnClickListener();
    };

    /**
     * Add table row
     * @param columns {Array} list of columns
     * @param rowData {Object}
     * @returns {string} HTML code
     */
    Table.prototype.addRow = function(columns, rowData){
        var content = '<tr class="data">';
        var self = this;
        columns.forEach(function(column){
            content += self.addColumn(column, rowData[column]);
        });
        content += '</tr>';
        return content;
    };

    /**
     * Add empty row to the table
     * @param columns {Array} list of columns
     * @returns {string} HTML code
     */
    Table.prototype.addEmptyRow = function(columns){
        var content = '<tr>';
        columns.forEach(function(column){
            content += '<td></td>';
        });
        content += '</tr>';
        return content;
    };

    /**
     * Cut long URI's prefixes and replace them with placeholder
     * @param text {string} column value
     * @returns {{placeholder: string, value: string}}
     */
    Table.prototype.checkPrefixes = function(text){
        var prefix = config.sparqlEndpoint;
        var dsPrefix = config.datasetVocab;
        var pre = "";

        if (_.includes(text, dsPrefix)){
            text = text.replace(dsPrefix, "/");
            pre = '<span class="uri-prefix" data-content="' + dsPrefix.slice(0, -1) + '">...</span>';
        } else if (_.includes(text, prefix)){
            text = text.replace(prefix, "/");
            pre = '<span class="uri-prefix" data-content="' + prefix.slice(0, -1) + '">...</span>';
        }

        return {
            placeholder: pre,
            value: text
        }
    };

    /**
     * Add on click listener to table cell value prefix.
     */
    Table.prototype.addUriPrefixOnClickListener = function(){
        this._table.find("tr td span").off("click").on("click", function(){
            var prefix = $(this);
            if (!prefix.hasClass("full")){
                prefix.addClass("full");
                prefix.html(prefix.attr('data-content'));
            } else {
                prefix.removeClass("full");
                prefix.html("...")
            }
        });
    };

    return Table;
});