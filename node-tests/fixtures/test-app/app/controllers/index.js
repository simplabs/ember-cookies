import Controller from '@ember/controller';

const { inject: { service }, computed } = Ember;

export default Controller.extend({
  cookies: service(),

  testCookieValue: computed(function() {
    return this.get('cookies').read('test-cookie');
  })
});
