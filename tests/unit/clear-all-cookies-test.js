/* jshint expr:true */
import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import clearAllCookies from 'ember-cookies/clear-all-cookies';

function randomString() {
  return Math.random().toString(36).substring(2);
}

describe('clearAllCookies test helper', function () {
  afterEach(function () {
    for (let cookie of ['test1', 'test2']) {
      document.cookie = `${cookie}=whatever; expires=${new Date(0).toUTCString()}; path=/`;
    }
  });

  it('throws when the expires option is set', function () {
    expect(() => {
      clearAllCookies({ expires: new Date() });
    }).to.throw();
  });

  it('throws when the max-age option is set', function () {
    expect(() => {
      clearAllCookies({ maxAge: 1000 });
    }).to.throw();
  });

  it('throws when the raw option is set', function () {
    expect(() => {
      clearAllCookies({ raw: true });
    }).to.throw();
  });

  it('throws when the httpOnly option is set', function () {
    expect(() => {
      clearAllCookies({ httpOnly: true });
    }).to.throw();
  });

  it('clears all cookies', function () {
    let value1 = randomString();
    let value2 = randomString();
    document.cookie = `test1=${value1};`;
    document.cookie = `test2=${value2};`;

    clearAllCookies();

    expect(document.cookie).to.not.include(`test1=${value1}`);
    expect(document.cookie).to.not.include(`test2=${value2}`);
  });

  it('clears all cookies with a specified path', function () {
    let pathname = window.location.pathname;
    let path = pathname.substring(0, pathname.lastIndexOf('/'));
    let value1 = randomString();
    let value2 = randomString();
    document.cookie = `test1=${value1};path=${path};`;
    document.cookie = `test2=${value2};path=/`;

    clearAllCookies({ path });

    expect(document.cookie).to.not.include(`test1=${value1}`);
    expect(document.cookie).to.include(`test2=${value2}`);
  });
});
