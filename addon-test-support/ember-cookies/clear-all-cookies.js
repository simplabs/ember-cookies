import { assert } from '@ember/debug';
import { merge, assign as emberAssign } from '@ember/polyfills';
import { isEmpty } from '@ember/utils';
import { serializeCookie } from 'ember-cookies/utils/serialize-cookie';
const assign = Object.assign || emberAssign || merge;

export default function(options = {}) {
  assert('Max-Age option cannot be set when clearing cookies', isEmpty(options.maxAge));
  options = assign({}, options, {
    expires: new Date(0)
  });

  let cookies = document.cookie.split(';');

  cookies.forEach((cookie) => {
    let cookieName = cookie.split('=')[0];
    document.cookie = serializeCookie(cookieName, '', options);
  });
}
