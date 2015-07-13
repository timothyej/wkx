module.exports = Point;

var util = require('util');

var Geometry = require('./geometry');
var Types = require('./types');
var BinaryWriter = require('./binarywriter');
var ZigZag = require('./zigzag.js');

function Point(x, y) {
    Geometry.call(this);

    this.x = x;
    this.y = y;
}

util.inherits(Point, Geometry);

Point._parseWkt = function (value, options) {
    var point = new Point();
    point.srid = options.srid;

    if (value.isMatch(['EMPTY']))
        return point;

    value.expectGroupStart();

    var coordinate = value.matchCoordinate();

    point.x = coordinate.x;
    point.y = coordinate.y;

    value.expectGroupEnd();

    return point;
};

Point._parseWkb = function (value, options) {
    var point = new Point(value.readDouble(), value.readDouble());
    point.srid = options.srid;
    return point;
};

Point._parseTwkb = function (value, options) {
    if (options.isEmpty)
        return new Point();

    var x = ZigZag.decode(value.readVarInt()) / options.precisionFactor;
    var y = ZigZag.decode(value.readVarInt()) / options.precisionFactor;

    return new Point(x, y);
};

Point._parseGeoJSON = function (value) {
    if (value.coordinates.length === 0)
        return new Point();

    return new Point(value.coordinates[0], value.coordinates[1]);
};

Point.prototype.toWkt = function () {
    if (typeof this.x === 'undefined' && typeof this.y === 'undefined')
        return Types.wkt.Point + ' EMPTY';

    return Types.wkt.Point + '(' + this.x + ' ' + this.y + ')';
};

Point.prototype.toWkb = function (asBigEndian) {
    var wkb = new BinaryWriter(this._getWkbSize(), false, asBigEndian);

    wkb.writeInt8(asBigEndian ? 0 : 1);

    if (typeof this.x === 'undefined' && typeof this.y === 'undefined') {
        wkb.writeUInt32(Types.wkb.MultiPoint);
        wkb.writeUInt32(0);
    }
    else {
        wkb.writeUInt32(Types.wkb.Point);
        wkb.writeDouble(this.x);
        wkb.writeDouble(this.y);
    }

    return wkb.buffer;
};

Point.prototype.toTwkb = function () {
    var twkb = new BinaryWriter(0, true);

    var precision = 5;
    var precisionFactor = Math.pow(10, precision);
    var isEmpty = typeof this.x === 'undefined' && typeof this.y === 'undefined';

    this._writeTwkbHeader(twkb, Types.wkb.Point, precision, isEmpty);

    if (!isEmpty) {
        twkb.writeVarInt(ZigZag.encode(this.x * precisionFactor));
        twkb.writeVarInt(ZigZag.encode(this.y * precisionFactor));
    }

    return twkb.buffer;
};

Point.prototype._getWkbSize = function () {
    if (typeof this.x === 'undefined' && typeof this.y === 'undefined')
        return 1 + 4 + 4;

    return 1 + 4 + 8 + 8;
};

Point.prototype.toGeoJSON = function (options) {
    var geoJSON = Geometry.prototype.toGeoJSON.call(this, options);
    geoJSON.type = Types.geoJSON.Point;

    if (typeof this.x === 'undefined' && typeof this.y === 'undefined')
        geoJSON.coordinates = [];
    else
        geoJSON.coordinates = [this.x, this.y];

    return geoJSON;
};
