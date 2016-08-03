requirejs.config({
    baseUrl: './__new/js',

    paths: {
        'css': '../lib/css.min',
        'jquery': '../lib/jquery-3.0.0',
        'jquery-private': '../js/jquery-private',
        'jquery-touch': '../lib/jquery-ui.touch-punch.min',
        'jquery-ui': '../lib/jquery-ui.min',
        'string': '../lib/string',
        'underscore': '../lib/underscore-min',
        'text': '../lib/text',
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
    }
});

define(['view/widgets/EvaluationWidget/EvaluationWidget',
        'util/DataFilters',
        'util/Floater',
        'util/Logger',
        'data/mockData',
        'util/Placeholder',

        'string',
        'jquery',
        'jquery-ui',
        'jquery-touch',
        'underscore'
], function (EvaluationWidget,
             DataFilters,
             Floater,
             Logger,
             mockData,
             Placeholder,

             S,
             $){

    $(document).ready(function() {
        new EvaluationWidget({
            data: mockData,
            elementId: 'evaluation-widget',
            filter: new DataFilters(),
            name: 'Evaluation Tool',
            targetId: 'widget-container',
            tools: ['settings']
        });


        var widgets = $("#widget-container");
        widgets.on("click", ".placeholder", function(e){
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
                var placeholderSelector = "#" + $(this).attr("id");
                var floaterSelector = "#" + $(this).attr("id").replace("placeholder", "floater");
                var floater = $(floaterSelector);
                var placeholder = $(placeholderSelector);
                if (floater.hasClass("open")) {
                    Floater.minimise(floater);
                    Placeholder.floaterClosed(placeholder);
                }
                else {
                    Floater.maximise(floater);
                    Placeholder.floaterOpened(placeholder);
                }
            }
        });
        widgets.on("click", ".widget-minimise", function(e){
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
                var floater = $(this).parent().parent().parent();
                var placeholderSelector = "#" + floater.attr("id").replace("floater", "placeholder");
                var placeholder = $(placeholderSelector);
                Floater.minimise(floater);
                Placeholder.floaterClosed(placeholder);
            }
        });
        $(".floater").draggable({
            containment: "window",
            handle: ".floater-header",
            stop: function (ev, ui) {
                var element = $(this);
                element.css({
                    width: "",
                    height: ""
                });
            }
        });
        $(".tool-window").draggable({
            containment: "window",
            handle: ".tool-window-header",
            stop: function (ev, ui) {
                var element = $(this);
                element.css({
                    width: "",
                    height: ""
                });
            }
        });
    });
});