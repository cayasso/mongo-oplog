# Mongo Oplog

[![Build Status](https://travis-ci.org/cayasso/mongo-oplog.png?branch=master)](https://travis-ci.org/cayasso/mongo-oplog)
[![NPM version](https://badge.fury.io/js/mongo-oplog.png)](http://badge.fury.io/js/mongo-oplog)

Listening to MongoDB live changes using oplog.

## Instalation

``` bash
$ npm install mongo-oplog
```

## Usage

``` javascript
var mongooplog = require('../lib');
var oplog = mongooplog().start({ ns: 'test.posts' });

oplog.on('data', function (data) {
  console.log(data);
});

oplog.on('insert', function (doc) {
  console.log(doc);
});

oplog.on('update', function (doc) {
  console.log(doc);
});

oplog.on('remove', function (doc) {
  console.log(doc);
});

oplog.on('error', function (error) {
  console.log(error);
});

oplog.on('end', function () {
  console.log('Stream ended');
});

oplog.stop(function () {
  console.log('server stopped');
});
```


## TODO

Add tests.

## Run tests

``` bash
$ make test
```

## License

(The MIT License)

Copyright (c) 2013 Jonathan Brumley &lt;cayasso@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
