module.exports = BinaryWriter;

function BinaryWriter(size, allowResize, asBigEndian) {
    this.buffer = new Buffer(size);
    this.position = 0;
    this.allowResize = allowResize;
    this.asBigEndian = asBigEndian || false;
}

function _write(writeLE, writeBE, size) {
    return function (value) {
        this.ensureSize(size);

        if (this.asBigEndian)
            writeBE.call(this.buffer, value, this.position);
        else
            writeLE.call(this.buffer, value, this.position);

        this.position += size;
    };
}

BinaryWriter.prototype.writeUInt8 = _write(Buffer.prototype.writeUInt8, Buffer.prototype.writeUInt8, 1);
BinaryWriter.prototype.writeUInt16 = _write(Buffer.prototype.writeUInt16LE, Buffer.prototype.writeUInt16BE, 2);
BinaryWriter.prototype.writeUInt32 = _write(Buffer.prototype.writeUInt32LE, Buffer.prototype.writeUInt32BE, 4);
BinaryWriter.prototype.writeInt8 = _write(Buffer.prototype.writeInt8, Buffer.prototype.writeInt8, 1);
BinaryWriter.prototype.writeInt16 = _write(Buffer.prototype.writeInt16LE, Buffer.prototype.writeInt16BE, 2);
BinaryWriter.prototype.writeInt32 = _write(Buffer.prototype.writeInt32LE, Buffer.prototype.writeInt32BE, 4);
BinaryWriter.prototype.writeFloat = _write(Buffer.prototype.writeFloatLE, Buffer.prototype.writeFloatBE, 4);
BinaryWriter.prototype.writeDouble = _write(Buffer.prototype.writeDoubleLE, Buffer.prototype.writeDoubleBE, 8);

BinaryWriter.prototype.writeBuffer = function (buffer) {
    this.ensureSize(buffer.length);

    buffer.copy(this.buffer, this.position, 0, buffer.length);
    this.position += buffer.length;
};

BinaryWriter.prototype.writeVarInt = function (value) {
    var length = 1;

    while ((value & 0xFFFFFF80) !== 0) {
        this.writeUInt8((value & 0x7F) | 0x80);
        value >>>= 7;
        length++;
    }

    this.writeUInt8(value & 0x7F);

    return length;
};

BinaryWriter.prototype.ensureSize = function (size) {
    if (this.buffer.length < this.position + size) {
        if (this.allowResize) {
            var tempBuffer = new Buffer(this.position + size);
            this.buffer.copy(tempBuffer, 0, 0, this.buffer.length);
            this.buffer = tempBuffer;
        }
        else {
            throw new RangeError('index out of range');
        }
    }
};
