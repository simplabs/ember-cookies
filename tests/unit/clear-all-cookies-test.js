/* jshint expr:true */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import clearAllCookies from 'ember-cookies/clear-all-cookies';

function randomString() {
  return Math.random().toString(36).substring(2);
}

describe('clearAllCookies test helper', function() {
  it('clears all cookies', function() {
    let value1 = randomString();
    let value2 = randomString();
    document.cookie = `test1=${value1};`;
    document.cookie = `test2=${value2};`;

    clearAllCookies();

    expect(document.cookie).to.not.include(`test1=${value1};`);
    expect(document.cookie).to.not.include(`test2=${value2};`);
  });
});
