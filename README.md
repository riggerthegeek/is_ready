# Is Ready

A simple script to check if an endpoint is up yet

# Usage

You can use this in a couple of ways:
 - Command line application
 - NodeJS modules
 - A [Docker container](https://hub.docker.com/r/riggerthegeek/is_ready)
 
The basic usage is the same in all three ways, with the following parameters:
 - **endpoint**: This is the endpoint that we're testing is up. This is a required field.
 - **exponential**: The timeout grows exponentially (eg, 1, 2, 4, 8, 16). Default is `false`.
 - **timeout**: How long to wait between tries, in milliseconds. Default is `1000`.
 - **tries**: Number of times to try before failing. Default is `30`.

> Be careful with exponential growth. An exponential 1 second timeout, run 30 times will end up running for nearly
> 70 years (2147483647000 milliseconds to be precise).
 
## Command Line Application

> You will need NodeJS installed to use the command line application

The command is `is_ready check <endpoint>`.

```
is_ready.js check <endpoint>

Options:
  --endpoint         The endpoint to check
  --exponential, -e  Makes the timeout grows exponentially (eg, 1, 2, 4, 8, 16)
                                                      [boolean] [default: false]
  --timeout          How long to wait between tries, in milliseconds
                                                        [number] [default: 1000]
  --tries            Number of times to try before failing[number] [default: 30]
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]
```

## NodeJS

You can use this inside a NodeJS application. Make sure you listen for the `end` event, which will receive the up
status. You can also listen for a `log` event that tells you what it's doing.

```
const Ready = require('is_ready');

const endpoint = 'url-to-check.com:8080';
const opts = {
  exponential: false,
  timeout: 1000,
  tries: 30
};

const obj = Ready.isReady(endpoint, opts);

obj.on('end', status => {
  if (!status) {
    process.exit(1);
  }
});
```
