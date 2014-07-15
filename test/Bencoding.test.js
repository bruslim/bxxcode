/*jshint node: true*/

'use strict';

var Decoder = require('../lib/Decoder.js');
var Encoder = require('../lib/Encoder.js');

function encodeDecodeLog(value, options) {
  var encoded = Encoder.encode(value, options);
  var decoded = Decoder.decode(encoded, options);

  if (typeof(decoded) === 'string') {
    console.log(decoded.toString(),'=>', encoded.toString());
  }else {
    console.log(JSON.stringify(decoded),'=>', encoded.toString());
  }
}
              

encodeDecodeLog('cool');

encodeDecodeLog({
  asdf: '10',
  '10': { woo: 'inside', arr: [1,2,3] }
});

