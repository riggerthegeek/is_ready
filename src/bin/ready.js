#!/usr/bin/env node

/**
 * ready
 */

/* Node modules */

/* Third-party modules */
const yargs = require('yargs');

/* Files */
const Ready = require('../ready');
const pkg = require('../../package.json');

const cmd = yargs
    .usage('$0 <cmd> [args]')
    .command('check <endpoints>', 'Check specific endpoints are ready', {
      endpoints: {
        describe: 'The endpoints to check. Can be a comma-separated value.'
      },
      exponential: {
        alias: 'e',
        default: Ready.exponential,
        describe: 'Makes the timeout grows exponentially (eg, 1, 2, 4, 8, 16)',
        type: 'boolean'
      },
      timeout: {
        default: Ready.timeout,
        describe: 'How long to wait between tries, in milliseconds',
        type: 'number'
      },
      tries: {
        default: Ready.tries,
        describe: 'Number of times to try before failing',
        type: 'number'
      }
    }, argv => {
      const obj = Ready.allReady(argv.endpoints.split(','), argv);

      obj.on('end', status => {
        if (!status) {
          process.exit(1);
        }
      }).on('log', (message, endpoint) => console.log('%s - %s', endpoint, message));
    })
    .alias('h', 'help')
    .alias('v', 'version')
    .help('help')
    .version(pkg.version)
    .showHelpOnFail(true)
    .argv;

/* Display help message if nothing selected */
if (cmd._.length === 0) {
  yargs.showHelp();
}

module.exports = cmd;
