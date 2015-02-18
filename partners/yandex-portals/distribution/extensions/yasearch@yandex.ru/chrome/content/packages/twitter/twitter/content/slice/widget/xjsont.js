var XJSONT = function () {
    function isArray(obj) {
        return !!obj && !!obj.splice && Object.prototype.toString.call(obj) === "[object Array]";
    }
    function trim(str) {
        return str.replace(/^\s\s*|\s*\s$/g, "");
    }
    function trimEnd(str) {
        return str.replace(/\s*\s$/, "");
    }
    function copy(src, dest) {
        dest = dest || {};
        if (src) {
            for (var i in src) {
                if (src.hasOwnProperty(i)) {
                    dest[i] = src[i];
                }
            }
        }
        return dest;
    }
    var functions = {
        AND: function () {
            for (var i = 0; i < arguments.length; ++i) {
                if (!arguments[i]) {
                    return arguments[i];
                }
            }
            return arguments.length ? arguments[arguments.length - 1] : true;
        },
        OR: function () {
            for (var i = 0; i < arguments.length; ++i) {
                if (arguments[i]) {
                    return arguments[i];
                }
            }
            return "";
        },
        IF: function (c, v1, v2) {
            return c ? v1 : v2;
        },
        NOT: function (x) {
            return !x;
        },
        EQ: function (x, y) {
            return x == y;
        },
        NOT_EQ: function (x, y) {
            return x != y;
        },
        CONCAT: function () {
            return Array.prototype.join.call(arguments, "");
        },
        NUMBER: function (x) {
            return Number(x);
        },
        BOOL: function (x) {
            return !!x;
        },
        ITEM: function (arr, i) {
            return arr ? arr[i || 0] || "" : "";
        },
        COUNT: function (arr) {
            return arr ? arr.length : 0;
        },
        FALSE: function () {
            return false;
        },
        OWN: function (propName) {
            return this && this.hasOwnProperty(propName);
        },
        COPY: function (src) {
            return copy(src);
        }
    };
    var classes = {};
    function addClass(name, constr, calc, toString) {
        classes[name] = constr;
        constr.prototype.calc = calc;
        constr.prototype.toString = toString ? toString : function () {
            return name;
        };
    }
    addClass("conditional", function (c, v1, v2) {
        this.cond = c;
        this.v1 = v1;
        this.v2 = v2;
    }, function (data, addParams, globals) {
        return this.cond.calc(data, addParams, globals) ? this.v1.calc(data, addParams, globals) : this.v2 ? this.v2.calc(data, addParams, globals) : "";
    });
    addClass("literal", function (val) {
        this.val = val || "";
    }, function () {
        return this.val;
    });
    var _getValue = function (v, ret) {
        for (var i = 0; v && i < this.name.length; ++i) {
            var key = this.name[i];
            var th = key == "this";
            if (!th && !v.hasOwnProperty(key)) {
                return false;
            }
            v = th ? v : v[key];
        }
        ret.value = v;
        return true;
    };
    addClass("field", function (name) {
        name = name || "this";
        this.name = name.split("/");
        this.fromData = this.name[0] == "this";
    }, function (data, addParams, globals) {
        var ret = {};
        if (this.name[0] == "this2" && this.name.length == 1) {
            ret.value = addParams;
        } else {
            if (this.fromData || !_getValue.call(this, addParams, ret) && !_getValue.call(this, globals, ret)) {
                _getValue.call(this, data, ret);
            }
        }
        return ret.value === undefined ? "" : ret.value;
    }, function () {
        return "$" + this.name.join("/");
    });
    addClass("func", function (name, args) {
        this.name = name;
        this.args = args;
    }, function (data, addParams, globals) {
        var func = functions[this.name];
        if (!func) {
            return "";
        }
        var a = [];
        for (var i = 0; i < this.args.length; ++i) {
            a[i] = this.args[i].calc(data, addParams, globals);
        }
        return func.apply(data, a);
    }, function () {
        return "@" + this.name + "(...)";
    });
    addClass("tpl", function (name, args) {
        this.name = name;
        this.args = args;
    }, function (data, addParams, globals) {
        var data2 = this.args[0] ? this.args[0].calc(data, addParams, globals) : data;
        var addPrms2 = {};
        for (var i = 1; i < this.args.length; ++i) {
            if (this.args[i].length == 1) {
                addPrms2 = this.args[i][0].calc(data, addParams, globals);
                break;
            }
            addPrms2[this.args[i][0]] = this.args[i][1].calc(data, addParams, globals);
        }
        return transform.calc(this.name, data2, addPrms2, globals);
    }, function () {
        return "#" + this.name;
    });
    addClass("set_values", function (args) {
        this.args = args;
    }, function (data, addParams, globals) {
        for (var i = 0; i < this.args.length; ++i) {
            if (this.args[i].length > 1) {
                addParams[this.args[i][0]] = this.args[i][1].calc(data, addParams, globals);
            }
        }
        return "";
    }, function () {
        return "##";
    });
    function getTokenEnd(str, at, ignoreArgs) {
        for (var i = at; i < str.length; ++i) {
            var ch = str.charAt(i);
            if (i === at && ignoreArgs && ch != "#" && ch != "@") {
                return str.length;
            }
            if (ch == "(" || ch == ")" || ch == ",") {
                return i;
            }
        }
        return str.length;
    }
    function skipCh(str, at, ch) {
        while (at.value < str.length && str.charAt(at.value) == ch) {
            at.value++;
        }
    }
    function parseArgs(str, at, isTpl) {
        if (str.length <= at.value || str.charAt(at.value) != "(") {
            return isTpl === true ? [
                new classes.field("this"),
                [new classes.field("this2")]
            ] : [];
        }
        var ret = [], tplAddArg = isTpl === 1;
        at.value++;
        while (at.value < str.length && str.charAt(at.value) != ")") {
            var val = parseValue(str, at, tplAddArg);
            tplAddArg = isTpl;
            if (val) {
                ret.push(val);
            }
            skipCh(str, at, " ");
            skipCh(str, at, ",");
        }
        if (at.value < str.length) {
            at.value++;
        }
        return ret;
    }
    function parseValue(str, at, tplAddArg, ignoreArgs) {
        if (!str) {
            return new classes.literal("");
        }
        at = at || { value: 0 };
        var tokenEnd = getTokenEnd(str, at.value, ignoreArgs);
        if (tokenEnd > at.value) {
            var name, ch = str.charAt(at.value);
            if (tplAddArg) {
                var ret;
                if (ch === "$" || ch === "@") {
                    return [parseValue(str, at)];
                } else {
                    var idxeq = str.indexOf("=", at.value + 1);
                    if (idxeq < at.value + 1 || idxeq >= tokenEnd) {
                        at.value = tokenEnd;
                        return null;
                    }
                    var ret = [trim(str.substring(at.value, idxeq))];
                    if (!ret[0]) {
                        at.value = tokenEnd;
                        return null;
                    }
                    at.value = idxeq + 1;
                    ret[1] = parseValue(str, at);
                    return ret;
                }
            }
            name = str.substring(at.value + 1, tokenEnd);
            at.value = tokenEnd;
            if (ch == "$") {
                return new classes.field(trimEnd(name));
            }
            if (ch == "#") {
                return name === "#" ? new classes.set_values(parseArgs(str, at, 1)) : new classes.tpl(trimEnd(name), parseArgs(str, at, true));
            }
            if (ch == "@") {
                return new classes.func(trimEnd(name), parseArgs(str, at, false));
            }
            return new classes.literal(ch + name);
        } else {
            return new classes.literal("");
        }
    }
    function parseExpr(str, inExpr) {
        var arr = [];
        var cond = null, val1 = null;
        var depth = 0, begin = 0, substr;
        var len = str.length;
        for (var i = 0; i < len; ++i) {
            var ch = str.charAt(i);
            if (ch === "{") {
                ++depth;
                if (depth === 1) {
                    if (i > begin) {
                        substr = str.substring(begin, i);
                        arr.push(inExpr ? parseValue(substr, 0, false, true) : new classes.literal(substr));
                    }
                    begin = i + 1;
                }
            } else if (ch === "}") {
                --depth;
                if (depth === 0) {
                    if (i > begin) {
                        arr.push(parseExpr(str.substring(begin, i), true));
                    }
                    begin = i + 1;
                }
            } else if (inExpr && ch === "?") {
                if (!depth && !cond && i < len - 1 && str.charAt(i + 1) === "?" && i) {
                    if (i > begin) {
                        substr = str.substring(begin, i);
                        arr.push(inExpr ? parseValue(substr, 0, false, true) : new classes.literal(substr));
                    }
                    cond = arr;
                    val1 = arr = [];
                    ++i;
                    begin = i + 1;
                }
            } else if (inExpr && ch === ":") {
                if (!depth && val1 === arr && i < len - 1 && str.charAt(i + 1) === ":") {
                    if (i > begin) {
                        substr = str.substring(begin, i);
                        arr.push(inExpr ? parseValue(substr, 0, false, true) : new classes.literal(substr));
                    }
                    arr = [];
                    ++i;
                    begin = i + 1;
                }
            }
        }
        if (i > begin && !depth) {
            substr = str.substring(begin, i);
            arr.push(inExpr ? parseValue(substr, 0, false, true) : new classes.literal(substr));
        }
        if (cond) {
            return new classes.conditional(createExprObj(cond), createExprObj(val1), createExprObj(val1 === arr ? null : arr));
        } else {
            return createExprObj(arr);
        }
    }
    function createExprObj(arr) {
        if (!arr || !arr.length) {
            return new classes.literal("");
        }
        return arr.length == 1 ? arr[0] : new classes.func("CONCAT", arr);
    }
    function parseTemplateHeader(str) {
        var name = /([a-z0-9-_]+)/im.exec(str);
        if (!name) {
            return null;
        }
        var rx = /([a-z0-9-_]+) *=([^\r\n]*)/gim;
        var res, arr = [];
        while ((res = rx.exec(str)) != null) {
            arr.push({
                name: res[1],
                value: parseValue(res[2], 0, false, true)
            });
        }
        return {
            name: name[1],
            args: arr
        };
    }
    var templates = {};
    var transform = {
        addTemplates: function (text) {
            text = text.split("*---------------------*");
            for (var i = 0; i < text.length; ++i) {
                var data = /^\s*\[([^\]]+)\]([\s\S]*)$/gim.exec(text[i]);
                if (data && data[1]) {
                    var tpl = trim(data[2]);
                    var tplData = parseTemplateHeader(data[1]);
                    if (tplData) {
                        tplData.tpl = tpl ? parseExpr(tpl, false) : [];
                        templates[tplData.name] = tplData;
                    }
                }
            }
        },
        addFunction: function (name, func) {
            functions[name] = func;
        },
        calc: function (templName, data, addParams, globals) {
            if (!templName) {
                return "";
            }
            var forEach = /\[\]$/.test(templName);
            addParams = addParams || {};
            globals = globals || {};
            var templ = templates[forEach ? templName.substring(0, templName.length - 2) : templName];
            if (!templ) {
                return "";
            }
            for (var h = 0; h < templ.args.length; ++h) {
                if (!addParams.hasOwnProperty(templ.args[h].name)) {
                    addParams[templ.args[h].name] = templ.args[h].value.calc(data, addParams, globals);
                }
            }
            addParams.__index = 0;
            if (isArray(data)) {
                if (forEach) {
                    var arr = [];
                    for (var i = 0; i < data.length; ++i) {
                        addParams.__index = i;
                        arr[i] = templ.tpl.calc(data[i], addParams, globals);
                    }
                    return arr.join("");
                } else {
                    addParams.__array = true;
                    return templ.tpl.calc(data, addParams, globals);
                }
            } else {
                return templ.tpl.calc(data, addParams, globals);
            }
        }
    };
    return transform;
};
