## Upgrading from 0.x.x to 1.0.x

The constructor does no longer support `new`, just call the constructor as a regular function.

Instead of:

```js
var oplog = new MongoOplog(uri);
```

use:

```js
var oplog = MongoOplog(uri);
```

The constructor does no longer support 3 arguments (`uri`, `ns`, `options`)  but only two (`uri`, `options`).

```js
var options = { 
  database: 'local'
};
var oplog = new MongoOplog(uri, 'test.posts', options);
```

use:

```js
var options = {
  ns: 'test.posts',
  database: 'local'
};

var oplog = MongoOplog(uri, options);
```

Use `stop` or `destroy`, using `stop` will stop and destroy the tailing cursor and `destroy` will destroy cursor and database connection disconnecting from server.

```js
oplog.destroy(function(){
  console.log('destroyed');
})
```

Use the `ignore` flag to pause and resume oplog events.

```js
oplog.ignore = true; // to pause
oplog.ignore = false // to resume
```

`oplog.filter` no longer has a `ns` method, you need to pass the namespace when invoking the filter method.

So instead of:

```js
oplog.filter()
.ns('test.*')
.on('op', function(doc){
  console.log(doc);
});
```

Use this:

```js
oplog.filter('*.posts')
.on('op', function(doc){
  console.log(doc);
});
```

Filter object now has a `destroy` method to destroy the object.

```js
filter.destroy(function(){
  console.log('destroyed');
});
```

Filters also support the `ignore` flag, to pause and resume filter events.

```js
filter.ignore = true; // to pause
filter.ignore = false; // to resume
```



