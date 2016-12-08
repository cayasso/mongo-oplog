'use strict'

import Timestamp from 'bson-timestamp'

export default async ({ db, ns, ts, coll }) =>  {
  if (!db) throw new Error('Mongo db is missing.');
  const cname = coll || 'oplog.rs'
  const query = {}
  coll = db.collection(cname)

  async function time() {
    let _ts = ts
    if (_ts) return 'number' !== typeof _ts ? _ts : Timestamp(0, _ts)
    const doc = await coll.find({}, { ts: 1 }).sort({ $natural: -1 }).limit(1).nextObject()
    return doc ? doc.ts : Timestamp(0, (Date.now()/1000 | 0))
  }

  function regex(pattern) {
    pattern = pattern || '*';
    pattern = pattern.replace(/[\*]/g, '(.*?)');
    return new RegExp(`^${pattern}`, 'i');
  }

  if (ns) query.ns = { $regex: regex(ns) }
  query.ts = { $gt: await time() }

  const cursor = coll.find(query)
  cursor.addCursorFlag('tailable', true)
  cursor.addCursorFlag('awaitData', true)
  cursor.addCursorFlag('oplogReplay', true)
  cursor.addCursorFlag('noCursorTimeout', true)
  cursor.setCursorOption('numberOfRetries', Number.MAX_VALUE)
  return cursor
}
