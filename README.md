[![Build Status](https://travis-ci.org/simplabs/ember-cookies.svg?branch=master)](https://travis-ci.org/simplabs/ember-cookies)

# ember-cookies

`ember-cookies` implements an abstract __cookie API that works both in the
browser (via `document.cookie`) as well as with Fastboot in the server
context__ (using the `request` and `response` accessible via the `fastBoot`
service).

__Having access to cookies both in the browser as well as in FastBoot is key to
being able to share a common session.__

## Installation

Install `ember-cookies` with

`ember install ember-cookies`

## Example Usage

```js
// app/controllers/application.js
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
const { keys } = Object;

export default Controller.extend({
  cookies: service(),

  allCookies: computed(function() {
    let cookieService = this.get('cookies');
    cookieService.write('now', new Date().getTime());

    let cookies = cookieService.read();
    return keys(cookies).reduce((acc, key) => {
      let value = cookies[key];
      acc.push({ name: key, value });

      return acc;
    }, []);
  })
});
```

## API

The `cookies` service has methods for reading and writing cookies:

* `read(name, options = {})`: reads the cookie with the given name, returns its
  value as a `String`; options can be used to set `raw` (boolean, disables
  URL-decoding the value).
* `write(name, value, options = {})`: writes a cookie with the given name and
  value; options can be used to set `domain`, `expires` (Date), `maxAge` (time
  in seconds), `path`, `secure`, `raw` (boolean, disables URL-encoding the
  value) and `sameSite` (can be either `'strict'` or `'lax'`).
* `clear(name, options = {})`: clears the cookie so that future reads do not
  return a value; options can be used to specify `domain`, `path` or `secure`.
* `exists(name)`: checks whether a cookie exists at all (even with a falsy
  value) and returns `true` if that is the case or `false` otherwise.

## License

`ember-cookies` is developed by and &copy;
[simplabs GmbH](http://simplabs.com) and contributors. It is released under the
[MIT License](https://github.com/simplabs/ember-simple-auth/blob/master/LICENSE).

`ember-cookies` is not an official part of [Ember.js](http://emberjs.com) and
is not maintained by the Ember.js Core Team.
