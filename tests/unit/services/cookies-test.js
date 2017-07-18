/* jshint expr:true */
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import Ember from 'ember';

const { Object: EmberOject, computed } = Ember;
const { defineProperty } = Object;

const COOKIE_NAME = 'test-cookie';

function randomString() {
  return Math.random().toString(36).substring(2);
}

describe('CookiesService', function() {
  setupTest('service:cookies');

  function itValidatesWriteOptions() {
    it('throws when the signed option is set', function() {
      expect(() => {
        this.subject().write(COOKIE_NAME, 'test', { signed: true });
      }).to.throw();
    });

    it('throws when the HTTP only option is set', function() {
      expect(() => {
        this.subject().write(COOKIE_NAME, 'test', { httpOnly: true });
      }).to.throw();
    });

    it('throws when both the expires and max age options are set', function() {
      expect(() => {
        this.subject().write(COOKIE_NAME, 'test', { expires: new Date(), maxAge: 1000 });
      }).to.throw();
    });
  }

  function itValidatesClearOptions() {
    it('throws when the expires option is set', function() {
      expect(() => {
        this.subject().clear(COOKIE_NAME, { expires: new Date() });
      }).to.throw();
    });

    it('throws when the max-age option is set', function() {
      expect(() => {
        this.subject().clear(COOKIE_NAME, { maxAge: 1000 });
      }).to.throw();
    });
  }

  function itReadsAfterWrite() {
    it('reads a cookie that was just written', function() {
      let value = randomString();
      this.subject().write(COOKIE_NAME, value);

      expect(this.subject().read(COOKIE_NAME)).to.eq(value);
    });
  }

  describe('in the browser', function() {
    beforeEach(function() {
      this.fakeDocument = {
        // jscs:disable requireEnhancedObjectLiterals
        get cookie() {
          return document.cookie;
        },
        set cookie(value) {
          document.cookie = value;
        }
        // jscs:enable requireEnhancedObjectLiterals
      };
      this.subject().setProperties('_document', this.fakeDocument);
    });

    afterEach(function() {
      document.cookie = `${COOKIE_NAME}=whatever; expires=${new Date(0).toUTCString()}`;
      document.cookie = `${COOKIE_NAME}=whatever; path=${window.location.pathname}; expires=${new Date(0).toUTCString()}`;
    });

    describe('reading a cookie', function() {
      it('returns the cookie value', function() {
        let value = randomString();
        document.cookie = `${COOKIE_NAME}=${value};`;
        let afterRoundtrip = this.subject().read(COOKIE_NAME);

        expect(afterRoundtrip).to.eq(value);
      });

      it('handles invalid values for cookies', function() {
        document.cookie = '=blank';
        expect(this.subject().read('')).to.deep.equal({});
      });

      it('returns undefined when the cookie does not exist', function() {
        let afterRoundtrip = this.subject().read('does-not-exist');

        expect(afterRoundtrip).to.be.undefined;
      });

      it('returns undefined for a cookie that was written for another path', function() {
        this.subject().write(COOKIE_NAME, 'value', { path: '/some-other-path' });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that was written for the same path', function() {
        let path = window.location.pathname;
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { path });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for a cookie that was written for another domain', function() {
        this.subject().write(COOKIE_NAME, 'value', { domain: 'another-domain.com' });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that was written for the same domain', function() {
        let domain = window.location.hostname;
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { domain });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for an expired cookie', function() {
        this.subject().write(COOKIE_NAME, 'value', { expires: new Date(-1) });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a not-yet-expired cookie', function() {
        let expirationDate = new Date();
        expirationDate.setDate(new Date().getDate() + 1);
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { expires: expirationDate });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for a cookie that reached its max age', function() {
        this.subject().write(COOKIE_NAME, 'value', { maxAge: -1 });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that has not yet reached its max age', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { maxAge: 99999999 });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for a cookie that was written for another protocol (secure cookies vs. non-secure request)', function() {
        let isHTTPS = window.location.protocol === 'https:';
        this.subject().write(COOKIE_NAME, 'value', { secure: !isHTTPS });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that was written for the same protocol', function() {
        let isHTTPS = window.location.protocol === 'https:';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { secure: isHTTPS });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });
    });

    describe('writing a cookie', function() {
      itValidatesWriteOptions.apply(this);

      it('writes the value', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value);

        expect(document.cookie).to.include(`${COOKIE_NAME}=${value}`);
      });

      it('URI-component-encodes the value', function() {
        let value = '!"§$%&/()=?"';
        this.subject().write(COOKIE_NAME, value);

        expect(document.cookie).to.include(`${COOKIE_NAME}=${encodeURIComponent(value)}`);
      });

      it('sets the cookie domain', function() {
        defineProperty(this.fakeDocument, 'cookie', {
          set(value) {
            expect(value).to.include('; domain=example.com');
          }
        });

        this.subject().write(COOKIE_NAME, 'test', { domain: 'example.com' });
      });

      it('sets the expiration', function() {
        let date = new Date();
        defineProperty(this.fakeDocument, 'cookie', {
          set(value) {
            expect(value).to.include(`; expires=${date.toUTCString()}`);
          }
        });

        this.subject().write(COOKIE_NAME, 'test', { expires: date });
      });

      it('sets the max age', function() {
        defineProperty(this.fakeDocument, 'cookie', {
          set(value) {
            expect(value).to.include('; max-age=1000');
          }
        });

        this.subject().write(COOKIE_NAME, 'test', { maxAge: 1000 });
      });

      it('sets the secure flag', function() {
        defineProperty(this.fakeDocument, 'cookie', {
          set(value) {
            expect(value).to.include('; secure');
          }
        });

        this.subject().write(COOKIE_NAME, 'test', { secure: true });
      });

      it('sets the path', function() {
        defineProperty(this.fakeDocument, 'cookie', {
          set(value) {
            expect(value).to.include('; path=/sample-path');
          }
        });

        this.subject().write(COOKIE_NAME, 'test', { path: '/sample-path' });
      });

      it('sets multiple options', function() {
        defineProperty(this.fakeDocument, 'cookie', {
          set(value) {
            expect(value).to.include('; path=/sample-path') && expect(value).to.include('; max-age=1000');
          }
        });

        this.subject().write(COOKIE_NAME, 'test', { path: '/sample-path', maxAge: 1000 });
      });
    });

    describe('clearing a cookie', function() {
      itValidatesClearOptions.apply(this);

      it('clears the cookie', function() {
        let value = randomString();
        document.cookie = `${COOKIE_NAME}=${value};`;

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);

        this.subject().clear(COOKIE_NAME);

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      describe('with a path option', function() {
        it('clears the cookie set without path', function() {
          let value = randomString();
          let pathname = window.location.pathname;
          let path = pathname.substring(0, pathname.lastIndexOf('/'));
          this.subject().write(COOKIE_NAME, value);

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { path });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });

        it('clears the cookie set for a given path', function() {
          let path = '/';
          let value = randomString();
          this.subject().write(COOKIE_NAME, value, { path });

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { path });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });
      });

      describe('with a domain option', function() {
        it('clears the cookie set without domain', function() {
          let domain = window.location.hostname;
          let value = randomString();
          this.subject().write(COOKIE_NAME, value);

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { domain });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });

        it('clears the cookie set for a given domain', function() {
          let domain = window.location.hostname;
          let value = randomString();
          this.subject().write(COOKIE_NAME, value, { domain });

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { domain });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });
      });
    });

    itReadsAfterWrite.apply(this);
  });

  describe('in the FastBoot server', function() {
    beforeEach(function() {

      let request = EmberOject.extend({
        init() {
          this._super(...arguments);
          this.cookies = {};
          this.headers = {
            append() {}
          };
        },
        host: computed(function() {
          return this._host;
        })
      });

      this.fakeFastBoot = {
        response: {
          headers: {
            append() {}
          }
        },
        request: request.create()
      };
      this.subject().setProperties({
        _isFastBoot: true,
        _fastBoot: this.fakeFastBoot
      });
    });

    describe('reading a cookie', function() {
      it('returns the cookie value', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value);

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined when the cookies does not exist', function() {
        expect(this.subject().read('does-not-exist')).to.be.undefined;
      });

      it('returns undefined for a cookie that was written for another path', function() {
        this.fakeFastBoot.request.path = '/path';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { path: '/some-other-path' });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that was written for the same path', function() {
        this.fakeFastBoot.request.path = '/path';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { path: '/path' });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for a cookie that was written for another domain', function() {
        this.fakeFastBoot.request._host = 'example.com';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { domain: 'another-domain.com' });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that was written for the same domain', function() {
        this.fakeFastBoot.request._host = 'example.com';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { domain: 'example.com' });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns the cookie value for a cookie that was written for a parent domain', function() {
        this.fakeFastBoot.request._host = 'sub.example.com';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { domain: 'example.com' });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for an expired cookie', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { expires: new Date(-1) });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a not-yet-expired cookie', function() {
        let expirationDate = new Date();
        expirationDate.setDate(new Date().getDate() + 1);
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { expires: expirationDate });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for a cookie that reached its max age', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { maxAge: -1 });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that has not yet reached its max age', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { maxAge: 99999999 });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });

      it('returns undefined for a cookie that was written for another protocol (secure cookies vs. non-secure request)', function() {
        this.fakeFastBoot.request._host = 'http';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { secure: true });

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      it('returns the cookie value for a cookie that was written for the same protocol', function() {
        this.fakeFastBoot.request.protocol = 'https';
        let value = randomString();
        this.subject().write(COOKIE_NAME, value, { secure: true });

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);
      });
    });

    describe('writing a cookie', function() {
      itValidatesWriteOptions.apply(this);

      it('writes the value', function() {
        let value = randomString();

        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=${value}`);
        };

        this.subject().write(COOKIE_NAME, value);
      });

      it('URI-component-encodes the value', function() {
        let value = '!"§$%&/()=?"';
        let encodedValue = encodeURIComponent(value);

        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=${encodedValue}`);
        };

        this.subject().write(COOKIE_NAME, value);
      });

      it('sets the cookie domain', function() {
        let domain = 'example.com';
        this.fakeFastBoot.request._host = domain;

        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=test; domain=${domain}`);
        };

        this.subject().write(COOKIE_NAME, 'test', { domain });
      });

      it('sets the expiration', function() {
        let date = new Date();

        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=test; expires=${date.toUTCString()}`);
        };

        this.subject().write(COOKIE_NAME, 'test', { expires: date });
      });

      it('sets the max age', function() {
        let maxAge = 10;

        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=test; max-age=${maxAge}`);
        };

        this.subject().write(COOKIE_NAME, 'test', { maxAge });
      });

      it('sets the secure flag', function() {
        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=test; secure`);
        };

        this.subject().write(COOKIE_NAME, 'test', { secure: true });
      });

      it('sets the path', function() {
        let path = '/sample-path';

        this.fakeFastBoot.response.headers.append = function(headerName, headerValue) {
          expect(headerName).to.equal('set-cookie');
          expect(headerValue).to.equal(`${COOKIE_NAME}=test; path=${path}`);
        };

        this.subject().write(COOKIE_NAME, 'test', { path });
      });
    });

    describe('clearing a cookie', function() {
      itValidatesClearOptions.apply(this);

      it('clears the cookie', function() {
        let value = randomString();
        this.subject().write(COOKIE_NAME, value);

        expect(this.subject().read(COOKIE_NAME)).to.eq(value);

        this.subject().clear(COOKIE_NAME);

        expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
      });

      describe('with a path option', function() {
        it('clears the cookie set without path', function() {
          this.fakeFastBoot.request.path = '/path';
          let value = randomString();
          this.subject().write(COOKIE_NAME, value);

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { path: '/path' });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });

        it('clears the cookie set for a given path', function() {
          let path = '/path';
          this.fakeFastBoot.request.path = path;
          let value = randomString();
          this.subject().write(COOKIE_NAME, value, { path });

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { path });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });
      });

      describe('with a domain option', function() {
        it('clears the cookie set without domain', function() {
          let domain = 'example.com';
          this.fakeFastBoot.request._host = domain;
          let value = randomString();
          this.subject().write(COOKIE_NAME, value);

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { domain });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });

        it('clears the cookie set for a given domain', function() {
          let domain = 'example.com';
          this.fakeFastBoot.request._host = domain;
          let value = randomString();
          this.subject().write(COOKIE_NAME, value, { domain });

          expect(this.subject().read(COOKIE_NAME)).to.eq(value);

          this.subject().clear(COOKIE_NAME, { domain });

          expect(this.subject().read(COOKIE_NAME)).to.be.undefined;
        });
      });
    });

    itReadsAfterWrite.apply(this);
  });
});
