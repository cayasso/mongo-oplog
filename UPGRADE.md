# Upgrading from 1.x to 2.x

Passing `database` as option to the constructor is no longer supported, for this please use the MongoDB connection url.

```js
// instead of
const options = {
  database: 'local'
};

const oplog = MongoOplog('mongodb://mydomain.com:27017', options);

// use like this
const oplog = MongoOplog('mongodb://mydomain.com:27017/local');
```
The `tail` method no longer return the `oplog` instance instead it returns a `Promise`.

```js
// instead of
const oplog = MongoOplog(conn.oplog, { ns: 'test.posts' }).tail()
oplog.on('op', fn)

// use this
const oplog = MongoOplog(conn.oplog, { ns: 'test.posts' })
oplog.tail()
oplog.on('op', fn)
```

The `tail`, `stop`, `destroy` methods now return a more convenient `Promise` instance instead of the `oplog` object.

```js
oplog.tail().then(stream => {
  console.log('tailing')
}).catch(err => console.log(err))

oplog.stop().then(() => {
  console.log('tailing stopped')
}).catch(err => console.log(err))

oplog.destroy().then(() => {
  console.log('oplog connection destroyed')
}).catch(err => console.log(err))
```

Please note that callbacks are still supported for now, in the feature this can change and we might drop `callback` support in favor of only `promise`s.

# Upgrading from 0.x to 1.x

The constructor does no longer support `new`, just call the constructor as a regular function.

```js
// instead of
var oplog = new MongoOplog(uri);

// use this
var oplog = MongoOplog(uri);
```
The constructor does no longer support 3 arguments (`uri`, `ns`, `options`)  but only two (`uri`, `options`).

```js
// instead of
var options = {
  database: 'local'
};

var oplog = MongoOplog(uri, 'test.posts', options);

// use like this
var options = {
  ns: 'test.posts',
  database: 'local'
};

var oplog = MongoOplog(uri, options);
```
Use `stop` or `destroy`, the first will stop and destroy the tailing cursor and the second will destroy cursor and database connection disconnecting from server.

```js
oplog.destroy(function(){
  console.log('destroyed');
});
```

Use the `ignore` flag to pause and resume oplog events.

```js
oplog.ignore = true; // to pause
oplog.ignore = false // to resume
```

`oplog.filter` no longer has a `ns` method, you need to pass the namespace when invoking the filter method.


```js
// instead of
oplog.filter()
.ns('*.posts')
.on('op', function(doc){
  console.log(doc);
});

// use this
oplog.filter('*.posts')
.on('op', function(doc){
  console.log(doc);
});
```

Filter object now has a `destroy` method.

```js
filter.destroy(function(){
  console.log('destroyed');
});
```

Filters also support the `ignore` flag to pause and resume filter events.

```js
filter.ignore = true; // to pause
filter.ignore = false; // to resume
```
