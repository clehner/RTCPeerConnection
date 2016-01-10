(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PeerConnection = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
var toSDP = require('./lib/tosdp');
var toJSON = require('./lib/tojson');


// Converstion from JSON to SDP

exports.toIncomingSDPOffer = function (session) {
    return toSDP.toSessionSDP(session, {
        role: 'responder',
        direction: 'incoming'
    });
};
exports.toOutgoingSDPOffer = function (session) {
    return toSDP.toSessionSDP(session, {
        role: 'initiator',
        direction: 'outgoing'
    });
};
exports.toIncomingSDPAnswer = function (session) {
    return toSDP.toSessionSDP(session, {
        role: 'initiator',
        direction: 'incoming'
    });
};
exports.toOutgoingSDPAnswer = function (session) {
    return toSDP.toSessionSDP(session, {
        role: 'responder',
        direction: 'outgoing'
    });
};
exports.toIncomingMediaSDPOffer = function (media) {
    return toSDP.toMediaSDP(media, {
        role: 'responder',
        direction: 'incoming'
    });
};
exports.toOutgoingMediaSDPOffer = function (media) {
    return toSDP.toMediaSDP(media, {
        role: 'initiator',
        direction: 'outgoing'
    });
};
exports.toIncomingMediaSDPAnswer = function (media) {
    return toSDP.toMediaSDP(media, {
        role: 'initiator',
        direction: 'incoming'
    });
};
exports.toOutgoingMediaSDPAnswer = function (media) {
    return toSDP.toMediaSDP(media, {
        role: 'responder',
        direction: 'outgoing'
    });
};
exports.toCandidateSDP = toSDP.toCandidateSDP;
exports.toMediaSDP = toSDP.toMediaSDP;
exports.toSessionSDP = toSDP.toSessionSDP;


// Conversion from SDP to JSON

exports.toIncomingJSONOffer = function (sdp, creators) {
    return toJSON.toSessionJSON(sdp, {
        role: 'responder',
        direction: 'incoming',
        creators: creators
    });
};
exports.toOutgoingJSONOffer = function (sdp, creators) {
    return toJSON.toSessionJSON(sdp, {
        role: 'initiator',
        direction: 'outgoing',
        creators: creators
    });
};
exports.toIncomingJSONAnswer = function (sdp, creators) {
    return toJSON.toSessionJSON(sdp, {
        role: 'initiator',
        direction: 'incoming',
        creators: creators
    });
};
exports.toOutgoingJSONAnswer = function (sdp, creators) {
    return toJSON.toSessionJSON(sdp, {
        role: 'responder',
        direction: 'outgoing',
        creators: creators
    });
};
exports.toIncomingMediaJSONOffer = function (sdp, creator) {
    return toJSON.toMediaJSON(sdp, {
        role: 'responder',
        direction: 'incoming',
        creator: creator
    });
};
exports.toOutgoingMediaJSONOffer = function (sdp, creator) {
    return toJSON.toMediaJSON(sdp, {
        role: 'initiator',
        direction: 'outgoing',
        creator: creator
    });
};
exports.toIncomingMediaJSONAnswer = function (sdp, creator) {
    return toJSON.toMediaJSON(sdp, {
        role: 'initiator',
        direction: 'incoming',
        creator: creator
    });
};
exports.toOutgoingMediaJSONAnswer = function (sdp, creator) {
    return toJSON.toMediaJSON(sdp, {
        role: 'responder',
        direction: 'outgoing',
        creator: creator
    });
};
exports.toCandidateJSON = toJSON.toCandidateJSON;
exports.toMediaJSON = toJSON.toMediaJSON;
exports.toSessionJSON = toJSON.toSessionJSON;

},{"./lib/tojson":8,"./lib/tosdp":9}],6:[function(require,module,exports){
exports.lines = function (sdp) {
    return sdp.split('\r\n').filter(function (line) {
        return line.length > 0;
    });
};

exports.findLine = function (prefix, mediaLines, sessionLines) {
    var prefixLength = prefix.length;
    for (var i = 0; i < mediaLines.length; i++) {
        if (mediaLines[i].substr(0, prefixLength) === prefix) {
            return mediaLines[i];
        }
    }
    // Continue searching in parent session section
    if (!sessionLines) {
        return false;
    }

    for (var j = 0; j < sessionLines.length; j++) {
        if (sessionLines[j].substr(0, prefixLength) === prefix) {
            return sessionLines[j];
        }
    }

    return false;
};

exports.findLines = function (prefix, mediaLines, sessionLines) {
    var results = [];
    var prefixLength = prefix.length;
    for (var i = 0; i < mediaLines.length; i++) {
        if (mediaLines[i].substr(0, prefixLength) === prefix) {
            results.push(mediaLines[i]);
        }
    }
    if (results.length || !sessionLines) {
        return results;
    }
    for (var j = 0; j < sessionLines.length; j++) {
        if (sessionLines[j].substr(0, prefixLength) === prefix) {
            results.push(sessionLines[j]);
        }
    }
    return results;
};

exports.mline = function (line) {
    var parts = line.substr(2).split(' ');
    var parsed = {
        media: parts[0],
        port: parts[1],
        proto: parts[2],
        formats: []
    };
    for (var i = 3; i < parts.length; i++) {
        if (parts[i]) {
            parsed.formats.push(parts[i]);
        }
    }
    return parsed;
};

exports.rtpmap = function (line) {
    var parts = line.substr(9).split(' ');
    var parsed = {
        id: parts.shift()
    };

    parts = parts[0].split('/');

    parsed.name = parts[0];
    parsed.clockrate = parts[1];
    parsed.channels = parts.length == 3 ? parts[2] : '1';
    return parsed;
};

exports.sctpmap = function (line) {
    // based on -05 draft
    var parts = line.substr(10).split(' ');
    var parsed = {
        number: parts.shift(),
        protocol: parts.shift(),
        streams: parts.shift()
    };
    return parsed;
};


exports.fmtp = function (line) {
    var kv, key, value;
    var parts = line.substr(line.indexOf(' ') + 1).split(';');
    var parsed = [];
    for (var i = 0; i < parts.length; i++) {
        kv = parts[i].split('=');
        key = kv[0].trim();
        value = kv[1];
        if (key && value) {
            parsed.push({key: key, value: value});
        } else if (key) {
            parsed.push({key: '', value: key});
        }
    }
    return parsed;
};

exports.crypto = function (line) {
    var parts = line.substr(9).split(' ');
    var parsed = {
        tag: parts[0],
        cipherSuite: parts[1],
        keyParams: parts[2],
        sessionParams: parts.slice(3).join(' ')
    };
    return parsed;
};

exports.fingerprint = function (line) {
    var parts = line.substr(14).split(' ');
    return {
        hash: parts[0],
        value: parts[1]
    };
};

exports.extmap = function (line) {
    var parts = line.substr(9).split(' ');
    var parsed = {};

    var idpart = parts.shift();
    var sp = idpart.indexOf('/');
    if (sp >= 0) {
        parsed.id = idpart.substr(0, sp);
        parsed.senders = idpart.substr(sp + 1);
    } else {
        parsed.id = idpart;
        parsed.senders = 'sendrecv';
    }

    parsed.uri = parts.shift() || '';

    return parsed;
};

exports.rtcpfb = function (line) {
    var parts = line.substr(10).split(' ');
    var parsed = {};
    parsed.id = parts.shift();
    parsed.type = parts.shift();
    if (parsed.type === 'trr-int') {
        parsed.value = parts.shift();
    } else {
        parsed.subtype = parts.shift() || '';
    }
    parsed.parameters = parts;
    return parsed;
};

exports.candidate = function (line) {
    var parts;
    if (line.indexOf('a=candidate:') === 0) {
        parts = line.substring(12).split(' ');
    } else { // no a=candidate
        parts = line.substring(10).split(' ');
    }

    var candidate = {
        foundation: parts[0],
        component: parts[1],
        protocol: parts[2].toLowerCase(),
        priority: parts[3],
        ip: parts[4],
        port: parts[5],
        // skip parts[6] == 'typ'
        type: parts[7],
        generation: '0'
    };

    for (var i = 8; i < parts.length; i += 2) {
        if (parts[i] === 'raddr') {
            candidate.relAddr = parts[i + 1];
        } else if (parts[i] === 'rport') {
            candidate.relPort = parts[i + 1];
        } else if (parts[i] === 'generation') {
            candidate.generation = parts[i + 1];
        } else if (parts[i] === 'tcptype') {
            candidate.tcpType = parts[i + 1];
        }
    }

    candidate.network = '1';

    return candidate;
};

exports.sourceGroups = function (lines) {
    var parsed = [];
    for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].substr(13).split(' ');
        parsed.push({
            semantics: parts.shift(),
            sources: parts
        });
    }
    return parsed;
};

exports.sources = function (lines) {
    // http://tools.ietf.org/html/rfc5576
    var parsed = [];
    var sources = {};
    for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].substr(7).split(' ');
        var ssrc = parts.shift();

        if (!sources[ssrc]) {
            var source = {
                ssrc: ssrc,
                parameters: []
            };
            parsed.push(source);

            // Keep an index
            sources[ssrc] = source;
        }

        parts = parts.join(' ').split(':');
        var attribute = parts.shift();
        var value = parts.join(':') || null;

        sources[ssrc].parameters.push({
            key: attribute,
            value: value
        });
    }

    return parsed;
};

exports.groups = function (lines) {
    // http://tools.ietf.org/html/rfc5888
    var parsed = [];
    var parts;
    for (var i = 0; i < lines.length; i++) {
        parts = lines[i].substr(8).split(' ');
        parsed.push({
            semantics: parts.shift(),
            contents: parts
        });
    }
    return parsed;
};

exports.bandwidth = function (line) {
    var parts = line.substr(2).split(':');
    var parsed = {};
    parsed.type = parts.shift();
    parsed.bandwidth = parts.shift();
    return parsed;
};

exports.msid = function (line) {
    var data = line.substr(7);
    var parts = data.split(' ');
    return {
        msid: data,
        mslabel: parts[0],
        label: parts[1]
    };
};

},{}],7:[function(require,module,exports){
module.exports = {
    initiator: {
        incoming: {
            initiator: 'recvonly',
            responder: 'sendonly',
            both: 'sendrecv',
            none: 'inactive',
            recvonly: 'initiator',
            sendonly: 'responder',
            sendrecv: 'both',
            inactive: 'none'
        },
        outgoing: {
            initiator: 'sendonly',
            responder: 'recvonly',
            both: 'sendrecv',
            none: 'inactive',
            recvonly: 'responder',
            sendonly: 'initiator',
            sendrecv: 'both',
            inactive: 'none'
        }
    },
    responder: {
        incoming: {
            initiator: 'sendonly',
            responder: 'recvonly',
            both: 'sendrecv',
            none: 'inactive',
            recvonly: 'responder',
            sendonly: 'initiator',
            sendrecv: 'both',
            inactive: 'none'
        },
        outgoing: {
            initiator: 'recvonly',
            responder: 'sendonly',
            both: 'sendrecv',
            none: 'inactive',
            recvonly: 'initiator',
            sendonly: 'responder',
            sendrecv: 'both',
            inactive: 'none'
        }
    }
};

},{}],8:[function(require,module,exports){
var SENDERS = require('./senders');
var parsers = require('./parsers');
var idCounter = Math.random();


exports._setIdCounter = function (counter) {
    idCounter = counter;
};

exports.toSessionJSON = function (sdp, opts) {
    var i;
    var creators = opts.creators || [];
    var role = opts.role || 'initiator';
    var direction = opts.direction || 'outgoing';


    // Divide the SDP into session and media sections.
    var media = sdp.split('\r\nm=');
    for (i = 1; i < media.length; i++) {
        media[i] = 'm=' + media[i];
        if (i !== media.length - 1) {
            media[i] += '\r\n';
        }
    }
    var session = media.shift() + '\r\n';
    var sessionLines = parsers.lines(session);
    var parsed = {};

    var contents = [];
    for (i = 0; i < media.length; i++) {
        contents.push(exports.toMediaJSON(media[i], session, {
            role: role,
            direction: direction,
            creator: creators[i] || 'initiator'
        }));
    }
    parsed.contents = contents;

    var groupLines = parsers.findLines('a=group:', sessionLines);
    if (groupLines.length) {
        parsed.groups = parsers.groups(groupLines);
    }

    return parsed;
};

exports.toMediaJSON = function (media, session, opts) {
    var creator = opts.creator || 'initiator';
    var role = opts.role || 'initiator';
    var direction = opts.direction || 'outgoing';

    var lines = parsers.lines(media);
    var sessionLines = parsers.lines(session);
    var mline = parsers.mline(lines[0]);

    var content = {
        creator: creator,
        name: mline.media,
        description: {
            descType: 'rtp',
            media: mline.media,
            payloads: [],
            encryption: [],
            feedback: [],
            headerExtensions: []
        },
        transport: {
            transType: 'iceUdp',
            candidates: [],
            fingerprints: []
        }
    };
    if (mline.media == 'application') {
        // FIXME: the description is most likely to be independent
        // of the SDP and should be processed by other parts of the library
        content.description = {
            descType: 'datachannel'
        };
        content.transport.sctp = [];
    }
    var desc = content.description;
    var trans = content.transport;

    // If we have a mid, use that for the content name instead.
    var mid = parsers.findLine('a=mid:', lines);
    if (mid) {
        content.name = mid.substr(6);
    }

    if (parsers.findLine('a=sendrecv', lines, sessionLines)) {
        content.senders = 'both';
    } else if (parsers.findLine('a=sendonly', lines, sessionLines)) {
        content.senders = SENDERS[role][direction].sendonly;
    } else if (parsers.findLine('a=recvonly', lines, sessionLines)) {
        content.senders = SENDERS[role][direction].recvonly;
    } else if (parsers.findLine('a=inactive', lines, sessionLines)) {
        content.senders = 'none';
    }

    if (desc.descType == 'rtp') {
        var bandwidth = parsers.findLine('b=', lines);
        if (bandwidth) {
            desc.bandwidth = parsers.bandwidth(bandwidth);
        }

        var ssrc = parsers.findLine('a=ssrc:', lines);
        if (ssrc) {
            desc.ssrc = ssrc.substr(7).split(' ')[0];
        }

        var rtpmapLines = parsers.findLines('a=rtpmap:', lines);
        rtpmapLines.forEach(function (line) {
            var payload = parsers.rtpmap(line);
            payload.parameters = [];
            payload.feedback = [];

            var fmtpLines = parsers.findLines('a=fmtp:' + payload.id, lines);
            // There should only be one fmtp line per payload
            fmtpLines.forEach(function (line) {
                payload.parameters = parsers.fmtp(line);
            });

            var fbLines = parsers.findLines('a=rtcp-fb:' + payload.id, lines);
            fbLines.forEach(function (line) {
                payload.feedback.push(parsers.rtcpfb(line));
            });

            desc.payloads.push(payload);
        });

        var cryptoLines = parsers.findLines('a=crypto:', lines, sessionLines);
        cryptoLines.forEach(function (line) {
            desc.encryption.push(parsers.crypto(line));
        });

        if (parsers.findLine('a=rtcp-mux', lines)) {
            desc.mux = true;
        }

        var fbLines = parsers.findLines('a=rtcp-fb:*', lines);
        fbLines.forEach(function (line) {
            desc.feedback.push(parsers.rtcpfb(line));
        });

        var extLines = parsers.findLines('a=extmap:', lines);
        extLines.forEach(function (line) {
            var ext = parsers.extmap(line);

            ext.senders = SENDERS[role][direction][ext.senders];

            desc.headerExtensions.push(ext);
        });

        var ssrcGroupLines = parsers.findLines('a=ssrc-group:', lines);
        desc.sourceGroups = parsers.sourceGroups(ssrcGroupLines || []);

        var ssrcLines = parsers.findLines('a=ssrc:', lines);
        var sources = desc.sources = parsers.sources(ssrcLines || []);

        var msidLine = parsers.findLine('a=msid:', lines);
        if (msidLine) {
            var msid = parsers.msid(msidLine);
            ['msid', 'mslabel', 'label'].forEach(function (key) {
                for (var i = 0; i < sources.length; i++) {
                    var found = false;
                    for (var j = 0; j < sources[i].parameters.length; j++) {
                        if (sources[i].parameters[j].key === key) {
                            found = true;
                        }
                    }
                    if (!found) {
                        sources[i].parameters.push({ key: key, value: msid[key] });
                    }
                }
            });
        }

        if (parsers.findLine('a=x-google-flag:conference', lines, sessionLines)) {
            desc.googConferenceFlag = true;
        }
    }

    // transport specific attributes
    var fingerprintLines = parsers.findLines('a=fingerprint:', lines, sessionLines);
    var setup = parsers.findLine('a=setup:', lines, sessionLines);
    fingerprintLines.forEach(function (line) {
        var fp = parsers.fingerprint(line);
        if (setup) {
            fp.setup = setup.substr(8);
        }
        trans.fingerprints.push(fp);
    });

    var ufragLine = parsers.findLine('a=ice-ufrag:', lines, sessionLines);
    var pwdLine = parsers.findLine('a=ice-pwd:', lines, sessionLines);
    if (ufragLine && pwdLine) {
        trans.ufrag = ufragLine.substr(12);
        trans.pwd = pwdLine.substr(10);
        trans.candidates = [];

        var candidateLines = parsers.findLines('a=candidate:', lines, sessionLines);
        candidateLines.forEach(function (line) {
            trans.candidates.push(exports.toCandidateJSON(line));
        });
    }

    if (desc.descType == 'datachannel') {
        var sctpmapLines = parsers.findLines('a=sctpmap:', lines);
        sctpmapLines.forEach(function (line) {
            var sctp = parsers.sctpmap(line);
            trans.sctp.push(sctp);
        });
    }

    return content;
};

exports.toCandidateJSON = function (line) {
    var candidate = parsers.candidate(line.split('\r\n')[0]);
    candidate.id = (idCounter++).toString(36).substr(0, 12);
    return candidate;
};

},{"./parsers":6,"./senders":7}],9:[function(require,module,exports){
var SENDERS = require('./senders');


exports.toSessionSDP = function (session, opts) {
    var role = opts.role || 'initiator';
    var direction = opts.direction || 'outgoing';
    var sid = opts.sid || session.sid || Date.now();
    var time = opts.time || Date.now();

    var sdp = [
        'v=0',
        'o=- ' + sid + ' ' + time + ' IN IP4 0.0.0.0',
        's=-',
        't=0 0',
        'a=msid-semantic: WMS *'
    ];

    var groups = session.groups || [];
    groups.forEach(function (group) {
        sdp.push('a=group:' + group.semantics + ' ' + group.contents.join(' '));
    });

    var contents = session.contents || [];
    contents.forEach(function (content) {
        sdp.push(exports.toMediaSDP(content, opts));
    });

    return sdp.join('\r\n') + '\r\n';
};

exports.toMediaSDP = function (content, opts) {
    var sdp = [];

    var role = opts.role || 'initiator';
    var direction = opts.direction || 'outgoing';

    var desc = content.description;
    var transport = content.transport;
    var payloads = desc.payloads || [];
    var fingerprints = (transport && transport.fingerprints) || [];

    var mline = [];
    if (desc.descType == 'datachannel') {
        mline.push('application');
        mline.push('1');
        mline.push('DTLS/SCTP');
        if (transport.sctp) {
            transport.sctp.forEach(function (map) {
                mline.push(map.number);
            });
        }
    } else {
        mline.push(desc.media);
        mline.push('1');
        if ((desc.encryption && desc.encryption.length > 0) || (fingerprints.length > 0)) {
            mline.push('RTP/SAVPF');
        } else {
            mline.push('RTP/AVPF');
        }
        payloads.forEach(function (payload) {
            mline.push(payload.id);
        });
    }


    sdp.push('m=' + mline.join(' '));

    sdp.push('c=IN IP4 0.0.0.0');
    if (desc.bandwidth && desc.bandwidth.type && desc.bandwidth.bandwidth) {
        sdp.push('b=' + desc.bandwidth.type + ':' + desc.bandwidth.bandwidth);
    }
    if (desc.descType == 'rtp') {
        sdp.push('a=rtcp:1 IN IP4 0.0.0.0');
    }

    if (transport) {
        if (transport.ufrag) {
            sdp.push('a=ice-ufrag:' + transport.ufrag);
        }
        if (transport.pwd) {
            sdp.push('a=ice-pwd:' + transport.pwd);
        }

        var pushedSetup = false;
        fingerprints.forEach(function (fingerprint) {
            sdp.push('a=fingerprint:' + fingerprint.hash + ' ' + fingerprint.value);
            if (fingerprint.setup && !pushedSetup) {
                sdp.push('a=setup:' + fingerprint.setup);
            }
        });

        if (transport.sctp) {
            transport.sctp.forEach(function (map) {
                sdp.push('a=sctpmap:' + map.number + ' ' + map.protocol + ' ' + map.streams);
            });
        }
    }

    if (desc.descType == 'rtp') {
        sdp.push('a=' + (SENDERS[role][direction][content.senders] || 'sendrecv'));
    }
    sdp.push('a=mid:' + content.name);

    if (desc.sources && desc.sources.length) {
        (desc.sources[0].parameters || []).forEach(function (param) {
            if (param.key === 'msid') {
                sdp.push('a=msid:' + param.value);
            }
        });
    }

    if (desc.mux) {
        sdp.push('a=rtcp-mux');
    }

    var encryption = desc.encryption || [];
    encryption.forEach(function (crypto) {
        sdp.push('a=crypto:' + crypto.tag + ' ' + crypto.cipherSuite + ' ' + crypto.keyParams + (crypto.sessionParams ? ' ' + crypto.sessionParams : ''));
    });
    if (desc.googConferenceFlag) {
        sdp.push('a=x-google-flag:conference');
    }

    payloads.forEach(function (payload) {
        var rtpmap = 'a=rtpmap:' + payload.id + ' ' + payload.name + '/' + payload.clockrate;
        if (payload.channels && payload.channels != '1') {
            rtpmap += '/' + payload.channels;
        }
        sdp.push(rtpmap);

        if (payload.parameters && payload.parameters.length) {
            var fmtp = ['a=fmtp:' + payload.id];
            var parameters = [];
            payload.parameters.forEach(function (param) {
                parameters.push((param.key ? param.key + '=' : '') + param.value);
            });
            fmtp.push(parameters.join(';'));
            sdp.push(fmtp.join(' '));
        }

        if (payload.feedback) {
            payload.feedback.forEach(function (fb) {
                if (fb.type === 'trr-int') {
                    sdp.push('a=rtcp-fb:' + payload.id + ' trr-int ' + (fb.value ? fb.value : '0'));
                } else {
                    sdp.push('a=rtcp-fb:' + payload.id + ' ' + fb.type + (fb.subtype ? ' ' + fb.subtype : ''));
                }
            });
        }
    });

    if (desc.feedback) {
        desc.feedback.forEach(function (fb) {
            if (fb.type === 'trr-int') {
                sdp.push('a=rtcp-fb:* trr-int ' + (fb.value ? fb.value : '0'));
            } else {
                sdp.push('a=rtcp-fb:* ' + fb.type + (fb.subtype ? ' ' + fb.subtype : ''));
            }
        });
    }

    var hdrExts = desc.headerExtensions || [];
    hdrExts.forEach(function (hdr) {
        sdp.push('a=extmap:' + hdr.id + (hdr.senders ? '/' + SENDERS[role][direction][hdr.senders] : '') + ' ' + hdr.uri);
    });

    var ssrcGroups = desc.sourceGroups || [];
    ssrcGroups.forEach(function (ssrcGroup) {
        sdp.push('a=ssrc-group:' + ssrcGroup.semantics + ' ' + ssrcGroup.sources.join(' '));
    });

    var ssrcs = desc.sources || [];
    ssrcs.forEach(function (ssrc) {
        for (var i = 0; i < ssrc.parameters.length; i++) {
            var param = ssrc.parameters[i];
            sdp.push('a=ssrc:' + (ssrc.ssrc || desc.ssrc) + ' ' + param.key + (param.value ? (':' + param.value) : ''));
        }
    });

    var candidates = transport.candidates || [];
    candidates.forEach(function (candidate) {
        sdp.push(exports.toCandidateSDP(candidate));
    });

    return sdp.join('\r\n');
};

exports.toCandidateSDP = function (candidate) {
    var sdp = [];

    sdp.push(candidate.foundation);
    sdp.push(candidate.component);
    sdp.push(candidate.protocol.toUpperCase());
    sdp.push(candidate.priority);
    sdp.push(candidate.ip);
    sdp.push(candidate.port);

    var type = candidate.type;
    sdp.push('typ');
    sdp.push(type);
    if (type === 'srflx' || type === 'prflx' || type === 'relay') {
        if (candidate.relAddr && candidate.relPort) {
            sdp.push('raddr');
            sdp.push(candidate.relAddr);
            sdp.push('rport');
            sdp.push(candidate.relPort);
        }
    }
    if (candidate.tcpType && candidate.protocol.toUpperCase() == 'TCP') {
        sdp.push('tcptype');
        sdp.push(candidate.tcpType);
    }

    sdp.push('generation');
    sdp.push(candidate.generation || '0');

    // FIXME: apparently this is wrong per spec
    // but then, we need this when actually putting this into
    // SDP so it's going to stay.
    // decision needs to be revisited when browsers dont
    // accept this any longer
    return 'a=candidate:' + sdp.join(' ');
};

},{"./senders":7}],10:[function(require,module,exports){
// based on https://github.com/ESTOS/strophe.jingle/
// adds wildemitter support
var util = require('util');
var adapter = require('webrtc-adapter-test');
var WildEmitter = require('wildemitter');

function dumpSDP(description) {
    return {
        type: description.type,
        sdp: description.sdp
    };
}

function dumpStream(stream) {
    var info = {
        label: stream.id,
    };
    if (stream.getAudioTracks().length) {
        info.audio = stream.getAudioTracks().map(function (track) {
            return track.id;
        });
    }
    if (stream.getVideoTracks().length) {
        info.video = stream.getVideoTracks().map(function (track) {
            return track.id;
        });
    }
    return info;
}

function TraceablePeerConnection(config, constraints) {
    var self = this;
    WildEmitter.call(this);

    this.peerconnection = new window.RTCPeerConnection(config, constraints);

    this.trace = function (what, info) {
        self.emit('PeerConnectionTrace', {
            time: new Date(),
            type: what,
            value: info || ""
        });
    };

    this.onicecandidate = null;
    this.peerconnection.onicecandidate = function (event) {
        self.trace('onicecandidate', event.candidate);
        if (self.onicecandidate !== null) {
            self.onicecandidate(event);
        }
    };
    this.onaddstream = null;
    this.peerconnection.onaddstream = function (event) {
        self.trace('onaddstream', dumpStream(event.stream));
        if (self.onaddstream !== null) {
            self.onaddstream(event);
        }
    };
    this.onremovestream = null;
    this.peerconnection.onremovestream = function (event) {
        self.trace('onremovestream', dumpStream(event.stream));
        if (self.onremovestream !== null) {
            self.onremovestream(event);
        }
    };
    this.onsignalingstatechange = null;
    this.peerconnection.onsignalingstatechange = function (event) {
        self.trace('onsignalingstatechange', self.signalingState);
        if (self.onsignalingstatechange !== null) {
            self.onsignalingstatechange(event);
        }
    };
    this.oniceconnectionstatechange = null;
    this.peerconnection.oniceconnectionstatechange = function (event) {
        self.trace('oniceconnectionstatechange', self.iceConnectionState);
        if (self.oniceconnectionstatechange !== null) {
            self.oniceconnectionstatechange(event);
        }
    };
    this.onnegotiationneeded = null;
    this.peerconnection.onnegotiationneeded = function (event) {
        self.trace('onnegotiationneeded');
        if (self.onnegotiationneeded !== null) {
            self.onnegotiationneeded(event);
        }
    };
    self.ondatachannel = null;
    this.peerconnection.ondatachannel = function (event) {
        self.trace('ondatachannel', event);
        if (self.ondatachannel !== null) {
            self.ondatachannel(event);
        }
    };
    this.getLocalStreams = this.peerconnection.getLocalStreams.bind(this.peerconnection);
    this.getRemoteStreams = this.peerconnection.getRemoteStreams.bind(this.peerconnection);
}

util.inherits(TraceablePeerConnection, WildEmitter);

['signalingState', 'iceConnectionState', 'localDescription', 'remoteDescription'].forEach(function (prop) {
    Object.defineProperty(TraceablePeerConnection.prototype, prop, {
        get: function () {
            return this.peerconnection[prop];
        }
    });
});

TraceablePeerConnection.prototype.addStream = function (stream) {
    this.trace('addStream', dumpStream(stream));
    this.peerconnection.addStream(stream);
};

TraceablePeerConnection.prototype.removeStream = function (stream) {
    this.trace('removeStream', dumpStream(stream));
    this.peerconnection.removeStream(stream);
};

TraceablePeerConnection.prototype.createDataChannel = function (label, opts) {
    this.trace('createDataChannel', label, opts);
    return this.peerconnection.createDataChannel(label, opts);
};

TraceablePeerConnection.prototype.setLocalDescription = function (description, successCallback, failureCallback) {
    var self = this;
    this.trace('setLocalDescription', dumpSDP(description));
    this.peerconnection.setLocalDescription(description,
        function () {
            self.trace('setLocalDescriptionOnSuccess');
            if (successCallback) successCallback();
        },
        function (err) {
            self.trace('setLocalDescriptionOnFailure', err);
            if (failureCallback) failureCallback(err);
        }
    );
};

TraceablePeerConnection.prototype.setRemoteDescription = function (description, successCallback, failureCallback) {
    var self = this;
    this.trace('setRemoteDescription', dumpSDP(description));
    this.peerconnection.setRemoteDescription(description,
        function () {
            self.trace('setRemoteDescriptionOnSuccess');
            if (successCallback) successCallback();
        },
        function (err) {
            self.trace('setRemoteDescriptionOnFailure', err);
            if (failureCallback) failureCallback(err);
        }
    );
};

TraceablePeerConnection.prototype.close = function () {
    this.trace('stop');
    if (this.peerconnection.signalingState != 'closed') {
        this.peerconnection.close();
    }
};

TraceablePeerConnection.prototype.createOffer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createOffer', constraints);
    this.peerconnection.createOffer(
        function (offer) {
            self.trace('createOfferOnSuccess', dumpSDP(offer));
            if (successCallback) successCallback(offer);
        },
        function (err) {
            self.trace('createOfferOnFailure', err);
            if (failureCallback) failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.createAnswer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createAnswer', constraints);
    this.peerconnection.createAnswer(
        function (answer) {
            self.trace('createAnswerOnSuccess', dumpSDP(answer));
            if (successCallback) successCallback(answer);
        },
        function (err) {
            self.trace('createAnswerOnFailure', err);
            if (failureCallback) failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.addIceCandidate = function (candidate, successCallback, failureCallback) {
    var self = this;
    this.trace('addIceCandidate', candidate);
    this.peerconnection.addIceCandidate(candidate,
        function () {
            //self.trace('addIceCandidateOnSuccess');
            if (successCallback) successCallback();
        },
        function (err) {
            self.trace('addIceCandidateOnFailure', err);
            if (failureCallback) failureCallback(err);
        }
    );
};

TraceablePeerConnection.prototype.getStats = function () {
    this.peerconnection.getStats.apply(this.peerconnection, arguments);
};

module.exports = TraceablePeerConnection;

},{"util":4,"webrtc-adapter-test":11,"wildemitter":12}],11:[function(require,module,exports){
/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* More information about these options at jshint.com/docs/options */
/* jshint browser: true, camelcase: true, curly: true, devel: true,
   eqeqeq: true, forin: false, globalstrict: true, node: true,
   quotmark: single, undef: true, unused: strict */
/* global mozRTCIceCandidate, mozRTCPeerConnection, Promise,
mozRTCSessionDescription, webkitRTCPeerConnection, MediaStreamTrack */
/* exported trace,requestUserMedia */

'use strict';

var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
var webrtcMinimumVersion = null;
var webrtcUtils = {
  log: function() {
    // suppress console.log output when being included as a module.
    if (typeof module !== 'undefined' ||
        typeof require === 'function' && typeof define === 'function') {
      return;
    }
    console.log.apply(console, arguments);
  },
  extractVersion: function(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos]);
  }
};

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    webrtcUtils.log(now + ': ' + text);
  } else {
    webrtcUtils.log(text);
  }
}

if (typeof window === 'object') {
  if (window.HTMLMediaElement &&
    !('srcObject' in window.HTMLMediaElement.prototype)) {
    // Shim the srcObject property, once, when HTMLMediaElement is found.
    Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
      get: function() {
        // If prefixed srcObject property exists, return it.
        // Otherwise use the shimmed property, _srcObject
        return 'mozSrcObject' in this ? this.mozSrcObject : this._srcObject;
      },
      set: function(stream) {
        if ('mozSrcObject' in this) {
          this.mozSrcObject = stream;
        } else {
          // Use _srcObject as a private property for this shim
          this._srcObject = stream;
          // TODO: revokeObjectUrl(this.src) when !stream to release resources?
          this.src = URL.createObjectURL(stream);
        }
      }
    });
  }
  // Proxy existing globals
  getUserMedia = window.navigator && window.navigator.getUserMedia;
}

// Attach a media stream to an element.
attachMediaStream = function(element, stream) {
  element.srcObject = stream;
};

reattachMediaStream = function(to, from) {
  to.srcObject = from.srcObject;
};

if (typeof window === 'undefined' || !window.navigator) {
  webrtcUtils.log('This does not appear to be a browser');
  webrtcDetectedBrowser = 'not a browser';
} else if (navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
  webrtcUtils.log('This appears to be Firefox');

  webrtcDetectedBrowser = 'firefox';

  // the detected firefox version.
  webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
      /Firefox\/([0-9]+)\./, 1);

  // the minimum firefox version still supported by adapter.
  webrtcMinimumVersion = 31;

  // The RTCPeerConnection object.
  window.RTCPeerConnection = function(pcConfig, pcConstraints) {
    if (webrtcDetectedVersion < 38) {
      // .urls is not supported in FF < 38.
      // create RTCIceServers with a single url.
      if (pcConfig && pcConfig.iceServers) {
        var newIceServers = [];
        for (var i = 0; i < pcConfig.iceServers.length; i++) {
          var server = pcConfig.iceServers[i];
          if (server.hasOwnProperty('urls')) {
            for (var j = 0; j < server.urls.length; j++) {
              var newServer = {
                url: server.urls[j]
              };
              if (server.urls[j].indexOf('turn') === 0) {
                newServer.username = server.username;
                newServer.credential = server.credential;
              }
              newIceServers.push(newServer);
            }
          } else {
            newIceServers.push(pcConfig.iceServers[i]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
    }
    return new mozRTCPeerConnection(pcConfig, pcConstraints); // jscs:ignore requireCapitalizedConstructors
  };

  // The RTCSessionDescription object.
  if (!window.RTCSessionDescription) {
    window.RTCSessionDescription = mozRTCSessionDescription;
  }

  // The RTCIceCandidate object.
  if (!window.RTCIceCandidate) {
    window.RTCIceCandidate = mozRTCIceCandidate;
  }

  // getUserMedia constraints shim.
  getUserMedia = function(constraints, onSuccess, onError) {
    var constraintsToFF37 = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r.min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    if (webrtcDetectedVersion < 38) {
      webrtcUtils.log('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37(constraints.video);
      }
      webrtcUtils.log('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, onError);
  };

  navigator.getUserMedia = getUserMedia;

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: requestUserMedia,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
    return new Promise(function(resolve) {
      var infos = [
        {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
        {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
      ];
      resolve(infos);
    });
  };

  if (webrtcDetectedVersion < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().then(undefined, function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
} else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
  webrtcUtils.log('This appears to be Chrome');

  webrtcDetectedBrowser = 'chrome';

  // the detected chrome version.
  webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
      /Chrom(e|ium)\/([0-9]+)\./, 2);

  // the minimum chrome version still supported by adapter.
  webrtcMinimumVersion = 38;

  // The RTCPeerConnection object.
  window.RTCPeerConnection = function(pcConfig, pcConstraints) {
    // Translate iceTransportPolicy to iceTransports,
    // see https://code.google.com/p/webrtc/issues/detail?id=4869
    if (pcConfig && pcConfig.iceTransportPolicy) {
      pcConfig.iceTransports = pcConfig.iceTransportPolicy;
    }

    var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints); // jscs:ignore requireCapitalizedConstructors
    var origGetStats = pc.getStats.bind(pc);
    pc.getStats = function(selector, successCallback, errorCallback) { // jshint ignore: line
      var self = this;
      var args = arguments;

      // If selector is a function then we are in the old style stats so just
      // pass back the original getStats format to avoid breaking old users.
      if (arguments.length > 0 && typeof selector === 'function') {
        return origGetStats(selector, successCallback);
      }

      var fixChromeStats = function(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function(report) {
          var standardStats = {
            id: report.id,
            timestamp: report.timestamp,
            type: report.type
          };
          report.names().forEach(function(name) {
            standardStats[name] = report.stat(name);
          });
          standardReport[standardStats.id] = standardStats;
        });

        return standardReport;
      };

      if (arguments.length >= 2) {
        var successCallbackWrapper = function(response) {
          args[1](fixChromeStats(response));
        };

        return origGetStats.apply(this, [successCallbackWrapper, arguments[0]]);
      }

      // promise-support
      return new Promise(function(resolve, reject) {
        if (args.length === 1 && selector === null) {
          origGetStats.apply(self, [
              function(response) {
                resolve.apply(null, [fixChromeStats(response)]);
              }, reject]);
        } else {
          origGetStats.apply(self, [resolve, reject]);
        }
      });
    };

    return pc;
  };

  // add promise support
  ['createOffer', 'createAnswer'].forEach(function(method) {
    var nativeMethod = webkitRTCPeerConnection.prototype[method];
    webkitRTCPeerConnection.prototype[method] = function() {
      var self = this;
      if (arguments.length < 1 || (arguments.length === 1 &&
          typeof(arguments[0]) === 'object')) {
        var opts = arguments.length === 1 ? arguments[0] : undefined;
        return new Promise(function(resolve, reject) {
          nativeMethod.apply(self, [resolve, reject, opts]);
        });
      } else {
        return nativeMethod.apply(this, arguments);
      }
    };
  });

  ['setLocalDescription', 'setRemoteDescription',
      'addIceCandidate'].forEach(function(method) {
    var nativeMethod = webkitRTCPeerConnection.prototype[method];
    webkitRTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      var self = this;
      return new Promise(function(resolve, reject) {
        nativeMethod.apply(self, [args[0],
            function() {
              resolve();
              if (args.length >= 2) {
                args[1].apply(null, []);
              }
            },
            function(err) {
              reject(err);
              if (args.length >= 3) {
                args[2].apply(null, [err]);
              }
            }]
          );
      });
    };
  });

  // getUserMedia constraints shim.
  var constraintsToChrome = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  getUserMedia = function(constraints, onSuccess, onError) {
    if (constraints.audio) {
      constraints.audio = constraintsToChrome(constraints.audio);
    }
    if (constraints.video) {
      constraints.video = constraintsToChrome(constraints.video);
    }
    webrtcUtils.log('chrome: ' + JSON.stringify(constraints));
    return navigator.webkitGetUserMedia(constraints, onSuccess, onError);
  };
  navigator.getUserMedia = getUserMedia;

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: requestUserMedia,
                              enumerateDevices: function() {
      return new Promise(function(resolve) {
        var kinds = {audio: 'audioinput', video: 'videoinput'};
        return MediaStreamTrack.getSources(function(devices) {
          resolve(devices.map(function(device) {
            return {label: device.label,
                    kind: kinds[device.kind],
                    deviceId: device.id,
                    groupId: ''};
          }));
        });
      });
    }};
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return requestUserMedia(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      webrtcUtils.log('spec:   ' + JSON.stringify(c)); // whitespace for alignment
      c.audio = constraintsToChrome(c.audio);
      c.video = constraintsToChrome(c.video);
      webrtcUtils.log('chrome: ' + JSON.stringify(c));
      return origGetUserMedia(c);
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      webrtcUtils.log('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      webrtcUtils.log('Dummy mediaDevices.removeEventListener called.');
    };
  }

  // Attach a media stream to an element.
  attachMediaStream = function(element, stream) {
    if (webrtcDetectedVersion >= 43) {
      element.srcObject = stream;
    } else if (typeof element.src !== 'undefined') {
      element.src = URL.createObjectURL(stream);
    } else {
      webrtcUtils.log('Error attaching stream to element.');
    }
  };
  reattachMediaStream = function(to, from) {
    if (webrtcDetectedVersion >= 43) {
      to.srcObject = from.srcObject;
    } else {
      to.src = from.src;
    }
  };

} else if (navigator.mediaDevices && navigator.userAgent.match(
    /Edge\/(\d+).(\d+)$/)) {
  webrtcUtils.log('This appears to be Edge');
  webrtcDetectedBrowser = 'edge';

  webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
      /Edge\/(\d+).(\d+)$/, 2);

  // the minimum version still supported by adapter.
  webrtcMinimumVersion = 12;
} else {
  webrtcUtils.log('Browser does not appear to be WebRTC-capable');
}

// Returns the result of getUserMedia as a Promise.
function requestUserMedia(constraints) {
  return new Promise(function(resolve, reject) {
    getUserMedia(constraints, resolve, reject);
  });
}

var webrtcTesting = {};
try {
  Object.defineProperty(webrtcTesting, 'version', {
    set: function(version) {
      webrtcDetectedVersion = version;
    }
  });
} catch (e) {}

if (typeof module !== 'undefined') {
  var RTCPeerConnection;
  if (typeof window !== 'undefined') {
    RTCPeerConnection = window.RTCPeerConnection;
  }
  module.exports = {
    RTCPeerConnection: RTCPeerConnection,
    getUserMedia: getUserMedia,
    attachMediaStream: attachMediaStream,
    reattachMediaStream: reattachMediaStream,
    webrtcDetectedBrowser: webrtcDetectedBrowser,
    webrtcDetectedVersion: webrtcDetectedVersion,
    webrtcMinimumVersion: webrtcMinimumVersion,
    webrtcTesting: webrtcTesting,
    webrtcUtils: webrtcUtils
    //requestUserMedia: not exposed on purpose.
    //trace: not exposed on purpose.
  };
} else if ((typeof require === 'function') && (typeof define === 'function')) {
  // Expose objects and functions when RequireJS is doing the loading.
  define([], function() {
    return {
      RTCPeerConnection: window.RTCPeerConnection,
      getUserMedia: getUserMedia,
      attachMediaStream: attachMediaStream,
      reattachMediaStream: reattachMediaStream,
      webrtcDetectedBrowser: webrtcDetectedBrowser,
      webrtcDetectedVersion: webrtcDetectedVersion,
      webrtcMinimumVersion: webrtcMinimumVersion,
      webrtcTesting: webrtcTesting,
      webrtcUtils: webrtcUtils
      //requestUserMedia: not exposed on purpose.
      //trace: not exposed on purpose.
    };
  });
}

},{}],12:[function(require,module,exports){
/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {

});

emitter.on('somenamespace*', function (eventName, payloads) {

});

Please note that callbacks triggered by wildcard registered events also get
the event name as the first argument.
*/

module.exports = WildEmitter;

function WildEmitter() { }

WildEmitter.mixin = function (constructor) {
    var prototype = constructor.prototype || constructor;

    prototype.isWildEmitter= true;

    // Listen on the given `event` with `fn`. Store a group name if present.
    prototype.on = function (event, groupName, fn) {
        this.callbacks = this.callbacks || {};
        var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    prototype.once = function (event, groupName, fn) {
        var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        function on() {
            self.off(event, on);
            func.apply(this, arguments);
        }
        this.on(event, group, on);
        return this;
    };

    // Unbinds an entire group
    prototype.releaseGroup = function (groupName) {
        this.callbacks = this.callbacks || {};
        var item, i, len, handlers;
        for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    //console.log('removing');
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    prototype.off = function (event, fn) {
        this.callbacks = this.callbacks || {};
        var callbacks = this.callbacks[event],
            i;

        if (!callbacks) return this;

        // remove all handlers
        if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        if (callbacks.length === 0) {
            delete this.callbacks[event];
        }
        return this;
    };

    /// Emit `event` with the given args.
    // also calls any `*` handlers
    prototype.emit = function (event) {
        this.callbacks = this.callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item,
            listeners;

        if (callbacks) {
            listeners = callbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }

        if (specialCallbacks) {
            len = specialCallbacks.length;
            listeners = specialCallbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }

        return this;
    };

    // Helper for for finding special wildcard event handlers that match the event
    prototype.getWildcardCallbacks = function (eventName) {
        this.callbacks = this.callbacks || {};
        var item,
            split,
            result = [];

        for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    };

};

WildEmitter.mixin(WildEmitter);

},{}],13:[function(require,module,exports){
var util = require('util');
var SJJ = require('sdp-jingle-json');
var WildEmitter = require('wildemitter');
var Peerconn = require('traceablepeerconnection');
var adapter = require('webrtc-adapter-test');

function PeerConnection(config, constraints) {
    var self = this;
    var item;
    WildEmitter.call(this);

    config = config || {};
    config.iceServers = config.iceServers || [];

    // make sure this only gets enabled in Google Chrome
    // EXPERIMENTAL FLAG, might get removed without notice
    this.enableChromeNativeSimulcast = false;
    if (constraints && constraints.optional &&
            adapter.webrtcDetectedBrowser === 'chrome' &&
            navigator.appVersion.match(/Chromium\//) === null) {
        constraints.optional.forEach(function (constraint) {
            if (constraint.enableChromeNativeSimulcast) {
                self.enableChromeNativeSimulcast = true;
            }
        });
    }

    // EXPERIMENTAL FLAG, might get removed without notice
    this.enableMultiStreamHacks = false;
    if (constraints && constraints.optional &&
            adapter.webrtcDetectedBrowser === 'chrome') {
        constraints.optional.forEach(function (constraint) {
            if (constraint.enableMultiStreamHacks) {
                self.enableMultiStreamHacks = true;
            }
        });
    }
    // EXPERIMENTAL FLAG, might get removed without notice
    this.restrictBandwidth = 0;
    if (constraints && constraints.optional) {
        constraints.optional.forEach(function (constraint) {
            if (constraint.andyetRestrictBandwidth) {
                self.restrictBandwidth = constraint.andyetRestrictBandwidth;
            }
        });
    }

    // EXPERIMENTAL FLAG, might get removed without notice
    // bundle up ice candidates, only works for jingle mode
    // number > 0 is the delay to wait for additional candidates
    // ~20ms seems good
    this.batchIceCandidates = 0;
    if (constraints && constraints.optional) {
        constraints.optional.forEach(function (constraint) {
            if (constraint.andyetBatchIce) {
                self.batchIceCandidates = constraint.andyetBatchIce;
            }
        });
    }
    this.batchedIceCandidates = [];

    // EXPERIMENTAL FLAG, might get removed without notice
    // this attemps to strip out candidates with an already known foundation
    // and type -- i.e. those which are gathered via the same TURN server
    // but different transports (TURN udp, tcp and tls respectively)
    if (constraints && constraints.optional && adapter.webrtcDetectedBrowser === 'chrome') {
        constraints.optional.forEach(function (constraint) {
            if (constraint.andyetFasterICE) {
                self.eliminateDuplicateCandidates = constraint.andyetFasterICE;
            }
        });
    }
    // EXPERIMENTAL FLAG, might get removed without notice
    // when using a server such as the jitsi videobridge we don't need to signal
    // our candidates
    if (constraints && constraints.optional) {
        constraints.optional.forEach(function (constraint) {
            if (constraint.andyetDontSignalCandidates) {
                self.dontSignalCandidates = constraint.andyetDontSignalCandidates;
            }
        });
    }


    // EXPERIMENTAL FLAG, might get removed without notice
    this.assumeSetLocalSuccess = false;
    if (constraints && constraints.optional) {
        constraints.optional.forEach(function (constraint) {
            if (constraint.andyetAssumeSetLocalSuccess) {
                self.assumeSetLocalSuccess = constraint.andyetAssumeSetLocalSuccess;
            }
        });
    }

    // EXPERIMENTAL FLAG, might get removed without notice
    // working around https://bugzilla.mozilla.org/show_bug.cgi?id=1087551
    // pass in a timeout for this
    if (adapter.webrtcDetectedBrowser === 'firefox') {
        if (constraints && constraints.optional) {
            this.wtFirefox = 0;
            constraints.optional.forEach(function (constraint) {
                if (constraint.andyetFirefoxMakesMeSad) {
                    self.wtFirefox = constraint.andyetFirefoxMakesMeSad;
                    if (self.wtFirefox > 0) {
                        self.firefoxcandidatebuffer = [];
                    }
                }
            });
        }
    }


    this.pc = new Peerconn(config, constraints);

    this.getLocalStreams = this.pc.getLocalStreams.bind(this.pc);
    this.getRemoteStreams = this.pc.getRemoteStreams.bind(this.pc);
    this.addStream = this.pc.addStream.bind(this.pc);
    this.removeStream = this.pc.removeStream.bind(this.pc);

    // proxy events
    this.pc.on('*', function () {
        self.emit.apply(self, arguments);
    });

    // proxy some events directly
    this.pc.onremovestream = this.emit.bind(this, 'removeStream');
    this.pc.onaddstream = this.emit.bind(this, 'addStream');
    this.pc.onnegotiationneeded = this.emit.bind(this, 'negotiationNeeded');
    this.pc.oniceconnectionstatechange = this.emit.bind(this, 'iceConnectionStateChange');
    this.pc.onsignalingstatechange = this.emit.bind(this, 'signalingStateChange');

    // handle ice candidate and data channel events
    this.pc.onicecandidate = this._onIce.bind(this);
    this.pc.ondatachannel = this._onDataChannel.bind(this);

    this.localDescription = {
        contents: []
    };
    this.remoteDescription = {
        contents: []
    };

    this.config = {
        debug: false,
        ice: {},
        sid: '',
        isInitiator: true,
        sdpSessionID: Date.now(),
        useJingle: false
    };

    // apply our config
    for (item in config) {
        this.config[item] = config[item];
    }

    if (this.config.debug) {
        this.on('*', function () {
            var logger = config.logger || console;
            logger.log('PeerConnection event:', arguments);
        });
    }
    this.hadLocalStunCandidate = false;
    this.hadRemoteStunCandidate = false;
    this.hadLocalRelayCandidate = false;
    this.hadRemoteRelayCandidate = false;

    this.hadLocalIPv6Candidate = false;
    this.hadRemoteIPv6Candidate = false;

    // keeping references for all our data channels
    // so they dont get garbage collected
    // can be removed once the following bugs have been fixed
    // https://crbug.com/405545
    // https://bugzilla.mozilla.org/show_bug.cgi?id=964092
    // to be filed for opera
    this._remoteDataChannels = [];
    this._localDataChannels = [];

    this._candidateBuffer = [];
}

util.inherits(PeerConnection, WildEmitter);

Object.defineProperty(PeerConnection.prototype, 'signalingState', {
    get: function () {
        return this.pc.signalingState;
    }
});
Object.defineProperty(PeerConnection.prototype, 'iceConnectionState', {
    get: function () {
        return this.pc.iceConnectionState;
    }
});

PeerConnection.prototype._role = function () {
    return this.isInitiator ? 'initiator' : 'responder';
};

// Add a stream to the peer connection object
PeerConnection.prototype.addStream = function (stream) {
    this.localStream = stream;
    this.pc.addStream(stream);
};

// helper function to check if a remote candidate is a stun/relay
// candidate or an ipv6 candidate
PeerConnection.prototype._checkLocalCandidate = function (candidate) {
    var cand = SJJ.toCandidateJSON(candidate);
    if (cand.type == 'srflx') {
        this.hadLocalStunCandidate = true;
    } else if (cand.type == 'relay') {
        this.hadLocalRelayCandidate = true;
    }
    if (cand.ip.indexOf(':') != -1) {
        this.hadLocalIPv6Candidate = true;
    }
};

// helper function to check if a remote candidate is a stun/relay
// candidate or an ipv6 candidate
PeerConnection.prototype._checkRemoteCandidate = function (candidate) {
    var cand = SJJ.toCandidateJSON(candidate);
    if (cand.type == 'srflx') {
        this.hadRemoteStunCandidate = true;
    } else if (cand.type == 'relay') {
        this.hadRemoteRelayCandidate = true;
    }
    if (cand.ip.indexOf(':') != -1) {
        this.hadRemoteIPv6Candidate = true;
    }
};


// Init and add ice candidate object with correct constructor
PeerConnection.prototype.processIce = function (update, cb) {
    cb = cb || function () {};
    var self = this;

    // ignore any added ice candidates to avoid errors. why does the
    // spec not do this?
    if (this.pc.signalingState === 'closed') return cb();

    if (update.contents || (update.jingle && update.jingle.contents)) {
        var contentNames = [].map.call(this.remoteDescription.contents, function (desc) {
            return desc.name;
        });
        var contents = update.contents || update.jingle.contents;

        contents.forEach(function (content) {
            var transport = content.transport || {};
            var candidates = transport.candidates || [];
            var mline = contentNames.indexOf(content.name);
            var mid = content.name;

            candidates.forEach(
                function (candidate) {
                var iceCandidate = SJJ.toCandidateSDP(candidate) + '\r\n';
                self.pc.addIceCandidate(
                    new RTCIceCandidate({
                        candidate: iceCandidate,
                        sdpMLineIndex: mline,
                        sdpMid: mid
                    }), function () {
                        // well, this success callback is pretty meaningless
                    },
                    function (err) {
                        self.emit('error', err);
                    }
                );
                self._checkRemoteCandidate(iceCandidate);
            });
        });
    } else {
        // working around https://code.google.com/p/webrtc/issues/detail?id=3669
        if (update.candidate && update.candidate.candidate.indexOf('a=') !== 0) {
            update.candidate.candidate = 'a=' + update.candidate.candidate;
        }

        if (this.wtFirefox && this.firefoxcandidatebuffer !== null) {
            // we cant add this yet due to https://bugzilla.mozilla.org/show_bug.cgi?id=1087551
            if (this.pc.localDescription && this.pc.localDescription.type === 'offer') {
                this.firefoxcandidatebuffer.push(update.candidate);
                return cb();
            }
        }

        self.pc.addIceCandidate(
            new RTCIceCandidate(update.candidate),
            function () { },
            function (err) {
                self.emit('error', err);
            }
        );
        self._checkRemoteCandidate(update.candidate.candidate);
    }
    cb();
};

// Generate and emit an offer with the given constraints
PeerConnection.prototype.offer = function (constraints, cb) {
    var self = this;
    var hasConstraints = arguments.length === 2;
    var mediaConstraints = hasConstraints && constraints ? constraints : {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        };
    cb = hasConstraints ? cb : constraints;
    cb = cb || function () {};

    if (this.pc.signalingState === 'closed') return cb('Already closed');

    // Actually generate the offer
    this.pc.createOffer(
        function (offer) {
            // does not work for jingle, but jingle.js doesn't need
            // this hack...
            var expandedOffer = {
                type: 'offer',
                sdp: offer.sdp
            };
            if (self.assumeSetLocalSuccess) {
                self.emit('offer', expandedOffer);
                cb(null, expandedOffer);
            }
            self._candidateBuffer = [];
            self.pc.setLocalDescription(offer,
                function () {
                    var jingle;
                    if (self.config.useJingle) {
                        jingle = SJJ.toSessionJSON(offer.sdp, {
                            role: self._role(),
                            direction: 'outgoing'
                        });
                        jingle.sid = self.config.sid;
                        self.localDescription = jingle;

                        // Save ICE credentials
                        [].forEach.call(jingle.contents, function (content) {
                            var transport = content.transport || {};
                            if (transport.ufrag) {
                                self.config.ice[content.name] = {
                                    ufrag: transport.ufrag,
                                    pwd: transport.pwd
                                };
                            }
                        });

                        expandedOffer.jingle = jingle;
                    }
                    expandedOffer.sdp.split('\r\n').forEach(function (line) {
                        if (line.indexOf('a=candidate:') === 0) {
                            self._checkLocalCandidate(line);
                        }
                    });

                    if (!self.assumeSetLocalSuccess) {
                        self.emit('offer', expandedOffer);
                        cb(null, expandedOffer);
                    }
                },
                function (err) {
                    self.emit('error', err);
                    cb(err);
                }
            );
        },
        function (err) {
            self.emit('error', err);
            cb(err);
        },
        mediaConstraints
    );
};


// Process an incoming offer so that ICE may proceed before deciding
// to answer the request.
PeerConnection.prototype.handleOffer = function (offer, cb) {
    cb = cb || function () {};
    var self = this;
    offer.type = 'offer';
    if (offer.jingle) {
        if (this.enableChromeNativeSimulcast) {
            offer.jingle.contents.forEach(function (content) {
                if (content.name === 'video') {
                    content.description.googConferenceFlag = true;
                }
            });
        }
        if (this.enableMultiStreamHacks) {
            // add a mixed video stream as first stream
            offer.jingle.contents.forEach(function (content) {
                if (content.name === 'video') {
                    var sources = content.description.sources || [];
                    if (sources.length === 0 || sources[0].ssrc !== "3735928559") {
                        sources.unshift({
                            ssrc: "3735928559", // 0xdeadbeef
                            parameters: [
                                {
                                    key: "cname",
                                    value: "deadbeef"
                                },
                                {
                                    key: "msid",
                                    value: "mixyourfecintothis please"
                                }
                            ]
                        });
                        content.description.sources = sources;
                    }
                }
            });
        }
        if (self.restrictBandwidth > 0) {
            if (offer.jingle.contents.length >= 2 && offer.jingle.contents[1].name === 'video') {
                var content = offer.jingle.contents[1];
                var hasBw = content.description && content.description.bandwidth;
                if (!hasBw) {
                    offer.jingle.contents[1].description.bandwidth = { type: 'AS', bandwidth: self.restrictBandwidth.toString() };
                    offer.sdp = SJJ.toSessionSDP(offer.jingle, {
                        sid: self.config.sdpSessionID,
                        role: self._role(),
                        direction: 'outgoing'
                    });
                }
            }
        }
        offer.sdp = SJJ.toSessionSDP(offer.jingle, {
            sid: self.config.sdpSessionID,
            role: self._role(),
            direction: 'incoming'
        });
        self.remoteDescription = offer.jingle;
    }
    offer.sdp.split('\r\n').forEach(function (line) {
        if (line.indexOf('a=candidate:') === 0) {
            self._checkRemoteCandidate(line);
        }
    });
    self.pc.setRemoteDescription(new RTCSessionDescription(offer),
        function () {
            cb();
        },
        cb
    );
};

// Answer an offer with audio only
PeerConnection.prototype.answerAudioOnly = function (cb) {
    var mediaConstraints = {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: false
            }
        };
    this._answer(mediaConstraints, cb);
};

// Answer an offer without offering to recieve
PeerConnection.prototype.answerBroadcastOnly = function (cb) {
    var mediaConstraints = {
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        };
    this._answer(mediaConstraints, cb);
};

// Answer an offer with given constraints default is audio/video
PeerConnection.prototype.answer = function (constraints, cb) {
    var hasConstraints = arguments.length === 2;
    var callback = hasConstraints ? cb : constraints;
    var mediaConstraints = hasConstraints && constraints ? constraints : {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        };

    this._answer(mediaConstraints, callback);
};

// Process an answer
PeerConnection.prototype.handleAnswer = function (answer, cb) {
    cb = cb || function () {};
    var self = this;
    if (answer.jingle) {
        answer.sdp = SJJ.toSessionSDP(answer.jingle, {
            sid: self.config.sdpSessionID,
            role: self._role(),
            direction: 'incoming'
        });
        self.remoteDescription = answer.jingle;
    }
    answer.sdp.split('\r\n').forEach(function (line) {
        if (line.indexOf('a=candidate:') === 0) {
            self._checkRemoteCandidate(line);
        }
    });
    self.pc.setRemoteDescription(
        new RTCSessionDescription(answer),
        function () {
            if (self.wtFirefox) {
                window.setTimeout(function () {
                    self.firefoxcandidatebuffer.forEach(function (candidate) {
                        // add candidates later
                        self.pc.addIceCandidate(
                            new RTCIceCandidate(candidate),
                            function () { },
                            function (err) {
                                self.emit('error', err);
                            }
                        );
                        self._checkRemoteCandidate(candidate.candidate);
                    });
                    self.firefoxcandidatebuffer = null;
                }, self.wtFirefox);
            }
            cb(null);
        },
        cb
    );
};

// Close the peer connection
PeerConnection.prototype.close = function () {
    this.pc.close();

    this._localDataChannels = [];
    this._remoteDataChannels = [];

    this.emit('close');
};

// Internal code sharing for various types of answer methods
PeerConnection.prototype._answer = function (constraints, cb) {
    cb = cb || function () {};
    var self = this;
    if (!this.pc.remoteDescription) {
        // the old API is used, call handleOffer
        throw new Error('remoteDescription not set');
    }

    if (this.pc.signalingState === 'closed') return cb('Already closed');

    self.pc.createAnswer(
        function (answer) {
            var sim = [];
            if (self.enableChromeNativeSimulcast) {
                // native simulcast part 1: add another SSRC
                answer.jingle = SJJ.toSessionJSON(answer.sdp, {
                    role: self._role(),
                    direction: 'outgoing'
                });
                if (answer.jingle.contents.length >= 2 && answer.jingle.contents[1].name === 'video') {
                    var groups = answer.jingle.contents[1].description.sourceGroups || [];
                    var hasSim = false;
                    groups.forEach(function (group) {
                        if (group.semantics == 'SIM') hasSim = true;
                    });
                    if (!hasSim &&
                        answer.jingle.contents[1].description.sources.length) {
                        var newssrc = JSON.parse(JSON.stringify(answer.jingle.contents[1].description.sources[0]));
                        newssrc.ssrc = '' + Math.floor(Math.random() * 0xffffffff); // FIXME: look for conflicts
                        answer.jingle.contents[1].description.sources.push(newssrc);

                        sim.push(answer.jingle.contents[1].description.sources[0].ssrc);
                        sim.push(newssrc.ssrc);
                        groups.push({
                            semantics: 'SIM',
                            sources: sim
                        });

                        // also create an RTX one for the SIM one
                        var rtxssrc = JSON.parse(JSON.stringify(newssrc));
                        rtxssrc.ssrc = '' + Math.floor(Math.random() * 0xffffffff); // FIXME: look for conflicts
                        answer.jingle.contents[1].description.sources.push(rtxssrc);
                        groups.push({
                            semantics: 'FID',
                            sources: [newssrc.ssrc, rtxssrc.ssrc]
                        });

                        answer.jingle.contents[1].description.sourceGroups = groups;
                        answer.sdp = SJJ.toSessionSDP(answer.jingle, {
                            sid: self.config.sdpSessionID,
                            role: self._role(),
                            direction: 'outgoing'
                        });
                    }
                }
            }
            var expandedAnswer = {
                type: 'answer',
                sdp: answer.sdp
            };
            if (self.assumeSetLocalSuccess) {
                // not safe to do when doing simulcast mangling
                self.emit('answer', expandedAnswer);
                cb(null, expandedAnswer);
            }
            self._candidateBuffer = [];
            self.pc.setLocalDescription(answer,
                function () {
                    if (self.config.useJingle) {
                        var jingle = SJJ.toSessionJSON(answer.sdp, {
                            role: self._role(),
                            direction: 'outgoing'
                        });
                        jingle.sid = self.config.sid;
                        self.localDescription = jingle;
                        expandedAnswer.jingle = jingle;
                    }
                    if (self.enableChromeNativeSimulcast) {
                        // native simulcast part 2:
                        // signal multiple tracks to the receiver
                        // for anything in the SIM group
                        if (!expandedAnswer.jingle) {
                            expandedAnswer.jingle = SJJ.toSessionJSON(answer.sdp, {
                                role: self._role(),
                                direction: 'outgoing'
                            });
                        }
                        expandedAnswer.jingle.contents[1].description.sources.forEach(function (source, idx) {
                            // the floor idx/2 is a hack that relies on a particular order
                            // of groups, alternating between sim and rtx
                            source.parameters = source.parameters.map(function (parameter) {
                                if (parameter.key === 'msid') {
                                    parameter.value += '-' + Math.floor(idx / 2);
                                }
                                return parameter;
                            });
                        });
                        expandedAnswer.sdp = SJJ.toSessionSDP(expandedAnswer.jingle, {
                            sid: self.sdpSessionID,
                            role: self._role(),
                            direction: 'outgoing'
                        });
                    }
                    expandedAnswer.sdp.split('\r\n').forEach(function (line) {
                        if (line.indexOf('a=candidate:') === 0) {
                            self._checkLocalCandidate(line);
                        }
                    });
                    if (!self.assumeSetLocalSuccess) {
                        self.emit('answer', expandedAnswer);
                        cb(null, expandedAnswer);
                    }
                },
                function (err) {
                    self.emit('error', err);
                    cb(err);
                }
            );
        },
        function (err) {
            self.emit('error', err);
            cb(err);
        },
        constraints
    );
};

// Internal method for emitting ice candidates on our peer object
PeerConnection.prototype._onIce = function (event) {
    var self = this;
    if (event.candidate) {
        if (this.dontSignalCandidates) return;
        var ice = event.candidate;

        var expandedCandidate = {
            candidate: {
                candidate: ice.candidate,
                sdpMid: ice.sdpMid,
                sdpMLineIndex: ice.sdpMLineIndex
            }
        };
        this._checkLocalCandidate(ice.candidate);

        var cand = SJJ.toCandidateJSON(ice.candidate);

        var already;
        var idx;
        if (this.eliminateDuplicateCandidates && cand.type === 'relay') {
            // drop candidates with same foundation, component
            // take local type pref into account so we don't ignore udp
            // ones when we know about a TCP one. unlikely but...
            already = this._candidateBuffer.filter(
                function (c) {
                    return c.type === 'relay';
                }).map(function (c) {
                    return c.foundation + ':' + c.component;
                }
            );
            idx = already.indexOf(cand.foundation + ':' + cand.component);
            // remember: local type pref of udp is 0, tcp 1, tls 2
            if (idx > -1 && ((cand.priority >> 24) >= (already[idx].priority >> 24))) {
                // drop it, same foundation with higher (worse) type pref
                return;
            }
        }
        if (this.config.bundlePolicy === 'max-bundle') {
            // drop candidates which are duplicate for audio/video/data
            // duplicate means same host/port but different sdpMid
            already = this._candidateBuffer.filter(
                function (c) {
                    return cand.type === c.type;
                }).map(function (cand) {
                    return cand.address + ':' + cand.port;
                }
            );
            idx = already.indexOf(cand.address + ':' + cand.port);
            if (idx > -1) return;
        }
        // also drop rtcp candidates since we know the peer supports RTCP-MUX
        // this is a workaround until browsers implement this natively
        if (this.config.rtcpMuxPolicy === 'require' && cand.component === '2') {
            return;
        }
        this._candidateBuffer.push(cand);

        if (self.config.useJingle) {
            if (!ice.sdpMid) { // firefox doesn't set this
                if (self.pc.remoteDescription && self.pc.remoteDescription.type === 'offer') {
                    // preserve name from remote
                    ice.sdpMid = self.remoteDescription.contents[ice.sdpMLineIndex].name;
                } else {
                    ice.sdpMid = self.localDescription.contents[ice.sdpMLineIndex].name;
                }
            }
            if (!self.config.ice[ice.sdpMid]) {
                var jingle = SJJ.toSessionJSON(self.pc.localDescription.sdp, {
                    role: self._role(),
                    direction: 'outgoing'
                });
                [].forEach.call(jingle.contents, function (content) {
                    var transport = content.transport || {};
                    if (transport.ufrag) {
                        self.config.ice[content.name] = {
                            ufrag: transport.ufrag,
                            pwd: transport.pwd
                        };
                    }
                });
            }
            expandedCandidate.jingle = {
                contents: [{
                    name: ice.sdpMid,
                    creator: self._role(),
                    transport: {
                        transType: 'iceUdp',
                        ufrag: self.config.ice[ice.sdpMid].ufrag,
                        pwd: self.config.ice[ice.sdpMid].pwd,
                        candidates: [
                            cand
                        ]
                    }
                }]
            };
            if (self.batchIceCandidates > 0) {
                if (self.batchedIceCandidates.length === 0) {
                    window.setTimeout(function () {
                        var contents = {};
                        self.batchedIceCandidates.forEach(function (content) {
                            content = content.contents[0];
                            if (!contents[content.name]) contents[content.name] = content;
                            contents[content.name].transport.candidates.push(content.transport.candidates[0]);
                        });
                        var newCand = {
                            jingle: {
                                contents: []
                            }
                        };
                        Object.keys(contents).forEach(function (name) {
                            newCand.jingle.contents.push(contents[name]);
                        });
                        self.batchedIceCandidates = [];
                        self.emit('ice', newCand);
                    }, self.batchIceCandidates);
                }
                self.batchedIceCandidates.push(expandedCandidate.jingle);
                return;
            }

        }
        this.emit('ice', expandedCandidate);
    } else {
        this.emit('endOfCandidates');
    }
};

// Internal method for processing a new data channel being added by the
// other peer.
PeerConnection.prototype._onDataChannel = function (event) {
    // make sure we keep a reference so this doesn't get garbage collected
    var channel = event.channel;
    this._remoteDataChannels.push(channel);

    this.emit('addChannel', channel);
};

// Create a data channel spec reference:
// http://dev.w3.org/2011/webrtc/editor/webrtc.html#idl-def-RTCDataChannelInit
PeerConnection.prototype.createDataChannel = function (name, opts) {
    var channel = this.pc.createDataChannel(name, opts);

    // make sure we keep a reference so this doesn't get garbage collected
    this._localDataChannels.push(channel);

    return channel;
};

PeerConnection.prototype.getStats = function (cb) {
    this.pc.getStats(null,
        function (res) {
            cb(null, res);
        },
        function (err) {
            cb(err);
        }
    );
};

module.exports = PeerConnection;

},{"sdp-jingle-json":5,"traceablepeerconnection":10,"util":4,"webrtc-adapter-test":11,"wildemitter":12}]},{},[13])(13)
});