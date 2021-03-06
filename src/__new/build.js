({
    baseUrl: ".",
    paths: {
        'css': 'lib/css.min',
        'css-builder': 'lib/css-builder',
        'normalize': 'lib/normalize',
        'd3': 'lib/d3.min',
        'earcut': 'lib/earcut-2.1.1.min',
        'jquery': 'lib/jquery-3.0.0',
        'jquery-private': 'js/jquery-private',
        'jquery-ui': 'lib/jquery-ui.min',
        'osmtogeojson': 'lib/osmtogeojson-3.0.0',
        'requireLib': 'lib/require',
        'resize': 'lib/detect-element-resize',
        'string': 'lib/string',
        'underscore': 'lib/underscore-min',
        'text': 'lib/text',
        'wicket': 'lib/wicket',
        'worldwind': 'lib/worldwind.min'
    },
    name: "app",
    out: "app-built.js",
    include: "requireLib",
    optimize: "none",
    insertRequire: ['app']
})