const { Transform } = require('stream');

class TransformStream extends Transform {
    constructor() {
        super();
    }

    _transform(chunk, encoding, callback) {
        this.push(JSON.stringify(chunk) + ',');
        callback();
    }

    _flush() {
        this.unshift('[');
        this.push(']');
        callback();
    }
}

module.exports = TransformStream;