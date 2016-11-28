# mongo-oplog

[![NPM version](https://badge.fury.io/js/mongo-oplog.svg)](http://badge.fury.io/js/mongo-oplog)

Listening to MongoDB live changes using oplog.

## Installation

``` bash
$ npm install mongo-oplog
```

## IMPORTANT! Migrating from 0.x to 1.x

[Check the upgrading guide here](https://github.com/cayasso/mongo-oplog/blob/develop/UPGRADE.md)

[Go here for the old 0.x readme](https://github.com/cayasso/mongo-oplog/tree/0.x)

## Usage

``` javascript
var MongoOplog = require('mongo-oplog');
var oplog = MongoOplog('mongodb://127.0.0.1:27017/local', { ns: 'test.posts' }).tail();

oplog.on('op', function (data) {
  console.log(data);
});

oplog.on('insert', function (doc) {
  console.log(doc);
});

oplog.on('update', function (doc) {
  console.log(doc);
});

oplog.on('delete', function (doc) {
  console.log(doc.o._id);
});

oplog.on('error', function (error) {
  console.log(error);
});

oplog.on('open', function () {
  console.log('successfully connected');
});

oplog.on('end', function () {
  console.log('Stream ended');
});

oplog.stop(function () {
  console.log('server stopped');
});
```

## API

### MongoOplog(uri, [options])

* `uri`: Valid MongoDB uri or a MongoDB server instance.
* `options` MongoDB connection options.

### oplog.tail([fn])

Start tailing.

```javascript
oplog.tail(function(){
  console.log('tailing started');
})
```

### oplog.stop([fn])

Stop tailing and disconnect from server.

```javascript
oplog.stop(function() {
  console.log('tailing stopped');
});
```

### oplog.destroy([fn])

Destroy the `mongo-oplog` object by stop tailing and disconnecting from server.

```javascript
oplog.destroy(function(){
  console.log('destroyed');
})
```

### oplog.ignore

Pause and resume oplog events.

```javascript
oplog.ignore = true; // to pause
oplog.ignore = false // to resume
```

### oplog.filter(ns)

Create and return a filter object.

```javascript
var filter = oplog.filter('*.posts');
filter.on('op', fn);
oplog.tail();
```

### filter.destroy([fn]);

Destroy filter object.

```javascript
filter.destroy(function(){
  console.log('destroyed');
})
```

### filter.ignore

Pause and resume filter events.

```javascript
filter.ignore = true; // to pause
filter.ignore = false // to resume
```

### events

Events supported by `oplog` and `filter`;

* `op`: All bellow operations (oplog/filter).
* `insert`: Document insert (oplog/filter).
* `update`: Document update (oplog/filter).
* `delete`: Document delete (oplog/filter).
* `end`: Cursor stream ended (oplog).
* `error`: Error (oplog).

## Run tests

Configure MongoDB for active oplog:

Start MongoDB with:

``` bash
$ mongod --replSet test
```

Start a `mongo` shell and configure mongo as follows:

```bash
> var config = {_id: "test", members: [{_id: 0, host: "127.0.0.1:27017"}]}
> rs.initiate(config)
```

Once configuration is initiated then you can run the test:

``` bash
$ npm install
$ make test
```

## License

(The MIT License)

Copyright (c) 2015 Jonathan Brumley &lt;cayasso@gmail.com&gt;

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
