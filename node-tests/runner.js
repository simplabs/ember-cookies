/* global require, process */
let glob = require('glob');
let Mocha = require('mocha');

let root = 'node-tests/acceptance';

let mocha = new Mocha({
  timeout: 5000,
  reporter: 'spec'
});

let testFiles = glob.sync(`${root}/**/*-test.js`);

addFiles(mocha, testFiles);

try {
  runMocha();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
}

function addFiles(mocha, files) {
  files = (typeof files === 'string') ? glob.sync(root + files) : files;
  files.forEach(mocha.addFile.bind(mocha));
}

function runMocha() {
  mocha.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures);
    });
  });
}
