'use strict';

/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter
  , debug = require('debug')('MongoOplog:filter')
  , wildcard = require('wildcard')
  , events = require('./events');

/**
 * Module exports.
 */

module.exports = Filter;

/**
 * Filter.
 *
 * @param {Oplog} oplog instance
 * @api public
 */

function Filter(oplog, ns) {
  this.oplog = oplog;
  if (ns) this.ns(ns || null);
  this.bind();
}

/**
 * Inherits from `EventEmitter`.
 */

Filter.prototype.__proto__ = Emitter.prototype;

/**
 * Bind filter events.
 *
 * @return {Oplog} this
 * @api private
 */

Filter.prototype.bind = function bind() {
  if (!this.oplog) return this;
  debug('binding filter events');
  this.oplog.on('op', this.onop.bind(this));
  return this;
};

/**
 * Called up on oplog operation.
 *
 * @param {Object} doc
 * @return {Filter} this
 * @api private
 */

Filter.prototype.onop = function op(doc) {
  if (!this._ns || this._ns.match(doc.ns)) {
    this.emit('op', doc);
    this.emit(events[doc.op], doc);
  }
  return this;
};

/**
 * Sets a `ns` to filter by.
 *
 * @param {String} ns name or pattern
 * @return {Filter} this
 * @api public
 */

Filter.prototype.ns = function ns(ns) {
  this._ns = wildcard(ns);
  return this;
};