define(['../../../config',
    '../../util/Logger',
    './Table',

    'jquery',
    'lodash'
], function (config,
             Logger,
             Table,

             $,
             _
){

    /**
     * Class representing html table
     * @constructor
     * @augments Table
     */
    var TableData = function(options){
        Table.apply(this, arguments);
    };

    TableData.prototype = Object.create(Table.prototype);

    /**
     * Redraw table
     */
    TableData.prototype.build = function(){
        this._target.append('<table class="' + this._class + ' ' + this._visibility  + '" id="' + this._id + '"></table>');
        this._table = this._target.find('#' + this._id);

        var columns = Object.keys(this._data[0]);

        // put attribute to second place in array
        if (columns[columns.length - 1] == "atribut"){
            columns.splice(1, 0, "atribut");
            columns = _.initial(columns);
        }

        this.redrawCaption(this._keywords, this._dataInfo);
        this.buildHeader(columns);
        this.redrawBody(columns, this._data);
    };

    /**
     * Redraw a caption of the table
     * @param keywords {Array}
     * @param dataInfo {Object} firstRecord and lastRecord order
     */
    TableData.prototype.redrawCaption = function(keywords, dataInfo){
        var caption = "Výsledky hledání pro: " + keywords.join(', ');
        var info = this.addDisplayedRecordsInfo(dataInfo.firstRecord, dataInfo.lastRecord, dataInfo.totalRecords);
        this._table.append('<caption><span>' + caption + '</span><span class="table-caption-right">' + info + '</span></caption>');
    };

    /**
     * Add column to table
     * @param column {string} name of column
     * @param columnData {string} column value
     * @returns {string} HTML code
     */
    TableData.prototype.addColumn = function(column, columnData){
        var klass = "";
        var text = this.checkPrefixes(columnData);

        if (column == "objekt"){
            klass = "object";
        } else if (column == "tabulka"){
            klass = "dataset";
        }

        return '<td class="' + klass + '" title="' + columnData + '" data-content="' + columnData + '">' + text.placeholder + text.value + '</td>';
    };

    return TableData;
});