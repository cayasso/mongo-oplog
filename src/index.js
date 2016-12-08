'use strict'

import Emitter from 'eventemitter3'
import { MongoClient } from 'mongodb'
import createFilter from './filter'
import createCursor from './cursor'
import createDebug from 'debug'

const MONGO_URI = 'mongodb://127.0.0.1:27017/local'

export const events = {
  i: 'insert',
  u: 'update',
  d: 'delete'
}

function back(fn) {
  return function(cb) {
    try {
      const val = fn(cb)
      if (val && 'function' === typeof val.then) {
        return val.then(val => cb(null, val)).catch(cb)
      }
      cb(null, val)
    } catch (err) {
      cb(err)
    }
  }
}

export default (uri, options = {}) => {
  const { ns, since = 0, coll, database = 'local', ...opts } = options
  const debug = createDebug('mongo-oplog')

  let opdb, db, stream
  let connected = false
  let oplog = new Emitter()
  let ts = since

  uri = uri || MONGO_URI

  if ('string' !== typeof uri) {
    if (uri && uri.collection) {
      db = opdb = uri
      connected = true
    } else {
      throw new Error('Invalid mongo db.')
    }
  }

  async function connect() {
    try {
      if (connected) return
      db = await MongoClient.connect(uri, opts)
      opdb = db.db(database)
      connected = true
    } catch(err) {
      onerror(err)
    }
  }

  async function tail() {
    debug('Connected to oplog database')
    await connect()
    const cursor = await createCursor({ db: opdb, ns, ts, coll })
    stream = cursor.stream()
    stream.on('end', onend)
    stream.on('data', ondata)
    stream.on('error', onerror)
    return stream
  }

  function filter(ns) {
    return createFilter(ns, oplog);
  }

  async function stop() {
    if (stream) stream.destroy()
    debug('streaming stopped')
    return oplog
  }

  async function destroy() {
    await connect()
    await stop()
    await db.close(true)
    connected = false
    return oplog
  }

  function ondata(doc) {
    if (oplog.ignore) return oplog
    debug('incoming data %j', doc)
    ts = doc.ts
    oplog.emit('op', doc)
    oplog.emit(events[doc.op], doc)
    return oplog
  }

  function onend() {
    debug('stream ended')
    oplog.emit('end')
    return oplog
  }

  function onerror(err) {
    if (/cursor (killed or )?timed out/.test(err.message)) {
      debug('cursor timeout - re-tailing %j', err);
      tail()
    } else {
      debug('oplog error %j', err)
      oplog.emit('error', err)
    }
  }

  return Object.assign(oplog, {
    db,
    filter,
    tail: back(tail),
    stop: back(stop),
    destroy: back(destroy)
  })
}
