'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ['ember'],
  extends: ['eslint:recommended', 'plugin:ember/recommended', 'plugin:prettier/recommended'],
  env: {
    browser: true,
  },
  rules: {},
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '**/.eslintrc.js',
        '.prettierrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'index.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js',
      ],
      excludedFiles: ['addon/**', 'addon-test-support/**', 'app/**', 'tests/dummy/app/**'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
    },
    // test files
    {
      files: ['tests/**/*-test.js'],
      excludedFiles: ['tests/dummy/**'],
      plugins: ['qunit'],
      extends: ['plugin:qunit/recommended'],
    },
    // node test files
    {
      files: ['node-tests/**/*-test.js'],
      env: {
        browser: false,
        node: true,
      },
      plugins: ['mocha'],
      extends: ['plugin:mocha/recommended'],
      rules: {
        'mocha/no-hooks-for-single-case': 'off',
      },
    },
  ],
};
