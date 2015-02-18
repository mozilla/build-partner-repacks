"use strict";
var EXPORTED_SYMBOLS = ["module"];
var tokenizer = /\$(\w+)/g;
function module(proxy) {
    var Template = function (str, data) {
        if (arguments.length > 1) {
            return Template.fill(str, data);
        }
        this.template = str;
    };
    Template.prototype = {
        fill: function (data) {
            return Template.fill(this.template, data);
        }
    };
    Template.fill = function (string, data) {
        return string.replace(tokenizer, function (entry, key) {
            var retVal;
            if (data.hasOwnProperty(key)) {
                retVal = data[key];
            } else {
                retVal = entry;
            }
            return retVal;
        });
    };
    return Template;
}
