'use strict'

const should = require('should')
const { MongoClient } = require('mongodb')
const MongoOplog = require('../src/index')

const conn = {
  mongo: 'mongodb://127.0.0.1:27017/optest',
  oplog: 'mongodb://127.0.0.1:27017/local',
  error: 'mongodb://127.0.0.1:8888/error',
}

let dbclient
let db
let oplog

describe('mongo-oplog', function () {
  before(function (done) {
    MongoClient.connect(conn.mongo, function (err, client) {
      if (err) return done(err)
      dbclient = client
      db = client.db()
      done()
    })
  })

  it('should be a function', function () {
    should(MongoOplog).be.a.Function
  })

  it('should have required methods', function (done) {
    oplog = MongoOplog(conn.oplog)
    should(oplog.tail).be.a.Function
    should(oplog.stop).be.a.Function
    should(oplog.filter).be.a.Function
    should(oplog.destroy).be.a.Function
    done()
  })

  it('should accept mongodb object as connection', function (done) {
    MongoClient.connect(conn.oplog, function (err, client) {
      let tDb = client.db()
      if (err) return done(err)
      let toplog = MongoOplog(client)
      should(toplog.client).eql(client)
      tDb.dropDatabase(function () {
        client.close(done)
      })
    })
  })

  it('should emit `op` event', function (done) {
    const coll = db.collection('a')
    oplog = MongoOplog(conn.oplog, { ns: 'optest.a' })
    oplog.on('op', function (doc) {
      if (doc.op == 'c') return
      should(doc.op).be.eql('i')
      should(doc.o.n).be.eql('JB')
      should(doc.o.c).be.eql(1)
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'JB', c: 1 }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should emit `insert` event', function (done) {
    const coll = db.collection('b')
    oplog = MongoOplog(conn.oplog, { ns: 'optest.b' })
    oplog.on('insert', function (doc) {
      should(doc.op).be.eql('i')
      should(doc.o.n).be.eql('JBL')
      should(doc.o.c).be.eql(1)
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'JBL', c: 1 }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should emit `update` event', function (done) {
    const coll = db.collection('c')
    oplog = MongoOplog(conn.oplog, { ns: 'optest.c' })
    oplog.on('update', function (doc) {
      should(doc.op).be.eql('u')
      should(doc.o.$set.n).be.eql('US')
      should(doc.o.$set.c).be.eql(7)
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR', c: 3 }, function (err, doc) {
        if (err) return done(err)
        coll.update(
          { _id: { $exists: true }, n: 'CR', c: 3 },
          { $set: { n: 'US', c: 7 } },
          function (err) {
            if (err) return done(err)
          }
        )
      })
    })
  })

  it('should emit `delete` event', function (done) {
    this.timeout(0)
    const coll = db.collection('d')
    oplog = MongoOplog(conn.oplog, { ns: 'optest.d' })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'PM', c: 4 }, function (err, doc) {
        if (err) return done(err)
        var id = (doc.ops || doc)[0]._id
        oplog.on('delete', function (doc) {
          should(doc.op).be.eql('d')
          should(doc.o._id).be.eql(id)
          done()
        })
        coll.remove({ _id: { $exists: true }, n: 'PM', c: 4 }, function (err) {
          if (err) return done(err)
        })
      })
    })
  })

  it('should emit cursor `end` event', function (done) {
    oplog = MongoOplog(conn.oplog)
    oplog.tail(function (err, stream) {
      if (err) return done(err)
      oplog.once('end', () => {
        done()
      })
      stream.emit('end')
    })
  })

  it('should emit `error` event', function (done) {
    oplog = MongoOplog(conn.error)
    oplog.tail()
    oplog.on('error', function (err) {
      should(err).be.an.Error
      done()
    })
  })

  it('should filter by collection', function (done) {
    const e1 = db.collection('e1')
    const e2 = db.collection('e2')
    oplog = MongoOplog(conn.oplog)

    const filter = oplog.filter('*.e1')

    filter.on('op', function (doc) {
      should(doc.o.n).be.eql('L1')
      done()
    })

    oplog.tail(function (err) {
      if (err) return done(err)
      e1.insert({ n: 'L1' }, function (err) {
        if (err) return done(err)
      })
      e2.insert({ n: 'L1' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should filter by the exact namespace', function (done) {
    const cs = db.collection('cs')
    const css = db.collection('css')
    oplog = MongoOplog(conn.oplog)
    const filter = oplog.filter('optest.cs')

    filter.on('op', function (doc) {
      if ('L1' !== doc.o.n) done('should not throw')
      else done()
    })

    oplog.tail(function (err) {
      if (err) return done(err)
      css.insert({ n: 'L2' }, function (err) {
        if (err) return done(err)
        cs.insert({ n: 'L1' }, function (err) {
          if (err) return done(err)
        })
      })
    })
  })

  it('should filter by namespace in constructor', function (done) {
    const f1 = db.collection('f1')
    const f2 = db.collection('f2')
    oplog = MongoOplog(conn.oplog, { ns: '*.f1' })
    oplog.on('op', function (doc) {
      should(doc.o.n).be.eql('L2')
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      f1.insert({ n: 'L2' }, function (err) {
        if (err) return done(err)
      })
      f2.insert({ n: 'L2' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should destroy filter', function (done) {
    const coll = db.collection('g')
    oplog = MongoOplog(conn.oplog)
    const filter = oplog.filter('*.g')
    filter.on('op', function (doc) {
      filter.destroy()
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should stop tailing', function (done) {
    const coll = db.collection('h')
    oplog = MongoOplog(conn.oplog, { ns: '*.h' })
    oplog.on('op', function (doc) {
      oplog.stop()
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should destroy oplog', function (done) {
    const coll = db.collection('i')
    oplog = MongoOplog(conn.oplog)
    oplog.on('op', function (doc) {
      oplog.destroy(done)
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should ignore oplog op events', function (done) {
    const coll = db.collection('j')
    oplog = MongoOplog(conn.oplog, { ns: '*.j' })
    oplog.on('op', function (doc) {
      oplog.ignore = true
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should ignore filter op events', function (done) {
    const coll = db.collection('k')
    oplog = MongoOplog(conn.oplog)
    const filter = oplog.filter('*.k')

    filter.on('op', function (doc) {
      filter.ignore = true
      done()
    })

    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should stop tailing', function (done) {
    const coll = db.collection('h')
    oplog = MongoOplog(conn.oplog, { ns: '*.h' })
    oplog.on('op', function (doc) {
      oplog.stop()
      done()
    })
    oplog.tail(function (err) {
      if (err) return done(err)
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err)
      })
    })
  })

  it('should start from last ts when re-tailing', function (done) {
    this.timeout(0)
    let c = 0
    const v = {}
    const coll = db.collection('i')
    oplog = MongoOplog(conn.oplog, { ns: 'optest.i' })
    oplog.on('op', function (doc) {
      v[doc.o.c] = 1
      should(Object.keys(v).length).be.equal(++c)
      if (6 === c) done()
      else if (c > 6) done('Not valid')
    })

    oplog.tail(function () {
      coll.insert({ c: 1 })
      coll.insert({ c: 2 })
      coll.insert({ c: 3 })
      setTimeout(function () {
        oplog.stop(function () {
          coll.insert({ c: 4 })
          coll.insert({ c: 5 })
          coll.insert({ c: 6 })
          oplog.tail(function () {
            setTimeout(function () {
              oplog.stop(function () {
                oplog.tail()
              })
            }, 500)
          })
        })
      }, 500)
    })
  })

  it('should start re-tailing on timeout', function (done) {
    this.timeout(0)
    let c = 0
    const v = {}
    const coll = db.collection('n')
    const oplog = MongoOplog(conn.oplog, { ns: 'optest.n' })
    const values = {}
    const valueSize = 0
    oplog.on('op', function (doc) {
      v[doc.o.c] = 1
      should(Object.keys(v).length).be.equal(++c)
      if (6 === c) {
        setTimeout(function () {
          oplog.destroy(done)
        }, 100)
      } else if (c > 6) done('Not valid')
    })
    oplog.tail(function (err, stream) {
      coll.insert({ c: 1 })
      coll.insert({ c: 2 })
      coll.insert({ c: 3 })

      // Mimic a timeout error
      setTimeout(function () {
        stream.emit('error', {
          message: 'cursor killed or timed out',
          stack: {},
        })
        stream.close()
      }, 500)
      stream.on('error', function () {
        setTimeout(function () {
          coll.insert({ c: 4 })
          coll.insert({ c: 5 })
          coll.insert({ c: 6 })
        }, 500)
      })
    })
  })

  it('should not throw if `destroy` called before connecting', function (done) {
    oplog = MongoOplog()
    done()
  })

  afterEach(function (done) {
    if (oplog) oplog.destroy(done)
    else setTimeout(done, 10)
  })

  after(function (done) {
    db.dropDatabase(function () {
      dbclient.close(done)
    })
  })
})
