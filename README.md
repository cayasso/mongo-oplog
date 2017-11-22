# mongo-oplog

[![Build Status](https://img.shields.io/travis/cayasso/mongo-oplog/master.svg)](https://travis-ci.org/cayasso/mongo-oplog)
[![NPM version](https://img.shields.io/npm/v/mongo-oplog.svg)](https://www.npmjs.com/package/mongo-oplog)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

Listening to MongoDB live changes using oplog.

## Features

* Support start and stop tailing the MongoDB `oplog` at any time.
* Support filtering `oplog` events by `namespaces` (database and collections).
* Built on top of the native NodeJS [MongoDB driver](https://github.com/mongodb/node-mongodb-native/).
* First class `Promise` support which enable the use of `async` and `await`.
* The package has a very small footprint and requires just a few dependencies including `mongodb`, `debug` and `eventemitter3`.
* Uses `eventemitter3` for high performance event emitting.
* Strict and readable code enforced with [xo](https://github.com/sindresorhus/xo)
* Unit tested with `mocha` and built with `babel` for backward compatibility with older versions of NodeJS like `v6.x` and `v7.x`.

## IMPORTANT! Major update version 2.0.x

2.0.x is a major rewrite taking advantage of `es6` and adding support for `promises` and `async/await`. Callbacks are still supported for backward compatibility.
This version has minimum **API** changes, but these changes might affect your code, so please take a look at the upgrading guide before installing.

[Check the upgrading guide here](https://github.com/cayasso/mongo-oplog/blob/master/UPGRADE.md)

[Go here for the old 1.x readme](https://github.com/cayasso/mongo-oplog/tree/1.x)

[Go here for the old 0.x readme](https://github.com/cayasso/mongo-oplog/tree/0.x)

## Installation

``` bash
$ npm install mongo-oplog
```

## Configure MongoDB with replica set

You need to configure your MongoDB instance (local instance) to have access to the [oplog](https://docs.mongodb.com/manual/core/replica-set-oplog/), here are some quick steps on how to do so:

1. Shutdown your existing mongo instance if its running.

2. Restart the instance. Use the `--replSet` option to specify the name of the replica set.

``` bash
$ sudo mongod --replSet rs0
```

3. Connect to the mongo instance by executing `mongo` in your terminal:

```bash
$ mongo
```

4. In the mongo shell run `rs.initiate()` to initiate the new replica set:

```bash
> rs.initiate()
```

Once it is initiated then you are ready to start using `mongo-oplog`.

And [here is the official MongoDB documentation](https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/) if you need additional help on MongoDB replica set.

## Usage

``` javascript
import MongoOplog from 'mongo-oplog'
const oplog = MongoOplog('mongodb://127.0.0.1:27017/local', { ns: 'test.posts' })

oplog.tail();

oplog.on('op', data => {
  console.log(data);
});

oplog.on('insert', doc => {
  console.log(doc);
});

oplog.on('update', doc => {
  console.log(doc);
});

oplog.on('delete', doc => {
  console.log(doc.o._id);
});

oplog.on('error', error => {
  console.log(error);
});

oplog.on('end', () => {
  console.log('Stream ended');
});

oplog.stop(() => {
  console.log('server stopped');
});
```

## API

### MongoOplog(uri, [options])

* `uri`: Valid MongoDB uri or a MongoDB server instance.
* `options` MongoDB connection options.

### oplog.tail([fn])

Start tailing.
This method support both `Promise` and `callback`.

```javascript
oplog.tail().then(() => {
  console.log('tailing started')
}).catch(err => console.error(err))

// or with async/await
async function tail() {
  try {
    await oplog.tail()
    console.log('tailing started')
  } catch (err) {
    console.log(err)
  }
}
```

### oplog.stop([fn])

Stop tailing and disconnect from server.
This method support both `Promise` and `callback`.

```javascript
oplog.stop().then(() => {
  console.log('tailing stopped')
}).catch(err => console.error(err))

// or with async/await
async function stop() {
  try {
    await oplog.stop()
    console.log('tailing stopped')
  } catch (err) {
    console.log(err)
  }
}
```

### oplog.destroy([fn])

Destroy the `mongo-oplog` object by stop tailing and disconnecting from server.
This method support both `Promise` and `callback`.

```javascript
oplog.destroy.then(() => {
  console.log('destroyed')
}).catch(err => console.error(err))

// or with async/await
async function destroy() {
  try {
    await oplog.destroy()
    console.log('destroyed')
  } catch (err) {
    console.log(err)
  }
}
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
const filter = oplog.filter('*.posts')
filter.on('op', fn)
oplog.tail()
```

### filter.destroy()

Destroy filter object.

```javascript
filter.destroy()
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

Configure MongoDB for active oplog, once this is done then you can run the test:

``` bash
$ npm install
$ npm run test
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
