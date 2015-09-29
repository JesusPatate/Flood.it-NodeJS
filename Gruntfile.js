'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        browser: true,
        devel: true,
        globalstrict: true,
        expr: true,
        globals: {
          require: false,
          process: false,
          module: false,
          describe: false,
          it: false,
          afterEach: false
        },
      },
      all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: false, // Optionally suppress output to standard out (defaults to false) 
          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false) 
        },
        src: ['test/**/*.js']
      }
    },
    docco: {
      all: {
        src: ['lib/**/*.js'],
        dest: 'docs/'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-docco');

  // Default task(s).
  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);
  grunt.registerTask('doc', 'Generates code documentation', ['docco']);
};