# 0.5.2

* A bug was fixed that prevented usage in projects that are not using FastBoot,
  see #347.

# 0.5.1

* The `write` function now supports the `sameSite` option with values of
  `'Strict'` or `'Lax'`, see #269.

# 0.5.0

* ember-cookies now requires Node 8, see #321.
* The default cookie path is now normalized to not include a trailing slash (as
  appended e.g. by Firefox), see #169.
* The `clearAllCookies` helper function now accepts the `path`, `domain` and
  `secure` options, see #197.

# 0.4.0

* The `httpOnly` option can now be specified for cookies that are set in
  FastBoot, see #194.
* A bug that would not replace an existing cookie but set it multiple times
  with different values when calling `write` multiple times with different
  values in FastBoot was fixed, see #195.
* An invokation of `merge` that was triggering a deprecation was removed, see
  #204.
* Usages of the `volatile` computed property modified that were triggering
  deprecations were removed, see #207.
* Cookies with `=` in the value are now correctly read, see #201.
* ember-cookies now uses Babel 7, see #192.

# 0.3.1

* A bug that prevented cookies from being read from the request header
  correctly in FastBoot if another cookie had been written before was fixed,
  see #181.

# 0.3.0

* When writing a cookie, the written value is now checked to not exceed 4096
  bytes, see #159.

# 0.2.0

* Add `exists` method to check for existence of a cookie (even with a falsy
  value), see #158.

# 0.1.3

* A runtime error in Internet Explorer was fixed, see #149.

# 0.1.2

* Added a new `clearAllCookies` helper function for clearing all cookies in
  tests, see #140.

# 0.1.1

* Accept both `https` and `https:` as valid protocols for HTTPS detections,
  see #132.
* Add `raw` option to `read` and `write` that disables URL-en/decoding, see
  #134.

# 0.1.0

* Allow ember-getowner-polyfill ^1.1.0 and ^2.0.0 (#118)
* Use "New Module Imports" (#117)
* Set fake document on service in tests (#114)
* Ensure multiple options are added to the cookie (#113)
* Document `maxAge` option. (#112)
* Update ember-cli-babel to version 6.6.0 (#111)
* Remove unnecessary dependencies (#87)
* Add options to args for clear() in README (#56)

# 0.0.13

* Update the ember-getowner-polyfill dependency, see #49.

# 0.0.12

* The `cookies` service's `clear` method now accepts options, see #48.
* ember-cookies now uses ESLint instead of JSHint/JSCS, see #37.

# 0.0.11

* A deprecation triggered by ember-getowner-polyfill has been fixed, see #30.

# 0.0.10

* Fix usage of the FastBoot host, see #25.

# 0.0.9

* Handling of FastBoot cookies has been fixed, see #24.

# 0.0.8

* The new `clear` method was added to delete a particular cookie, see #20.
* The dependency on ember-lodash was removed, see #22.

# 0.0.7

* Cookies are now written directly to the response headers in FastBoot mode,
  see #17.

# 0.0.6

* The fastboot service is now correctly referenced as `service:fastboot`, see
  #16.

# 0.0.5

* FastBoot is now always being referred to correctly with a capital "B", see
  #15.
* Values are now encoded when written and decoded when read, see #14.

# 0.0.4

* ember-lodash is now a direct dependency of ember-cookies while it was only a
  dev dependency before which caused errors in applications that didn't have
  ember-lodash installed already, see #12.

# 0.0.3

* Make sure that cookies can be read after having been written in FastBoot,
  see #9.
* Enable ember-suave for the project, see #10.

# 0.0.2

* tests, tests, tests 🎉, see #5.

# 0.0.1

initial release
