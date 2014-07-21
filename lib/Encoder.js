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

var Dictionary = require('./Dictionary.js');
var bigint = require('bigint');

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
  
  // default encode object
  this._encodeObject(value);
};

Encoder.prototype._encodeBuffer = function _encodeBuffer(value) {
  // create and add a new buffer to represent the length and separator
  this.data.push(new Buffer(value.length + ':'));
  // add the actual data into the list
  this.data.push(value);
};

Encoder.prototype._encodeNumber = function _encodeNumeric(value) {
  
  if (value instanceof bigint) {
    this._encodeInteger(value);
    return;
  }
  
  if (isInteger(value)){
    this._encodeInteger(value);
    return;
  }
  // convert number to string
  var raw = value.toString();
  switch(this.options.floatMode) {
    case 'lossy':
      // parse as int, strips decimals
      var temp = parseInt(raw, 10);
      if (!this.options.supressWarnings) {
        console.warn(
          'WARNING: Bencoding only allows integers, converting ' + 
          raw.toString() + ' => ' + temp.toString());
      }
      // use _encodeInteger
      this._encodeInteger(temp);
      return;
    default:
      // store it as a string instead
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

Encoder.prototype._encodeObject = function _encodeObject(value) {
  this.data.push(DICT_BUFF);
  // sort the keys to ensure consistent output
  if (value.constructor === Dictionary) {
    Object.keys(value._content64).sort().forEach(function(key){
      var node = value._content64[key];
      if (node.value === undefined || node.value === null) { return; }
      this._encodeBuffer(node.key);
      this._encode(node.value);
    });
  } else {
     // forEach key
    Object.keys(value).sort().forEach(function(key, index){
      // skip undefined and null values
      var temp = value[key];
      if (temp === undefined || temp === null) { return; }
      this._encodeBuffer(new Buffer(key.toString()));
      this._encode(temp);
    },this);
  }
  this.data.push(END_BUFF);
};
