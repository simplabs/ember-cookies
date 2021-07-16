import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import clearAllCookies from 'ember-cookies/clear-all-cookies';

function randomString() {
  return Math.random().toString(36).substring(2);
}

module('clearAllCookies test helper', function (hooks) {
  setupTest(hooks);

  hooks.afterEach(function () {
    for (let cookie of ['test1', 'test2']) {
      document.cookie = `${cookie}=whatever; expires=${new Date(0).toUTCString()}; path=/`;
    }
  });

  test('throws when the expires option is set', function (assert) {
    assert.throws(() => {
      clearAllCookies({ expires: new Date() });
    });
  });

  test('throws when the max-age option is set', function (assert) {
    assert.throws(() => {
      clearAllCookies({ maxAge: 1000 });
    });
  });

  test('throws when the raw option is set', function (assert) {
    assert.throws(() => {
      clearAllCookies({ raw: true });
    });
  });

  test('throws when the httpOnly option is set', function (assert) {
    assert.throws(() => {
      clearAllCookies({ httpOnly: true });
    });
  });

  test('clears all cookies', function (assert) {
    let value1 = randomString();
    let value2 = randomString();
    document.cookie = `test1=${value1};`;
    document.cookie = `test2=${value2};`;

    clearAllCookies();

    assert.notOk(document.cookie.includes(`test1=${value1}`));
    assert.notOk(document.cookie.includes(`test2=${value2}`));
  });

  test('clears all cookies with a specified path', function (assert) {
    let pathname = window.location.pathname;
    let path = pathname.substring(0, pathname.lastIndexOf('/'));
    let value1 = randomString();
    let value2 = randomString();
    document.cookie = `test1=${value1};path=${path};`;
    document.cookie = `test2=${value2};path=/`;

    clearAllCookies({ path });

    assert.notOk(document.cookie.includes(`test1=${value1}`));
    assert.ok(document.cookie.includes(`test2=${value2}`));
  });
});
