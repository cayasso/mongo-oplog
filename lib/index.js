'use strict';

/**
 * Module dependencies.
 */

var BSON = require('mongodb').BSONPure
  , Emitter = require('events').EventEmitter
  , Connection = require('./connect')
  , events = require('./events')
  , Filter = require('./filter')  
  , debug = require('debug')('mongo-oplog');

/**
 * Export `Oplog`.
 */

module.exports = Oplog;

/**
 * Oplog constructor.
 *
 * @param {String|Db} conn uri string or Db instance
 * @param {String} [ns] db name space for start watching
 * @param {Object} [options] mongo driver options
 * @api public
 */

function Oplog(conn, ns, options) {
  if (!(this instanceof Oplog)) return new Oplog(conn, ns, options);

  if ('object' === typeof ns) {
    options = ns;
    ns = null;
  }

  this.filters = [];
  this.ns = ns || null;
  options = options || {};
  this.options = options;
  this.since = options.since || null;
  this.coll = options.coll || 'oplog.rs';
  this.conn = new Connection(conn, options);
}

/**
 * Inherits from `EventEmitter`.
 */

Oplog.prototype.__proto__ = Emitter.prototype;

/**
 * Oplog events.
 *
 * @type {Object}
 * @api public
 */

Oplog.prototype.events = events;

/**
 * Creates a new filter.
 *
 * @param {String} ns name or pattern
 * @return {Filter} new filter
 * @api public
 */

Oplog.prototype.filter = function filter(ns) {
  var filter = new Filter(this, ns);
  this.filters.push(filter);
  return filter;
};

/**
 * Starts tailing.
 *
 * @param {Function} fn
 * @return {Oplog} this
 * @api public
 */

Oplog.prototype.tail = function tail(fn) {

  debug('Connected to oplog database');

  var oplog = this;
  oplog.conn.ready(function ready(err, db) {

    if (err) return oplog.onerror(err);

    var time
      , since
      , query = {}
      , coll = db.collection(oplog.coll)
      , options = {
          tailable: true,
          awaitdata: true,
          oplogReplay: true,
          timeout: false,
          numberOfRetries: -1
        };

    coll
      .find({}, { ts: 1 })
      .sort({ $natural: -1 })
      .limit(1)
      .nextObject(function next(err, doc) {
        if (err) {
          debug('stoping oplog because of error %j', err);
          if (fn) fn(err);
          oplog.onerror(err);
          return oplog.stop();
        }

        if (doc) {
          oplog.running = true;
          since = oplog.since ? oplog.since : (doc ? doc.ts : 0);
          if (since)
            time = { $gt: since };
          else
            time = { $gte: BSON.Timestamp(0, Date.now() / 1000) };
          query.ts = time;
          if (oplog.ns) query.ns = oplog.ns;
          debug('starting cursor with query %j and options %j', query, options);
          oplog.stream = coll.find(query, options).stream();
          oplog.bind();
          if (fn) fn(null, oplog.stream);
        } else {
          oplog.stop();
        }
      });
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
 * Called upon incoming data.
 *
 * @param {Object} op
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.ondata = function ondata(doc) {
  debug('incoming data %j', doc);
  this.emit('op', doc);
  this.emit(events[doc.op], doc);
  return this;
};

/**
 * Called upon stream error.
 *
 * @param {Error} error
 * @return {Oplog} this
 * @api private
 */

Oplog.prototype.onerror = function onerror(err) {
  if (!err || !err.stack) {
    throw new Error('Unknown error:' + err);
  } else if (/cursor timed out/.test(err.message)) {
    debug('cursor timeout - re-tailing %j', err);
    this.tail();
  } else {
    debug('unknow error %j', err);
    this.emit('error', err);
  }
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
  this.tail();
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

/**
 * Method to extend the module.
 * 
 * @param {Function} fn
 * @api public
 */

Oplog.use = function use(fn) {
  var args = [].slice.call(arguments, 1);
  args.unshift(this);
  fn.apply(this, args);
  return this;
};

/**
 * Expose modules.
 */

Oplog.events = events;
Oplog.Emitter = Emitter;
Oplog.Filter = Filter;
Oplog.Connection = Connection;
