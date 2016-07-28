/* global describe, before, after, it */
/* jshint node:true */
var chai = require('chai');
var expect = chai.expect;
var RSVP = require('rsvp');
var AddonTestApp = require('ember-cli-addon-tests').AddonTestApp;
var request = require('request');
var request = RSVP.denodeify(request);

describe('cookies access', function() {
  this.timeout(600000);

  var app;

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
      var value = Math.random().toString(36).substring(2);

      var cookieJar = request.jar();
      var cookie = request.cookie('test-cookie=' + value);
      var url = 'http://localhost:49741';
      cookieJar.setCookie(cookie, url);
      request({ url: url, jar: cookieJar }).then(function(response) {
        expect(response.body).to.contain('cookie: ' + value);
      });
    });
  });
});
