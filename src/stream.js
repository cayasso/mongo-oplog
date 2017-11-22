'use strict'

const { Timestamp } = require('mongodb')
const { regex } = require('./filter')

module.exports = async ({ db, ns, ts, coll }) => {
  if (!db) throw new Error('Mongo db is missing.')

  const query = {}

  coll = db.collection(coll || 'oplog.rs')

  async function time() {
    if (ts) return (typeof ts !== 'number') ? ts : Timestamp(0, ts)

    const doc = await coll
      .find({}, { ts: 1 })
      .sort({ $natural: -1 })
      .limit(1)
      .nextObject()

    return doc ? doc.ts : Timestamp(0, (Date.now() / 1000 | 0))
  }

  if (ns) query.ns = { $regex: regex(ns) }
  query.ts = { $gt: await time() }

  return (await coll.find(query, {
    tailable: true,
    awaitData: true,
    oplogReplay: true,
    noCursorTimeout: true,
    numberOfRetries: Number.MAX_VALUE
  })).stream()
}
