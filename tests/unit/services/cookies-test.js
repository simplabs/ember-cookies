import EmberOject from '@ember/object';

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
const { defineProperty } = Object;

const COOKIE_NAME = 'test-cookie';

function randomString() {
  return Math.random().toString(36).substring(2);
}

module('CookiesService', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.cookies = this.owner.lookup('service:cookies');
  });

  function itValidatesWriteOptions() {
    test('throws when the signed option is set', function (assert) {
      assert.throws(() => {
        this.cookies.write(COOKIE_NAME, 'test', { signed: true });
      });
    });

    test('throws when both the expires and max age options are set', function (assert) {
      assert.throws(() => {
        this.cookies.write(COOKIE_NAME, 'test', { expires: new Date(), maxAge: 1000 });
      });
    });
  }

  function itValidatesReadOptions() {
    test('throws when the domain option is set for reading', function (assert) {
      assert.throws(() => {
        this.cookies.read(COOKIE_NAME, { domain: 'example.com' });
      });
    });

    test('throws when the expires option is set for reading', function (assert) {
      assert.throws(() => {
        this.cookies.read(COOKIE_NAME, { expires: new Date() });
      });
    });

    test('throws when the max-age option is set for reading', function (assert) {
      assert.throws(() => {
        this.cookies.clear(COOKIE_NAME, { maxAge: 1000 });
      });
    });

    test('throws when the path option is set for reading', function (assert) {
      assert.throws(() => {
        this.cookies.read(COOKIE_NAME, { path: '/path' });
      });
    });
  }

  function itValidatesClearOptions() {
    test('throws when the expires option is set for clearing', function (assert) {
      assert.throws(() => {
        this.cookies.clear(COOKIE_NAME, { expires: new Date() });
      });
    });

    test('throws when the max-age option is set for clearing', function (assert) {
      assert.throws(() => {
        this.cookies.clear(COOKIE_NAME, { maxAge: 1000 });
      });
    });

    test('throws when the raw option is set for clearing', function (assert) {
      assert.throws(() => {
        this.cookies.clear(COOKIE_NAME, { raw: true });
      });
    });
  }

  function itReadsAfterWrite() {
    test('reads a cookie that was just written', function (assert) {
      let value = randomString();
      this.cookies.write(COOKIE_NAME, value);

      assert.equal(this.cookies.read(COOKIE_NAME), value);
    });
  }

  module('in the browser', function () {
    function itUsesBrowserAPIs(hooks) {
      hooks.beforeEach(function () {
        this.fakeDocument = {
          // jscs:disable requireEnhancedObjectLiterals
          get cookie() {
            return document.cookie;
          },
          set cookie(value) {
            document.cookie = value;
          },
          // jscs:enable requireEnhancedObjectLiterals
        };
        this.cookies._document = this.fakeDocument;
        this.cookies._fastBoot = this.fakeFastBoot;
      });

      hooks.afterEach(function () {
        let pathname = window.location.pathname;
        pathname = pathname.substring(0, pathname.lastIndexOf('/'));
        document.cookie = `${COOKIE_NAME}=whatever; expires=${new Date(0).toUTCString()}`;
        document.cookie = `${COOKIE_NAME}=whatever; path=${pathname}; expires=${new Date(
          0
        ).toUTCString()}`;
        document.cookie = `${COOKIE_NAME}=whatever; path=${pathname}/; expires=${new Date(
          0
        ).toUTCString()}`;
      });

      module('reading a cookie', function (hooks) {
        itValidatesReadOptions.apply(this, [hooks]);

        test('returns the cookie value', function (assert) {
          let value = randomString();
          document.cookie = `${COOKIE_NAME}=${value};`;
          let afterRoundtrip = this.cookies.read(COOKIE_NAME);

          assert.equal(afterRoundtrip, value);
        });

        test('URI-component-decodes the value', function (assert) {
          let value = '!"§$%&/()=?"';
          document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}`;
          let afterRoundtrip = this.cookies.read(COOKIE_NAME);

          assert.equal(afterRoundtrip, value);
        });

        test("doesn't decode the value when raw is true", function (assert) {
          let value = '%22%C2%A7%24%25%26%2F%3D%3F';
          document.cookie = `${COOKIE_NAME}=${value}`;
          let afterRoundtrip = this.cookies.read(COOKIE_NAME, { raw: true });

          assert.equal(afterRoundtrip, value);
        });

        test('handles invalid cookies', function (assert) {
          document.cookie = '=blank';

          assert.deepEqual(this.cookies.read(''), {});
        });

        test('returns undefined when the cookie does not exist', function (assert) {
          let afterRoundtrip = this.cookies.read('does-not-exist');

          assert.equal(afterRoundtrip, undefined);
        });

        test('returns undefined for a cookie that was written for another path', function (assert) {
          this.cookies.write(COOKIE_NAME, 'value', { path: '/some-other-path' });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        test('returns the cookie value for a cookie that was written for the same path', function (assert) {
          let path = window.location.pathname;
          path = path.substring(0, path.lastIndexOf('/'));
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value, { path });

          assert.equal(this.cookies.read(COOKIE_NAME), value);
        });

        test('returns undefined for a cookie that was written for another domain', function (assert) {
          this.cookies.write(COOKIE_NAME, 'value', { domain: 'another-domain.com' });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        test('returns the cookie value for a cookie that was written for the same domain', function (assert) {
          let domain = window.location.hostname;
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value, { domain });

          assert.equal(this.cookies.read(COOKIE_NAME), value);
        });

        test('returns undefined for an expired cookie', function (assert) {
          this.cookies.write(COOKIE_NAME, 'value', { expires: new Date(-1) });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        test('returns the cookie value for a not-yet-expired cookie', function (assert) {
          let expirationDate = new Date();
          expirationDate.setDate(new Date().getDate() + 1);
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value, { expires: expirationDate });

          assert.equal(this.cookies.read(COOKIE_NAME), value);
        });

        test('returns undefined for a cookie that reached its max age', function (assert) {
          this.cookies.write(COOKIE_NAME, 'value', { maxAge: -1 });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        test('returns the cookie value for a cookie that has not yet reached its max age', function (assert) {
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value, { maxAge: 99999999 });

          assert.equal(this.cookies.read(COOKIE_NAME), value);
        });

        test('works when the cookie contains a "="', function (assert) {
          let value = `${randomString()}=${randomString()}`;
          document.cookie = `${COOKIE_NAME}=${value};`;
          let afterRoundtrip = this.cookies.read(COOKIE_NAME);

          assert.equal(afterRoundtrip, value);
        });
      });

      module('writing a cookie', function (hooks) {
        itValidatesWriteOptions.apply(this, [hooks]);

        test('writes the value', function (assert) {
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value);

          assert.ok(document.cookie.includes(`${COOKIE_NAME}=${value}`));
        });

        test('URI-component-encodes the value', function (assert) {
          let value = '!"§$%&/()=?"';
          this.cookies.write(COOKIE_NAME, value);

          assert.ok(document.cookie.includes(`${COOKIE_NAME}=${encodeURIComponent(value)}`));
        });

        test("doesn't encode the value when raw is true", function (assert) {
          let value = '!"§$%&/()=?"';
          this.cookies.write(COOKIE_NAME, value, { raw: true });

          assert.ok(document.cookie.includes(`${COOKIE_NAME}=${value}`));
        });

        test('sets the cookie domain', function (assert) {
          assert.expect(1);
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes('; domain=example.com'));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { domain: 'example.com' });
        });

        test('sets the expiration', function (assert) {
          assert.expect(1);
          let date = new Date();
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes(`; expires=${date.toUTCString()}`));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { expires: date });
        });

        test('sets the max age', function (assert) {
          assert.expect(1);
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes('; max-age=1000'));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { maxAge: 1000 });
        });

        test('sets the secure flag', function (assert) {
          assert.expect(1);
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes('; secure'));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { secure: true });
        });

        test('sets the path', function (assert) {
          assert.expect(1);
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes('; path=/sample-path'));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { path: '/sample-path' });
        });

        test('sets multiple options', function (assert) {
          assert.expect(2);
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes('; path=/sample-path'));
              assert.ok(value.includes('; max-age=1000'));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { path: '/sample-path', maxAge: 1000 });
        });

        test('throws when a larger than allowed cookie is set', function (assert) {
          assert.throws(() => {
            let largeValue =
              '4ic1l5ar5cuo0tzmrmup46za4u3mvbvwpq108fvoa9yi97iy2oovq3tx02b6pdvfd7i38yzaza75jy3alv7qex5s90a56finh1hu53pivk0ei1v8bf2yhc56d3w1ct5b6z8yoo34z785lp0rh28y71jhed1uixuc0lxz7jvwsk3bhx2vfkkbi7n7qhrq0gj5orj0iruc7kirbzdro26wawq9x29xm4shs0smygr072sokz835o6cdqbzx4otgib3qdig4ih0rcx0fy8jabmfhnev5g6c4830311viozls2h2jt1182lkd9xis8o4c0dgypx4rt6wmca1rfwi3fnmugdeq7ft7bblkpawu1785i9phlccp55pu65f75r5ncnusm6im3lma5o2rxsr816oqzvy25wejgr2s1iriogbhf1k5xzj3kukwgxvf74xxz9dsnurlkv4albdormyjr6mucbntzxr067qhae9afvfich85x8f8pumfugwi5tgzoikhx5c6hb34o4m96esg150etr5ni6eyy7c8y0v5ybju4c7o5qqkn4bdmetkxflebi7kac7t6p3i7k38sxi2msdff5gwudaum6kcrfchqs3jcsby8mdj9qpo5w60cejl7l4b4ijurho4tupko384movxaolzk896ph4wcbw0x7bechojepiczetwankmj6unuedz3rehc895kutsy3tsgv8os7hppmbeu3lcnpb03gf38tkgeg7ystkdkuttyzyium4sf26ky7ggw7jzstcp2yfbhvnsfibirsmga4e69fyz382omf49bqgde2cvyz8ah286fpmfhy0w1akpcq3a7t9ulmf3yec246rez8s45e7sp6f0cqnaixjdugk48yxmdiukf72kq3cgxaswfudd8dnidxmy7dqupk7d74gyrlpunz6munu30l4t5wmsijewpfgmcotg8swvnyu89rrofub1fjgco6ofujgqqilppi561pn4lx0423hfsn9orv4vnh66ba8c7oiisale9abej55wnd9h8putotwu2qyo7rlmhj0ljrm5qqqiw9wlfupne56yxcgipw6lvoq169etef7614uku0t98xnjtbtp1aow2iirkofua66gkx5bdcplr6wle1jdpglr5r3nnr6hjx2tc5np3nnoordddd4knfvy7iizx7kkh4yvzhj6unngy9lscyznn0tfnvm3yrxr55f1rlqars6dvg0swtjsijtme87ihr14v2m74w5b8v9yi6bkgtjh0s3qc867dartrk47wiuy34ag4q5cbc3pvdstwqzhwga6cz7hdav7jwlo3bxcw2xy8y76d2marpucv7zdwluasbj384p7es18ca7jlazclax8w0sqsvq4e5coy6b8pux295ll5grm4y6o95sn8f604u6rhwec35hekkufe8sbyfcge7gv3jvscjuf1hy0jryz35mvbyie1a6trfcx24tr75w6mqz6ke9p2vm0gwhdlxlm6wr99n001v9h9kh6829ahqmkjube048oebffkgxe3h40abponjhhl9m7k71uknotwshpe8mm59549d8iotk8geni8z1ecb5r2nk10622om52ndzw1tuoy658af5ireg819u0jqnespqvwoylxkkw2bcqqregqanwpojjnauehl8swhfur8q0avpmqkhrtj58p7w8g38tr9e3eclmjjgoocs4ezpxie1flgcxqedsewos6xnyd0nahhq1jges3bgj7u4o2yood6xefceiwavufw96tcs163ectl1fyymvds8izi9vev567rdvji7xx8wpb82ovlydb6mlhob0misikzs9zxbyvkfmgslgyn7emj7gu6hjwvatqzraswelnj3hpr79cgit3d9x4q2vjwmw63izyohxstvcq92hthdhfupryl7m5qyny3ni34xvzrikrkq0cfragc7gjrni8172960re4kxr9osyvif4flxbp9me232n8nngqyh70xofwuz80c6o3obmzg71gieaxey5usdqtxsnmrvnw0poqi7bitpkbrny4mbp0s1n7w8n5s2n5ic7ui2cv6nodce3yckfd5xanigopgml0epsbputval3wphitjhgvm79fyffc058nmpexjx5t9x5xtmltey3dwgwrhyh8udm6smu9wqeydo2ri4hpgdffrcc5jkx9ejwepkd26fseza4s7qurgj0gihgovne2zx8l6yq6f90gm06tturm2pp7o58671o74jk2oy9x3o23a89ae3kfk2irobz3rk9f9tqxcqwzftrb8hjrtof9xbkoga0bh6n7o4wyrga9mi2ttiw3iadp7jq3bgeia8p92k01ucbdf8blb54r02wzmutihor4sxjozodcz5oz0pq7hlgdgizf3beb2vppdimzn6q6ftbchr0qd7amdb41zx3fmf512w7yimmd15ctjwwgbqaxukmwvhfca04bmtpwtqcl5ikp07le34e9wkhcehzrb3btjk0o05cdtxp73y9q3h9b56laki1p397yv30xzh7icdqaa6m7ctsupen0vx84z0hat3qtxzogsry4f44sv3p0ctfia1xgefucmpm9uyfdq59sv3p5momwh296azdjnbnksr677cogfsbeafcgpu7ke86p42licbw9y3icwbb4lkxdjl7q1wtd324y4k93dvj70szf03uh4n9mpfwo877ua9emujvfzedh1qwujmad5i6g25ien862zegcc8btilsad5ap33i797fm0842e79k6faqrbe5h2s3vyemlnwhf4d89d3qod7vaobvaxjckbsv8ad8e7jh91exya7pcstt4p55j7zve1bvkflaipei8gypbxcl1kgb1jlayuz2xwxsvpagk6ba84wutfwrm37oe9yqn7necizf917jjsqohh13osb8cnogft181jmc1pib20oss31n4j1ovtkiz7zprbr9komxtu03pqkrzjpsjfbk5gf19zf0v774hiyu9z2byeqkih7f4xk9v3r5w0dos32k5jh4riin2wp1933yjk8pajinaoj2g02eguoroosbq8kw7mvqj1ec348qvt2lqbgq1jb0djq7bokxrjuupu0ol4uzrru4ygov4zngp2ysju3w4we471qkd73fhlezb534brxl5lxfk2epcutn7h50b8qrjinj1job8sufex2fusyklnicouavv6jeec6fxtzczjyzov4pcdjvetkz1jbkksndh81joqtb35h6yh17ej68b80t9d7prms14di28c9hw73umh59fj89njolbxtvi6c1uun6472e65zceewxxu9jovxk84ezbzo3wt6gagwirri1dopruiyex6fickz3jl3pl374mpp0b291ty6m81fwvkc69wt29y9hxljoxmxw4j8mb92dcnsse55qcoepazk6qasmwzkggtobv1ssimvkt3xg3hgtm1muf0u6fi5digak1h0sbk6dqsl3xl7cniz0mbte979d2ble3g6b5mib9p59t6tbqrf6p66wa5bk5bjdethazqwrimjyw9onc1u52y2afirgwncca9tdq8adc7wyuina6bors5kgf39m8rkdvf319fe95faurxaquwjklxxka4ocr6rz0t497mjl8dvxt4uve63funlfpofchpp9dxp8mcdry7mr7swcphy0m9afwdfw9bcdfr5lrq2t6tockwnzcjzprt1ratbr2ricd1ggqo791e1vsiu1w8l3f66st4rkjtyuorav2lq95lwx9tpyrh3pyjtk2hllmrm634lj8mrc2aefgct692e18a1j1j0c2bry7n46u0yvrv9n9mhixndaqpvwdabclzq4hgqc6cz9klpmsinmqczqd4t3god79ahvx7182eckcn6ttn6bllu2ns6mzj8wdzr1yt4qudsvocy82f7uwn1ev6wzed16garkdxpscywj96454xld3vnxakxqigfuvtrdp3njqisl8cgqq3qszn6shwgxluhfnlf2jkocnmopec6s46y39mq5j8jvjep5o3q7urbiuj9u8x47cv3uormdo1z0gq19mfiykigxsx9tlxaxs1k9ja0hggmsch0yx8ibi4czqbr131fmwsjm0zi9ffzkt06mokdnwzcwhwmdwir09gqqxn9o609fu8bdo825mv3wk41urm0fps46y681t7k88kvldto8asakkgobydit3gxhi5egmve3sgt328a3s6svomgm';
            this.cookies.write(COOKIE_NAME, largeValue);
          });
        });

        test('throws when using the httpOnly option', function (assert) {
          assert.throws(() => {
            this.cookies.write(COOKIE_NAME, 'test', { httpOnly: true });
          });
        });

        test('sets the sameSite flag', function (assert) {
          assert.expect(1);
          defineProperty(this.fakeDocument, 'cookie', {
            set(value) {
              assert.ok(value.includes('; SameSite=Strict'));
            },
          });

          this.cookies.write(COOKIE_NAME, 'test', { sameSite: 'Strict' });
        });
      });

      module('clearing a cookie', function () {
        itValidatesClearOptions.apply(this);

        test('clears the cookie', function (assert) {
          let value = randomString();
          let pathname = window.location.pathname;
          let path = pathname.substring(0, pathname.lastIndexOf('/'));
          document.cookie = `${COOKIE_NAME}=${value}; path=${path};`;

          assert.equal(this.cookies.read(COOKIE_NAME), value);

          this.cookies.clear(COOKIE_NAME);

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        module('with a path option', function () {
          test('clears the cookie set without path', function (assert) {
            let value = randomString();
            let pathname = window.location.pathname;
            let path = pathname.substring(0, pathname.lastIndexOf('/'));
            this.cookies.write(COOKIE_NAME, value);

            assert.equal(this.cookies.read(COOKIE_NAME), value);

            this.cookies.clear(COOKIE_NAME, { path });

            assert.equal(this.cookies.read(COOKIE_NAME), undefined);
          });

          test('clears the cookie set for a given path', function (assert) {
            let path = document.location.pathname;
            let value = randomString();
            this.cookies.write(COOKIE_NAME, value, { path });

            assert.equal(this.cookies.read(COOKIE_NAME), value);

            this.cookies.clear(COOKIE_NAME, { path });

            assert.equal(this.cookies.read(COOKIE_NAME), undefined);
          });
        });

        module('with a domain option', function () {
          test('clears the cookie set without domain', function (assert) {
            let domain = window.location.hostname;
            let value = randomString();
            this.cookies.write(COOKIE_NAME, value);

            assert.equal(this.cookies.read(COOKIE_NAME), value);

            this.cookies.clear(COOKIE_NAME, { domain });

            assert.equal(this.cookies.read(COOKIE_NAME), undefined);
          });

          test('clears the cookie set for a given domain', function (assert) {
            let domain = window.location.hostname;
            let value = randomString();
            this.cookies.write(COOKIE_NAME, value, { domain });

            assert.equal(this.cookies.read(COOKIE_NAME), value);

            this.cookies.clear(COOKIE_NAME, { domain });

            assert.equal(this.cookies.read(COOKIE_NAME), undefined);
          });
        });
      });

      module("checking for a cookie's existence", function () {
        test('returns true when the cookie exists', function (assert) {
          let value = randomString();
          document.cookie = `${COOKIE_NAME}=${value};`;

          assert.ok(this.cookies.exists(COOKIE_NAME));
        });

        test('returns true when the cookie exists with a falsy value', function (assert) {
          document.cookie = `${COOKIE_NAME}=;`;

          assert.ok(this.cookies.exists(COOKIE_NAME));
        });

        test('returns false when the cookie does not exist', function (assert) {
          assert.notOk(this.cookies.exists(COOKIE_NAME));
        });
      });

      itReadsAfterWrite.apply(this);
    }

    module('in a FastBoot-enabled app', function (hooks) {
      hooks.beforeEach(function () {
        this.fakeFastBoot = {
          isFastBoot: false,
        };
      });

      itUsesBrowserAPIs.apply(this, [hooks]);
    });

    module('in an app that is not FastBoot-enabled', function (hooks) {
      hooks.beforeEach(function () {
        this.fakeFastBoot = null;
      });

      itUsesBrowserAPIs.apply(this, [hooks]);
    });
  });

  module('in the FastBoot server', function (hooks) {
    hooks.beforeEach(function () {
      let request = class Request extends EmberOject {
        constructor() {
          super(...arguments);
          this.cookies = {};
          this.headers = {
            append() {},
          };
        }
        get host() {
          return this._host;
        }
      };

      const responseHeaders = {};

      this.fakeFastBoot = {
        isFastBoot: true,
        response: {
          headers: {
            getAll(name) {
              if (name) {
                return responseHeaders[name] || [];
              } else {
                return responseHeaders;
              }
            },
            append(name, value) {
              let entry = responseHeaders[name] || [];
              responseHeaders[name] = entry;
              entry.push(value);
            },
          },
        },
        request: request.create(),
      };
      this.cookies.setProperties({
        _fastBoot: this.fakeFastBoot,
      });
    });

    module('reading a cookie', function (hooks) {
      itValidatesReadOptions.apply(this, [hooks]);

      test('returns the cookie value', function (assert) {
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value);

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test('URI-component-decodes the value', function (assert) {
        let value = '!"§$%&/()=?"';
        this.cookies.write(COOKIE_NAME, value);

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test("doesn't decode the value when raw is true", function (assert) {
        let value = '!"§$%&/()=?"';
        this.cookies.write(COOKIE_NAME, value);

        assert.equal(this.cookies.read(COOKIE_NAME, { raw: true }), encodeURIComponent(value));
      });

      test('returns undefined when the cookies does not exist', function (assert) {
        assert.equal(this.cookies.read('does-not-exist'), undefined);
      });

      test('returns undefined for a cookie that was written for another path', function (assert) {
        this.fakeFastBoot.request.path = '/path';
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { path: '/some-other-path' });

        assert.equal(this.cookies.read(COOKIE_NAME), undefined);
      });

      test('returns the cookie value for a cookie that was written for the same path', function (assert) {
        this.fakeFastBoot.request.path = '/path';
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { path: '/path' });

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test('returns undefined for a cookie that was written for another domain', function (assert) {
        this.fakeFastBoot.request._host = 'example.com';
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { domain: 'another-domain.com' });

        assert.equal(this.cookies.read(COOKIE_NAME), undefined);
      });

      test('returns the cookie value for a cookie that was written for the same domain', function (assert) {
        this.fakeFastBoot.request._host = 'example.com';
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { domain: 'example.com' });

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test('returns the cookie value for a cookie that was written for a parent domain', function (assert) {
        this.fakeFastBoot.request._host = 'sub.example.com';
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { domain: 'example.com' });

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test('returns undefined for an expired cookie', function (assert) {
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { expires: new Date(-1) });

        assert.equal(this.cookies.read(COOKIE_NAME), undefined);
      });

      test('returns the cookie value for a not-yet-expired cookie', function (assert) {
        let expirationDate = new Date();
        expirationDate.setDate(new Date().getDate() + 1);
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { expires: expirationDate });

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test('returns undefined for a cookie that reached its max age', function (assert) {
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { maxAge: -1 });

        assert.equal(this.cookies.read(COOKIE_NAME), undefined);
      });

      test('returns the cookie value for a cookie that has not yet reached its max age', function (assert) {
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value, { maxAge: 99999999 });

        assert.equal(this.cookies.read(COOKIE_NAME), value);
      });

      test('respects the request headers after a cookie was written already', function (assert) {
        let writtenValue = randomString();
        this.cookies.write(COOKIE_NAME, writtenValue);
        let requestValue = randomString();
        this.fakeFastBoot.request.cookies = { aRequestCookie: requestValue };

        assert.deepEqual(this.cookies.read(), {
          [COOKIE_NAME]: writtenValue,
          aRequestCookie: requestValue,
        });
      });

      test('works when the cookie contains a "="', function (assert) {
        let value = `${randomString()}=${randomString()}`;
        this.cookies.write(COOKIE_NAME, value);
        let afterRoundtrip = this.cookies.read(COOKIE_NAME);

        assert.equal(afterRoundtrip, value);
      });
    });

    module('writing a cookie', function () {
      itValidatesWriteOptions.apply(this);

      test('writes the value', function (assert) {
        assert.expect(2);
        let value = randomString();

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=${value}`);
        };

        this.cookies.write(COOKIE_NAME, value);
      });

      test('writes the same name only once', function (assert) {
        let value1 = randomString();
        let value2 = randomString();

        this.cookies.write(COOKIE_NAME, value1);
        this.cookies.write(COOKIE_NAME, value2);

        const headers = this.fakeFastBoot.response.headers.getAll('set-cookie');
        assert.equal(headers.length, 1);
        assert.notEqual(headers[0], `${COOKIE_NAME}=${value1}`);
        assert.equal(headers[0], `${COOKIE_NAME}=${value2}`);
      });

      test('URI-component-encodes the value', function (assert) {
        assert.expect(2);
        let value = '!"§$%&/()=?"';
        let encodedValue = encodeURIComponent(value);

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=${encodedValue}`);
        };

        this.cookies.write(COOKIE_NAME, value);
      });

      test("doesn't encode the value when raw is true", function (assert) {
        assert.expect(2);
        let value = '!"§$%&/()=?"';

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=${value}`);
        };

        this.cookies.write(COOKIE_NAME, value, { raw: true });
      });

      test('sets the cookie domain', function (assert) {
        assert.expect(2);
        let domain = 'example.com';
        this.fakeFastBoot.request._host = domain;

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; domain=${domain}`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { domain });
      });

      test('sets the expiration', function (assert) {
        assert.expect(2);
        let date = new Date();

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; expires=${date.toUTCString()}`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { expires: date });
      });

      test('sets the max age', function (assert) {
        assert.expect(2);
        let maxAge = 10;

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; max-age=${maxAge}`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { maxAge });
      });

      test('sets the secure flag', function (assert) {
        assert.expect(2);
        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; secure`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { secure: true });
      });

      test('sets the path', function (assert) {
        assert.expect(2);
        let path = '/sample-path';

        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; path=${path}`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { path });
      });

      test('sets the httpOnly flag', function (assert) {
        assert.expect(2);
        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; httpOnly`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { httpOnly: true });
      });

      test('allows the httpOnly option', function (assert) {
        assert.expect(0);

        this.cookies.write(COOKIE_NAME, 'test', { httpOnly: true });
      });

      test('sets the sameSite flag', function (assert) {
        assert.expect(2);
        this.fakeFastBoot.response.headers.append = function (headerName, headerValue) {
          assert.equal(headerName, 'set-cookie');
          assert.equal(headerValue, `${COOKIE_NAME}=test; SameSite=Strict`);
        };

        this.cookies.write(COOKIE_NAME, 'test', { sameSite: 'Strict' });
      });
    });

    module('clearing a cookie', function (hooks) {
      itValidatesClearOptions.apply(this, [hooks]);

      test('clears the cookie', function (assert) {
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value);

        assert.equal(this.cookies.read(COOKIE_NAME), value);

        this.cookies.clear(COOKIE_NAME);

        assert.equal(this.cookies.read(COOKIE_NAME), undefined);
      });

      module('with a path option', function () {
        test('clears the cookie set without path', function (assert) {
          this.fakeFastBoot.request.path = '/path';
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value);

          assert.equal(this.cookies.read(COOKIE_NAME), value);

          this.cookies.clear(COOKIE_NAME, { path: '/path' });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        test('clears the cookie set for a given path', function (assert) {
          let path = '/path';
          this.fakeFastBoot.request.path = path;
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value, { path });

          assert.equal(this.cookies.read(COOKIE_NAME), value);

          this.cookies.clear(COOKIE_NAME, { path });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });
      });

      module('with a domain option', function () {
        test('clears the cookie set without domain', function (assert) {
          let domain = 'example.com';
          this.fakeFastBoot.request._host = domain;
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value);

          assert.equal(this.cookies.read(COOKIE_NAME), value);

          this.cookies.clear(COOKIE_NAME, { domain });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });

        test('clears the cookie set for a given domain', function (assert) {
          let domain = 'example.com';
          this.fakeFastBoot.request._host = domain;
          let value = randomString();
          this.cookies.write(COOKIE_NAME, value, { domain });

          assert.equal(this.cookies.read(COOKIE_NAME), value);

          this.cookies.clear(COOKIE_NAME, { domain });

          assert.equal(this.cookies.read(COOKIE_NAME), undefined);
        });
      });
    });

    module("checking for a cookie's existence", function () {
      test('returns true when the cookie exists', function (assert) {
        let value = randomString();
        this.cookies.write(COOKIE_NAME, value);

        assert.ok(this.cookies.exists(COOKIE_NAME));
      });

      test('returns true when the cookie exists with a falsy value', function (assert) {
        this.cookies.write(COOKIE_NAME);

        assert.ok(this.cookies.exists(COOKIE_NAME));
      });

      test('returns false when the cookie does not exist', function (assert) {
        assert.notOk(this.cookies.exists(COOKIE_NAME));
      });
    });

    itReadsAfterWrite.apply(this, [hooks]);
  });
});
