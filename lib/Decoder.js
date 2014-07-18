/*jshint node: true*/

/**
 * A module which can Decode bencoded files
 * @module
 * @author bruslim (https://github.com/bruslim)
 */

// strict mode
'use strict';

// import the dictionary module
var Dictionary = require('./Dictionary.js');

// ##Special Characters

//  End Character `e`
var END_CHAR = 101; 
//  Integer Character `i`
var INT_CHAR = 105; 
//  List Character `l`
var LIST_CHAR = 108; 
//  Dictionary Character `d`
var DICT_CHAR = 100;
//  Separator Character `:`
var SEP_CHAR = 58; 

/**
 * Represents a bencoding Decoder.
 * @constructor
 * @param {Buffer|String} [data] - The data to decode
 * @param {Object} [options] - The options for the decoder
 * @param {String} [options.addMode="overwrite"] - The add mode 
 *  to handle collisions:
 *    pure - Throws an exception on duplicate keys
 *    ignore - Ignores the duplicate
 *    overwrite (defualt) - Overwrites with duplicate
 *    merge - Converts into a list, and concats values
 */
var Decoder = module.exports = function Decoder(data, options) {
  // convert arguments object into an array
  var args = Array.prototype.slice.call(arguments);
  // map each item in the array
  args.map(function(item, index) {
    if (Buffer.isBuffer(item) || typeof(item) === 'string') {
      this.load(item);
    }
    if (typeof(item) === 'object') {
      this.options = item;
    }
  },this);
};

/**
 * Convenience function to decode the data
 * @returns {Integer|Buffer|Array|Object}
 */
Decoder.decode = function decode(data, options) {
  return (new Decoder(data, options)).decode();
};

/**
 * Loads the given data into the Decoder, resets the current position to 0.
 * If data is not a Buffer, it is converted into a Buffer
 * @param {Buffer|String} data - data to decode
 */
Decoder.prototype.load = function load(data) {
  // reset cursor to begining
  this.currentPosition = 0;
  // set data
  this.data = Buffer.isBuffer(data) ? data : (new Buffer(data));
};

/**
 * Returns true if there is data to decode.
 * @returns {Boolean} - true if there is data to decode
 */
Decoder.prototype.hasData = function hasData() {
  return this.data && this.currentPosition < this.data.length;
};

/**
 * Decodes the data
 * @returns {Integer|Buffer|Array|Object}
 */
Decoder.prototype.decode = function decode() {
  return this.hasData() ? this._decode() : null;
};

/**
 * Internal decode helper function
 * @private
 * @returns {Integer|Buffer|Array|Object}
 */
Decoder.prototype._decode = function _decode() {
  // based on the character at the current position
  switch(this.data[this.currentPosition]) {
      // its an integer
      case INT_CHAR:
        // decode the integer
        return this._decodeInteger();
      // its a dictionary
      case DICT_CHAR:
        // decode the dictionary
        return this._decodeDictionary();
      // its a list
      case LIST_CHAR:
        // decode the list
        return this._decodeList();
      // assume it a string
      default:
        // decode the string as a buffer
        return this._decodeBuffer();
  }
};

/**
 * Validates that the current position has the given charCode
 * throws an error if not
 * @private
 */
Decoder.prototype._validate = function(charCode, invalidMessage) {
  if (!this.hasData()) {
    throw new Error('No data to decode.');
  }
  if (this.data[this.currentPosition] !== charCode) {
    throw new Error(invalidMessage);
  }
};

/**
 * Finds the char code in the buffer and returns the index.
 * @private
 */
Decoder.prototype._find = function _find(charCode) {
  var index = this.currentPosition + 1;
  while (index < this.data.length) {
    if (this.data[index] === charCode) {
      return index;
    }
    index += 1;
  }
  return -1;
};

/**
 * Decodes a bencoded integer
 * @private
 */
Decoder.prototype._decodeInteger = function _decodeInteger() {
  // starting character should be i (105)
  this._validate(
    INT_CHAR,
    'Invalid integer segment, starting character not valid.'
  );  
  // move the cursor to the next octet
  var start = this.currentPosition + 1;  
  // find the 'e' - ending character
  var end = this._find(END_CHAR); 
  if (end < 0) {
    throw new Error(
      'Invalid integer segment, ending character not found.'
    );
  }  
  // slice the buffer to get the integer in base 10
  var raw = this.data.slice(start, end);  
  // move current position forward
  this.currentPosition = end + 1;  
  // parse int base 10
  return parseInt(raw.toString('ascii'), 10); 
};

/**
 * Decodes a bencoded list
 * @private
 */
Decoder.prototype._decodeList = function _decodeList() {
  // starting character should be l (108)
  this._validate(
    LIST_CHAR, 
    'Invalid list segment, starting character not valid.'
  );  
  // move the cursor to the next octet
  this.currentPosition += 1;  
  // list values to return
  var values = [];  
  // use a loop, since the next e, does not ensure end of list
  while (this.hasData() && this.data[this.currentPosition] !== END_CHAR) {
    values.push( this._decode() );
  }  
  // check for end of list character
  this._validate(END_CHAR, 'Invalid list segment, ending character not valid.');  
  // advance cursor
  this.currentPosition += 1;  
  // return the set of values
  return values;
};

/**
 * Decodes a bencoded dictionary
 * @private
 */
Decoder.prototype._decodeDictionary = function _decodeDictionary() {
  // starting character should be d
  this._validate(
    DICT_CHAR, 
    'Invalid dictionary segment, starting character not valid.'
  );  
  // move the cursor to the next octet
  this.currentPosition += 1;  
  // object to return
  var dictionary = new Dictionary(this.options);
  // while not at end and current octet != 'e'
  while(this.hasData() && this.data[this.currentPosition] !== END_CHAR) {    
    // decode the key
    var key = this._decodeBuffer();    
    // decode the value
    var value = this._decode();    
    // add the (key, value) pair to the dictionary
    dictionary.add(key,value);
  }  
  // check the ending character
  this._validate(
    END_CHAR, 
    'Invalid dictionary segment, ending character not valid.'
  );  
  // move the cursor to the next octet
  this.currentPosition += 1;  
  // return the object
  return dictionary;
};

/**
 * Decodes a bencoded string into a buffer
 * Use Buffers for speed
 * @private
 */
Decoder.prototype._decodeBuffer = function _decodeBuffer() {
  // find the index of :
  var sep = this._find(SEP_CHAR);  
  // ensure ':' was found
  if (sep < 0) {
    throw new Error("Invalid string segment, ':' not found.");
  }  
  // get the raw length indicator
  var raw = this.data.slice(this.currentPosition, sep);  
  // parse it to an integer
  var length = parseInt(raw.toString('ascii'), 10);  
  // string starting position
  var start = sep + 1;  
  // string ending position
  var end = start + length;  
  // set the current position to the end
  this.currentPosition = end;  
  // return a reference to the string segment
  return this.data.slice(start, end);
};
