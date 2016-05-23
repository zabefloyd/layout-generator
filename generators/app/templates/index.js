// hidden task runner

'use strict';


//require the dependencies
var gulp = require('gulp');
var ngAnnotate = require('gulp-ng-annotate');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var karma = require ('gulp-karma');
var usemin = require('gulp-usemin');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var del = require ('del');
var checkstyleReporter = require('gulp-jshint-checkstyle-reporter');
var templateCache = require('gulp-angular-templatecache');
var sourcemaps = require('gulp-sourcemaps');
var inject = require('gulp-inject-string');
var runSequence = require ('run-sequence');
var path = require('path');
var gulpCopy = require('gulp-copy');

// CASEMANAGER TASKS
gulp.task ('app:test', function () {
  // Be sure to return the stream
  // NOTE: Using the fake './foobar' so as to run the files
  // listed in karma.conf.js INSTEAD of what was passed to
  // gulp.src !
  return gulp.src ('./foobar')
    .pipe (karma ({
    configFile: __dirname + '/config/karma.case-manager.conf.js',
    action: 'run'
  }))
    .on ('error', function (err) {
    // Make sure failed tests cause gulp to exit non-zero
    throw err;
  });
});

gulp.task('app:jsHint', function() {
  return gulp.src([
    'app/scripts/*.js',
    'app/scripts/**/*.js',
    'server.js'
  ])
    .pipe(jshint())
    .pipe(checkstyleReporter({filename: 'checkstyle-result.xml'}))
    .pipe(gulp.dest('test'));
});

gulp.task('app:templates', function () {
  return gulp.src('./app/views/**/*.html')
    .pipe(minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    }))
    .pipe(templateCache({
      module: 'CaseManager',
      root: 'views'
    }))
    .pipe(gulp.dest('./app/scripts'));
});

gulp.task('app:build', function() {
  return gulp.src('./app/index.html')
    .pipe(inject.after('<script src="scripts/app.js"></script>', '\n <script src="scripts/templates.js"></script>\n'))
    .pipe(usemin({
      components: [sourcemaps.init(), uglify, sourcemaps.write()],
      app: [sourcemaps.init(), ngAnnotate, uglify, sourcemaps.write()],
      html: [minifyHtml],
      css: [minifyCss, 'concat']
    }))
    .pipe(gulp.dest('dist/app'));
});

gulp.task('app:copy', function() {
  return gulp.src('./app/components/angular-moog-components/dist/css/images/*.*')
    .pipe(gulpCopy('dist/app/css', {prefix: 5}));
});

gulp.task('app:clean', function() {
  return del(['dist/app', 'app/scripts/templates.js'])
});

gulp.task('app:clean:templates', function() {
  return del(['app/scripts/templates.js'])
});

gulp.task('app:minify', function() {
  return runSequence('app:templates', 'app:build', 'app:copy', 'app:clean:templates')
});


// REMOTE VIEWER TASKS
gulp.task ('remoteviewer:test', function () {
  // Be sure to return the stream
  // NOTE: Using the fake './foobar' so as to run the files
  // listed in karma.conf.js INSTEAD of what was passed to
  // gulp.src !
  return gulp.src ('./foobar')
    .pipe (karma ({
      configFile: __dirname + '/config/karma.remote-viewer.conf.js',
      action: 'run'
    }))
    .on ('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('remoteviewer:jsHint', function() {
  return gulp.src([
      'remote-viewer/scripts/*.js',
      'remote-viewer/scripts/**/*.js'
    ])
    .pipe(jshint())
    .pipe(checkstyleReporter({filename: 'checkstyle-remoteviewer-result.xml'}))
    .pipe(gulp.dest('test'));
});

gulp.task('remoteviewer:templates', function () {
  return gulp.src('./remote-viewer/views/**/*.html')
    .pipe(minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    }))
    .pipe(templateCache({
      module: 'RemoteViewer',
      root: 'views'
    }))
    .pipe(gulp.dest('./remote-viewer/scripts'));
});

gulp.task('remoteviewer:build', function() {
  return gulp.src('./remote-viewer/index.html')
    .pipe(inject.after('<script src="scripts/remote-viewer.js"></script>', '\n <script src="scripts/templates.js"></script>\n'))
    .pipe(usemin({
      components: [sourcemaps.init(), uglify, sourcemaps.write()],
      app: [sourcemaps.init(), ngAnnotate, uglify, sourcemaps.write()],
      html: [minifyHtml],
      css: [minifyCss]
    }))
    .pipe(gulp.dest('dist/remote-viewer'));
});

gulp.task('remoteviewer:clean', function() {
  return del(['dist/remote-viewer', 'remote-viewer/scripts/templates.js'])
});

gulp.task('remoteviewer:clean:templates', function() {
  return del(['remote-viewer/scripts/templates.js'])
});

gulp.task('remoteviewer:copy', function() {
  return gulp.src('./app/components/angular-moog-components/dist/css/images/*.*')
    .pipe(gulpCopy('dist/remote-viewer/css', {prefix: 5}));
});

gulp.task('remoteviewer:minify', function() {
  return runSequence('remoteviewer:templates', 'remoteviewer:build', 'remoteviewer:copy', 'remoteviewer:clean:templates')
});

gulp.task ('clean', function () {
  return runSequence('app:clean', 'remoteviewer:clean');
});

gulp.task('minify', function() {
  return runSequence('app:minify', 'remoteviewer:minify')
});

gulp.task('remoteviewer', function() {
  runSequence('remoteviewer:clean', 'remoteviewer:jsHint', 'remoteviewer:minify', 'remoteviewer:test')
});

gulp.task('app', function() {
  runSequence('app:clean', 'app:jsHint', 'app:minify', 'app:test')
});

gulp.task('default', function() {
  return runSequence('clean', 'app', 'remoteviewer');
});

gulp.task('updateBuildNumber', function (cb) {
  var fs = require ('fs');
  var packageFile = 'package.json';
  var nr = process.env.BUILD_NUMBER;

  if (nr) {
    fs.readFile (packageFile, function (error, data) {
      if (error) {
        cb(error);
      }
      else {

        try {
          var dataJson = JSON.parse(data);
          dataJson.version = dataJson.version + '+' + nr;
          fs.writeFile (packageFile, JSON.stringify(dataJson, null, 2), function (error) {
            if (error) {
              cb(error);
            }
            else {
              cb();
            }
          })
        } catch (error) {
          cb(error)
        }
      }
    });
  } else {
    cb()
  }
});