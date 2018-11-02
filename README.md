# logloglog

Simplistic stdout JSON logger for serverless and dockerized environments with metadata logging in mind. Focuses on delivering the logs with enough metadata, to the host to parse and ship. Metadata fields are typecasted by default, which will reduce some ELK mapping headachess.

## Examples

```
const { getLogger } = require('logloglog'); 
const logger = getLogger('my-logger');

logger.info('My first message');

const foo = 'baa';
logger.info('My message with variables', foo, '. Fun right!');
/*
{
  "@timestamp":"2018-11-02T20:08:49.160Z",
  "message": "My message with variables baa . Fun right!",
  "logger_name": "my-logger",
  "level": "info"
}
*/

const err = new Error('nasty error!');
logger.warn('Something nasty happened', err);
/*
{
  "@timestamp":"2018-11-02T20:08:49.160Z",
  "message": "Something nasty happened (Error: nasty error!)",
  "logger_name": "my-logger",
  "level": "warn",
  "error__object": {
    "message__string": "nasty error!",
    "stack__string": "Error: nasty error!\n    at Object.<anonymous> (/home/joona/github/logloglog/example.js:9:13)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)\n    at Function.Module._load (module.js:497:3)\n    at Function.Module.runMain (module.js:693:10)\n    at startup (bootstrap_node.js:188:16)\n    at bootstrap_node.js:609:3",
    "full_message__string": "Error: nasty error!"
  }
}
*/

const metadata = {
  foo: 'baa',
  number: 1,
  arr: ['a', 'b', 'c'],
  stuff: {
    works: true
  }
};
logger.info('Also logs meaningful metadata', metadata);
/*
{
  "@timestamp":"2018-11-02T20:08:49.160Z",
  "message": "Also logs meaningful metadata",
  "logger_name": "my-logger",
  "level": "info",
  "foo__string": "baa",
  "number__number": 1,
  "arr__array": [
    "a",
    "b",
    "c"
  ],
  "stuff__object": {
    "works__boolean": true
  }
}
*/

const context = {
  user_id: 'foo-1',
  request_id: 1337,
  url: '/cool',
}

// NOTE: MDC fields are not typecasted!
const contextual = logger.update(context);
contextual.log('Look ma, I can do MDC too!', { noice: { watch: 'https://www.youtube.com/watch?v=UBX8MWYel3s' }});
/*
{
  "@timestamp":"2018-11-02T20:08:49.160Z",
  "user_id": "foo-1",
  "url": "/cool",
  "request_id": 1337,
  "message": "Look ma, I can do MDC too!",
  "logger_name": "my-logger",
  "level": "info",
  "noice__object": {
    "watch__string": "https://www.youtube.com/watch?v=UBX8MWYel3s"
  }
}
*/

logger.info('Nice, right?');
// { "@timestamp":"2018-11-02T20:08:49.160Z", "message":"Nice, right?","logger_name":"my-logger","level":"info"}

const another = getLogger('another', {
  environment: 'production',
});

another.debug('Also with static fields');
/*
{
  "environment": "production",
  "message": "Also with static fields",
  "logger_name": "another",
  "level": "debug",
  "@timestamp": "2018-11-02T20:09:42.974Z"
}
*/

const logloglog = require('logloglog');
logloglog.config.timestamp = 'mytimestampfield';
logloglog.config.typecast = false;

const yetAnother = getLogger('configured-logger');
yetAnother.log('Custom timestamp field and typecasting disabled', {
  bool: false,
  str: 'beware picky ELK mappings!',
  arr: [1, 2, 3]
});
/*
{
  "message": "Custom timestamp field and typecasting disabled",
  "logger_name": "configured-logger",
  "level": "info",
  "mytimestampfield": "2018-11-02T20:13:12.517Z",
  "bool": false,
  "str": "beware picky ELK mappings!",
  "arr": [
    1,
    2,
    3
  ]
}
*/
```
