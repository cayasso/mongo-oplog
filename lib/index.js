'use strict';

/**
 * Module dependencies.
 */

var Connection = require('./connection')
  , Oplog = require('./oplog')
  , mongodb = require('mongodb');

/**
 * Create connection.
 *
 * @see Connection
 * @return {Connection}
 * @api public
 */

module.exports = exports = function connect(uri, options) {
  return new Connection(uri, options);
};

/**
 * Module version.
 *
 * @api public
 */

exports.version = require('../package').version;

/**
 * Expose Connection constructor.
 *
 * @api public
 */

exports.Connection = Connection;

/**
 * Expose Oplog constructor.
 *
 * @api public
 */

exports.Oplog = Oplog;

/**
 * Expose mongodb module.
 *
 * @api public
 */

exports.mongodb = mongodb;
