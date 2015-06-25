'use strict';
/*global require: false, module: false*/

var dependencies = {};
dependencies['ampersand-state'] = require('ampersand-state');
dependencies['ampersand-view'] = require('ampersand-view');
dependencies['ampersand-collection'] = require('ampersand-collection');
dependencies.classList = require('./classList');

module.exports = function (name) {
  return dependencies[name];
};
