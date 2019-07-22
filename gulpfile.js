const {
    src,
    dest,
    series,
    parallel,
    watch
} = require('gulp');

// HTML related plugins
const pug = require('gulp-pug');

// CSS related plugins
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');


// JS related plugins
const uglify = require('gulp-uglify');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const stripDebug = require('gulp-strip-debug');
// const concat = require('gulp-concat');

//Image optimize
const imagemin = require('gulp-imagemin');

// Utility plugins
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const options = require('gulp-options');
const gulpif = require('gulp-if');

//Browsers realated plugins
const browserSync = require('browser-sync').create();



// Project related variables

const htmlSRC = './src/views/**/*.pug';
const htmlURL = './dist/';

//css
const styleSRC = './src/scss/style.scss';
const bootstrapSRC = './node_modules/bootstrap/scss/bootstrap.scss';
const styleURL = './dist/css/';
const mapURL = './';

const scssLibrarySRC = './src/lib/css/**/*.scss';


//js
const jsSRC = './src/js/';
const jsURL = './dist/js/';

const jsFront = 'main.js';
const jsFiles = [jsFront];

//config path setting library denpendencies
const jsLibrarySRC = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/lodash/lodash.min.js',
    './node_modules/bootstrap/dist/js/bootstrap.min.js',
    './node_modules/popper.js/dist/umd/popper.min.js'
]

//config path setting library download internet
const donwloadJS_SRC = ['./src/lib/js/download/**/*'];


// image

const imageSRC = './src/images/**/*';
const imageURL = './dist/images/';


//font
const fontsSRC = './src/fonts/**/*';

const awesomeSRC = './node_modules/font-awesome/css/font-awesome.min.css';

const fontsURL = './dist/fonts/';


//watch
const styleWatch = './src/scss/**/*.scss';
const jsWatch = './src/js/**/*.js';
const imgWatch = './src/images/**/*.*';
const fontsWatch = './src/fonts/**/*.*';

const libraryJS_Watch = './src/lib/js/**/*.js';
const donwloadJS_Watch = './src/lib/js/download/**/**.js';




// browser-sync task
function browser_sync(done) {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        }
    });
    done();
}
// reload browser
function reload(done) {
    browserSync.reload();
    done();
}

function htmlTask(done) {
    src(htmlSRC)
        .pipe(pug({
            pretty: true
        }))
        .pipe(plumber())
        .pipe(dest(htmlURL))
    done();
}

// Compile sass into CSS & auto-inject into browsers
// task css
function styleTask(done) {

    src([ bootstrapSRC, scssLibrarySRC, styleSRC ])
        .pipe(sourcemaps.init())
        .pipe(sass({
            errLogToConsole: true
        }).on('error', sass.logError))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write(mapURL))
        .pipe(dest(styleURL) )
        .pipe(browserSync.stream());

    done();
}

// task js
function jsDeps() {
    return triggerPlumber(jsLibrarySRC, jsURL+'/lib');
}

function jsDownload() {
    return triggerPlumber(donwloadJS_SRC, jsURL+'/lib');
}

function jsTask(done) {
    jsFiles.map(entry => {
        console.log(entry);
        return browserify({
                entries: [jsSRC + entry]
            })
            .transform(babelify, {
                presets: ['@babel/preset-env']
            })
            .bundle()
            .pipe(source(entry))
            .pipe(rename({
                extname: '.min.js'
            }))
            .pipe(buffer())
            .pipe(gulpif(options.has('production'), stripDebug()))
            .pipe(sourcemaps.init({
                loadMaps: true
            }))
            .pipe(uglify())
            .pipe(sourcemaps.write('.'))
            .pipe(dest(jsURL))
            .pipe(browserSync.stream());

    });

    done();
}


function triggerPlumber(src_file, dest_file) {
    return src(src_file)
        .pipe(plumber())
        .pipe(dest(dest_file))
        .pipe(browserSync.stream());
}

function imagesTask() {
    return src(imageSRC)
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(dest(imageURL))
        .pipe(browserSync.stream());

}




function fontsTask() {
    return triggerPlumber([awesomeSRC,fontsSRC], fontsURL);
}




//watch task src file
function watchTask(done) {
    watch(bootstrapSRC, series(styleTask, reload));
    watch(styleWatch, series(styleTask, reload));
    watch(scssLibrarySRC, series(styleTask, reload));

    watch(jsWatch, series(jsTask, reload));
    watch(imgWatch, series(imagesTask, reload));
    watch(fontsWatch, series(fontsTask, reload));
    // watch(htmlWatch, series(htmlTask, reload));
    watch(libraryJS_Watch, series(jsDeps, reload));
    watch(donwloadJS_Watch, series(jsDownload, reload));
    watch(htmlSRC, series(htmlTask, reload));
    src(jsURL + 'main.min.js')
        .pipe(notify({
            message: 'Gulp is Watching, Happy Coding!'
        }));

    done();
}



exports.htmlTask = htmlTask;

exports.styleTask = styleTask;

exports.imagesTask = imagesTask;
exports.fontsTask = fontsTask;

exports.jsTask = jsTask;
exports.jsDeps = jsDeps;
exports.jsDownload = jsDownload;

exports.watchTask = watchTask;
exports.browser_sync = browser_sync;

exports.watch_files = parallel(watchTask, browser_sync);

exports.default = series(
    imagesTask,
    fontsTask,
    parallel(
        styleTask,
        series(parallel(jsDeps, jsDownload), jsTask),
        htmlTask)

);