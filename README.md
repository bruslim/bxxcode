#bxxcode

A nodejs bencoding module.

It can encode and decode bencoded buffers and strings.


To install:

~~~~~~~~~
npm install bxxcode
~~~~~~~~~


## Usage

~~~~~~~~~~ js
// import
var bxxcode = require('bxxcode');

// decode
var decoded = bxxcode.decode(input);

// encode
var encoded = bxxcode.encode(input);
~~~~~~~~~~


## Thanks

Made @ [HackerSchool (S'14 June)](https://www.hackerschool.com)

Based off of [node-bencode](https://github.com/themasch/node-bencode/).
