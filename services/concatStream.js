var Readable = require('stream').Readable
var util = require('util');

function ConcatStream(){
  Readable.call(this);
  this.streams = [];
}

util.inherits(ConcatStream, Readable);

ConcatStream.prototype.append = function(stream){
  this.streams.push(stream);
  stream.on('end', this.onEnd.bind(this));
  stream.on('error', this.onError.bind(this));
}

ConcatStream.prototype._read = function(size){
  var stream = this.streams[0];
  stream.on('readable', function(){
    var content;
    while((content = stream.read(size)) != null){
      this.push(content);
    }
  }.bind(this));
};

ConcatStream.prototype.onEnd = function() {
  this.streams[0].removeAllListeners('end');
  this.streams.shift();
  if(this.streams.length == 0){
    this.push(null);
  }
  else{
    // You can uncomment this if you want to know when a new stream is being read
    // this.emit('next');
    this._read();
  }
};

ConcatStream.prototype.onError = function(e){
  this.emit('error', e);
  this.onEnd();
}

module.exports = ConcatStream;

//https://gist.github.com/JbIPS/60864ca74d4895ae42ca02ef1bdbe664