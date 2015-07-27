'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mongo-oplog:filter');
var Emitter = require('eventemitter3');

/**
 * Core object inherited from emitter.
 * 
 * @type {Object}
 */

var filter = Object.create(Emitter.prototype);

/**
 * Create a filter object.
 * 
 * @param  {Object} options
 * @return {Filter}
 * @api public
 */

filter.create = function create(ns, oplog) {
  return Object.create(this).init(ns, oplog);
};

/**
 * Initialize filter object.
 * 
 * @param  {Object} options
 * @return {Filter}
 * @api private 
 */

filter.init = function init(ns, oplog) {
  this.ns = regex(ns || '*');
  this.oplog = oplog;
  debug('initializing filter with re %s', ns);
  this.onop = this.onop.bind(this);
  this.oplog.on('op', this.onop);
  return this;
};

/**
 * Called upon incoming data.
 *
 * @param {Object} op
 * @return {Oplog} this
 * @api private
 */

filter.onop = function onop(doc) {
  if (!this.ns.test(doc.ns) || this.ignore) return;
  debug('incoming data %j', doc);
  this.emit('op', doc);
  this.emit(this.oplog.events[doc.op], doc);
  return this;
};

/**
 * Destroy filter object.
 *
 * @api public
 */

filter.destroy = function destroy() {
  debug('removing filter bindings');
  this.oplog.off('op', this.onop);
  this.removeAllListeners();
  return this;
};

/**
 * Sets `ns` regexp.
 *
 * @param {String} ns name or pattern
 * @return {RegExp}
 * @api public
 */

function regex(pattern) {
  pattern = pattern.replace(/[\*]/g, '(.*?)');
  return new RegExp('^' + pattern + '$', 'i');
};

/**
 * Export filter object.
 *
 * @type {Filter}
 * @api public
 */

module.exports = filter;
