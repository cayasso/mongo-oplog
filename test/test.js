'use strict';

/**
 * Module dependencies.
 */

var MongoOplog = require('../')
  , mongoose = require('mongoose')
  , expect = require('expect.js')
  , Schema = mongoose.Schema
  , oplog
  , conn
  , db
  , A
  , B
  , C
  , CA;
  

describe('mongo-oplog', function () {

  before(function (done) {
    
    mongoose.connect('mongodb://127.0.0.1:27017/optest');
    conn = mongoose.connection;
    conn.on('error', done);

    A  = mongoose.model('A', new Schema({ n: String, c: Number }));
    B  = mongoose.model('B', new Schema({ n: String, c: Number }));
    C  = mongoose.model('C', new Schema({ n: String, c: Number }));
    CA = mongoose.model('CS.A', new Schema({ n: String, c: Number }));

    oplog = MongoOplog().tail(done);
  });

  it('should have required methods', function () {
    expect(oplog.tail).to.be.a('function');
    expect(oplog.stop).to.be.a('function');
  });

  it('should emit `op` event', function (done) {
    oplog.once('op', function (doc) {
      expect(doc.op).to.be('i');
      expect(doc.o.n).to.be.eql('JB');
      expect(doc.o.c).to.be.eql(1);
      done();
    });
    A.create({ n: 'JB', c: 1 }, function (err) {
      if (err) done(err);
    });
  });

  it('should emit `insert` event', function (done) {
    oplog.once('insert', function (doc) {
      expect(doc.op).to.be('i');
      expect(doc.o.n).to.be.eql('ML');
      expect(doc.o.c).to.be.eql(2);
      done();
    });
    A.create({ n: 'ML', c: 2 }, function (err) {
      if (err) done(err);
    });
  });

  it('should emit `update` event', function (done) {
    oplog.once('update', function (doc) {
      expect(doc.op).to.be('u');
      expect(doc.o.$set.n).to.be.eql('US');
      expect(doc.o.$set.c).to.be.eql(7);
      done();
    });
    A.create({ n: 'CR', c: 3 }, function (err) {
      if (err) return done(err);
      A.update({ n: 'CR', c: 3 }, { n: 'US', c: 7 }, function (err) {
        if (err) done(err);
      });
    });
  });

  it('should emit `delete` event', function (done) {
    A.create({ n: 'PM', c: 4 }, function (err, doc) {
      if (err) return done(err);
      var id = doc._id;
      oplog.once('delete', function (doc) {
        expect(doc.op).to.be('d');
        expect(doc.o._id).to.be.eql(id);
        done();
      });
      A.remove({ n: 'PM', c: 4 }, function (err) {
        if (err) done(err);
      });
    });
  });
  
  it('should stop returning op if opLog not running', function (done) {
    oplog.once('op', function (doc) {
      // we shouldn't receive a doc
      expect(!doc); 
      done()
    });
    oplog.running = false;
    A.create({ n: 'HI', c: 5 }, function (err) {
      if (err) done(err);
    });
  });

  it('should emit cursor `end` event', function (done) {
    var oplog = MongoOplog().tail(function (err, cursor) {
      if (err) return done(err);
      cursor.emit('end');
    });
    oplog.once('end', function(){
      done();
    });
  });


  it('should emit `error` event', function (done) {
    var oplog = MongoOplog('mongodb://127.0.0.1:8888/local').tail();
    oplog.on('error', function (err) {
      done();
    });
  });

  it('should filter by collection', function(done){
    var oplog = MongoOplog();
    oplog.filter('*.bs')
      .once('op', function(doc){
        expect(doc.o.n).to.be('L1');
        done();
      });
    oplog.tail(function () {
      A.create({ n: 'L1' }, function(){});
      B.create({ n: 'L1' }, function(){});
    });
  });

  it('should filter exactly by namespace', function(done){
    var oplog = MongoOplog();
    oplog.filter('optest.cs')
      .on('op', function(doc){
        if ('L1' !== doc.o.n) done('should not throw');
        else done();
      });
    oplog.tail(function () {
      CA.create({ n: 'L2' }, function(){
        C.create({ n: 'L1' }, function(){});
      });
    });
  });

  after(function (done) {
    conn.db.dropDatabase(done)
  });

});
