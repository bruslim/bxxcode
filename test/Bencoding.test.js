/*jshint node: true*/

'use strict';

var bxxcode = require('../index.js');

function encodeDecodeLog(value, options) {
  var encoded = bxxcode.encode(value, options);
  var decoded = bxxcode.decode(encoded, options);

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

