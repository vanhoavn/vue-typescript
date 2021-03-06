"use strict";
var Vue = require('vue');
var clone = require('clone');
var config_1 = require('./config');
var utils_1 = require('./utils');
function VueComponent(first, options) {
    var type = typeof first;
    if (type == 'function') {
        createDecorator(null, null)(first);
    }
    else if (type == 'string') {
        return createDecorator(first, options);
    }
    else if (type == 'object') {
        return createDecorator(null, first);
    }
    else {
        throw Error("First parameter of VueComponent must be a string or an object");
    }
}
exports.VueComponent = VueComponent;
function camelToSnake(str) {
    var snake = str.replace(/([A-Z])/g, function ($1) { return "-" + $1.toLowerCase(); });
    if (snake.charAt(0) == '-')
        snake = snake.substring(1);
    return snake;
}
;
function createDecorator(name, options) {
    utils_1.DeveloperUtils.decoratorStart();
    return function decorator(target) {
        var className = camelToSnake(target.toString().match(/\w+/g)[1]);
        // save a reference to the original constructor
        var original = target;
        // a utility function to generate instances of a class
        function construct(constructor, args) {
            var c = function () {
                return constructor.apply(this, args);
            };
            c.prototype = constructor.prototype;
            return new c();
        }
        if (!options)
            options = {};
        if (!options.props)
            options.props = {};
        if (!options.watch)
            options.watch = {};
        if (!options.computed)
            options.computed = {};
        if (options.data) {
            if (typeof options.data == 'function') {
                var data_rtn = options.data();
                options.data = data_rtn;
            }
        }
        else
            options.data = {};
        if (!options.methods)
            options.methods = {};
        if (options['style'])
            delete options['style'];
        var newi = construct(original, {});
        for (var key in newi) {
            if (key.charAt(0) != '$' && key.charAt(0) != '_') {
                var prop_desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(newi), key);
                if (prop_desc && prop_desc.get) {
                    var computed_obj = {};
                    if (prop_desc.set) {
                        computed_obj.get = prop_desc.get;
                        computed_obj.set = prop_desc.set;
                    }
                    else {
                        computed_obj = prop_desc.get;
                    }
                    options.computed[key] = computed_obj;
                }
                else if (typeof (newi[key]) == 'function') {
                    if (config_1.default.vueInstanceFunctions.indexOf(key) > -1) {
                        options[key] = newi[key];
                    }
                    else {
                        if (key != 'constructor')
                            options.methods[key] = newi[key];
                    }
                }
                else {
                    options.data[key] = newi[key];
                }
            }
            else if (key == "$$props") {
                for (var prop in newi.$$props) {
                    options.props[prop] = newi.$$props[prop];
                }
            }
            else if (key == "$$watch") {
                for (var watch in newi.$$watch) {
                    options.watch[watch] = newi.$$watch[watch];
                }
            }
        }
        for (key in options.props) {
            var default_val = options.data[key];
            if (default_val == null || default_val == undefined)
                default_val = options.methods[key];
            if (default_val != null && default_val != undefined) {
                if (!options.props[key])
                    options.props[key] = {};
                if (typeof default_val == 'function')
                    options.props[key].type = Function;
                if (typeof default_val == 'object') {
                    var copy = clone(default_val, false);
                    default_val = function () { return clone(copy, false); };
                }
                options.props[key].default = default_val;
            }
            delete options.data[key];
            delete options.methods[key];
        }
        for (var i in newi.$$methodsToRemove) {
            delete options.methods[newi.$$methodsToRemove[i]];
        }
        var data = options.data;
        options.data = function () { return clone(data, false); };
        var retComp;
        if (name) {
            retComp = Vue.component(name, options);
            // the new constructor behaviour
            // var f:()=>void = function () {
            //     return Vue.component(name);
            // }
            // return f;
            utils_1.DeveloperUtils.decoratorStop();
        }
        else {
            utils_1.DeveloperUtils.decoratorStop();
            retComp = Vue.extend(options);
        }
        if (process.env.NODE_ENV !== 'production') {
            (function (options) {
                if (options.hotId && (options.template || '').length && options.module) {
                    (function (module) {
                        if (module && module.hot) {
                            module.hot.accept();
                            var hotAPI = require('vue-hot-reload-api');
                            hotAPI.install(Vue, false);
                            if (!hotAPI.compatible)
                                return;
                            if (!module.hot.data) {
                                hotAPI.createRecord(options.hotId, retComp);
                            }
                            else {
                                hotAPI.update(options.hotId, retComp, options.template);
                            }
                        }
                    })(options.module);
                }
            })(options);
        }
        return retComp;
    };
}
//# sourceMappingURL=vuecomponent.js.map