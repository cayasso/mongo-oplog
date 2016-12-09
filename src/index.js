'use strict'

import Emitter from 'eventemitter3'
import { MongoClient } from 'mongodb'
import createDebug from 'debug'
import createFilter from './filter'
import createStream from './stream'

const MONGO_URI = 'mongodb://127.0.0.1:27017/local'
const debug = createDebug('mongo-oplog')
export const events = {
  i: 'insert',
  u: 'update',
  d: 'delete'
}
const noop = () => {}
const back = fn => cb => {
  try {
    const val = fn(cb)
    if (!cb) return val
    else if (val && typeof val.then === 'function') {
      return val.then(val => cb(null, val)).catch(cb)
    }
    cb(null, val)
  } catch (err) {
    cb(err)
  }
}

export default (uri, options = {}) => {
  let db
  let stream
  let connected = false
  const { ns, since, coll, ...opts } = options
  const oplog = new Emitter()

  let ts = since || 0
  uri = uri || MONGO_URI

  if (typeof uri !== 'string') {
    if (uri && uri.collection) {
      db = uri
      connected = true
    } else {
      throw new Error('Invalid mongo db.')
    }
  }

  async function connect() {
    if (connected) return db
    db = await MongoClient.connect(uri, opts)
    connected = true
  }

  async function tail() {
    try {
      debug('Connected to oplog database')
      await connect()
      stream = await createStream({ ns, coll, ts, db })
      stream.on('end', onend)
      stream.on('data', ondata)
      stream.on('error', onerror)
      return stream
    } catch (err) {
      onerror(err)
    }
  }

  function filter(ns) {
    return createFilter(ns, oplog)
  }

  async function stop() {
    if (stream) stream.destroy()
    debug('streaming stopped')
    return oplog
  }

  async function destroy() {
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
      debug('cursor timeout - re-tailing %j', err)
      tail()
    } else {
      debug('oplog error %j', err)
      oplog.emit('error', err)
      throw err
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
