/*jshint node: true */

'use strict';

var Encoder = require('./lib/Encoder.js');
var Decoder = require('./lib/Decoder.js');

module.exports = {
  encode : Encoder.encode,
  decode : Decoder.decode,
  Encoder: Encoder,
  Decoder: Decoder
};