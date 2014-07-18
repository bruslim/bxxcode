/*jshint node: true */

/**
 * A module which represents a Dictionary, with
 * a special add() to handle collisions
 * @module
 * @author bruslim (https://github.com/bruslim)
 */

// strict mode
'use strict';




/**
 * Represents a Dictionary
 * @constructor
 * @param {Object} [options] - options object
 * @param {Object} [options.addMode]
 */
var Dictionary = module.exports = function Dictionary(options) {
 
  Object.defineProperties(this, {
    // setup options object
    _options: { value: options || {} },
    _content64: { value: {} }
  });
  
 
  // ensure addMode has a value, defaults to `overwrite`
  this._options.addMode = this._options.addMode || 'overwrite';
  // lowercase that mode
  this._options.addMode = this._options.addMode.toLowerCase();
  
};

/**
 * Method used to add a (key,value) pair into the dictionary
 */
Dictionary.prototype.add = function add(key, value) {
  if (!Buffer.isBuffer(key)) {
    key = new Buffer(key);
  }
  
  var key64 = key.toString('base64');
  
  var keyString = isSafeKey(key) ? key.toString() : key64;
  
  // does the key exist
  if (!this.hasKey(key)) {
    // create and set
    this._content64[key64] = {
      key: key,
      value: value
    };
    (function(key64){
      Object.defineProperty(this, keyString, {
        enumerable: true,
        get: function() {
          return this._content64[key64].value;
        }
      });
    }).call(this,key64);
    // exit function
    return;
  }  
  // switch on add mode
  switch(this._options.addMode) {
    case 'merge':
      this._merge(key64, value);
      return;
    case 'ignore':
      return;
    case 'pure':
      throw new Error("Key '" + keyString + "' already exists.");
    //case 'overwrite':
    default:
      this._content64[key64] = value;
      return;
  }
};

function isSafeKey(key) {
  var safe = true;
  for(var i = 0; i < key.length && safe; i++) {
     safe = (key[i] < 192 || key[i] > 193) &&
        (key[i] < 245 || key[i] > 255);
  }
  return safe;
}


/**
 * Converts the value at the given key into a list and concats them
 * @private
 */
Dictionary.prototype._merge = function merge(key64, value) {
  var node = this._content64[key64];
  // check to see if its an array already
  if (!Array.isArray(node.value)) {
    // convert into an array;
    node.value = [ node.value ];
  }
  // check to see if value is an array
  if (Array.isArray(value)) {    
    // concat the values
    node.value  = node.value.concat(value);
  } else {    
    // push the value into the array
    node.value.push(value);
  }
};

/**
 * Returns true if the given key exists in the dictionary
 * @returns {Boolean}
 */
Dictionary.prototype.hasKey = function hasKey(key) {
  if (!Buffer.isBuffer(key)) {
    key = new Buffer(key);
  }
  return !!this._content64[key.toString('base64')];
};