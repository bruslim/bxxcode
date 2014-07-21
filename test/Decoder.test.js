/*jshint node: true*/


'use strict';

var test = require('tape');
var data = require('./data.js');
var bencode = require('../index.js');
var bigint = require('bigint');

test("bencode#decode", function(t) {
  t.test('should be able to decode an integer', function(t) {
    t.plan(2);
    t.assert(bigint('123').eq(bencode.decode('i123e')));
    t.assert(bigint('-123').eq(bencode.decode('i-123e')));
  });
  
  t.test('should be able to decode a float (as int)', function(t) {
    t.plan(2);
    t.assert(bigint('12').eq(bencode.decode('i12.3e')));
    t.assert(bigint('-12').eq(bencode.decode('i-12.3e')));
  });

  t.test('should be able to decode a string', function(t) {
    t.plan(2);
    t.deepEqual(bencode.decode('5:asdfe'), new Buffer('asdfe'));
    t.deepEqual(bencode.decode(data.binResultData.toString()), data.binStringData);
  });

  t.test('should be able to decode "binary keys"', function(t) {
    t.plan(1);
    t.ok(bencode.decode(data.binKeyData).files.hasOwnProperty(data.binKeyName.toString('base64')));
  });

  t.test('should be able to decode a dictionary', function(t) {
    t.plan(3);
    t.deepEqual(
      bencode.decode( 'd3:cow3:moo4:spam4:eggse' ),
      {
        cow: new Buffer('moo'),
        spam: new Buffer('eggs')
      }
    );
    t.deepEqual(
      bencode.decode( 'd4:spaml1:a1:bee' ),
      { spam: [
        new Buffer('a'),
        new Buffer('b')
      ] }
    );
    t.deepEqual(
      bencode.decode( 'd9:publisher3:bob17:publisher-webpage15:www.example.com18:publisher.location4:homee'),
      {
        'publisher': new Buffer('bob'),
        'publisher-webpage': new Buffer('www.example.com'),
        'publisher.location': new Buffer('home')
      }
    );
  });
  
  t.test('should be able to decode a list', function(t) {
    t.plan(1);
    t.deepEqual(
      bencode.decode( 'l4:spam4:eggse'),
      [ new Buffer('spam'),
        new Buffer('eggs') ]
    );
  });
  t.test('should return the correct type', function(t) {
    t.plan(1);
    t.ok(Buffer.isBuffer(bencode.decode('4:öö')));
  });
  t.test('should be able to decode stuff in dicts (issue #12)', function(t) {
    t.plan(4);
    var someData = {
      string: 'Hello World',
      integer: bigint('12345'),
      dict: {
        key: 'This is a string within a dictionary'
      },
      list: [ 
        bigint('1'),
        bigint('2'), 
        bigint('3'), 
        bigint('4'), 
        'string', 
        bigint('5'),
        {}
      ]
    };
    var result = bencode.encode( someData );
    var dat = bencode.decode ( result );
    t.deepEqual(dat.integer, bigint('12345'));
    t.deepEqual(dat.string, new Buffer("Hello World"));
    t.deepEqual(dat.dict.key, new Buffer("This is a string within a dictionary"));
    t.deepEqual(dat.list, [
      bigint('1'),
      bigint('2'),
      bigint('3'),
      bigint('4'),
      new Buffer('string'),
      bigint('5'),
      {}
    ]);
  });
});
