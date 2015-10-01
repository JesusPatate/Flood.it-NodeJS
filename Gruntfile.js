'use strict';

module.exports = function(grunt) {

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
        src: ['test/**/*.js']
      },
      report: {
        options: {
          reporter: 'xunit',
          captureFile: 'reports/test/test-reports.xml',
          quiet: true
        },
        src: ['test/**/*.js']
      }
    },
    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          coverageFolder: 'reports/coverage'
        }
      },
    },
    docco: {
      all: {
        src: ['lib/**/*.js'],
        dest: 'docs/'
      }
    },
    sonarRunner: {
      analysis: {
        options: {
          debug: true,
          separator: '\n',
          sonar: {
            host: {
              url: 'http://localhost:9000'
            },
            jdbc: {
              url: 'jdbc:postgresql://localhost/sonar',
              username: 'sonar',
              password: 'sonar'
            },

            projectKey: 'fr.jesuspatate:floodit:0.0.1',
            projectName: 'Flood.it',
            projectVersion: '0.0.1',
            sources: 'lib',
            tests: 'test',
            language: 'js',
            sourceEncoding: 'UTF-8',
            javascript: {
              lcov: {
                reportPath: 'reports/coverage/lcov.info'
              }
            }
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-sonar-runner');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['jshint', 'mochaTest:test']);
  grunt.registerTask('test-report', ['jshint', 'mochaTest:report']);
  grunt.registerTask('doc', 'Generates code documentation', ['docco']);
  grunt.registerTask('sonar', 'Launches SonarQube analysis', ['mocha_istanbul:coverage', 'sonarRunner:analysis']);
};