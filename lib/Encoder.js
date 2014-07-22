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

/**
 * Creates a new Encoder with the given set of options
 * @constructor
 * @param [options] {Object} - options object
 * @param [options.floatMode] {String} - default to "preserve"
 */
var Encoder = module.exports = function Encoder(options) {
  // configure options
  this.options = options || {};
  this.options.floatMode = this.options.floatMode || "preserve";
  this.options.floatMode = this.options.floatMode.toLowerCase();
};

/**
 * Encodes the given data
 * @param data {Object|Array|Dictonary|Buffer|Number} - data to encode
 * @param [options] {Object} - options object
 * @return {Buffer} - bencoded data
 */
Encoder.encode = function encode(data, options) {
  var encoder = new Encoder(options);
  return encoder.encode(data);
};

/**
 * Encodes the given value
 * @param value {Object|Array|Dictonary|Buffer|Number} - value to encode
 * @returns {Buffer} - bencoded data
 */
Encoder.prototype.encode = function encode(value) {
  // setup empty data
  this.data = [];
  // call recursive _encode function
  this._encode(value);
  // return the data, by concating the array of buffers
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
  
  // if data is a bigint
  if(value instanceof bigint) {
    this._encodeInteger(value);
    return;
  }
  
  // switch for special types
  switch (typeof(value)) {
      case 'string':
        // convert to buffer, and use _encodeBuffer
        this._encodeBuffer(new Buffer(value));
        return;
      case 'number':
        // encode the number
        this._encodeNumber(value);
        return;
  }
  
  // check to see if is a 'Dictionary'
  if(value instanceof Dictionary) {
    this._encodeDictionary(value);
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
  
  // check if its a normal javascript integer
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

/**
 * Encodes an integer
 * @private
 * @param value - integer to encode
 */
Encoder.prototype._encodeInteger = function _encodeInteger(value) {
  this.data.push(INT_BUFF);
  this.data.push(new Buffer(value.toString()));
  this.data.push(END_BUFF);
};

/**
 * Encodes an array
 * @private
 * @param value - array to encode
 */
Encoder.prototype._encodeArray = function _encodeArray(value) {
  // push the list start marker
  this.data.push(LIST_BUFF);
  // for each item in the array, encode it
  value.forEach(function(item){
    this._encode(item);
  },this);
  // push the list end marker
  this.data.push(END_BUFF);
};

Encoder.prototype._encodeDictionary = function _encodeDictionary(value) {
  // push the dictionary start marker
  this.data.push(DICT_BUFF);
  
  // use the special `_content64` hash
  // sort the keys to ensure consistent output
  // for each base64 key of nodes
  Object.keys(value._content64).sort().forEach(function(key){
    // get the node (key-value pair) 
    var node = value._content64[key];
    // if it doesn't have a value, skip the key
    if (node.value === undefined || node.value === null) { return; }
    // encode the key (its already a buffer)
    this._encodeBuffer(node.key);
    // encode the value
    this._encode(node.value);
  },this);
  // push the dictionary end marker
  this.data.push(END_BUFF);
};

/**
 * Encodes an object as a ditionary
 * @private
 * @parm value - object to encode
 */
Encoder.prototype._encodeObject = function _encodeObject(value) {
  // push the dictionary start marker
  this.data.push(DICT_BUFF);
  
  // sort the keys to ensure consistent output
  // forEach key
  Object.keys(value).sort().forEach(function(key, index){
    // get the value
    var temp = value[key];
    // skip undefined and null values
    if (temp === undefined || temp === null) { return; }
    // encode the key, by first converting it into a buffer
    this._encodeBuffer(new Buffer(key.toString()));
    // encode the value
    this._encode(temp);
  },this);
  
  // push the dictionary end marker
  this.data.push(END_BUFF);
};
