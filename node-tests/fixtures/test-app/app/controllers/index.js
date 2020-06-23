import Ember from 'ember';

const { inject: { service }, computed, Controller } = Ember;

export default Controller.extend({
  cookies: service(),

  testCookieValue: computed(function() {
    return this.get('cookies').read('test-cookie');
  })
});
