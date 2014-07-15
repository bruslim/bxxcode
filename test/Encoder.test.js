/*jshint node: true*/

'use strict';

var Encoder = require('../lib/Encoder.js');

function encodeAndLog(value,options) {
 
  console.log.apply(null,[
    JSON.stringify(value), 
    '=>', 
    Encoder.encode(value, options).toString()
  ]);
}


encodeAndLog([1,10,100]);
encodeAndLog({
  asdf: '10',
  '10': { woo: 'inside', arr: [1,2,3] }
});
encodeAndLog(10.1,{ floatMode: null });
encodeAndLog(10.1,{ floatMode: 'lossy' });
                          