var MSIE = /MSIE/.test(navigator.userAgent);
function encodeURIObject(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    keys.sort();
    var parts = [];
    for (var i = 0, l = keys.length; i < l; ++i) {
        parts[i] = [
            encodeURIComponent(keys[i]),
            encodeURIComponent(obj[keys[i]])
        ].join("=");
    }
    return parts.join("&");
}
function listen(obj, event, handler) {
    if ("addEventListener" in obj) {
        obj.addEventListener(event, handler, false);
    } else {
        obj.attachEvent("on" + event, handler);
    }
}
var Placeholder = function (input) {
    var placeholderClassName = "placeholder";
    var onfocus = function (event) {
        var placeholderValue = input.getAttribute("placeholder");
        if (input.value === placeholderValue) {
            input.value = "";
            var classes = input.className.split(" ");
            var newClasses = [];
            for (var className, i = 0, l = classes.length; i < l; ++i) {
                className = classes[i];
                if (className !== placeholderClassName) {
                    newClasses.push(className);
                }
            }
            input.className = newClasses.join(" ");
        }
    };
    var onblur = function (event) {
        var placeholderValue = input.getAttribute("placeholder");
        if (input.value === "") {
            input.value = placeholderValue;
            var classes = input.className.split(" ");
            classes.push(placeholderClassName);
            input.className = classes.join(" ");
        }
    };
    listen(input, "focus", onfocus);
    listen(input, "blur", onblur);
    if (input === document.activeElement) {
        onfocus();
    } else {
        onblur();
    }
};
var SmartInput = function (input, validator, next) {
    listen(input, "keyup", function (event) {
        var target = event.target || event.srcElement;
        if (event.keyCode === 13) {
            if (validator === null || typeof validator === "function" && validator(target)) {
                if (typeof next === "function") {
                    return next();
                } else {
                    if (next && next.focus) {
                        if (target.value !== "") {
                            next.focus();
                        }
                    }
                }
            }
        }
    });
};
