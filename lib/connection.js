'use strict';

/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter
  , MongoClient = require('mongodb').MongoClient
  , MongoOplog = require('./oplog');

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

  // It's a Db instance.
  if (uri.collection) {
    connection.db = uri;
  } else {
    MongoClient.connect(uri, options, function connect(err, db) {
      if (err) return connection.emit('error', err);
      connection.db = db;
      connection.emit('connect', db);
      db.on('error', function onerror(err) {
        connection.emit('error', err);
      });
    });
  }

  this.destroyed = false;
}

/**
 * Inherits from `EventEmitter`.
 */

Connection.prototype.__proto__ = Emitter.prototype;

/**
 * Returns a oplog with the passed name.
 *
 * @return {Oplog}
 * @api public
 */

Connection.prototype.start = function start(options) {
  return new MongoOplog(this, options);
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
  this.db.close(fn);
  return this;
};