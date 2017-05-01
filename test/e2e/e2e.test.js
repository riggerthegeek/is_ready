/**
 * e2e.test
 */

/* Node modules */

/* Third-party modules */
const Ready = require('../../src/ready');

/* Files */
const setup = require('../helpers/setup');

const expect = setup.expect;

describe('e2e tests', function () {

  this.timeout(Ready.timeout * Ready.tries);

  it('should not connect to invalid port on valid domain', function (done) {

    const obj = Ready.isReady('localhost:9999', {
      tries: 1
    });

    obj.on('end', status => {
      expect(status).to.be.false;

      done();
    });

  });

  it('should not connect to nonsense', function (done) {

    const obj = Ready.isReady('12rfegw23g3g2g3:9999', {
      tries: 1
    });

    obj.on('end', status => {
      expect(status).to.be.false;

      done();
    });

  });

  it('should connect to MongoDB', function (done) {

    const endpoint = process.env.MONGODB_HOST;

    const obj = Ready.isReady(endpoint);

    obj.on('end', status => {
      expect(status).to.be.true;

      done();
    });

  });

  it('should connect to MySQL', function (done) {

    const endpoint = process.env.MYSQL_HOST;

    const obj = Ready.isReady(endpoint);

    obj.on('end', status => {
      expect(status).to.be.true;

      done();
    });

  });

  it('should connect to PostgreSQL', function (done) {

    const endpoint = process.env.POSTGRES_HOST;

    const obj = Ready.isReady(endpoint);

    obj.on('end', status => {
      expect(status).to.be.true;

      done();
    });

  });

  it('should connect to RabbitMQ', function (done) {

    const endpoint = process.env.RABBITMQ_HOST;

    const obj = Ready.isReady(endpoint);

    obj.on('end', status => {
      expect(status).to.be.true;

      done();
    });

  });

  it('should connect to Redis', function (done) {

    const endpoint = process.env.REDIS_HOST;

    const obj = Ready.isReady(endpoint);

    obj.on('end', status => {
      expect(status).to.be.true;

      done();
    });

  });

});
