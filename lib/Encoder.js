/*jshint node: true*/

// strict mode
'use strict';


/*\
|*|
|*|  :: Number.isInteger() polyfill ::
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
|*|
\*/
var isInteger = Number.isInteger || function isInteger (nVal) {
    return typeof nVal === "number" && 
      isFinite(nVal) && 
      nVal > -9007199254740992 && 
      nVal < 9007199254740992 &&
      Math.floor(nVal) === nVal;
  };



/**
 * A module which can Encode javascript objects into 
 * a bencoded buffer
 * @module
 * @author bruslim (https://github.com/bruslim)
 */

var INT_BUFF = new Buffer('i');
var LIST_BUFF = new Buffer('l');
var DICT_BUFF = new Buffer('d');
var END_BUFF = new Buffer('e');

var Encoder = module.exports = function Encoder(options) {
  // configure options
  this.options = options || {};
  this.options.floatMode = this.options.floatMode || "preserve";
  this.options.floatMode = this.options.floatMode.toLowerCase();
};

Encoder.encode = function encode(data, options) {
  var encoder = new Encoder(options);
  return encoder.encode(data);
};

Encoder.prototype.encode = function encode(value) {
  // setup empty data
  this.data = [];
  this._encode(value);
  return Buffer.concat(this.data);
};

Encoder.prototype._encode = function _encode(value) {
  
  // strings and buffers
  
  // if data is a buffer
  if (Buffer.isBuffer(value)) {
    this._encodeBuffer(value);
    // exit the function
    return;
  }
  
  // if data is an Array
  if(Array.isArray(value)) {
    this._encodeArray(value);
    return;
  }
  
  switch (typeof(value)) {
      case 'string':
        // convert to buffer, and use _encodeBuffer
        this._encodeBuffer(new Buffer(value));
        return;
      case 'number':
        this._encodeNumber(value);
        return;
  }
  
  this._encodeDictionary(value);
  return;
};

Encoder.prototype._encodeBuffer = function _encodeBuffer(value) {
  // create and add a new buffer to represent the length and separator
  this.data.push(new Buffer(value.length + ':'));
  // add the actual data into the list
  this.data.push(value);
};

Encoder.prototype._encodeNumber = function _encodeNumeric(value) {
  
  if (isInteger(value)){
    this._encodeInteger(value);
    return;
  }
  
  var raw = value.toString();
  switch(this.options.floatMode) {
    case 'lossy':
      var temp = parseInt(raw, 10);
      if (!this.options.supressWarnings) {
        console.warn(
          'WARNING: Bencoding only allows integers, converting ' + 
          raw.toString() + ' => ' + temp.toString());
      }
      this._encodeInteger(temp);
      return;
    default:
      this._encodeBuffer(new Buffer(raw));
      return;
  }
};

Encoder.prototype._encodeInteger = function _encodeInteger(value) {
  this.data.push(INT_BUFF);
  this.data.push(new Buffer(value.toString()));
  this.data.push(END_BUFF);
};

Encoder.prototype._encodeArray = function _encodeArray(value) {
  this.data.push(LIST_BUFF);
  value.forEach(function(item, index){
    this._encode(item);
  },this);
  this.data.push(END_BUFF);
};

Encoder.prototype._encodeDictionary = function _encodeDictionary(value) {
  this.data.push(DICT_BUFF);
  // sort the keys to ensure consistent output
  var keys = Object.keys(value).sort();
  // forEach key
  keys.forEach(function(key, index){
    this._encodeBuffer(new Buffer(key.toString()));
    this._encode(value[key]);
  },this);
  this.data.push(END_BUFF);
};