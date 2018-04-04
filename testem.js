/* eslint-env node */

module.exports = {
  framework: 'mocha',
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: [
    'Chrome',
    'Firefox'
  ],
  launch_in_dev: [
    'Chrome'
  ],
  browser_args: {
    Firefox: {
      mode: 'ci',
      args: [
        '-headless'
      ]
    },
    Chrome: {
      mode: 'ci',
      args: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.TRAVIS ? '--no-sandbox' : null,

        '--headless',
        '--window-size=1440,900',
        '--disable-gpu',
        '--remote-debugging-port=9222'
      ].filter(Boolean)
    }
  }
};
