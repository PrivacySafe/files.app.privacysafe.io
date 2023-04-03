"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concatCss = require('gulp-concat-css');
const sourcemaps = require("gulp-sourcemaps");
const delMod = require("del");
const ts = require("gulp-typescript");
const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const source = require("vinyl-source-stream");
const browser = require("browser-sync");
const path = require("path");
const fs = require("fs");
const rename = require("gulp-rename");
const shell = require("gulp-shell");

function folderExists(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (err) {
		return false;
	}
}

function fileExists(path) {
	try {
		return fs.statSync(path).isFile();
	} catch (err) {
		return false;
	}
}

function copy(src, dst, renameArg) {
	if (renameArg === undefined) {
		return () => gulp.src(src).pipe(gulp.dest(dst));
	} else {
		return () => gulp.src(src).pipe(rename(renameArg)).pipe(gulp.dest(dst));
	}
}

function del(paths) {
	return () => delMod(paths, { force: true });
}

// app manifest
const MANIFEST_FILE = 'manifest.json';
const manifest = require(`./${MANIFEST_FILE}`);

const APP_FOLDER_NAME = manifest.appDomain.split('.').reverse().join('.');
const MOCK_CONF_FILE = 'mock-conf.json';

const BUILD = "./app";
const ELECTRON = "../core-platform-electron";
const APP_FOLDER = `${ELECTRON}/build/all/apps/${APP_FOLDER_NAME}`;
const MOCK_CONFS = `${ELECTRON}/build/all/mock-confs`;
const JASMINE_FOR_APPS = 'build/all/tests/apps-jasmine.js';	// in ELECTRON dir
const THIS_FOLDER_NAME = path.basename(__dirname);
const TESTS_RELATIVE_PATH = `../${THIS_FOLDER_NAME}/tests`;


gulp.task("copy-lib", copy("./src/lib-ext/**/*.*", "./app/lib-ext"));

gulp.task("del-lib", del(["./app/lib-ext"]));

gulp.task("copy-html", gulp.parallel(
	copy([
		"./src/web/**/*.html", "!./src/web/index.html", "./src/web/**/*.png", "./src/web/**/*.jpg", "./src/web/**/*.gif", "./src/web/**/*.svg" ],
		"./app/templates"),
	copy("./src/web/index.html", "./app"),
	copy("./src/web/storage/saving-applet/index.html", "./app/saving-applet")
));

gulp.task("del-html", del([
	"./app/templates", "./app/index.html", "./app/saving-applet/index.html" ])
);

gulp.task("styles", function() {
	return gulp.src("./src/web/**/*.scss")
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("./temp"));
});

gulp.task("concat-css", function () {
	return gulp.src('./temp/**/*.css')
		.pipe(concatCss("index.css"))
		.pipe(gulp.dest('./app/'));
});

gulp.task("del-css", del(["./app/index.css"]));

gulp.task("del-temp", del(["./temp/"]));

gulp.task("del-all", del(["./app"]));


gulp.task("tsc", function() {
	var tsProject = ts.createProject("tsconfig.json");
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject());
	return tsResult.js
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("./temp"));
});

function browserifySubTask(browserifyEntry, destFolder) {
	const entryFileName = path.basename(browserifyEntry);
	return gulp.series(
		del([ path.join(destFolder, entryFileName) ]),
		() => browserify({
				entries: browserifyEntry,
				debug: true
			}).bundle()
			.pipe(source(entryFileName))
			.pipe(buffer())
			.pipe(sourcemaps.init({loadMaps: true}))
			.pipe(sourcemaps.write(''))
			.pipe(gulp.dest(destFolder))
	);
}

gulp.task("browserify-app", browserifySubTask(
	"./temp/index.js", "./app"));
gulp.task("browserify-storage-applet", browserifySubTask(
	"./temp/storage/saving-applet/index.js", "./app/saving-applet"));

gulp.task("browserify", gulp.parallel(
	"browserify-app", "browserify-storage-applet"));

gulp.task("browser", function() {
 browser({
	 server: {
		 baseDir: "./app"
	 },
	 port: 9000,
	 open: true,
	 notify: false
 });
});


gulp.task("create-lib", gulp.series("del-lib", "copy-lib"));
gulp.task("create-html", gulp.series("del-html", "copy-html"));
gulp.task("create-css", gulp.series("del-css", "styles", "concat-css"));
gulp.task("create-js", gulp.series("tsc", "browserify"));

gulp.task("watcher", function() {
	gulp.watch("./src/web/**/*.scss", gulp.series("create-css"));
	gulp.watch(["./src/**/*.ts", "!./src/typings/*.ts"], gulp.series("create-js"));
	gulp.watch(["./src/web/**/*.html", "./src/web/**/*.png", "./src/web/**/*.jpg", "./src/web/**/*.gif", "./src/web/**/*.svg"], gulp.series("create-html"));
});

gulp.task("help", function(callback) {
	var h = '\nПомощь:\n'+
		'1) "build"  - компилирует необходимые файлы из папки SRC в папку PUBLIC и затем переносит все в папку BUILD/APPS/CLIENT в ELECTRON.\n'+
		'2) "browser" - "поднимает" локальный сервер (LOCALHOST:9000)) и открывает web-страницу приложения в браузере.\n'+
		'3) "run-app" - компилирует необходимые файлы из папки SRC, переносит все в папку PUBLIC, "поднимает" локальный сервер (LOCALHOST:9000) и открывает web-страницу приложения в браузере.\n'+
		'4) "run-dev" - запускает задачу RUN-APP и затем отслеживает изменения, вносимые в рабочие файлы.\n'+
		'5) "build-watch" - BUILD + WATCHER.\n'+
		'6) "test" - run-ит все тесты, используя Jasmine и Spectron (это WebDriver в Electron-е).\n'+
		'7) "default" ("help") - выводит это сообщение\n';
	console.log(h);
	callback();
});

gulp.task("build", gulp.series("del-all", gulp.parallel("create-lib", "create-html", "create-css", "create-js"), "del-temp"));
gulp.task("run-app", gulp.series("build", "browser"));
gulp.task("run-dev", gulp.series("build", gulp.parallel("browser", "watcher")));
gulp.task("default", gulp.series("help"));
