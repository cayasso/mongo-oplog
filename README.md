# Mongo Oplog

[![NPM version](https://badge.fury.io/js/mongo-oplog.png)](http://badge.fury.io/js/mongo-oplog)

Listening to MongoDB live changes using oplog.

## Instalation

``` bash
$ npm install mongo-oplog
```

## Usage

``` javascript
var MongoOplog = require('mongo-oplog');
var oplog = MongoOplog('mongodb://127.0.0.1:27017/local', 'test.posts').tail();

oplog.on('op', function (data) {
  console.log(data);
});

oplog.on('insert', function (doc) {
  console.log(doc.op);
});

oplog.on('update', function (doc) {
  console.log(doc.op);
});

oplog.on('delete', function (doc) {
  console.log(doc.op._id);
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

## API

### MongoOplog(uri, [[ns], [options]])

* `uri`: Valid MongoDB uri or a MongoDB server instance.
* `ns`: Namespace for emitting, namespace format is `database` + `.` + `collection` eg.(`test.posts`).
* `options` MongoDB onnection options.

### tail([fn])

Start tailing.

```javascript
oplog.tail(function(){
  console.log('tailing started');
})
```

### stop([fn])

Stop tailing and disconnect from server.

```javascript
oplog.stop(function(){
  console.log('tailing stopped');
})
```

### filter([ns])

Filter by namespace.

```javascript
oplog.filter('*.posts')
oplog.tail();
```

### filter.ns(ns)

Filter by namespace.

```javascript
oplog.filter()
.ns('*.posts')
.on('op', function(doc){
  console.log(doc);
});

// or
oplog.filter()
.ns('test.*')
.on('op', function(doc){
  console.log(doc);
});

// or
oplog.filter()
.ns('test.posts');
.on('op', function(doc){
  console.log(doc);
});

// start tailing
oplog.tail();
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

Configure MongoDB for ac active oplog:

Start MongoDB with:

``` bash
$ mongodb --repSet test
```

Start a `mongo` shell and configure mongo as follows:

```bash
> var config = {_id: "test", members: [{_id: 0, host: "127.0.0.1:27017"}]}
> rs.initiate(config)
```

Once configuration is initiated then you can run the test:

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
