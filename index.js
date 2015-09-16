'use strict';

/**
 * Module dependencies.
 */

var MongoClient = require('mongodb').MongoClient;
var debug = require('debug')('mongo-oplog');
var cursor = require('mongo-oplog-cursor');
var Emitter = require('eventemitter3');
var filter = require('./filter');
var thunky = require('thunky');

/**
 * Noop function.
 * 
 * @type {Function}
 * @api private
 */

var noop = function noop(){};

/**
 * Core object inherited from emitter.
 * 
 * @type {Object}
 * @api public
 */

var oplog = Object.create(Emitter.prototype);

/**
 * Oplog events.
 * 
 * @type {Object}
 * @api private
 */

oplog.events = {
  i: 'insert',
  u: 'update',
  d: 'delete'
};

/**
 * Create a oplog object.
 * 
 * @param {Object|String} conn
 * @param {Object} options
 * @return {Oplog}
 * @api public
 */

oplog.create = function create(conn, options) {
  return Object.create(this).init(conn, options);
};

/**
 * Initialize oplog object.
 *
 * @param {Object|String} conn
 * @param {Object} options
 * @return {Oplog}
 * @api private
 */

oplog.init = function init(conn, options) {
  var ctx = this;
  options = options || {};
  this.ns = options.ns;
  this.ts = options.since;
  this.coll = options.coll;
  conn = conn || 'mongodb://127.0.0.1:27017/local';
  this.ready = thunky(function ready(cb) {
    if ('string' === typeof conn) {
      MongoClient.connect(conn, options, function getDb(err, db) {
        if (err) return ctx.onerror(err, cb);
        debug('successfully connected');
        db = db.db(options.database || 'local');
        cb(null, ctx.db = db);
      });
    } else {
      if (conn && conn.collection) return cb(null, ctx.db = conn);
      ctx.onerror(new Error('Invalid mongo connection.'), cb);
    }
  });
  return this;
};

/**
 * Starts tailing.
 *
 * @param {Function} fn
 * @return {Oplog} this
 * @api public
 */

oplog.tail = function tail(fn) {
  debug('Connected to oplog database');
  var ctx = this;
  fn = fn || noop;
  ctx.ready(function ready(err, db) {
    if (err) return fn(err);
    ctx.cursor = cursor({ 
      db: db,
      ns: ctx.ns,
      ts: ctx.ts,
      coll: ctx.coll
    }, function getCursor(err, cur) {
      if (err) return ctx.onerror(err, fn);
      var stream = ctx.stream = cur.stream();
      stream.on('end', ctx.onend.bind(ctx));
      stream.on('data', ctx.ondata.bind(ctx));
      stream.on('error', ctx.onerror.bind(ctx));
      debug('starting cursor');
      fn(null, stream);
    });
  });
  return this;
};

/**
 * Creates a new filter.
 *
 * @param {String} ns name or pattern
 * @return {Filter} new filter
 * @api public
 */

oplog.filter = function filtering(ns) {
  return filter.create(ns, this);
};

/**
 * End oplog stream.
 *
 * @param {Function} fn
 * @return {Oplog} this
 * @api public
 */

oplog.stop = function stop(fn) {
  fn = fn || noop;
  if (this.stream) {
    this.stream.destroy();
    debug('server is stopping');
    setImmediate(fn.bind(this));
  }
  return this;
};

/**
 * End oplog stream.
 *
 * @param {Function} fn
 * @return {Oplog} this
 * @api public
 */

oplog.destroy = function destroy(fn) {
  var ctx = this;
  fn = fn || noop;
  this.ready(function ready(err, db) {
    if (err) return fn(err);
    debug('destroying oplog');
    ctx.stop();
    db.close(fn);
  });
  return this;
};

/**
 * Method to extend the module.
 * 
 * @param {Function} fn
 * @api public
 */

oplog.use = function use(fn, options) {
  fn(this, options);
  return this;
};

/**
 * Called upon incoming data.
 *
 * @param {Object} op
 * @return {Oplog} this
 * @api private
 */

oplog.ondata = function ondata(doc) {
  if (this.ignore) return this;
  debug('incoming data %j', doc);
  this.emit('op', doc);
  this.emit(this.events[doc.op], doc);
  return this;
};

/**
 * Called upon stream end event.
 *
 * @return {Oplog} this
 * @api private
 */

oplog.onend = function onend() {
  debug('stream ended');
  this.emit('end');
  return this;
};

/**
 * Called upon stream error.
 *
 * @param {Error} error
 * @return {Oplog} this
 * @api private
 */

oplog.onerror = function onerror(err, fn) {
  if (!err || !err.stack) {
    err = new Error('Unknown error:' + err);
    if (fn) fn(err);
    else throw err;
  } else if (/cursor (killed or )?timed out/.test(err.message)) {
    debug('cursor timeout - re-tailing %j', err);
    this.tail();
  } else {
    debug('unknow error %j', err);
    this.emit('error', err);
    if (fn) fn(err);
  }
  return this;
};

/**
 * Export create method.
 *
 * @param {Object|String} conn
 * @param {Object} options
 * @return {Oplog}
 * @api public
 */

module.exports = function createOplog(conn, options) {
  return oplog.create(conn, options);
};
