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
  // setup content object
  this.content = {};
  // setup options object
  this.options = options || {};
  // ensure addMode has a value, defaults to `overwrite`
  this.options.addMode = this.options.addMode || 'overwrite';
  // lowercase that mode
  this.options.addMode = this.options.addMode.toLowerCase();
};

/**
 * Method used to add a (key,value) pair into the dictionary
 */
Dictionary.prototype.add = function add(key, value) {
  // does the key exist
  if (!this.hasKey(key)) {
    // create and set
    this.content[key] = value;    
    // exit function
    return;
  }  
  // switch on add mode
  switch(this.options.addMode) {
    case 'merge':
      this._merge(key, value);
      return;
    case 'ignore':
      return;
    case 'pure':
      throw new Error("Key '" + key + "' already exists.");
    //case 'overwrite':
    default:
      this.content[key] = value;
      return;
  }
};

/**
 * Converts the value at the given key into a list and concats them
 * @private
 */
Dictionary.prototype._merge = function merge(key, value) {
  // check to see if its an array already
  if (!Array.isArray(this.content[key])) {
    // convert into an array;
    this.content[key] = [ this.content[key] ];
  }
  // check to see if value is an array
  if (Array.isArray(value)) {    
    // concat the values
    this.content[key] = this.content[key].concat(value);
  } else {    
    // push the value into the array
    this.content[key].push(value);
  }
};

/**
 * Returns true if the given key exists in the dictionary
 * @returns {Boolean}
 */
Dictionary.prototype.hasKey = function hasKey(key) {
  return !!this.content[key];
};