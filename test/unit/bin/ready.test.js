/**
 * ready.test
 */

/* Node modules */
const EventEmitter = require('events').EventEmitter;

/* Third-party modules */

/* Files */
const pkg = require('../../../package.json');
const setup = require('../../helpers/setup');

const expect = setup.expect;
const proxyquire = setup.proxyquire;
const sinon = setup.sinon;

describe('Ready binary', function () {

  beforeEach(function () {
    this.Ready = sinon.stub();
    this.yargs = {
      alias: sinon.stub(),
      command: sinon.stub(),
      help: sinon.stub(),
      showHelp: sinon.stub(),
      showHelpOnFail: sinon.stub(),
      usage: sinon.stub(),
      version: sinon.stub()
    };

    Object.keys(this.yargs).forEach(key => this.yargs[key].returns(this.yargs));

    this.yargs.argv = {
      _: []
    };

    this.bin = () => proxyquire('src/bin/ready', {
      '../ready': this.Ready,
      yargs: this.yargs
    });
  });

  it('should configure yargs', function () {

    expect(this.bin()).to.be.equal(this.yargs.argv);

    expect(this.yargs.alias).to.be.calledTwice
      .calledWithExactly('h', 'help')
      .calledWithExactly('v', 'version');

    expect(this.yargs.help).to.be.calledOnce
      .calledWithExactly('help');

    expect(this.yargs.version).to.be.calledOnce
      .calledWithExactly(pkg.version);

    expect(this.yargs.usage).to.be.calledOnce
      .calledWithExactly('$0 <cmd> [args]');

    /* No commands - show help */
    expect(this.yargs.showHelp).to.be.calledOnce;

  });

  it('should not show the help', function () {

    this.yargs.argv._.push('');

    expect(this.bin()).to.be.equal(this.yargs.argv);

    expect(this.yargs.showHelp).to.not.be.called;

  });

  describe('#check', function () {

    beforeEach(function () {

      this.obj = new EventEmitter();

      this.Ready.exponential = 'exp';
      this.Ready.timeout = 'timeout';
      this.Ready.tries = 'tries';
      this.Ready.allReady = sinon.stub()
        .returns(this.obj);

      this.bin();

      expect(this.yargs.command).to.be.calledOnce
        .calledWith('check <endpoints>', 'Check specific endpoints are ready', {
          exponential: {
            alias: 'e',
            default: 'exp',
            describe: 'Makes the timeout grows exponentially (eg, 1, 2, 4, 8, 16)',
            type: 'boolean'
          },
          timeout: {
            default: 'timeout',
            describe: 'How long to wait between tries, in milliseconds',
            type: 'number'
          },
          tries: {
            default: 'tries',
            describe: 'Number of times to try before failing',
            type: 'number'
          },
          endpoints: {
            describe: 'The endpoints to check. Can be a comma-separated value.'
          }
        });

    });

    it('should run a successful check', function () {

      const log = sinon.stub(console, 'log');

      const cmd = this.yargs.command.args[0][3];

      const args = {
        arg1: true,
        endpoints: 'localhost:1234'
      };

      expect(cmd(args)).to.be.undefined;

      expect(this.Ready.allReady).to.be.calledOnce
        .calledWithExactly(['localhost:1234'], args);

      this.obj.emit('end', true);

      this.obj.emit('log', 'some message', 'myEndpoint');

      expect(log).to.be.calledOnce
        .calledWithExactly('%s - %s', 'myEndpoint', 'some message');

      log.restore();

    });

    it('should run an unsuccessful check', function () {

      const exit = sinon.stub(process, 'exit');

      const cmd = this.yargs.command.args[0][3];

      const args = {
        arg1: true,
        endpoints: 'localhost:1234'
      };

      expect(cmd(args)).to.be.undefined;

      expect(this.Ready.allReady).to.be.calledOnce
        .calledWithExactly([
          'localhost:1234'
        ], args);

      this.obj.emit('end', false);

      expect(exit).to.be.calledOnce
        .calledWithExactly(1);

      exit.restore();

    });

  });

});
