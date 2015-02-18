if (typeof String.random !== "function") {
    String.random = function (length) {
        var code, result = Array(length);
        for (var i = 0; i < length; ++i) {
            code = 48 + Math.floor(Math.random() * 62);
            if (code > 57)
                code += 7;
            if (code > 90)
                code += 6;
            result[i] = String.fromCharCode(code);
        }
        return result.join("");
    };
}
if (typeof String.prototype.display !== "function") {
    String.prototype.display = function (data, escape) {
        var tokenizer = /\$(\w+)/g;
        return this.replace(tokenizer, function (entry, key) {
            var retVal;
            if (data.hasOwnProperty(key)) {
                if (escape) {
                    retVal = String(data[key]).asEscapedHTML();
                } else {
                    retVal = data[key];
                }
            } else {
                retVal = entry;
            }
            return retVal;
        });
    };
    String.prototype.displayAsEscapedHTML = function (data) {
        return this.display(data, true);
    };
}
if (typeof String.prototype.asEscapedHTML !== "function") {
    String.prototype.asEscapedHTML = function () {
        var replaces = {
            38: "&amp;",
            60: "&lt;",
            62: "&gt;",
            34: "&quot;",
            39: "&apos;"
        };
        var l = this.length;
        var result = new Array(l);
        var charCode, replace;
        for (var i = 0; i < l; ++i) {
            charCode = this.charCodeAt(i);
            if (replaces.hasOwnProperty(charCode)) {
                result[i] = replaces[charCode];
            } else {
                result[i] = this.charAt(i);
            }
        }
        return result.join("");
    };
}
if (typeof Array.prototype.indexOf !== "function") {
    Array.prototype.indexOf = function (x) {
        var r = -1;
        for (var i = 0, l = this.length; i < l; ++i) {
            if (this[i] === x) {
                r = i;
                break;
            }
        }
        return r;
    };
}
if (typeof Array.prototype.forEach !== "function") {
    Array.prototype.forEach = function (fn) {
        for (var i = 0, l = this.length; i < l; ++i) {
            fn(this[i], i, this);
        }
    };
}
if (typeof Array.prototype.map !== "function") {
    Array.prototype.map = function (fn) {
        for (var i = 0, l = this.length; i < l; ++i) {
            this[i] = fn(this[i], i, this);
        }
        return this;
    };
}
if (typeof Array.prototype.contains !== "function") {
    Array.prototype.contains = function (x) {
        return this.indexOf(x) !== -1;
    };
}
if (typeof Array.prototype.filter !== "function") {
    Array.prototype.filter = function (fn) {
        var result = [];
        for (var i = 0, l = this.length; i < l; ++i) {
            if (fn(this[i], i, this)) {
                result.push(this[i]);
            }
        }
        return result;
    };
}
if (typeof Array.prototype.diff !== "function") {
    Array.prototype.diff = function (arr) {
        var result = [], removeIdxs = [], i1, i2, i3 = 0, currentValue, value, v3, L1 = this.length, L2 = arr.length;
        for (i1 = 0; i1 < L1; ++i1) {
            currentValue = this[i1];
            for (i2 = 0; i2 < L2; ++i2) {
                value = arr[i2];
                if (currentValue === value) {
                    removeIdxs.push(i1);
                }
            }
        }
        removeIdxs.sort();
        for (i1 = 0; i1 < L1; ++i1) {
            v3 = removeIdxs[i3];
            if (i1 === v3) {
                ++i3;
            } else {
                result.push(this[i1]);
            }
        }
        return result;
    };
}
if (typeof Date.prototype.isSameDay !== "function") {
    Date.prototype.isSameDay = function (date) {
        return this.getYear() == date.getYear() && this.getMonth() == date.getMonth() && this.getDate() == date.getDate();
    };
}
if (typeof Date.parseTwitterFormat !== "function") {
    Date.parseTwitterFormat = function (str) {
        var rx = /(\w+)\s+(\w+)\s+(\d+)\s+(\d+):(\d+):(\d+)\s+([\+-]\d+:?\d+)\s+(\d+)/;
        var pattern = "$1, $3 $2 $8 $4:$5:$6 UTC";
        return new Date(str.replace(rx, pattern));
    };
}
function BigInt(str) {
    this._value = [0];
    this._sign = 1;
    if (typeof str !== "undefined") {
        this._value = this.parse(str);
    } else {
        this._value = [0];
    }
}
BigInt.prototype = {
    constructor: BigInt,
    parse: function (str) {
        var inputString = str;
        var retVal = [0];
        var l = inputString.length;
        if (l == 0) {
            return retVal;
        }
        var signChar = inputString[0];
        if (signChar === "-") {
            this._sign = -1;
            inputString = inputString.slice(1);
        } else {
            this._sign = 1;
        }
        retVal = inputString.split("").reverse();
        return retVal;
    },
    toString: function () {
        var strValue = this._value.reverse().join("");
        if (this._sign == -1) {
            strValue = "-" + strValue;
        }
        return strValue;
    },
    add: function (X) {
        var x = X;
        if (typeof x == "number") {
            x = new BigInt(String(x));
        }
        var v1 = this._value;
        var v2 = x._value;
        var s1 = this._sign;
        var s2 = x._sign;
        var l1 = this._value.length;
        var l2 = x._value.length;
        var maxLength = l1 > l2 ? l1 : l2;
        var accumulator = 0;
        var newValue = [];
        for (var i = 0; i < maxLength; ++i) {
            var vi1 = s1 * Number(v1[i]) || 0;
            var vi2 = s2 * Number(v2[i]) || 0;
            var sum = accumulator + vi1 + vi2;
            if (sum > 9) {
                accumulator = 1;
                sum = sum - 10;
            }
            if (sum < 0) {
                accumulator = -1;
                sum = sum + 10;
            } else {
                accumulator = 0;
            }
            newValue[i] = sum;
        }
        if (accumulator) {
            newValue.push(accumulator);
        }
        var retVal = new BigInt();
        retVal._value = newValue;
        return retVal;
    }
};
(function () {
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
}());
