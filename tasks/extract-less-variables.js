'use strict';
/*global module: false*/
module.exports = function (grunt) {
  var exp = /\@([a-zA-Z0-9_-]+)\s*:\s*(.*);/mg;
  grunt.registerMultiTask('extract-less-variables', function () {
    var config = grunt.config('extract-less-variables.'+ this.target);
    Object.keys(config.files).forEach(function (destination) {
      var sources = config.files[destination];
      sources = Array.isArray(sources) ? sources : [sources];
      var vars = {};
      sources.forEach(function (filepath) {
        var content = grunt.file.read(filepath);
        var match = exp.exec(content);
        while (match !== null) {
          vars[match[1].trim()] = match[2].trim();
          match = exp.exec(content);
        }
      });
      grunt.file.write(destination, JSON.stringify(vars));
    });
  });
};
