// Code taken from https://github.com/scttnlsn/mubsub/blob/master/lib/promise.js

'use strict';

/**
 * Export `Promise`.
 */

module.exports = Promise;

/**
 * Promise constructor.
 *
 * @param {Object} context
 * @api private
 */
function Promise(context) {
  this.context = context || this;
  this.fns = [];
  this.resolved = undefined;
}

/**
 * Define fn which is called after promise gets resolved.
 *
 * @param {Function} fn
 * @return {Promise} this
 * @api private
 */

Promise.prototype.then = function then(fn) {
  if (this.resolved) {
    fn.apply(this.context, this.resolved);
  } else {
    this.fns.push(fn);
  }
  return this;
};

/**
 * Resolve promise - call all fns.
 * Arguments will be passed to the fns.
 *
 * @return {Promise} this
 * @api private
 */

Promise.prototype.resolve = function resolve() {
  if (this.resolved) throw new Error('Promise already resolved');

  var fn;
  this.resolved = arguments;

  while (fn = this.fns.shift()) {
    fn.apply(this.context, this.resolved);
  }
  return this;
};