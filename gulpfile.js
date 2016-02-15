'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var openURL = require('open');
var lazypipe = require('lazypipe');
var rimraf = require('rimraf');
var wiredep = require('wiredep').stream;
var runSequence = require('run-sequence');

var yeoman = {
  src: 'src',
  dist: 'dist',
  demo: 'demo'
};

var paths = {
  scripts: [yeoman.src + '/**/*.js'],
  styles: [yeoman.src + '/**/*.scss'],
  templates: [yeoman.src + '/**/*.html'],
  test: ['test/spec/**/*.js'],
  testRequire: [
    yeoman.src + '/bower_components/angular/angular.js',
    yeoman.src + '/bower_components/angular-mocks/angular-mocks.js',
    yeoman.src + '/bower_components/angular-resource/angular-resource.js',
    'test/mock/**/*.js',
    'test/spec/**/*.js'
  ],
  karma: 'karma.conf.js',
  view: yeoman.demo + '/index.html'
};

// Reusable pipelines
// --------------------------------------------------------

var lintScripts = lazypipe()
    .pipe($.jshint, '.jshintrc')
    .pipe($.jshint.reporter, 'jshint-stylish');

var build = lazypipe()
    .pipe($.sourcemaps.init)
    .pipe($.ngAnnotate)
    .pipe($.concat, 'jdm-loading-indicator.js')
    .pipe(gulp.dest, yeoman.dist + '/js')
    .pipe($.uglify)
    .pipe($.rename, 'jdm-loading-indicator.min.js')
    .pipe($.sourcemaps.write, './')
    .pipe(gulp.dest, yeoman.dist + '/js');

// Tasks
// --------------------------------------------------------

gulp.task('default', ['build']);

gulp.task('serve', serveTask);
gulp.task('serve:prod', serveProdTask);

gulp.task('lint:scripts', lintScriptsTask);
gulp.task('clean:tmp', cleanTempTask);

gulp.task('start:client', ['start:server'], startClientTask);
gulp.task('start:server', startServerTask);

gulp.task('test', ['start:server:test'], testTask);
gulp.task('start:server:test', startServerTestTask);

gulp.task('watch', ['build'], watchTask);
gulp.task('client:build', clientBuildTask);
gulp.task('build', ['clean:dist', 'compass', 'cacheTemplates'], buildTask);
gulp.task('clean:dist', cleanDistTask);

gulp.task('bower', bowerTask);
gulp.task('compass', compassTask);
gulp.task('compassRename', compassRename);
gulp.task('cacheTemplates', cacheTemplates);

// Task Implementation
// --------------------------------------------------------

function lintScriptsTask() {
    return gulp.src(paths.scripts)
        .pipe(lintScripts());
}

function cleanTempTask(cb) {
    rimraf('./.tmp', cb);  
}

function startClientTask() {
    openURL('http://localhost:9000');
}

function startServerTask() {
    $.connect.server({
        root: [yeoman.demo, yeoman.dist],
        livereload: true,
        // Change this to '0.0.0.0' to access the server from outside.
        port: 9000
    });
}

function startServerTestTask() {
    $.connect.server({
        root: ['test', yeoman.demo],
        livereload: true,
        port: 9001
    }); 	
}
    
function watchTask() {
    $.watch(paths.scripts, $.batch(function (events, done) {
        gulp.start('build', done);
    }));
    
    $.watch(paths.templates, $.batch(function (events, done) {
        gulp.start('cacheTemplates', done);
    }));
        
    $.watch(paths.styles, $.batch(function (events, done) {
        gulp.start('compass', done);
    }));
        
    $.watch(paths.scripts)
        .pipe($.plumber())
        .pipe(lintScripts())    


    $.watch(paths.test)
      .pipe($.plumber())
      .pipe(lintScripts());

    gulp.watch('bower.json', ['bower']);
}

function serveTask(cb) {
    runSequence('clean:tmp',
        ['lint:scripts'],
        ['start:client'],
        'watch', cb);
}

function serveProdTask() {
    $.connect.server({
        root: [yeoman.dist],
        livereload: true,
        port: 9000
    });   
}

function testTask() {
    var testToFiles = paths.testRequire.concat(paths.scripts, paths.test);
    return gulp.src(testToFiles)
        .pipe($.karma({
            configFile: paths.karma,
            action: 'watch'
        }));
}

function bowerTask() {
    return gulp.src(paths.view)
        .pipe(wiredep({
            directory: yeoman.demo + '/bower_components',
            ignorePath: '..'
        }))
        .pipe(gulp.dest(yeoman.demo));
}

function cleanDistTask(cb) {
    rimraf('./dist', cb);
}

function clientBuildTask() {
    return gulp.src(['src/**/*.js', '.tmp/scripts/**/*.js'])
        .pipe(build());
}

function buildTask() {
    runSequence(['client:build', 'compassRename']);
}

function compassTask() {
    return gulp.src('./src/*.scss')
        .pipe($.plumber())

        .pipe($.compass({
            css: '.tmp/styles',
            sass: yeoman.src + '/scss'
        }));
}

function compassRename() {
    return gulp.src('.tmp/styles/loading-indicator.css')
        .pipe($.plumber())
        .pipe($.rename('jdm-loading-indicator.css'))
        .pipe(gulp.dest(yeoman.dist + '/css'))
}

function cacheTemplates() {
    return gulp.src(paths.templates)
        .pipe($.angularTemplatecache({
            module: 'jdm.loadingIndicator'
        }))
        .pipe(gulp.dest('.tmp/scripts'));
}