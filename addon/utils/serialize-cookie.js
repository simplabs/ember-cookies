import { typeOf, isEmpty } from '@ember/utils';

export const serializeCookie = (name, value, options = {}) => {
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
  if (options.httpOnly) {
    cookie = `${cookie}; httpOnly`;
  }
  if (!isEmpty(options.path)) {
    cookie = `${cookie}; path=${options.path}`;
  }
  if (!isEmpty(options.sameSite)) {
    cookie = `${cookie}; SameSite=${options.sameSite}`;
  }

  return cookie;
};
