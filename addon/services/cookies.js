import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { isNone, typeOf, isPresent, isEmpty } from '@ember/utils';
import { assert } from '@ember/debug';
import { A } from '@ember/array';
import { getOwner } from '@ember/application';
import Service from '@ember/service';
import { merge, assign as emberAssign } from '@ember/polyfills';
const { keys } = Object;
const assign = Object.assign || emberAssign || merge;
const DEFAULTS = { raw: false };
const MAX_COOKIE_BYTE_LENGTH = 4096;

export default Service.extend({
  _isFastBoot: reads('_fastBoot.isFastBoot'),

  _fastBoot: computed(function() {
    let owner = getOwner(this);

    return owner.lookup('service:fastboot');
  }),

  _document: computed(function() {
    return document;
  }),

  _documentCookies: computed(function() {
    let all = this.get('_document.cookie').split(';');
    let filtered = this._filterDocumentCookies(A(all));

    return filtered.reduce((acc, cookie) => {
      if (!isEmpty(cookie)) {
        let [key, value] = cookie;
        acc[key.trim()] = (value || '').trim();
      }
      return acc;
    }, {});
  }).volatile(),

  _fastBootCookies: computed(function() {
    let fastBootCookiesCache = this.get('_fastBootCookiesCache');

    if (!fastBootCookiesCache) {
      let fastBootCookies = this.get('_fastBoot.request.cookies');
      fastBootCookiesCache = A(keys(fastBootCookies)).reduce((acc, name) => {
        let value = fastBootCookies[name];
        acc[name] = { value };
        return acc;
      }, {});
      this.set('_fastBootCookiesCache', fastBootCookiesCache);
    }

    return this._filterCachedFastBootCookies(fastBootCookiesCache);
  }).volatile(),

  read(name, options = {}) {
    options = assign({}, DEFAULTS, options || {});
    assert('Domain, Expires, Max-Age, and Path options cannot be set when reading cookies', isEmpty(options.domain) && isEmpty(options.expires) && isEmpty(options.maxAge) && isEmpty(options.path));

    let all;
    if (this.get('_isFastBoot')) {
      all = this.get('_fastBootCookies');
    } else {
      all = this.get('_documentCookies');
    }

    if (name) {
      return this._decodeValue(all[name], options.raw);
    } else {
      A(keys(all)).forEach((name) => (all[name] = this._decodeValue(all[name], options.raw)));
      return all;
    }
  },

  write(name, value, options = {}) {
    options = assign({}, DEFAULTS, options || {});
    assert('Cookies cannot be set to be HTTP-only as those cookies would not be accessible by the Ember.js application itself when running in the browser!', !options.httpOnly);
    assert("Cookies cannot be set as signed as signed cookies would not be modifyable in the browser as it has no knowledge of the express server's signing key!", !options.signed);
    assert('Cookies cannot be set with both maxAge and an explicit expiration time!', isEmpty(options.expires) || isEmpty(options.maxAge));

    value = this._encodeValue(value, options.raw);

    assert(`Cookies larger than ${MAX_COOKIE_BYTE_LENGTH} bytes are not supported by most browsers!`, this._isCookieSizeAcceptable(value));

    if (this.get('_isFastBoot')) {
      this._writeFastBootCookie(name, value, options);
    } else {
      this._writeDocumentCookie(name, value, options);
    }
  },

  clear(name, options = {}) {
    options = assign({}, options || {});
    assert('Expires, Max-Age, and raw options cannot be set when clearing cookies', isEmpty(options.expires) && isEmpty(options.maxAge) && isEmpty(options.raw));

    options.expires = new Date('1970-01-01');
    this.write(name, null, options);
  },

  exists(name) {
    let all;
    if (this.get('_isFastBoot')) {
      all = this.get('_fastBootCookies');
    } else {
      all = this.get('_documentCookies');
    }

    return all.hasOwnProperty(name);
  },

  _writeDocumentCookie(name, value, options = {}) {
    let serializedCookie = this._serializeCookie(name, value, options);
    this.set('_document.cookie', serializedCookie);
  },

  _writeFastBootCookie(name, value, options = {}) {
    let responseHeaders = this.get('_fastBoot.response.headers');
    let serializedCookie = this._serializeCookie(...arguments);

    if (!isEmpty(options.maxAge)) {
      options.maxAge *= 1000;
    }

    this._cacheFastBootCookie(...arguments);

    responseHeaders.append('set-cookie', serializedCookie);
  },

  _cacheFastBootCookie(name, value, options = {}) {
    let fastBootCache = this.getWithDefault('_fastBootCookiesCache', {});
    let cachedOptions = merge({}, options);

    if (cachedOptions.maxAge) {
      let expires = new Date();
      expires.setSeconds(expires.getSeconds() + options.maxAge);
      cachedOptions.expires = expires;
      delete cachedOptions.maxAge;
    }

    fastBootCache[name] = { value, options: cachedOptions };
    this.set('_fastBootCookiesCache', fastBootCache);
  },

  _filterCachedFastBootCookies(fastBootCookiesCache) {
    let { path: requestPath, protocol } = this.get('_fastBoot.request');

    // cannot use deconstruct here
    let host = this.get('_fastBoot.request.host');

    return A(keys(fastBootCookiesCache)).reduce((acc, name) => {
      let { value, options } = fastBootCookiesCache[name];
      options = options || {};

      let { path: optionsPath, domain, expires, secure } = options;

      if (optionsPath && requestPath.indexOf(optionsPath) !== 0) {
        return acc;
      }

      if (domain && host.indexOf(domain) + domain.length !== host.length) {
        return acc;
      }

      if (expires && expires < new Date()) {
        return acc;
      }

      if (secure && !(protocol || '').match(/^https/)) {
        return acc;
      }

      acc[name] = value;
      return acc;
    }, {});
  },

  _encodeValue(value, raw) {
    if (isNone(value)) {
      return '';
    } else if (raw) {
      return value;
    } else {
      return encodeURIComponent(value);
    }
  },

  _decodeValue(value, raw) {
    if (isNone(value) || raw) {
      return value;
    } else {
      return decodeURIComponent(value);
    }
  },

  _filterDocumentCookies(unfilteredCookies) {
    return unfilteredCookies.map((c) => c.split('='))
      .filter((c) => c.length === 2 && isPresent(c[0]));
  },

  _serializeCookie(name, value, options = {}) {
    let cookie = `${name}=${value}`;

    if (!isEmpty(options.domain)) {
      cookie = `${cookie}; domain=${options.domain}`;
    }
    if (typeOf(options.expires) === 'date') {
      cookie = `${cookie}; expires=${options.expires.toUTCString()}`;
    }
    if (!isEmpty(options.maxAge)) {
      cookie = `${cookie}; max-age=${options.maxAge}`;
    }
    if (options.secure) {
      cookie = `${cookie}; secure`;
    }
    if (!isEmpty(options.path)) {
      cookie = `${cookie}; path=${options.path}`;
    }

    return cookie;
  },

  _isCookieSizeAcceptable(value) {
    // Counting bytes varies Pre-ES6 and in ES6
    // This snippet counts the bytes in the value
    // about to be stored as the cookie:
    // See https://stackoverflow.com/a/25994411/6657064
    let _byteCount = 0;
    let i = 0;
    let c;
    while ((c = value.charCodeAt(i++))) {
      /* eslint-disable no-bitwise */
      _byteCount += c >> 11 ? 3 : c >> 7 ? 2 : 1;
      /* eslint-enable no-bitwise */
    }

    return _byteCount < MAX_COOKIE_BYTE_LENGTH;
  }

});
