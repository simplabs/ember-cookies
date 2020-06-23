/* global describe, before, after, it */
/* jshint node:true */
let chai = require('chai');
let expect = chai.expect;
let RSVP = require('rsvp');
let AddonTestApp = require('ember-cli-addon-tests').AddonTestApp;
let request = RSVP.denodeify(require('request'));

describe('cookies access', function() {
  this.timeout(600000);

  let app;

  before(function() {
    app = new AddonTestApp();
    return app.create('test-app', { fixturesPath: 'node-tests/fixtures' }).then(function() {
      app.editPackageJSON(function(pkg) {
        pkg['devDependencies']['ember-data'] = '~2.4.0';
      });
      return app.run('npm', 'install').then(function() {
        return app.runEmberCommand('install', 'ember-cli-fastboot');
      });
    });
  });

  after(function() {
    return app.stopServer();
  });

  it('reads and writes cookies in FastBoot', function() {
    return app.startServer({
      command: 'fastboot',
      additionalArguments: ['--host 0.0.0.0']
    }).then(function() {
      let value = Math.random().toString(36).substring(2);

      let cookieJar = request.jar();
      let cookie = request.cookie(`test-cookie=${value}`);
      let url = 'http://localhost:49741';
      cookieJar.setCookie(cookie, url);
      request({ url, jar: cookieJar }).then(function(response) {
        expect(response.body).to.contain(`cookie: ${value}`);
      });
    });
  });
});
