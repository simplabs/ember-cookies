import { assert } from '@ember/debug';
import { merge, assign as emberAssign } from '@ember/polyfills';
import { isEmpty } from '@ember/utils';
import { serializeCookie } from 'ember-cookies/utils/serialize-cookie';
const assign = Object.assign || emberAssign || merge;

export default function(options = {}) {
  assert('Cookies cannot be set to be HTTP-only from a browser!', !options.httpOnly);
  assert('Expires, Max-Age, and raw options cannot be set when clearing cookies', isEmpty(options.expires) && isEmpty(options.maxAge) && isEmpty(options.raw));
  options = assign({}, options, {
    expires: new Date(0)
  });

  let cookies = document.cookie.split(';');

  cookies.forEach((cookie) => {
    let cookieName = cookie.split('=')[0];
    document.cookie = serializeCookie(cookieName, '', options);
  });
}
