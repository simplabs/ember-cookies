/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-cookies',

  treeForAddonTestSupport(tree) {
    return this.preprocessJs(tree, '/', this.name, {
      registry: this.registry,
    });
  }
};
