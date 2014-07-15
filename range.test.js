/*jshint node: true*/

'use strict';

var test = require('tape');
var data = require('./test/data.js');
var bencode = require('./index.js');

bencode.encode = function(value) {
  return bencode.Encoder.encode(value, { floatMode: 'lossy' });
};

test('bencode#encode()', function(t) {

  t.test('should be able to safely encode numbers between -/+ 2 ^ 53 (as ints)', function(t) {
    var JAVASCRIPT_INT_BITS = 53;
    var MAX_JAVASCRIPT_INT = Math.pow(2, JAVASCRIPT_INT_BITS);

    t.plan((JAVASCRIPT_INT_BITS-1)   * 6 + 3);
    t.equal(bencode.encode(0).toString(), 'i' + 0 + 'e');

    for (var exp = 1; exp < JAVASCRIPT_INT_BITS; ++exp) {
      var val = Math.pow(2, exp);
      // try the positive and negative
      t.equal(bencode.encode(val).toString(), 'i' + val + 'e');
      t.equal(bencode.encode(-val).toString(), 'i-' + val + 'e');

      // try the value, one above and one below, both positive and negative
      var above = val + 1;
      var below = val - 1;

      t.equal(bencode.encode(above).toString(), 'i' + above + 'e');
      t.equal(bencode.encode(-above).toString(), 'i-' + above + 'e');

      t.equal(bencode.encode(below).toString(), 'i' + below + 'e');
      t.equal(bencode.encode(-below).toString(), 'i-' + below + 'e');
    }
    
    t.equal(bencode.encode(MAX_JAVASCRIPT_INT).toString(), 'i' + MAX_JAVASCRIPT_INT + 'e');
    t.equal(bencode.encode(-MAX_JAVASCRIPT_INT).toString(), 'i-' + MAX_JAVASCRIPT_INT + 'e');
  });
  
});