/*jshint node: true*/

'use strict';

var Decoder = require('../lib/Decoder.js');

function decodeAndLog(value, options) {
  var decoder = new Decoder(value, options);
  var things = [];
  things.push(value.toString() + " =>");
  while (decoder.hasData()){
    var decoded = decoder.decode();
    if (Buffer.isBuffer(decoded)) {
      things.push("'" + decoded.toString('ascii') + "'");
      
    } else {
      things.push(decoded);
    }
  }
  console.log.apply(null, things);
}

console.log('i123e =>',Decoder.decode('i123e'));
    
decodeAndLog('i123e');

decodeAndLog('li123ei456ee');
                
decodeAndLog('9:hi there!');
                
decodeAndLog('l9:hi there!i1234ee');
    
decodeAndLog('d9:hi there!i1234eed9:hi there!i1234ee');
    
decodeAndLog('d9:hi there!i1234e9:hi there!d4:asdfi123eee');
    
decodeAndLog('d9:hi there!i1234e9:hi there!d4:asdfi123eee', { addMode: 'ignore' });
    
decodeAndLog('d9:hi there!i1234e9:hi there!i123ee', { addMode: 'merge' });
    
// throw exception
decodeAndLog('d9:hi there!i1234e9:hi there!d4:asdfi123eee', { addMode: 'pure'});