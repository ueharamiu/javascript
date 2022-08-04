	/*
 * Global variables
 */

const { doesNotMatch } = require('assert');
const { src, dest, watch, series, parallel } = require( 'gulp' );

const postcss          = require( 'gulp-postcss' ),
	autoprefixer     = require( 'autoprefixer' ),
	stylelint        = require( 'stylelint' ),
	bulkSass         = require( 'gulp-sass-bulk-import' ),
	sass             = require( 'gulp-sass' )( require( 'sass' ) ),
	sassGlob         = require( 'gulp-sass-glob-use-forward' ),
	browserSync      = require( 'browser-sync' ).create(),//ブラウザシンク
	plumber          = require( 'gulp-plumber' ),//エラー通知
	notify           = require( 'gulp-notify' ),//エラー通知
	pleeease         = require( 'gulp-pleeease' ),//ベンダープレフィックス
	vinylSource      = require( 'vinyl-source-stream' ),
	buffer           = require( 'vinyl-buffer' ),
	browserify       = require( 'browserify' ),
	babel            = require( 'gulp-babel' ),
	babelify         = require( 'babelify' ),
	browserifyShim   = require( 'browserify-shim' ),
	watchify         = require( 'watchify' ),
	useref           = require( 'gulp-useref' ),//ファイル結合
	gulpif           = require( 'gulp-if' ),// if文
	uglify           = require( 'gulp-uglify' ),//js圧縮
	rename           = require( 'gulp-rename' ),
	minifyCss        = require( 'gulp-cssnano' ),//css圧縮
	del              = require( 'del' ),//ディレクトリ削除
	fs               = require( "graceful-fs" ),
	data             = require( 'gulp-data' ), //json-data
	debug            = require( 'gulp-debug' ),
	util             = require( 'gulp-util' ),
	path             = require( 'path' ), //path
	minimist         = require( 'minimist' ),
	cached           = require('gulp-cached'),
	fractal          = require( '@frctl/fractal' ).create();

	const paths = {
		rootDir   : './',
		dstrootDir: 'htdocs',
		srcDir    : { css: 'src/styles/**/*.scss', js: 'src/scripts/**/*.js', img: 'src/images' },
		dstDir    : { css: 'css', js: 'js', img: 'images' },
		serverDir : 'localhost',
		styleguide: { base: './src/styleguide', css: './src/styleguide/styles/**/*.scss', js: './src/styleguide/scripts/**/*.scss' },
	};

	const options = minimist( process.argv.slice( 2 ), {
		string: 'path',
		default: {
			path: 'sample.local' // 引数の初期値
		}
	});

	fractal.set( 'project.title', 'Style guide' );
	fractal.components.set( 'path', './src/styleguide/' );
	fractal.docs.set('path', './src/styleguide/docs' );
	fractal.web.set( 'static.path', './htdocs/assets' );
	fractal.web.set( 'builder.dest', './styleguide' );
	const logger = fractal.cli.console;

	const browsers = [
		'last 2 versions',
		'> 5%',
		'ie = 11',
		'not ie <= 10',
		'ios >= 8',
		'and_chr >= 5',
		'Android >= 5',
	]

/*
 * Sass
 */
const css = () => {
	return src( paths.srcDir.css, { sourcemaps: true } )
	.pipe( sassGlob() )
	.pipe( sass.sync().on( 'error', sass.logError ) )
	.pipe( cached( 'scss' ) )
	.pipe( sass( {
		outputStyle: 'expanded',
		minifier: true //圧縮の有無 true/false
	} ) )
	.pipe( postcss( [
		autoprefixer( {
			cascade: false,
			grid: "autoplace"
		} ),
	] ) )
	.pipe( rename( {
		sass: true
	} ) )
	.pipe( dest( paths.dstDir.css, { sourcemaps: paths.rootDir } ) );
};

/*
 * Style Guide
 */
function styleguideTask() {
	const builder = fractal.web.builder();
	builder.on( 'progress', ( completed, total ) => logger.update( `${total} 件中 ${completed} 件目を出力中...`, 'info' ) );
	builder.on( 'error', err => logger.error( err.message ) );
	return builder.build().then( () => logger.success( 'スタイルガイドの出力処理が完了しました。' ) );
}

const styleguideServer = (done) => {
	browserSync.init( styleguideReload );
	done();
}
const styleguideReload = {
	server: './styleguide/',
	notify: false
}

/*
 * JavaScript
 */
function errorAlert( error ) {
	notify.onError( { title: "Error", message: "Check your terminal", sound: "Funk" } )( error ); //Error Notification
	console.log( error.toString() );//Prints Error to Console
	this.emit( "end" ); //End function
};

const js = () => {
	const option = {
		bundleOption: {
			cache: {}, packageCache: {}, fullPaths: false,
			debug: true,
			// entries: './src/scripts/main.js',
			extensions: [ 'js' ]
		},
		dest: paths.dstDir.js,
		filename: 'bundle.js'
	};
	return browserify( option.bundleOption )
	.transform( babelify.configure( {
		compact: false,
		presets: ['@babel/preset-env']
	} ) )
	.bundle()
	.pipe( plumber( { errorHandler: errorAlert } ) )
	.pipe( vinylSource( option.filename ) )
	.pipe( dest ( paths.dstDir.js ) );
}

const server = () => {
	browserSync.init( {
		server: {
			baseDir: paths.rootDir
		},
		notify: true
	} );
}

const reload = ( done ) => {
	browserSync.reload();
	done();
}


// /*
//  * Build
//  */
const clean = ( done ) => {
	return del( [paths.styleguide.base] );
	done();
}
const devcopy = ( done ) => {
	return src([
		paths.srcDir.css,
		paths.srcDir.js,
		// '!./src/scripts/main.js',
		'!./src/scripts/config.js',
		'!./src/styles/foundation/*.scss',
		'!./src/styles/style.scss',
	], {
		dot: true
	} )
	.pipe( rename ( function ( path ) {
		path.dirname = '/components/' + path.basename.replace( '_', '' );
		path.basename = 'style';
	} ) )
	.pipe( dest( paths.styleguide.base ) );
	done();
};

const watchFile = () => {
	watch( paths.srcDir.css, series( css, reload ) );
	watch( paths.srcDir.js , series( js,  reload ) );
}

exports.css = css;
exports.js = js;
exports.clean = clean;
exports.devcopy = series( clean, devcopy );
exports.build = series( devcopy, styleguideTask );

exports.default = parallel( css, js, watchFile, server );
exports.styleguide = styleguideServer;
