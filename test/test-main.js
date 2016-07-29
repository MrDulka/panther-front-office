var allTestFiles = [];
var TEST_REGEXP = /(Spec|Test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
        // then do not normalize the paths
        var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
        allTestFiles.push(normalizedTestModule);
    }
});

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',

    paths: {
        'css': '../lib/css.min',
        'jquery': '../lib/jquery-3.0.0',
        'jquery-private': '../js/jquery-private',
        'jquery-touch': '../lib/jquery-ui.touch-punch.min',
        'jquery-ui': '../lib/jquery-ui.min',
        'string': '../lib/string',
        'underscore': '../lib/underscore-min',
        'text': '../lib/text'
    },

    map: {
        // '*' means all modules will get 'jquery-private' for their 'jquery' dependency.
        '*': {
            'css': 'css',
            'jquery': 'jquery-private'
        },

        // 'jquery-private' wants the real jQuery module though. If this line was not here, there would be an unresolvable cyclic dependency.
        'jquery-private': {
            'jquery': 'jquery'
        }
    },

    shim: {
        'jquery-touch': ['jquery','jquery-ui'],
        'jquery-ui': ['jquery'],
        'underscore': {
            exports: '_'
        }
    },

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});