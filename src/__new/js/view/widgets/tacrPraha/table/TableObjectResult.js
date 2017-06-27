define(['../../../../util/Logger',
    './Table',

    'jquery',
    'lodash'
], function (Logger,
             Table,

             $,
             _
){

    /**
     * Class representing html table
     * @constructor
     * @augments Table
     */
    var TableObjectResult = function(options){
        Table.apply(this, arguments);
    };

    TableObjectResult.prototype = Object.create(Table.prototype);

    /**
     * Redraw table
     */
    TableObjectResult.prototype.build = function(){
        this._target.append('<table class="' + this._class + ' ' + this._visibility  + '" id="' + this._id + '"></table>');
        this._table = this._target.find('#' + this._id);

        var c = Object.keys(this._data[0]);
        var orderedColumns = [c[2],c[1],c[0]];

        this.redrawCaption(this._keywords, this._dataInfo);
        this.buildHeader(orderedColumns);
        this.redrawBody(orderedColumns, this._data);
    };

    /**
     * Redraw a caption of the table
     * @param keywords {Array}
     * @param dataInfo {Object} firstRecord and lastRecord order
     */
    TableObjectResult.prototype.redrawCaption = function(keywords, dataInfo){
        var caption = "Výsledky hledání pro: " + keywords.join(', ');
        var info = this.addDisplayedRecordsInfo(dataInfo.firstRecord, dataInfo.lastRecord, dataInfo.totalRecords);
        this._table.append('<caption><span>' + caption + '</span><span class="table-caption-right">' + info + '</span></caption>');
    };

    /**
     * Add table row
     * @param columns {Array} list of columns
     * @param rowData {Object}
     * @returns {string} HTML code
     */
    TableObjectResult.prototype.addRow = function(columns, rowData){
        var content = '<tr class="data">';
        var self = this;
        var geometry = false;
        columns.forEach(function(column){
            content += self.addColumn(column, rowData[column], geometry);
            geometry = _.includes(rowData[column], "wkt_geometry");
        });
        content += '</tr>';
        return content;
    };

    /**
     * Add column to table
     * @param column {string} name of column
     * @param columnData {string} column value
     * @param isGeom {boolean} detect if column contains WKT geometry
     * @returns {string} HTML code
     */
    TableObjectResult.prototype.addColumn = function(column, columnData, isGeom){
        var klass = "";
        var text = this.checkPrefixes(columnData);

        if (column == "hodnota"){
            klass = "overflow";
        }
        if (isGeom){
            klass += " geometry";
        }

        return '<td class="' + klass + '" title="' + columnData + '" data-content="' + columnData + '">' + text.placeholder + text.value + '</td>';
    };

    return TableObjectResult;
});