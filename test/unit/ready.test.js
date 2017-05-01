/**
 * is_ready.test
 */

'use strict';

/* Node modules */
const EventEmitter = require('events').EventEmitter;

/* Third-party modules */

/* Files */
const setup = require('../helpers/setup');

const expect = setup.expect;
const proxyquire = setup.proxyquire;
const sinon = setup.sinon;

describe('Ready class', function () {

  beforeEach(function () {
    this.socketInst = {
      connect: sinon.stub(),
      end: sinon.spy(),
      on: sinon.stub(),
      setTimeout: sinon.stub()
    };

    this.socketInst.on.returns(this.socketInst);

    this.Socket = sinon.stub();

    this.net = {
      Socket: this.Socket.returns(this.socketInst)
    };

    this.Ready = proxyquire('src/ready', {
      'net': this.net
    });
  });

  describe('#constructor', function () {

    it('should throw an error if no endpoint', function () {

      let fail = false;

      try {
        new this.Ready();
      } catch (err) {
        fail = true;

        expect(err).to.be.instanceof(SyntaxError);
        expect(err.message).to.be.equal('Endpoint is a required field');
      } finally {
        expect(fail).to.be.true;
      }

    });

    it('should extend the EventEmitter and use default params', function () {

      const obj = new this.Ready('some url');

      expect(obj).to.be.instanceof(this.Ready)
        .instanceof(EventEmitter);

      expect(obj.attempts).to.be.equal(0);
      expect(obj.opts).to.be.eql({
        endpoint: 'some url',
        exponential: this.Ready.exponential,
        timeout: this.Ready.timeout,
        tries: this.Ready.tries
      });
      expect(obj.running).to.be.false;

    });

    it('should use some defined params', function () {

      const obj = new this.Ready('some url2', {
        timeout: 1234
      });

      expect(obj).to.be.instanceof(this.Ready)
        .instanceof(EventEmitter);

      expect(obj.attempts).to.be.equal(0);
      expect(obj.opts).to.be.eql({
        endpoint: 'some url2',
        exponential: false,
        timeout: 1234,
        tries: 30
      });
      expect(obj.running).to.be.false;

    });

    it('should use all defined params', function () {

      const obj = new this.Ready('some url2', {
        exponential: true,
        timeout: 1234,
        tries: 12
      });

      expect(obj).to.be.instanceof(this.Ready)
        .instanceof(EventEmitter);

      expect(obj.attempts).to.be.equal(0);
      expect(obj.opts).to.be.eql({
        endpoint: 'some url2',
        exponential: true,
        timeout: 1234,
        tries: 12
      });
      expect(obj.running).to.be.false;

    });

  });

  describe('Methods', function () {

    beforeEach(function () {
      this.exp = new this.Ready('someUrl', {
        exponential: true
      });

      this.linear = new this.Ready('someOtherUrl');

      expect(this.exp.opts.exponential).to.be.true;
      expect(this.linear.opts.exponential).to.be.false;
    });

    describe('#exec', function () {

      beforeEach(function () {
        this.obj = new this.Ready('localhost:8080', {
          timeout: 10
        });

        this.emit = sinon.spy(this.obj, 'emit');
      });

      it('should simulate an executed query', function (done) {

        expect(this.obj.exec()).to.be.equal(this.obj);

        setTimeout(() => {

          expect(this.Socket).to.be.calledOnce
            .calledWithNew
            .calledWithExactly();

          expect(this.socketInst.setTimeout).to.be.calledOnce
            .calledWithExactly(this.obj.timeout());

          expect(this.emit).to.be.calledOnce
            .calledWithExactly('log', 'Attempt 1');

          expect(this.socketInst.on).to.be.calledThrice
            .calledWith('connect')
            .calledWith('error')
            .calledWith('close');

          const on = this.socketInst.on.args.reduce((result, item) => {
            result[item[0]] = item[1];
            return result;
          }, {});

          /* An error */
          on.close(true);

          expect(this.emit).to.be.calledTwice
            .calledWithExactly('unready');

          /* Success */
          on.connect();

          on.close();

          expect(this.emit).to.be.calledThrice
            .calledWithExactly('ready');

          on.error({ message: 'some error' });

          expect(this.emit).to.be.callCount(4)
            .calledWithExactly('log', 'Cannot connect - some error');

          expect(this.socketInst.connect).to.be.calledOnce
            .calledWith(8080, 'localhost');

          const connect = this.socketInst.connect.args[0][2];

          connect();

          expect(this.socketInst.end).to.be.calledOnce
            .calledWithExactly();

          done();

        }, this.obj.timeout());

      });

    });

    describe('#timeout', function () {

      it('should calculate an exponential timeout', function () {
        for (let attempt = 0; attempt <= 10; attempt++) {
          this.exp.attempts = attempt;

          expect(this.exp.timeout()).to.be.equal(this.exp.opts.timeout * Math.pow(2, attempt));
        }
      });

      it('should calculate a linear timeout', function () {
        for (let attempt = 0; attempt <= 10; attempt++) {
          this.linear.attempts = attempt;

          expect(this.linear.timeout()).to.be.equal(this.linear.opts.timeout);
        }
      });

    });

    describe('#test', function () {

      beforeEach(function () {
        this.obj = new this.Ready('someUrl');

        this.exec = sinon.stub(this.obj, 'exec');
        this.emit = sinon.spy(this.obj, 'emit');
      });

      it('should simulate a valid first time query', function (done) {

        this.obj.on('end', status => {
          expect(status).to.be.true;

          expect(this.obj.attempts).to.be.equal(0);

          expect(this.exec).to.be.calledOnce
            .calledWithExactly();

          expect(this.emit).to.be.calledWithExactly('log', 'Ready');

          done();
        });

        expect(this.obj.test()).to.be.equal(this.obj);

        /* Trigger the ready */
        this.obj.emit('ready');

      });

      it('should simulate a valid second time query', function (done) {

        this.obj.once('end', status => {
          expect(status).to.be.true;

          expect(this.obj.attempts).to.be.equal(1);

          expect(this.exec).to.be.calledTwice
            .calledWithExactly();

          expect(this.emit).to.be.calledWithExactly('log', 'Not ready. Trying again in 1000ms');

          done();
        });

        expect(this.obj.test()).to.be.equal(this.obj);

        /* Trigger not ready */
        this.obj.emit('unready');

        this.obj.emit('ready');

      });

      it('should simulate a failed query', function (done) {

        this.obj.once('end', status => {
          expect(status).to.be.false;

          expect(this.obj.attempts).to.be.equal(30);

          expect(this.exec).to.be.callCount(30)
            .calledWithExactly();

          expect(this.emit).to.be.called
            .calledWithExactly('log', 'Not ready. Trying again in 1000ms')
            .calledWithExactly('log', 'Not ready and run out of attempts');

          done();
        });

        expect(this.obj.test()).to.be.equal(this.obj);

        for (let attempts = 0; attempts < this.obj.opts.tries; attempts++) {

          /* Trigger not ready */
          this.obj.emit('unready');

        }

      });

    });

  });

  describe('Static methods', function () {

    describe('#getters', function () {

      it('should return the exponential getter', function () {
        expect(this.Ready.exponential).to.be.false;
      });

      it('should return the timeout getter', function () {
        expect(this.Ready.timeout).to.be.equal(1000);
      });

      it('should return the tries getter', function () {
        expect(this.Ready.tries).to.be.equal(30);
      });

    });

    describe('#isReady', function () {

      it('should call the test with all the params', function () {
        /* Stop it triggering */
        sinon.stub(this.Ready.prototype, 'exec');

        const test = sinon.spy(this.Ready.prototype, 'test');

        const obj = this.Ready.isReady('someUrl', {
          exponential: true,
          timeout: 1234,
          tries: 2
        });

        expect(obj).to.be.instanceof(this.Ready)
          .instanceof(EventEmitter);

        expect(obj.opts).to.be.eql({
          endpoint: 'someUrl',
          exponential: true,
          timeout: 1234,
          tries: 2
        });
      });


    });

  });

});
