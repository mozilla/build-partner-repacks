var EXPORTED_SYMBOLS = ["module"];
var module = function (application, common) {
    function log(text) {
        return application.log("utils: " + text);
    }
    var utils = {
        obj2HeaderParams: function (obj) {
            var res = [], key, value, d1 = "", d2 = ", ";
            for (key in obj) {
                if (!obj.hasOwnProperty(key))
                    continue;
                value = common.utils.encodeURIComponent(obj[key]);
                res.push([
                    common.utils.encodeURIComponent(key),
                    "=\"",
                    value,
                    "\""
                ].join(d1));
            }
            return res.join(d2);
        },
        duplicate: function (x) {
            return JSON.parse(JSON.stringify(x));
        },
        mix: function mix(a, b) {
            var r = application.utils.duplicate(a);
            for (var i in b) {
                if (!b.hasOwnProperty(i)) {
                    continue;
                }
                var data = b[i], mixin;
                if (i in a) {
                    switch (typeof data) {
                    case "object":
                        mixin = mix(a[i], data);
                        break;
                    default:
                        mixin = b[i];
                    }
                    r[i] = mixin;
                } else {
                    r[i] = data;
                }
            }
            if (arguments.length > 2) {
                var argsArr = Array.prototype.slice.call(arguments, 2);
                argsArr.unshift(r);
                r = mix.apply(this, argsArr);
            }
            return r;
        }
    };
    return utils;
};
