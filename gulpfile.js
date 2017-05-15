var gulp = require('gulp');
var jshint = require('gulp-jshint');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var jsmin = require('gulp-jsmin');
var sourcemaps = require('gulp-sourcemaps');

var getJSLibSources = function() {
    return gulp.src([
        'app/Frontend/js/lib/angular/angular.js',
        //'app/Frontend/js/lib/angular/jquery.min.js',
        'app/Frontend/js/lib/*.js'
    ]);
};

var getJSAppSources = function() {
    return gulp.src([
        'app/Frontend/js/config/*.js',
        'app/Frontend/js/*.js',
        'app/Frontend/js/classes/*.js',
        'app/Frontend/js/services/*.js',
        'app/Frontend/js/controllers/*.js'
    ]);
};



gulp.task('clean',function(){
    return gulp.src('public/js/')
        .pipe(clean());
});

gulp.task('lib', ['clean'], function(){
    return  getJSLibSources()
        //.pipe(sourcemaps.init())
        .pipe(concat('lib.js'))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('public/js/'));
});

gulp.task('app',['lib'], function() {
    return  getJSAppSources()
    //.pipe(jshint())
    //.pipe(jshint.reporter('default'))
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write('.'))
        //.pipe(jsmin()) //n minificar agora.
        .pipe(gulp.dest('public/js/'));
});


gulp.task('watch', function() {  //pra poder rodar o gulp automaticamente qdo houverem mudanças.
    gulp.watch('app/Frontend/js/**/*.js',['app']);
});

gulp.task('default',['watch']);