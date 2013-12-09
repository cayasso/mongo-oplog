'use strict';

/**
 * Module dependencies.
 */

var BSON = require('mongodb').BSONPure
  , Emitter = require('events').EventEmitter
  , debug = require('debug')('MongoOplog:oplog');

/**
 * Export `Oplog`.
 */

module.exports = Oplog;

/**
 * Oplog constructor.
 *
 * @param {String|Db} conn uri string or Db instance
 * @param {String} [namespace] db name space for start watching
 * @param {Object} [options] mongo driver options
 * @api public
 */

function Oplog(conn, namespace, options) {
  
  if ('object' === typeof namespace) {
    options = namespace;
    namespace = null;
  }

  options = options || {};
  this.options = options;
  this.conn = conn;
  this.ns = namespace || options.ns || null;
  this.since = options.since || null;
  this.coll = options.coll || 'oplog.rs';
  this.conn.once('connect', this.onconnect.bind(this));
  process.on('SIGINT', function sigint() {
    this.stop(); //tailable cursor should be stopped manually
  }.bind(this));
}

/**
 * Inherits from `EventEmitter`.
 */

Oplog.prototype.__proto__ = Emitter.prototype;

/**
 * Called upon database connection.
 *
 * @param {DB} db mongo database
 * @return {Oplog} this
 * @api public
 */

Oplog.prototype.onconnect = function onconnect(db) {
  debug('Connected to oplog database');

  this.db = db;

  var oplog = this
    , time
    , since
    , query = {}
    , collection = this.db.collection(this.coll)
    , options = {
        tailable: 1,
        awaitdata: 1,
        oplogReplay: 1,
        tailableRetryInterval: this.options.retryInterval || 1000,
        numberOfRetries: this.options.retries || 1000
      };

  collection
    .find({}, { ts: 1 })
    .sort({ ts: -1 })
    .limit(1)
    .objectNext(function next(err, doc) {

      if (err) {
        debug('stoping oplog because of error %j', err);
        return oplog.stop();
      }

      if (doc) {
        oplog.running = true;
        if (err) return oplog.onerror(err);
        since = oplog.since ? oplog.since : (doc ? doc.ts : 0);
        if (since)
          time = { $gt: since };
        else
          time = { $gte: BSON.Timestamp(0, Date.now() / 1000) };

        query.ts = time;
        if (oplog.ns) query.ns = oplog.ns;

        debug('starting cursor with query %j and options %j', query, options);

        oplog.stream = collection.find(query, options).stream();
        oplog.bind();
      } else {
        oplog.stop();
      }
    });

  return this;
};

/**
 * Bind stream events.
 *
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.bind = function bind() {
  if (!this.stream) return this;
  debug('binding stream events');
  this.stream.on('data', this.ondata.bind(this));
  this.stream.on('error', this.onerror.bind(this));
  this.stream.on('end', this.onend.bind(this));
  return this;
};

/**
 * Setter and getter for database name.
 *
 * @param {String} db The database name
 * @return {Oplog} this
 * @api public
 */

Oplog.prototype.ondata = function ondata(doc) {
  
  debug('incoming data %j', doc);

  switch (doc.op) {
    case "i":
      this.emit("insert", doc.o);
      break;
    case "u":
      this.emit("update", doc.o);
      break;
    case "d":
      this.emit("delete", doc.o._id);
      break;
  }
  // emit the data event
  this.emit('data', doc);
  return this;
};

/**
 * Called upon stream error.
 *
 * @param {Error} error
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.onerror = function ondata(error) {
  debug('stream error %j', error);
  this.emit('error', error);
  return this;
};

/**
 * Called upon stream end event.
 *
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.onend = function onend() {
  debug('stream ended');
  this.emit('end');
  this.reconnect();
  return this;
};

/**
 * Reconnect query cursor.
 *
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.reconnect = function reconnect() {
  var oplog = this;
  if (this.db) {
    debug('attemting to reconnect to cursor');
    setImmediate(function inmediate() {
      oplog.connect(this.db);
    });
  }
  return this;
};

/**
 * End oplog stream.
 *
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.stop = function stop(fn) {
  if (!this.running) return this;
  this.running = false;
  debug('server is stopping');
  this.conn.close(fn);
};