"use strict";
var EXPORTED_SYMBOLS = ["module"];
function module(proxy) {
    var Handlers = function () {
    };
    Handlers.prototype = {
        constructor: Handlers,
        addHandler: function (topic, handler) {
            if (!this._handlers) {
                this._handlers = {};
            }
            if (!this._handlers[topic]) {
                this._handlers[topic] = [];
            }
            var handlers = this._handlers[topic];
            var ix = handlers.indexOf(handler);
            if (ix == -1) {
                handlers.push(handler);
            }
            return this;
        },
        removeHandler: function (topic, handler) {
            var handlers = this._handlers && this._handlers[topic] || null;
            if (!handlers) {
                return this;
            }
            var ix = handlers.indexOf(handler);
            delete handlers[ix];
            return this;
        },
        executeHandlers: function (topic, __args__) {
            var handlers = this._handlers && this._handlers[topic] || null;
            if (!handlers) {
                return this;
            }
            for (var handler, i = 0, l = handlers.length; i < l; ++i) {
                try {
                    handler = handlers[i];
                    if (handler) {
                        handler.apply(this, arguments);
                    }
                } catch (e) {
                    var message = "Error executing handler [%i] at topic \"%topic\". See next message for details";
                    proxy.logger.trace(message.replace("%i", i).replace("%topic", topic));
                    proxy.logger.error(e);
                }
            }
            return this;
        }
    };
    return Handlers;
}
