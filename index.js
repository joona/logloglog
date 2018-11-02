const development = process.env.NODE_ENV === 'development';
const noLogging = !!process.env.NO_LOGGING;

const config = {
  typecast: true,
  timestamp: '@timestamp'
};

const levelMap = {
  warn: 'warn',
  error: 'error'
};

const decorateKey = (key, type) => {
  let suffix;
  let decorated = key;
  
  if(key.indexOf('__') > -1) {
    let parts = key.split('__');
    if (parts.length > 1) {
      suffix = parts.pop();
    }
    
    if(suffix && suffix !== type) {
      decorated = parts.join('__');
      decorated += "__" + type;
    }
  }
  
  if(!suffix) {
    decorated += "__" + type;
  }
  
  return decorated;
}

const typecastObject = (object, fields) => {
  if(config.typecast !== true) {
    return Object.assign(object, fields);
  }

  if(typeof fields !== "object") {
    throw new TypeError("fields argument should be an object");
  }

  let keys = Object.keys(fields);
  let keysLen = keys.length;
  for(var i = 0; i < keys.length; i++) {
    let key = keys[i];
    let val = fields[key];
    let newKey = key;

    let type = typeof val;
    if(val === null || val === undefined) {
      newKey = undefined;
    } else if(Array.isArray(val)) {
      newKey = decorateKey(key, 'array');
    } else if(type === 'object') {
      newKey = decorateKey(key, 'object');
      val = typecastObject({}, val);
    } else if(type === 'number') {
      let isFloat = Number(val) === val && val % 1 !== 0;
      if(isFloat === true) newKey = decorateKey(key, 'float');
      else newKey = decorateKey(key, 'number');
    } else {
      newKey = decorateKey(key, type);
    }

    delete object[key];
    if(newKey !== undefined) {
      object[newKey] = val;
    }
  }
  return object;
};

const log = function (level, name, mdc, ...args) {
  if(noLogging == true) return;
  const event = Object.assign({}, mdc);
  const arr = [];
  const fields = {};

  for (var i = 0, len = args.length; i < len; i++) {
    if(args[i] instanceof Error) {
      console.log('args',i, 'is an error');
      let err = args[i];
      arr.push(`(Error: ${err.message})`);

      let errObject = {
        message: err.message,
        stack: err.stack,
        full_message: `${err.name}: ${err.message}`
      }

      if(err.status) errObject.status = err.status;
      if(err.metadata) errObject.metadata = err.metadata;
      Object.assign(fields, {error: errObject});
    } else if(typeof args[i] === 'object' && !Array.isArray(args[i])) {
      if(i < (len-1)) {
        arr.push(JSON.stringify(args[i]));
      } else {
        Object.assign(fields, args[i]);
      }
    } else if(Array.isArray(args[i])) {
      arr.push(args[i].toString());
    } else {
      arr.push(String(args[i]));
    }
  }

  Object.assign(event, {
    message: arr.join(' '),
    logger_name: name,
    level: level
  });

  if(config.timestamp !== false) {
    event[config.timestamp] = (new Date()).toISOString();
  } 

  typecastObject(event, fields);

  let logLevel = 'log';
  if(levelMap[level]) {
    logLevel = levelMap[level];
  }

  if(development) {
    console.log(new Date().toISOString(), `-- ${level} (${name}): `, arr.join(' '));
    if(process.env.DEBUG) {
      console[logLevel](JSON.stringify(event));
    }
  } else {
    console[logLevel](JSON.stringify(event));
  }
}

const injectMdc = (mdc, fields) => {
  Object.assign(mdc, fields);
}

const loggers = {};

const _createMdcLogger = function(name, fields = {}, mdc = {}) {
  return _createLogger(name, Object.assign({}, fields, mdc));
};

const _createLogger = function(name, fields = {}) {
  return {
    name: name, 
    update: _createMdcLogger.bind(this, name, fields),
    log: log.bind(this, 'info', name, fields),
    info: log.bind(this, 'info', name, fields),
    debug: log.bind(this, 'debug', name, fields),
    warn: log.bind(this, 'warn', name, fields),
    error: log.bind(this, 'error', name, fields)
  }
}

const createLogger = function(name, fields = {}) {
  loggers[name] = _createLogger(name, fields);
  return loggers[name];
}

const logger = module.exports = {
  config,

  typecast: typecastObject,

  getLogger(name, fields = {}) {
    return createLogger(name, fields);
  }
};
