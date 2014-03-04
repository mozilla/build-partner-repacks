'use strict';
XB._functions = {};
XB._functions.CN_event = XB._calcNodes.FuncNode.extend({
    $name: 'CN_event',
    expectedArgNames: [
        'condition',
        'action'
    ],
    constructor: function FEvent() {
        this.base.apply(this, arguments);
        this._timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver,
        Ci.nsITimerCallback
    ]),
    notify: function Fevent_notify() {
        try {
            this._argManager.getValByName(this.expectedArgNames[1]);
        } catch (e) {
            this._logger.error('CN_event.notify() failed. ' + e.message);
        }
    },
    _calculate: function FEvent__calculate(changedArgs) {
        var cond = this._argManager.getValByNameDef(this.expectedArgNames[0], 'Bool', false);
        if (cond) {
            this._timer.cancel();
            this._timer.initWithCallback(this, 10, this._timer.TYPE_ONE_SHOT);
        }
    }
});
XB._functions.CN_cast = XB._calcNodes.FuncNode.extend({
    $name: 'CN_cast',
    expectedArgNames: [
        'type',
        'value'
    ],
    _calculate: function Fcast__calculate(changedArgs) {
        var preferedType = this._argManager.getValByName('type', 'String');
        var value = this._argManager.getValByName('value');
        switch (preferedType) {
        case 'empty':
            return XB.types.empty;
        case 'bool':
            return XB.types.xToBool(value);
        case 'number':
            return XB.types.xToNumber(value);
        case 'string':
            return XB.types.xToString(value);
        default:
            throw new Error('Unknown cast type: ' + preferedType);
        }
    }
});
XB._functions.RegEx = XB._calcNodes.FuncNode.extend({
    $name: 'RegEx',
    _calculate: function FRegex__calculate(changedArgs) {
        if (!this._compiledRegExp || this._argManager.argInArray('expression', changedArgs))
            this._compiledRegExp = new RegExp(this._argManager.getValByName('expression', 'String'), 'm');
    },
    _compiledRegExp: null
});
XB._functions['CN_regex-test'] = XB._functions.RegEx.extend({
    $name: 'CN_regex-test',
    expectedArgNames: [
        'expression',
        'value'
    ],
    _calculate: function FRegexTest__calculate(changedArgs) {
        this.base(changedArgs);
        var string = this._argManager.getValByName('value', 'String');
        return this._compiledRegExp.test(string);
    }
});
XB._functions['CN_regex-search'] = XB._functions.RegEx.extend({
    $name: 'CN_regex-search',
    expectedArgNames: [
        'expression',
        'value'
    ],
    _calculate: function FRegexSearch__calculate(changedArgs) {
        this.base(changedArgs);
        var string = this._argManager.getValByName('value', 'String');
        var match = string.match(this._compiledRegExp);
        if (!match)
            return XB.types.empty;
        return match.length > 1 ? match[1] : match[0];
    }
});
XB._functions['CN_regex-escape'] = XB._functions.RegEx.extend({
    $name: 'CN_regex-escape',
    expectedArgNames: ['value'],
    _calculate: function FRegexEscape__calculate(changedArgs) {
        var string = this._argManager.getValByName('value', 'String');
        return strutils.escapeRE(string);
    }
});
XB._functions['CN_substring'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_substring',
    expectedArgNames: [
        'value',
        'start',
        'length'
    ],
    _calculate: function FSubstring__calculate(changedArgs) {
        var str = this._argManager.getValByName('value', 'String');
        var start = this._argManager.getValByName('start', 'Number');
        var len = this._argManager.getValByNameDef('length', 'Number', XB.types.empty);
        if (len === XB.types.empty)
            return str.substr(start);
        return str.substr(start, len);
    }
});
XB._functions['CN_string-length'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_string-length',
    expectedArgNames: ['value'],
    _calculate: function FStringLength_calculate(changedArgs) {
        return this._argManager.getValByName('value', 'String').length;
    }
});
XB._functions['CN_trim-string'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_trim-string',
    expectedArgNames: [
        'value',
        'left',
        'right'
    ],
    _calculate: function FTrimString__calculate(changedArgs) {
        var str = this._argManager.getValByName('value', 'String');
        var left = this._argManager.getValByNameDef('left', 'Bool', true);
        var right = this._argManager.getValByNameDef('right', 'Bool', true);
        if (left && right)
            return str.trim();
        else if (left)
            return str.trimLeft();
        else if (right)
            return str.trimRight();
        else
            return str;
    }
});
XB._functions['CN_lowercase-string'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_lowercase-string',
    expectedArgNames: ['value'],
    _calculate: function FLowercaseString__calculate(changedArgs) {
        return this._argManager.getValByName('value', 'String').toLowerCase();
    }
});
XB._functions['CN_uppercase-string'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_uppercase-string',
    expectedArgNames: ['value'],
    _calculate: function FLowercaseString__calculate(changedArgs) {
        return this._argManager.getValByName('value', 'String').toUpperCase();
    }
});
XB._functions['CN_digest'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_digest',
    expectedArgNames: [
        'value',
        'type'
    ],
    _calculate: function FDigest__calculate(changedArgs) {
        var value = this._argManager.getValByName('value', 'String');
        var type = this._argManager.getValByNameDef('type', 'String', 'md5');
        return misc.CryptoHash.getFromString(value, type);
    }
});
XB._functions['CN_encode'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_encode',
    expectedArgNames: [
        'value',
        'method'
    ],
    _calculate: function FEncode__calculate(changedArgs) {
        var value = this._argManager.getValByName('value', 'String');
        var method = this._argManager.getValByNameDef('method', 'String', 'url');
        switch (method) {
        case 'url':
            return encodeURIComponent(value);
        case 'base64':
            return btoa(value);
        default:
            throw new Error('Unknown method ' + method);
        }
    }
});
XB._functions['CN_decode'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_decode',
    expectedArgNames: [
        'value',
        'method'
    ],
    _calculate: function FDecode__calculate(changedArgs) {
        var value = this._argManager.getValByName('value', 'String');
        var method = this._argManager.getValByNameDef('method', 'String', 'url');
        switch (method) {
        case 'url':
            return decodeURIComponent(value);
        case 'base64':
            return atob(value);
        default:
            throw new Error('Unknown method ' + method);
        }
    }
});
XB._functions['CN_unescape-html'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_unescape-html',
    expectedArgNames: ['source'],
    _calculate: function FUnescapeHTML__calculate(changedArgs) {
        return this._unescaper.unescape(this._argManager.getValByName(this.expectedArgNames[0], 'String'));
    },
    get _unescaper() {
        var unescaper = Cc['@mozilla.org/feed-unescapehtml;1'].getService(Ci.nsIScriptableUnescapeHTML);
        this.__defineGetter__('_unescaper', function () unescaper);
        return unescaper;
    }
});
XB._functions.Arithmetical = XB._calcNodes.FuncNode.extend({
    $name: 'Arithmetical',
    _calculate: function FArithmetical__calculate(changedArgs) {
        if (this._argManager.argsCount < 2)
            return new XB.types.Exception(this._getHumanReadableID(), XB.types.Exception.types.E_SYNTAX, 'Arithmetic functions take at least 2 arguments');
        return this._applyOp(this._operation);
    },
    _applyOp: function FArithmetical__applyOp(op) {
        var result = undefined;
        let (valIndex = 0, len = this._argManager.argsCount) {
            for (; valIndex < len; valIndex++) {
                let num = this._argManager.getValByIndex(valIndex, 'Number');
                if (result == undefined)
                    result = num;
                else
                    result = op(result, num);
            }
        }
        return result;
    }
});
XB._functions.Arithmetical.PRECISION = 6;
XB._functions.CN_add = XB._functions.Arithmetical.extend({
    $name: 'CN_add',
    _operation: function Fadd__operation(p1, p2) {
        return p1 + p2;
    }
});
XB._functions.CN_sub = XB._functions.Arithmetical.extend({
    $name: 'CN_sub',
    _operation: function Fsub__operation(p1, p2) {
        return p1 - p2;
    }
});
XB._functions.CN_mul = XB._functions.Arithmetical.extend({
    $name: 'CN_mul',
    _operation: function Fmul__operation(p1, p2) {
        return p1 * p2;
    }
});
XB._functions.CN_div = XB._functions.Arithmetical.extend({
    $name: 'CN_div',
    _operation: function Fdiv__operation(p1, p2) {
        if (p2 == 0)
            throw new Error('Division by zero');
        return p1 / p2;
    }
});
XB._functions.CN_mod = XB._functions.Arithmetical.extend({
    $name: 'CN_mod',
    _operation: function Fmod__operation(p1, p2) {
        if (p2 == 0)
            throw new Error('Division by zero');
        return p1 % p2;
    }
});
XB._functions['CN_format-number'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_format-number',
    expectedArgNames: [
        'value',
        'precision',
        'separate-groups',
        'positive-sign'
    ],
    _calculate: function FFormatNumber__calculate(changedArgs) {
        return strutils.formatNumber(this._argManager.getValByName('value', 'Number'), this._argManager.getValByNameDef('precision', 'Number', undefined), this._argManager.getValByNameDef('positive-sign', 'Bool', false), this._argManager.getValByNameDef('separate-groups', 'Bool', true));
    }
});
XB._functions.Periodic = XB._calcNodes.FuncNode.extend({
    $name: 'Periodic',
    expectedArgNames: ['interval'],
    constructor: function FPeriodic() {
        this.base.apply(this, arguments);
        this._timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
    },
    _resetTimer: function FPeriodic__resetTimer() {
        var expireTime = this._argManager.getValByNameDef(this.expectedArgNames[0], 'Number', Number.POSITIVE_INFINITY);
        if (expireTime == Number.POSITIVE_INFINITY) {
            this._timerSet = true;
            return;
        }
        if (expireTime <= 0)
            throw new RangeError(this._consts.ERR_INVALID_INTERVAL);
        expireTime = Math.max(expireTime, XB._functions.Periodic.MIN_INTERVAL);
        this._timer.initWithCallback(this, expireTime * 1000, this._timer.TYPE_REPEATING_SLACK);
        this._timerSet = true;
        this._timerInterval = expireTime;
    },
    _cancelTimer: function FPeriodic__cancelTimer() {
        this._timer.cancel();
        this._timerSet = false;
    },
    _calculate: function FPeriodic__calculate(changedArgs) {
        if (this.hasSubscribers() && (!this._timerSet || this._argManager.argInArray(this.expectedArgNames[0], changedArgs))) {
            this._resetTimer();
        } else {
            this._cancelTimer();
        }
        return this._storedValue;
    },
    _notNeeded: function FPeriodic__notNeeded() {
        this._cancelTimer();
    },
    _timer: null,
    _timerInterval: undefined,
    _timerSet: false
}, { MIN_INTERVAL: 1 });
XB._functions.CN_timestamp = XB._functions.Periodic.extend({
    $name: 'CN_timestamp',
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsITimerCallback
    ]),
    notify: function Ftimestamp_notify() {
        try {
            this._setNewVal(parseInt(Date.now() / 1000, 10));
            this._notifyDeps();
        } catch (e) {
            this._logger.error('CN_timestamp.notify() failed. ' + e.message);
        }
    },
    _calculate: function Ftimestamp__calculate(changedArgs) {
        this.base(changedArgs);
        return parseInt(Date.now() / 1000, 10);
    }
});
XB._functions['CN_time-arrived'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_time-arrived',
    expectedArgNames: ['time'],
    constructor: function FTimeArrived() {
        this.base.apply(this, arguments);
        this._timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsITimerCallback
    ]),
    notify: function Fwait_notify() {
        try {
            if (!this.hasSubscribers())
                return;
            if (this._setNewVal(true))
                this._notifyDeps();
        } catch (e) {
            this._logger.error('CN_time-arrived.notify() failed. ' + e.message);
        }
    },
    _timer: null,
    _calculate: function Ftimearrived__calculate(changedArgs) {
        var moreToWait = this._argManager.getValByName('time', 'Number') - parseInt(Date.now() / 1000, 10);
        if (moreToWait > 0)
            this._timer.initWithCallback(this, moreToWait * 1000, this._timer.TYPE_ONE_SHOT);
        return moreToWait <= 0;
    }
});
XB._functions['CN_format-time'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_format-time',
    expectedArgNames: [
        'value',
        'format'
    ],
    _calculate: function FFormatTime__calculate(changedArgs) {
        return this._formatTimestamp(this._argManager.getValByName('value', 'Number') * 1000, this._argManager.getValByName('format', 'String'));
    },
    _formatTimestamp: function FFormatTime__formatTimestamp(timestamp, format) {
        var date = new Date(timestamp);
        if (date == 'Invalid Date')
            throw new RangeError('Invalid date timestamp (' + timestamp + ')');
        return strutils.formatDate(date, format);
    }
});
XB._functions.CN_if = XB._calcNodes.FuncNode.extend({
    $name: 'CN_if',
    expectedArgNames: [
        'condition',
        'ontrue',
        'onfalse'
    ],
    _calculate: function Fif__calculate(changedArgs) {
        if (this._argManager.getValByName('condition', 'Bool'))
            return this._argManager.getValByNameDef('ontrue', undefined, XB.types.empty);
        return this._argManager.getValByNameDef('onfalse', undefined, XB.types.empty);
    }
});
XB._functions.CN_concat = XB._calcNodes.FuncNode.extend({
    $name: 'CN_concat',
    _calculate: function Fconcat__calculate(changedArgs) {
        var numArgs = this._argManager.argsCount;
        if (numArgs > 0)
            return XB._functions.CN_concat.concatArgs(this, 0, numArgs - 1, this._parentWidget.prototype.runtimeXMLDoc);
        return XB.types.empty;
    }
});
XB._functions.CN_Data = XB._functions.CN_concat.extend({ $name: 'Data' });
XB._functions.CN_concat.concatArgs = function ConcatArgs(funcNode, start, end, destDoc) {
    if (end - start < 1)
        return funcNode._argManager.getValByIndex(start);
    var resultIsXML = false;
    var argXValues = [];
    for (; start <= end; start++) {
        let xv = funcNode._argManager.getValByIndex(start);
        argXValues.push(xv);
        resultIsXML = resultIsXML || XB.types.isXML(xv);
    }
    return XB._functions.CN_concat.glue(argXValues, resultIsXML, destDoc);
};
XB._functions.CN_concat.glue = function ConcatGlue(valuesArray, xmlOutput, destDoc) {
    var XBTypes = XB.types;
    if (!xmlOutput) {
        let result = '';
        for (let [
                    ,
                    value
                ] in Iterator(valuesArray)) {
            result += XBTypes.xToString(value);
        }
        return result;
    } else {
        let result = new XBTypes.XML(destDoc, []);
        for (let [
                    ,
                    value
                ] in Iterator(valuesArray)) {
            if (XBTypes.isXML(value))
                result.appendNodes(value);
            else {
                let node = destDoc.createTextNode(XBTypes.xToString(value));
                result.appendNodes(node);
            }
        }
        return result;
    }
};
XB._functions.CN_xpath = XB._calcNodes.FuncNode.extend({
    $name: 'CN_xpath',
    expectedArgNames: [
        'expression',
        'source'
    ],
    _calculate: function Fxpath__calculate(changedArgs) {
        var expr = this._argManager.getValByName('expression', 'String');
        var srcXML = this._getSrc();
        var namespaces = this._argManager.getValsByClass('xmlns', 'String');
        var nsResolver = sysutils.isEmptyObject(namespaces) ? null : function XPathNSResolver(ns) {
                return namespaces[ns] || null;
            };
        var result = srcXML.query(expr, nsResolver);
        if (srcXML.owner == this)
            srcXML.dispose();
        return result;
    },
    _getSrc: function Fxpath__getSrc() {
        var src = this._argManager.getValByName('source');
        if (XB.types.isXML(src))
            return src;
        if (src === XB.types.empty)
            throw new CustomErrors.EArgType('source', 'XML|String', 'Empty');
        var srcURL = this._parentWidget.prototype.unit.unitPackage.resolvePath(XB.types.xToString(src));
        var srcChannel = Services.io.newChannel(srcURL, null, null).QueryInterface(Ci.nsIInputStreamChannel);
        var srcURI = srcChannel.URI;
        var retXML = new XB.types.XML(fileutils.xmlDocFromStream(srcChannel.contentStream, srcURI, srcURI));
        retXML.owner = this;
        return retXML;
    }
});
XB._functions.CN_xslt = XB._calcNodes.FuncNode.extend({
    $name: 'CN_xslt',
    expectedArgNames: [
        'stylesheet',
        'source'
    ],
    _calculate: function Fxslt__calculate(changedArgs) {
        var srcXML = this._getSrc();
        var stylesheetDoc = this._getStylesheet();
        if (this._debugMode) {
            this._owner.logger.debug(this._getHumanReadableID() + ': transforming source:\n' + srcXML);
        }
        var result = srcXML.transform(stylesheetDoc, this._parentWidget.prototype.runtimeXMLDoc);
        if (srcXML.owner == this)
            srcXML.dispose();
        return result;
    },
    _getSrc: function Fxslt__getSrc() {
        var src = this._argManager.getValByName('source');
        if (XB.types.isXML(src))
            return src;
        if (src === XB.types.empty)
            throw new CustomErrors.EArgType('source', 'XML|String', 'Empty');
        var srcURL = this._parentWidget.prototype.unit.unitPackage.resolvePath(XB.types.xToString(src));
        var srcChannel = Services.io.newChannel(srcURL, null, null).QueryInterface(Ci.nsIInputStreamChannel);
        var srcURI = srcChannel.URI;
        var retXML = new XB.types.XML(fileutils.xmlDocFromStream(srcChannel.contentStream, srcURI, srcURI));
        retXML.owner = this;
        return retXML;
    },
    _getStylesheet: function Fxslt__getStylesheet() {
        var ssPath = this._argManager.getValByName('stylesheet', 'String');
        var ssURL = this._parentWidget.prototype.unit.unitPackage.resolvePath(XB.types.xToString(ssPath));
        var ssChannel = Services.io.newChannel(ssURL, null, null).QueryInterface(Ci.nsIInputStreamChannel);
        var ssURI = ssChannel.URI;
        return fileutils.xmlDocFromStream(ssChannel.contentStream, ssURI, ssURI);
    }
});
XB._functions.CN_attribute = XB._calcNodes.FuncNode.extend({
    $name: 'CN_attribute',
    expectedArgNames: [
        'name',
        'value'
    ],
    _calculate: function FAttribute__calculate(changedArgs) {
        var name = this._argManager.getValByName(this.expectedArgNames[0], 'String');
        var value = this._argManager.getValByName(this.expectedArgNames[1], 'String');
        var result = new XB.types.XML(this._parentWidget.prototype.runtimeXMLDoc, []);
        result.addAttribute('', name, value);
        return result;
    }
});
XB._functions['CN_value-of'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_value-of',
    expectedArgNames: ['name'],
    _calculate: function Fvalueof__calculate(changedArgs) {
        if (!this._refNode || this._argManager.argInArray('name', changedArgs))
            this._findRefNode();
        return this._refNode.getValue(this.hasSubscribers() ? this : null);
    },
    _notNeeded: function Fvalueof__notNeeded() {
        if (this._refNode) {
            this._refNode.unsubscribe(this);
            this._refNode = null;
            this._refName = undefined;
        }
    },
    _findRefNode: function Fvalueof__findRefNode() {
        var refName = this._argManager.getValByName('name', 'String');
        var refNode = XB._functions['CN_value-of'].findValByName(this._parentWidget, refName);
        if (this._refNode != refNode) {
            if (this._refNode)
                this._refNode.unsubscribe(this);
            this._refNode = refNode;
            this._refName = refName;
        }
    },
    _getHumanReadableID: function FValueOf__getHumanReadableID() {
        return this.base() + (this._refName ? ' [' + this._refName + ']' : '');
    },
    _refNode: null,
    _refName: undefined
});
XB._functions['CN_value-of'].findValByName = function XB_findValByName(parentWidget, refName) {
    var refNode = parentWidget.findData(refName);
    if (!refNode)
        refNode = parentWidget.findVariable(refName);
    if (!refNode)
        refNode = parentWidget.findSetting(refName);
    if (!refNode)
        throw new Error(XB._base.consts.ERR_DATA_UNDEFINED + ' (' + refName + ')');
    return refNode;
};
XB._functions['CN_is-empty'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_is-empty',
    expectedArgNames: [
        'value',
        'mode'
    ],
    _calculate: function Fisempty__calculate(changedArgs) {
        var what = this._argManager.getValByName('value');
        var modeStr = this._argManager.getValByNameDef('mode', 'String', 'default');
        var strict = false;
        switch (modeStr) {
        case 'strict':
            strict = true;
            break;
        case 'default':
            strict = false;
            break;
        default:
            throw new SyntaxError('Unknown mode "' + modeStr + '"');
        }
        return XB._functions['CN_is-empty'].test(what, strict);
    }
});
XB._functions['CN_is-empty'].test = function EmptyTest(what, strict) {
    if (strict)
        return what === XB.types.empty;
    return XB.types.xToString(what) === '';
};
XB._functions.Comparison = XB._calcNodes.FuncNode.extend({
    $name: 'Comparison',
    expectedArgNames: [
        'left',
        'right',
        'mode'
    ],
    _calculate: function FComparision__calculate(changedArgs) {
        var mode = this._argManager.getValByNameDef('mode', 'String', 'default');
        var cmpMode;
        switch (mode) {
        case 'strict':
            cmpMode = XB.types.cmpModes.CMP_STRICT;
            break;
        case 'default':
            cmpMode = XB.types.cmpModes.CMP_FREE;
            break;
        default:
            throw new Error('Unknown mode "' + mode + '"');
        }
        var left = this._argManager.getValByName('left');
        var right = this._argManager.getValByName('right');
        return this._op(XB.types.compareValues(left, right, cmpMode, this._parentWidget));
    }
});
XB._functions.CN_eq = XB._functions.Comparison.extend({
    $name: 'CN_eq',
    _op: function Feq__op(compResult) {
        return compResult == 0;
    }
});
XB._functions.CN_equal = XB._functions.CN_eq;
XB._functions.CN_neq = XB._functions.CN_eq.extend({
    $name: 'CN_neq',
    _op: function Fneq__op(compResult) {
        return !this.base(compResult);
    }
});
XB._functions['CN_not-equal'] = XB._functions.CN_neq;
XB._functions.Relation = XB._calcNodes.FuncNode.extend({
    $name: 'Relation',
    expectedArgNames: [
        'left',
        'right',
        'mode'
    ],
    _calculate: function FRelation__calculate(changedArgs) {
        var convType = undefined;
        var mode = this._argManager.getValByNameDef('mode', 'String', 'number');
        switch (mode) {
        case 'number':
            convType = 'Number';
            break;
        case 'string':
            convType = 'String';
            break;
        case 'smart':
            break;
        default:
            throw new Error('Unknown mode "' + mode + '"');
        }
        var left = this._argManager.getValByName('left', convType);
        var right = this._argManager.getValByName('right', convType);
        var cmpMode = XB.types.cmpModes[!!convType ? 'CMP_STRICT' : 'CMP_SMART'];
        return this._op(XB.types.compareValues(left, right, cmpMode, this._parentWidget, true));
    }
});
XB._functions.CN_lt = XB._functions.Relation.extend({
    $name: 'CN_lt',
    _op: function Flt__op(compResult) {
        return compResult < 0;
    }
});
XB._functions.CN_lte = XB._functions.Relation.extend({
    $name: 'CN_lte',
    _op: function Flte__op(compResult) {
        return compResult <= 0;
    }
});
XB._functions.CN_gt = XB._functions.Relation.extend({
    $name: 'CN_gt',
    _op: function Fgt__op(compResult) {
        return compResult > 0;
    }
});
XB._functions.CN_gte = XB._functions.Relation.extend({
    $name: 'CN_gte',
    _op: function Fgte__op(compResult) {
        return compResult >= 0;
    }
});
XB._functions.CN_not = XB._calcNodes.FuncNode.extend({
    $name: 'CN_not',
    _calculate: function Fnot__calculate(changedArgs) {
        return !this._argManager.getValByIndex(0, 'Bool');
    }
});
XB._functions.CN_or = XB._calcNodes.FuncNode.extend({
    $name: 'CN_or',
    _calculate: function For__calculate(changedArgs) {
        if (this._argManager.argsCount < 1)
            throw new Error('No arguments');
        let (i = 0, len = this._argManager.argsCount) {
            for (; i < len; i++) {
                let val = this._argManager.getValByIndex(i);
                if (XB.types.xToBool(val))
                    return true;
            }
        }
        return false;
    }
});
XB._functions.CN_coalesce = XB._calcNodes.FuncNode.extend({
    $name: 'CN_coalesce',
    _calculate: function Fcoalesce__calculate(changedArgs) {
        var strictMode = false;
        var modeStr = this._argManager.getValByNameDef('mode', 'String', 'default');
        switch (modeStr) {
        case 'default':
            strictMode = false;
            break;
        case 'strict':
            strictMode = true;
            break;
        default:
            throw new SyntaxError('Unknown mode "' + modeStr + '"');
        }
        for (let [
                    ,
                    argName
                ] in Iterator(this._argManager.argsNames)) {
            if (argName == 'mode')
                continue;
            let val = this._argManager.getValByName(argName);
            if (!XB._functions['CN_is-empty'].test(val, strictMode))
                return val;
        }
        return XB.types.empty;
    }
});
XB._functions.CN_and = XB._calcNodes.FuncNode.extend({
    $name: 'CN_and',
    _calculate: function Fand__calculate(changedArgs) {
        if (this._argManager.argsCount < 1)
            throw new Error('No arguments');
        let (i = 0, len = this._argManager.argsCount) {
            for (; i < len; i++) {
                let val = this._argManager.getValByIndex(i);
                let asBool = XB.types.xToBool(val);
                if (!asBool)
                    return false;
            }
        }
        return true;
    }
});
XB._functions.CN_try = XB._calcNodes.FuncNode.extend({
    $name: 'CN_try',
    expectedArgNames: [
        'expression',
        '...'
    ],
    _calculate: function Ftry__calculate(changedArgs) {
        try {
            return this._argManager.getValByName(this.expectedArgNames[0]);
        } catch (origException) {
            if (!(origException instanceof XB.types.Exception))
                throw origException;
            if (origException.type == XB.types.Exception.types.E_RETHROW) {
                origException = new XB.types.Exception(origException.srcNodeUid, XB.types.Exception.types.E_GENERIC, origException.message);
            }
            if (this._debugMode)
                this._logger.debug(this._getHumanReadableID() + ' caught exception: ' + origException.toString());
            this._findHandler(origException.type);
            if (this._usedHandler) {
                let handlerVal = this._usedHandler.getValue(this.hasSubscribers() ? this : null);
                if (handlerVal instanceof XB.types.Exception) {
                    if (this._debugMode)
                        this._logger.debug(this._getHumanReadableID() + ' exception rethrown with type ' + handlerVal.type);
                    switch (handlerVal.type) {
                    case XB.types.Exception.types.E_RETHROW:
                        handlerVal = origException;
                        break;
                    case XB.types.Exception.types.E_LASTVALUE:
                        handlerVal = this._storedValue === undefined ? XB.types.empty : this._storedValue;
                        break;
                    }
                }
                if (this._debugMode)
                    this._logger.debug(this._getHumanReadableID() + ' exception handler returned ' + handlerVal);
                return handlerVal;
            }
            return origException;
        }
    },
    _findHandler: function Ftry__findHandler(exceptionType) {
        var handler = this._argManager.findNodeByName(exceptionType) || this._argManager.findNodeByName(this._consts.STR_ALL_EXCEPTIONS);
        if (this._usedHandler != handler) {
            if (this._usedHandler)
                this._usedHandler.unsubscribe(this);
            this._usedHandler = handler;
        }
    },
    _notNeeded: function Ftry__notNeeded() {
        if (this._usedHandler) {
            this._usedHandler.unsubscribe(this);
            this._usedHandler = null;
        }
    },
    _usedHandler: null,
    _consts: { STR_ALL_EXCEPTIONS: '...' }
});
XB._functions.CN_throw = XB._calcNodes.FuncNode.extend({
    $name: 'CN_throw',
    expectedArgNames: ['type'],
    _calculate: function Fthrow__calculate(changedArgs) {
        var eType = this._argManager.getValByNameDef('type', 'String', XB.types.Exception.types.E_RETHROW);
        var exception = new XB.types.Exception(this._getHumanReadableID(), eType, 'XBTHROW');
        var excPropVal;
        var excPropsNames = this._argManager.argsNames;
        for (let [
                    ,
                    propName
                ] in Iterator(excPropsNames)) {
            if (propName == 'type')
                continue;
            excPropVal = this._argManager.getValByName(propName);
            exception[propName] = excPropVal;
        }
        return exception;
    }
});
XB._functions.CN_lastvalue = XB._calcNodes.FuncNode.extend({
    $name: 'CN_lastvalue',
    _calculate: function Flastvalue__calculate(changedArgs) {
        return new XB.types.Exception(this._getHumanReadableID(), XB.types.Exception.types.E_LASTVALUE, 'XBLASTVAL');
    }
});
XB._functions.CN_optional = XB._calcNodes.FuncNode.extend({
    $name: 'CN_optional',
    expectedArgNames: ['condition'],
    _calculate: function Foptional__calculate(changedArgs) {
        var numArgs = this._argManager.argsCount;
        if (numArgs > 1 && this._argManager.getValByName('condition', 'Bool')) {
            return XB._functions.CN_concat.concatArgs(this, 1, numArgs - 1, this._parentWidget.prototype.runtimeXMLDoc);
        }
        return XB.types.empty;
    }
});
XB._functions['CN_page-location'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_page-location',
    expectedArgNames: ['mode'],
    constructor: function Fpagelocation__constructor() {
        this.base.apply(this, arguments);
        this._permissions = this._parentWidget.prototype.unit.unitPackage.permissions;
    },
    _calculate: function Fpagelocation__calculate(changedArgs) {
        var windowListener = this._parentWidget.host.overlayController.windowListener;
        var modeStr = this._argManager.getValByNameDef('mode', 'String', this._modes[0]);
        var url = modeStr == this._modes[0] ? windowListener.windowLocation : null;
        if (url && !this._permissions.allowGetInfoOfPage(url))
            url = XB.types.empty;
        if (!this._observing || this._argManager.argInArray('mode', changedArgs)) {
            if (this._observing)
                this._removeObservers();
            if (this._modes.indexOf(modeStr) == -1)
                return new XB.types.Exception(this._getHumanReadableID(), XB.types.Exception.types.E_SYNTAX, 'Unknow mode "' + modeStr + '"');
            let watcherTopic = modeStr == this._modes[0] ? 'WindowLocationChange' : 'PageLoad';
            windowListener.addListener(watcherTopic, this);
            this._observing = true;
        }
        return url;
    },
    _notNeeded: function Fpagelocation__notNeeded() {
        if (this._observing) {
            this._removeObservers();
        }
    },
    _removeObservers: function Fpagelocation__removeObservers() {
        var windowListener = this._parentWidget.host.overlayController.windowListener;
        windowListener.removeListener('WindowLocationChange', this);
        windowListener.removeListener('PageLoad', this);
        this._observing = false;
    },
    observe: function Fpagelocation_observe(aSubject, aTopic, aData) {
        try {
            this._observe.apply(this, arguments);
        } catch (e) {
            this._setNewVal(XB.types.createXBExceptionFromRTError(this._getHumanReadableID(), e));
            this._notifyDeps();
        }
    },
    _observe: function Fpagelocation__observe(aSubject, aTopic, aData) {
        if (!this._observing) {
            this._owner.logger.warn(this._getHumanReadableID() + ' is NOT observing!');
            return;
        }
        var url = aData.url;
        if (url && !this._permissions.allowGetInfoOfPage(url))
            url = XB.types.empty;
        switch (aTopic) {
        case 'WindowLocationChange':
            if (this._setNewVal(url))
                this._notifyDeps();
            break;
        case 'PageLoad':
            this._setNewVal(XB.types.empty);
            this._notifyDeps();
            this._setNewVal(url);
            this._notifyDeps();
            break;
        default:
            break;
        }
    },
    _modes: [
        'on switch',
        'on load'
    ],
    _permissions: null,
    _observing: null
});
XB._functions['CN_page-title'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_page-title',
    constructor: function Fpagetitle__constructor() {
        this.base.apply(this, arguments);
        this._permissions = this._parentWidget.prototype.unit.unitPackage.permissions;
    },
    _calculate: function Fpagetitle__calculate(changedArgs) {
        var windowListener = this._parentWidget.host.overlayController.windowListener;
        var url = windowListener.windowLocation;
        var title = windowListener.windowTitle;
        if (title && !this._permissions.allowGetInfoOfPage(url))
            title = XB.types.empty;
        if (!this._observing) {
            windowListener.addListener('WindowLocationChange', this);
            windowListener.addListener('WindowTitleChange', this);
            this._observing = true;
            this._title = title;
        }
        return this._title;
    },
    _notNeeded: function Fpagetitle__notNeeded() {
        if (this._observing) {
            this._observing = false;
            let windowListener = this._parentWidget.host.overlayController.windowListener;
            windowListener.removeListener('WindowTitleChange', this);
            windowListener.removeListener('WindowLocationChange', this);
        }
        this._title = null;
    },
    observe: function Fpagetitle_observe(aSubject, aTopic, aData) {
        try {
            this._observe.apply(this, arguments);
        } catch (e) {
            this._setNewVal(XB.types.createXBExceptionFromRTError(this._getHumanReadableID(), e));
            this._notifyDeps();
        }
    },
    _observe: function Fpagetitle__observe(aSubject, aTopic, aData) {
        var canAccessThisTitle = aData.url && this._permissions.allowGetInfoOfPage(aData.url);
        switch (aTopic) {
        case 'WindowTitleChange':
        case 'WindowLocationChange':
            if (this._setNewVal(this._title = canAccessThisTitle ? aData.title : XB.types.empty))
                this._notifyDeps();
            break;
        default:
            break;
        }
    },
    _observing: null,
    _permissions: null,
    _title: null
});
XB._functions.CN_cookie = XB._calcNodes.FuncNode.extend({
    $name: 'CN_cookie',
    expectedArgNames: [
        'url',
        'name',
        'include-httponly'
    ],
    constructor: function FCookie() {
        this.base.apply(this, arguments);
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    observe: function Fcookie_observe(subject, topic, data) {
        if (!this.hasSubscribers() || !this._cookie || topic != this._cookie.EVENTS.COOKIE_VALUE_CHANGED)
            return;
        switch (topic) {
        case this._cookie.EVENTS.COOKIE_VALUE_CHANGED: {
                if (this._setNewVal(data))
                    this._notifyDeps();
            }
        default:
            return;
        }
    },
    _observing: false,
    _uri: null,
    _cookieName: undefined,
    _httpCookies: undefined,
    _cookie: null,
    _calculate: function Fcookie__calculate(changedArgs) {
        try {
            this._ignoreCookie();
            if (this._argManager.argInArray('url', changedArgs) || this._uri == null) {
                this._uri = Services.io.newURI(this._argManager.getValByName('url', 'String'), null, null);
                let permissions = this._parentWidget.prototype.unit.unitPackage.permissions;
                if (!permissions.allowPrivateRequestToURL(this._uri.spec)) {
                    throw this._createException('E_SECURITY', 'Access to private data from ' + this._uri.spec + ' is prohibited');
                }
                if (this._cookie)
                    this._cookie.uri = this._uri;
            }
            if (this._argManager.argInArray('name', changedArgs) || this._cookieName === undefined) {
                this._cookieName = this._argManager.getValByName('name', 'String');
                if (this._cookie)
                    this._cookie.name = this._cookieName;
            }
            if (this._argManager.argInArray('include-httponly', changedArgs) || this._httpCookies === undefined) {
                this._httpCookies = this._argManager.getValByNameDef('include-httponly', 'Bool', false);
                if (this._cookie)
                    this._cookie.includeHttpOnly = this._httpCookies;
            }
        } catch (e) {
            this._notNeeded();
            throw e;
        }
        if (!this._cookie)
            this._cookie = new netutils.Cookie(this._cookieName, this._uri, this._httpCookies, false);
        if (this.hasSubscribers())
            this._watchCookie();
        return this._cookie.value;
    },
    _notNeeded: function Fcookie__notNeeded() {
        this._ignoreCookie();
        this._cookie = null;
        this._uri = null;
        this._cookieName = undefined;
        this._httpCookies = undefined;
    },
    _watchCookie: function Fcookie__watchCookie() {
        if (!this._observing) {
            this._cookie.addListener(this._cookie.EVENTS.COOKIE_VALUE_CHANGED, this);
            this._observing = true;
        }
    },
    _ignoreCookie: function Fcookie__ignoreCookie() {
        if (this._observing && this._cookie) {
            this._cookie.removeAllListeners();
            this._observing = false;
        }
    }
});
XB._functions.CN_request = XB._calcNodes.FuncNode.extend({
    $name: 'CN_request',
    expectedArgNames: [
        'url',
        'update',
        'expire',
        'format',
        'valid-status',
        'valid-xpath'
    ],
    _hiddenParamPattern: /^hidden\.(.+)$/,
    _calculate: function Frequest__calculate(changedArgs) {
        var url = this._argManager.getValByName('url', 'String');
        var accessLevel = this._parentWidget.prototype.unit.unitPackage.permissions.accessLevelForURL(url);
        if (accessLevel === 'none')
            return this._createException('E_SECURITY', 'Request to [' + url + '] is not permitted');
        var format;
        var formatStr = this._argManager.getValByNameDef('format', 'String', 'xml');
        switch (formatStr) {
        case 'text':
            format = XB.types.ResDescriptor.Format.FMT_TEXT;
            break;
        case 'xml':
            format = XB.types.ResDescriptor.Format.FMT_XML;
            break;
        case 'json':
            format = XB.types.ResDescriptor.Format.FMT_JSON;
            break;
        default:
            throw new Error('Unknown format specification: ' + formatStr);
        }
        var validStatusRange = {
                start: 100,
                end: 399
            };
        if (this._argManager.argExists('valid-status')) {
            let statusesExpr = this._argManager.getValByName('valid-status', 'String');
            let exprMatch = statusesExpr.match(/^(\d+)?\.\.(\d+)?$/);
            if (exprMatch == null)
                throw new SyntaxError('Could not parse request status validation expression (' + statusesExpr + ')');
            validStatusRange.start = parseInt(exprMatch[1], 10);
            validStatusRange.end = parseInt(exprMatch[2], 10);
        }
        var updateInterval = this._argManager.getValByNameDef('update', 'Number', 0) || Number.POSITIVE_INFINITY;
        var cacheKeys = {};
        var argsNames = this._argManager.argsNames;
        for (let [
                    ,
                    argName
                ] in Iterator(argsNames)) {
            let match = argName.match(this._hiddenParamPattern);
            if (!match)
                continue;
            let paramName = match[1];
            cacheKeys[paramName] = this._argManager.getValByName(argName);
        }
        return XB.types.makeResDescriptor({
            url: url,
            method: 'GET',
            updateInterval: updateInterval,
            expireInterval: this._argManager.getValByNameDef('expire', 'Number', 0),
            format: format,
            validStatusRange: validStatusRange,
            validXpath: undefined,
            cacheKeys: cacheKeys,
            isPrivate: accessLevel === 'private'
        }, this._parentWidget);
    }
}, { MIN_INTERVAL: 5 });
XB._functions.NetworkData = XB._calcNodes.FuncNode.extend({
    $name: 'NetworkData',
    expectedArgNames: ['request'],
    observe: function FNetworkData_observe(subject, topic, data) {
        if (subject !== this._resource || topic != 'changed')
            return;
        if (this._setNewVal(this._processResData()))
            this._notifyDeps();
    },
    _calculate: function FNetworkData__calculate(changedArgs) {
        var netResource;
        try {
            let reqData = this._argManager.getValByName('request', 'ResDescriptor');
            netResource = BarPlatform.CachedResources.getResource(reqData);
        } catch (e) {
            this._notNeeded();
            throw e;
        }
        if (this._resource != netResource) {
            this._unsubscribe();
            this._resource = netResource;
            this._resource.addListener('changed', this);
        }
        return this._processResData() || XB.types.empty;
    },
    _resource: null,
    _unsubscribe: function FNetworkData__unsubscribe() {
        if (this._resource) {
            try {
                this._resource.removeListener('changed', this);
            } catch (e) {
                this._logger.error('Could not unsubscribe from a network resource. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
    },
    _notNeeded: function FNetworkData__notNeeded() {
        this._unsubscribe();
    }
});
XB._functions.CN_content = XB._functions.NetworkData.extend({
    $name: 'CN_content',
    _processResData: function Fcontent__processResData() {
        var ResFormats = XB.types.ResDescriptor.Format;
        var descriptorFormat = this._resource.descriptor.format;
        switch (descriptorFormat) {
        case ResFormats.FMT_TEXT:
            return this._resource.contentAsText || XB.types.empty;
        case ResFormats.FMT_XML: {
                let xmlDoc = this._resource.contentAsXML;
                if (!xmlDoc)
                    return XB.types.empty;
                return new XB.types.XML(xmlDoc);
            }
        case ResFormats.FMT_JSON: {
                let jsonVal = this._resource.contentAsJSON;
                if (jsonVal === undefined)
                    return XB.types.empty;
                let frag = this._json2domFragment({ json: jsonVal }, this._parentWidget.prototype.runtimeXMLDoc);
                return new XB.types.XML(this._parentWidget.prototype.runtimeXMLDoc, frag);
            }
        default:
            throw new Error('Unknown resource descriptor format: ' + descriptorFormat);
        }
    },
    _json2domFragment: function Fcontent_json2domFragment(json, destDocument) {
        if (!(destDocument instanceof Ci.nsIDOMDocument))
            throw new CustomErrors.EArgType('destDocument', 'nsIDOMDocument', destDocument);
        const NOT_NC_CHARS_RE = /([^0-9A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD])/g;
        function ncEncodeStr(str) {
            function padNumber(str) Array(5 - str.length).join(0) + str
            function encodeSymbol(symb) '.' + padNumber(symb.charCodeAt(0).toString(16).toUpperCase())
            str = str.replace(NOT_NC_CHARS_RE, encodeSymbol);
            str = str.replace(/^([.0-9]|$)/, function (str) 'nc-' + str);
            return str;
        }
        ;
        var fragment = destDocument.createDocumentFragment();
        if (typeof json !== 'object') {
            fragment.appendChild(destDocument.createTextNode(json));
            return fragment;
        }
        for (let key in json) {
            if (!json.hasOwnProperty(key))
                continue;
            let val = json[key];
            let node = destDocument.createElement(ncEncodeStr(key));
            node.setAttribute('key', key);
            node.setAttribute('type', sysutils.smartTypeOf(val));
            node.appendChild(this._json2domFragment(val, destDocument));
            fragment.appendChild(node);
        }
        return fragment;
    }
});
XB._functions['CN_http-header'] = XB._functions.NetworkData.extend({
    $name: 'CN_http-header',
    expectedArgNames: [
        'request',
        'name'
    ],
    _calculate: function Fheader__calculate(changedArgs) {
        if (this._argManager.argInArray('name', changedArgs) || !this._headerName) {
            this._headerName = this._argManager.getValByName('name', 'String');
        }
        return this.base(changedArgs);
    },
    _processResData: function Fheader__processResData() {
        var resHeaders = this._resource.headers;
        if (resHeaders)
            return resHeaders[this._headerName];
        return XB.types.empty;
    },
    _headerName: undefined
});
XB._functions['CN_http-status'] = XB._functions.NetworkData.extend({
    $name: 'CN_http-status',
    expectedArgNames: ['request'],
    _processResData: function FhttpStatus__processResData() {
        return this._resource.statusCode;
    }
});
XB._functions.CN_finished = XB._calcNodes.FuncNode.extend({
    $name: 'CN_finished',
    expectedArgNames: ['try-id'],
    observe: function Ffinished_observe(subject, topic, data) {
        if (subject === BarPlatform.CachedResources)
            this._onRequestFinished(topic);
    },
    _onRequestFinished: function Ffinished__onRequestFinished(requestID) {
        if (this._requestID == requestID)
            if (this._setNewVal(true))
                this._notifyDeps();
        this._requestID = undefined;
    },
    _calculate: function Ffinished__calculate(changedArgs) {
        var requestID = this._argManager.getValByName(this.expectedArgNames[0], 'Number');
        if (BarPlatform.CachedResources.requestFinished(requestID))
            return true;
        BarPlatform.CachedResources.addListener(requestID, this);
        this._requestID = requestID;
        return false;
    },
    _requestID: undefined
});
XB._functions['CN_parse-uri'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_parse-uri',
    expectedArgNames: ['uri'],
    _calculate: function FparseUrl__calculate(changedArgs) {
        var uriStr = this._argManager.getValByName('uri', 'String');
        var stdURL = Cc['@mozilla.org/network/standard-url;1'].createInstance(Ci.nsIStandardURL);
        stdURL.init(Ci.nsIStandardURL.URLTYPE_STANDARD, -1, uriStr, null, null);
        var uri = stdURL.QueryInterface(Components.interfaces.nsIURI);
        var uriAttributes = { scheme: uri.scheme };
        if (uri.username)
            uriAttributes.username = uri.username;
        if (uri.password)
            uriAttributes.password = uri.password;
        if (uri.host)
            uriAttributes.host = uri.host;
        if (uri.port != -1)
            uriAttributes.port = uri.port;
        if (uri.path)
            uriAttributes.path = uri.path;
        var elemJson = {
                name: 'uri',
                attributes: uriAttributes
            };
        return XB.types.makeXML(elemJson, this._parentWidget.prototype.runtimeXMLDoc);
    }
});
XB._functions.CN_file = XB._calcNodes.FuncNode.extend({
    $name: 'CN_file',
    expectedArgNames: [
        'path',
        'type'
    ],
    _calculate: function Ffile__calculate(changedArgs) {
        var path = this._argManager.getValByName('path', 'String');
        var type = this._argManager.getValByName('type', 'String');
        var file = this._parentWidget.prototype.unit.unitPackage.findFile(path);
        switch (type) {
        case 'xml':
            return new XB.types.XML(fileutils.xmlDocFromFile(file));
        case 'text':
            return fileutils.readTextFile(file);
        default:
            throw new Error('Unsupported file output type');
        }
    }
});
XB._functions['CN_brand-id'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_brand-id',
    _calculate: function FBrandID__calculate() {
        return '' + this._brandingSvc.getBrandID();
    },
    _notNeeded: function FBrandID__notNeeded() {
        if (this.__brandingSvc) {
            XB._application.NativeComponents.releaseService(this._BRANDING_COMPID, this._BRANDING_SVC_NAME, this);
            this.__brandingSvc = null;
        }
    },
    get _brandingSvc() {
        if (!this.__brandingSvc) {
            this.__brandingSvc = XB._application.NativeComponents.obtainService(this._BRANDING_COMPID, this._BRANDING_SVC_NAME, this, this.effectiveID);
        }
        return this.__brandingSvc;
    },
    observeServiceEvent: function FBrandID_observeServiceEvent(providerID, serviceName, topic, data) {
        if (!this.hasSubscribers() || providerID != this._BRANDING_COMPID || serviceName != this._BRANDING_SVC_NAME)
            return;
        switch (topic) {
        case 'package updated':
            if (this._setNewVal('' + this._brandingSvc.getBrandID()))
                this._notifyDeps();
            break;
        default:
            break;
        }
    },
    _BRANDING_COMPID: 'ru.yandex.custombar.branding',
    _BRANDING_SVC_NAME: 'package',
    __brandingSvc: null
});
XB._functions.CN_assign = XB._calcNodes.ProcNode.extend({
    $name: 'CN_assign',
    expectedArgNames: [
        'name',
        'value'
    ],
    _proc: function Fassign__proc(eventInfo) {
        var refName = this._argManager.getValByName('name', 'String');
        var refNode = this._parentWidget.findVariable(refName);
        if (!refNode)
            refNode = this._parentWidget.findSetting(refName);
        if (!refNode)
            throw new Error(XB._base.consts.ERR_DATA_UNDEFINED + ' (' + refName + ')');
        var newValue = this._argManager.getValByName('value');
        refNode.setValue(newValue);
    }
});
XB._functions.CN_update = XB._calcNodes.ProcNode.extend({
    $name: 'CN_update',
    expectedArgNames: ['request'],
    _proc: function Fupdate__proc(eventInfo) {
        var resDescr = this._argManager.getValByName(this.expectedArgNames[0], 'ResDescriptor');
        var invCache = true;
        var netResource = BarPlatform.CachedResources.getResource(resDescr);
        return netResource.update(true, invCache);
    }
});
XB._functions['CN_play-sound'] = XB._calcNodes.ProcNode.extend({
    $name: 'CN_play-sound',
    expectedArgNames: ['file'],
    _proc: function FPlaySound__proc(eventInfo) {
    }
});
XB._functions['CN_copy-to-clipboard'] = XB._calcNodes.ProcNode.extend({
    $name: 'CN_copy-to-clipboard',
    constructor: function FCopyToClipboard() {
        this.base.apply(this, arguments);
        this._helper = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper);
    },
    _helper: null,
    _proc: function FcopyToClipboard__proc(eventInfo) {
        if (!this._parentWidget.prototype.unit.unitPackage.permissions.allowClipboardAccess())
            throw this._createException('E_SECURITY', 'Writing to clipboard is not permitted');
        this._helper.copyString(this._argManager.getValByIndex(0, 'String'));
    }
});
XB._functions.CN_navigate = XB._calcNodes.ProcNode.extend({
    $name: 'CN_navigate',
    expectedArgNames: [
        'url',
        'target'
    ],
    _proc: function Fnavigate__proc(eventInfo) {
        var url = this._argManager.getValByName('url', 'String');
        var target = this._argManager.getValByNameDef('target', 'String', '');
        var action = this._argManager.getValByNameDef('action', 'String', '');
        var windowWidth = this._argManager.getValByNameDef('width', 'Number', 0);
        var windowHeight = this._argManager.getValByNameDef('height', 'Number', 0);
        var title = this._argManager.getValByNameDef('title', undefined, XB.types.empty);
        if (title === XB.types.empty) {
            title = null;
        } else {
            title = XB.types.xToString(title);
        }
        if (!this._parentWidget.prototype.unit.unitPackage.permissions.allowNavigateToURL(url))
            throw this._createException('E_SECURITY', 'Navigating to [' + url + '] is not permitted');
        var navData = {
                unsafeURL: url,
                target: target,
                eventInfo: eventInfo,
                windowProperties: {
                    width: windowWidth,
                    height: windowHeight,
                    title: title
                }
            };
        this._parentWidget.host.navigate(navData, action, this._parentWidget);
    }
});
XB._functions['CN_setup-widget'] = XB._calcNodes.ProcNode.extend({
    $name: 'CN_setup-widget',
    _proc: function FSetupWidget__proc(eventInfo) {
        this._parentWidget.host.setupWidget(this._parentWidget);
    }
});
XB._functions['CN_add-widget'] = XB._calcNodes.ProcNode.extend({
    $name: 'CN_add-widget',
    _proc: function FAddWidget__proc(eventInfo) {
        var widgetHost = this._parentWidget.host;
        var [
                widget,
                widgetItem
            ] = widgetHost.addWidget(this._parentWidget.prototype.id, this._parentWidget, true);
        widgetHost.setupWidget(widgetItem);
    }
});
XB._functions['CN_remove-widget'] = XB._calcNodes.ProcNode.extend({
    $name: 'CN_remove-widget',
    _proc: function FRemoveWidget__proc(eventInfo) {
        this._parentWidget.host.removeWidget(this._parentWidget.id);
    }
});
XB._functions['CN_reload-package'] = XB._calcNodes.ProcNode.extend({
    $name: 'CN_reload-package',
    expectedArgNames: ['package-id'],
    _proc: function FReloadPackage__proc() {
        var packageID = this._argManager.getValByNameDef(this.expectedArgNames[0], 'String', undefined);
        XB._base.application.restartComponents(packageID || this._parentWidget.prototype.unit.unitPackage.id);
    }
});
XB._functions['CN_serialize-xml'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_serialize-xml',
    expectedArgNames: ['source'],
    _calculate: function FSerializeXml__calculate(changedArgs) {
        var src = this._argManager.getValByName('source');
        if (!XB.types.isXML(src))
            return new XB.types.Exception(this._getHumanReadableID(), XB.types.Exception.types.E_TYPE, 'Not XML, ' + XB.types.describeValue(src));
        return src.serialize();
    }
});
XB._functions.CN_meander = XB._functions.Periodic.extend({
    $name: 'CN_meander',
    notify: function Fmeander_notify() {
        try {
            this._setNewVal(!this._storedValue);
            this._notifyDeps();
        } catch (e) {
            this._logger.error('CN_meander.notify() failed. ' + e.message);
        }
    },
    _calculate: function Fmeander__calculate(changedArgs) {
        return !!this.base.apply(this, arguments);
    }
});
XB._functions['CN_type-of'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_type-of',
    expectedArgNames: ['value'],
    _calculate: function FValueOf__calculate() {
        try {
            let rank = XB.types.rankValue(this._argManager.getValByName(this.expectedArgNames[0]));
            return this._typeNames[rank];
        } catch (e) {
            return this._typeNames[6];
        }
    },
    _typeNames: {
        0: 'empty',
        1: 'bool',
        2: 'number',
        3: 'string',
        4: 'xml',
        5: 'request',
        6: 'exception'
    }
});
XB._functions['CN_value-used'] = XB._calcNodes.FuncNode.extend({
    $name: 'CN_value-used',
    expectedArgNames: ['name'],
    _calculate: function FValueUsed__calculate() {
        var valName = this._argManager.getValByName(this.expectedArgNames[0], 'String');
        var valNode = XB._functions['CN_value-of'].findValByName(this._parentWidget, valName);
        return valNode.hasSubscribers();
    }
});
