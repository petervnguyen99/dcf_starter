(() => {

  'use strict';

  /**************** Gulp.js 4 configuration ****************/

  const

    // development or production
    devBuild  = ((process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development'),

    // modules
    gulp            = require('gulp'),
    del             = require('del'),
    noop            = require('gulp-noop'),
    size            = require('gulp-size'),
    sass            = require('gulp-sass'),
    sassGlob        = require('gulp-sass-glob'),
    autoprefixer    = require('autoprefixer'),
    objectFitImages = require('postcss-object-fit-images'),
    postcss         = require('gulp-postcss'),
    sourcemaps      = require('gulp-sourcemaps'),
    concat          = require('gulp-concat'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber'),
    uglify = require('gulp-uglify');

  console.log('Gulp', devBuild ? 'development' : 'production', 'build');


  /**************** clean tasks ****************/

  function cleanCSS() {

    return del([ 'css' ]);

  }
  exports.cleanCSS = cleanCSS;

  function cleanJS() {

    return del([ 'js' ]);

  }
  exports.cleanJS = cleanJS;

  /**************** CSS task ****************/

  const cssConfig = {

    src         : 'scss/{,*/}*.{scss,sass}',
    watch       : 'scss/{,*/}*.{scss,sass}',
    build       : 'css/',
    plugins:    [
      autoprefixer(),
      objectFitImages()
    ],
    sassOpts: {
      sourceMap       : true,
      outputStyle     : 'nested',
      includePaths:   [ 'node_modules/modularscale-sass/stylesheets' ],
      precision       : 2,
      errLogToConsole : true
    }

  };

  const jsConfig = {
    src:                'node_modules/dcf/js/es6/'
  }

  const jsCompileConfig = require('./js-compile-config.json');

  const jsModules = {
    lazyLoad:           'dcf-lazyLoad.js',
    modal:              'dcf-modal.js',
    utility:            'dcf-utility.js'
  }

  function css() {

    return gulp.src(cssConfig.src)
      .pipe(sourcemaps ? sourcemaps.init() : noop())
      .pipe(sassGlob())
      .pipe(sass(cssConfig.sassOpts).on('error', sass.logError))
      .pipe(postcss(cssConfig.plugins))
      .pipe(sourcemaps ? sourcemaps.write('.') : noop())
      .pipe(size({ showFiles:true }))
      .pipe(gulp.dest(cssConfig.build));

  }
  exports.css = gulp.series(cleanCSS, css);

  function js(done) {

    let jsFiles = [];
    if (jsCompileConfig.compileJs) {
      Object.keys(jsModules).forEach((module) => {
        if (jsCompileConfig[module]) {
          console.log('Including module ' + module + '...');
          jsFiles.push(jsConfig.src + jsModules[module]);
        }
      });
    }

    if (jsFiles.length) {
      return gulp.src(jsFiles)
        .pipe(plumber())
        // Transpile the JS code using Babel's preset-env.
        .pipe(babel({
          presets: [
            ['@babel/env', {
              modules: false
            }]
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties'
          ]
        }))
        .pipe(concat('dcf.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('js/'));
    } else {
      done();
    }
  }
  exports.js = js;

  /**************** watch task ****************/

  function watch(done) {

    // CSS changes
    gulp.watch(cssConfig.watch, css);

    done();
  }

  /**************** default task ****************/
  exports.scripts =  gulp.series(exports.cleanJS, exports.js);
  exports.styles = gulp.series(exports.css, watch);
  exports.default = gulp.series(gulp.parallel(exports.scripts, exports.styles));

})();
