'use strict';

/**
 * Module dependencies.
 */

var MongoOplog = require('../')
  , mongoose = require('mongoose')
  , expect = require('expect.js')
  , Schema = mongoose.Schema
  , PeopleSchema
  , People
  , oplog
  , db;

describe('mongo-oplog', function () {

  before(function (done) {
    mongoose.connect('mongodb://127.0.0.1:27017/test');
    PeopleSchema = new Schema({
      name: String,
      num: Number,
      test: Boolean
    });
    People = mongoose.model('People', PeopleSchema);
    mongoose.connection.on('error', function (err) {
      done(err);
    });
    oplog = MongoOplog().tail(done);
  });

  it('should have required methods', function () {
    expect(oplog.tail).to.be.a('function');
    expect(oplog.stop).to.be.a('function');
  });

  it('should emit `op` event', function (done) {
    oplog.once('op', function (doc) {
      expect(doc.op).to.be('i');
      expect(doc.o.name).to.be.eql('JB');
      expect(doc.o.num).to.be.eql(1);
      done();
    });
    People.create({ name: 'JB', num: 1 }, function (err) {
      if (err) done(err);
    });
  });

  it('should emit `insert` event', function (done) {
    oplog.once('insert', function (doc) {
      expect(doc.op).to.be('i');
      expect(doc.o.name).to.be.eql('ML');
      expect(doc.o.num).to.be.eql(2);
      done();
    });
    People.create({ name: 'ML', num: 2 }, function (err) {
      if (err) done(err);
    });
  });

  it('should emit `update` event', function (done) {
    oplog.once('update', function (doc) {
      expect(doc.op).to.be('u');
      expect(doc.o.$set.name).to.be.eql('US');
      expect(doc.o.$set.num).to.be.eql(7);
      done();
    });
    People.create({ name: 'CR', num: 3 }, function (err) {
      if (err) return done(err);
      People.update({ name: 'CR', num: 3 }, { name: 'US', num: 7 }, function (err) {
        if (err) done(err);
      });
    });
  });

  it('should emit `delete` event', function (done) {
    People.create({ name: 'PM', num: 4 }, function (err, doc) {
      if (err) return done(err);
      var id = doc._id;
      oplog.once('delete', function (doc) {
        expect(doc.op).to.be('d');
        expect(doc.o._id).to.be.eql(id);
        done();
      });
      People.remove({ name: 'PM', num: 4 }, function (err) {
        if (err) done(err);
      });
    });
  });

  it('should emit `error` event', function (done) {
    var oplog = MongoOplog('mongodb://127.0.0.1:8888/local').tail();
    oplog.on('error', function (err) {
      done();
    });
  });

  it('should emit cursor `end` event', function (done) {
    var oplog = MongoOplog().tail(function (err, cursor) {
      if (err) return done(err);
      cursor.emit('end');
    });
    oplog.once('end', done);
  });

  after(function (done) {
    People.remove({}, function () {
      mongoose.disconnect();
      done();
    });
  });

});