"use strict";
EXPORTED_SYMBOLS.push("strutils");
const strutils = {
    insertBreaksInString: function StrUtils_insertBreaksInString(s) {
        let invisibleSpace = "​";
        return String(s || "").replace(/^\s+/, "").replace(/\s+$/, "").replace(/([\/\-&\?\.])/g, "$1" + invisibleSpace).replace(/(\S{5})(\S{5})/g, "$1" + invisibleSpace + "$2");
    },
    normalizeString: function StrUtils_normalizeString(s) {
        return s ? this.trimSpaces(s).replace(/[\u0020\n\r\t]+/g, " ") : "";
    },
    trimSpaces: function StrUtils_trimSpaces(s) {
        return s ? s.replace(/^[\u0020\n\r\t]*/, "").replace(/[\u0020\n\r\t]*$/, "") : "";
    },
    compareStrings: function StrUtils_compareStrings(str1, str2) {
        str1 = str1.toString();
        str2 = str2.toString();
        return str1 == str2 ? 0 : str1 > str2 ? 1 : -1;
    },
    repeatString: function StrUtils_repeatString(str, num) {
        return new Array(++num).join(str);
    },
    camelize: function StrUtils_camelize(string) {
        function camelizeFunction(match, chr) {
            return (chr || "").toUpperCase();
        }
        return string.replace(/\-+(.)?/g, camelizeFunction);
    },
    formatString: function StrUtils_formatString(template, values) {
        for (let i = values.length; i--;) {
            template = template.replace(new RegExp("%" + (i + 1), "g"), values[i]);
        }
        return template;
    },
    formatError: function StrUtils_formatError(e) {
        if (!(e instanceof this._Ci.nsIException) && !(e instanceof CustomErrors.ECustom)) {
            if (typeof e !== "object" || !("name" in e) || !("message" in e)) {
                return String(e);
            }
        }
        let text = e.name + ": " + e.message;
        let fileName = e.fileName || e.filename;
        if (fileName) {
            text += "\nin " + fileName + "@" + e.lineNumber;
        }
        return text;
    },
    formatNumber: function StrUtils_formatNumber(num, precision, posSign, separateGroups) {
        if (!sysutils.isNumber(num)) {
            throw new TypeError("Number expected");
        }
        if (precision !== undefined) {
            precision = parseInt(precision, 10);
            if (precision < 0) {
                throw new RangeError("Precision must be positive");
            }
        }
        let sign = "";
        if (num < 0) {
            sign = "-";
        } else {
            if (posSign && num > 0) {
                sign = "+";
            }
        }
        let result;
        if (precision == undefined) {
            result = sign + Math.abs(num).toLocaleString();
        } else {
            let order = Math.pow(10, precision);
            let rounded = Math.round(Math.abs(num) * order);
            result = sign + parseInt(rounded / order, 10).toLocaleString();
            if (precision > 0) {
                let fracStr = rounded.toString().substr(-precision);
                fracStr = this.repeatString("0", precision - fracStr.length) + fracStr;
                result += this._STR_LOCALE_DECIMAL_SEPARATOR + fracStr;
            }
        }
        if (separateGroups === false) {
            result = result.replace(this._STR_LOCALE_GROUP_SEPARATOR_RE, "");
        }
        return result;
    },
    formatDate: function StrUtils_formatDate(date, format) {
        function leadZero(str) {
            str = String(str);
            return str.length > 1 ? str : "0" + str;
        }
        function formatCode(match, code) {
            switch (code) {
            case "d":
                return date.getDate();
            case "D":
                return leadZero(date.getDate());
            case "m":
                return date.getMonth() + 1;
            case "M":
                return leadZero(date.getMonth() + 1);
            case "y":
                return String(date.getFullYear()).substr(2, 2);
            case "Y":
                return date.getFullYear();
            case "h":
                return date.getHours();
            case "H":
                return leadZero(date.getHours());
            case "n":
                return date.getMinutes();
            case "N":
                return leadZero(date.getMinutes());
            case "s":
                return date.getSeconds();
            case "S":
                return leadZero(date.getSeconds());
            case "%":
                return "%";
            default:
                return code;
            }
        }
        return format.replace(/%([dDmMyYhHnNsS%])/g, formatCode);
    },
    escapeRE: function StrUtils_escapeRE(aString) {
        return String(aString).replace(this._ESCAPE_RE, "\\$1");
    },
    stringEndsWith: function StrUtils_stringEndsWith(string, ending) {
        return string.substr(-ending.length) === ending;
    },
    get utf8Converter() {
        let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        converter.charset = "UTF-8";
        delete this.utf8Converter;
        return this.utf8Converter = converter;
    },
    xmlAttrToBool: function StrUtils_xmlAttrToBool(attrValue, defaultValue) {
        if (attrValue === null) {
            return defaultValue === undefined ? false : defaultValue;
        }
        if (!attrValue || attrValue === "0" || attrValue === "false") {
            return false;
        }
        return true;
    },
    _Ci: Components.interfaces,
    _Cc: Components.classes,
    _ESCAPE_RE: /([.*+?^=!:${}()|[\]\/\\])/g,
    _STR_LOCALE_DECIMAL_SEPARATOR: 1.1.toLocaleString()[1],
    get _STR_LOCALE_GROUP_SEPARATOR_RE() {
        delete this._STR_LOCALE_GROUP_SEPARATOR_RE;
        let separator = " ";
        let nmbLocaleStr = Number(1000).toLocaleString();
        if (nmbLocaleStr.length > 4 && nmbLocaleStr[1] != "0") {
            separator = nmbLocaleStr[1];
        }
        return this._STR_LOCALE_GROUP_SEPARATOR_RE = new RegExp(this.escapeRE(separator), "g");
    }
};
