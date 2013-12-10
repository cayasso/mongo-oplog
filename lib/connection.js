'use strict';

/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter
  , MongoClient = require('mongodb').MongoClient
  , Promise = require('./promise')
  , debug = require('debug')('MongoOplog:connection');

/**
 * Export `Connection`.
 */

module.exports = Connection;

/**
 * Connection constructor.
 *
 * @param {String|Db} [uri] string or Db instance
 * @param {Object} [options] mongo driver options
 * @api public
 */

function Connection(uri, options) {
  var connection = this;
  options = options || {};
  options.server = options.server || {};
  options.server.auto_reconnect != null || (options.server.auto_reconnect = true);
  if (!uri) uri = 'mongodb://127.0.0.1:27017/local';
  function connect(fn) {
    if (uri.collection) {
      connection.db = uri;
      fn(null, connection.db);
    } else {
      connection.connect(uri, options, fn);
    }
  }
  this.destroyed = false;
  this.promise = new Promise();
  connect(this.promise.resolve.bind(this.promise));
}

/**
 * Inherits from `EventEmitter`.
 */

Connection.prototype.__proto__ = Emitter.prototype;

/**
 * Connect to mongodb database.
 *
 * @param {String|Db} [uri] string or Db instance
 * @param {Object} [options] mongo driver options
 * @return {Oplog}
 * @api public
 */

Connection.prototype.connect = function connect(uri, options, fn) {
  var connection = this;
  MongoClient.connect(uri, options, function connect(err, db) {
    if (err) {
      debug('error connecting %j', err);
      return fn(err);
    }
    debug('successfully connected');
    connection.db = db;
    fn(null, db);
  });
  return this;
};

/**
 * Returns database connection.
 *
 * @return {DB}
 * @api public
 */

Connection.prototype.db = function (fn) {
  return this.promise.then(fn);
};

/**
 * Close connection.
 *
 * @param {Function} [fn]
 * @return {Connection} this
 * @api public
 */

Connection.prototype.close = function close(fn) {
  this.destroyed = true;
  debug('closing connection');
  this.db.close(fn);
  return this;
};