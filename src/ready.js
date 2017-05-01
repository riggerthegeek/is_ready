/**
 * is_ready
 */

'use strict';

/* Node modules */
const EventEmitter = require('events').EventEmitter;
const net = require('net');

/* Third-party modules */
const _ = require('lodash');

/* Files */

class Ready extends EventEmitter {
  constructor (endpoint, opts) {
    super();

    if (!endpoint) {
      throw new SyntaxError('Endpoint is a required field');
    }

    opts = opts || {};

    this.attempts = 0;
    this.opts = _.defaults({
      exponential: opts.exponential,
      timeout: opts.timeout,
      tries: opts.tries,
      endpoint
    }, {
      exponential: Ready.exponential,
      timeout: Ready.timeout,
      tries: Ready.tries
    });

    this.running = false;
  }

  /**
   * Exec
   *
   * Makes a socket connection and hits the
   * endpoint
   *
   * @returns {Ready}
   */
  exec () {
    this.running = true;

    setTimeout(() => {
      const parsed = this.opts.endpoint.split(':');

      const hostname = parsed[0];
      const port = Number(parsed[1]);

      this.emit('log', `Attempt ${this.attempts + 1}`);

      const socket = new net.Socket();

      socket.setTimeout(this.timeout());

      socket.on('error', err => {
        this.emit('log', `Cannot connect - ${err.message}`);
      }).on('close', errored => {
        /* Log the error */
        const status = errored ? 'unready' : 'ready';

        this.emit(status);
      });

      socket.connect(port, hostname, () => {
        socket.end();
      });
    }, this.timeout());

    return this;
  }

  /**
   * Timeout
   *
   * Calculates the timeout length
   *
   * @returns {number}
   */
  timeout () {
    let timeout = this.opts.timeout;

    if (this.opts.exponential) {
      timeout *= Math.pow(2, this.attempts);
    }

    return timeout;
  }

  /**
   * Test
   *
   * Tests if an endpoint is up and reruns it if not
   * until the maximum execution count has been exceeded
   *
   * @returns {Ready}
   */
  test () {
    /* Setup the listeners */
    this
      .on('ready', () => {
        /* Everything's ready */
        this.running = false;

        this.emit('log', 'Ready');

        this.emit('end', true);
      })
      .on('unready', () => {
        /* Increment the number of attempts */
        this.attempts += 1;

        if (this.attempts < this.opts.tries) {
          /* Let's try again */
          this.emit('log', `Not ready. Trying again in ${this.timeout()}ms`);

          return this.exec();
        }

        this.emit('log', 'Not ready and run out of attempts');

        this.running = false;

        this.emit('end', false);
      });

    /* Trigger for the first time */
    this.exec();

    return this;
  }

  static get exponential () {
    return false;
  }

  static get timeout () {
    return 1000;
  }

  static get tries () {
    return 30;
  }

  /**
   * Is Ready
   *
   * Factory method that everything should be using
   *
   * @param {string} endpoint
   * @param {*} opts
   * @returns {*}
   */
  static isReady (endpoint, opts) {
    const obj = new Ready(endpoint, opts);

    return obj.test();
  }
}

module.exports = Ready;
