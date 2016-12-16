import Ember from 'ember';

const {
  computed,
  computed: { reads },
  isEmpty,
  typeOf,
  isNone,
  assert,
  A,
  getOwner
} = Ember;
const { keys } = Object;

export default Ember.Service.extend({
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

    return A(all).reduce((acc, cookie) => {
      if (!isEmpty(cookie)) {
        let [key, value] = cookie.split('=');
        acc[key.trim()] = value.trim();
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

  read(name) {
    let all;
    if (this.get('_isFastBoot')) {
      all = this.get('_fastBootCookies');
    } else {
      all = this.get('_documentCookies');
    }

    if (name) {
      return this._decodeValue(all[name]);
    } else {
      A(keys(all)).forEach((name) => all[name] = this._decodeValue(all[name]));
      return all;
    }
  },

  write(name, value, options = {}) {
    assert('Cookies cannot be set to be HTTP-only as those cookies would not be accessible by the Ember.js application itself when running in the browser!', !options.httpOnly);
    assert("Cookies cannot be set as signed as signed cookies would not be modifyable in the browser as it has no knowledge of the express server's signing key!", !options.signed);
    assert('Cookies cannot be set with both maxAge and an explicit expiration time!', isEmpty(options.expires) || isEmpty(options.maxAge));
    value = this._encodeValue(value);

    if (this.get('_isFastBoot')) {
      this._writeFastBootCookie(name, value, options);
    } else {
      this._writeDocumentCookie(name, value, options);
    }
  },

  clear(name) {
    this.write(name, null, { expires: new Date('1970-01-01') });
  },

  _writeDocumentCookie(name, value, options = {}) {
    let serializedCookie = this._serializeCookie(name, value, options);
    this.set('_document.cookie', serializedCookie);
  },

  _writeFastBootCookie(name, value, options = {}) {
    let responseHeaders  = this.get('_fastBoot.response.headers');
    let serializedCookie = this._serializeCookie(...arguments);

    if (!isEmpty(options.maxAge)) {
      options.maxAge = options.maxAge * 1000;
    }

    this._cacheFastBootCookie(...arguments);

    responseHeaders.append('set-cookie', serializedCookie);
  },

  _cacheFastBootCookie(name, value, options = {}) {
    let fastBootCache = this.getWithDefault('_fastBootCookiesCache', {});
    let cachedOptions = Ember.merge({}, options);

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

      if (secure && protocol !== 'https') {
        return acc;
      }

      acc[name] = value;
      return acc;
    }, {});
  },

  _encodeValue(value) {
    if (isNone(value)) {
      return '';
    } else {
      return encodeURIComponent(value);
    }
  },

  _decodeValue(value) {
    if (isNone(value)) {
      return value;
    } else {
      return decodeURIComponent(value);
    }
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
    if (!!options.secure) {
      cookie = `${cookie}; secure`;
    }
    if (!isEmpty(options.path)) {
      cookie = `${cookie}; path=${options.path}`;
    }

    return cookie;
  }
});
