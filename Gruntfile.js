/* jshint node: true */
'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    less: {
      options: {
        paths: [
          'node_modules/bootstrap/less',
          'node_modules'
        ]
      },

      styles: {
        files: {
          'dist/gh-pages.css':      'styles/gh-pages.less',
          'dist/styles-editor.css': 'styles/styles-editor.less'
        }
      }
    },


    browserify: {
      scripts: {
        options: {
          browserifyOptions: {
            standalone: 'StylesEditor',
            list: true,
            debug: true
          }
        },
        files: {
          '.tmp/styles-editor.js': 'scripts/styles-editor.js'
        }
      }
    },


    concat: {
      scripts: {
        files: {
          'dist/styles-editor.js': [
            'node_modules/grunt-contrib-less/node_modules/less/dist/less.js',
            '.tmp/styles-editor.js'
          ]
        }
      }
    },


    copy: {
      examples: {
        files: [
          {
            expand: true,
            cwd: 'examples/',
            src: '**',
            dest: 'dist/'
          }
        ]
      },
      styles: {
        files: [
          {
            expand: true,
            cwd: 'styles/',
            src: '**/*.less',
            dest: 'dist/'
          }
        ]
      },
      bootstrap: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/',
            src: 'bootstrap/less/**/*.less',
            dest: 'dist/'
          }
        ]
      }
    },


    connect: {
      dev: {
        options: {
          port: 9997,
          livereload: 9996,
          base: [
            'dist',
            'styles',
            'node_modules/bootstrap/less'
          ]
        }
      }
    },


    watch: {
      less: {
        files: [
          'styles/**/*.less'
        ],
        tasks: [
          'less:styles',
          'copy:styles'
        ]
      },

      scripts: {
        files: [
          'scripts/**/*.js',
        ],
        tasks: [
          'browserify:scripts'
        ]
      },

      tmp: {
        files: [
          '.tmp/*.js'
        ],
        tasks: [
          'concat'
        ]
      },

      examples: {
        files: [
          'examples/**.*'
        ],
        tasks: ['copy:examples']
      },

      connect: {
        options: {
          livereload: 9996
        },
        files: [
          'dist/**.*',
          '!dist/*.less'
        ],
        tasks: []
      }
    }
  });


  grunt.registerTask('build', [
    'copy',
    'browserify',
    'concat',
    'less'
  ]);


  grunt.registerTask('default', [
    'build',
    'connect:dev',
    'watch'
  ]);
};
