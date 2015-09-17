'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var MongoClient = require('mongodb').MongoClient;
var MongoOplog = require('../');
var oplog, db, opdb;
var conn = {
  mongo: 'mongodb://127.0.0.1:27017/optest',
  oplog: 'mongodb://127.0.0.1:27017/local',
  error: 'mongodb://127.0.0.1:8888/error'
};

describe('mongo-oplog', function () {

  before(function (done) {
    MongoClient.connect(conn.mongo, function (err, database) {
      if (err) return done(err);
      db = database;
      done();
    });
  });

  it('should be a function', function () {
    MongoOplog.should.be.a.Function;
  });

  it('should have required methods', function (done) {
    var oplog = MongoOplog(opdb);
    oplog.tail.should.be.a.Function;
    oplog.stop.should.be.a.Function;
    oplog.filter.should.be.a.Function;
    oplog.destroy.should.be.a.Function;
    done();
  });

  it('should accept mongodb object as connection', function (done) {
    MongoClient.connect(conn.oplog, function (err, db) {
      if (err) return done(err);
      var oplog = MongoOplog(db).tail(function (err) {
        if (err) return done(err);
        oplog.db.should.eql(db);
        done();
      });
    });
  });

  it('should emit `op` event', function (done) {
    var coll = db.collection('a');
    var oplog = MongoOplog(conn.oplog, { ns: 'optest.a' });
    oplog.on('op', function (doc) {
      doc.op.should.be.eql('i');
      doc.o.n.should.be.eql('JB');
      doc.o.c.should.be.eql(1);
      done();
    });
    oplog.tail(function (err) {
      if (err) return done(err);
      coll.insert({ n: 'JB', c: 1 }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should emit `insert` event', function (done) {
    var coll = db.collection('b');
    var oplog = MongoOplog(conn.oplog, { ns: 'optest.b' });
    oplog.on('insert', function (doc) {
      doc.op.should.be.eql('i');
      doc.o.n.should.be.eql('JBL');
      doc.o.c.should.be.eql(1);
      done();
    });
    oplog.tail(function (err) {
      if (err) return done(err);
      coll.insert({ n: 'JBL', c: 1 }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should emit `update` event', function (done) {
    var coll = db.collection('c');
    var oplog = MongoOplog(conn.oplog, { ns: 'optest.c' });
    oplog.on('update', function (doc) {
      doc.op.should.be.eql('u');
      doc.o.$set.n.should.be.eql('US');
      doc.o.$set.c.should.be.eql(7);
      done();
    });
    oplog.tail(function (err) {
      if (err) return done(err);
      coll.insert({ n: 'CR', c: 3 }, function (err) {
        if (err) return done(err);
        coll.update({ n: 'CR', c: 3 }, { $set: { n: 'US', c: 7 } }, function (err) {
          if (err) return done(err);
        });
      });
    });
  });

  it('should emit `delete` event', function (done) {
    this.timeout(0);
    var coll = db.collection('d');
    var oplog = MongoOplog(opdb, { ns: 'optest.d' });
    oplog.tail(function (err) {
      if (err) return done(err);
      coll.insert({ n: 'PM', c: 4 }, function (err, doc) {
        if (err) return done(err);
        var id = (doc.ops || doc)[0]._id;
        oplog.on('delete', function (doc) {
          doc.op.should.be.eql('d');
          doc.o._id.should.be.eql(id);
          done();
        });
        coll.remove({ n: 'PM', c: 4 }, function (err) {
          if (err) return done(err);
        });
      });
    });
  });

  it('should emit cursor `end` event', function (done) {
    var oplog = MongoOplog(conn.oplog);
    oplog.tail(function (err, cursor) {
      if (err) return done(err);
      oplog.once('end', done);
      cursor.emit('end');
    });
    
  });

  it('should emit `error` event', function (done) {
    var oplog = MongoOplog(conn.error).tail();
    oplog.on('error', function (err) {
      err.should.be.an.Error;
      done();
    });
  });

  it('should filter by collection', function (done) {
    var e1 = db.collection('e1');
    var e2 = db.collection('e2');
    var oplog = MongoOplog(conn.oplog);

    var filter = oplog.filter('*.e1');

    filter.on('op', function(doc) {
      doc.o.n.should.be.eql('L1');
      done();
    });

    oplog.tail(function (err) {
      if (err) return done(err);
      e1.insert({ n: 'L1' }, function (err) {
        if (err) return done(err);
      });
      e2.insert({ n: 'L1' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should filter by the exact namespace', function(done){
    var cs = db.collection('cs');
    var css = db.collection('css');
    var oplog = MongoOplog(conn.oplog);

    var filter = oplog.filter('optest.cs');

    filter.on('op', function(doc) {
      if ('L1' !== doc.o.n) done('should not throw');
      else done();
    });

    oplog.tail(function (err) {
      if (err) return done(err);
      css.insert({ n: 'L2' }, function(err) {
        if (err) return done(err);
        cs.insert({ n: 'L1' }, function(err) {
          if (err) return done(err);
        });
      });
    });
  });

  it('should filter by namespace in constructor', function (done) {
    var f1 = db.collection('f1');
    var f2 = db.collection('f2');
    var oplog = MongoOplog(null, { ns: '*.f1' });
    oplog.on('op', function (doc) {
      doc.o.n.should.be.eql('L2');
      done();
    });
    oplog.tail(function (err) {
      if (err) return done(err);
      f1.insert({ n: 'L2' }, function (err) {
        if (err) return done(err);
      });
      f2.insert({ n: 'L2' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should destroy filter', function (done) {
    var coll = db.collection('g');
    var oplog = MongoOplog(conn.oplog);
    var filter = oplog.filter('*.g');
    filter.on('op', function(doc) {
      filter.destroy();
      done();
    });
    oplog.tail(function (err) {
      if (err) return done(err);
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should stop tailing', function (done) {
    var coll = db.collection('h');
    var oplog = MongoOplog(conn.oplog, { ns: '*.h' });
    oplog.on('op', function (doc) {
      oplog.stop();
      done();
    });
    oplog.tail(function (err){
      if (err) return done(err);
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should destroy oplog', function (done) {
    var coll = db.collection('i');
    var oplog = MongoOplog(conn.oplog);
    oplog.on('op', function (doc) {
      oplog.destroy(done);
    });
    oplog.tail(function (err){
      if (err) return done(err);
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should ignore oplog op events', function (done) {
    var coll = db.collection('j');
    var oplog = MongoOplog(conn.oplog, { ns: '*.j' });
    oplog.on('op', function (doc) {
      oplog.ignore = true;
      done();
    });
    oplog.tail(function (err){
      if (err) return done(err);
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should ignore filter op events', function (done) {
    var coll = db.collection('k');
    var oplog = MongoOplog(conn.oplog);
    var filter = oplog.filter('*.k');

    filter.on('op', function(doc) {
      filter.ignore = true;
      done();
    });

    oplog.tail(function (err) {
      if (err) return done(err);
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should stop tailing', function (done) {
    var coll = db.collection('h');
    var oplog = MongoOplog(conn.oplog, { ns: '*.h' });
    oplog.on('op', function (doc) {
      oplog.stop();
      done();
    });
    oplog.tail(function (err){
      if (err) return done(err);
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
      coll.insert({ n: 'CR' }, function (err) {
        if (err) return done(err);
      });
    });
  });

  it('should start from last ts when re-tailing', function (done) {
    var c = 0;
    var coll = db.collection('i');
    var oplog = MongoOplog(conn.oplog, { ns: 'optest.i' });
    oplog.on('op', function (doc) {
      (++c).should.be.equal(doc.o.c);
      if (6 === c) done();
    });
    oplog.tail(function() {
      coll.insert({ c: 1 });
      coll.insert({ c: 2 });
      coll.insert({ c: 3 });
      setTimeout(function () {
        oplog.stop(function() {
          oplog.tail(function() {
            setTimeout(function () {
              coll.insert({ c: 4 });
              coll.insert({ c: 5 });
              coll.insert({ c: 6 });
              oplog.stop(function() {
                oplog.tail();
              }); 
            }, 50);
          });
        }); 
      }, 50);
    });
  });

  after(function (done) {
    db.dropDatabase(function () {
      db.close(done);
    });
  });

});
