!function(d, e, c, r) {
    e = d.documentElement, c = "className", r = "replace", e[c] = e[c][r]("i-ua_js_no", "i-ua_js_yes"), 
    "CSS1Compat" != d.compatMode && (e[c] = e[c][r]("i-ua_css_standart", "i-ua_css_quirks"));
}(document), function(d, e, c, r, n, w, v, f) {
    e = d.documentElement, c = "className", r = "replace", n = "createElementNS", f = "firstChild", 
    w = "http://www.w3.org/2000/svg", e[c] += " i-ua_svg_" + (d[n] && d[n](w, "svg").createSVGRect ? "yes" : "no"), 
    v = d.createElement("div"), v.innerHTML = "<svg/>", e[c] += " i-ua_inlinesvg_" + ((v[f] && v[f].namespaceURI) == w ? "yes" : "no");
}(document), function(window, undefined) {
    function createOptions(options) {
        var object = optionsCache[options] = {};
        return jQuery.each(options.split(core_rspace), function(_, flag) {
            object[flag] = !0;
        }), object;
    }
    function dataAttr(elem, key, data) {
        if (data === undefined && 1 === elem.nodeType) {
            var name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();
            if (data = elem.getAttribute(name), "string" == typeof data) {
                try {
                    data = "true" === data ? !0 : "false" === data ? !1 : "null" === data ? null : +data + "" === data ? +data : rbrace.test(data) ? jQuery.parseJSON(data) : data;
                } catch (e) {}
                jQuery.data(elem, key, data);
            } else data = undefined;
        }
        return data;
    }
    function isEmptyDataObject(obj) {
        var name;
        for (name in obj) if (("data" !== name || !jQuery.isEmptyObject(obj[name])) && "toJSON" !== name) return !1;
        return !0;
    }
    function returnFalse() {
        return !1;
    }
    function returnTrue() {
        return !0;
    }
    function isDisconnected(node) {
        return !node || !node.parentNode || 11 === node.parentNode.nodeType;
    }
    function sibling(cur, dir) {
        do cur = cur[dir]; while (cur && 1 !== cur.nodeType);
        return cur;
    }
    function winnow(elements, qualifier, keep) {
        if (qualifier = qualifier || 0, jQuery.isFunction(qualifier)) return jQuery.grep(elements, function(elem, i) {
            var retVal = !!qualifier.call(elem, i, elem);
            return retVal === keep;
        });
        if (qualifier.nodeType) return jQuery.grep(elements, function(elem) {
            return elem === qualifier === keep;
        });
        if ("string" == typeof qualifier) {
            var filtered = jQuery.grep(elements, function(elem) {
                return 1 === elem.nodeType;
            });
            if (isSimple.test(qualifier)) return jQuery.filter(qualifier, filtered, !keep);
            qualifier = jQuery.filter(qualifier, filtered);
        }
        return jQuery.grep(elements, function(elem) {
            return jQuery.inArray(elem, qualifier) >= 0 === keep;
        });
    }
    function createSafeFragment(document) {
        var list = nodeNames.split("|"), safeFrag = document.createDocumentFragment();
        if (safeFrag.createElement) for (;list.length; ) safeFrag.createElement(list.pop());
        return safeFrag;
    }
    function findOrAppend(elem, tag) {
        return elem.getElementsByTagName(tag)[0] || elem.appendChild(elem.ownerDocument.createElement(tag));
    }
    function cloneCopyEvent(src, dest) {
        if (1 === dest.nodeType && jQuery.hasData(src)) {
            var type, i, l, oldData = jQuery._data(src), curData = jQuery._data(dest, oldData), events = oldData.events;
            if (events) {
                delete curData.handle, curData.events = {};
                for (type in events) for (i = 0, l = events[type].length; l > i; i++) jQuery.event.add(dest, type, events[type][i]);
            }
            curData.data && (curData.data = jQuery.extend({}, curData.data));
        }
    }
    function cloneFixAttributes(src, dest) {
        var nodeName;
        1 === dest.nodeType && (dest.clearAttributes && dest.clearAttributes(), dest.mergeAttributes && dest.mergeAttributes(src), 
        nodeName = dest.nodeName.toLowerCase(), "object" === nodeName ? (dest.parentNode && (dest.outerHTML = src.outerHTML), 
        jQuery.support.html5Clone && src.innerHTML && !jQuery.trim(dest.innerHTML) && (dest.innerHTML = src.innerHTML)) : "input" === nodeName && rcheckableType.test(src.type) ? (dest.defaultChecked = dest.checked = src.checked, 
        dest.value !== src.value && (dest.value = src.value)) : "option" === nodeName ? dest.selected = src.defaultSelected : "input" === nodeName || "textarea" === nodeName ? dest.defaultValue = src.defaultValue : "script" === nodeName && dest.text !== src.text && (dest.text = src.text), 
        dest.removeAttribute(jQuery.expando));
    }
    function getAll(elem) {
        return "undefined" != typeof elem.getElementsByTagName ? elem.getElementsByTagName("*") : "undefined" != typeof elem.querySelectorAll ? elem.querySelectorAll("*") : [];
    }
    function fixDefaultChecked(elem) {
        rcheckableType.test(elem.type) && (elem.defaultChecked = elem.checked);
    }
    function vendorPropName(style, name) {
        if (name in style) return name;
        for (var capName = name.charAt(0).toUpperCase() + name.slice(1), origName = name, i = cssPrefixes.length; i--; ) if (name = cssPrefixes[i] + capName, 
        name in style) return name;
        return origName;
    }
    function isHidden(elem, el) {
        return elem = el || elem, "none" === jQuery.css(elem, "display") || !jQuery.contains(elem.ownerDocument, elem);
    }
    function showHide(elements, show) {
        for (var elem, display, values = [], index = 0, length = elements.length; length > index; index++) elem = elements[index], 
        elem.style && (values[index] = jQuery._data(elem, "olddisplay"), show ? (values[index] || "none" !== elem.style.display || (elem.style.display = ""), 
        "" === elem.style.display && isHidden(elem) && (values[index] = jQuery._data(elem, "olddisplay", css_defaultDisplay(elem.nodeName)))) : (display = curCSS(elem, "display"), 
        values[index] || "none" === display || jQuery._data(elem, "olddisplay", display)));
        for (index = 0; length > index; index++) elem = elements[index], elem.style && (show && "none" !== elem.style.display && "" !== elem.style.display || (elem.style.display = show ? values[index] || "" : "none"));
        return elements;
    }
    function setPositiveNumber(elem, value, subtract) {
        var matches = rnumsplit.exec(value);
        return matches ? Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") : value;
    }
    function augmentWidthOrHeight(elem, name, extra, isBorderBox) {
        for (var i = extra === (isBorderBox ? "border" : "content") ? 4 : "width" === name ? 1 : 0, val = 0; 4 > i; i += 2) "margin" === extra && (val += jQuery.css(elem, extra + cssExpand[i], !0)), 
        isBorderBox ? ("content" === extra && (val -= parseFloat(curCSS(elem, "padding" + cssExpand[i])) || 0), 
        "margin" !== extra && (val -= parseFloat(curCSS(elem, "border" + cssExpand[i] + "Width")) || 0)) : (val += parseFloat(curCSS(elem, "padding" + cssExpand[i])) || 0, 
        "padding" !== extra && (val += parseFloat(curCSS(elem, "border" + cssExpand[i] + "Width")) || 0));
        return val;
    }
    function getWidthOrHeight(elem, name, extra) {
        var val = "width" === name ? elem.offsetWidth : elem.offsetHeight, valueIsBorderBox = !0, isBorderBox = jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing");
        if (0 >= val || null == val) {
            if (val = curCSS(elem, name), (0 > val || null == val) && (val = elem.style[name]), 
            rnumnonpx.test(val)) return val;
            valueIsBorderBox = isBorderBox && (jQuery.support.boxSizingReliable || val === elem.style[name]), 
            val = parseFloat(val) || 0;
        }
        return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox) + "px";
    }
    function css_defaultDisplay(nodeName) {
        if (elemdisplay[nodeName]) return elemdisplay[nodeName];
        var elem = jQuery("<" + nodeName + ">").appendTo(document.body), display = elem.css("display");
        return elem.remove(), ("none" === display || "" === display) && (iframe = document.body.appendChild(iframe || jQuery.extend(document.createElement("iframe"), {
            frameBorder: 0,
            width: 0,
            height: 0
        })), iframeDoc && iframe.createElement || (iframeDoc = (iframe.contentWindow || iframe.contentDocument).document, 
        iframeDoc.write("<!doctype html><html><body>"), iframeDoc.close()), elem = iframeDoc.body.appendChild(iframeDoc.createElement(nodeName)), 
        display = curCSS(elem, "display"), document.body.removeChild(iframe)), elemdisplay[nodeName] = display, 
        display;
    }
    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (jQuery.isArray(obj)) jQuery.each(obj, function(i, v) {
            traditional || rbracket.test(prefix) ? add(prefix, v) : buildParams(prefix + "[" + ("object" == typeof v ? i : "") + "]", v, traditional, add);
        }); else if (traditional || "object" !== jQuery.type(obj)) add(prefix, obj); else for (name in obj) buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
    }
    function addToPrefiltersOrTransports(structure) {
        return function(dataTypeExpression, func) {
            "string" != typeof dataTypeExpression && (func = dataTypeExpression, dataTypeExpression = "*");
            var dataType, list, placeBefore, dataTypes = dataTypeExpression.toLowerCase().split(core_rspace), i = 0, length = dataTypes.length;
            if (jQuery.isFunction(func)) for (;length > i; i++) dataType = dataTypes[i], placeBefore = /^\+/.test(dataType), 
            placeBefore && (dataType = dataType.substr(1) || "*"), list = structure[dataType] = structure[dataType] || [], 
            list[placeBefore ? "unshift" : "push"](func);
        };
    }
    function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, dataType, inspected) {
        dataType = dataType || options.dataTypes[0], inspected = inspected || {}, inspected[dataType] = !0;
        for (var selection, list = structure[dataType], i = 0, length = list ? list.length : 0, executeOnly = structure === prefilters; length > i && (executeOnly || !selection); i++) selection = list[i](options, originalOptions, jqXHR), 
        "string" == typeof selection && (!executeOnly || inspected[selection] ? selection = undefined : (options.dataTypes.unshift(selection), 
        selection = inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, selection, inspected)));
        return !executeOnly && selection || inspected["*"] || (selection = inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, "*", inspected)), 
        selection;
    }
    function ajaxExtend(target, src) {
        var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) src[key] !== undefined && ((flatOptions[key] ? target : deep || (deep = {}))[key] = src[key]);
        deep && jQuery.extend(!0, target, deep);
    }
    function ajaxHandleResponses(s, jqXHR, responses) {
        var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes, responseFields = s.responseFields;
        for (type in responseFields) type in responses && (jqXHR[responseFields[type]] = responses[type]);
        for (;"*" === dataTypes[0]; ) dataTypes.shift(), ct === undefined && (ct = s.mimeType || jqXHR.getResponseHeader("content-type"));
        if (ct) for (type in contents) if (contents[type] && contents[type].test(ct)) {
            dataTypes.unshift(type);
            break;
        }
        if (dataTypes[0] in responses) finalDataType = dataTypes[0]; else {
            for (type in responses) {
                if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                    finalDataType = type;
                    break;
                }
                firstDataType || (firstDataType = type);
            }
            finalDataType = finalDataType || firstDataType;
        }
        return finalDataType ? (finalDataType !== dataTypes[0] && dataTypes.unshift(finalDataType), 
        responses[finalDataType]) : void 0;
    }
    function ajaxConvert(s, response) {
        var conv, conv2, current, tmp, dataTypes = s.dataTypes.slice(), prev = dataTypes[0], converters = {}, i = 0;
        if (s.dataFilter && (response = s.dataFilter(response, s.dataType)), dataTypes[1]) for (conv in s.converters) converters[conv.toLowerCase()] = s.converters[conv];
        for (;current = dataTypes[++i]; ) if ("*" !== current) {
            if ("*" !== prev && prev !== current) {
                if (conv = converters[prev + " " + current] || converters["* " + current], !conv) for (conv2 in converters) if (tmp = conv2.split(" "), 
                tmp[1] === current && (conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]])) {
                    conv === !0 ? conv = converters[conv2] : converters[conv2] !== !0 && (current = tmp[0], 
                    dataTypes.splice(i--, 0, current));
                    break;
                }
                if (conv !== !0) if (conv && s["throws"]) response = conv(response); else try {
                    response = conv(response);
                } catch (e) {
                    return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                    };
                }
            }
            prev = current;
        }
        return {
            state: "success",
            data: response
        };
    }
    function createStandardXHR() {
        try {
            return new window.XMLHttpRequest();
        } catch (e) {}
    }
    function createActiveXHR() {
        try {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
        } catch (e) {}
    }
    function createFxNow() {
        return setTimeout(function() {
            fxNow = undefined;
        }, 0), fxNow = jQuery.now();
    }
    function createTweens(animation, props) {
        jQuery.each(props, function(prop, value) {
            for (var collection = (tweeners[prop] || []).concat(tweeners["*"]), index = 0, length = collection.length; length > index; index++) if (collection[index].call(animation, prop, value)) return;
        });
    }
    function Animation(elem, properties, options) {
        var result, index = 0, length = animationPrefilters.length, deferred = jQuery.Deferred().always(function() {
            delete tick.elem;
        }), tick = function() {
            for (var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index = 0, length = animation.tweens.length; length > index; index++) animation.tweens[index].run(percent);
            return deferred.notifyWith(elem, [ animation, percent, remaining ]), 1 > percent && length ? remaining : (deferred.resolveWith(elem, [ animation ]), 
            !1);
        }, animation = deferred.promise({
            elem: elem,
            props: jQuery.extend({}, properties),
            opts: jQuery.extend(!0, {
                specialEasing: {}
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
                var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                return animation.tweens.push(tween), tween;
            },
            stop: function(gotoEnd) {
                for (var index = 0, length = gotoEnd ? animation.tweens.length : 0; length > index; index++) animation.tweens[index].run(1);
                return gotoEnd ? deferred.resolveWith(elem, [ animation, gotoEnd ]) : deferred.rejectWith(elem, [ animation, gotoEnd ]), 
                this;
            }
        }), props = animation.props;
        for (propFilter(props, animation.opts.specialEasing); length > index; index++) if (result = animationPrefilters[index].call(animation, elem, props, animation.opts)) return result;
        return createTweens(animation, props), jQuery.isFunction(animation.opts.start) && animation.opts.start.call(elem, animation), 
        jQuery.fx.timer(jQuery.extend(tick, {
            anim: animation,
            queue: animation.opts.queue,
            elem: elem
        })), animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    }
    function propFilter(props, specialEasing) {
        var index, name, easing, value, hooks;
        for (index in props) if (name = jQuery.camelCase(index), easing = specialEasing[name], 
        value = props[index], jQuery.isArray(value) && (easing = value[1], value = props[index] = value[0]), 
        index !== name && (props[name] = value, delete props[index]), hooks = jQuery.cssHooks[name], 
        hooks && "expand" in hooks) {
            value = hooks.expand(value), delete props[name];
            for (index in value) index in props || (props[index] = value[index], specialEasing[index] = easing);
        } else specialEasing[name] = easing;
    }
    function defaultPrefilter(elem, props, opts) {
        var index, prop, value, length, dataShow, toggle, tween, hooks, oldfire, anim = this, style = elem.style, orig = {}, handled = [], hidden = elem.nodeType && isHidden(elem);
        opts.queue || (hooks = jQuery._queueHooks(elem, "fx"), null == hooks.unqueued && (hooks.unqueued = 0, 
        oldfire = hooks.empty.fire, hooks.empty.fire = function() {
            hooks.unqueued || oldfire();
        }), hooks.unqueued++, anim.always(function() {
            anim.always(function() {
                hooks.unqueued--, jQuery.queue(elem, "fx").length || hooks.empty.fire();
            });
        })), 1 === elem.nodeType && ("height" in props || "width" in props) && (opts.overflow = [ style.overflow, style.overflowX, style.overflowY ], 
        "inline" === jQuery.css(elem, "display") && "none" === jQuery.css(elem, "float") && (jQuery.support.inlineBlockNeedsLayout && "inline" !== css_defaultDisplay(elem.nodeName) ? style.zoom = 1 : style.display = "inline-block")), 
        opts.overflow && (style.overflow = "hidden", jQuery.support.shrinkWrapBlocks || anim.done(function() {
            style.overflow = opts.overflow[0], style.overflowX = opts.overflow[1], style.overflowY = opts.overflow[2];
        }));
        for (index in props) if (value = props[index], rfxtypes.exec(value)) {
            if (delete props[index], toggle = toggle || "toggle" === value, value === (hidden ? "hide" : "show")) continue;
            handled.push(index);
        }
        if (length = handled.length) {
            dataShow = jQuery._data(elem, "fxshow") || jQuery._data(elem, "fxshow", {}), "hidden" in dataShow && (hidden = dataShow.hidden), 
            toggle && (dataShow.hidden = !hidden), hidden ? jQuery(elem).show() : anim.done(function() {
                jQuery(elem).hide();
            }), anim.done(function() {
                var prop;
                jQuery.removeData(elem, "fxshow", !0);
                for (prop in orig) jQuery.style(elem, prop, orig[prop]);
            });
            for (index = 0; length > index; index++) prop = handled[index], tween = anim.createTween(prop, hidden ? dataShow[prop] : 0), 
            orig[prop] = dataShow[prop] || jQuery.style(elem, prop), prop in dataShow || (dataShow[prop] = tween.start, 
            hidden && (tween.end = tween.start, tween.start = "width" === prop || "height" === prop ? 1 : 0));
        }
    }
    function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
    }
    function genFx(type, includeWidth) {
        var which, attrs = {
            height: type
        }, i = 0;
        for (includeWidth = includeWidth ? 1 : 0; 4 > i; i += 2 - includeWidth) which = cssExpand[i], 
        attrs["margin" + which] = attrs["padding" + which] = type;
        return includeWidth && (attrs.opacity = attrs.width = type), attrs;
    }
    function getWindow(elem) {
        return jQuery.isWindow(elem) ? elem : 9 === elem.nodeType ? elem.defaultView || elem.parentWindow : !1;
    }
    var rootjQuery, readyList, document = window.document, location = window.location, navigator = window.navigator, _jQuery = window.jQuery, _$ = window.$, core_push = Array.prototype.push, core_slice = Array.prototype.slice, core_indexOf = Array.prototype.indexOf, core_toString = Object.prototype.toString, core_hasOwn = Object.prototype.hasOwnProperty, core_trim = String.prototype.trim, jQuery = function(selector, context) {
        return new jQuery.fn.init(selector, context, rootjQuery);
    }, core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source, core_rnotwhite = /\S/, core_rspace = /\s+/, rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/, rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, rvalidchars = /^[\],:{}\s]*$/, rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g, rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g, rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g, rmsPrefix = /^-ms-/, rdashAlpha = /-([\da-z])/gi, fcamelCase = function(all, letter) {
        return (letter + "").toUpperCase();
    }, DOMContentLoaded = function() {
        document.addEventListener ? (document.removeEventListener("DOMContentLoaded", DOMContentLoaded, !1), 
        jQuery.ready()) : "complete" === document.readyState && (document.detachEvent("onreadystatechange", DOMContentLoaded), 
        jQuery.ready());
    }, class2type = {};
    jQuery.fn = jQuery.prototype = {
        constructor: jQuery,
        init: function(selector, context, rootjQuery) {
            var match, elem, doc;
            if (!selector) return this;
            if (selector.nodeType) return this.context = this[0] = selector, this.length = 1, 
            this;
            if ("string" == typeof selector) {
                if (match = "<" === selector.charAt(0) && ">" === selector.charAt(selector.length - 1) && selector.length >= 3 ? [ null, selector, null ] : rquickExpr.exec(selector), 
                !match || !match[1] && context) return !context || context.jquery ? (context || rootjQuery).find(selector) : this.constructor(context).find(selector);
                if (match[1]) return context = context instanceof jQuery ? context[0] : context, 
                doc = context && context.nodeType ? context.ownerDocument || context : document, 
                selector = jQuery.parseHTML(match[1], doc, !0), rsingleTag.test(match[1]) && jQuery.isPlainObject(context) && this.attr.call(selector, context, !0), 
                jQuery.merge(this, selector);
                if (elem = document.getElementById(match[2]), elem && elem.parentNode) {
                    if (elem.id !== match[2]) return rootjQuery.find(selector);
                    this.length = 1, this[0] = elem;
                }
                return this.context = document, this.selector = selector, this;
            }
            return jQuery.isFunction(selector) ? rootjQuery.ready(selector) : (selector.selector !== undefined && (this.selector = selector.selector, 
            this.context = selector.context), jQuery.makeArray(selector, this));
        },
        selector: "",
        jquery: "1.8.3",
        length: 0,
        size: function() {
            return this.length;
        },
        toArray: function() {
            return core_slice.call(this);
        },
        get: function(num) {
            return null == num ? this.toArray() : 0 > num ? this[this.length + num] : this[num];
        },
        pushStack: function(elems, name, selector) {
            var ret = jQuery.merge(this.constructor(), elems);
            return ret.prevObject = this, ret.context = this.context, "find" === name ? ret.selector = this.selector + (this.selector ? " " : "") + selector : name && (ret.selector = this.selector + "." + name + "(" + selector + ")"), 
            ret;
        },
        each: function(callback, args) {
            return jQuery.each(this, callback, args);
        },
        ready: function(fn) {
            return jQuery.ready.promise().done(fn), this;
        },
        eq: function(i) {
            return i = +i, -1 === i ? this.slice(i) : this.slice(i, i + 1);
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        slice: function() {
            return this.pushStack(core_slice.apply(this, arguments), "slice", core_slice.call(arguments).join(","));
        },
        map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem);
            }));
        },
        end: function() {
            return this.prevObject || this.constructor(null);
        },
        push: core_push,
        sort: [].sort,
        splice: [].splice
    }, jQuery.fn.init.prototype = jQuery.fn, jQuery.extend = jQuery.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = !1;
        for ("boolean" == typeof target && (deep = target, target = arguments[1] || {}, 
        i = 2), "object" == typeof target || jQuery.isFunction(target) || (target = {}), 
        length === i && (target = this, --i); length > i; i++) if (null != (options = arguments[i])) for (name in options) src = target[name], 
        copy = options[name], target !== copy && (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy))) ? (copyIsArray ? (copyIsArray = !1, 
        clone = src && jQuery.isArray(src) ? src : []) : clone = src && jQuery.isPlainObject(src) ? src : {}, 
        target[name] = jQuery.extend(deep, clone, copy)) : copy !== undefined && (target[name] = copy));
        return target;
    }, jQuery.extend({
        noConflict: function(deep) {
            return window.$ === jQuery && (window.$ = _$), deep && window.jQuery === jQuery && (window.jQuery = _jQuery), 
            jQuery;
        },
        isReady: !1,
        readyWait: 1,
        holdReady: function(hold) {
            hold ? jQuery.readyWait++ : jQuery.ready(!0);
        },
        ready: function(wait) {
            if (wait === !0 ? !--jQuery.readyWait : !jQuery.isReady) {
                if (!document.body) return setTimeout(jQuery.ready, 1);
                jQuery.isReady = !0, wait !== !0 && --jQuery.readyWait > 0 || (readyList.resolveWith(document, [ jQuery ]), 
                jQuery.fn.trigger && jQuery(document).trigger("ready").off("ready"));
            }
        },
        isFunction: function(obj) {
            return "function" === jQuery.type(obj);
        },
        isArray: Array.isArray || function(obj) {
            return "array" === jQuery.type(obj);
        },
        isWindow: function(obj) {
            return null != obj && obj == obj.window;
        },
        isNumeric: function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        },
        type: function(obj) {
            return null == obj ? String(obj) : class2type[core_toString.call(obj)] || "object";
        },
        isPlainObject: function(obj) {
            if (!obj || "object" !== jQuery.type(obj) || obj.nodeType || jQuery.isWindow(obj)) return !1;
            try {
                if (obj.constructor && !core_hasOwn.call(obj, "constructor") && !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) return !1;
            } catch (e) {
                return !1;
            }
            var key;
            for (key in obj) ;
            return key === undefined || core_hasOwn.call(obj, key);
        },
        isEmptyObject: function(obj) {
            var name;
            for (name in obj) return !1;
            return !0;
        },
        error: function(msg) {
            throw new Error(msg);
        },
        parseHTML: function(data, context, scripts) {
            var parsed;
            return data && "string" == typeof data ? ("boolean" == typeof context && (scripts = context, 
            context = 0), context = context || document, (parsed = rsingleTag.exec(data)) ? [ context.createElement(parsed[1]) ] : (parsed = jQuery.buildFragment([ data ], context, scripts ? null : []), 
            jQuery.merge([], (parsed.cacheable ? jQuery.clone(parsed.fragment) : parsed.fragment).childNodes))) : null;
        },
        parseJSON: function(data) {
            return data && "string" == typeof data ? (data = jQuery.trim(data), window.JSON && window.JSON.parse ? window.JSON.parse(data) : rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, "")) ? new Function("return " + data)() : void jQuery.error("Invalid JSON: " + data)) : null;
        },
        parseXML: function(data) {
            var xml, tmp;
            if (!data || "string" != typeof data) return null;
            try {
                window.DOMParser ? (tmp = new DOMParser(), xml = tmp.parseFromString(data, "text/xml")) : (xml = new ActiveXObject("Microsoft.XMLDOM"), 
                xml.async = "false", xml.loadXML(data));
            } catch (e) {
                xml = undefined;
            }
            return xml && xml.documentElement && !xml.getElementsByTagName("parsererror").length || jQuery.error("Invalid XML: " + data), 
            xml;
        },
        noop: function() {},
        globalEval: function(data) {
            data && core_rnotwhite.test(data) && (window.execScript || function(data) {
                window.eval.call(window, data);
            })(data);
        },
        camelCase: function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },
        each: function(obj, callback, args) {
            var name, i = 0, length = obj.length, isObj = length === undefined || jQuery.isFunction(obj);
            if (args) if (isObj) {
                for (name in obj) if (callback.apply(obj[name], args) === !1) break;
            } else for (;length > i && callback.apply(obj[i++], args) !== !1; ) ; else if (isObj) {
                for (name in obj) if (callback.call(obj[name], name, obj[name]) === !1) break;
            } else for (;length > i && callback.call(obj[i], i, obj[i++]) !== !1; ) ;
            return obj;
        },
        trim: core_trim && !core_trim.call(" ") ? function(text) {
            return null == text ? "" : core_trim.call(text);
        } : function(text) {
            return null == text ? "" : (text + "").replace(rtrim, "");
        },
        makeArray: function(arr, results) {
            var type, ret = results || [];
            return null != arr && (type = jQuery.type(arr), null == arr.length || "string" === type || "function" === type || "regexp" === type || jQuery.isWindow(arr) ? core_push.call(ret, arr) : jQuery.merge(ret, arr)), 
            ret;
        },
        inArray: function(elem, arr, i) {
            var len;
            if (arr) {
                if (core_indexOf) return core_indexOf.call(arr, elem, i);
                for (len = arr.length, i = i ? 0 > i ? Math.max(0, len + i) : i : 0; len > i; i++) if (i in arr && arr[i] === elem) return i;
            }
            return -1;
        },
        merge: function(first, second) {
            var l = second.length, i = first.length, j = 0;
            if ("number" == typeof l) for (;l > j; j++) first[i++] = second[j]; else for (;second[j] !== undefined; ) first[i++] = second[j++];
            return first.length = i, first;
        },
        grep: function(elems, callback, inv) {
            var retVal, ret = [], i = 0, length = elems.length;
            for (inv = !!inv; length > i; i++) retVal = !!callback(elems[i], i), inv !== retVal && ret.push(elems[i]);
            return ret;
        },
        map: function(elems, callback, arg) {
            var value, key, ret = [], i = 0, length = elems.length, isArray = elems instanceof jQuery || length !== undefined && "number" == typeof length && (length > 0 && elems[0] && elems[length - 1] || 0 === length || jQuery.isArray(elems));
            if (isArray) for (;length > i; i++) value = callback(elems[i], i, arg), null != value && (ret[ret.length] = value); else for (key in elems) value = callback(elems[key], key, arg), 
            null != value && (ret[ret.length] = value);
            return ret.concat.apply([], ret);
        },
        guid: 1,
        proxy: function(fn, context) {
            var tmp, args, proxy;
            return "string" == typeof context && (tmp = fn[context], context = fn, fn = tmp), 
            jQuery.isFunction(fn) ? (args = core_slice.call(arguments, 2), proxy = function() {
                return fn.apply(context, args.concat(core_slice.call(arguments)));
            }, proxy.guid = fn.guid = fn.guid || jQuery.guid++, proxy) : undefined;
        },
        access: function(elems, fn, key, value, chainable, emptyGet, pass) {
            var exec, bulk = null == key, i = 0, length = elems.length;
            if (key && "object" == typeof key) {
                for (i in key) jQuery.access(elems, fn, i, key[i], 1, emptyGet, value);
                chainable = 1;
            } else if (value !== undefined) {
                if (exec = pass === undefined && jQuery.isFunction(value), bulk && (exec ? (exec = fn, 
                fn = function(elem, key, value) {
                    return exec.call(jQuery(elem), value);
                }) : (fn.call(elems, value), fn = null)), fn) for (;length > i; i++) fn(elems[i], key, exec ? value.call(elems[i], i, fn(elems[i], key)) : value, pass);
                chainable = 1;
            }
            return chainable ? elems : bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet;
        },
        now: function() {
            return new Date().getTime();
        }
    }), jQuery.ready.promise = function(obj) {
        if (!readyList) if (readyList = jQuery.Deferred(), "complete" === document.readyState) setTimeout(jQuery.ready, 1); else if (document.addEventListener) document.addEventListener("DOMContentLoaded", DOMContentLoaded, !1), 
        window.addEventListener("load", jQuery.ready, !1); else {
            document.attachEvent("onreadystatechange", DOMContentLoaded), window.attachEvent("onload", jQuery.ready);
            var top = !1;
            try {
                top = null == window.frameElement && document.documentElement;
            } catch (e) {}
            top && top.doScroll && !function doScrollCheck() {
                if (!jQuery.isReady) {
                    try {
                        top.doScroll("left");
                    } catch (e) {
                        return setTimeout(doScrollCheck, 50);
                    }
                    jQuery.ready();
                }
            }();
        }
        return readyList.promise(obj);
    }, jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    }), rootjQuery = jQuery(document);
    var optionsCache = {};
    jQuery.Callbacks = function(options) {
        options = "string" == typeof options ? optionsCache[options] || createOptions(options) : jQuery.extend({}, options);
        var memory, fired, firing, firingStart, firingLength, firingIndex, list = [], stack = !options.once && [], fire = function(data) {
            for (memory = options.memory && data, fired = !0, firingIndex = firingStart || 0, 
            firingStart = 0, firingLength = list.length, firing = !0; list && firingLength > firingIndex; firingIndex++) if (list[firingIndex].apply(data[0], data[1]) === !1 && options.stopOnFalse) {
                memory = !1;
                break;
            }
            firing = !1, list && (stack ? stack.length && fire(stack.shift()) : memory ? list = [] : self.disable());
        }, self = {
            add: function() {
                if (list) {
                    var start = list.length;
                    !function add(args) {
                        jQuery.each(args, function(_, arg) {
                            var type = jQuery.type(arg);
                            "function" === type ? options.unique && self.has(arg) || list.push(arg) : arg && arg.length && "string" !== type && add(arg);
                        });
                    }(arguments), firing ? firingLength = list.length : memory && (firingStart = start, 
                    fire(memory));
                }
                return this;
            },
            remove: function() {
                return list && jQuery.each(arguments, function(_, arg) {
                    for (var index; (index = jQuery.inArray(arg, list, index)) > -1; ) list.splice(index, 1), 
                    firing && (firingLength >= index && firingLength--, firingIndex >= index && firingIndex--);
                }), this;
            },
            has: function(fn) {
                return jQuery.inArray(fn, list) > -1;
            },
            empty: function() {
                return list = [], this;
            },
            disable: function() {
                return list = stack = memory = undefined, this;
            },
            disabled: function() {
                return !list;
            },
            lock: function() {
                return stack = undefined, memory || self.disable(), this;
            },
            locked: function() {
                return !stack;
            },
            fireWith: function(context, args) {
                return args = args || [], args = [ context, args.slice ? args.slice() : args ], 
                !list || fired && !stack || (firing ? stack.push(args) : fire(args)), this;
            },
            fire: function() {
                return self.fireWith(this, arguments), this;
            },
            fired: function() {
                return !!fired;
            }
        };
        return self;
    }, jQuery.extend({
        Deferred: function(func) {
            var tuples = [ [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ], [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ], [ "notify", "progress", jQuery.Callbacks("memory") ] ], state = "pending", promise = {
                state: function() {
                    return state;
                },
                always: function() {
                    return deferred.done(arguments).fail(arguments), this;
                },
                then: function() {
                    var fns = arguments;
                    return jQuery.Deferred(function(newDefer) {
                        jQuery.each(tuples, function(i, tuple) {
                            var action = tuple[0], fn = fns[i];
                            deferred[tuple[1]](jQuery.isFunction(fn) ? function() {
                                var returned = fn.apply(this, arguments);
                                returned && jQuery.isFunction(returned.promise) ? returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify) : newDefer[action + "With"](this === deferred ? newDefer : this, [ returned ]);
                            } : newDefer[action]);
                        }), fns = null;
                    }).promise();
                },
                promise: function(obj) {
                    return null != obj ? jQuery.extend(obj, promise) : promise;
                }
            }, deferred = {};
            return promise.pipe = promise.then, jQuery.each(tuples, function(i, tuple) {
                var list = tuple[2], stateString = tuple[3];
                promise[tuple[1]] = list.add, stateString && list.add(function() {
                    state = stateString;
                }, tuples[1 ^ i][2].disable, tuples[2][2].lock), deferred[tuple[0]] = list.fire, 
                deferred[tuple[0] + "With"] = list.fireWith;
            }), promise.promise(deferred), func && func.call(deferred, deferred), deferred;
        },
        when: function(subordinate) {
            var progressValues, progressContexts, resolveContexts, i = 0, resolveValues = core_slice.call(arguments), length = resolveValues.length, remaining = 1 !== length || subordinate && jQuery.isFunction(subordinate.promise) ? length : 0, deferred = 1 === remaining ? subordinate : jQuery.Deferred(), updateFunc = function(i, contexts, values) {
                return function(value) {
                    contexts[i] = this, values[i] = arguments.length > 1 ? core_slice.call(arguments) : value, 
                    values === progressValues ? deferred.notifyWith(contexts, values) : --remaining || deferred.resolveWith(contexts, values);
                };
            };
            if (length > 1) for (progressValues = new Array(length), progressContexts = new Array(length), 
            resolveContexts = new Array(length); length > i; i++) resolveValues[i] && jQuery.isFunction(resolveValues[i].promise) ? resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues)) : --remaining;
            return remaining || deferred.resolveWith(resolveContexts, resolveValues), deferred.promise();
        }
    }), jQuery.support = function() {
        var support, all, a, select, opt, input, fragment, eventName, i, isSupported, clickFn, div = document.createElement("div");
        if (div.setAttribute("className", "t"), div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
        all = div.getElementsByTagName("*"), a = div.getElementsByTagName("a")[0], !all || !a || !all.length) return {};
        select = document.createElement("select"), opt = select.appendChild(document.createElement("option")), 
        input = div.getElementsByTagName("input")[0], a.style.cssText = "top:1px;float:left;opacity:.5", 
        support = {
            leadingWhitespace: 3 === div.firstChild.nodeType,
            tbody: !div.getElementsByTagName("tbody").length,
            htmlSerialize: !!div.getElementsByTagName("link").length,
            style: /top/.test(a.getAttribute("style")),
            hrefNormalized: "/a" === a.getAttribute("href"),
            opacity: /^0.5/.test(a.style.opacity),
            cssFloat: !!a.style.cssFloat,
            checkOn: "on" === input.value,
            optSelected: opt.selected,
            getSetAttribute: "t" !== div.className,
            enctype: !!document.createElement("form").enctype,
            html5Clone: "<:nav></:nav>" !== document.createElement("nav").cloneNode(!0).outerHTML,
            boxModel: "CSS1Compat" === document.compatMode,
            submitBubbles: !0,
            changeBubbles: !0,
            focusinBubbles: !1,
            deleteExpando: !0,
            noCloneEvent: !0,
            inlineBlockNeedsLayout: !1,
            shrinkWrapBlocks: !1,
            reliableMarginRight: !0,
            boxSizingReliable: !0,
            pixelPosition: !1
        }, input.checked = !0, support.noCloneChecked = input.cloneNode(!0).checked, select.disabled = !0, 
        support.optDisabled = !opt.disabled;
        try {
            delete div.test;
        } catch (e) {
            support.deleteExpando = !1;
        }
        if (!div.addEventListener && div.attachEvent && div.fireEvent && (div.attachEvent("onclick", clickFn = function() {
            support.noCloneEvent = !1;
        }), div.cloneNode(!0).fireEvent("onclick"), div.detachEvent("onclick", clickFn)), 
        input = document.createElement("input"), input.value = "t", input.setAttribute("type", "radio"), 
        support.radioValue = "t" === input.value, input.setAttribute("checked", "checked"), 
        input.setAttribute("name", "t"), div.appendChild(input), fragment = document.createDocumentFragment(), 
        fragment.appendChild(div.lastChild), support.checkClone = fragment.cloneNode(!0).cloneNode(!0).lastChild.checked, 
        support.appendChecked = input.checked, fragment.removeChild(input), fragment.appendChild(div), 
        div.attachEvent) for (i in {
            submit: !0,
            change: !0,
            focusin: !0
        }) eventName = "on" + i, isSupported = eventName in div, isSupported || (div.setAttribute(eventName, "return;"), 
        isSupported = "function" == typeof div[eventName]), support[i + "Bubbles"] = isSupported;
        return jQuery(function() {
            var container, div, tds, marginDiv, divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;", body = document.getElementsByTagName("body")[0];
            body && (container = document.createElement("div"), container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px", 
            body.insertBefore(container, body.firstChild), div = document.createElement("div"), 
            container.appendChild(div), div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", 
            tds = div.getElementsByTagName("td"), tds[0].style.cssText = "padding:0;margin:0;border:0;display:none", 
            isSupported = 0 === tds[0].offsetHeight, tds[0].style.display = "", tds[1].style.display = "none", 
            support.reliableHiddenOffsets = isSupported && 0 === tds[0].offsetHeight, div.innerHTML = "", 
            div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;", 
            support.boxSizing = 4 === div.offsetWidth, support.doesNotIncludeMarginInBodyOffset = 1 !== body.offsetTop, 
            window.getComputedStyle && (support.pixelPosition = "1%" !== (window.getComputedStyle(div, null) || {}).top, 
            support.boxSizingReliable = "4px" === (window.getComputedStyle(div, null) || {
                width: "4px"
            }).width, marginDiv = document.createElement("div"), marginDiv.style.cssText = div.style.cssText = divReset, 
            marginDiv.style.marginRight = marginDiv.style.width = "0", div.style.width = "1px", 
            div.appendChild(marginDiv), support.reliableMarginRight = !parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight)), 
            "undefined" != typeof div.style.zoom && (div.innerHTML = "", div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1", 
            support.inlineBlockNeedsLayout = 3 === div.offsetWidth, div.style.display = "block", 
            div.style.overflow = "visible", div.innerHTML = "<div></div>", div.firstChild.style.width = "5px", 
            support.shrinkWrapBlocks = 3 !== div.offsetWidth, container.style.zoom = 1), body.removeChild(container), 
            container = div = tds = marginDiv = null);
        }), fragment.removeChild(div), all = a = select = opt = input = fragment = div = null, 
        support;
    }();
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/, rmultiDash = /([A-Z])/g;
    jQuery.extend({
        cache: {},
        deletedIds: [],
        uuid: 0,
        expando: "jQuery" + (jQuery.fn.jquery + Math.random()).replace(/\D/g, ""),
        noData: {
            embed: !0,
            object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            applet: !0
        },
        hasData: function(elem) {
            return elem = elem.nodeType ? jQuery.cache[elem[jQuery.expando]] : elem[jQuery.expando], 
            !!elem && !isEmptyDataObject(elem);
        },
        data: function(elem, name, data, pvt) {
            if (jQuery.acceptData(elem)) {
                var thisCache, ret, internalKey = jQuery.expando, getByName = "string" == typeof name, isNode = elem.nodeType, cache = isNode ? jQuery.cache : elem, id = isNode ? elem[internalKey] : elem[internalKey] && internalKey;
                if (id && cache[id] && (pvt || cache[id].data) || !getByName || data !== undefined) return id || (isNode ? elem[internalKey] = id = jQuery.deletedIds.pop() || jQuery.guid++ : id = internalKey), 
                cache[id] || (cache[id] = {}, isNode || (cache[id].toJSON = jQuery.noop)), ("object" == typeof name || "function" == typeof name) && (pvt ? cache[id] = jQuery.extend(cache[id], name) : cache[id].data = jQuery.extend(cache[id].data, name)), 
                thisCache = cache[id], pvt || (thisCache.data || (thisCache.data = {}), thisCache = thisCache.data), 
                data !== undefined && (thisCache[jQuery.camelCase(name)] = data), getByName ? (ret = thisCache[name], 
                null == ret && (ret = thisCache[jQuery.camelCase(name)])) : ret = thisCache, ret;
            }
        },
        removeData: function(elem, name, pvt) {
            if (jQuery.acceptData(elem)) {
                var thisCache, i, l, isNode = elem.nodeType, cache = isNode ? jQuery.cache : elem, id = isNode ? elem[jQuery.expando] : jQuery.expando;
                if (cache[id]) {
                    if (name && (thisCache = pvt ? cache[id] : cache[id].data)) {
                        jQuery.isArray(name) || (name in thisCache ? name = [ name ] : (name = jQuery.camelCase(name), 
                        name = name in thisCache ? [ name ] : name.split(" ")));
                        for (i = 0, l = name.length; l > i; i++) delete thisCache[name[i]];
                        if (!(pvt ? isEmptyDataObject : jQuery.isEmptyObject)(thisCache)) return;
                    }
                    (pvt || (delete cache[id].data, isEmptyDataObject(cache[id]))) && (isNode ? jQuery.cleanData([ elem ], !0) : jQuery.support.deleteExpando || cache != cache.window ? delete cache[id] : cache[id] = null);
                }
            }
        },
        _data: function(elem, name, data) {
            return jQuery.data(elem, name, data, !0);
        },
        acceptData: function(elem) {
            var noData = elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()];
            return !noData || noData !== !0 && elem.getAttribute("classid") === noData;
        }
    }), jQuery.fn.extend({
        data: function(key, value) {
            var parts, part, attr, name, l, elem = this[0], i = 0, data = null;
            if (key === undefined) {
                if (this.length && (data = jQuery.data(elem), 1 === elem.nodeType && !jQuery._data(elem, "parsedAttrs"))) {
                    for (attr = elem.attributes, l = attr.length; l > i; i++) name = attr[i].name, name.indexOf("data-") || (name = jQuery.camelCase(name.substring(5)), 
                    dataAttr(elem, name, data[name]));
                    jQuery._data(elem, "parsedAttrs", !0);
                }
                return data;
            }
            return "object" == typeof key ? this.each(function() {
                jQuery.data(this, key);
            }) : (parts = key.split(".", 2), parts[1] = parts[1] ? "." + parts[1] : "", part = parts[1] + "!", 
            jQuery.access(this, function(value) {
                return value === undefined ? (data = this.triggerHandler("getData" + part, [ parts[0] ]), 
                data === undefined && elem && (data = jQuery.data(elem, key), data = dataAttr(elem, key, data)), 
                data === undefined && parts[1] ? this.data(parts[0]) : data) : (parts[1] = value, 
                void this.each(function() {
                    var self = jQuery(this);
                    self.triggerHandler("setData" + part, parts), jQuery.data(this, key, value), self.triggerHandler("changeData" + part, parts);
                }));
            }, null, value, arguments.length > 1, null, !1));
        },
        removeData: function(key) {
            return this.each(function() {
                jQuery.removeData(this, key);
            });
        }
    }), jQuery.extend({
        queue: function(elem, type, data) {
            var queue;
            return elem ? (type = (type || "fx") + "queue", queue = jQuery._data(elem, type), 
            data && (!queue || jQuery.isArray(data) ? queue = jQuery._data(elem, type, jQuery.makeArray(data)) : queue.push(data)), 
            queue || []) : void 0;
        },
        dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery._queueHooks(elem, type), next = function() {
                jQuery.dequeue(elem, type);
            };
            "inprogress" === fn && (fn = queue.shift(), startLength--), fn && ("fx" === type && queue.unshift("inprogress"), 
            delete hooks.stop, fn.call(elem, next, hooks)), !startLength && hooks && hooks.empty.fire();
        },
        _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return jQuery._data(elem, key) || jQuery._data(elem, key, {
                empty: jQuery.Callbacks("once memory").add(function() {
                    jQuery.removeData(elem, type + "queue", !0), jQuery.removeData(elem, key, !0);
                })
            });
        }
    }), jQuery.fn.extend({
        queue: function(type, data) {
            var setter = 2;
            return "string" != typeof type && (data = type, type = "fx", setter--), arguments.length < setter ? jQuery.queue(this[0], type) : data === undefined ? this : this.each(function() {
                var queue = jQuery.queue(this, type, data);
                jQuery._queueHooks(this, type), "fx" === type && "inprogress" !== queue[0] && jQuery.dequeue(this, type);
            });
        },
        dequeue: function(type) {
            return this.each(function() {
                jQuery.dequeue(this, type);
            });
        },
        delay: function(time, type) {
            return time = jQuery.fx ? jQuery.fx.speeds[time] || time : time, type = type || "fx", 
            this.queue(type, function(next, hooks) {
                var timeout = setTimeout(next, time);
                hooks.stop = function() {
                    clearTimeout(timeout);
                };
            });
        },
        clearQueue: function(type) {
            return this.queue(type || "fx", []);
        },
        promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function() {
                --count || defer.resolveWith(elements, [ elements ]);
            };
            for ("string" != typeof type && (obj = type, type = undefined), type = type || "fx"; i--; ) tmp = jQuery._data(elements[i], type + "queueHooks"), 
            tmp && tmp.empty && (count++, tmp.empty.add(resolve));
            return resolve(), defer.promise(obj);
        }
    });
    var nodeHook, boolHook, fixSpecified, rclass = /[\t\r\n]/g, rreturn = /\r/g, rtype = /^(?:button|input)$/i, rfocusable = /^(?:button|input|object|select|textarea)$/i, rclickable = /^a(?:rea|)$/i, rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i, getSetAttribute = jQuery.support.getSetAttribute;
    jQuery.fn.extend({
        attr: function(name, value) {
            return jQuery.access(this, jQuery.attr, name, value, arguments.length > 1);
        },
        removeAttr: function(name) {
            return this.each(function() {
                jQuery.removeAttr(this, name);
            });
        },
        prop: function(name, value) {
            return jQuery.access(this, jQuery.prop, name, value, arguments.length > 1);
        },
        removeProp: function(name) {
            return name = jQuery.propFix[name] || name, this.each(function() {
                try {
                    this[name] = undefined, delete this[name];
                } catch (e) {}
            });
        },
        addClass: function(value) {
            var classNames, i, l, elem, setClass, c, cl;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).addClass(value.call(this, j, this.className));
            });
            if (value && "string" == typeof value) for (classNames = value.split(core_rspace), 
            i = 0, l = this.length; l > i; i++) if (elem = this[i], 1 === elem.nodeType) if (elem.className || 1 !== classNames.length) {
                for (setClass = " " + elem.className + " ", c = 0, cl = classNames.length; cl > c; c++) setClass.indexOf(" " + classNames[c] + " ") < 0 && (setClass += classNames[c] + " ");
                elem.className = jQuery.trim(setClass);
            } else elem.className = value;
            return this;
        },
        removeClass: function(value) {
            var removes, className, elem, c, cl, i, l;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).removeClass(value.call(this, j, this.className));
            });
            if (value && "string" == typeof value || value === undefined) for (removes = (value || "").split(core_rspace), 
            i = 0, l = this.length; l > i; i++) if (elem = this[i], 1 === elem.nodeType && elem.className) {
                for (className = (" " + elem.className + " ").replace(rclass, " "), c = 0, cl = removes.length; cl > c; c++) for (;className.indexOf(" " + removes[c] + " ") >= 0; ) className = className.replace(" " + removes[c] + " ", " ");
                elem.className = value ? jQuery.trim(className) : "";
            }
            return this;
        },
        toggleClass: function(value, stateVal) {
            var type = typeof value, isBool = "boolean" == typeof stateVal;
            return this.each(jQuery.isFunction(value) ? function(i) {
                jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);
            } : function() {
                if ("string" === type) for (var className, i = 0, self = jQuery(this), state = stateVal, classNames = value.split(core_rspace); className = classNames[i++]; ) state = isBool ? state : !self.hasClass(className), 
                self[state ? "addClass" : "removeClass"](className); else ("undefined" === type || "boolean" === type) && (this.className && jQuery._data(this, "__className__", this.className), 
                this.className = this.className || value === !1 ? "" : jQuery._data(this, "__className__") || "");
            });
        },
        hasClass: function(selector) {
            for (var className = " " + selector + " ", i = 0, l = this.length; l > i; i++) if (1 === this[i].nodeType && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0) return !0;
            return !1;
        },
        val: function(value) {
            var hooks, ret, isFunction, elem = this[0];
            return arguments.length ? (isFunction = jQuery.isFunction(value), this.each(function(i) {
                var val, self = jQuery(this);
                1 === this.nodeType && (val = isFunction ? value.call(this, i, self.val()) : value, 
                null == val ? val = "" : "number" == typeof val ? val += "" : jQuery.isArray(val) && (val = jQuery.map(val, function(value) {
                    return null == value ? "" : value + "";
                })), hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()], 
                hooks && "set" in hooks && hooks.set(this, val, "value") !== undefined || (this.value = val));
            })) : elem ? (hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()], 
            hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined ? ret : (ret = elem.value, 
            "string" == typeof ret ? ret.replace(rreturn, "") : null == ret ? "" : ret)) : void 0;
        }
    }), jQuery.extend({
        valHooks: {
            option: {
                get: function(elem) {
                    var val = elem.attributes.value;
                    return !val || val.specified ? elem.value : elem.text;
                }
            },
            select: {
                get: function(elem) {
                    for (var value, option, options = elem.options, index = elem.selectedIndex, one = "select-one" === elem.type || 0 > index, values = one ? null : [], max = one ? index + 1 : options.length, i = 0 > index ? max : one ? index : 0; max > i; i++) if (option = options[i], 
                    !(!option.selected && i !== index || (jQuery.support.optDisabled ? option.disabled : null !== option.getAttribute("disabled")) || option.parentNode.disabled && jQuery.nodeName(option.parentNode, "optgroup"))) {
                        if (value = jQuery(option).val(), one) return value;
                        values.push(value);
                    }
                    return values;
                },
                set: function(elem, value) {
                    var values = jQuery.makeArray(value);
                    return jQuery(elem).find("option").each(function() {
                        this.selected = jQuery.inArray(jQuery(this).val(), values) >= 0;
                    }), values.length || (elem.selectedIndex = -1), values;
                }
            }
        },
        attrFn: {},
        attr: function(elem, name, value, pass) {
            var ret, hooks, notxml, nType = elem.nodeType;
            return elem && 3 !== nType && 8 !== nType && 2 !== nType ? pass && jQuery.isFunction(jQuery.fn[name]) ? jQuery(elem)[name](value) : "undefined" == typeof elem.getAttribute ? jQuery.prop(elem, name, value) : (notxml = 1 !== nType || !jQuery.isXMLDoc(elem), 
            notxml && (name = name.toLowerCase(), hooks = jQuery.attrHooks[name] || (rboolean.test(name) ? boolHook : nodeHook)), 
            value !== undefined ? null === value ? void jQuery.removeAttr(elem, name) : hooks && "set" in hooks && notxml && (ret = hooks.set(elem, value, name)) !== undefined ? ret : (elem.setAttribute(name, value + ""), 
            value) : hooks && "get" in hooks && notxml && null !== (ret = hooks.get(elem, name)) ? ret : (ret = elem.getAttribute(name), 
            null === ret ? undefined : ret)) : void 0;
        },
        removeAttr: function(elem, value) {
            var propName, attrNames, name, isBool, i = 0;
            if (value && 1 === elem.nodeType) for (attrNames = value.split(core_rspace); i < attrNames.length; i++) name = attrNames[i], 
            name && (propName = jQuery.propFix[name] || name, isBool = rboolean.test(name), 
            isBool || jQuery.attr(elem, name, ""), elem.removeAttribute(getSetAttribute ? name : propName), 
            isBool && propName in elem && (elem[propName] = !1));
        },
        attrHooks: {
            type: {
                set: function(elem, value) {
                    if (rtype.test(elem.nodeName) && elem.parentNode) jQuery.error("type property can't be changed"); else if (!jQuery.support.radioValue && "radio" === value && jQuery.nodeName(elem, "input")) {
                        var val = elem.value;
                        return elem.setAttribute("type", value), val && (elem.value = val), value;
                    }
                }
            },
            value: {
                get: function(elem, name) {
                    return nodeHook && jQuery.nodeName(elem, "button") ? nodeHook.get(elem, name) : name in elem ? elem.value : null;
                },
                set: function(elem, value, name) {
                    return nodeHook && jQuery.nodeName(elem, "button") ? nodeHook.set(elem, value, name) : void (elem.value = value);
                }
            }
        },
        propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
        },
        prop: function(elem, name, value) {
            var ret, hooks, notxml, nType = elem.nodeType;
            return elem && 3 !== nType && 8 !== nType && 2 !== nType ? (notxml = 1 !== nType || !jQuery.isXMLDoc(elem), 
            notxml && (name = jQuery.propFix[name] || name, hooks = jQuery.propHooks[name]), 
            value !== undefined ? hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : elem[name] = value : hooks && "get" in hooks && null !== (ret = hooks.get(elem, name)) ? ret : elem[name]) : void 0;
        },
        propHooks: {
            tabIndex: {
                get: function(elem) {
                    var attributeNode = elem.getAttributeNode("tabindex");
                    return attributeNode && attributeNode.specified ? parseInt(attributeNode.value, 10) : rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href ? 0 : undefined;
                }
            }
        }
    }), boolHook = {
        get: function(elem, name) {
            var attrNode, property = jQuery.prop(elem, name);
            return property === !0 || "boolean" != typeof property && (attrNode = elem.getAttributeNode(name)) && attrNode.nodeValue !== !1 ? name.toLowerCase() : undefined;
        },
        set: function(elem, value, name) {
            var propName;
            return value === !1 ? jQuery.removeAttr(elem, name) : (propName = jQuery.propFix[name] || name, 
            propName in elem && (elem[propName] = !0), elem.setAttribute(name, name.toLowerCase())), 
            name;
        }
    }, getSetAttribute || (fixSpecified = {
        name: !0,
        id: !0,
        coords: !0
    }, nodeHook = jQuery.valHooks.button = {
        get: function(elem, name) {
            var ret;
            return ret = elem.getAttributeNode(name), ret && (fixSpecified[name] ? "" !== ret.value : ret.specified) ? ret.value : undefined;
        },
        set: function(elem, value, name) {
            var ret = elem.getAttributeNode(name);
            return ret || (ret = document.createAttribute(name), elem.setAttributeNode(ret)), 
            ret.value = value + "";
        }
    }, jQuery.each([ "width", "height" ], function(i, name) {
        jQuery.attrHooks[name] = jQuery.extend(jQuery.attrHooks[name], {
            set: function(elem, value) {
                return "" === value ? (elem.setAttribute(name, "auto"), value) : void 0;
            }
        });
    }), jQuery.attrHooks.contenteditable = {
        get: nodeHook.get,
        set: function(elem, value, name) {
            "" === value && (value = "false"), nodeHook.set(elem, value, name);
        }
    }), jQuery.support.hrefNormalized || jQuery.each([ "href", "src", "width", "height" ], function(i, name) {
        jQuery.attrHooks[name] = jQuery.extend(jQuery.attrHooks[name], {
            get: function(elem) {
                var ret = elem.getAttribute(name, 2);
                return null === ret ? undefined : ret;
            }
        });
    }), jQuery.support.style || (jQuery.attrHooks.style = {
        get: function(elem) {
            return elem.style.cssText.toLowerCase() || undefined;
        },
        set: function(elem, value) {
            return elem.style.cssText = value + "";
        }
    }), jQuery.support.optSelected || (jQuery.propHooks.selected = jQuery.extend(jQuery.propHooks.selected, {
        get: function(elem) {
            var parent = elem.parentNode;
            return parent && (parent.selectedIndex, parent.parentNode && parent.parentNode.selectedIndex), 
            null;
        }
    })), jQuery.support.enctype || (jQuery.propFix.enctype = "encoding"), jQuery.support.checkOn || jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[this] = {
            get: function(elem) {
                return null === elem.getAttribute("value") ? "on" : elem.value;
            }
        };
    }), jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[this] = jQuery.extend(jQuery.valHooks[this], {
            set: function(elem, value) {
                return jQuery.isArray(value) ? elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0 : void 0;
            }
        });
    });
    var rformElems = /^(?:textarea|input|select)$/i, rtypenamespace = /^([^\.]*|)(?:\.(.+)|)$/, rhoverHack = /(?:^|\s)hover(\.\S+|)\b/, rkeyEvent = /^key/, rmouseEvent = /^(?:mouse|contextmenu)|click/, rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, hoverHack = function(events) {
        return jQuery.event.special.hover ? events : events.replace(rhoverHack, "mouseenter$1 mouseleave$1");
    };
    jQuery.event = {
        add: function(elem, types, handler, data, selector) {
            var elemData, eventHandle, events, t, tns, type, namespaces, handleObj, handleObjIn, handlers, special;
            if (3 !== elem.nodeType && 8 !== elem.nodeType && types && handler && (elemData = jQuery._data(elem))) {
                for (handler.handler && (handleObjIn = handler, handler = handleObjIn.handler, selector = handleObjIn.selector), 
                handler.guid || (handler.guid = jQuery.guid++), events = elemData.events, events || (elemData.events = events = {}), 
                eventHandle = elemData.handle, eventHandle || (elemData.handle = eventHandle = function(e) {
                    return "undefined" == typeof jQuery || e && jQuery.event.triggered === e.type ? undefined : jQuery.event.dispatch.apply(eventHandle.elem, arguments);
                }, eventHandle.elem = elem), types = jQuery.trim(hoverHack(types)).split(" "), t = 0; t < types.length; t++) tns = rtypenamespace.exec(types[t]) || [], 
                type = tns[1], namespaces = (tns[2] || "").split(".").sort(), special = jQuery.event.special[type] || {}, 
                type = (selector ? special.delegateType : special.bindType) || type, special = jQuery.event.special[type] || {}, 
                handleObj = jQuery.extend({
                    type: type,
                    origType: tns[1],
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                    namespace: namespaces.join(".")
                }, handleObjIn), handlers = events[type], handlers || (handlers = events[type] = [], 
                handlers.delegateCount = 0, special.setup && special.setup.call(elem, data, namespaces, eventHandle) !== !1 || (elem.addEventListener ? elem.addEventListener(type, eventHandle, !1) : elem.attachEvent && elem.attachEvent("on" + type, eventHandle))), 
                special.add && (special.add.call(elem, handleObj), handleObj.handler.guid || (handleObj.handler.guid = handler.guid)), 
                selector ? handlers.splice(handlers.delegateCount++, 0, handleObj) : handlers.push(handleObj), 
                jQuery.event.global[type] = !0;
                elem = null;
            }
        },
        global: {},
        remove: function(elem, types, handler, selector, mappedTypes) {
            var t, tns, type, origType, namespaces, origCount, j, events, special, eventType, handleObj, elemData = jQuery.hasData(elem) && jQuery._data(elem);
            if (elemData && (events = elemData.events)) {
                for (types = jQuery.trim(hoverHack(types || "")).split(" "), t = 0; t < types.length; t++) if (tns = rtypenamespace.exec(types[t]) || [], 
                type = origType = tns[1], namespaces = tns[2], type) {
                    for (special = jQuery.event.special[type] || {}, type = (selector ? special.delegateType : special.bindType) || type, 
                    eventType = events[type] || [], origCount = eventType.length, namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
                    j = 0; j < eventType.length; j++) handleObj = eventType[j], !mappedTypes && origType !== handleObj.origType || handler && handler.guid !== handleObj.guid || namespaces && !namespaces.test(handleObj.namespace) || selector && selector !== handleObj.selector && ("**" !== selector || !handleObj.selector) || (eventType.splice(j--, 1), 
                    handleObj.selector && eventType.delegateCount--, special.remove && special.remove.call(elem, handleObj));
                    0 === eventType.length && origCount !== eventType.length && (special.teardown && special.teardown.call(elem, namespaces, elemData.handle) !== !1 || jQuery.removeEvent(elem, type, elemData.handle), 
                    delete events[type]);
                } else for (type in events) jQuery.event.remove(elem, type + types[t], handler, selector, !0);
                jQuery.isEmptyObject(events) && (delete elemData.handle, jQuery.removeData(elem, "events", !0));
            }
        },
        customEvent: {
            getData: !0,
            setData: !0,
            changeData: !0
        },
        trigger: function(event, data, elem, onlyHandlers) {
            if (!elem || 3 !== elem.nodeType && 8 !== elem.nodeType) {
                var cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType, type = event.type || event, namespaces = [];
                if (!rfocusMorph.test(type + jQuery.event.triggered) && (type.indexOf("!") >= 0 && (type = type.slice(0, -1), 
                exclusive = !0), type.indexOf(".") >= 0 && (namespaces = type.split("."), type = namespaces.shift(), 
                namespaces.sort()), elem && !jQuery.event.customEvent[type] || jQuery.event.global[type])) if (event = "object" == typeof event ? event[jQuery.expando] ? event : new jQuery.Event(type, event) : new jQuery.Event(type), 
                event.type = type, event.isTrigger = !0, event.exclusive = exclusive, event.namespace = namespaces.join("."), 
                event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
                ontype = type.indexOf(":") < 0 ? "on" + type : "", elem) {
                    if (event.result = undefined, event.target || (event.target = elem), data = null != data ? jQuery.makeArray(data) : [], 
                    data.unshift(event), special = jQuery.event.special[type] || {}, !special.trigger || special.trigger.apply(elem, data) !== !1) {
                        if (eventPath = [ [ elem, special.bindType || type ] ], !onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
                            for (bubbleType = special.delegateType || type, cur = rfocusMorph.test(bubbleType + type) ? elem : elem.parentNode, 
                            old = elem; cur; cur = cur.parentNode) eventPath.push([ cur, bubbleType ]), old = cur;
                            old === (elem.ownerDocument || document) && eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
                        }
                        for (i = 0; i < eventPath.length && !event.isPropagationStopped(); i++) cur = eventPath[i][0], 
                        event.type = eventPath[i][1], handle = (jQuery._data(cur, "events") || {})[event.type] && jQuery._data(cur, "handle"), 
                        handle && handle.apply(cur, data), handle = ontype && cur[ontype], handle && jQuery.acceptData(cur) && handle.apply && handle.apply(cur, data) === !1 && event.preventDefault();
                        return event.type = type, onlyHandlers || event.isDefaultPrevented() || special._default && special._default.apply(elem.ownerDocument, data) !== !1 || "click" === type && jQuery.nodeName(elem, "a") || !jQuery.acceptData(elem) || ontype && elem[type] && ("focus" !== type && "blur" !== type || 0 !== event.target.offsetWidth) && !jQuery.isWindow(elem) && (old = elem[ontype], 
                        old && (elem[ontype] = null), jQuery.event.triggered = type, elem[type](), jQuery.event.triggered = undefined, 
                        old && (elem[ontype] = old)), event.result;
                    }
                } else {
                    cache = jQuery.cache;
                    for (i in cache) cache[i].events && cache[i].events[type] && jQuery.event.trigger(event, data, cache[i].handle.elem, !0);
                }
            }
        },
        dispatch: function(event) {
            event = jQuery.event.fix(event || window.event);
            var i, j, cur, ret, selMatch, matched, matches, handleObj, sel, handlers = (jQuery._data(this, "events") || {})[event.type] || [], delegateCount = handlers.delegateCount, args = core_slice.call(arguments), run_all = !event.exclusive && !event.namespace, special = jQuery.event.special[event.type] || {}, handlerQueue = [];
            if (args[0] = event, event.delegateTarget = this, !special.preDispatch || special.preDispatch.call(this, event) !== !1) {
                if (delegateCount && (!event.button || "click" !== event.type)) for (cur = event.target; cur != this; cur = cur.parentNode || this) if (cur.disabled !== !0 || "click" !== event.type) {
                    for (selMatch = {}, matches = [], i = 0; delegateCount > i; i++) handleObj = handlers[i], 
                    sel = handleObj.selector, selMatch[sel] === undefined && (selMatch[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) >= 0 : jQuery.find(sel, this, null, [ cur ]).length), 
                    selMatch[sel] && matches.push(handleObj);
                    matches.length && handlerQueue.push({
                        elem: cur,
                        matches: matches
                    });
                }
                for (handlers.length > delegateCount && handlerQueue.push({
                    elem: this,
                    matches: handlers.slice(delegateCount)
                }), i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++) for (matched = handlerQueue[i], 
                event.currentTarget = matched.elem, j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++) handleObj = matched.matches[j], 
                (run_all || !event.namespace && !handleObj.namespace || event.namespace_re && event.namespace_re.test(handleObj.namespace)) && (event.data = handleObj.data, 
                event.handleObj = handleObj, ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args), 
                ret !== undefined && (event.result = ret, ret === !1 && (event.preventDefault(), 
                event.stopPropagation())));
                return special.postDispatch && special.postDispatch.call(this, event), event.result;
            }
        },
        props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(event, original) {
                return null == event.which && (event.which = null != original.charCode ? original.charCode : original.keyCode), 
                event;
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(event, original) {
                var eventDoc, doc, body, button = original.button, fromElement = original.fromElement;
                return null == event.pageX && null != original.clientX && (eventDoc = event.target.ownerDocument || document, 
                doc = eventDoc.documentElement, body = eventDoc.body, event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0), 
                event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)), 
                !event.relatedTarget && fromElement && (event.relatedTarget = fromElement === event.target ? original.toElement : fromElement), 
                event.which || button === undefined || (event.which = 1 & button ? 1 : 2 & button ? 3 : 4 & button ? 2 : 0), 
                event;
            }
        },
        fix: function(event) {
            if (event[jQuery.expando]) return event;
            var i, prop, originalEvent = event, fixHook = jQuery.event.fixHooks[event.type] || {}, copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;
            for (event = jQuery.Event(originalEvent), i = copy.length; i; ) prop = copy[--i], 
            event[prop] = originalEvent[prop];
            return event.target || (event.target = originalEvent.srcElement || document), 3 === event.target.nodeType && (event.target = event.target.parentNode), 
            event.metaKey = !!event.metaKey, fixHook.filter ? fixHook.filter(event, originalEvent) : event;
        },
        special: {
            load: {
                noBubble: !0
            },
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            beforeunload: {
                setup: function(data, namespaces, eventHandle) {
                    jQuery.isWindow(this) && (this.onbeforeunload = eventHandle);
                },
                teardown: function(namespaces, eventHandle) {
                    this.onbeforeunload === eventHandle && (this.onbeforeunload = null);
                }
            }
        },
        simulate: function(type, elem, event, bubble) {
            var e = jQuery.extend(new jQuery.Event(), event, {
                type: type,
                isSimulated: !0,
                originalEvent: {}
            });
            bubble ? jQuery.event.trigger(e, null, elem) : jQuery.event.dispatch.call(elem, e), 
            e.isDefaultPrevented() && event.preventDefault();
        }
    }, jQuery.event.handle = jQuery.event.dispatch, jQuery.removeEvent = document.removeEventListener ? function(elem, type, handle) {
        elem.removeEventListener && elem.removeEventListener(type, handle, !1);
    } : function(elem, type, handle) {
        var name = "on" + type;
        elem.detachEvent && ("undefined" == typeof elem[name] && (elem[name] = null), elem.detachEvent(name, handle));
    }, jQuery.Event = function(src, props) {
        return this instanceof jQuery.Event ? (src && src.type ? (this.originalEvent = src, 
        this.type = src.type, this.isDefaultPrevented = src.defaultPrevented || src.returnValue === !1 || src.getPreventDefault && src.getPreventDefault() ? returnTrue : returnFalse) : this.type = src, 
        props && jQuery.extend(this, props), this.timeStamp = src && src.timeStamp || jQuery.now(), 
        void (this[jQuery.expando] = !0)) : new jQuery.Event(src, props);
    }, jQuery.Event.prototype = {
        preventDefault: function() {
            this.isDefaultPrevented = returnTrue;
            var e = this.originalEvent;
            e && (e.preventDefault ? e.preventDefault() : e.returnValue = !1);
        },
        stopPropagation: function() {
            this.isPropagationStopped = returnTrue;
            var e = this.originalEvent;
            e && (e.stopPropagation && e.stopPropagation(), e.cancelBubble = !0);
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = returnTrue, this.stopPropagation();
        },
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse
    }, jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(orig, fix) {
        jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
                var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
                return handleObj.selector, (!related || related !== target && !jQuery.contains(target, related)) && (event.type = handleObj.origType, 
                ret = handleObj.handler.apply(this, arguments), event.type = fix), ret;
            }
        };
    }), jQuery.support.submitBubbles || (jQuery.event.special.submit = {
        setup: function() {
            return jQuery.nodeName(this, "form") ? !1 : void jQuery.event.add(this, "click._submit keypress._submit", function(e) {
                var elem = e.target, form = jQuery.nodeName(elem, "input") || jQuery.nodeName(elem, "button") ? elem.form : undefined;
                form && !jQuery._data(form, "_submit_attached") && (jQuery.event.add(form, "submit._submit", function(event) {
                    event._submit_bubble = !0;
                }), jQuery._data(form, "_submit_attached", !0));
            });
        },
        postDispatch: function(event) {
            event._submit_bubble && (delete event._submit_bubble, this.parentNode && !event.isTrigger && jQuery.event.simulate("submit", this.parentNode, event, !0));
        },
        teardown: function() {
            return jQuery.nodeName(this, "form") ? !1 : void jQuery.event.remove(this, "._submit");
        }
    }), jQuery.support.changeBubbles || (jQuery.event.special.change = {
        setup: function() {
            return rformElems.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (jQuery.event.add(this, "propertychange._change", function(event) {
                "checked" === event.originalEvent.propertyName && (this._just_changed = !0);
            }), jQuery.event.add(this, "click._change", function(event) {
                this._just_changed && !event.isTrigger && (this._just_changed = !1), jQuery.event.simulate("change", this, event, !0);
            })), !1) : void jQuery.event.add(this, "beforeactivate._change", function(e) {
                var elem = e.target;
                rformElems.test(elem.nodeName) && !jQuery._data(elem, "_change_attached") && (jQuery.event.add(elem, "change._change", function(event) {
                    !this.parentNode || event.isSimulated || event.isTrigger || jQuery.event.simulate("change", this.parentNode, event, !0);
                }), jQuery._data(elem, "_change_attached", !0));
            });
        },
        handle: function(event) {
            var elem = event.target;
            return this !== elem || event.isSimulated || event.isTrigger || "radio" !== elem.type && "checkbox" !== elem.type ? event.handleObj.handler.apply(this, arguments) : void 0;
        },
        teardown: function() {
            return jQuery.event.remove(this, "._change"), !rformElems.test(this.nodeName);
        }
    }), jQuery.support.focusinBubbles || jQuery.each({
        focus: "focusin",
        blur: "focusout"
    }, function(orig, fix) {
        var attaches = 0, handler = function(event) {
            jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), !0);
        };
        jQuery.event.special[fix] = {
            setup: function() {
                0 === attaches++ && document.addEventListener(orig, handler, !0);
            },
            teardown: function() {
                0 === --attaches && document.removeEventListener(orig, handler, !0);
            }
        };
    }), jQuery.fn.extend({
        on: function(types, selector, data, fn, one) {
            var origFn, type;
            if ("object" == typeof types) {
                "string" != typeof selector && (data = data || selector, selector = undefined);
                for (type in types) this.on(type, selector, data, types[type], one);
                return this;
            }
            if (null == data && null == fn ? (fn = selector, data = selector = undefined) : null == fn && ("string" == typeof selector ? (fn = data, 
            data = undefined) : (fn = data, data = selector, selector = undefined)), fn === !1) fn = returnFalse; else if (!fn) return this;
            return 1 === one && (origFn = fn, fn = function(event) {
                return jQuery().off(event), origFn.apply(this, arguments);
            }, fn.guid = origFn.guid || (origFn.guid = jQuery.guid++)), this.each(function() {
                jQuery.event.add(this, types, fn, data, selector);
            });
        },
        one: function(types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1);
        },
        off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) return handleObj = types.handleObj, 
            jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler), 
            this;
            if ("object" == typeof types) {
                for (type in types) this.off(type, selector, types[type]);
                return this;
            }
            return (selector === !1 || "function" == typeof selector) && (fn = selector, selector = undefined), 
            fn === !1 && (fn = returnFalse), this.each(function() {
                jQuery.event.remove(this, types, fn, selector);
            });
        },
        bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
        },
        unbind: function(types, fn) {
            return this.off(types, null, fn);
        },
        live: function(types, data, fn) {
            return jQuery(this.context).on(types, this.selector, data, fn), this;
        },
        die: function(types, fn) {
            return jQuery(this.context).off(types, this.selector || "**", fn), this;
        },
        delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
            return 1 === arguments.length ? this.off(selector, "**") : this.off(types, selector || "**", fn);
        },
        trigger: function(type, data) {
            return this.each(function() {
                jQuery.event.trigger(type, data, this);
            });
        },
        triggerHandler: function(type, data) {
            return this[0] ? jQuery.event.trigger(type, data, this[0], !0) : void 0;
        },
        toggle: function(fn) {
            var args = arguments, guid = fn.guid || jQuery.guid++, i = 0, toggler = function(event) {
                var lastToggle = (jQuery._data(this, "lastToggle" + fn.guid) || 0) % i;
                return jQuery._data(this, "lastToggle" + fn.guid, lastToggle + 1), event.preventDefault(), 
                args[lastToggle].apply(this, arguments) || !1;
            };
            for (toggler.guid = guid; i < args.length; ) args[i++].guid = guid;
            return this.click(toggler);
        },
        hover: function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        }
    }), jQuery.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(i, name) {
        jQuery.fn[name] = function(data, fn) {
            return null == fn && (fn = data, data = null), arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
        }, rkeyEvent.test(name) && (jQuery.event.fixHooks[name] = jQuery.event.keyHooks), 
        rmouseEvent.test(name) && (jQuery.event.fixHooks[name] = jQuery.event.mouseHooks);
    }), function(window, undefined) {
        function Sizzle(selector, context, results, seed) {
            results = results || [], context = context || document;
            var match, elem, xml, m, nodeType = context.nodeType;
            if (!selector || "string" != typeof selector) return results;
            if (1 !== nodeType && 9 !== nodeType) return [];
            if (xml = isXML(context), !xml && !seed && (match = rquickExpr.exec(selector))) if (m = match[1]) {
                if (9 === nodeType) {
                    if (elem = context.getElementById(m), !elem || !elem.parentNode) return results;
                    if (elem.id === m) return results.push(elem), results;
                } else if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) return results.push(elem), 
                results;
            } else {
                if (match[2]) return push.apply(results, slice.call(context.getElementsByTagName(selector), 0)), 
                results;
                if ((m = match[3]) && assertUsableClassName && context.getElementsByClassName) return push.apply(results, slice.call(context.getElementsByClassName(m), 0)), 
                results;
            }
            return select(selector.replace(rtrim, "$1"), context, results, seed, xml);
        }
        function createInputPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return "input" === name && elem.type === type;
            };
        }
        function createButtonPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return ("input" === name || "button" === name) && elem.type === type;
            };
        }
        function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
                return argument = +argument, markFunction(function(seed, matches) {
                    for (var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length; i--; ) seed[j = matchIndexes[i]] && (seed[j] = !(matches[j] = seed[j]));
                });
            });
        }
        function siblingCheck(a, b, ret) {
            if (a === b) return ret;
            for (var cur = a.nextSibling; cur; ) {
                if (cur === b) return -1;
                cur = cur.nextSibling;
            }
            return 1;
        }
        function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[expando][selector + " "];
            if (cached) return parseOnly ? 0 : cached.slice(0);
            for (soFar = selector, groups = [], preFilters = Expr.preFilter; soFar; ) {
                (!matched || (match = rcomma.exec(soFar))) && (match && (soFar = soFar.slice(match[0].length) || soFar), 
                groups.push(tokens = [])), matched = !1, (match = rcombinators.exec(soFar)) && (tokens.push(matched = new Token(match.shift())), 
                soFar = soFar.slice(matched.length), matched.type = match[0].replace(rtrim, " "));
                for (type in Expr.filter) !(match = matchExpr[type].exec(soFar)) || preFilters[type] && !(match = preFilters[type](match)) || (tokens.push(matched = new Token(match.shift())), 
                soFar = soFar.slice(matched.length), matched.type = type, matched.matches = match);
                if (!matched) break;
            }
            return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
        }
        function addCombinator(matcher, combinator, base) {
            var dir = combinator.dir, checkNonElements = base && "parentNode" === combinator.dir, doneName = done++;
            return combinator.first ? function(elem, context, xml) {
                for (;elem = elem[dir]; ) if (checkNonElements || 1 === elem.nodeType) return matcher(elem, context, xml);
            } : function(elem, context, xml) {
                if (xml) {
                    for (;elem = elem[dir]; ) if ((checkNonElements || 1 === elem.nodeType) && matcher(elem, context, xml)) return elem;
                } else for (var cache, dirkey = dirruns + " " + doneName + " ", cachedkey = dirkey + cachedruns; elem = elem[dir]; ) if (checkNonElements || 1 === elem.nodeType) {
                    if ((cache = elem[expando]) === cachedkey) return elem.sizset;
                    if ("string" == typeof cache && 0 === cache.indexOf(dirkey)) {
                        if (elem.sizset) return elem;
                    } else {
                        if (elem[expando] = cachedkey, matcher(elem, context, xml)) return elem.sizset = !0, 
                        elem;
                        elem.sizset = !1;
                    }
                }
            };
        }
        function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
                for (var i = matchers.length; i--; ) if (!matchers[i](elem, context, xml)) return !1;
                return !0;
            } : matchers[0];
        }
        function condense(unmatched, map, filter, context, xml) {
            for (var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = null != map; len > i; i++) (elem = unmatched[i]) && (!filter || filter(elem, context, xml)) && (newUnmatched.push(elem), 
            mapped && map.push(i));
            return newUnmatched;
        }
        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            return postFilter && !postFilter[expando] && (postFilter = setMatcher(postFilter)), 
            postFinder && !postFinder[expando] && (postFinder = setMatcher(postFinder, postSelector)), 
            markFunction(function(seed, results, context, xml) {
                var temp, i, elem, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(selector || "*", context.nodeType ? [ context ] : context, []), matcherIn = !preFilter || !seed && selector ? elems : condense(elems, preMap, preFilter, context, xml), matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
                if (matcher && matcher(matcherIn, matcherOut, context, xml), postFilter) for (temp = condense(matcherOut, postMap), 
                postFilter(temp, [], context, xml), i = temp.length; i--; ) (elem = temp[i]) && (matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem));
                if (seed) {
                    if (postFinder || preFilter) {
                        if (postFinder) {
                            for (temp = [], i = matcherOut.length; i--; ) (elem = matcherOut[i]) && temp.push(matcherIn[i] = elem);
                            postFinder(null, matcherOut = [], temp, xml);
                        }
                        for (i = matcherOut.length; i--; ) (elem = matcherOut[i]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1 && (seed[temp] = !(results[temp] = elem));
                    }
                } else matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut), 
                postFinder ? postFinder(null, results, matcherOut, xml) : push.apply(results, matcherOut);
            });
        }
        function matcherFromTokens(tokens) {
            for (var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
                return elem === checkContext;
            }, implicitRelative, !0), matchAnyContext = addCombinator(function(elem) {
                return indexOf.call(checkContext, elem) > -1;
            }, implicitRelative, !0), matchers = [ function(elem, context, xml) {
                return !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
            } ]; len > i; i++) if (matcher = Expr.relative[tokens[i].type]) matchers = [ addCombinator(elementMatcher(matchers), matcher) ]; else {
                if (matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches), matcher[expando]) {
                    for (j = ++i; len > j && !Expr.relative[tokens[j].type]; j++) ;
                    return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && tokens.slice(0, i - 1).join("").replace(rtrim, "$1"), matcher, j > i && matcherFromTokens(tokens.slice(i, j)), len > j && matcherFromTokens(tokens = tokens.slice(j)), len > j && tokens.join(""));
                }
                matchers.push(matcher);
            }
            return elementMatcher(matchers);
        }
        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, expandContext) {
                var elem, j, matcher, setMatched = [], matchedCount = 0, i = "0", unmatched = seed && [], outermost = null != expandContext, contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG("*", expandContext && context.parentNode || context), dirrunsUnique = dirruns += null == contextBackup ? 1 : Math.E;
                for (outermost && (outermostContext = context !== document && context, cachedruns = superMatcher.el); null != (elem = elems[i]); i++) {
                    if (byElement && elem) {
                        for (j = 0; matcher = elementMatchers[j]; j++) if (matcher(elem, context, xml)) {
                            results.push(elem);
                            break;
                        }
                        outermost && (dirruns = dirrunsUnique, cachedruns = ++superMatcher.el);
                    }
                    bySet && ((elem = !matcher && elem) && matchedCount--, seed && unmatched.push(elem));
                }
                if (matchedCount += i, bySet && i !== matchedCount) {
                    for (j = 0; matcher = setMatchers[j]; j++) matcher(unmatched, setMatched, context, xml);
                    if (seed) {
                        if (matchedCount > 0) for (;i--; ) unmatched[i] || setMatched[i] || (setMatched[i] = pop.call(results));
                        setMatched = condense(setMatched);
                    }
                    push.apply(results, setMatched), outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1 && Sizzle.uniqueSort(results);
                }
                return outermost && (dirruns = dirrunsUnique, outermostContext = contextBackup), 
                unmatched;
            };
            return superMatcher.el = 0, bySet ? markFunction(superMatcher) : superMatcher;
        }
        function multipleContexts(selector, contexts, results) {
            for (var i = 0, len = contexts.length; len > i; i++) Sizzle(selector, contexts[i], results);
            return results;
        }
        function select(selector, context, results, seed, xml) {
            var i, tokens, token, type, find, match = tokenize(selector);
            if (match.length, !seed && 1 === match.length) {
                if (tokens = match[0] = match[0].slice(0), tokens.length > 2 && "ID" === (token = tokens[0]).type && 9 === context.nodeType && !xml && Expr.relative[tokens[1].type]) {
                    if (context = Expr.find.ID(token.matches[0].replace(rbackslash, ""), context, xml)[0], 
                    !context) return results;
                    selector = selector.slice(tokens.shift().length);
                }
                for (i = matchExpr.POS.test(selector) ? -1 : tokens.length - 1; i >= 0 && (token = tokens[i], 
                !Expr.relative[type = token.type]); i--) if ((find = Expr.find[type]) && (seed = find(token.matches[0].replace(rbackslash, ""), rsibling.test(tokens[0].type) && context.parentNode || context, xml))) {
                    if (tokens.splice(i, 1), selector = seed.length && tokens.join(""), !selector) return push.apply(results, slice.call(seed, 0)), 
                    results;
                    break;
                }
            }
            return compile(selector, match)(seed, context, xml, results, rsibling.test(selector)), 
            results;
        }
        function setFilters() {}
        var cachedruns, assertGetIdNotName, Expr, getText, isXML, contains, compile, sortOrder, hasDuplicate, outermostContext, baseHasDuplicate = !0, strundefined = "undefined", expando = ("sizcache" + Math.random()).replace(".", ""), Token = String, document = window.document, docElem = document.documentElement, dirruns = 0, done = 0, pop = [].pop, push = [].push, slice = [].slice, indexOf = [].indexOf || function(elem) {
            for (var i = 0, len = this.length; len > i; i++) if (this[i] === elem) return i;
            return -1;
        }, markFunction = function(fn, value) {
            return fn[expando] = null == value || value, fn;
        }, createCache = function() {
            var cache = {}, keys = [];
            return markFunction(function(key, value) {
                return keys.push(key) > Expr.cacheLength && delete cache[keys.shift()], cache[key + " "] = value;
            }, cache);
        }, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), whitespace = "[\\x20\\t\\r\\n\\f]", characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+", identifier = characterEncoding.replace("w", "w#"), operators = "([*^$|!~]?=)", attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace + "*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]", pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)", pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators = new RegExp("^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*"), rpseudo = new RegExp(pseudos), rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/, rsibling = /[\x20\t\r\n\f]*[+~]/, rheader = /h\d/i, rinputs = /input|select|textarea|button/i, rbackslash = /\\(?!\\)/g, matchExpr = {
            ID: new RegExp("^#(" + characterEncoding + ")"),
            CLASS: new RegExp("^\\.(" + characterEncoding + ")"),
            NAME: new RegExp("^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]"),
            TAG: new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            POS: new RegExp(pos, "i"),
            CHILD: new RegExp("^:(only|nth|first|last)-child(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
            needsContext: new RegExp("^" + whitespace + "*[>+~]|" + pos, "i")
        }, assert = function(fn) {
            var div = document.createElement("div");
            try {
                return fn(div);
            } catch (e) {
                return !1;
            } finally {
                div = null;
            }
        }, assertTagNameNoComments = assert(function(div) {
            return div.appendChild(document.createComment("")), !div.getElementsByTagName("*").length;
        }), assertHrefNotNormalized = assert(function(div) {
            return div.innerHTML = "<a href='#'></a>", div.firstChild && typeof div.firstChild.getAttribute !== strundefined && "#" === div.firstChild.getAttribute("href");
        }), assertAttributes = assert(function(div) {
            div.innerHTML = "<select></select>";
            var type = typeof div.lastChild.getAttribute("multiple");
            return "boolean" !== type && "string" !== type;
        }), assertUsableClassName = assert(function(div) {
            return div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>", 
            div.getElementsByClassName && div.getElementsByClassName("e").length ? (div.lastChild.className = "e", 
            2 === div.getElementsByClassName("e").length) : !1;
        }), assertUsableName = assert(function(div) {
            div.id = expando + 0, div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>", 
            docElem.insertBefore(div, docElem.firstChild);
            var pass = document.getElementsByName && document.getElementsByName(expando).length === 2 + document.getElementsByName(expando + 0).length;
            return assertGetIdNotName = !document.getElementById(expando), docElem.removeChild(div), 
            pass;
        });
        try {
            slice.call(docElem.childNodes, 0)[0].nodeType;
        } catch (e) {
            slice = function(i) {
                for (var elem, results = []; elem = this[i]; i++) results.push(elem);
                return results;
            };
        }
        Sizzle.matches = function(expr, elements) {
            return Sizzle(expr, null, null, elements);
        }, Sizzle.matchesSelector = function(elem, expr) {
            return Sizzle(expr, null, null, [ elem ]).length > 0;
        }, getText = Sizzle.getText = function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (nodeType) {
                if (1 === nodeType || 9 === nodeType || 11 === nodeType) {
                    if ("string" == typeof elem.textContent) return elem.textContent;
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) ret += getText(elem);
                } else if (3 === nodeType || 4 === nodeType) return elem.nodeValue;
            } else for (;node = elem[i]; i++) ret += getText(node);
            return ret;
        }, isXML = Sizzle.isXML = function(elem) {
            var documentElement = elem && (elem.ownerDocument || elem).documentElement;
            return documentElement ? "HTML" !== documentElement.nodeName : !1;
        }, contains = Sizzle.contains = docElem.contains ? function(a, b) {
            var adown = 9 === a.nodeType ? a.documentElement : a, bup = b && b.parentNode;
            return a === bup || !!(bup && 1 === bup.nodeType && adown.contains && adown.contains(bup));
        } : docElem.compareDocumentPosition ? function(a, b) {
            return b && !!(16 & a.compareDocumentPosition(b));
        } : function(a, b) {
            for (;b = b.parentNode; ) if (b === a) return !0;
            return !1;
        }, Sizzle.attr = function(elem, name) {
            var val, xml = isXML(elem);
            return xml || (name = name.toLowerCase()), (val = Expr.attrHandle[name]) ? val(elem) : xml || assertAttributes ? elem.getAttribute(name) : (val = elem.getAttributeNode(name), 
            val ? "boolean" == typeof elem[name] ? elem[name] ? name : null : val.specified ? val.value : null : null);
        }, Expr = Sizzle.selectors = {
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: assertHrefNotNormalized ? {} : {
                href: function(elem) {
                    return elem.getAttribute("href", 2);
                },
                type: function(elem) {
                    return elem.getAttribute("type");
                }
            },
            find: {
                ID: assertGetIdNotName ? function(id, context, xml) {
                    if (typeof context.getElementById !== strundefined && !xml) {
                        var m = context.getElementById(id);
                        return m && m.parentNode ? [ m ] : [];
                    }
                } : function(id, context, xml) {
                    if (typeof context.getElementById !== strundefined && !xml) {
                        var m = context.getElementById(id);
                        return m ? m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ? [ m ] : undefined : [];
                    }
                },
                TAG: assertTagNameNoComments ? function(tag, context) {
                    return typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName(tag) : void 0;
                } : function(tag, context) {
                    var results = context.getElementsByTagName(tag);
                    if ("*" === tag) {
                        for (var elem, tmp = [], i = 0; elem = results[i]; i++) 1 === elem.nodeType && tmp.push(elem);
                        return tmp;
                    }
                    return results;
                },
                NAME: assertUsableName && function(tag, context) {
                    return typeof context.getElementsByName !== strundefined ? context.getElementsByName(name) : void 0;
                },
                CLASS: assertUsableClassName && function(className, context, xml) {
                    return typeof context.getElementsByClassName === strundefined || xml ? void 0 : context.getElementsByClassName(className);
                }
            },
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(match) {
                    return match[1] = match[1].replace(rbackslash, ""), match[3] = (match[4] || match[5] || "").replace(rbackslash, ""), 
                    "~=" === match[2] && (match[3] = " " + match[3] + " "), match.slice(0, 4);
                },
                CHILD: function(match) {
                    return match[1] = match[1].toLowerCase(), "nth" === match[1] ? (match[2] || Sizzle.error(match[0]), 
                    match[3] = +(match[3] ? match[4] + (match[5] || 1) : 2 * ("even" === match[2] || "odd" === match[2])), 
                    match[4] = +(match[6] + match[7] || "odd" === match[2])) : match[2] && Sizzle.error(match[0]), 
                    match;
                },
                PSEUDO: function(match) {
                    var unquoted, excess;
                    return matchExpr.CHILD.test(match[0]) ? null : (match[3] ? match[2] = match[3] : (unquoted = match[4]) && (rpseudo.test(unquoted) && (excess = tokenize(unquoted, !0)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length) && (unquoted = unquoted.slice(0, excess), 
                    match[0] = match[0].slice(0, excess)), match[2] = unquoted), match.slice(0, 3));
                }
            },
            filter: {
                ID: assertGetIdNotName ? function(id) {
                    return id = id.replace(rbackslash, ""), function(elem) {
                        return elem.getAttribute("id") === id;
                    };
                } : function(id) {
                    return id = id.replace(rbackslash, ""), function(elem) {
                        var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
                        return node && node.value === id;
                    };
                },
                TAG: function(nodeName) {
                    return "*" === nodeName ? function() {
                        return !0;
                    } : (nodeName = nodeName.replace(rbackslash, "").toLowerCase(), function(elem) {
                        return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                    });
                },
                CLASS: function(className) {
                    var pattern = classCache[expando][className + " "];
                    return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                        return pattern.test(elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "");
                    });
                },
                ATTR: function(name, operator, check) {
                    return function(elem) {
                        var result = Sizzle.attr(elem, name);
                        return null == result ? "!=" === operator : operator ? (result += "", "=" === operator ? result === check : "!=" === operator ? result !== check : "^=" === operator ? check && 0 === result.indexOf(check) : "*=" === operator ? check && result.indexOf(check) > -1 : "$=" === operator ? check && result.substr(result.length - check.length) === check : "~=" === operator ? (" " + result + " ").indexOf(check) > -1 : "|=" === operator ? result === check || result.substr(0, check.length + 1) === check + "-" : !1) : !0;
                    };
                },
                CHILD: function(type, argument, first, last) {
                    return "nth" === type ? function(elem) {
                        var node, diff, parent = elem.parentNode;
                        if (1 === first && 0 === last) return !0;
                        if (parent) for (diff = 0, node = parent.firstChild; node && (1 !== node.nodeType || (diff++, 
                        elem !== node)); node = node.nextSibling) ;
                        return diff -= last, diff === first || diff % first === 0 && diff / first >= 0;
                    } : function(elem) {
                        var node = elem;
                        switch (type) {
                          case "only":
                          case "first":
                            for (;node = node.previousSibling; ) if (1 === node.nodeType) return !1;
                            if ("first" === type) return !0;
                            node = elem;

                          case "last":
                            for (;node = node.nextSibling; ) if (1 === node.nodeType) return !1;
                            return !0;
                        }
                    };
                },
                PSEUDO: function(pseudo, argument) {
                    var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
                    return fn[expando] ? fn(argument) : fn.length > 1 ? (args = [ pseudo, pseudo, "", argument ], 
                    Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                        for (var idx, matched = fn(seed, argument), i = matched.length; i--; ) idx = indexOf.call(seed, matched[i]), 
                        seed[idx] = !(matches[idx] = matched[i]);
                    }) : function(elem) {
                        return fn(elem, 0, args);
                    }) : fn;
                }
            },
            pseudos: {
                not: markFunction(function(selector) {
                    var input = [], results = [], matcher = compile(selector.replace(rtrim, "$1"));
                    return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                        for (var elem, unmatched = matcher(seed, null, xml, []), i = seed.length; i--; ) (elem = unmatched[i]) && (seed[i] = !(matches[i] = elem));
                    }) : function(elem, context, xml) {
                        return input[0] = elem, matcher(input, null, xml, results), !results.pop();
                    };
                }),
                has: markFunction(function(selector) {
                    return function(elem) {
                        return Sizzle(selector, elem).length > 0;
                    };
                }),
                contains: markFunction(function(text) {
                    return function(elem) {
                        return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
                    };
                }),
                enabled: function(elem) {
                    return elem.disabled === !1;
                },
                disabled: function(elem) {
                    return elem.disabled === !0;
                },
                checked: function(elem) {
                    var nodeName = elem.nodeName.toLowerCase();
                    return "input" === nodeName && !!elem.checked || "option" === nodeName && !!elem.selected;
                },
                selected: function(elem) {
                    return elem.parentNode && elem.parentNode.selectedIndex, elem.selected === !0;
                },
                parent: function(elem) {
                    return !Expr.pseudos.empty(elem);
                },
                empty: function(elem) {
                    var nodeType;
                    for (elem = elem.firstChild; elem; ) {
                        if (elem.nodeName > "@" || 3 === (nodeType = elem.nodeType) || 4 === nodeType) return !1;
                        elem = elem.nextSibling;
                    }
                    return !0;
                },
                header: function(elem) {
                    return rheader.test(elem.nodeName);
                },
                text: function(elem) {
                    var type, attr;
                    return "input" === elem.nodeName.toLowerCase() && "text" === (type = elem.type) && (null == (attr = elem.getAttribute("type")) || attr.toLowerCase() === type);
                },
                radio: createInputPseudo("radio"),
                checkbox: createInputPseudo("checkbox"),
                file: createInputPseudo("file"),
                password: createInputPseudo("password"),
                image: createInputPseudo("image"),
                submit: createButtonPseudo("submit"),
                reset: createButtonPseudo("reset"),
                button: function(elem) {
                    var name = elem.nodeName.toLowerCase();
                    return "input" === name && "button" === elem.type || "button" === name;
                },
                input: function(elem) {
                    return rinputs.test(elem.nodeName);
                },
                focus: function(elem) {
                    var doc = elem.ownerDocument;
                    return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
                },
                active: function(elem) {
                    return elem === elem.ownerDocument.activeElement;
                },
                first: createPositionalPseudo(function() {
                    return [ 0 ];
                }),
                last: createPositionalPseudo(function(matchIndexes, length) {
                    return [ length - 1 ];
                }),
                eq: createPositionalPseudo(function(matchIndexes, length, argument) {
                    return [ 0 > argument ? argument + length : argument ];
                }),
                even: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 0; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes;
                }),
                odd: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 1; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes;
                }),
                lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; --i >= 0; ) matchIndexes.push(i);
                    return matchIndexes;
                }),
                gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; ++i < length; ) matchIndexes.push(i);
                    return matchIndexes;
                })
            }
        }, sortOrder = docElem.compareDocumentPosition ? function(a, b) {
            return a === b ? (hasDuplicate = !0, 0) : (a.compareDocumentPosition && b.compareDocumentPosition ? 4 & a.compareDocumentPosition(b) : a.compareDocumentPosition) ? -1 : 1;
        } : function(a, b) {
            if (a === b) return hasDuplicate = !0, 0;
            if (a.sourceIndex && b.sourceIndex) return a.sourceIndex - b.sourceIndex;
            var al, bl, ap = [], bp = [], aup = a.parentNode, bup = b.parentNode, cur = aup;
            if (aup === bup) return siblingCheck(a, b);
            if (!aup) return -1;
            if (!bup) return 1;
            for (;cur; ) ap.unshift(cur), cur = cur.parentNode;
            for (cur = bup; cur; ) bp.unshift(cur), cur = cur.parentNode;
            al = ap.length, bl = bp.length;
            for (var i = 0; al > i && bl > i; i++) if (ap[i] !== bp[i]) return siblingCheck(ap[i], bp[i]);
            return i === al ? siblingCheck(a, bp[i], -1) : siblingCheck(ap[i], b, 1);
        }, [ 0, 0 ].sort(sortOrder), baseHasDuplicate = !hasDuplicate, Sizzle.uniqueSort = function(results) {
            var elem, duplicates = [], i = 1, j = 0;
            if (hasDuplicate = baseHasDuplicate, results.sort(sortOrder), hasDuplicate) {
                for (;elem = results[i]; i++) elem === results[i - 1] && (j = duplicates.push(i));
                for (;j--; ) results.splice(duplicates[j], 1);
            }
            return results;
        }, Sizzle.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
        }, compile = Sizzle.compile = function(selector, group) {
            var i, setMatchers = [], elementMatchers = [], cached = compilerCache[expando][selector + " "];
            if (!cached) {
                for (group || (group = tokenize(selector)), i = group.length; i--; ) cached = matcherFromTokens(group[i]), 
                cached[expando] ? setMatchers.push(cached) : elementMatchers.push(cached);
                cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
            }
            return cached;
        }, document.querySelectorAll && !function() {
            var disconnectedMatch, oldSelect = select, rescape = /'|\\/g, rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g, rbuggyQSA = [ ":focus" ], rbuggyMatches = [ ":active" ], matches = docElem.matchesSelector || docElem.mozMatchesSelector || docElem.webkitMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector;
            assert(function(div) {
                div.innerHTML = "<select><option selected=''></option></select>", div.querySelectorAll("[selected]").length || rbuggyQSA.push("\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)"), 
                div.querySelectorAll(":checked").length || rbuggyQSA.push(":checked");
            }), assert(function(div) {
                div.innerHTML = "<p test=''></p>", div.querySelectorAll("[test^='']").length && rbuggyQSA.push("[*^$]=" + whitespace + "*(?:\"\"|'')"), 
                div.innerHTML = "<input type='hidden'/>", div.querySelectorAll(":enabled").length || rbuggyQSA.push(":enabled", ":disabled");
            }), rbuggyQSA = new RegExp(rbuggyQSA.join("|")), select = function(selector, context, results, seed, xml) {
                if (!seed && !xml && !rbuggyQSA.test(selector)) {
                    var groups, i, old = !0, nid = expando, newContext = context, newSelector = 9 === context.nodeType && selector;
                    if (1 === context.nodeType && "object" !== context.nodeName.toLowerCase()) {
                        for (groups = tokenize(selector), (old = context.getAttribute("id")) ? nid = old.replace(rescape, "\\$&") : context.setAttribute("id", nid), 
                        nid = "[id='" + nid + "'] ", i = groups.length; i--; ) groups[i] = nid + groups[i].join("");
                        newContext = rsibling.test(selector) && context.parentNode || context, newSelector = groups.join(",");
                    }
                    if (newSelector) try {
                        return push.apply(results, slice.call(newContext.querySelectorAll(newSelector), 0)), 
                        results;
                    } catch (qsaError) {} finally {
                        old || context.removeAttribute("id");
                    }
                }
                return oldSelect(selector, context, results, seed, xml);
            }, matches && (assert(function(div) {
                disconnectedMatch = matches.call(div, "div");
                try {
                    matches.call(div, "[test!='']:sizzle"), rbuggyMatches.push("!=", pseudos);
                } catch (e) {}
            }), rbuggyMatches = new RegExp(rbuggyMatches.join("|")), Sizzle.matchesSelector = function(elem, expr) {
                if (expr = expr.replace(rattributeQuotes, "='$1']"), !isXML(elem) && !rbuggyMatches.test(expr) && !rbuggyQSA.test(expr)) try {
                    var ret = matches.call(elem, expr);
                    if (ret || disconnectedMatch || elem.document && 11 !== elem.document.nodeType) return ret;
                } catch (e) {}
                return Sizzle(expr, null, null, [ elem ]).length > 0;
            });
        }(), Expr.pseudos.nth = Expr.pseudos.eq, Expr.filters = setFilters.prototype = Expr.pseudos, 
        Expr.setFilters = new setFilters(), Sizzle.attr = jQuery.attr, jQuery.find = Sizzle, 
        jQuery.expr = Sizzle.selectors, jQuery.expr[":"] = jQuery.expr.pseudos, jQuery.unique = Sizzle.uniqueSort, 
        jQuery.text = Sizzle.getText, jQuery.isXMLDoc = Sizzle.isXML, jQuery.contains = Sizzle.contains;
    }(window);
    var runtil = /Until$/, rparentsprev = /^(?:parents|prev(?:Until|All))/, isSimple = /^.[^:#\[\.,]*$/, rneedsContext = jQuery.expr.match.needsContext, guaranteedUnique = {
        children: !0,
        contents: !0,
        next: !0,
        prev: !0
    };
    jQuery.fn.extend({
        find: function(selector) {
            var i, l, length, n, r, ret, self = this;
            if ("string" != typeof selector) return jQuery(selector).filter(function() {
                for (i = 0, l = self.length; l > i; i++) if (jQuery.contains(self[i], this)) return !0;
            });
            for (ret = this.pushStack("", "find", selector), i = 0, l = this.length; l > i; i++) if (length = ret.length, 
            jQuery.find(selector, this[i], ret), i > 0) for (n = length; n < ret.length; n++) for (r = 0; length > r; r++) if (ret[r] === ret[n]) {
                ret.splice(n--, 1);
                break;
            }
            return ret;
        },
        has: function(target) {
            var i, targets = jQuery(target, this), len = targets.length;
            return this.filter(function() {
                for (i = 0; len > i; i++) if (jQuery.contains(this, targets[i])) return !0;
            });
        },
        not: function(selector) {
            return this.pushStack(winnow(this, selector, !1), "not", selector);
        },
        filter: function(selector) {
            return this.pushStack(winnow(this, selector, !0), "filter", selector);
        },
        is: function(selector) {
            return !!selector && ("string" == typeof selector ? rneedsContext.test(selector) ? jQuery(selector, this.context).index(this[0]) >= 0 : jQuery.filter(selector, this).length > 0 : this.filter(selector).length > 0);
        },
        closest: function(selectors, context) {
            for (var cur, i = 0, l = this.length, ret = [], pos = rneedsContext.test(selectors) || "string" != typeof selectors ? jQuery(selectors, context || this.context) : 0; l > i; i++) for (cur = this[i]; cur && cur.ownerDocument && cur !== context && 11 !== cur.nodeType; ) {
                if (pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors)) {
                    ret.push(cur);
                    break;
                }
                cur = cur.parentNode;
            }
            return ret = ret.length > 1 ? jQuery.unique(ret) : ret, this.pushStack(ret, "closest", selectors);
        },
        index: function(elem) {
            return elem ? "string" == typeof elem ? jQuery.inArray(this[0], jQuery(elem)) : jQuery.inArray(elem.jquery ? elem[0] : elem, this) : this[0] && this[0].parentNode ? this.prevAll().length : -1;
        },
        add: function(selector, context) {
            var set = "string" == typeof selector ? jQuery(selector, context) : jQuery.makeArray(selector && selector.nodeType ? [ selector ] : selector), all = jQuery.merge(this.get(), set);
            return this.pushStack(isDisconnected(set[0]) || isDisconnected(all[0]) ? all : jQuery.unique(all));
        },
        addBack: function(selector) {
            return this.add(null == selector ? this.prevObject : this.prevObject.filter(selector));
        }
    }), jQuery.fn.andSelf = jQuery.fn.addBack, jQuery.each({
        parent: function(elem) {
            var parent = elem.parentNode;
            return parent && 11 !== parent.nodeType ? parent : null;
        },
        parents: function(elem) {
            return jQuery.dir(elem, "parentNode");
        },
        parentsUntil: function(elem, i, until) {
            return jQuery.dir(elem, "parentNode", until);
        },
        next: function(elem) {
            return sibling(elem, "nextSibling");
        },
        prev: function(elem) {
            return sibling(elem, "previousSibling");
        },
        nextAll: function(elem) {
            return jQuery.dir(elem, "nextSibling");
        },
        prevAll: function(elem) {
            return jQuery.dir(elem, "previousSibling");
        },
        nextUntil: function(elem, i, until) {
            return jQuery.dir(elem, "nextSibling", until);
        },
        prevUntil: function(elem, i, until) {
            return jQuery.dir(elem, "previousSibling", until);
        },
        siblings: function(elem) {
            return jQuery.sibling((elem.parentNode || {}).firstChild, elem);
        },
        children: function(elem) {
            return jQuery.sibling(elem.firstChild);
        },
        contents: function(elem) {
            return jQuery.nodeName(elem, "iframe") ? elem.contentDocument || elem.contentWindow.document : jQuery.merge([], elem.childNodes);
        }
    }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
            var ret = jQuery.map(this, fn, until);
            return runtil.test(name) || (selector = until), selector && "string" == typeof selector && (ret = jQuery.filter(selector, ret)), 
            ret = this.length > 1 && !guaranteedUnique[name] ? jQuery.unique(ret) : ret, this.length > 1 && rparentsprev.test(name) && (ret = ret.reverse()), 
            this.pushStack(ret, name, core_slice.call(arguments).join(","));
        };
    }), jQuery.extend({
        filter: function(expr, elems, not) {
            return not && (expr = ":not(" + expr + ")"), 1 === elems.length ? jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] : jQuery.find.matches(expr, elems);
        },
        dir: function(elem, dir, until) {
            for (var matched = [], cur = elem[dir]; cur && 9 !== cur.nodeType && (until === undefined || 1 !== cur.nodeType || !jQuery(cur).is(until)); ) 1 === cur.nodeType && matched.push(cur), 
            cur = cur[dir];
            return matched;
        },
        sibling: function(n, elem) {
            for (var r = []; n; n = n.nextSibling) 1 === n.nodeType && n !== elem && r.push(n);
            return r;
        }
    });
    var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video", rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g, rleadingWhitespace = /^\s+/, rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, rtagName = /<([\w:]+)/, rtbody = /<tbody/i, rhtml = /<|&#?\w+;/, rnoInnerhtml = /<(?:script|style|link)/i, rnocache = /<(?:script|object|embed|option|style)/i, rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"), rcheckableType = /^(?:checkbox|radio)$/, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rscriptType = /\/(java|ecma)script/i, rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g, wrapMap = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        legend: [ 1, "<fieldset>", "</fieldset>" ],
        thead: [ 1, "<table>", "</table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        area: [ 1, "<map>", "</map>" ],
        _default: [ 0, "", "" ]
    }, safeFragment = createSafeFragment(document), fragmentDiv = safeFragment.appendChild(document.createElement("div"));
    wrapMap.optgroup = wrapMap.option, wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead, 
    wrapMap.th = wrapMap.td, jQuery.support.htmlSerialize || (wrapMap._default = [ 1, "X<div>", "</div>" ]), 
    jQuery.fn.extend({
        text: function(value) {
            return jQuery.access(this, function(value) {
                return value === undefined ? jQuery.text(this) : this.empty().append((this[0] && this[0].ownerDocument || document).createTextNode(value));
            }, null, value, arguments.length);
        },
        wrapAll: function(html) {
            if (jQuery.isFunction(html)) return this.each(function(i) {
                jQuery(this).wrapAll(html.call(this, i));
            });
            if (this[0]) {
                var wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && wrap.insertBefore(this[0]), wrap.map(function() {
                    for (var elem = this; elem.firstChild && 1 === elem.firstChild.nodeType; ) elem = elem.firstChild;
                    return elem;
                }).append(this);
            }
            return this;
        },
        wrapInner: function(html) {
            return this.each(jQuery.isFunction(html) ? function(i) {
                jQuery(this).wrapInner(html.call(this, i));
            } : function() {
                var self = jQuery(this), contents = self.contents();
                contents.length ? contents.wrapAll(html) : self.append(html);
            });
        },
        wrap: function(html) {
            var isFunction = jQuery.isFunction(html);
            return this.each(function(i) {
                jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                jQuery.nodeName(this, "body") || jQuery(this).replaceWith(this.childNodes);
            }).end();
        },
        append: function() {
            return this.domManip(arguments, !0, function(elem) {
                (1 === this.nodeType || 11 === this.nodeType) && this.appendChild(elem);
            });
        },
        prepend: function() {
            return this.domManip(arguments, !0, function(elem) {
                (1 === this.nodeType || 11 === this.nodeType) && this.insertBefore(elem, this.firstChild);
            });
        },
        before: function() {
            if (!isDisconnected(this[0])) return this.domManip(arguments, !1, function(elem) {
                this.parentNode.insertBefore(elem, this);
            });
            if (arguments.length) {
                var set = jQuery.clean(arguments);
                return this.pushStack(jQuery.merge(set, this), "before", this.selector);
            }
        },
        after: function() {
            if (!isDisconnected(this[0])) return this.domManip(arguments, !1, function(elem) {
                this.parentNode.insertBefore(elem, this.nextSibling);
            });
            if (arguments.length) {
                var set = jQuery.clean(arguments);
                return this.pushStack(jQuery.merge(this, set), "after", this.selector);
            }
        },
        remove: function(selector, keepData) {
            for (var elem, i = 0; null != (elem = this[i]); i++) (!selector || jQuery.filter(selector, [ elem ]).length) && (keepData || 1 !== elem.nodeType || (jQuery.cleanData(elem.getElementsByTagName("*")), 
            jQuery.cleanData([ elem ])), elem.parentNode && elem.parentNode.removeChild(elem));
            return this;
        },
        empty: function() {
            for (var elem, i = 0; null != (elem = this[i]); i++) for (1 === elem.nodeType && jQuery.cleanData(elem.getElementsByTagName("*")); elem.firstChild; ) elem.removeChild(elem.firstChild);
            return this;
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
            return dataAndEvents = null == dataAndEvents ? !1 : dataAndEvents, deepDataAndEvents = null == deepDataAndEvents ? dataAndEvents : deepDataAndEvents, 
            this.map(function() {
                return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
            });
        },
        html: function(value) {
            return jQuery.access(this, function(value) {
                var elem = this[0] || {}, i = 0, l = this.length;
                if (value === undefined) return 1 === elem.nodeType ? elem.innerHTML.replace(rinlinejQuery, "") : undefined;
                if (!("string" != typeof value || rnoInnerhtml.test(value) || !jQuery.support.htmlSerialize && rnoshimcache.test(value) || !jQuery.support.leadingWhitespace && rleadingWhitespace.test(value) || wrapMap[(rtagName.exec(value) || [ "", "" ])[1].toLowerCase()])) {
                    value = value.replace(rxhtmlTag, "<$1></$2>");
                    try {
                        for (;l > i; i++) elem = this[i] || {}, 1 === elem.nodeType && (jQuery.cleanData(elem.getElementsByTagName("*")), 
                        elem.innerHTML = value);
                        elem = 0;
                    } catch (e) {}
                }
                elem && this.empty().append(value);
            }, null, value, arguments.length);
        },
        replaceWith: function(value) {
            return isDisconnected(this[0]) ? this.length ? this.pushStack(jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value) : this : jQuery.isFunction(value) ? this.each(function(i) {
                var self = jQuery(this), old = self.html();
                self.replaceWith(value.call(this, i, old));
            }) : ("string" != typeof value && (value = jQuery(value).detach()), this.each(function() {
                var next = this.nextSibling, parent = this.parentNode;
                jQuery(this).remove(), next ? jQuery(next).before(value) : jQuery(parent).append(value);
            }));
        },
        detach: function(selector) {
            return this.remove(selector, !0);
        },
        domManip: function(args, table, callback) {
            args = [].concat.apply([], args);
            var results, first, fragment, iNoClone, i = 0, value = args[0], scripts = [], l = this.length;
            if (!jQuery.support.checkClone && l > 1 && "string" == typeof value && rchecked.test(value)) return this.each(function() {
                jQuery(this).domManip(args, table, callback);
            });
            if (jQuery.isFunction(value)) return this.each(function(i) {
                var self = jQuery(this);
                args[0] = value.call(this, i, table ? self.html() : undefined), self.domManip(args, table, callback);
            });
            if (this[0]) {
                if (results = jQuery.buildFragment(args, this, scripts), fragment = results.fragment, 
                first = fragment.firstChild, 1 === fragment.childNodes.length && (fragment = first), 
                first) for (table = table && jQuery.nodeName(first, "tr"), iNoClone = results.cacheable || l - 1; l > i; i++) callback.call(table && jQuery.nodeName(this[i], "table") ? findOrAppend(this[i], "tbody") : this[i], i === iNoClone ? fragment : jQuery.clone(fragment, !0, !0));
                fragment = first = null, scripts.length && jQuery.each(scripts, function(i, elem) {
                    elem.src ? jQuery.ajax ? jQuery.ajax({
                        url: elem.src,
                        type: "GET",
                        dataType: "script",
                        async: !1,
                        global: !1,
                        "throws": !0
                    }) : jQuery.error("no ajax") : jQuery.globalEval((elem.text || elem.textContent || elem.innerHTML || "").replace(rcleanScript, "")), 
                    elem.parentNode && elem.parentNode.removeChild(elem);
                });
            }
            return this;
        }
    }), jQuery.buildFragment = function(args, context, scripts) {
        var fragment, cacheable, cachehit, first = args[0];
        return context = context || document, context = !context.nodeType && context[0] || context, 
        context = context.ownerDocument || context, !(1 === args.length && "string" == typeof first && first.length < 512 && context === document && "<" === first.charAt(0)) || rnocache.test(first) || !jQuery.support.checkClone && rchecked.test(first) || !jQuery.support.html5Clone && rnoshimcache.test(first) || (cacheable = !0, 
        fragment = jQuery.fragments[first], cachehit = fragment !== undefined), fragment || (fragment = context.createDocumentFragment(), 
        jQuery.clean(args, context, fragment, scripts), cacheable && (jQuery.fragments[first] = cachehit && fragment)), 
        {
            fragment: fragment,
            cacheable: cacheable
        };
    }, jQuery.fragments = {}, jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(name, original) {
        jQuery.fn[name] = function(selector) {
            var elems, i = 0, ret = [], insert = jQuery(selector), l = insert.length, parent = 1 === this.length && this[0].parentNode;
            if ((null == parent || parent && 11 === parent.nodeType && 1 === parent.childNodes.length) && 1 === l) return insert[original](this[0]), 
            this;
            for (;l > i; i++) elems = (i > 0 ? this.clone(!0) : this).get(), jQuery(insert[i])[original](elems), 
            ret = ret.concat(elems);
            return this.pushStack(ret, name, insert.selector);
        };
    }), jQuery.extend({
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var srcElements, destElements, i, clone;
            if (jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test("<" + elem.nodeName + ">") ? clone = elem.cloneNode(!0) : (fragmentDiv.innerHTML = elem.outerHTML, 
            fragmentDiv.removeChild(clone = fragmentDiv.firstChild)), !(jQuery.support.noCloneEvent && jQuery.support.noCloneChecked || 1 !== elem.nodeType && 11 !== elem.nodeType || jQuery.isXMLDoc(elem))) for (cloneFixAttributes(elem, clone), 
            srcElements = getAll(elem), destElements = getAll(clone), i = 0; srcElements[i]; ++i) destElements[i] && cloneFixAttributes(srcElements[i], destElements[i]);
            if (dataAndEvents && (cloneCopyEvent(elem, clone), deepDataAndEvents)) for (srcElements = getAll(elem), 
            destElements = getAll(clone), i = 0; srcElements[i]; ++i) cloneCopyEvent(srcElements[i], destElements[i]);
            return srcElements = destElements = null, clone;
        },
        clean: function(elems, context, fragment, scripts) {
            var i, j, elem, tag, wrap, depth, div, hasBody, tbody, handleScript, jsTags, safe = context === document && safeFragment, ret = [];
            for (context && "undefined" != typeof context.createDocumentFragment || (context = document), 
            i = 0; null != (elem = elems[i]); i++) if ("number" == typeof elem && (elem += ""), 
            elem) {
                if ("string" == typeof elem) if (rhtml.test(elem)) {
                    for (safe = safe || createSafeFragment(context), div = context.createElement("div"), 
                    safe.appendChild(div), elem = elem.replace(rxhtmlTag, "<$1></$2>"), tag = (rtagName.exec(elem) || [ "", "" ])[1].toLowerCase(), 
                    wrap = wrapMap[tag] || wrapMap._default, depth = wrap[0], div.innerHTML = wrap[1] + elem + wrap[2]; depth--; ) div = div.lastChild;
                    if (!jQuery.support.tbody) for (hasBody = rtbody.test(elem), tbody = "table" !== tag || hasBody ? "<table>" !== wrap[1] || hasBody ? [] : div.childNodes : div.firstChild && div.firstChild.childNodes, 
                    j = tbody.length - 1; j >= 0; --j) jQuery.nodeName(tbody[j], "tbody") && !tbody[j].childNodes.length && tbody[j].parentNode.removeChild(tbody[j]);
                    !jQuery.support.leadingWhitespace && rleadingWhitespace.test(elem) && div.insertBefore(context.createTextNode(rleadingWhitespace.exec(elem)[0]), div.firstChild), 
                    elem = div.childNodes, div.parentNode.removeChild(div);
                } else elem = context.createTextNode(elem);
                elem.nodeType ? ret.push(elem) : jQuery.merge(ret, elem);
            }
            if (div && (elem = div = safe = null), !jQuery.support.appendChecked) for (i = 0; null != (elem = ret[i]); i++) jQuery.nodeName(elem, "input") ? fixDefaultChecked(elem) : "undefined" != typeof elem.getElementsByTagName && jQuery.grep(elem.getElementsByTagName("input"), fixDefaultChecked);
            if (fragment) for (handleScript = function(elem) {
                return !elem.type || rscriptType.test(elem.type) ? scripts ? scripts.push(elem.parentNode ? elem.parentNode.removeChild(elem) : elem) : fragment.appendChild(elem) : void 0;
            }, i = 0; null != (elem = ret[i]); i++) jQuery.nodeName(elem, "script") && handleScript(elem) || (fragment.appendChild(elem), 
            "undefined" != typeof elem.getElementsByTagName && (jsTags = jQuery.grep(jQuery.merge([], elem.getElementsByTagName("script")), handleScript), 
            ret.splice.apply(ret, [ i + 1, 0 ].concat(jsTags)), i += jsTags.length));
            return ret;
        },
        cleanData: function(elems, acceptData) {
            for (var data, id, elem, type, i = 0, internalKey = jQuery.expando, cache = jQuery.cache, deleteExpando = jQuery.support.deleteExpando, special = jQuery.event.special; null != (elem = elems[i]); i++) if ((acceptData || jQuery.acceptData(elem)) && (id = elem[internalKey], 
            data = id && cache[id])) {
                if (data.events) for (type in data.events) special[type] ? jQuery.event.remove(elem, type) : jQuery.removeEvent(elem, type, data.handle);
                cache[id] && (delete cache[id], deleteExpando ? delete elem[internalKey] : elem.removeAttribute ? elem.removeAttribute(internalKey) : elem[internalKey] = null, 
                jQuery.deletedIds.push(id));
            }
        }
    }), function() {
        var matched, browser;
        jQuery.uaMatch = function(ua) {
            ua = ua.toLowerCase();
            var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
            return {
                browser: match[1] || "",
                version: match[2] || "0"
            };
        }, matched = jQuery.uaMatch(navigator.userAgent), browser = {}, matched.browser && (browser[matched.browser] = !0, 
        browser.version = matched.version), browser.chrome ? browser.webkit = !0 : browser.webkit && (browser.safari = !0), 
        jQuery.browser = browser, jQuery.sub = function() {
            function jQuerySub(selector, context) {
                return new jQuerySub.fn.init(selector, context);
            }
            jQuery.extend(!0, jQuerySub, this), jQuerySub.superclass = this, jQuerySub.fn = jQuerySub.prototype = this(), 
            jQuerySub.fn.constructor = jQuerySub, jQuerySub.sub = this.sub, jQuerySub.fn.init = function(selector, context) {
                return context && context instanceof jQuery && !(context instanceof jQuerySub) && (context = jQuerySub(context)), 
                jQuery.fn.init.call(this, selector, context, rootjQuerySub);
            }, jQuerySub.fn.init.prototype = jQuerySub.fn;
            var rootjQuerySub = jQuerySub(document);
            return jQuerySub;
        };
    }();
    var curCSS, iframe, iframeDoc, ralpha = /alpha\([^)]*\)/i, ropacity = /opacity=([^)]*)/, rposition = /^(top|right|bottom|left)$/, rdisplayswap = /^(none|table(?!-c[ea]).+)/, rmargin = /^margin/, rnumsplit = new RegExp("^(" + core_pnum + ")(.*)$", "i"), rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i"), rrelNum = new RegExp("^([-+])=(" + core_pnum + ")", "i"), elemdisplay = {
        BODY: "block"
    }, cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, cssNormalTransform = {
        letterSpacing: 0,
        fontWeight: 400
    }, cssExpand = [ "Top", "Right", "Bottom", "Left" ], cssPrefixes = [ "Webkit", "O", "Moz", "ms" ], eventsToggle = jQuery.fn.toggle;
    jQuery.fn.extend({
        css: function(name, value) {
            return jQuery.access(this, function(elem, name, value) {
                return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
            }, name, value, arguments.length > 1);
        },
        show: function() {
            return showHide(this, !0);
        },
        hide: function() {
            return showHide(this);
        },
        toggle: function(state, fn2) {
            var bool = "boolean" == typeof state;
            return jQuery.isFunction(state) && jQuery.isFunction(fn2) ? eventsToggle.apply(this, arguments) : this.each(function() {
                (bool ? state : isHidden(this)) ? jQuery(this).show() : jQuery(this).hide();
            });
        }
    }), jQuery.extend({
        cssHooks: {
            opacity: {
                get: function(elem, computed) {
                    if (computed) {
                        var ret = curCSS(elem, "opacity");
                        return "" === ret ? "1" : ret;
                    }
                }
            }
        },
        cssNumber: {
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(elem, name, value, extra) {
            if (elem && 3 !== elem.nodeType && 8 !== elem.nodeType && elem.style) {
                var ret, type, hooks, origName = jQuery.camelCase(name), style = elem.style;
                if (name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName)), 
                hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], value === undefined) return hooks && "get" in hooks && (ret = hooks.get(elem, !1, extra)) !== undefined ? ret : style[name];
                if (type = typeof value, "string" === type && (ret = rrelNum.exec(value)) && (value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name)), 
                type = "number"), !(null == value || "number" === type && isNaN(value) || ("number" !== type || jQuery.cssNumber[origName] || (value += "px"), 
                hooks && "set" in hooks && (value = hooks.set(elem, value, extra)) === undefined))) try {
                    style[name] = value;
                } catch (e) {}
            }
        },
        css: function(elem, name, numeric, extra) {
            var val, num, hooks, origName = jQuery.camelCase(name);
            return name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName)), 
            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], hooks && "get" in hooks && (val = hooks.get(elem, !0, extra)), 
            val === undefined && (val = curCSS(elem, name)), "normal" === val && name in cssNormalTransform && (val = cssNormalTransform[name]), 
            numeric || extra !== undefined ? (num = parseFloat(val), numeric || jQuery.isNumeric(num) ? num || 0 : val) : val;
        },
        swap: function(elem, options, callback) {
            var ret, name, old = {};
            for (name in options) old[name] = elem.style[name], elem.style[name] = options[name];
            ret = callback.call(elem);
            for (name in options) elem.style[name] = old[name];
            return ret;
        }
    }), window.getComputedStyle ? curCSS = function(elem, name) {
        var ret, width, minWidth, maxWidth, computed = window.getComputedStyle(elem, null), style = elem.style;
        return computed && (ret = computed.getPropertyValue(name) || computed[name], "" !== ret || jQuery.contains(elem.ownerDocument, elem) || (ret = jQuery.style(elem, name)), 
        rnumnonpx.test(ret) && rmargin.test(name) && (width = style.width, minWidth = style.minWidth, 
        maxWidth = style.maxWidth, style.minWidth = style.maxWidth = style.width = ret, 
        ret = computed.width, style.width = width, style.minWidth = minWidth, style.maxWidth = maxWidth)), 
        ret;
    } : document.documentElement.currentStyle && (curCSS = function(elem, name) {
        var left, rsLeft, ret = elem.currentStyle && elem.currentStyle[name], style = elem.style;
        return null == ret && style && style[name] && (ret = style[name]), rnumnonpx.test(ret) && !rposition.test(name) && (left = style.left, 
        rsLeft = elem.runtimeStyle && elem.runtimeStyle.left, rsLeft && (elem.runtimeStyle.left = elem.currentStyle.left), 
        style.left = "fontSize" === name ? "1em" : ret, ret = style.pixelLeft + "px", style.left = left, 
        rsLeft && (elem.runtimeStyle.left = rsLeft)), "" === ret ? "auto" : ret;
    }), jQuery.each([ "height", "width" ], function(i, name) {
        jQuery.cssHooks[name] = {
            get: function(elem, computed, extra) {
                return computed ? 0 === elem.offsetWidth && rdisplayswap.test(curCSS(elem, "display")) ? jQuery.swap(elem, cssShow, function() {
                    return getWidthOrHeight(elem, name, extra);
                }) : getWidthOrHeight(elem, name, extra) : void 0;
            },
            set: function(elem, value, extra) {
                return setPositiveNumber(elem, value, extra ? augmentWidthOrHeight(elem, name, extra, jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing")) : 0);
            }
        };
    }), jQuery.support.opacity || (jQuery.cssHooks.opacity = {
        get: function(elem, computed) {
            return ropacity.test((computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : computed ? "1" : "";
        },
        set: function(elem, value) {
            var style = elem.style, currentStyle = elem.currentStyle, opacity = jQuery.isNumeric(value) ? "alpha(opacity=" + 100 * value + ")" : "", filter = currentStyle && currentStyle.filter || style.filter || "";
            style.zoom = 1, value >= 1 && "" === jQuery.trim(filter.replace(ralpha, "")) && style.removeAttribute && (style.removeAttribute("filter"), 
            currentStyle && !currentStyle.filter) || (style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : filter + " " + opacity);
        }
    }), jQuery(function() {
        jQuery.support.reliableMarginRight || (jQuery.cssHooks.marginRight = {
            get: function(elem, computed) {
                return jQuery.swap(elem, {
                    display: "inline-block"
                }, function() {
                    return computed ? curCSS(elem, "marginRight") : void 0;
                });
            }
        }), !jQuery.support.pixelPosition && jQuery.fn.position && jQuery.each([ "top", "left" ], function(i, prop) {
            jQuery.cssHooks[prop] = {
                get: function(elem, computed) {
                    if (computed) {
                        var ret = curCSS(elem, prop);
                        return rnumnonpx.test(ret) ? jQuery(elem).position()[prop] + "px" : ret;
                    }
                }
            };
        });
    }), jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.hidden = function(elem) {
        return 0 === elem.offsetWidth && 0 === elem.offsetHeight || !jQuery.support.reliableHiddenOffsets && "none" === (elem.style && elem.style.display || curCSS(elem, "display"));
    }, jQuery.expr.filters.visible = function(elem) {
        return !jQuery.expr.filters.hidden(elem);
    }), jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {
            expand: function(value) {
                var i, parts = "string" == typeof value ? value.split(" ") : [ value ], expanded = {};
                for (i = 0; 4 > i; i++) expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
                return expanded;
            }
        }, rmargin.test(prefix) || (jQuery.cssHooks[prefix + suffix].set = setPositiveNumber);
    });
    var r20 = /%20/g, rbracket = /\[\]$/, rCRLF = /\r?\n/g, rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i, rselectTextarea = /^(?:select|textarea)/i;
    jQuery.fn.extend({
        serialize: function() {
            return jQuery.param(this.serializeArray());
        },
        serializeArray: function() {
            return this.map(function() {
                return this.elements ? jQuery.makeArray(this.elements) : this;
            }).filter(function() {
                return this.name && !this.disabled && (this.checked || rselectTextarea.test(this.nodeName) || rinput.test(this.type));
            }).map(function(i, elem) {
                var val = jQuery(this).val();
                return null == val ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
                    return {
                        name: elem.name,
                        value: val.replace(rCRLF, "\r\n")
                    };
                }) : {
                    name: elem.name,
                    value: val.replace(rCRLF, "\r\n")
                };
            }).get();
        }
    }), jQuery.param = function(a, traditional) {
        var prefix, s = [], add = function(key, value) {
            value = jQuery.isFunction(value) ? value() : null == value ? "" : value, s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
        };
        if (traditional === undefined && (traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional), 
        jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) jQuery.each(a, function() {
            add(this.name, this.value);
        }); else for (prefix in a) buildParams(prefix, a[prefix], traditional, add);
        return s.join("&").replace(r20, "+");
    };
    var ajaxLocParts, ajaxLocation, rhash = /#.*$/, rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm, rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, rquery = /\?/, rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, rts = /([?&])_=[^&]*/, rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/, _load = jQuery.fn.load, prefilters = {}, transports = {}, allTypes = [ "*/" ] + [ "*" ];
    try {
        ajaxLocation = location.href;
    } catch (e) {
        ajaxLocation = document.createElement("a"), ajaxLocation.href = "", ajaxLocation = ajaxLocation.href;
    }
    ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [], jQuery.fn.load = function(url, params, callback) {
        if ("string" != typeof url && _load) return _load.apply(this, arguments);
        if (!this.length) return this;
        var selector, type, response, self = this, off = url.indexOf(" ");
        return off >= 0 && (selector = url.slice(off, url.length), url = url.slice(0, off)), 
        jQuery.isFunction(params) ? (callback = params, params = undefined) : params && "object" == typeof params && (type = "POST"), 
        jQuery.ajax({
            url: url,
            type: type,
            dataType: "html",
            data: params,
            complete: function(jqXHR, status) {
                callback && self.each(callback, response || [ jqXHR.responseText, status, jqXHR ]);
            }
        }).done(function(responseText) {
            response = arguments, self.html(selector ? jQuery("<div>").append(responseText.replace(rscript, "")).find(selector) : responseText);
        }), this;
    }, jQuery.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function(i, o) {
        jQuery.fn[o] = function(f) {
            return this.on(o, f);
        };
    }), jQuery.each([ "get", "post" ], function(i, method) {
        jQuery[method] = function(url, data, callback, type) {
            return jQuery.isFunction(data) && (type = type || callback, callback = data, data = undefined), 
            jQuery.ajax({
                type: method,
                url: url,
                data: data,
                success: callback,
                dataType: type
            });
        };
    }), jQuery.extend({
        getScript: function(url, callback) {
            return jQuery.get(url, undefined, callback, "script");
        },
        getJSON: function(url, data, callback) {
            return jQuery.get(url, data, callback, "json");
        },
        ajaxSetup: function(target, settings) {
            return settings ? ajaxExtend(target, jQuery.ajaxSettings) : (settings = target, 
            target = jQuery.ajaxSettings), ajaxExtend(target, settings), target;
        },
        ajaxSettings: {
            url: ajaxLocation,
            isLocal: rlocalProtocol.test(ajaxLocParts[1]),
            global: !0,
            type: "GET",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            processData: !0,
            async: !0,
            accepts: {
                xml: "application/xml, text/xml",
                html: "text/html",
                text: "text/plain",
                json: "application/json, text/javascript",
                "*": allTypes
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText"
            },
            converters: {
                "* text": window.String,
                "text html": !0,
                "text json": jQuery.parseJSON,
                "text xml": jQuery.parseXML
            },
            flatOptions: {
                context: !0,
                url: !0
            }
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        ajax: function(url, options) {
            function done(status, nativeStatusText, responses, headers) {
                var isSuccess, success, error, response, modified, statusText = nativeStatusText;
                2 !== state && (state = 2, timeoutTimer && clearTimeout(timeoutTimer), transport = undefined, 
                responseHeadersString = headers || "", jqXHR.readyState = status > 0 ? 4 : 0, responses && (response = ajaxHandleResponses(s, jqXHR, responses)), 
                status >= 200 && 300 > status || 304 === status ? (s.ifModified && (modified = jqXHR.getResponseHeader("Last-Modified"), 
                modified && (jQuery.lastModified[ifModifiedKey] = modified), modified = jqXHR.getResponseHeader("Etag"), 
                modified && (jQuery.etag[ifModifiedKey] = modified)), 304 === status ? (statusText = "notmodified", 
                isSuccess = !0) : (isSuccess = ajaxConvert(s, response), statusText = isSuccess.state, 
                success = isSuccess.data, error = isSuccess.error, isSuccess = !error)) : (error = statusText, 
                (!statusText || status) && (statusText = "error", 0 > status && (status = 0))), 
                jqXHR.status = status, jqXHR.statusText = (nativeStatusText || statusText) + "", 
                isSuccess ? deferred.resolveWith(callbackContext, [ success, statusText, jqXHR ]) : deferred.rejectWith(callbackContext, [ jqXHR, statusText, error ]), 
                jqXHR.statusCode(statusCode), statusCode = undefined, fireGlobals && globalEventContext.trigger("ajax" + (isSuccess ? "Success" : "Error"), [ jqXHR, s, isSuccess ? success : error ]), 
                completeDeferred.fireWith(callbackContext, [ jqXHR, statusText ]), fireGlobals && (globalEventContext.trigger("ajaxComplete", [ jqXHR, s ]), 
                --jQuery.active || jQuery.event.trigger("ajaxStop")));
            }
            "object" == typeof url && (options = url, url = undefined), options = options || {};
            var ifModifiedKey, responseHeadersString, responseHeaders, transport, timeoutTimer, parts, fireGlobals, i, s = jQuery.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = callbackContext !== s && (callbackContext.nodeType || callbackContext instanceof jQuery) ? jQuery(callbackContext) : jQuery.event, deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, state = 0, strAbort = "canceled", jqXHR = {
                readyState: 0,
                setRequestHeader: function(name, value) {
                    if (!state) {
                        var lname = name.toLowerCase();
                        name = requestHeadersNames[lname] = requestHeadersNames[lname] || name, requestHeaders[name] = value;
                    }
                    return this;
                },
                getAllResponseHeaders: function() {
                    return 2 === state ? responseHeadersString : null;
                },
                getResponseHeader: function(key) {
                    var match;
                    if (2 === state) {
                        if (!responseHeaders) for (responseHeaders = {}; match = rheaders.exec(responseHeadersString); ) responseHeaders[match[1].toLowerCase()] = match[2];
                        match = responseHeaders[key.toLowerCase()];
                    }
                    return match === undefined ? null : match;
                },
                overrideMimeType: function(type) {
                    return state || (s.mimeType = type), this;
                },
                abort: function(statusText) {
                    return statusText = statusText || strAbort, transport && transport.abort(statusText), 
                    done(0, statusText), this;
                }
            };
            if (deferred.promise(jqXHR), jqXHR.success = jqXHR.done, jqXHR.error = jqXHR.fail, 
            jqXHR.complete = completeDeferred.add, jqXHR.statusCode = function(map) {
                if (map) {
                    var tmp;
                    if (2 > state) for (tmp in map) statusCode[tmp] = [ statusCode[tmp], map[tmp] ]; else tmp = map[jqXHR.status], 
                    jqXHR.always(tmp);
                }
                return this;
            }, s.url = ((url || s.url) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//"), 
            s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().split(core_rspace), null == s.crossDomain && (parts = rurl.exec(s.url.toLowerCase()), 
            s.crossDomain = !(!parts || parts[1] === ajaxLocParts[1] && parts[2] === ajaxLocParts[2] && (parts[3] || ("http:" === parts[1] ? 80 : 443)) == (ajaxLocParts[3] || ("http:" === ajaxLocParts[1] ? 80 : 443)))), 
            s.data && s.processData && "string" != typeof s.data && (s.data = jQuery.param(s.data, s.traditional)), 
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR), 2 === state) return jqXHR;
            if (fireGlobals = s.global, s.type = s.type.toUpperCase(), s.hasContent = !rnoContent.test(s.type), 
            fireGlobals && 0 === jQuery.active++ && jQuery.event.trigger("ajaxStart"), !s.hasContent && (s.data && (s.url += (rquery.test(s.url) ? "&" : "?") + s.data, 
            delete s.data), ifModifiedKey = s.url, s.cache === !1)) {
                var ts = jQuery.now(), ret = s.url.replace(rts, "$1_=" + ts);
                s.url = ret + (ret === s.url ? (rquery.test(s.url) ? "&" : "?") + "_=" + ts : "");
            }
            (s.data && s.hasContent && s.contentType !== !1 || options.contentType) && jqXHR.setRequestHeader("Content-Type", s.contentType), 
            s.ifModified && (ifModifiedKey = ifModifiedKey || s.url, jQuery.lastModified[ifModifiedKey] && jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[ifModifiedKey]), 
            jQuery.etag[ifModifiedKey] && jqXHR.setRequestHeader("If-None-Match", jQuery.etag[ifModifiedKey])), 
            jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + ("*" !== s.dataTypes[0] ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
            for (i in s.headers) jqXHR.setRequestHeader(i, s.headers[i]);
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === !1 || 2 === state)) return jqXHR.abort();
            strAbort = "abort";
            for (i in {
                success: 1,
                error: 1,
                complete: 1
            }) jqXHR[i](s[i]);
            if (transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR)) {
                jqXHR.readyState = 1, fireGlobals && globalEventContext.trigger("ajaxSend", [ jqXHR, s ]), 
                s.async && s.timeout > 0 && (timeoutTimer = setTimeout(function() {
                    jqXHR.abort("timeout");
                }, s.timeout));
                try {
                    state = 1, transport.send(requestHeaders, done);
                } catch (e) {
                    if (!(2 > state)) throw e;
                    done(-1, e);
                }
            } else done(-1, "No Transport");
            return jqXHR;
        },
        active: 0,
        lastModified: {},
        etag: {}
    });
    var oldCallbacks = [], rquestion = /\?/, rjsonp = /(=)\?(?=&|$)|\?\?/, nonce = jQuery.now();
    jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
            return this[callback] = !0, callback;
        }
    }), jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName, overwritten, responseContainer, data = s.data, url = s.url, hasCallback = s.jsonp !== !1, replaceInUrl = hasCallback && rjsonp.test(url), replaceInData = hasCallback && !replaceInUrl && "string" == typeof data && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(data);
        return "jsonp" === s.dataTypes[0] || replaceInUrl || replaceInData ? (callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback, 
        overwritten = window[callbackName], replaceInUrl ? s.url = url.replace(rjsonp, "$1" + callbackName) : replaceInData ? s.data = data.replace(rjsonp, "$1" + callbackName) : hasCallback && (s.url += (rquestion.test(url) ? "&" : "?") + s.jsonp + "=" + callbackName), 
        s.converters["script json"] = function() {
            return responseContainer || jQuery.error(callbackName + " was not called"), responseContainer[0];
        }, s.dataTypes[0] = "json", window[callbackName] = function() {
            responseContainer = arguments;
        }, jqXHR.always(function() {
            window[callbackName] = overwritten, s[callbackName] && (s.jsonpCallback = originalSettings.jsonpCallback, 
            oldCallbacks.push(callbackName)), responseContainer && jQuery.isFunction(overwritten) && overwritten(responseContainer[0]), 
            responseContainer = overwritten = undefined;
        }), "script") : void 0;
    }), jQuery.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /javascript|ecmascript/
        },
        converters: {
            "text script": function(text) {
                return jQuery.globalEval(text), text;
            }
        }
    }), jQuery.ajaxPrefilter("script", function(s) {
        s.cache === undefined && (s.cache = !1), s.crossDomain && (s.type = "GET", s.global = !1);
    }), jQuery.ajaxTransport("script", function(s) {
        if (s.crossDomain) {
            var script, head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            return {
                send: function(_, callback) {
                    script = document.createElement("script"), script.async = "async", s.scriptCharset && (script.charset = s.scriptCharset), 
                    script.src = s.url, script.onload = script.onreadystatechange = function(_, isAbort) {
                        (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) && (script.onload = script.onreadystatechange = null, 
                        head && script.parentNode && head.removeChild(script), script = undefined, isAbort || callback(200, "success"));
                    }, head.insertBefore(script, head.firstChild);
                },
                abort: function() {
                    script && script.onload(0, 1);
                }
            };
        }
    });
    var xhrCallbacks, xhrOnUnloadAbort = window.ActiveXObject ? function() {
        for (var key in xhrCallbacks) xhrCallbacks[key](0, 1);
    } : !1, xhrId = 0;
    jQuery.ajaxSettings.xhr = window.ActiveXObject ? function() {
        return !this.isLocal && createStandardXHR() || createActiveXHR();
    } : createStandardXHR, function(xhr) {
        jQuery.extend(jQuery.support, {
            ajax: !!xhr,
            cors: !!xhr && "withCredentials" in xhr
        });
    }(jQuery.ajaxSettings.xhr()), jQuery.support.ajax && jQuery.ajaxTransport(function(s) {
        if (!s.crossDomain || jQuery.support.cors) {
            var callback;
            return {
                send: function(headers, complete) {
                    var handle, i, xhr = s.xhr();
                    if (s.username ? xhr.open(s.type, s.url, s.async, s.username, s.password) : xhr.open(s.type, s.url, s.async), 
                    s.xhrFields) for (i in s.xhrFields) xhr[i] = s.xhrFields[i];
                    s.mimeType && xhr.overrideMimeType && xhr.overrideMimeType(s.mimeType), s.crossDomain || headers["X-Requested-With"] || (headers["X-Requested-With"] = "XMLHttpRequest");
                    try {
                        for (i in headers) xhr.setRequestHeader(i, headers[i]);
                    } catch (_) {}
                    xhr.send(s.hasContent && s.data || null), callback = function(_, isAbort) {
                        var status, statusText, responseHeaders, responses, xml;
                        try {
                            if (callback && (isAbort || 4 === xhr.readyState)) if (callback = undefined, handle && (xhr.onreadystatechange = jQuery.noop, 
                            xhrOnUnloadAbort && delete xhrCallbacks[handle]), isAbort) 4 !== xhr.readyState && xhr.abort(); else {
                                status = xhr.status, responseHeaders = xhr.getAllResponseHeaders(), responses = {}, 
                                xml = xhr.responseXML, xml && xml.documentElement && (responses.xml = xml);
                                try {
                                    responses.text = xhr.responseText;
                                } catch (e) {}
                                try {
                                    statusText = xhr.statusText;
                                } catch (e) {
                                    statusText = "";
                                }
                                status || !s.isLocal || s.crossDomain ? 1223 === status && (status = 204) : status = responses.text ? 200 : 404;
                            }
                        } catch (firefoxAccessException) {
                            isAbort || complete(-1, firefoxAccessException);
                        }
                        responses && complete(status, statusText, responses, responseHeaders);
                    }, s.async ? 4 === xhr.readyState ? setTimeout(callback, 0) : (handle = ++xhrId, 
                    xhrOnUnloadAbort && (xhrCallbacks || (xhrCallbacks = {}, jQuery(window).unload(xhrOnUnloadAbort)), 
                    xhrCallbacks[handle] = callback), xhr.onreadystatechange = callback) : callback();
                },
                abort: function() {
                    callback && callback(0, 1);
                }
            };
        }
    });
    var fxNow, timerId, rfxtypes = /^(?:toggle|show|hide)$/, rfxnum = new RegExp("^(?:([-+])=|)(" + core_pnum + ")([a-z%]*)$", "i"), rrun = /queueHooks$/, animationPrefilters = [ defaultPrefilter ], tweeners = {
        "*": [ function(prop, value) {
            var end, unit, tween = this.createTween(prop, value), parts = rfxnum.exec(value), target = tween.cur(), start = +target || 0, scale = 1, maxIterations = 20;
            if (parts) {
                if (end = +parts[2], unit = parts[3] || (jQuery.cssNumber[prop] ? "" : "px"), "px" !== unit && start) {
                    start = jQuery.css(tween.elem, prop, !0) || end || 1;
                    do scale = scale || ".5", start /= scale, jQuery.style(tween.elem, prop, start + unit); while (scale !== (scale = tween.cur() / target) && 1 !== scale && --maxIterations);
                }
                tween.unit = unit, tween.start = start, tween.end = parts[1] ? start + (parts[1] + 1) * end : end;
            }
            return tween;
        } ]
    };
    jQuery.Animation = jQuery.extend(Animation, {
        tweener: function(props, callback) {
            jQuery.isFunction(props) ? (callback = props, props = [ "*" ]) : props = props.split(" ");
            for (var prop, index = 0, length = props.length; length > index; index++) prop = props[index], 
            tweeners[prop] = tweeners[prop] || [], tweeners[prop].unshift(callback);
        },
        prefilter: function(callback, prepend) {
            prepend ? animationPrefilters.unshift(callback) : animationPrefilters.push(callback);
        }
    }), jQuery.Tween = Tween, Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem, this.prop = prop, this.easing = easing || "swing", this.options = options, 
            this.start = this.now = this.cur(), this.end = end, this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            return this.pos = eased = this.options.duration ? jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration) : percent, 
            this.now = (this.end - this.start) * eased + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), 
            hooks && hooks.set ? hooks.set(this) : Tween.propHooks._default.set(this), this;
        }
    }, Tween.prototype.init.prototype = Tween.prototype, Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result;
                return null == tween.elem[tween.prop] || tween.elem.style && null != tween.elem.style[tween.prop] ? (result = jQuery.css(tween.elem, tween.prop, !1, ""), 
                result && "auto" !== result ? result : 0) : tween.elem[tween.prop];
            },
            set: function(tween) {
                jQuery.fx.step[tween.prop] ? jQuery.fx.step[tween.prop](tween) : tween.elem.style && (null != tween.elem.style[jQuery.cssProps[tween.prop]] || jQuery.cssHooks[tween.prop]) ? jQuery.style(tween.elem, tween.prop, tween.now + tween.unit) : tween.elem[tween.prop] = tween.now;
            }
        }
    }, Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
            tween.elem.nodeType && tween.elem.parentNode && (tween.elem[tween.prop] = tween.now);
        }
    }, jQuery.each([ "toggle", "show", "hide" ], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
            return null == speed || "boolean" == typeof speed || !i && jQuery.isFunction(speed) && jQuery.isFunction(easing) ? cssFn.apply(this, arguments) : this.animate(genFx(name, !0), speed, easing, callback);
        };
    }), jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHidden).css("opacity", 0).show().end().animate({
                opacity: to
            }, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function() {
                var anim = Animation(this, jQuery.extend({}, prop), optall);
                empty && anim.stop(!0);
            };
            return empty || optall.queue === !1 ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
        },
        stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
                var stop = hooks.stop;
                delete hooks.stop, stop(gotoEnd);
            };
            return "string" != typeof type && (gotoEnd = clearQueue, clearQueue = type, type = undefined), 
            clearQueue && type !== !1 && this.queue(type || "fx", []), this.each(function() {
                var dequeue = !0, index = null != type && type + "queueHooks", timers = jQuery.timers, data = jQuery._data(this);
                if (index) data[index] && data[index].stop && stopQueue(data[index]); else for (index in data) data[index] && data[index].stop && rrun.test(index) && stopQueue(data[index]);
                for (index = timers.length; index--; ) timers[index].elem !== this || null != type && timers[index].queue !== type || (timers[index].anim.stop(gotoEnd), 
                dequeue = !1, timers.splice(index, 1));
                (dequeue || !gotoEnd) && jQuery.dequeue(this, type);
            });
        }
    }), jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
        };
    }), jQuery.speed = function(speed, easing, fn) {
        var opt = speed && "object" == typeof speed ? jQuery.extend({}, speed) : {
            complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };
        return opt.duration = jQuery.fx.off ? 0 : "number" == typeof opt.duration ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default, 
        (null == opt.queue || opt.queue === !0) && (opt.queue = "fx"), opt.old = opt.complete, 
        opt.complete = function() {
            jQuery.isFunction(opt.old) && opt.old.call(this), opt.queue && jQuery.dequeue(this, opt.queue);
        }, opt;
    }, jQuery.easing = {
        linear: function(p) {
            return p;
        },
        swing: function(p) {
            return .5 - Math.cos(p * Math.PI) / 2;
        }
    }, jQuery.timers = [], jQuery.fx = Tween.prototype.init, jQuery.fx.tick = function() {
        var timer, timers = jQuery.timers, i = 0;
        for (fxNow = jQuery.now(); i < timers.length; i++) timer = timers[i], timer() || timers[i] !== timer || timers.splice(i--, 1);
        timers.length || jQuery.fx.stop(), fxNow = undefined;
    }, jQuery.fx.timer = function(timer) {
        timer() && jQuery.timers.push(timer) && !timerId && (timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval));
    }, jQuery.fx.interval = 13, jQuery.fx.stop = function() {
        clearInterval(timerId), timerId = null;
    }, jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    }, jQuery.fx.step = {}, jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
            return elem === fn.elem;
        }).length;
    });
    var rroot = /^(?:body|html)$/i;
    jQuery.fn.offset = function(options) {
        if (arguments.length) return options === undefined ? this : this.each(function(i) {
            jQuery.offset.setOffset(this, options, i);
        });
        var docElem, body, win, clientTop, clientLeft, scrollTop, scrollLeft, box = {
            top: 0,
            left: 0
        }, elem = this[0], doc = elem && elem.ownerDocument;
        return doc ? (body = doc.body) === elem ? jQuery.offset.bodyOffset(elem) : (docElem = doc.documentElement, 
        jQuery.contains(docElem, elem) ? ("undefined" != typeof elem.getBoundingClientRect && (box = elem.getBoundingClientRect()), 
        win = getWindow(doc), clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0, 
        scrollTop = win.pageYOffset || docElem.scrollTop, scrollLeft = win.pageXOffset || docElem.scrollLeft, 
        {
            top: box.top + scrollTop - clientTop,
            left: box.left + scrollLeft - clientLeft
        }) : box) : void 0;
    }, jQuery.offset = {
        bodyOffset: function(body) {
            var top = body.offsetTop, left = body.offsetLeft;
            return jQuery.support.doesNotIncludeMarginInBodyOffset && (top += parseFloat(jQuery.css(body, "marginTop")) || 0, 
            left += parseFloat(jQuery.css(body, "marginLeft")) || 0), {
                top: top,
                left: left
            };
        },
        setOffset: function(elem, options, i) {
            var position = jQuery.css(elem, "position");
            "static" === position && (elem.style.position = "relative");
            var curTop, curLeft, curElem = jQuery(elem), curOffset = curElem.offset(), curCSSTop = jQuery.css(elem, "top"), curCSSLeft = jQuery.css(elem, "left"), calculatePosition = ("absolute" === position || "fixed" === position) && jQuery.inArray("auto", [ curCSSTop, curCSSLeft ]) > -1, props = {}, curPosition = {};
            calculatePosition ? (curPosition = curElem.position(), curTop = curPosition.top, 
            curLeft = curPosition.left) : (curTop = parseFloat(curCSSTop) || 0, curLeft = parseFloat(curCSSLeft) || 0), 
            jQuery.isFunction(options) && (options = options.call(elem, i, curOffset)), null != options.top && (props.top = options.top - curOffset.top + curTop), 
            null != options.left && (props.left = options.left - curOffset.left + curLeft), 
            "using" in options ? options.using.call(elem, props) : curElem.css(props);
        }
    }, jQuery.fn.extend({
        position: function() {
            if (this[0]) {
                var elem = this[0], offsetParent = this.offsetParent(), offset = this.offset(), parentOffset = rroot.test(offsetParent[0].nodeName) ? {
                    top: 0,
                    left: 0
                } : offsetParent.offset();
                return offset.top -= parseFloat(jQuery.css(elem, "marginTop")) || 0, offset.left -= parseFloat(jQuery.css(elem, "marginLeft")) || 0, 
                parentOffset.top += parseFloat(jQuery.css(offsetParent[0], "borderTopWidth")) || 0, 
                parentOffset.left += parseFloat(jQuery.css(offsetParent[0], "borderLeftWidth")) || 0, 
                {
                    top: offset.top - parentOffset.top,
                    left: offset.left - parentOffset.left
                };
            }
        },
        offsetParent: function() {
            return this.map(function() {
                for (var offsetParent = this.offsetParent || document.body; offsetParent && !rroot.test(offsetParent.nodeName) && "static" === jQuery.css(offsetParent, "position"); ) offsetParent = offsetParent.offsetParent;
                return offsetParent || document.body;
            });
        }
    }), jQuery.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        var top = /Y/.test(prop);
        jQuery.fn[method] = function(val) {
            return jQuery.access(this, function(elem, method, val) {
                var win = getWindow(elem);
                return val === undefined ? win ? prop in win ? win[prop] : win.document.documentElement[method] : elem[method] : void (win ? win.scrollTo(top ? jQuery(win).scrollLeft() : val, top ? val : jQuery(win).scrollTop()) : elem[method] = val);
            }, method, val, arguments.length, null);
        };
    }), jQuery.each({
        Height: "height",
        Width: "width"
    }, function(name, type) {
        jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
        }, function(defaultExtra, funcName) {
            jQuery.fn[funcName] = function(margin, value) {
                var chainable = arguments.length && (defaultExtra || "boolean" != typeof margin), extra = defaultExtra || (margin === !0 || value === !0 ? "margin" : "border");
                return jQuery.access(this, function(elem, type, value) {
                    var doc;
                    return jQuery.isWindow(elem) ? elem.document.documentElement["client" + name] : 9 === elem.nodeType ? (doc = elem.documentElement, 
                    Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name])) : value === undefined ? jQuery.css(elem, type, value, extra) : jQuery.style(elem, type, value, extra);
                }, type, chainable ? margin : undefined, chainable, null);
            };
        });
    }), window.jQuery = window.$ = jQuery, "function" == typeof define && define.amd && define.amd.jQuery && define("jquery", [], function() {
        return jQuery;
    });
}(window);

var BEMHTML = function() {
    var cache, exports = {}, xjst = function(exports) {
        function apply() {
            return applyc(this);
        }
        function applyc(__$ctx) {
            function _$6follow() {
                if ("no-follow" === this.ctx.link) return void 0;
                var data = this._links[this.ctx.link];
                return __$ctx._localLog ? (__r0 = this.ctx, this.ctx = data, __r1 = applyc(__$ctx), 
                this.ctx = __r0, __r1) : (__r2 = this.ctx, this.ctx = data, __r3 = applyc(__$ctx), 
                this.ctx = __r2, __r3);
            }
            function _$5setProperty(obj, key, value) {
                if (0 === key.length) return void 0;
                if (Array.isArray(value)) {
                    for (var target = obj, i = 0; i < value.length - 1; i++) target = target[value[i]];
                    value = target[value[i]];
                }
                for (var previous, host = obj, i = 0; i < key.length - 1; i++) host = host[key[i]];
                return previous = host[key[i]], host[key[i]] = value, previous;
            }
            function _$4visitedKey(block, elem) {
                return (block || "") + "__" + (elem || "");
            }
            var __r0, __r1, __r2, __r3, __r4, __r5, __r6, __r7, __r8, __r9, __r10, __r11, __r12, __r13, __r14, __r15, __r16, __r17, __r18, __r19, __r20, __r21, __r22, __r23, __r24, __r25, __r26, __r27, __r28, __r29, __r30, __r31, __r36, __r37, __r38, __r39, __r40, __r41, __r42, __r43, __r44, __r45, __r46, __r47;
            if (0 != !!__$ctx.elem || "button" !== __$ctx.block || "default" !== __$ctx._mode || 0 != !!(__$ctx.ctx.mods || {}).theme) {
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && "content" === __$ctx._mode) return {
                    elem: "text",
                    tag: "span",
                    content: __$ctx.ctx.content
                };
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && "attrs" === __$ctx._mode && 0 == !(__$ctx.__$anflg5 !== !0) && 0 == !__$ctx.ctx.url) {
                    var _$25ctx = __$ctx.ctx, _$25p = __$ctx._localLog ? (__$ctx._localLog.push([ [ "__$anflg5" ], !0 ]), 
                    __r0 = __$ctx.__$anflg5, __$ctx.__$anflg5 = !0, __r1 = applyc(__$ctx), __$ctx.__$anflg5 = __r0, 
                    __bv43 = __r1, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv43) : (__r2 = __$ctx.__$anflg5, 
                    __$ctx.__$anflg5 = !0, __r3 = applyc(__$ctx), __$ctx.__$anflg5 = __r2, __r3), _$25a = {
                        href: _$25ctx.url
                    };
                    return _$25ctx.target && (_$25a.target = _$25ctx.target), __$ctx.mods.disabled && (_$25a["aria-disabled"] = !0), 
                    __$ctx._.extend(_$25p, _$25a);
                }
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && "attrs" === __$ctx._mode && 0 == !(__$ctx.__$anflg4 !== !0) && 0 == !!__$ctx.ctx.url) {
                    for (var _$24i, _$24ctx = __$ctx.ctx, _$24p = __$ctx._localLog ? (__$ctx._localLog.push([ [ "__$anflg4" ], !0 ]), 
                    __r0 = __$ctx.__$anflg4, __$ctx.__$anflg4 = !0, __r1 = applyc(__$ctx), __$ctx.__$anflg4 = __r0, 
                    __bv42 = __r1, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv42) : (__r2 = __$ctx.__$anflg4, 
                    __$ctx.__$anflg4 = !0, __r3 = applyc(__$ctx), __$ctx.__$anflg4 = __r2, __r3), _$24a = {
                        type: _$24ctx.type ? _$24ctx.type : "button"
                    }, _$24props = [ "name", "value" ]; _$24i = _$24props.shift(); ) _$24ctx[_$24i] && (_$24a[_$24i] = _$24ctx[_$24i]);
                    return __$ctx.mods.disabled && (_$24a.disabled = "disabled"), __$ctx._.extend(_$24p, _$24a);
                }
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && "attrs" === __$ctx._mode) {
                    var _$23ctx = __$ctx.ctx, _$23a = {
                        role: "button"
                    };
                    return _$23ctx.tabindex && (_$23a.tabindex = _$23ctx.tabindex), _$23a;
                }
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && "js" === __$ctx._mode) return !0;
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && 0 == !__$ctx.ctx.url && "tag" === __$ctx._mode) return "a";
                if (0 == !!__$ctx.elem && "button" === __$ctx.block && "tag" === __$ctx._mode) return "button";
                if ("special-message" === __$ctx.block && "desc-item" === __$ctx.elem && "tag" === __$ctx._mode) return "p";
                if ("special-message" === __$ctx.block && "desc-centered" === __$ctx.elem && "tag" === __$ctx._mode) return "span";
                if (0 == !!__$ctx.elem && "special-message" === __$ctx.block && "content" === __$ctx._mode) return {
                    elem: "inner",
                    content: __$ctx.ctx.content
                };
                if (0 == !!__$ctx.elem && "wrap" === __$ctx.block && "js" === __$ctx._mode) return !0;
                if (0 == !!__$ctx.elem && "spin" === __$ctx.block && 0 == !(__$ctx.__$anflg3 !== !0) && "default" === __$ctx._mode) {
                    var _$1vmods = __$ctx.ctx.mods || {};
                    return _$1vmods.theme || (_$1vmods.theme = "gray-32"), __$ctx.ctx.mods = _$1vmods, 
                    __$ctx.ctx.content = {
                        block: "image",
                        mix: [ {
                            block: "spin",
                            elem: "icon"
                        } ]
                    }, __$ctx._localLog ? (__$ctx._localLog.push([ [ "__$anflg3" ], !0 ]), __r0 = __$ctx.__$anflg3, 
                    __$ctx.__$anflg3 = !0, __r7 = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "" ]), 
                    __r1 = __$ctx.ctx, __$ctx.ctx = __$ctx.ctx, __r2 = __$ctx._mode, __$ctx._mode = "", 
                    __r3 = applyc(__$ctx), __$ctx.ctx = __r1, __$ctx._mode = __r2, __bv40 = __r3, __$ctx._localLog = __$ctx._localLog.slice(0, -1), 
                    __bv40) : (__r4 = __$ctx.ctx, __$ctx.ctx = __$ctx.ctx, __r5 = __$ctx._mode, __$ctx._mode = "", 
                    __r6 = applyc(__$ctx), __$ctx.ctx = __r4, __$ctx._mode = __r5, __r6), __$ctx.__$anflg3 = __r0, 
                    __bv41 = __r7, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv41) : (__r8 = __$ctx.__$anflg3, 
                    __$ctx.__$anflg3 = !0, __r15 = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "" ]), 
                    __r9 = __$ctx.ctx, __$ctx.ctx = __$ctx.ctx, __r10 = __$ctx._mode, __$ctx._mode = "", 
                    __r11 = applyc(__$ctx), __$ctx.ctx = __r9, __$ctx._mode = __r10, __bv40 = __r11, 
                    __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv40) : (__r12 = __$ctx.ctx, 
                    __$ctx.ctx = __$ctx.ctx, __r13 = __$ctx._mode, __$ctx._mode = "", __r14 = applyc(__$ctx), 
                    __$ctx.ctx = __r12, __$ctx._mode = __r13, __r14), __$ctx.__$anflg3 = __r8, __r15);
                }
                if (0 == !!__$ctx.elem && "link" === __$ctx.block && "tag" === __$ctx._mode) return __$ctx.ctx.tag ? __$ctx.ctx.tag : "a";
                if ("link" === __$ctx.block && "inner" === __$ctx.elem && "tag" === __$ctx._mode) return "span";
                if (0 == !!__$ctx.elem && "link" === __$ctx.block && "attrs" === __$ctx._mode) {
                    var _$1sctx = __$ctx.ctx, _$1sa = {
                        href: __$ctx._.isSimple(_$1sctx.url) ? _$1sctx.url : (p = [], __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "" ], [ [ "_buf" ], p ]), 
                        __r0 = __$ctx._mode, __$ctx._mode = "", __r1 = __$ctx._buf, __$ctx._buf = p, __r2 = __$ctx.ctx, 
                        __$ctx.ctx = _$1sctx.url, __r3 = applyc(__$ctx), __$ctx._mode = __r0, __$ctx._buf = __r1, 
                        __$ctx.ctx = __r2, __bv39 = __r3, __$ctx._localLog = __$ctx._localLog.slice(0, -2), 
                        __bv39) : (__r4 = __$ctx._mode, __$ctx._mode = "", __r5 = __$ctx._buf, __$ctx._buf = p, 
                        __r6 = __$ctx.ctx, __$ctx.ctx = _$1sctx.url, __r7 = applyc(__$ctx), __$ctx._mode = __r4, 
                        __$ctx._buf = __r5, __$ctx.ctx = __r6, __r7), p.join(""))
                    };
                    return [ "title", "target", "id" ].forEach(function(param) {
                        _$1sctx[param] && (_$1sa[param] = _$1sctx[param]);
                    }), _$1sa;
                }
                if (0 == !!__$ctx.elem && "link" === __$ctx.block && "tag" === __$ctx._mode) return __$ctx.ctx.url ? "a" : "span";
                if ("b-page" === __$ctx.block && "js" === __$ctx.elem && "attrs" === __$ctx._mode && 0 == !__$ctx.ctx.url) return {
                    src: __$ctx.ctx.url
                };
                if ("b-page" === __$ctx.block && "js" === __$ctx.elem && "tag" === __$ctx._mode) return "script";
                if ("b-page" === __$ctx.block && "js" === __$ctx.elem && "bem" === __$ctx._mode) return !1;
                if ("b-page" === __$ctx.block && "css" === __$ctx.elem && 0 == !__$ctx.ctx.url && "attrs" === __$ctx._mode) return {
                    rel: "stylesheet",
                    href: __$ctx.ctx.url
                };
                if ("b-page" === __$ctx.block && "css" === __$ctx.elem && 0 == !__$ctx.ctx.url && "tag" === __$ctx._mode) return "link";
                if ("b-page" !== __$ctx.block || "css" !== __$ctx.elem || "default" !== __$ctx._mode || 0 != !__$ctx.ctx.hasOwnProperty("ie") || 0 != !!__$ctx.ctx._ieCommented) {
                    if ("b-page" === __$ctx.block && "css" === __$ctx.elem && "tag" === __$ctx._mode) return "style";
                    if ("b-page" === __$ctx.block && "css" === __$ctx.elem && "bem" === __$ctx._mode) return !1;
                    if ("b-page" === __$ctx.block && "mix" === __$ctx._mode && 0 == !!__$ctx.elem && 0 == !!__$ctx.ctx._iGlobal) {
                        var _$1imix = __$ctx._localLog ? (__r0 = __$ctx.ctx, __r1 = __r0._iGlobal, __r0._iGlobal = !0, 
                        __r2 = applyc(__$ctx), __r0._iGlobal = __r1, __r2) : (__r3 = __$ctx.ctx, __r4 = __r3._iGlobal, 
                        __r3._iGlobal = !0, __r5 = applyc(__$ctx), __r3._iGlobal = __r4, __r5), _$1ijsParams = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "js-params" ]), 
                        __r6 = __$ctx._mode, __$ctx._mode = "js-params", __r7 = applyc(__$ctx), __$ctx._mode = __r6, 
                        __bv35 = __r7, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv35) : (__r8 = __$ctx._mode, 
                        __$ctx._mode = "js-params", __r9 = applyc(__$ctx), __$ctx._mode = __r8, __r9);
                        return _$1imix ? _$1imix.push(_$1ijsParams) : _$1imix = [ _$1ijsParams ], _$1imix;
                    }
                    if ("b-page" === __$ctx.block && "body" === __$ctx.elem && "tag" === __$ctx._mode) return "";
                    if (0 == !!__$ctx.elem && "b-page" === __$ctx.block && "content" === __$ctx._mode) return {
                        elem: "body",
                        content: __$ctx.ctx.content
                    };
                    if ("b-page" === __$ctx.block && "favicon" === __$ctx.elem && "attrs" === __$ctx._mode) return {
                        rel: "shortcut icon",
                        href: __$ctx.ctx.url
                    };
                    if ("b-page" === __$ctx.block && "favicon" === __$ctx.elem && "tag" === __$ctx._mode) return "link";
                    if ("b-page" === __$ctx.block && "favicon" === __$ctx.elem && "bem" === __$ctx._mode) return !1;
                    if ("b-page" === __$ctx.block && "meta" === __$ctx.elem && "attrs" === __$ctx._mode) return __$ctx.ctx.attrs;
                    if ("b-page" === __$ctx.block && "meta" === __$ctx.elem && "tag" === __$ctx._mode) return "meta";
                    if ("b-page" === __$ctx.block && "meta" === __$ctx.elem && "bem" === __$ctx._mode) return !1;
                    if ("b-page" === __$ctx.block && "head" === __$ctx.elem && "tag" === __$ctx._mode) return "head";
                    if ("b-page" === __$ctx.block && "head" === __$ctx.elem && "bem" === __$ctx._mode) return !1;
                    if ("b-page" === __$ctx.block && "root" === __$ctx.elem && "cls" === __$ctx._mode) return "i-ua_js_no i-ua_css_standard";
                    if ("b-page" === __$ctx.block && "root" === __$ctx.elem && "tag" === __$ctx._mode) return "html";
                    if ("b-page" === __$ctx.block && "root" === __$ctx.elem && "bem" === __$ctx._mode) return !1;
                    if (0 == !!__$ctx.elem && "b-page" === __$ctx.block && "mix" === __$ctx._mode) return [ {
                        elem: "body"
                    } ];
                    if (0 == !!__$ctx.elem && "b-page" === __$ctx.block && "tag" === __$ctx._mode) return "body";
                    if (0 != !!__$ctx.elem || "b-page" !== __$ctx.block || 0 != !(__$ctx.__$anflg2 !== !0) || "default" !== __$ctx._mode) {
                        if (0 == !!__$ctx.elem && "b-page" === __$ctx.block && "xUACompatible" === __$ctx._mode) return __$ctx.ctx["x-ua-compatible"] === !1 ? !1 : {
                            tag: "meta",
                            attrs: {
                                "http-equiv": "X-UA-Compatible",
                                content: __$ctx.ctx["x-ua-compatible"] || "IE=edge"
                            }
                        };
                        if (0 == !!__$ctx.elem && "b-page" === __$ctx.block && "doctype" === __$ctx._mode) return __$ctx.ctx.doctype || "<!DOCTYPE html>";
                        if ("i-bem" === __$ctx.block && "i18n" === __$ctx.elem && "default" === __$ctx._mode) {
                            if (!__$ctx.ctx) return "";
                            var _$zctx = __$ctx.ctx, _$zkeyset = _$zctx.keyset, _$zkey = _$zctx.key, _$zparams = _$zctx.params || {};
                            if (!_$zkeyset && !_$zkey) return "";
                            if (_$zctx.content) {
                                var _$zcnt;
                                _$zparams.content = (_$zcnt = [], __$ctx._localLog ? (__$ctx._localLog.push([ [ "_buf" ], _$zcnt ], [ [ "_mode" ], "" ]), 
                                __r0 = __$ctx._buf, __$ctx._buf = _$zcnt, __r1 = __$ctx._mode, __$ctx._mode = "", 
                                __r2 = __$ctx.ctx, __$ctx.ctx = _$zctx.content, __r3 = applyc(__$ctx), __$ctx._buf = __r0, 
                                __$ctx._mode = __r1, __$ctx.ctx = __r2, __bv30 = __r3, __$ctx._localLog = __$ctx._localLog.slice(0, -2), 
                                __bv30) : (__r4 = __$ctx._buf, __$ctx._buf = _$zcnt, __r5 = __$ctx._mode, __$ctx._mode = "", 
                                __r6 = __$ctx.ctx, __$ctx.ctx = _$zctx.content, __r7 = applyc(__$ctx), __$ctx._buf = __r4, 
                                __$ctx._mode = __r5, __$ctx.ctx = __r6, __r7), _$zcnt.join(""));
                            }
                            return void __$ctx._buf.push(BEM.I18N(_$zkeyset, _$zkey, _$zparams));
                        }
                        if ("i-jquery" === __$ctx.block && "core" === __$ctx.elem && "default" === __$ctx._mode) return __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "" ]), 
                        __r0 = __$ctx._mode, __$ctx._mode = "", __r1 = __$ctx.ctx, __$ctx.ctx = {
                            block: "b-page",
                            elem: "js",
                            url: "//yandex.st/jquery/1.7.2/jquery.min.js"
                        }, __r2 = applyc(__$ctx), __$ctx._mode = __r0, __$ctx.ctx = __r1, __bv29 = __r2, 
                        __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv29) : (__r3 = __$ctx._mode, 
                        __$ctx._mode = "", __r4 = __$ctx.ctx, __$ctx.ctx = {
                            block: "b-page",
                            elem: "js",
                            url: "//yandex.st/jquery/1.7.2/jquery.min.js"
                        }, __r5 = applyc(__$ctx), __$ctx._mode = __r3, __$ctx.ctx = __r4, __r5);
                        if (0 == !!__$ctx.elem && "i-ua" === __$ctx.block && 0 == !(__$ctx.__$anflg1 !== !0) && "content" === __$ctx._mode) {
                            var _$xc = __$ctx._localLog ? (__$ctx._localLog.push([ [ "__$anflg1" ], !0 ]), __r0 = __$ctx.__$anflg1, 
                            __$ctx.__$anflg1 = !0, __r1 = applyc(__$ctx), __$ctx.__$anflg1 = __r0, __bv28 = __r1, 
                            __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv28) : (__r2 = __$ctx.__$anflg1, 
                            __$ctx.__$anflg1 = !0, __r3 = applyc(__$ctx), __$ctx.__$anflg1 = __r2, __r3);
                            return _$xc += [ ";(function(d,e,c,r,n,w,v,f){", "e=d.documentElement;", 'c="className";', 'r="replace";', 'n="createElementNS";', 'f="firstChild";', 'w="http://www.w3.org/2000/svg";', 'e[c]+=" i-ua_svg_"+(!!d[n]&&!!d[n](w,"svg").createSVGRect?"yes":"no");', 'v=d.createElement("div");', 'v.innerHTML="<svg/>";', 'e[c]+=" i-ua_inlinesvg_"+((v[f]&&v[f].namespaceURI)==w?"yes":"no");', "})(document);" ].join("");
                        }
                        if (0 == !!__$ctx.elem && "i-ua" === __$ctx.block && "content" === __$ctx._mode) return [ ";(function(d,e,c,r){", "e=d.documentElement;", 'c="className";', 'r="replace";', 'e[c]=e[c][r]("i-ua_js_no","i-ua_js_yes");', 'if(d.compatMode!="CSS1Compat")', 'e[c]=e[c][r]("i-ua_css_standart","i-ua_css_quirks")', "})(document);" ].join("");
                        if (0 == !!__$ctx.elem && "i-ua" === __$ctx.block && "bem" === __$ctx._mode) return !1;
                        if (0 == !!__$ctx.elem && "i-ua" === __$ctx.block && "tag" === __$ctx._mode) return "script";
                        if (0 == !!__$ctx.elem && "b-page" === __$ctx.block && "js-params" === __$ctx._mode) {
                            var _$te, _$t_this = __$ctx["i-global"], _$tjs = {}, _$tblock = {
                                block: "i-global",
                                js: _$tjs
                            };
                            if (__$ctx._localLog) {
                                __$ctx._localLog.push([ [ "_mode" ], "public-params" ], [ [ "block" ], "i-global" ]);
                                var __r0 = __$ctx._mode;
                                __$ctx._mode = "public-params";
                                var __r1 = __$ctx.block;
                                __$ctx.block = "i-global";
                                for (_$te in _$t_this) _$t_this.hasOwnProperty(_$te) && (__$ctx._localLog ? (__$ctx._localLog.push([ [ "elem" ], _$te ]), 
                                __r2 = __$ctx.elem, __$ctx.elem = _$te, __r3 = applyc(__$ctx), __$ctx.elem = __r2, 
                                __bv26 = __r3, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv26) : (__r4 = __$ctx.elem, 
                                __$ctx.elem = _$te, __r5 = applyc(__$ctx), __$ctx.elem = __r4, __r5)) && (_$tjs[_$te] = _$t_this[_$te]);
                                __$ctx._mode = __r0, __$ctx.block = __r1, __$ctx._localLog = __$ctx._localLog.slice(0, -2);
                            } else {
                                var __r6 = __$ctx._mode;
                                __$ctx._mode = "public-params";
                                var __r7 = __$ctx.block;
                                __$ctx.block = "i-global";
                                for (_$te in _$t_this) _$t_this.hasOwnProperty(_$te) && (__$ctx._localLog ? (__$ctx._localLog.push([ [ "elem" ], _$te ]), 
                                __r8 = __$ctx.elem, __$ctx.elem = _$te, __r9 = applyc(__$ctx), __$ctx.elem = __r8, 
                                __bv26 = __r9, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv26) : (__r10 = __$ctx.elem, 
                                __$ctx.elem = _$te, __r11 = applyc(__$ctx), __$ctx.elem = __r10, __r11)) && (_$tjs[_$te] = _$t_this[_$te]);
                                __$ctx._mode = __r6, __$ctx.block = __r7;
                            }
                            return _$tblock;
                        }
                        if ("i-global" === __$ctx.block && "public-params" === __$ctx._mode && 0 == !__$ctx.elem) return {
                            id: 1,
                            lang: 1,
                            tld: 1,
                            "content-region": 1,
                            "user-region": 1,
                            login: 1,
                            displayName: 1,
                            index: 1,
                            yandexuid: 1,
                            "passport-host": 1,
                            "pass-host": 1,
                            "passport-msg": 1,
                            "static-host": 1,
                            "lego-static-host": 1,
                            "social-host": 1,
                            clck: 1,
                            "click-host": 1,
                            "export-host": 1,
                            "i-host": 1,
                            "social-retpath": 1,
                            "lego-path": 1,
                            sid: 1,
                            retpath: 1
                        }[__$ctx.elem] || !1;
                        if ("i-global" === __$ctx.block && "lego-static-host" === __$ctx.elem) return "//yandex.st/lego/2.10-114";
                        if ("i-global" === __$ctx.block && "export-host" === __$ctx.elem) return "//export.yandex.ru";
                        if ("i-global" === __$ctx.block && "social-host" === __$ctx.elem) return "//social.yandex.ru";
                        if ("i-global" === __$ctx.block && "pass-host" === __$ctx.elem) return "//pass.yandex.ru";
                        if ("i-global" === __$ctx.block && "passport-host" === __$ctx.elem) return "https://passport.yandex.ru";
                        if ("i-global" === __$ctx.block && "click-host" === __$ctx.elem) return "//clck.yandex.ru";
                        if ("i-global" === __$ctx.block && "content-region" === __$ctx.elem) return "ru";
                        if ("i-global" === __$ctx.block && "tld" === __$ctx.elem) return "ru";
                        if ("i-global" === __$ctx.block && "lang" === __$ctx.elem) return "ru";
                        if ("i-global" === __$ctx.block && 0 == !__$ctx.elem) return "";
                        if (0 != !!__$ctx.elem || "i-global" !== __$ctx.block || "default" !== __$ctx._mode) {
                            if (0 == !!__$ctx.elem && "i-global" === __$ctx.block && "env" === __$ctx._mode) return {};
                            if ("" === __$ctx._mode && 0 == !!__$ctx["i-global"]) {
                                var _$fe, _$fps = {}, _$fes = [ "lang", "tld", "content-region", "click-host", "passport-host", "pass-host", "social-host", "export-host", "login", "lego-static-host" ];
                                if (__$ctx._localLog) {
                                    __$ctx._localLog.push([ [ "_mode" ], "default" ], [ [ "block" ], "i-global" ]);
                                    var __r0 = __$ctx._mode;
                                    __$ctx._mode = "default";
                                    var __r1 = __$ctx.block;
                                    for (__$ctx.block = "i-global"; _$fe = _$fes.shift(); ) if (__$ctx._localLog) {
                                        __$ctx._localLog.push([ [ "elem" ], _$fe ]);
                                        var __r2 = __$ctx.elem;
                                        __$ctx.elem = _$fe, _$fps[_$fe] = applyc(__$ctx), __$ctx.elem = __r2, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                                    } else {
                                        var __r3 = __$ctx.elem;
                                        __$ctx.elem = _$fe, _$fps[_$fe] = applyc(__$ctx), __$ctx.elem = __r3;
                                    }
                                    __$ctx._mode = __r0, __$ctx.block = __r1, __$ctx._localLog = __$ctx._localLog.slice(0, -2);
                                } else {
                                    var __r4 = __$ctx._mode;
                                    __$ctx._mode = "default";
                                    var __r5 = __$ctx.block;
                                    for (__$ctx.block = "i-global"; _$fe = _$fes.shift(); ) if (__$ctx._localLog) {
                                        __$ctx._localLog.push([ [ "elem" ], _$fe ]);
                                        var __r6 = __$ctx.elem;
                                        __$ctx.elem = _$fe, _$fps[_$fe] = applyc(__$ctx), __$ctx.elem = __r6, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                                    } else {
                                        var __r7 = __$ctx.elem;
                                        __$ctx.elem = _$fe, _$fps[_$fe] = applyc(__$ctx), __$ctx.elem = __r7;
                                    }
                                    __$ctx._mode = __r4, __$ctx.block = __r5;
                                }
                                return __$ctx["i-global"] = __$ctx._.extend(_$fps, __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "env" ], [ [ "block" ], "i-global" ]), 
                                __r8 = __$ctx._mode, __$ctx._mode = "env", __r9 = __$ctx.block, __$ctx.block = "i-global", 
                                __r10 = applyc(__$ctx), __$ctx._mode = __r8, __$ctx.block = __r9, __bv25 = __r10, 
                                __$ctx._localLog = __$ctx._localLog.slice(0, -2), __bv25) : (__r11 = __$ctx._mode, 
                                __$ctx._mode = "env", __r12 = __$ctx.block, __$ctx.block = "i-global", __r13 = applyc(__$ctx), 
                                __$ctx._mode = __r11, __$ctx.block = __r12, __r13)), void applyc(__$ctx);
                            }
                            if ("content" === __$ctx._mode) return __$ctx.ctx.content;
                            if ("mix" === __$ctx._mode) return void 0;
                            if ("bem" === __$ctx._mode) return void 0;
                            if ("jsAttr" === __$ctx._mode) return void 0;
                            if ("js" === __$ctx._mode) return void 0;
                            if ("cls" === __$ctx._mode) return void 0;
                            if ("attrs" === __$ctx._mode) return void 0;
                            if ("tag" === __$ctx._mode) return void 0;
                            if (0 == !__$ctx.ctx && 0 == !!__$ctx._.isSimple(__$ctx.ctx) && 0 == !__$ctx.ctx.link) {
                                if (!cache || !__$ctx._cacheLog) return _$6follow.call(__$ctx);
                                var _$6contents = __$ctx._buf.slice(__$ctx._cachePos).join("");
                                __$ctx._cachePos = __$ctx._buf.length, __$ctx._cacheLog.push(_$6contents, {
                                    log: __$ctx._localLog.slice(),
                                    link: __$ctx.ctx.link
                                });
                                var _$6res = _$6follow.call(__$ctx);
                                return __$ctx._cachePos = __$ctx._buf.length, _$6res;
                            }
                            if (0 == !cache && 0 == !__$ctx.ctx && 0 == !__$ctx.ctx.cache) {
                                var _$5cached;
                                if (_$5cached = cache.get(__$ctx.ctx.cache)) {
                                    var _$5oldLinks = __$ctx._links;
                                    __$ctx.ctx.links && (__$ctx._links = __$ctx.ctx.links);
                                    for (var _$5i = 0; _$5i < _$5cached.log.length; _$5i++) if ("string" != typeof _$5cached.log[_$5i]) {
                                        var _$5reverseLog, _$5log = _$5cached.log[_$5i];
                                        if (_$5reverseLog = _$5log.log.map(function(entry) {
                                            return {
                                                key: entry[0],
                                                value: _$5setProperty(this, entry[0], entry[1])
                                            };
                                        }, __$ctx).reverse(), __$ctx._localLog) {
                                            __$ctx._localLog.push([ [ "_cacheLog" ], null ]);
                                            var __r0 = __$ctx.ctx, __r1 = __r0.cache;
                                            __r0.cache = null;
                                            var __r2 = __$ctx._cacheLog;
                                            __$ctx._cacheLog = null;
                                            var __r3 = __$ctx.ctx, __r4 = __r3.link;
                                            __r3.link = _$5log.link, applyc(__$ctx), __r0.cache = __r1, __$ctx._cacheLog = __r2, 
                                            __r3.link = __r4, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                                        } else {
                                            var __r5 = __$ctx.ctx, __r6 = __r5.cache;
                                            __r5.cache = null;
                                            var __r7 = __$ctx._cacheLog;
                                            __$ctx._cacheLog = null;
                                            var __r8 = __$ctx.ctx, __r9 = __r8.link;
                                            __r8.link = _$5log.link, applyc(__$ctx), __r5.cache = __r6, __$ctx._cacheLog = __r7, 
                                            __r8.link = __r9;
                                        }
                                        _$5reverseLog.forEach(function(entry) {
                                            _$5setProperty(this, entry.key, entry.value);
                                        }, __$ctx);
                                    } else __$ctx._buf.push(_$5cached.log[_$5i]);
                                    return __$ctx._links = _$5oldLinks, _$5cached.res;
                                }
                                var _$5res, _$5cacheLog = [];
                                if (__$ctx._localLog) {
                                    __bv21 = [], __$ctx._localLog.push([ [ "_cachePos" ], [ "_buf", "length" ] ], [ [ "_cacheLog" ], _$5cacheLog ], [ [ "_localLog" ], __bv21 ]);
                                    var __r10 = __$ctx.ctx, __r11 = __r10.cache;
                                    __r10.cache = null;
                                    var __r12 = __$ctx._cachePos;
                                    __$ctx._cachePos = __$ctx._buf.length;
                                    var __r13 = __$ctx._cacheLog;
                                    __$ctx._cacheLog = _$5cacheLog;
                                    var __r14 = __$ctx._localLog;
                                    __$ctx._localLog = __bv21, _$5res = applyc(__$ctx);
                                    var _$5tail = __$ctx._buf.slice(__$ctx._cachePos).join("");
                                    _$5tail && _$5cacheLog.push(_$5tail), __r10.cache = __r11, __$ctx._cachePos = __r12, 
                                    __$ctx._cacheLog = __r13, __$ctx._localLog = __r14, __$ctx._localLog = __$ctx._localLog.slice(0, -3);
                                } else {
                                    var __r15 = __$ctx.ctx, __r16 = __r15.cache;
                                    __r15.cache = null;
                                    var __r17 = __$ctx._cachePos;
                                    __$ctx._cachePos = __$ctx._buf.length;
                                    var __r18 = __$ctx._cacheLog;
                                    __$ctx._cacheLog = _$5cacheLog;
                                    var __r19 = __$ctx._localLog;
                                    __$ctx._localLog = [], _$5res = applyc(__$ctx);
                                    var _$5tail = __$ctx._buf.slice(__$ctx._cachePos).join("");
                                    _$5tail && _$5cacheLog.push(_$5tail), __r15.cache = __r16, __$ctx._cachePos = __r17, 
                                    __$ctx._cacheLog = __r18, __$ctx._localLog = __r19;
                                }
                                return cache.set(__$ctx.ctx.cache, {
                                    log: _$5cacheLog,
                                    res: _$5res
                                }), _$5res;
                            }
                            if ("default" !== __$ctx._mode) {
                                if ("" === __$ctx._mode && 0 == !__$ctx._.isSimple(__$ctx.ctx)) {
                                    __$ctx._listLength--;
                                    var _$3ctx = __$ctx.ctx;
                                    return void ((_$3ctx && _$3ctx !== !0 || 0 === _$3ctx) && __$ctx._buf.push(_$3ctx));
                                }
                                if ("" === __$ctx._mode && 0 == !!__$ctx.ctx) return void __$ctx._listLength--;
                                if ("" === __$ctx._mode && 0 == !__$ctx._.isArray(__$ctx.ctx)) {
                                    var _$1v = __$ctx.ctx, _$1l = _$1v.length, _$1i = 0, _$1prevPos = __$ctx.position, _$1prevNotNewList = __$ctx._notNewList;
                                    for (_$1prevNotNewList ? __$ctx._listLength += _$1l - 1 : (__$ctx.position = 0, 
                                    __$ctx._listLength = _$1l), __$ctx._notNewList = !0; _$1l > _$1i; ) {
                                        var _$1newCtx = _$1v[_$1i++];
                                        if (__$ctx._localLog) {
                                            var __r0 = __$ctx.ctx;
                                            __$ctx.ctx = null == _$1newCtx ? "" : _$1newCtx, applyc(__$ctx), __$ctx.ctx = __r0;
                                        } else {
                                            var __r1 = __$ctx.ctx;
                                            __$ctx.ctx = null == _$1newCtx ? "" : _$1newCtx, applyc(__$ctx), __$ctx.ctx = __r1;
                                        }
                                    }
                                    return void (_$1prevNotNewList || (__$ctx.position = _$1prevPos));
                                }
                                if ("" !== __$ctx._mode) ; else {
                                    var _$0vBlock = __$ctx.ctx.block, _$0vElem = __$ctx.ctx.elem, _$0block = __$ctx._currBlock || __$ctx.block;
                                    if (__$ctx.ctx || (__$ctx.ctx = {}), __$ctx._localLog) {
                                        __bv0 = __$ctx.ctx.links || __$ctx._links, __bv1 = _$0vBlock || (_$0vElem ? _$0block : void 0), 
                                        __bv2 = _$0vBlock || _$0vElem ? void 0 : _$0block, __bv3 = (_$0vBlock ? __$ctx.ctx.mods : __$ctx.mods) || {}, 
                                        __bv4 = __$ctx.ctx.elemMods || {}, __$ctx._localLog.push([ [ "_mode" ], "default" ], [ [ "_links" ], __bv0 ], [ [ "block" ], __bv1 ], [ [ "_currBlock" ], __bv2 ], [ [ "elem" ], [ "ctx", "elem" ] ], [ [ "mods" ], __bv3 ], [ [ "elemMods" ], __bv4 ]);
                                        var __r0 = __$ctx._mode;
                                        __$ctx._mode = "default";
                                        var __r1 = __$ctx._links;
                                        __$ctx._links = __bv0;
                                        var __r2 = __$ctx.block;
                                        __$ctx.block = __bv1;
                                        var __r3 = __$ctx._currBlock;
                                        __$ctx._currBlock = __bv2;
                                        var __r4 = __$ctx.elem;
                                        __$ctx.elem = __$ctx.ctx.elem;
                                        var __r5 = __$ctx.mods;
                                        __$ctx.mods = __bv3;
                                        var __r6 = __$ctx.elemMods;
                                        __$ctx.elemMods = __bv4, __$ctx.block || __$ctx.elem ? __$ctx.position = (__$ctx.position || 0) + 1 : __$ctx._listLength--, 
                                        applyc(__$ctx), __$ctx._mode = __r0, __$ctx._links = __r1, __$ctx.block = __r2, 
                                        __$ctx._currBlock = __r3, __$ctx.elem = __r4, __$ctx.mods = __r5, __$ctx.elemMods = __r6, 
                                        __$ctx._localLog = __$ctx._localLog.slice(0, -7);
                                    } else {
                                        var __r7 = __$ctx._mode;
                                        __$ctx._mode = "default";
                                        var __r8 = __$ctx._links;
                                        __$ctx._links = __$ctx.ctx.links || __$ctx._links;
                                        var __r9 = __$ctx.block;
                                        __$ctx.block = _$0vBlock || (_$0vElem ? _$0block : void 0);
                                        var __r10 = __$ctx._currBlock;
                                        __$ctx._currBlock = _$0vBlock || _$0vElem ? void 0 : _$0block;
                                        var __r11 = __$ctx.elem;
                                        __$ctx.elem = __$ctx.ctx.elem;
                                        var __r12 = __$ctx.mods;
                                        __$ctx.mods = (_$0vBlock ? __$ctx.ctx.mods : __$ctx.mods) || {};
                                        var __r13 = __$ctx.elemMods;
                                        __$ctx.elemMods = __$ctx.ctx.elemMods || {}, __$ctx.block || __$ctx.elem ? __$ctx.position = (__$ctx.position || 0) + 1 : __$ctx._listLength--, 
                                        applyc(__$ctx), __$ctx._mode = __r7, __$ctx._links = __r8, __$ctx.block = __r9, 
                                        __$ctx._currBlock = __r10, __$ctx.elem = __r11, __$ctx.mods = __r12, __$ctx.elemMods = __r13;
                                    }
                                }
                            } else {
                                var _$4tag, _$4_this = __$ctx, _$4BEM_ = _$4_this.BEM, _$4v = __$ctx.ctx, _$4buf = __$ctx._buf;
                                if (_$4tag = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "tag" ]), 
                                __r0 = __$ctx._mode, __$ctx._mode = "tag", __r1 = applyc(__$ctx), __$ctx._mode = __r0, 
                                __bv6 = __r1, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv6) : (__r2 = __$ctx._mode, 
                                __$ctx._mode = "tag", __r3 = applyc(__$ctx), __$ctx._mode = __r2, __r3), "undefined" != typeof _$4tag || (_$4tag = _$4v.tag), 
                                "undefined" != typeof _$4tag || (_$4tag = "div"), _$4tag) {
                                    var _$4jsParams, _$4js;
                                    __$ctx.block && _$4v.js !== !1 && (_$4js = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "js" ]), 
                                    __r8 = __$ctx._mode, __$ctx._mode = "js", __r9 = applyc(__$ctx), __$ctx._mode = __r8, 
                                    __bv8 = __r9, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv8) : (__r10 = __$ctx._mode, 
                                    __$ctx._mode = "js", __r11 = applyc(__$ctx), __$ctx._mode = __r10, __r11), _$4js = _$4js ? __$ctx._.extend(_$4v.js, _$4js === !0 ? {} : _$4js) : _$4v.js === !0 ? {} : _$4v.js, 
                                    _$4js && ((_$4jsParams = {})[_$4BEM_.INTERNAL.buildClass(__$ctx.block, _$4v.elem)] = _$4js)), 
                                    _$4buf.push("<", _$4tag);
                                    var _$4isBEM = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "bem" ]), 
                                    __r12 = __$ctx._mode, __$ctx._mode = "bem", __r13 = applyc(__$ctx), __$ctx._mode = __r12, 
                                    __bv9 = __r13, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv9) : (__r14 = __$ctx._mode, 
                                    __$ctx._mode = "bem", __r15 = applyc(__$ctx), __$ctx._mode = __r14, __r15);
                                    "undefined" != typeof _$4isBEM || (_$4isBEM = "undefined" != typeof _$4v.bem ? _$4v.bem : _$4v.block || _$4v.elem);
                                    var _$4cls = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "cls" ]), 
                                    __r16 = __$ctx._mode, __$ctx._mode = "cls", __r17 = applyc(__$ctx), __$ctx._mode = __r16, 
                                    __bv10 = __r17, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv10) : (__r18 = __$ctx._mode, 
                                    __$ctx._mode = "cls", __r19 = applyc(__$ctx), __$ctx._mode = __r18, __r19);
                                    _$4cls || (_$4cls = _$4v.cls);
                                    var _$4addJSInitClass = _$4v.block && _$4jsParams;
                                    if (_$4isBEM || _$4cls) {
                                        if (_$4buf.push(' class="'), _$4isBEM) {
                                            _$4BEM_.INTERNAL.buildClasses(__$ctx.block, _$4v.elem, _$4v.elemMods || _$4v.mods, _$4buf);
                                            var _$4mix = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "mix" ]), 
                                            __r20 = __$ctx._mode, __$ctx._mode = "mix", __r21 = applyc(__$ctx), __$ctx._mode = __r20, 
                                            __bv11 = __r21, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv11) : (__r22 = __$ctx._mode, 
                                            __$ctx._mode = "mix", __r23 = applyc(__$ctx), __$ctx._mode = __r22, __r23);
                                            if (_$4v.mix && (_$4mix = _$4mix ? _$4mix.concat(_$4v.mix) : _$4v.mix), _$4mix) {
                                                var _$4visited = {};
                                                _$4visited[_$4visitedKey(__$ctx.block, __$ctx.elem)] = !0, __$ctx._.isArray(_$4mix) || (_$4mix = [ _$4mix ]);
                                                for (var _$4i = 0; _$4i < _$4mix.length; _$4i++) {
                                                    var _$4mixItem = _$4mix[_$4i];
                                                    if (_$4mixItem) {
                                                        var _$4hasItem = _$4mixItem.block || _$4mixItem.elem, _$4block = _$4mixItem.block || _$4mixItem._block || _$4_this.block, _$4elem = _$4mixItem.elem || _$4mixItem._elem || _$4_this.elem;
                                                        if (_$4hasItem && _$4buf.push(" "), _$4BEM_.INTERNAL[_$4hasItem ? "buildClasses" : "buildModsClasses"](_$4block, _$4mixItem.elem || _$4mixItem._elem || (_$4mixItem.block ? void 0 : _$4_this.elem), _$4mixItem.elemMods || _$4mixItem.mods, _$4buf), 
                                                        _$4mixItem.js && ((_$4jsParams || (_$4jsParams = {}))[_$4BEM_.INTERNAL.buildClass(_$4block, _$4mixItem.elem)] = _$4mixItem.js === !0 ? {} : _$4mixItem.js, 
                                                        _$4addJSInitClass || (_$4addJSInitClass = _$4block && !_$4mixItem.elem)), _$4hasItem && !_$4visited[_$4visitedKey(_$4block, _$4elem)]) {
                                                            _$4visited[_$4visitedKey(_$4block, _$4elem)] = !0;
                                                            var _$4nestedMix = __$ctx._localLog ? (__$ctx._localLog.push([ [ "block" ], _$4block ], [ [ "elem" ], _$4elem ], [ [ "_mode" ], "mix" ]), 
                                                            __r24 = __$ctx.block, __$ctx.block = _$4block, __r25 = __$ctx.elem, __$ctx.elem = _$4elem, 
                                                            __r26 = __$ctx._mode, __$ctx._mode = "mix", __r27 = applyc(__$ctx), __$ctx.block = __r24, 
                                                            __$ctx.elem = __r25, __$ctx._mode = __r26, __bv12 = __r27, __$ctx._localLog = __$ctx._localLog.slice(0, -3), 
                                                            __bv12) : (__r28 = __$ctx.block, __$ctx.block = _$4block, __r29 = __$ctx.elem, __$ctx.elem = _$4elem, 
                                                            __r30 = __$ctx._mode, __$ctx._mode = "mix", __r31 = applyc(__$ctx), __$ctx.block = __r28, 
                                                            __$ctx.elem = __r29, __$ctx._mode = __r30, __r31);
                                                            if (_$4nestedMix) for (var _$4j = 0; _$4j < _$4nestedMix.length; _$4j++) {
                                                                var _$4nestedItem = _$4nestedMix[_$4j];
                                                                (_$4nestedItem.block || _$4nestedItem.elem) && _$4visited[_$4visitedKey(_$4nestedItem.block, _$4nestedItem.elem)] || (_$4nestedItem._block = _$4block, 
                                                                _$4nestedItem._elem = _$4elem, _$4mix.splice(_$4i + 1, 0, _$4nestedItem));
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        _$4cls && _$4buf.push(_$4isBEM ? " " : "", _$4cls), _$4addJSInitClass && _$4buf.push(" i-bem"), 
                                        _$4buf.push('"');
                                    }
                                    if (_$4jsParams) {
                                        var _$4jsAttr = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "jsAttr" ]), 
                                        __r36 = __$ctx._mode, __$ctx._mode = "jsAttr", __r37 = applyc(__$ctx), __$ctx._mode = __r36, 
                                        __bv14 = __r37, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv14) : (__r38 = __$ctx._mode, 
                                        __$ctx._mode = "jsAttr", __r39 = applyc(__$ctx), __$ctx._mode = __r38, __r39);
                                        _$4buf.push(" ", _$4jsAttr || "onclick", '="return ', __$ctx._.attrEscape(JSON.stringify(_$4jsParams)), '"');
                                    }
                                    var _$4attrs = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "attrs" ]), 
                                    __r40 = __$ctx._mode, __$ctx._mode = "attrs", __r41 = applyc(__$ctx), __$ctx._mode = __r40, 
                                    __bv15 = __r41, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv15) : (__r42 = __$ctx._mode, 
                                    __$ctx._mode = "attrs", __r43 = applyc(__$ctx), __$ctx._mode = __r42, __r43);
                                    if (_$4attrs = __$ctx._.extend(_$4attrs, _$4v.attrs)) {
                                        var _$4name;
                                        for (_$4name in _$4attrs) void 0 !== _$4attrs[_$4name] && _$4buf.push(" ", _$4name, '="', __$ctx._.attrEscape(_$4attrs[_$4name]), '"');
                                    }
                                }
                                if (__$ctx._.isShortTag(_$4tag)) _$4buf.push("/>"); else {
                                    _$4tag && _$4buf.push(">");
                                    var _$4content = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "content" ]), 
                                    __r44 = __$ctx._mode, __$ctx._mode = "content", __r45 = applyc(__$ctx), __$ctx._mode = __r44, 
                                    __bv16 = __r45, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv16) : (__r46 = __$ctx._mode, 
                                    __$ctx._mode = "content", __r47 = applyc(__$ctx), __$ctx._mode = __r46, __r47);
                                    if (_$4content || 0 === _$4content) {
                                        var _$4isBEM = __$ctx.block || __$ctx.elem;
                                        if (__$ctx._localLog) {
                                            __bv17 = _$4isBEM ? 1 : __$ctx.position, __bv18 = _$4isBEM ? 1 : __$ctx._listLength, 
                                            __$ctx._localLog.push([ [ "_notNewList" ], !1 ], [ [ "position" ], __bv17 ], [ [ "_listLength" ], __bv18 ], [ [ "_mode" ], "" ]);
                                            var __r48 = __$ctx._notNewList;
                                            __$ctx._notNewList = !1;
                                            var __r49 = __$ctx.position;
                                            __$ctx.position = __bv17;
                                            var __r50 = __$ctx._listLength;
                                            __$ctx._listLength = __bv18;
                                            var __r51 = __$ctx.ctx;
                                            __$ctx.ctx = _$4content;
                                            var __r52 = __$ctx._mode;
                                            __$ctx._mode = "", applyc(__$ctx), __$ctx._notNewList = __r48, __$ctx.position = __r49, 
                                            __$ctx._listLength = __r50, __$ctx.ctx = __r51, __$ctx._mode = __r52, __$ctx._localLog = __$ctx._localLog.slice(0, -4);
                                        } else {
                                            var __r53 = __$ctx._notNewList;
                                            __$ctx._notNewList = !1;
                                            var __r54 = __$ctx.position;
                                            __$ctx.position = _$4isBEM ? 1 : __$ctx.position;
                                            var __r55 = __$ctx._listLength;
                                            __$ctx._listLength = _$4isBEM ? 1 : __$ctx._listLength;
                                            var __r56 = __$ctx.ctx;
                                            __$ctx.ctx = _$4content;
                                            var __r57 = __$ctx._mode;
                                            __$ctx._mode = "", applyc(__$ctx), __$ctx._notNewList = __r53, __$ctx.position = __r54, 
                                            __$ctx._listLength = __r55, __$ctx.ctx = __r56, __$ctx._mode = __r57;
                                        }
                                    }
                                    _$4tag && _$4buf.push("</", _$4tag, ">");
                                }
                            }
                        } else {
                            var _$htld, _$hxYaDomain, _$hyaDomain, _$hparams = __$ctx.ctx.params || {}, _$hiGlobal = __$ctx["i-global"], _$hisTldChanged = _$hparams.tld && _$hparams.tld !== _$hiGlobal.tld;
                            _$hisTldChanged && (_$htld = _$hparams.tld, _$hxYaDomain = "tr" === _$htld ? "yandex.com.tr" : "yandex." + _$htld, 
                            _$hyaDomain = -1 != [ "ua", "by", "kz" ].indexOf(_$htld) ? "yandex.ru" : _$hxYaDomain, 
                            _$hiGlobal["content-region"] = _$htld, _$hiGlobal["click-host"] = "//clck." + _$hyaDomain, 
                            _$hiGlobal["passport-host"] = "https://passport." + _$hyaDomain, _$hiGlobal["pass-host"] = "//pass." + _$hxYaDomain, 
                            _$hiGlobal["social-host"] = "//social." + _$hxYaDomain, _$hiGlobal["export-host"] = "//export." + _$hxYaDomain);
                            for (var _$hp in _$hparams) _$hiGlobal[_$hp] = _$hparams[_$hp];
                        }
                    } else {
                        var _$12ctx = __$ctx.ctx, _$12dtype = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "doctype" ]), 
                        __r0 = __$ctx._mode, __$ctx._mode = "doctype", __r1 = applyc(__$ctx), __$ctx._mode = __r0, 
                        __bv31 = __r1, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv31) : (__r2 = __$ctx._mode, 
                        __$ctx._mode = "doctype", __r3 = applyc(__$ctx), __$ctx._mode = __r2, __r3), _$12xUA = __$ctx._localLog ? (__$ctx._localLog.push([ [ "_mode" ], "xUACompatible" ]), 
                        __r4 = __$ctx._mode, __$ctx._mode = "xUACompatible", __r5 = applyc(__$ctx), __$ctx._mode = __r4, 
                        __bv32 = __r5, __$ctx._localLog = __$ctx._localLog.slice(0, -1), __bv32) : (__r6 = __$ctx._mode, 
                        __$ctx._mode = "xUACompatible", __r7 = applyc(__$ctx), __$ctx._mode = __r6, __r7), _$12buf = [ _$12dtype, {
                            elem: "root",
                            content: [ {
                                elem: "head",
                                content: [ {
                                    tag: "meta",
                                    attrs: {
                                        charset: "utf-8"
                                    }
                                }, _$12xUA, {
                                    tag: "title",
                                    content: _$12ctx.title
                                }, _$12ctx.favicon ? {
                                    elem: "favicon",
                                    url: _$12ctx.favicon
                                } : "", _$12ctx.meta, {
                                    block: "i-ua"
                                }, _$12ctx.head ]
                            }, _$12ctx ]
                        } ];
                        if (__$ctx._localLog) {
                            __$ctx._localLog.push([ [ "__$anflg2" ], !0 ]);
                            var __r8 = __$ctx.__$anflg2;
                            if (__$ctx.__$anflg2 = !0, __$ctx._localLog) {
                                __$ctx._localLog.push([ [ "_mode" ], "" ]);
                                var __r9 = __$ctx.ctx;
                                __$ctx.ctx = _$12buf;
                                var __r10 = __$ctx._mode;
                                __$ctx._mode = "", applyc(__$ctx), __$ctx.ctx = __r9, __$ctx._mode = __r10, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                            } else {
                                var __r11 = __$ctx.ctx;
                                __$ctx.ctx = _$12buf;
                                var __r12 = __$ctx._mode;
                                __$ctx._mode = "", applyc(__$ctx), __$ctx.ctx = __r11, __$ctx._mode = __r12;
                            }
                            __$ctx.__$anflg2 = __r8, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                        } else {
                            var __r13 = __$ctx.__$anflg2;
                            if (__$ctx.__$anflg2 = !0, __$ctx._localLog) {
                                __$ctx._localLog.push([ [ "_mode" ], "" ]);
                                var __r14 = __$ctx.ctx;
                                __$ctx.ctx = _$12buf;
                                var __r15 = __$ctx._mode;
                                __$ctx._mode = "", applyc(__$ctx), __$ctx.ctx = __r14, __$ctx._mode = __r15, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                            } else {
                                var __r16 = __$ctx.ctx;
                                __$ctx.ctx = _$12buf;
                                var __r17 = __$ctx._mode;
                                __$ctx._mode = "", applyc(__$ctx), __$ctx.ctx = __r16, __$ctx._mode = __r17;
                            }
                            __$ctx.__$anflg2 = __r13;
                        }
                    }
                } else {
                    var _$1lie = __$ctx.ctx.ie;
                    if (_$1lie === !0) if (__$ctx._localLog) {
                        __$ctx._localLog.push([ [ "_mode" ], "" ]);
                        var __r4 = __$ctx._mode;
                        __$ctx._mode = "";
                        var __r5 = __$ctx.ctx;
                        __$ctx.ctx = [ 6, 7, 8, 9 ].map(function(v) {
                            return {
                                elem: "css",
                                url: this.ctx.url + ".ie" + v + ".css",
                                ie: "IE " + v
                            };
                        }, __$ctx), applyc(__$ctx), __$ctx._mode = __r4, __$ctx.ctx = __r5, __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                    } else {
                        var __r6 = __$ctx._mode;
                        __$ctx._mode = "";
                        var __r7 = __$ctx.ctx;
                        __$ctx.ctx = [ 6, 7, 8, 9 ].map(function(v) {
                            return {
                                elem: "css",
                                url: this.ctx.url + ".ie" + v + ".css",
                                ie: "IE " + v
                            };
                        }, __$ctx), applyc(__$ctx), __$ctx._mode = __r6, __$ctx.ctx = __r7;
                    } else {
                        var _$1lhideRule = _$1lie ? "!IE" === _$1lie ? [ _$1lie, "<!-->", "<!--" ] : [ _$1lie, "", "" ] : [ "gt IE 9", "<!-->", "<!--" ];
                        if (__$ctx._localLog) {
                            __$ctx._localLog.push([ [ "_mode" ], "" ]);
                            var __r8 = __$ctx._mode;
                            __$ctx._mode = "";
                            var __r9 = __$ctx.ctx, __r10 = __r9._ieCommented;
                            __r9._ieCommented = !0;
                            var __r11 = __$ctx.ctx;
                            __$ctx.ctx = [ "<!--[if " + _$1lhideRule[0] + "]>", _$1lhideRule[1], __$ctx.ctx, _$1lhideRule[2], "<![endif]-->" ], 
                            applyc(__$ctx), __$ctx._mode = __r8, __r9._ieCommented = __r10, __$ctx.ctx = __r11, 
                            __$ctx._localLog = __$ctx._localLog.slice(0, -1);
                        } else {
                            var __r12 = __$ctx._mode;
                            __$ctx._mode = "";
                            var __r13 = __$ctx.ctx, __r14 = __r13._ieCommented;
                            __r13._ieCommented = !0;
                            var __r15 = __$ctx.ctx;
                            __$ctx.ctx = [ "<!--[if " + _$1lhideRule[0] + "]>", _$1lhideRule[1], __$ctx.ctx, _$1lhideRule[2], "<![endif]-->" ], 
                            applyc(__$ctx), __$ctx._mode = __r12, __r13._ieCommented = __r14, __$ctx.ctx = __r15;
                        }
                    }
                }
            } else if (__$ctx._localLog) {
                var __r0 = __$ctx.ctx, __r1 = __r0.mods;
                __r0.mods = __$ctx._.extend(__$ctx.ctx.mods || {}, {
                    theme: "normal"
                }), applyc(__$ctx), __r0.mods = __r1;
            } else {
                var __r2 = __$ctx.ctx, __r3 = __r2.mods;
                __r2.mods = __$ctx._.extend(__$ctx.ctx.mods || {}, {
                    theme: "normal"
                }), applyc(__$ctx), __r2.mods = __r3;
            }
        }
        return !function(global, bem_) {
            if (bem_.I18N) return void 0;
            global.BEM = bem_;
            var i18n = bem_.I18N = function(keyset, key) {
                return key;
            };
            i18n.keyset = function() {
                return i18n;
            }, i18n.key = function(key) {
                return key;
            }, i18n.lang = function() {
                return void 0;
            };
        }(this, "undefined" == typeof BEM ? {} : BEM), !function() {
            function BEMContext(context, apply_) {
                this.ctx = null === typeof context ? "" : context, this.apply = apply_, this._buf = [], 
                this._ = this, this._start = !0, this._mode = "", this._listLength = 0, this._notNewList = !1, 
                this.position = 0, this.block = void 0, this.elem = void 0, this.mods = void 0, 
                this.elemMods = void 0;
            }
            var BEM_ = {}, toString = Object.prototype.toString, SHORT_TAGS = {
                area: 1,
                base: 1,
                br: 1,
                col: 1,
                command: 1,
                embed: 1,
                hr: 1,
                img: 1,
                input: 1,
                keygen: 1,
                link: 1,
                meta: 1,
                param: 1,
                source: 1,
                wbr: 1
            };
            !function(BEM, undefined) {
                function buildModPostfix(modName, modVal, buffer) {
                    buffer.push(MOD_DELIM, modName, MOD_DELIM, modVal);
                }
                function buildBlockClass(name, modName, modVal, buffer) {
                    buffer.push(name), modVal && buildModPostfix(modName, modVal, buffer);
                }
                function buildElemClass(block, name, modName, modVal, buffer) {
                    buildBlockClass(block, undefined, undefined, buffer), buffer.push(ELEM_DELIM, name), 
                    modVal && buildModPostfix(modName, modVal, buffer);
                }
                var MOD_DELIM = "_", ELEM_DELIM = "__", NAME_PATTERN = "[a-zA-Z0-9-]+";
                BEM.INTERNAL = {
                    NAME_PATTERN: NAME_PATTERN,
                    MOD_DELIM: MOD_DELIM,
                    ELEM_DELIM: ELEM_DELIM,
                    buildModPostfix: function(modName, modVal, buffer) {
                        var res = buffer || [];
                        return buildModPostfix(modName, modVal, res), buffer ? res : res.join("");
                    },
                    buildClass: function(block, elem, modName, modVal, buffer) {
                        var typeOf = typeof modName;
                        if ("string" == typeOf ? "string" != typeof modVal && (buffer = modVal, modVal = modName, 
                        modName = elem, elem = undefined) : "undefined" != typeOf ? (buffer = modName, modName = undefined) : elem && "string" != typeof elem && (buffer = elem, 
                        elem = undefined), !(elem || modName || buffer)) return block;
                        var res = buffer || [];
                        return elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res), 
                        buffer ? res : res.join("");
                    },
                    buildModsClasses: function(block, elem, mods, buffer) {
                        var res = buffer || [];
                        if (mods) {
                            var modName;
                            for (modName in mods) if (mods.hasOwnProperty(modName)) {
                                var modVal = mods[modName];
                                null != modVal && (modVal = mods[modName] + "", modVal && (res.push(" "), elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res)));
                            }
                        }
                        return buffer ? res : res.join("");
                    },
                    buildClasses: function(block, elem, mods, buffer) {
                        var res = buffer || [];
                        return elem ? buildElemClass(block, elem, undefined, undefined, res) : buildBlockClass(block, undefined, undefined, res), 
                        this.buildModsClasses(block, elem, mods, buffer), buffer ? res : res.join("");
                    }
                };
            }(BEM_);
            var buildEscape = function() {
                var ts = {
                    '"': "&quot;",
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;"
                }, f = function(t) {
                    return ts[t] || t;
                };
                return function(r) {
                    return r = new RegExp(r, "g"), function(s) {
                        return ("" + s).replace(r, f);
                    };
                };
            }();
            BEMContext.prototype.isArray = function(obj) {
                return "[object Array]" === toString.call(obj);
            }, BEMContext.prototype.isSimple = function(obj) {
                var t = typeof obj;
                return "string" === t || "number" === t || "boolean" === t;
            }, BEMContext.prototype.isShortTag = function(t) {
                return SHORT_TAGS.hasOwnProperty(t);
            }, BEMContext.prototype.extend = function(o1, o2) {
                if (!o1 || !o2) return o1 || o2;
                var n, res = {};
                for (n in o1) o1.hasOwnProperty(n) && (res[n] = o1[n]);
                for (n in o2) o2.hasOwnProperty(n) && (res[n] = o2[n]);
                return res;
            }, BEMContext.prototype.identify = function() {
                var cnt = 0, id = BEM_.__id = +new Date(), expando = "__" + id, get = function() {
                    return "uniq" + id + ++cnt;
                };
                return function(obj, onlyGet) {
                    return obj ? onlyGet || obj[expando] ? obj[expando] : obj[expando] = get() : get();
                };
            }(), BEMContext.prototype.xmlEscape = buildEscape("[&<>]"), BEMContext.prototype.attrEscape = buildEscape('["&<>]'), 
            BEMContext.prototype.BEM = BEM_, BEMContext.prototype.isFirst = function() {
                return 1 === this.position;
            }, BEMContext.prototype.isLast = function() {
                return this.position === this._listLength;
            }, BEMContext.prototype.generateId = function() {
                return this.identify(this.ctx);
            }, exports.apply = BEMContext.apply = function() {
                var ctx = new BEMContext(this, apply);
                return ctx.apply(), ctx._buf.join("");
            };
        }(), exports;
    }("undefined" == typeof exports ? {} : exports);
    return function(options) {
        var context = this;
        return options || (options = {}), cache = options.cache, function() {
            return context === this && (context = void 0), xjst.apply.call([ context ]);
        }.call(null);
    };
}();

"undefined" == typeof exports || (exports.BEMHTML = BEMHTML), function($) {
    function override(base, result, add) {
        var hasSpecProps = !1;
        if (needCheckProps) {
            var addList = [];
            $.each(specProps, function() {
                add.hasOwnProperty(this) && (hasSpecProps = !0) && addList.push({
                    name: this,
                    val: add[this]
                });
            }), hasSpecProps && ($.each(add, function(name) {
                addList.push({
                    name: name,
                    val: this
                });
            }), add = addList);
        }
        $.each(add, function(name, prop) {
            if (hasSpecProps && (name = prop.name, prop = prop.val), $.isFunction(prop) && (!hasIntrospection || prop.toString().indexOf(".__base") > -1)) {
                var baseMethod = base[name] || function() {};
                result[name] = function() {
                    var baseSaved = this.__base;
                    this.__base = baseMethod;
                    var result = prop.apply(this, arguments);
                    return this.__base = baseSaved, result;
                };
            } else result[name] = prop;
        });
    }
    var hasIntrospection = function() {}.toString().indexOf("_") > -1, emptyBase = function() {}, objCreate = Object.create || function(ptp) {
        var inheritance = function() {};
        return inheritance.prototype = ptp, new inheritance();
    }, needCheckProps = !0, testPropObj = {
        toString: ""
    };
    for (var i in testPropObj) testPropObj.hasOwnProperty(i) && (needCheckProps = !1);
    var specProps = needCheckProps ? [ "toString", "valueOf" ] : null;
    $.inherit = function() {
        var args = arguments, hasBase = $.isFunction(args[0]), base = hasBase ? args[0] : emptyBase, props = args[hasBase ? 1 : 0] || {}, staticProps = args[hasBase ? 2 : 1], result = props.__constructor || hasBase && base.prototype.__constructor ? function() {
            return this.__constructor.apply(this, arguments);
        } : function() {};
        if (!hasBase) return result.prototype = props, result.prototype.__self = result.prototype.constructor = result, 
        $.extend(result, staticProps);
        $.extend(result, base);
        var basePtp = base.prototype, resultPtp = result.prototype = objCreate(basePtp);
        return resultPtp.__self = resultPtp.constructor = result, override(basePtp, resultPtp, props), 
        staticProps && override(base, result, staticProps), result;
    }, $.inheritSelf = function(base, props, staticProps) {
        var basePtp = base.prototype;
        return override(basePtp, basePtp, props), staticProps && override(base, base, staticProps), 
        base;
    };
}(jQuery), function($) {
    var counter = 0, expando = "__" + +new Date(), get = function() {
        return "uniq" + ++counter;
    };
    $.identify = function(obj, onlyGet) {
        if (!obj) return get();
        var key = "uniqueID" in obj ? "uniqueID" : expando;
        return onlyGet || key in obj ? obj[key] : obj[key] = get();
    };
}(jQuery), function($) {
    $.isEmptyObject || ($.isEmptyObject = function(obj) {
        for (var i in obj) return !1;
        return !0;
    });
}(jQuery), function($) {
    $.extend({
        debounce: function(fn, timeout, invokeAsap, ctx) {
            3 == arguments.length && "boolean" != typeof invokeAsap && (ctx = invokeAsap, invokeAsap = !1);
            var timer;
            return function() {
                var args = arguments;
                ctx = ctx || this, invokeAsap && !timer && fn.apply(ctx, args), clearTimeout(timer), 
                timer = setTimeout(function() {
                    invokeAsap || fn.apply(ctx, args), timer = null;
                }, timeout);
            };
        },
        throttle: function(fn, timeout, ctx) {
            var timer, args, needInvoke;
            return function() {
                args = arguments, needInvoke = !0, ctx = ctx || this, timer || function() {
                    needInvoke ? (fn.apply(ctx, args), needInvoke = !1, timer = setTimeout(arguments.callee, timeout)) : timer = null;
                }();
            };
        }
    });
}(jQuery), function($) {
    var storageExpando = "__" + +new Date() + "storage", getFnId = function(fn, ctx) {
        return $.identify(fn) + (ctx ? $.identify(ctx) : "");
    }, Observable = {
        buildEventName: function(e) {
            return e;
        },
        on: function(e, data, fn, ctx, _special) {
            if ("string" == typeof e) {
                $.isFunction(data) && (ctx = fn, fn = data, data = void 0);
                for (var eStorage, id = getFnId(fn, ctx), storage = this[storageExpando] || (this[storageExpando] = {}), eList = e.split(" "), i = 0; e = eList[i++]; ) if (e = this.buildEventName(e), 
                eStorage = storage[e] || (storage[e] = {
                    ids: {},
                    list: {}
                }), !(id in eStorage.ids)) {
                    var list = eStorage.list, item = {
                        fn: fn,
                        data: data,
                        ctx: ctx,
                        special: _special
                    };
                    list.last ? (list.last.next = item, item.prev = list.last) : list.first = item, 
                    eStorage.ids[id] = list.last = item;
                }
            } else {
                var _this = this;
                $.each(e, function(e, fn) {
                    _this.on(e, fn, data, _special);
                });
            }
            return this;
        },
        onFirst: function(e, data, fn, ctx) {
            return this.on(e, data, fn, ctx, {
                one: !0
            });
        },
        un: function(e, fn, ctx) {
            if ("string" == typeof e || "undefined" == typeof e) {
                var storage = this[storageExpando];
                if (storage) if (e) {
                    for (var eStorage, eList = e.split(" "), i = 0; e = eList[i++]; ) if (e = this.buildEventName(e), 
                    eStorage = storage[e]) if (fn) {
                        var id = getFnId(fn, ctx), ids = eStorage.ids;
                        if (id in ids) {
                            var list = eStorage.list, item = ids[id], prev = item.prev, next = item.next;
                            prev ? prev.next = next : item === list.first && (list.first = next), next ? next.prev = prev : item === list.last && (list.last = prev), 
                            delete ids[id];
                        }
                    } else delete this[storageExpando][e];
                } else delete this[storageExpando];
            } else {
                var _this = this;
                $.each(e, function(e, fn) {
                    _this.un(e, fn, ctx);
                });
            }
            return this;
        },
        trigger: function(e, data) {
            var rawType, _this = this, storage = _this[storageExpando];
            if ("string" == typeof e ? e = $.Event(_this.buildEventName(rawType = e)) : e.type = _this.buildEventName(rawType = e.type), 
            e.target || (e.target = _this), storage && (storage = storage[e.type])) for (var ret, item = storage.list.first; item; ) e.data = item.data, 
            ret = item.fn.call(item.ctx || _this, e, data), "undefined" != typeof ret && (e.result = ret, 
            ret === !1 && (e.preventDefault(), e.stopPropagation())), item.special && item.special.one && _this.un(rawType, item.fn, item.ctx), 
            item = item.next;
            return this;
        }
    };
    $.observable = $.inherit(Observable, Observable);
}(jQuery), function($, undefined) {
    function buildModFnName(elemName, modName, modVal) {
        return (elemName ? "__elem_" + elemName : "") + "__mod" + (modName ? "_" + modName : "") + (modVal ? "_" + modVal : "");
    }
    function modFnsToProps(modFns, props, elemName) {
        $.isFunction(modFns) ? props[buildModFnName(elemName, "*", "*")] = modFns : $.each(modFns, function(modName, modFn) {
            $.isFunction(modFn) ? props[buildModFnName(elemName, modName, "*")] = modFn : $.each(modFn, function(modVal, modFn) {
                props[buildModFnName(elemName, modName, modVal)] = modFn;
            });
        });
    }
    function buildCheckMod(modName, modVal) {
        return modVal ? Array.isArray(modVal) ? function(block) {
            for (var i = 0, len = modVal.length; len > i; ) if (block.hasMod(modName, modVal[i++])) return !0;
            return !1;
        } : function(block) {
            return block.hasMod(modName, modVal);
        } : function(block) {
            return block.hasMod(modName);
        };
    }
    var afterCurrentEventFns = [], blocks = {}, channels = {};
    this.BEM = $.inherit($.observable, {
        __constructor: function(mods, params, initImmediately) {
            var _this = this;
            _this._modCache = mods || {}, _this._processingMods = {}, _this._params = params, 
            _this.params = null, initImmediately !== !1 ? _this._init() : _this.afterCurrentEvent(function() {
                _this._init();
            });
        },
        _init: function() {
            return this._initing || this.hasMod("js", "inited") || (this._initing = !0, this.params || (this.params = $.extend(this.getDefaultParams(), this._params), 
            delete this._params), this.setMod("js", "inited"), delete this._initing, this.hasMod("js", "inited") && this.trigger("init")), 
            this;
        },
        changeThis: function(fn, ctx) {
            return fn.bind(ctx || this);
        },
        afterCurrentEvent: function(fn, ctx) {
            this.__self.afterCurrentEvent(this.changeThis(fn, ctx));
        },
        trigger: function(e, data) {
            return this.__base(e = this.buildEvent(e), data).__self.trigger(e, data), this;
        },
        buildEvent: function(e) {
            return "string" == typeof e && (e = $.Event(e)), e.block = this, e;
        },
        hasMod: function(elem, modName, modVal) {
            var len = arguments.length, invert = !1;
            1 == len ? (modVal = "", modName = elem, elem = undefined, invert = !0) : 2 == len && ("string" == typeof elem ? (modVal = modName, 
            modName = elem, elem = undefined) : (modVal = "", invert = !0));
            var res = this.getMod(elem, modName) === modVal;
            return invert ? !res : res;
        },
        getMod: function(elem, modName) {
            var type = typeof elem;
            if ("string" === type || "undefined" === type) {
                modName = elem || modName;
                var modCache = this._modCache;
                return modName in modCache ? modCache[modName] : modCache[modName] = this._extractModVal(modName);
            }
            return this._getElemMod(modName, elem);
        },
        _getElemMod: function(modName, elem, elemName) {
            return this._extractModVal(modName, elem, elemName);
        },
        getMods: function(elem) {
            var hasElem = elem && "string" != typeof elem, _this = this, modNames = [].slice.call(arguments, hasElem ? 1 : 0), res = _this._extractMods(modNames, hasElem ? elem : undefined);
            return hasElem || (modNames.length ? modNames.forEach(function(name) {
                _this._modCache[name] = res[name];
            }) : _this._modCache = res), res;
        },
        setMod: function(elem, modName, modVal) {
            "undefined" == typeof modVal && (modVal = modName, modName = elem, elem = undefined);
            var _this = this;
            if (!elem || elem[0]) {
                var modId = (elem && elem[0] ? $.identify(elem[0]) : "") + "_" + modName;
                if (this._processingMods[modId]) return _this;
                var elemName, curModVal = elem ? _this._getElemMod(modName, elem, elemName = _this.__self._extractElemNameFrom(elem)) : _this.getMod(modName);
                if (curModVal === modVal) return _this;
                this._processingMods[modId] = !0;
                var needSetMod = !0, modFnParams = [ modName, modVal, curModVal ];
                elem && modFnParams.unshift(elem), [ [ "*", "*" ], [ modName, "*" ], [ modName, modVal ] ].forEach(function(mod) {
                    needSetMod = _this._callModFn(elemName, mod[0], mod[1], modFnParams) !== !1 && needSetMod;
                }), !elem && needSetMod && (_this._modCache[modName] = modVal), needSetMod && _this._afterSetMod(modName, modVal, curModVal, elem, elemName), 
                delete this._processingMods[modId];
            }
            return _this;
        },
        _afterSetMod: function() {},
        toggleMod: function(elem, modName, modVal1, modVal2, condition) {
            "string" == typeof elem && (condition = modVal2, modVal2 = modVal1, modVal1 = modName, 
            modName = elem, elem = undefined), "undefined" == typeof modVal2 ? modVal2 = "" : "boolean" == typeof modVal2 && (condition = modVal2, 
            modVal2 = "");
            var modVal = this.getMod(elem, modName);
            return (modVal == modVal1 || modVal == modVal2) && this.setMod(elem, modName, "boolean" == typeof condition ? condition ? modVal1 : modVal2 : this.hasMod(elem, modName, modVal1) ? modVal2 : modVal1), 
            this;
        },
        delMod: function(elem, modName) {
            return modName || (modName = elem, elem = undefined), this.setMod(elem, modName, "");
        },
        _callModFn: function(elemName, modName, modVal, modFnParams) {
            var modFnName = buildModFnName(elemName, modName, modVal);
            return this[modFnName] ? this[modFnName].apply(this, modFnParams) : undefined;
        },
        _extractModVal: function() {
            return "";
        },
        _extractMods: function() {
            return {};
        },
        channel: function(id, drop) {
            return this.__self.channel(id, drop);
        },
        getDefaultParams: function() {
            return {};
        },
        del: function(obj) {
            var args = [].slice.call(arguments);
            return "string" == typeof obj && args.unshift(this), this.__self.del.apply(this.__self, args), 
            this;
        },
        destruct: function() {}
    }, {
        _name: "i-bem",
        blocks: blocks,
        decl: function(decl, props, staticProps) {
            if ("string" == typeof decl ? decl = {
                block: decl
            } : decl.name && (decl.block = decl.name), decl.baseBlock && !blocks[decl.baseBlock]) throw 'baseBlock "' + decl.baseBlock + '" for "' + decl.block + '" is undefined';
            props || (props = {}), props.onSetMod && (modFnsToProps(props.onSetMod, props), 
            delete props.onSetMod), props.onElemSetMod && ($.each(props.onElemSetMod, function(elemName, modFns) {
                modFnsToProps(modFns, props, elemName);
            }), delete props.onElemSetMod);
            var baseBlock = blocks[decl.baseBlock || decl.block] || this;
            if (decl.modName) {
                var checkMod = buildCheckMod(decl.modName, decl.modVal);
                $.each(props, function(name, prop) {
                    $.isFunction(prop) && (props[name] = function() {
                        var method;
                        if (checkMod(this)) method = prop; else {
                            var baseMethod = baseBlock.prototype[name];
                            baseMethod && baseMethod !== props[name] && (method = this.__base);
                        }
                        return method ? method.apply(this, arguments) : undefined;
                    });
                });
            }
            if (staticProps && "boolean" == typeof staticProps.live) {
                var live = staticProps.live;
                staticProps.live = function() {
                    return live;
                };
            }
            var block;
            return decl.block == baseBlock._name ? (block = $.inheritSelf(baseBlock, props, staticProps))._processLive(!0) : (block = blocks[decl.block] = $.inherit(baseBlock, props, staticProps))._name = decl.block, 
            block;
        },
        _processLive: function() {
            return !1;
        },
        create: function(block, params) {
            return "string" == typeof block && (block = {
                block: block
            }), new blocks[block.block](block.mods, params);
        },
        getName: function() {
            return this._name;
        },
        _extractElemNameFrom: function() {},
        afterCurrentEvent: function(fn, ctx) {
            1 == afterCurrentEventFns.push({
                fn: fn,
                ctx: ctx
            }) && setTimeout(this._runAfterCurrentEventFns, 0);
        },
        _runAfterCurrentEventFns: function() {
            var fnsLen = afterCurrentEventFns.length;
            if (fnsLen) for (var fnObj, fnsCopy = afterCurrentEventFns.splice(0, fnsLen); fnObj = fnsCopy.shift(); ) fnObj.fn.call(fnObj.ctx || this);
        },
        changeThis: function(fn, ctx) {
            return fn.bind(ctx || this);
        },
        del: function(obj) {
            var delInThis = "string" == typeof obj, i = delInThis ? 0 : 1, len = arguments.length;
            for (delInThis && (obj = this); len > i; ) delete obj[arguments[i++]];
            return this;
        },
        channel: function(id, drop) {
            return "boolean" == typeof id && (drop = id, id = undefined), id || (id = "default"), 
            drop ? void (channels[id] && (channels[id].un(), delete channels[id])) : channels[id] || (channels[id] = new $.observable());
        }
    });
}(jQuery), function() {
    Object.keys || (Object.keys = function(obj) {
        var res = [];
        for (var i in obj) obj.hasOwnProperty(i) && res.push(i);
        return res;
    });
}(), function() {
    var ptp = Array.prototype, toStr = Object.prototype.toString, methods = {
        indexOf: function(item, fromIdx) {
            fromIdx = +(fromIdx || 0);
            var t = this, len = t.length;
            if (len > 0 && len > fromIdx) for (fromIdx = 0 > fromIdx ? Math.ceil(fromIdx) : Math.floor(fromIdx), 
            -len > fromIdx && (fromIdx = 0), 0 > fromIdx && (fromIdx += len); len > fromIdx; ) {
                if (fromIdx in t && t[fromIdx] === item) return fromIdx;
                ++fromIdx;
            }
            return -1;
        },
        forEach: function(callback, ctx) {
            for (var i = -1, t = this, len = t.length; ++i < len; ) i in t && (ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t));
        },
        map: function(callback, ctx) {
            for (var i = -1, t = this, len = t.length, res = new Array(len); ++i < len; ) i in t && (res[i] = ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t));
            return res;
        },
        filter: function(callback, ctx) {
            for (var i = -1, t = this, len = t.length, res = []; ++i < len; ) i in t && (ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t)) && res.push(t[i]);
            return res;
        },
        reduce: function(callback, initialVal) {
            var res, i = -1, t = this, len = t.length;
            if (arguments.length < 2) {
                for (;++i < len; ) if (i in t) {
                    res = t[i];
                    break;
                }
            } else res = initialVal;
            for (;++i < len; ) i in t && (res = callback(res, t[i], i, t));
            return res;
        },
        some: function(callback, ctx) {
            for (var i = -1, t = this, len = t.length; ++i < len; ) if (i in t && (ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t))) return !0;
            return !1;
        },
        every: function(callback, ctx) {
            for (var i = -1, t = this, len = t.length; ++i < len; ) if (i in t && !(ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t))) return !1;
            return !0;
        }
    };
    for (var name in methods) ptp[name] || (ptp[name] = methods[name]);
    Array.isArray || (Array.isArray = function(obj) {
        return "[object Array]" === toStr.call(obj);
    });
}(), function() {
    var slice = Array.prototype.slice;
    Function.prototype.bind || (Function.prototype.bind = function(ctx) {
        var fn = this, args = slice.call(arguments, 1);
        return function() {
            return fn.apply(ctx, args.concat(slice.call(arguments)));
        };
    });
}(), function(BEM, $, undefined) {
    function buildModPostfix(modName, modVal, buffer) {
        buffer.push(MOD_DELIM, modName, MOD_DELIM, modVal);
    }
    function buildBlockClass(name, modName, modVal, buffer) {
        buffer.push(name), modVal && buildModPostfix(modName, modVal, buffer);
    }
    function buildElemClass(block, name, modName, modVal, buffer) {
        buildBlockClass(block, undefined, undefined, buffer), buffer.push(ELEM_DELIM, name), 
        modVal && buildModPostfix(modName, modVal, buffer);
    }
    var MOD_DELIM = "_", ELEM_DELIM = "__", NAME_PATTERN = "[a-zA-Z0-9-]+";
    BEM.INTERNAL = {
        NAME_PATTERN: NAME_PATTERN,
        MOD_DELIM: MOD_DELIM,
        ELEM_DELIM: ELEM_DELIM,
        buildModPostfix: function(modName, modVal, buffer) {
            var res = buffer || [];
            return buildModPostfix(modName, modVal, res), buffer ? res : res.join("");
        },
        buildClass: function(block, elem, modName, modVal, buffer) {
            var typeOf = typeof modName;
            if ("string" == typeOf ? "string" != typeof modVal && "number" != typeof modVal && (buffer = modVal, 
            modVal = modName, modName = elem, elem = undefined) : "undefined" != typeOf ? (buffer = modName, 
            modName = undefined) : elem && "string" != typeof elem && (buffer = elem, elem = undefined), 
            !(elem || modName || buffer)) return block;
            var res = buffer || [];
            return elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res), 
            buffer ? res : res.join("");
        },
        buildClasses: function(block, elem, mods, buffer) {
            elem && "string" != typeof elem && (buffer = mods, mods = elem, elem = undefined);
            var res = buffer || [];
            return elem ? buildElemClass(block, elem, undefined, undefined, res) : buildBlockClass(block, undefined, undefined, res), 
            mods && $.each(mods, function(modName, modVal) {
                modVal && (res.push(" "), elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res));
            }), buffer ? res : res.join("");
        }
    };
}(BEM, jQuery), jQuery.cookie = function(name, value, options) {
    if ("undefined" == typeof value) {
        var cookieValue = null;
        if (document.cookie && "" != document.cookie) for (var cookies = document.cookie.split(";"), i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) == name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
        return cookieValue;
    }
    options = options || {}, null === value && (value = "", options.expires = -1);
    var expires = "";
    if (options.expires && ("number" == typeof options.expires || options.expires.toUTCString)) {
        var date;
        "number" == typeof options.expires ? (date = new Date(), date.setTime(date.getTime() + 24 * options.expires * 60 * 60 * 1e3)) : date = options.expires, 
        expires = "; expires=" + date.toUTCString();
    }
    var path = options.path ? "; path=" + options.path : "", domain = options.domain ? "; domain=" + options.domain : "", secure = options.secure ? "; secure" : "";
    document.cookie = [ name, "=", encodeURIComponent(value), expires, path, domain, secure ].join("");
}, function($) {
    function convert(str) {
        return str = str.replace(/%.{2}/g, function($0) {
            return map[$0];
        });
    }
    function decode(func, str) {
        var decoded = "";
        try {
            decoded = func(str);
        } catch (e) {
            decoded = func(convert(str));
        }
        return decoded;
    }
    var map = {
        "%D0": "%D0%A0",
        "%C0": "%D0%90",
        "%C1": "%D0%91",
        "%C2": "%D0%92",
        "%C3": "%D0%93",
        "%C4": "%D0%94",
        "%C5": "%D0%95",
        "%A8": "%D0%81",
        "%C6": "%D0%96",
        "%C7": "%D0%97",
        "%C8": "%D0%98",
        "%C9": "%D0%99",
        "%CA": "%D0%9A",
        "%CB": "%D0%9B",
        "%CC": "%D0%9C",
        "%CD": "%D0%9D",
        "%CE": "%D0%9E",
        "%CF": "%D0%9F",
        "%D1": "%D0%A1",
        "%D2": "%D0%A2",
        "%D3": "%D0%A3",
        "%D4": "%D0%A4",
        "%D5": "%D0%A5",
        "%D6": "%D0%A6",
        "%D7": "%D0%A7",
        "%D8": "%D0%A8",
        "%D9": "%D0%A9",
        "%DA": "%D0%AA",
        "%DB": "%D0%AB",
        "%DC": "%D0%AC",
        "%DD": "%D0%AD",
        "%DE": "%D0%AE",
        "%DF": "%D0%AF",
        "%E0": "%D0%B0",
        "%E1": "%D0%B1",
        "%E2": "%D0%B2",
        "%E3": "%D0%B3",
        "%E4": "%D0%B4",
        "%E5": "%D0%B5",
        "%B8": "%D1%91",
        "%E6": "%D0%B6",
        "%E7": "%D0%B7",
        "%E8": "%D0%B8",
        "%E9": "%D0%B9",
        "%EA": "%D0%BA",
        "%EB": "%D0%BB",
        "%EC": "%D0%BC",
        "%ED": "%D0%BD",
        "%EE": "%D0%BE",
        "%EF": "%D0%BF",
        "%F0": "%D1%80",
        "%F1": "%D1%81",
        "%F2": "%D1%82",
        "%F3": "%D1%83",
        "%F4": "%D1%84",
        "%F5": "%D1%85",
        "%F6": "%D1%86",
        "%F7": "%D1%87",
        "%F8": "%D1%88",
        "%F9": "%D1%89",
        "%FA": "%D1%8A",
        "%FB": "%D1%8B",
        "%FC": "%D1%8C",
        "%FD": "%D1%8D",
        "%FE": "%D1%8E",
        "%FF": "%D1%8F"
    };
    $.extend({
        decodeURI: function(str) {
            return decode(decodeURI, str);
        },
        decodeURIComponent: function(str) {
            return decode(decodeURIComponent, str);
        }
    });
}(jQuery), function(BEM, $, undefined) {
    function addPropToDecl(decl, name, fn) {
        (decl[name] || (decl[name] = [])).unshift(fn);
    }
    function buildDeclFn(fn, desc) {
        return desc.modName ? function(ctx) {
            (ctx._curBlock.mods || {})[desc.modName] === desc.modVal && fn(ctx);
        } : fn;
    }
    function join(a, b) {
        var res, isArrayB = $.isArray(b);
        return $.isArray(a) ? isArrayB ? res = a.concat(b) : (res = a).push(b) : isArrayB ? (res = b).unshift(a) : res = [ a, b ], 
        res;
    }
    function escapeAttr(attrVal) {
        return attrVal.replace(attrEscapesRE, function(needToEscape) {
            return attrEscapes[needToEscape];
        });
    }
    var INTERNAL = BEM.INTERNAL, ELEM_DELIM = INTERNAL.ELEM_DELIM, SHORT_TAGS = {
        area: 1,
        base: 1,
        br: 1,
        col: 1,
        command: 1,
        embed: 1,
        hr: 1,
        img: 1,
        input: 1,
        keygen: 1,
        link: 1,
        meta: 1,
        param: 1,
        source: 1,
        wbr: 1
    }, buildClass = INTERNAL.buildClass, buildClasses = INTERNAL.buildClasses, decls = {}, attrEscapes = {
        '"': "&quot;",
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    }, attrEscapesRE = /["&<>]/g;
    BEM.HTML = {
        decl: function(desc, props) {
            "string" == typeof desc && (desc = {
                block: desc
            }), desc.name && (desc.block = desc.name);
            var decl = decls[desc.block] || (decls[desc.block] = {});
            props.onBlock && addPropToDecl(decl, "_block", buildDeclFn(props.onBlock, desc)), 
            props.onElem && ($.isFunction(props.onElem) ? addPropToDecl(decl, "_elem", buildDeclFn(props.onElem, desc)) : $.each(props.onElem, function(elem, fn) {
                addPropToDecl(decl, "_elem" + ("*" === elem ? "" : ELEM_DELIM + elem), buildDeclFn(fn, desc));
            }));
        },
        build: function(params) {
            var builder = new this.Ctx(params);
            return builder._buildAll(), builder._flush();
        },
        Ctx: $.inherit({
            __constructor: function(params) {
                this._buffer = [], this._params = params, this._tParams = null, this._tParamsChanges = null, 
                this._curBlock = undefined;
            },
            pos: function() {
                return this._params._pos;
            },
            isFirst: function() {
                return 1 === this._params._pos;
            },
            isLast: function() {
                var params = this._params;
                return params._pos === params._siblingsCount;
            },
            params: function(params) {
                var _this = this;
                return "undefined" == typeof params ? _this._params : (_this._params = params, _this);
            },
            param: function(name, val, force, needExtend) {
                var _this = this, params = _this._params;
                return "undefined" == typeof val ? params[name] : (!force && name in params ? needExtend && (params[name] = $.extend(val, params[name])) : params[name] = val, 
                _this);
            },
            attrs: function(val, force) {
                return this.param("attrs", val, force, !0);
            },
            attr: function(name, val, force) {
                var _this = this;
                if ("undefined" == typeof val) return (_this._params.attrs || {})[name];
                var attrs = _this._params.attrs;
                return attrs ? (force || !(name in attrs)) && (attrs[name] = val) : (_this._params.attrs = {})[name] = val, 
                _this;
            },
            tag: function(val, force) {
                return this.param("tag", val, force);
            },
            cls: function(val, force) {
                return this.param("cls", val, force);
            },
            mods: function(val, force) {
                return this.param("mods", val, force, !0);
            },
            mod: function(name, val, force) {
                var _this = this;
                if ("undefined" == typeof val) return (_this._params.mods || {})[name];
                var mods = _this._params.mods;
                return mods ? (force || !(name in mods)) && (mods[name] = val) : (_this._params.mods = {})[name] = val, 
                _this;
            },
            mix: function(val, force) {
                var _this = this, params = _this._params;
                return "undefined" == typeof val ? params.mix : (params.mix = !force && "mix" in params ? params.mix.concat(val) : val, 
                _this);
            },
            js: function(val) {
                return this.param("js", val);
            },
            content: function(val, force) {
                return this.param("content", val, force);
            },
            wrapContent: function(obj) {
                var _this = this, params = _this._params;
                return obj.content = params.content, params.content = obj, _this;
            },
            beforeContent: function(obj) {
                var _this = this, params = _this._params;
                return params.content = join(obj, params.content), _this;
            },
            afterContent: function(obj) {
                var _this = this, params = _this._params;
                return params.content = join(params.content, obj), _this;
            },
            wrap: function(obj) {
                var _this = this, params = _this._params;
                return obj.block || (obj._curBlock = _this._curBlock), obj.content = params._wrapper ? params._wrapper : params, 
                params._wrapper = obj, _this;
            },
            tParam: function(name, val) {
                var _this = this, tParams = _this._tParams || (_this._tParams = {});
                if ("undefined" == typeof val) return tParams[name];
                var tParamsChanges = _this._tParamsChanges || (_this._tParamsChanges = {});
                return name in tParamsChanges || (tParamsChanges[name] = tParams[name]), tParams[name] = val, 
                _this;
            },
            generateId: function() {
                return $.identify();
            },
            stop: function() {
                this._params._isStopped = !0;
            },
            _buildAll: function() {
                var _this = this, buffer = _this._buffer, params = _this._params, paramsType = typeof params;
                if ("string" == paramsType || "number" == paramsType) buffer.push(params); else if ($.isArray(params)) for (var currParams, currParamsType, i = 0, len = params.length; len > i; ) _this._params = currParams = params[i++], 
                currParamsType = typeof currParams, "string" == currParamsType || "number" == currParamsType ? buffer.push(currParams) : currParams && (currParams._pos = i, 
                currParams._siblingsCount = len, _this._buildByDecl()); else params && (_this._params._pos = _this._params._siblingsCount = 1, 
                _this._buildByDecl());
            },
            _build: function() {
                var jsParams, _this = this, buffer = _this._buffer, params = _this._params, tag = params.tag || "div", isBEM = params.block || params.elem, curBlock = isBEM && (params.block || _this._curBlock.block), addInitingCls = !1;
                params.js && ((jsParams = {})[buildClass(curBlock, params.elem)] = params.js === !0 ? {} : params.js, 
                addInitingCls = !params.elem), buffer.push("<", tag), (isBEM || params.cls) && (buffer.push(' class="'), 
                isBEM && (buildClasses(curBlock, params.elem, params.mods, buffer), params.mix && $.each(params.mix, function(i, mix) {
                    mix && (buffer.push(" "), buildClasses(mix.block, mix.elem, mix.mods, buffer), mix.js && ((jsParams || (jsParams = {}))[buildClass(mix.block, mix.elem)] = mix.js === !0 ? {} : mix.js, 
                    addInitingCls || (addInitingCls = !mix.elem)));
                })), params.cls && buffer.push(isBEM ? " " : "", params.cls), addInitingCls && buffer.push(" i-bem"), 
                buffer.push('"')), jsParams && buffer.push(' onclick="return ', escapeAttr(JSON.stringify(jsParams)), '"'), 
                params.attrs && $.each(params.attrs, function(name, val) {
                    "undefined" != typeof val && null !== val && val !== !1 && buffer.push(" ", name, '="', val.toString().replace(/"/g, "&quot;"), '"');
                }), SHORT_TAGS[tag] ? buffer.push("/>") : (buffer.push(">"), "undefined" != typeof params.content && (_this._params = params.content, 
                _this._buildAll()), buffer.push("</", tag, ">"));
            },
            _flush: function() {
                var res = this._buffer.join("");
                return delete this._buffer, res;
            },
            _buildByDecl: function() {
                var _this = this, currBlock = _this._curBlock, params = _this._params;
                if (params._curBlock && (_this._curBlock = params._curBlock), params.block && (_this._curBlock = params), 
                !params._wrapper) {
                    if (params.block || params.elem) {
                        var decl = decls[_this._curBlock.block];
                        if (decl) {
                            var fns;
                            if (params.elem ? (fns = decl["_elem" + ELEM_DELIM + params.elem], decl._elem && (fns = fns ? fns.concat(decl._elem) : decl._elem)) : fns = decl._block, 
                            fns) for (var fn, i = 0; (fn = fns[i++]) && (fn(_this), !params._isStopped); ) ;
                        }
                    }
                    if (params._wrapper) return params._curBlock = _this._curBlock, _this._params = params._wrapper, 
                    _this._buildAll();
                }
                var tParamsChanges = _this._tParamsChanges;
                if (_this._tParamsChanges = null, _this._build(), _this._curBlock = currBlock, tParamsChanges) {
                    var tParams = _this._tParams;
                    $.each(tParamsChanges, function(name, val) {
                        "undefined" == typeof val ? delete tParams[name] : tParams[name] = val;
                    });
                }
            }
        })
    };
}(BEM, jQuery), function(undefined) {
    if (!window.JSON) {
        var stringify, _toString = Object.prototype.toString, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, meta = {
            "\b": "\\b",
            "	": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            '"': '\\"',
            "\\": "\\\\"
        };
        window.JSON = {
            stringify: stringify = function(val) {
                if (null === val) return "null";
                if ("undefined" == typeof val) return undefined;
                switch (_toString.call(val)) {
                  case "[object String]":
                    return escapable.lastIndex = 0, '"' + (escapable.test(val) ? val.replace(escapable, function(a) {
                        var c = meta[a];
                        return "string" == typeof c ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                    }) : val) + '"';

                  case "[object Number]":
                  case "[object Boolean]":
                    return "" + val;

                  case "[object Array]":
                    for (var strVal, res = "[", i = 0, len = val.length; len > i; ) strVal = stringify(val[i]), 
                    res += (i++ ? "," : "") + ("undefined" == typeof strVal ? "null" : strVal);
                    return res + "]";

                  case "[object Object]":
                    if ("[object Function]" === _toString.call(val.toJSON)) return stringify(val.toJSON());
                    var strVal, res = "{", i = 0;
                    for (var key in val) val.hasOwnProperty(key) && (strVal = stringify(val[key]), "undefined" != typeof strVal && (res += (i++ ? "," : "") + '"' + key + '":' + strVal));
                    return res + "}";

                  default:
                    return undefined;
                }
            }
        };
    }
}(), function(BEM, $, undefined) {
    function init(domElem, uniqInitId) {
        var domNode = domElem[0];
        $.each(getParams(domNode), function(blockName, params) {
            processParams(params, domNode, blockName, uniqInitId);
            var block = uniqIdToBlock[params.uniqId];
            block ? block.domElem.index(domNode) < 0 && (block.domElem = block.domElem.add(domElem), 
            $.extend(block._params, params)) : initBlock(blockName, domElem, params);
        });
    }
    function initBlock(blockName, domElem, params, forceLive, callback) {
        "boolean" == typeof params && (callback = forceLive, forceLive = params, params = undefined);
        var domNode = domElem[0];
        params = processParams(params || getParams(domNode)[blockName], domNode, blockName);
        var uniqId = params.uniqId;
        if (uniqIdToBlock[uniqId]) return uniqIdToBlock[uniqId]._init();
        uniqIdToDomElems[uniqId] = uniqIdToDomElems[uniqId] ? uniqIdToDomElems[uniqId].add(domElem) : domElem;
        var parentDomNode = domNode.parentNode;
        parentDomNode && 11 !== parentDomNode.nodeType || $.unique(uniqIdToDomElems[uniqId]);
        var blockClass = blocks[blockName] || DOM.decl(blockName, {}, {
            live: !0
        });
        if (!(blockClass._liveInitable = !!blockClass._processLive()) || forceLive || params.live === !1) {
            var block = new blockClass(uniqIdToDomElems[uniqId], params, !!forceLive);
            return delete uniqIdToDomElems[uniqId], callback && callback.apply(block, Array.prototype.slice.call(arguments, 4)), 
            block;
        }
    }
    function processParams(params, domNode, blockName, uniqInitId) {
        (params || (params = {})).uniqId || (params.uniqId = (params.id ? blockName + "-id-" + params.id : $.identify()) + (uniqInitId || $.identify()));
        var domUniqId = $.identify(domNode), domParams = domElemToParams[domUniqId] || (domElemToParams[domUniqId] = {});
        return domParams[blockName] || (domParams[blockName] = params), params;
    }
    function findDomElem(ctx, selector, excludeSelf) {
        var res = ctx.find(selector);
        return excludeSelf ? res : res.add(ctx.filter(selector));
    }
    function getParams(domNode) {
        var uniqId = $.identify(domNode);
        return domElemToParams[uniqId] || (domElemToParams[uniqId] = extractParams(domNode));
    }
    function extractParams(domNode) {
        var fn = domNode.onclick || domNode.ondblclick;
        if (!fn && "body" == domNode.tagName.toLowerCase()) {
            var elem = $(domNode), attr = elem.attr("onclick") || elem.attr("ondblclick");
            attr && (fn = Function(attr));
        }
        return fn ? fn() : {};
    }
    function cleanupDomNode(domNode) {
        delete domElemToParams[$.identify(domNode)];
    }
    function removeDomNodeFromBlock(block, domNode) {
        1 === block.domElem.length ? block.destruct(!0) : block.domElem = block.domElem.not(domNode);
    }
    var win = $(window), doc = $(document), uniqIdToDomElems = {}, uniqIdToBlock = {}, domElemToParams = {}, liveEventCtxStorage = {}, liveClassEventStorage = {}, blocks = BEM.blocks, INTERNAL = BEM.INTERNAL, NAME_PATTERN = INTERNAL.NAME_PATTERN, MOD_DELIM = INTERNAL.MOD_DELIM, ELEM_DELIM = INTERNAL.ELEM_DELIM, buildModPostfix = INTERNAL.buildModPostfix, buildClass = INTERNAL.buildClass;
    $.fn.bem = function(blockName, params) {
        return initBlock(blockName, this, params, !0);
    };
    var DOM = BEM.DOM = BEM.decl("i-bem__dom", {
        __constructor: function(domElem, params, initImmediately) {
            var _this = this;
            _this.domElem = domElem, _this._eventNameCache = {}, _this._elemCache = {}, uniqIdToBlock[_this._uniqId = params.uniqId || $.identify(_this)] = _this, 
            _this._needSpecialUnbind = !1, _this.__base(null, params, initImmediately);
        },
        findBlocksInside: function(elem, block) {
            return this._findBlocks("find", elem, block);
        },
        findBlockInside: function(elem, block) {
            return this._findBlocks("find", elem, block, !0);
        },
        findBlocksOutside: function(elem, block) {
            return this._findBlocks("parents", elem, block);
        },
        findBlockOutside: function(elem, block) {
            return this._findBlocks("closest", elem, block)[0] || null;
        },
        findBlocksOn: function(elem, block) {
            return this._findBlocks("", elem, block);
        },
        findBlockOn: function(elem, block) {
            return this._findBlocks("", elem, block, !0);
        },
        _findBlocks: function(select, elem, block, onlyFirst) {
            block || (block = elem, elem = undefined);
            var ctxElem = elem ? "string" == typeof elem ? this.findElem(elem) : elem : this.domElem, isSimpleBlock = "string" == typeof block, blockName = isSimpleBlock ? block : block.block || block.blockName, selector = "." + (isSimpleBlock ? buildClass(blockName) : buildClass(blockName, block.modName, block.modVal)) + (onlyFirst ? ":first" : ""), domElems = ctxElem.filter(selector);
            if (select && (domElems = domElems.add(ctxElem[select](selector))), onlyFirst) return domElems[0] ? initBlock(blockName, domElems.eq(0), !0) : null;
            var res = [], uniqIds = {};
            return $.each(domElems, function(i, domElem) {
                var block = initBlock(blockName, $(domElem), !0);
                uniqIds[block._uniqId] || (uniqIds[block._uniqId] = !0, res.push(block));
            }), res;
        },
        bindToDomElem: function(domElem, event, fn) {
            var _this = this;
            return fn ? domElem.bind(_this._buildEventName(event), function(e) {
                return (e.data || (e.data = {})).domElem = $(this), fn.apply(_this, arguments);
            }) : $.each(event, function(event, fn) {
                _this.bindToDomElem(domElem, event, fn);
            }), _this;
        },
        bindToDoc: function(event, fn) {
            return this._needSpecialUnbind = !0, this.bindToDomElem(doc, event, fn);
        },
        bindToWin: function(event, fn) {
            var currentHeight, currentWidth, _fn = fn;
            return "resize" === event && (fn = function() {
                var height = win.height(), width = win.width();
                (currentHeight !== height || currentWidth !== width) && (currentHeight = height, 
                currentWidth = width, _fn.apply(this, arguments));
            }), this._needSpecialUnbind = !0, this.bindToDomElem(win, event, fn);
        },
        bindTo: function(elem, event, fn) {
            return !event || $.isFunction(event) ? (fn = event, event = elem, elem = this.domElem) : "string" == typeof elem && (elem = this.elem(elem)), 
            this.bindToDomElem(elem, event, fn);
        },
        unbindFromDomElem: function(domElem, event) {
            return domElem.unbind(this._buildEventName(event)), this;
        },
        unbindFromDoc: function(event) {
            return this.unbindFromDomElem(doc, event);
        },
        unbindFromWin: function(event) {
            return this.unbindFromDomElem(win, event);
        },
        unbindFrom: function(elem, event) {
            return event ? "string" == typeof elem && (elem = this.elem(elem)) : (event = elem, 
            elem = this.domElem), this.unbindFromDomElem(elem, event);
        },
        _buildEventName: function(event) {
            var _this = this;
            return event.indexOf(" ") > 1 ? event.split(" ").map(function(e) {
                return _this._buildOneEventName(e);
            }).join(" ") : _this._buildOneEventName(event);
        },
        _buildOneEventName: function(event) {
            var _this = this, eventNameCache = _this._eventNameCache;
            if (event in eventNameCache) return eventNameCache[event];
            var uniq = "." + _this._uniqId;
            if (event.indexOf(".") < 0) return eventNameCache[event] = event + uniq;
            var lego = ".bem_" + _this.__self._name;
            return eventNameCache[event] = event.split(".").map(function(e, i) {
                return 0 == i ? e + lego : lego + "_" + e;
            }).join("") + uniq;
        },
        trigger: function(e, data) {
            return this.__base(e = this.buildEvent(e), data).domElem && this._ctxTrigger(e, data), 
            this;
        },
        _ctxTrigger: function(e, data) {
            var _this = this, storage = liveEventCtxStorage[_this.__self._buildCtxEventName(e.type)], ctxIds = {};
            storage && _this.domElem.each(function() {
                for (var ctx = this, counter = storage.counter; ctx && counter; ) {
                    var ctxId = $.identify(ctx, !0);
                    if (ctxId) {
                        if (ctxIds[ctxId]) break;
                        var storageCtx = storage.ctxs[ctxId];
                        storageCtx && ($.each(storageCtx, function(uniqId, handler) {
                            handler.fn.call(handler.ctx || _this, e, data);
                        }), counter--), ctxIds[ctxId] = !0;
                    }
                    ctx = ctx.parentNode;
                }
            });
        },
        setMod: function(elem, modName, modVal) {
            if (elem && "undefined" != typeof modVal && elem.length > 1) {
                var _this = this;
                return elem.each(function() {
                    var item = $(this);
                    item.__bemElemName = elem.__bemElemName, _this.setMod(item, modName, modVal);
                }), _this;
            }
            return this.__base(elem, modName, modVal);
        },
        _extractModVal: function(modName, elem, elemName) {
            var matches, domNode = (elem || this.domElem)[0];
            return domNode && (matches = domNode.className.match(this.__self._buildModValRE(modName, elemName || elem))), 
            matches ? matches[2] : "";
        },
        _extractMods: function(modNames, elem) {
            var res = {}, extractAll = !modNames.length, countMatched = 0;
            return ((elem || this.domElem)[0].className.match(this.__self._buildModValRE("(" + (extractAll ? NAME_PATTERN : modNames.join("|")) + ")", elem, "g")) || []).forEach(function(className) {
                var iModVal = (className = className.trim()).lastIndexOf(MOD_DELIM), iModName = className.substr(0, iModVal - 1).lastIndexOf(MOD_DELIM);
                res[className.substr(iModName + 1, iModVal - iModName - 1)] = className.substr(iModVal + 1), 
                ++countMatched;
            }), countMatched < modNames.length && modNames.forEach(function(modName) {
                modName in res || (res[modName] = "");
            }), res;
        },
        _afterSetMod: function(modName, modVal, oldModVal, elem, elemName) {
            var _self = this.__self, classPrefix = _self._buildModClassPrefix(modName, elemName), classRE = _self._buildModValRE(modName, elemName), needDel = "" === modVal;
            (elem || this.domElem).each(function() {
                var className = this.className;
                className.indexOf(classPrefix) > -1 ? this.className = className.replace(classRE, needDel ? "" : "$1" + classPrefix + modVal) : needDel || $(this).addClass(classPrefix + modVal);
            }), elemName && this.dropElemCache(elemName, modName, oldModVal).dropElemCache(elemName, modName, modVal);
        },
        findElem: function(ctx, names, modName, modVal) {
            arguments.length % 2 ? (modVal = modName, modName = names, names = ctx, ctx = this.domElem) : "string" == typeof ctx && (ctx = this.findElem(ctx));
            var _self = this.__self, selector = "." + names.split(" ").map(function(name) {
                return buildClass(_self._name, name, modName, modVal);
            }).join(",.");
            return findDomElem(ctx, selector);
        },
        _elem: function(name, modName, modVal) {
            var res, key = name + buildModPostfix(modName, modVal);
            return (res = this._elemCache[key]) || (res = this._elemCache[key] = this.findElem(name, modName, modVal), 
            res.__bemElemName = name), res;
        },
        elem: function(names, modName, modVal) {
            if (modName && "string" != typeof modName) return modName.__bemElemName = names, 
            modName;
            if (names.indexOf(" ") < 0) return this._elem(names, modName, modVal);
            var res = $([]), _this = this;
            return names.split(" ").forEach(function(name) {
                res = res.add(_this._elem(name, modName, modVal));
            }), res;
        },
        dropElemCache: function(names, modName, modVal) {
            if (names) {
                var _this = this, modPostfix = buildModPostfix(modName, modVal);
                names.indexOf(" ") < 0 ? delete _this._elemCache[names + modPostfix] : names.split(" ").forEach(function(name) {
                    delete _this._elemCache[name + modPostfix];
                });
            } else this._elemCache = {};
            return this;
        },
        elemParams: function(elem) {
            var elemName;
            return "string" == typeof elem ? (elemName = elem, elem = this.elem(elem)) : elemName = this.__self._extractElemNameFrom(elem), 
            extractParams(elem[0])[buildClass(this.__self.getName(), elemName)] || {};
        },
        elemify: function(elem, elemName) {
            return (elem = $(elem)).__bemElemName = elemName, elem;
        },
        containsDomElem: function(domElem) {
            var res = !1;
            return this.domElem.each(function() {
                return !(res = domElem.parents().andSelf().index(this) > -1);
            }), res;
        },
        buildSelector: function(elem, modName, modVal) {
            return this.__self.buildSelector(elem, modName, modVal);
        },
        destruct: function(keepDOM) {
            var _this = this, _self = _this.__self;
            _this._isDestructing = !0, _this._needSpecialUnbind && _self.doc.add(_self.win).unbind("." + _this._uniqId), 
            _this.dropElemCache().domElem.each(function(i, domNode) {
                var params = getParams(domNode);
                $.each(params, function(blockName, blockParams) {
                    var block = uniqIdToBlock[blockParams.uniqId];
                    block ? block._isDestructing || (removeDomNodeFromBlock(block, domNode), delete params[blockName]) : delete uniqIdToDomElems[blockParams.uniqId];
                }), $.isEmptyObject(params) && cleanupDomNode(domNode);
            }), keepDOM || _this.domElem.remove(), delete uniqIdToBlock[_this.un()._uniqId], 
            delete _this.domElem, delete _this._elemCache, _this.__base();
        }
    }, {
        scope: null,
        doc: doc,
        win: win,
        _processLive: function(heedLive) {
            var _this = this, res = _this._liveInitable;
            if ("live" in _this) {
                var noLive = "undefined" == typeof res;
                noLive ^ heedLive && (res = _this.live() !== !1, _this.live = function() {});
            }
            return res;
        },
        init: function(ctx, callback, callbackCtx) {
            (!ctx || $.isFunction(ctx)) && (callbackCtx = callback, callback = ctx, ctx = doc);
            var uniqInitId = $.identify();
            return findDomElem(ctx, ".i-bem").each(function() {
                init($(this), uniqInitId);
            }), callback && this.afterCurrentEvent(function() {
                callback.call(callbackCtx || this, ctx);
            }), this._runAfterCurrentEventFns(), ctx;
        },
        destruct: function(keepDOM, ctx, excludeSelf) {
            "boolean" != typeof keepDOM && (excludeSelf = ctx, ctx = keepDOM, keepDOM = undefined), 
            findDomElem(ctx, ".i-bem", excludeSelf).each(function(i, domNode) {
                var params = getParams(this);
                $.each(params, function(blockName, blockParams) {
                    if (blockParams.uniqId) {
                        var block = uniqIdToBlock[blockParams.uniqId];
                        block ? (removeDomNodeFromBlock(block, domNode), delete params[blockName]) : delete uniqIdToDomElems[blockParams.uniqId];
                    }
                }), $.isEmptyObject(params) && cleanupDomNode(this);
            }), keepDOM || (excludeSelf ? ctx.empty() : ctx.remove());
        },
        update: function(ctx, content, callback, callbackCtx) {
            this.destruct(ctx, !0), this.init(ctx.html(content), callback, callbackCtx);
        },
        replace: function(ctx, content) {
            this.destruct(!0, ctx), this.init($(content).replaceAll(ctx));
        },
        append: function(ctx, content) {
            this.init($(content).appendTo(ctx));
        },
        prepend: function(ctx, content) {
            this.init($(content).prependTo(ctx));
        },
        before: function(ctx, content) {
            this.init($(content).insertBefore(ctx));
        },
        after: function(ctx, content) {
            this.init($(content).insertAfter(ctx));
        },
        _buildCtxEventName: function(e) {
            return this._name + ":" + e;
        },
        _liveClassBind: function(className, e, callback, invokeOnInit) {
            var _this = this;
            if (e.indexOf(" ") > -1) e.split(" ").forEach(function(e) {
                _this._liveClassBind(className, e, callback, invokeOnInit);
            }); else {
                var storage = liveClassEventStorage[e], uniqId = $.identify(callback);
                storage || (storage = liveClassEventStorage[e] = {}, doc.bind(e, _this.changeThis(_this._liveClassTrigger, _this))), 
                storage = storage[className] || (storage[className] = {
                    uniqIds: {},
                    fns: []
                }), uniqId in storage.uniqIds || (storage.fns.push({
                    uniqId: uniqId,
                    fn: _this._buildLiveEventFn(callback, invokeOnInit)
                }), storage.uniqIds[uniqId] = storage.fns.length - 1);
            }
            return this;
        },
        _liveClassUnbind: function(className, e, callback) {
            var storage = liveClassEventStorage[e];
            if (storage) if (callback) {
                if (storage = storage[className]) {
                    var uniqId = $.identify(callback);
                    if (uniqId in storage.uniqIds) {
                        var i = storage.uniqIds[uniqId], len = storage.fns.length - 1;
                        for (storage.fns.splice(i, 1); len > i; ) storage.uniqIds[storage.fns[i++].uniqId] = i - 1;
                        delete storage.uniqIds[uniqId];
                    }
                }
            } else delete storage[className];
            return this;
        },
        _liveClassTrigger: function(e) {
            var storage = liveClassEventStorage[e.type];
            if (storage) {
                var node = e.target, classNames = [];
                for (var className in storage) storage.hasOwnProperty(className) && classNames.push(className);
                do for (var nodeClassName = " " + node.className + " ", i = 0; className = classNames[i++]; ) if (nodeClassName.indexOf(" " + className + " ") > -1) {
                    for (var fn, j = 0, fns = storage[className].fns, stopPropagationAndPreventDefault = !1; fn = fns[j++]; ) fn.fn.call($(node), e) === !1 && (stopPropagationAndPreventDefault = !0);
                    if (stopPropagationAndPreventDefault && e.preventDefault(), stopPropagationAndPreventDefault || e.isPropagationStopped()) return;
                    classNames.splice(--i, 1);
                } while (classNames.length && (node = node.parentNode));
            }
        },
        _buildLiveEventFn: function(callback, invokeOnInit) {
            var _this = this;
            return function(e) {
                var args = [ _this._name, ((e.data || (e.data = {})).domElem = $(this)).closest(_this.buildSelector()), !0 ], block = initBlock.apply(null, invokeOnInit ? args.concat([ callback, e ]) : args);
                return block && !invokeOnInit && callback ? callback.apply(block, arguments) : void 0;
            };
        },
        liveInitOnEvent: function(elemName, event, callback) {
            return this.liveBindTo(elemName, event, callback, !0);
        },
        liveBindTo: function(to, event, callback, invokeOnInit) {
            (!event || $.isFunction(event)) && (callback = event, event = to, to = undefined), 
            to && "string" != typeof to || (to = {
                elem: to
            }), to.elemName && (to.elem = to.elemName);
            var _this = this;
            return to.elem && to.elem.indexOf(" ") > 0 ? (to.elem.split(" ").forEach(function(elem) {
                _this._liveClassBind(buildClass(_this._name, elem, to.modName, to.modVal), event, callback, invokeOnInit);
            }), _this) : _this._liveClassBind(buildClass(_this._name, to.elem, to.modName, to.modVal), event, callback, invokeOnInit);
        },
        liveUnbindFrom: function(elem, event, callback) {
            var _this = this;
            return elem.indexOf(" ") > 1 ? (elem.split(" ").forEach(function(elem) {
                _this._liveClassUnbind(buildClass(_this._name, elem), event, callback);
            }), _this) : _this._liveClassUnbind(buildClass(_this._name, elem), event, callback);
        },
        _liveInitOnBlockEvent: function(event, blockName, callback, findFnName) {
            var name = this._name;
            return blocks[blockName].on(event, function(e) {
                var args = arguments, blocks = e.block[findFnName](name);
                callback && blocks.forEach(function(block) {
                    callback.apply(block, args);
                });
            }), this;
        },
        liveInitOnBlockEvent: function(event, blockName, callback) {
            return this._liveInitOnBlockEvent(event, blockName, callback, "findBlocksOn");
        },
        liveInitOnBlockInsideEvent: function(event, blockName, callback) {
            return this._liveInitOnBlockEvent(event, blockName, callback, "findBlocksOutside");
        },
        liveInitOnBlockInit: function(blockName, callback) {
            return this.liveInitOnBlockEvent("init", blockName, callback);
        },
        liveInitOnBlockInsideInit: function(blockName, callback) {
            return this.liveInitOnBlockInsideEvent("init", blockName, callback);
        },
        on: function(ctx, e, data, fn, fnCtx) {
            return ctx.jquery ? this._liveCtxBind(ctx, e, data, fn, fnCtx) : this.__base(ctx, e, data, fn);
        },
        un: function(ctx, e, fn, fnCtx) {
            return ctx.jquery ? this._liveCtxUnbind(ctx, e, fn, fnCtx) : this.__base(ctx, e, fn);
        },
        liveCtxBind: function(ctx, e, data, fn, fnCtx) {
            return this._liveCtxBind(ctx, e, data, fn, fnCtx);
        },
        _liveCtxBind: function(ctx, e, data, fn, fnCtx) {
            var _this = this;
            if ("string" == typeof e) if ($.isFunction(data) && (fnCtx = fn, fn = data, data = undefined), 
            e.indexOf(" ") > -1) e.split(" ").forEach(function(e) {
                _this._liveCtxBind(ctx, e, data, fn, fnCtx);
            }); else {
                var ctxE = _this._buildCtxEventName(e), storage = liveEventCtxStorage[ctxE] || (liveEventCtxStorage[ctxE] = {
                    counter: 0,
                    ctxs: {}
                });
                ctx.each(function() {
                    var ctxId = $.identify(this), ctxStorage = storage.ctxs[ctxId];
                    ctxStorage || (ctxStorage = storage.ctxs[ctxId] = {}, ++storage.counter), ctxStorage[$.identify(fn) + (fnCtx ? $.identify(fnCtx) : "")] = {
                        fn: fn,
                        data: data,
                        ctx: fnCtx
                    };
                });
            } else $.each(e, function(e, fn) {
                _this._liveCtxBind(ctx, e, fn, data);
            });
            return _this;
        },
        liveCtxUnbind: function(ctx, e, fn, fnCtx) {
            return this._liveCtxUnbind(ctx, e, fn, fnCtx);
        },
        _liveCtxUnbind: function(ctx, e, fn, fnCtx) {
            var _this = this, storage = liveEventCtxStorage[e = _this._buildCtxEventName(e)];
            return storage && (ctx.each(function() {
                var ctxStorage, ctxId = $.identify(this, !0);
                ctxId && (ctxStorage = storage.ctxs[ctxId]) && (fn && delete ctxStorage[$.identify(fn) + (fnCtx ? $.identify(fnCtx) : "")], 
                (!fn || $.isEmptyObject(ctxStorage)) && (storage.counter--, delete storage.ctxs[ctxId]));
            }), storage.counter || delete liveEventCtxStorage[e]), _this;
        },
        _extractElemNameFrom: function(elem) {
            if (elem.__bemElemName) return elem.__bemElemName;
            var matches = elem[0].className.match(this._buildElemNameRE());
            return matches ? matches[1] : undefined;
        },
        extractParams: extractParams,
        _buildModClassPrefix: function(modName, elem) {
            return buildClass(this._name) + (elem ? ELEM_DELIM + ("string" == typeof elem ? elem : this._extractElemNameFrom(elem)) : "") + MOD_DELIM + modName + MOD_DELIM;
        },
        _buildModValRE: function(modName, elem, quantifiers) {
            return new RegExp("(\\s|^)" + this._buildModClassPrefix(modName, elem) + "(" + NAME_PATTERN + ")(?=\\s|$)", quantifiers);
        },
        _buildElemNameRE: function() {
            return new RegExp(this._name + ELEM_DELIM + "(" + NAME_PATTERN + ")(?:\\s|$)");
        },
        buildSelector: function(elem, modName, modVal) {
            return "." + buildClass(this._name, elem, modName, modVal);
        },
        getBlockByUniqId: function(uniqId) {
            return uniqIdToBlock[uniqId];
        },
        getWindowSize: function() {
            return {
                width: win.width(),
                height: win.height()
            };
        }
    });
    $(function() {
        BEM.DOM.scope = $("body");
    });
}(BEM, jQuery), function() {
    String.prototype.trim || (String.prototype.trim = function() {
        for (var str = this.replace(/^\s\s*/, ""), ws = /\s/, i = str.length; ws.test(str.charAt(--i)); ) ;
        return str.slice(0, i + 1);
    });
}(), function(Lego) {
    Lego || (Lego = window.Lego = {}), Lego.isSessionValid = function() {
        return !!Lego.getCookie("yandex_login");
    };
}(window.Lego), BEM.DOM.decl("i-global", {
    onSetMod: {
        js: function() {
            this.del(this.__self._params = $.extend({}, this.params), "uniqId", "name");
            var params = this.__self._params;
            params["passport-msg"] || (params["passport-msg"] = params.id), void 0 === params["show-counters"] && (params["show-counters"] = Math.round(100 * Math.random()) <= params["show-counters-percent"]), 
            params.locale = params.lang, $(function() {
                params.oframebust && Lego.oframebust(params.oframebust);
            });
        }
    },
    getDefaultParams: function() {
        return {
            id: "",
            login: Lego.isSessionValid() ? $.cookie("yandex_login") || "" : "",
            yandexuid: $.cookie("yandexuid"),
            lang: "ru",
            tld: "ru",
            retpath: encodeURI($.decodeURI(location.href)),
            "passport-host": "https://passport.yandex.ru",
            "pass-host": "//pass.yandex.ru",
            "social-host": "//social.yandex.ru",
            "lego-path": "/lego",
            "show-counters-percent": 100
        };
    }
}, {
    param: function(name) {
        return (this._params || {})[name];
    }
}), function(Lego) {
    function preparseHost(h) {
        return h.replace(/^(?:https?:)?\/\//, "");
    }
    Lego || (Lego = window.Lego = {}), !Lego.params && (Lego.params = {}), Lego.c = function(w, a, opts) {
        var host = preparseHost(opts && opts.host || BEM.blocks["i-global"].param("click-host") || "clck.yandex.ru"), url = function(w, h, t, a) {
            return h = h.replace("'", "%27"), h.indexOf("/dtype=") > -1 ? h : location.protocol + "//" + host + "/" + t + "/dtype=" + w + "/rnd=" + (new Date().getTime() + Math.round(100 * Math.random())) + (a ? "/*" + (h.match(/^http/) ? h : location.protocol + "//" + location.host + (h.match("^/") ? h : "/" + h)) : "/*data=" + encodeURIComponent("url=" + encodeURIComponent(h.match(/^http/) ? h : location.protocol + "//" + location.host + (h.match("^/") ? h : "/" + h))));
        }, click = function() {
            var head = document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0], script = document.createElement("script");
            script.setAttribute("src", url(w, location.href, "jclck")), head.insertBefore(script, head.firstChild);
        };
        if (a) if (a.className.match(/b-link_pseudo_yes/) || a.href && a.href.match(/^mailto:/) || opts && opts.noRedirect === !0) click(); else if (a.href) {
            var h = a.href;
            a.href = url(w, h, "redir"), setTimeout(function() {
                a.href = h;
            }, 500);
        } else if (a.form) if (a.type.match(/submit|button|image/)) {
            var h = a.form.action;
            a.form.action = url(w, h, "redir", !0), setTimeout(function() {
                a.form.action = h;
            }, 500);
        } else click(); else {
            if (!a.action) throw "counter.js: not link and not form!";
            a.action = url(w, a.action, "redir", !0);
        } else click();
    };
}(window.Lego), function(Lego) {
    Lego || (Lego = window.Lego = {}), Lego.cp = function(pi, ci, p, a, opts) {
        Lego.c("stred/pid=" + pi + "/cid=" + ci + (p ? "/path=" + p : ""), a, opts);
    };
}(window.Lego), function(Lego) {
    Lego || (Lego = window.Lego = {}), Lego.ch = function(p, a) {
        BEM.blocks["i-global"].param("show-counters") && Lego.cp(0, 2219, p, a);
    };
}(window.Lego), function(Lego) {
    Lego || (Lego = window.Lego = {}), Lego.getCookie = function(n) {
        var c = document.cookie;
        if (c.length < 1) return !1;
        var b = c.indexOf(n + "=");
        if (-1 == b) return !1;
        b += n.length + 1;
        var e = c.indexOf(";", b);
        return decodeURIComponent(-1 == e ? c.substring(b) : c.substring(b, e));
    };
}(window.Lego), function($, Lego) {
    Lego || (Lego = window.Lego = {}), Lego.init || (Lego.init = function(params) {
        return (params = Lego.params = $.extend({
            id: "",
            login: Lego.isSessionValid() ? Lego.getCookie("yandex_login") || "" : "",
            yandexuid: Lego.getCookie("yandexuid"),
            locale: "ru",
            retpath: window.location.toString(),
            "passport-host": "//passport.yandex.ru",
            "pass-host": "//pass.yandex.ru",
            "passport-msg": params.id,
            "social-host": "//social.yandex.ru",
            "lego-path": "/lego",
            "show-counters-percent": 100
        }, params, Lego.params))["show-counters"] = Math.round(100 * Math.random()) <= params["show-counters-percent"], 
        BEM.blocks["i-global"]._params || $.extend(BEM.blocks["i-global"]._params = {}, params), 
        $(function() {
            params.oframebust && Lego.oframebust(params.oframebust);
        }), params;
    }), Lego.block || (Lego.block = {}), Lego.blockInit || (Lego.blockInit = function(context, blockSelector) {
        context = context || document, blockSelector = blockSelector || ".g-js", $(context).find(blockSelector).each(function() {
            var block = $(this), params = this.onclick ? this.onclick() : {}, name = params.name || "", init = Lego.block[name];
            init && !block.data(name) && (init.call(block, params), block.data(name, !0).addClass(name + "_js_inited"));
        });
    }), Lego.blockInitBinded || (Lego.blockInitBinded = !!$(document).ready(function() {
        Lego.blockInit();
    }));
}(jQuery, window.Lego), function(Lego) {
    Lego || (Lego = window.Lego = {}), Lego.messages = Lego.messages || {}, Lego.message = function(id, text) {
        return "ru" == Lego.params.locale ? text : Lego.messages[id] || text;
    };
}(window.Lego), $(function() {
    BEM.DOM.init();
}), function(BEM, undefined) {
    function translate(key, params) {
        return params = params || {}, BEM.I18N("safebrowsing", key, params);
    }
    function checkPlatform() {
        window.elementsPlatform || (window.elementsPlatform = {
            queryObject: function() {
                return {};
            }
        });
    }
    window.btnClicked = !1, window.getBlockedURL = function() {
        return escapeHTML(decodeURIComponent(getParam("url") || getParam("u")));
    }, window.getBlockedDomain = function() {
        var link = document.createElement("a"), blockedURL = getBlockedURL();
        return link.setAttribute("href", blockedURL), link.hostname.replace(/(.{1})/g, "$1&#8203;") || blockedURL;
    }, window.getShortURL = function() {
        var url = getBlockedURL(), maxLength = 36;
        return url.length > maxLength ? url.substring(0, maxLength) + "…" : url;
    }, window.escapeHTML = function(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }, window.onPromoClick = function() {
        var closeWindowAfterPerform = (getYaBrowserParam() === YABROWSER_STATES.INSTALLED, 
        "firefox" === getBrowser());
        window.elementsPlatform.queryObject("yandexBrowserIntegration").performBrowser(), 
        closeWindowAfterPerform && window.close(), window.btnClicked = !0;
    }, window.safebrowsingConfig = {}, window.core = null, window.getPageType = function() {
        var type = getParam("type") || getParam("e");
        return type && "phishingBlocked" !== type || (type = "phishing"), "malwareBlocked" === type && (type = "malware"), 
        type || "phishing";
    }, window.YABROWSER_STATES = {
        DONT_SHOW_PROMO: 0,
        NOT_INSTALLED: 1,
        INSTALLED: 2
    }, window.getYaBrowserParam = function() {
        return elementsPlatform.queryObject("yandexBrowserIntegration").offerType || 0;
    }, window.getBrowser = function() {
        return $.browser.msie || navigator.userAgent.match(/Trident\/7\./) ? "ie" : "firefox";
    }, window.replaceURL = function(text, bemjson) {
        return bemjson.content = "$1", bemjson.tag = bemjson.tag || "a", text.replace(/%%(.*)%%/, BEMHTML.apply(bemjson));
    }, window.buildURL = function(target, ignoreParams) {
        return ignoreParams ? "bar:safebrowsing/" + target : "bar:safebrowsing/%target?type=%type&url=%url".replace("%target", target).replace("%type", getPageType()).replace("%url", getBlockedURL());
    }, window.getParams = function() {
        var searchArr, params = {};
        return searchArr = "firefox" === getBrowser() ? document.documentURI.split("?")[1].split("&") : location.search.substring(1).split("&"), 
        searchArr.forEach(function(str) {
            str = str.split("="), params[str[0]] = str[1];
        }), params;
    }, window.getParam = function() {
        var cache = {};
        return function(key, def) {
            if (cache[key]) return cache[key];
            var val = getParams()[key];
            return val && "string" == typeof val ? cache[key] = val : def !== undefined ? cache[key] = def : val || null;
        };
    }(), BEM.DOM.decl("b-page", {
        onSetMod: {
            js: function() {
                "ie" !== window.getBrowser() && this.drawContent();
            }
        },
        drawContent: function() {
            if (!this._drawn) {
                checkPlatform();
                var _this = this, ie78 = $.browser.msie && (-1 !== $.browser.version.indexOf("7") || -1 !== $.browser.version.indexOf("8"));
                this.afterCurrentEvent(function() {
                    var buttonLeave = _this.findBlockInside({
                        block: "button",
                        modName: "name",
                        modVal: "leave"
                    }), buttonIgnore = _this.findBlockInside({
                        block: "button",
                        modName: "name",
                        modVal: "ignore"
                    });
                    buttonLeave && (ie78 && buttonLeave.domElem.focus(), buttonLeave.domElem.attr("id", "getMeOutButton")), 
                    buttonIgnore && buttonIgnore.domElem.attr("id", "ignoreWarningButton");
                });
                var lang = window.elementsPlatform.language || getParam("lang") || navigator.language.split("-")[0] || "ru";
                BEM.I18N.lang(lang), document.title = translate("pageTitle"), this.setMod("logo", lang);
                var BEMJSON, type = getPageType(), yaBrowser = getYaBrowserParam();
                if ("loading" === type) this.setMod("color", "gray"), BEMJSON = [ {
                    block: "wrap",
                    content: {
                        block: "special-message",
                        content: [ {
                            block: "logo"
                        }, {
                            elem: "text-wrap",
                            content: [ {
                                elem: "title",
                                content: translate("loadingPageTitle")
                            }, {
                                block: "special-message",
                                elem: "desc-item",
                                content: [ {
                                    block: "spin",
                                    js: !0,
                                    mods: {
                                        progress: "yes",
                                        theme: "gray-48"
                                    }
                                }, {
                                    block: "special-message",
                                    elem: "desc-centered",
                                    content: translate("loadingPageFirstParagraph", {
                                        url: '<strong title="%url">%shortUrl</strong>'.replace("%url", getBlockedURL()).replace("%shortUrl", getShortURL())
                                    })
                                } ]
                            } ]
                        } ]
                    }
                } ]; else {
                    var mainTitle, subtitle, firstParagraph, secondParagraph, isFirefox = "firefox" === getBrowser();
                    "fraud" === type ? (mainTitle = translate("fraudPageTitle"), subtitle = translate("fraudPageSubtitle"), 
                    firstParagraph = translate("fraudPageFirstParagraph", {
                        url: '<strong title="%url">%shortUrl</strong>'.replace("%url", getBlockedURL()).replace("%shortUrl", getShortURL())
                    }), secondParagraph = {
                        block: "link",
                        content: translate("fraudPageSecondParagraph"),
                        url: buildURL("details")
                    }) : (mainTitle = translate("mainPageTitle", {
                        url: "<strong>" + getBlockedDomain() + "</strong>"
                    }), subtitle = translate("mainPageSubtitle"), firstParagraph = translate("mainPageFirstParagraph"), 
                    secondParagraph = replaceURL(translate("mainPageSecondParagraph"), {
                        block: "link",
                        tag: isFirefox ? "button" : "a",
                        attrs: {
                            onclick: "window.btnClicked = true; return true;",
                            href: buildURL("details"),
                            id: "reportButton"
                        },
                        js: !1
                    }));
                    var promo = null;
                    if (yaBrowser && yaBrowser !== YABROWSER_STATES.DONT_SHOW_PROMO && ("phishing" === type || "malware" === type || "fraud" === type)) {
                        var isInstalled = yaBrowser === YABROWSER_STATES.INSTALLED;
                        promo = {
                            block: "special-message",
                            mods: {
                                type: "promo"
                            },
                            content: [ {
                                elem: "shield"
                            }, {
                                elem: "text-wrap",
                                content: [ {
                                    elem: "browser-img"
                                }, {
                                    elem: "desc-item",
                                    elemMods: {
                                        width: "410"
                                    },
                                    content: translate("promoTextSafeYandexBrowser")
                                }, {
                                    elem: "browser-btn",
                                    content: {
                                        block: "button",
                                        mods: {
                                            theme: "action",
                                            name: "browser",
                                            size: "s",
                                            attention: "false"
                                        },
                                        content: translate(isInstalled ? "promoButtonWhenBrowserInstalled" : "promoButtonWhenBrowserNotInstalled")
                                    }
                                } ]
                            } ]
                        };
                    }
                    this.setMod("color", "red"), BEMJSON = [ {
                        block: "wrap",
                        content: [ {
                            block: "special-message",
                            content: [ {
                                block: "logo"
                            }, {
                                elem: "text-wrap",
                                content: [ {
                                    elem: "title",
                                    content: mainTitle
                                }, {
                                    elem: "title",
                                    mods: {
                                        last: "yes"
                                    },
                                    content: subtitle
                                }, {
                                    elem: "desc-item",
                                    content: firstParagraph
                                }, {
                                    elem: "desc-item",
                                    content: secondParagraph
                                } ]
                            }, {
                                elem: "action",
                                content: [ {
                                    block: "button",
                                    mods: {
                                        name: "leave",
                                        theme: "action",
                                        size: "s"
                                    },
                                    content: translate("leavePage")
                                }, " ", {
                                    block: "button",
                                    mods: {
                                        theme: "pseudo",
                                        name: "ignore",
                                        size: "s",
                                        attention: "false"
                                    },
                                    content: translate("ignoreWarning")
                                } ]
                            } ]
                        }, promo ]
                    } ];
                }
                this.domElem.html(BEMHTML.apply(BEMJSON)), this._drawn = !0, $(".special-message__browser-img").on("leftclick", onPromoClick), 
                $(".link_handle_click").on("click", function() {
                    var navigate = !window.btnClicked;
                    return window.btnClicked = !0, navigate;
                }), yaBrowser !== YABROWSER_STATES.DONT_SHOW_PROMO && window.elementsPlatform.sendMessage("browseroffer", {
                    command: "sendStat",
                    value: yaBrowser === YABROWSER_STATES.INSTALLED ? "addbbrun" : "addbbinstall"
                });
            }
        }
    });
}(BEM), window.onload = function() {
    $("body").bem("b-page").drawContent();
}, function(Lego) {
    Lego = Lego || {}, Lego.oframebustMatchDomain = function(whitelist, domain) {
        whitelist = "[object Array]" === Object.prototype.toString.call(whitelist) ? whitelist : function() {
            var arr = [];
            for (var k in whitelist) whitelist.hasOwnProperty(k) && arr.push(k);
            return arr;
        }();
        for (var i = 0, l = whitelist.length; l > i; i++) {
            var d = whitelist[i];
            if ("string" == typeof d) {
                if (/(\?|\*)/.test(d)) {
                    var re = d.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".{1}");
                    if (new RegExp("^" + re + "$").test(domain)) return !0;
                } else if (domain == d) return !0;
            } else try {
                if (d.test(domain)) return !0;
            } catch (e) {}
        }
    };
}(window.Lego), function(Lego) {
    Lego = Lego || {}, Lego.oframebust = function(whitelist) {
        if (window.top.location != window.location) {
            var match = document.referrer.match(/^https?:\/\/([^:\/\s]+)\/?.*/);
            if (!match) return;
            !Lego.oframebustMatchDomain(whitelist, match[1]) && (window.top.location = window.location);
        }
    };
}(window.Lego), BEM.DOM.decl("link", {
    onBlock: function(ctx) {
        ctx.tag("a").attr("href", ctx.param("url"));
        for (var p, props = [ "title", "target" ]; p = props.pop(); ) ctx.param(p) && ctx.attr(p, ctx.param(p));
    }
}), BEM.DOM.decl("spin", {
    getDefaultParams: function() {
        return {
            animation: this._propSupport("transform") ? "transform" : "sprite",
            startDelay: 0,
            frameAngle: 10,
            frameTime: 27,
            frames: 36
        };
    },
    onSetMod: {
        js: function() {
            this._size = parseInt(this.getMod("size") || /[\d]+/.exec(this.getMod("theme"))[0], 10), 
            this._height = this._size * this.params.frames, this._curFrame = 0, "transform" != this.params.animation && (this.setMod("support-transforms", "no"), 
            this._bgProp = "background-position", this._posPrefix = "0 -", this.elem("icon").css("background-poisition-y") && (this._bgProp += "-y", 
            this._posPrefix = "-")), this.hasMod("progress", "yes") && this._startSpin();
        },
        progress: {
            yes: function() {
                this._startSpin();
            },
            "": function() {
                this._stopSpin();
            }
        }
    },
    _startSpin: function() {
        this._delayTimeout = setTimeout(function() {
            this.hasMod("progress", "yes") && !this._interval && (this._interval = setInterval(this._onTick.bind(this), this.params.frameTime));
        }.bind(this), this.params.startDelay);
    },
    _stopSpin: function() {
        clearTimeout(this._delayTimeout), clearInterval(this._interval), this._interval = null;
    },
    _propSupport: function(prop) {
        for (var _prop, omPrefixes = [ "O", "Moz", "ms", "Webkit" ], ucProp = prop.charAt(0).toUpperCase() + prop.slice(1), props = (prop + " " + omPrefixes.join(ucProp + " ") + ucProp).split(" "), style = this.domElem[0].style; _prop = props.pop(); ) if ("undefined" != typeof style[_prop]) return !0;
        return !1;
    },
    _onTick: function() {
        var curFrame = ++this._curFrame, y = curFrame * this._size;
        if (y >= this._height && (this._curFrame = y = 0), "transform" == this.params.animation) {
            var rotateStr = "rotate(" + curFrame * this.params.frameAngle + "deg)";
            return void this.elem("icon").css({
                "-webkit-transform": rotateStr,
                "-moz-transform": rotateStr,
                "-ms-transform": rotateStr,
                "-o-transform": rotateStr,
                transform: rotateStr
            });
        }
        "sprite" == this.params.animation && this.elem("icon").css(this._bgProp, this._posPrefix + y + "px");
    },
    destruct: function() {
        this._stopSpin(), this.__base.apply(this, arguments);
    }
}), function() {
    var timer, counter = 0, isIdle = !1, idleInterval = 0, channel = BEM.channel("sys"), TICK_INTERVAL = 50;
    BEM.decl("i-system", {}, {
        start: function() {
            $(document).bind("mousemove keydown", function() {
                idleInterval = 0, isIdle && (isIdle = !1, channel.trigger("wakeup"));
            }), this._tick();
        },
        _tick: function() {
            var _this = this;
            channel.trigger("tick", {
                counter: counter++
            }), !isIdle && (idleInterval += TICK_INTERVAL) > 3e3 && (isIdle = !0, channel.trigger("idle")), 
            timer = setTimeout(function() {
                _this._tick();
            }, TICK_INTERVAL);
        }
    }).start();
}(), BEM.DOM.decl("wrap", {
    onSetMod: {
        js: function() {
            "loading" === getParam("type") && this.setMod("loading", "yes");
        }
    }
}), function($) {
    var leftClick = $.event.special.leftclick = {
        setup: function() {
            $(this).bind("click", leftClick.handler);
        },
        teardown: function() {
            $(this).unbind("click", leftClick.handler);
        },
        handler: function(e) {
            e.button || (e.type = "leftclick", $.event.handle.apply(this, arguments), e.type = "click");
        }
    };
}(jQuery), BEM.DOM.decl("button", {
    onSetMod: {
        js: function() {
            var disabled = this.isDisabled(), domElem = this.domElem;
            (this._href = domElem.attr("href")) && disabled && domElem.removeAttr("href");
        },
        disabled: function(modName, modVal) {
            var isDisabled = "yes" == modVal, domElem = this.domElem;
            this._href && (isDisabled ? domElem.removeAttr("href") : domElem.attr("href", this._href)), 
            this.afterCurrentEvent(function() {
                domElem.attr("disabled", isDisabled);
            });
        },
        pressed: function(modName, modVal) {
            return this.isDisabled() ? !1 : void this.trigger("yes" == modVal ? "press" : "release");
        }
    },
    isDisabled: function() {
        return this.hasMod("disabled", "yes");
    },
    url: function(val) {
        return "undefined" == typeof val ? this._href : (this._href = val, this.isDisabled() || this.domElem.attr("href", val), 
        this);
    }
}), BEM.DOM.decl("button", {
    onSetMod: {
        js: function() {
            this.__base.apply(this, arguments), this._control = this.elem("control").length && this.elem("control") || this.domElem;
        },
        focused: {
            yes: function() {
                return this.isDisabled() ? !1 : (this.bindToWin("unload", function() {
                    this.delMod("focused");
                }).bindTo("keydown", this._onKeyDown), this._isControlFocused() || this._control.focus(), 
                void this.afterCurrentEvent(function() {
                    this.trigger("focus");
                }));
            },
            "": function() {
                this.unbindFromWin("unload").unbindFrom("keydown"), this._isControlFocused() && this._control.blur(), 
                this.afterCurrentEvent(function() {
                    this.trigger("blur");
                });
            }
        },
        disabled: function(modName, modVal) {
            this.__base.apply(this, arguments), "yes" == modVal && this.domElem.keyup();
        },
        hovered: function(modName, modVal) {
            return this.isDisabled() ? !1 : void ("" === modVal && this.delMod("pressed"));
        },
        pressed: function() {
            return this.isDisabled() || this.setMod("focused", "yes"), this.__base.apply(this, arguments);
        }
    },
    _isControlFocused: function() {
        try {
            return this.containsDomElem($(this.__self.doc[0].activeElement));
        } catch (e) {
            return !1;
        }
    },
    _onKeyDown: function(e) {
        var keyCode = e.keyCode;
        13 != keyCode && 32 != keyCode || this._keyDowned || (this._keyDowned = !0, this.setMod("pressed", "yes").bindTo("keyup", function() {
            this.delMod("pressed").unbindFrom("keyup"), delete this._keyDowned, 32 == keyCode && this.domElem.attr("href") && (document.location = this.domElem.attr("href"));
        }));
    },
    _onClick: function(e) {
        this.isDisabled() ? e.preventDefault() : this.afterCurrentEvent(function() {
            this.trigger("click");
        });
    },
    destruct: function() {
        this.delMod("focused"), this.__base.apply(this, arguments);
    }
}, {
    live: function() {
        var eventsToMods = {
            mouseover: {
                name: "hovered",
                val: "yes"
            },
            mouseout: {
                name: "hovered"
            },
            mousedown: {
                name: "pressed",
                val: "yes"
            },
            mouseup: {
                name: "pressed"
            },
            focusin: {
                name: "focused",
                val: "yes"
            },
            focusout: {
                name: "focused"
            }
        };
        this.liveBindTo("leftclick", function(e) {
            this._onClick(e);
        }).liveBindTo("mouseover mouseout mouseup focusin focusout", function(e) {
            var mod = eventsToMods[e.type];
            this.setMod(mod.name, mod.val || "");
        }).liveBindTo("mousedown", function(e) {
            var mod = eventsToMods[e.type];
            1 == e.which && this.setMod(mod.name, mod.val || "");
        });
    }
}), function() {
    BEM.DOM.decl({
        block: "button",
        modName: "name",
        modVal: "leave"
    }, {
        _onClick: function() {
            if ("ie" === getBrowser()) {
                if (window.btnClicked) return;
                window.btnClicked = !0, window.location.href = buildURL("block", !0);
            }
        }
    }), BEM.DOM.decl({
        block: "button",
        modName: "name",
        modVal: "ignore"
    }, {
        _onClick: function() {
            if ("ie" === getBrowser()) {
                if (window.btnClicked) return;
                window.btnClicked = !0, window.location.href = buildURL("ignore", !0);
            }
        }
    }), BEM.DOM.decl({
        block: "button",
        modName: "name",
        modVal: "browser"
    }, {
        _onClick: onPromoClick
    });
}(), function(global_, bem_) {
    function bemName(decl) {
        return "string" == typeof decl && (decl = {
            block: decl
        }), decl.block + (decl.elem ? ELEM_DELIM + decl.elem : "") + (decl.modName ? MOD_DELIM + decl.modName + MOD_DELIM + decl.modVal : "");
    }
    function bemParse(name) {
        var bemitem = {};
        return name.split(ELEM_DELIM).forEach(function(item, i) {
            var keys = [ i ? "elem" : "block", "mod", "val" ];
            item.split(MOD_DELIM).forEach(function(part, j) {
                bemitem[keys[j]] = part;
            });
        }), bemitem;
    }
    function _pushStack(name) {
        return name ? stack.push(name) : !1;
    }
    function _popStack() {
        return stack.length && stack.pop();
    }
    function _i18n() {
        this._lang = "", this._prj = "lego", this._keyset = "", this._key = "";
    }
    if ("function" == typeof bem_.I18N && bem_.I18N._proto) return bem_.I18N;
    "undefined" == typeof i18n && (i18n = {}), BEM = bem_;
    var MOD_DELIM = "_", ELEM_DELIM = "__", DEFAULT_LANG = "ru", cache = {}, stack = [], log = "undefined" != typeof console && "function" == typeof console.log ? console.log.bind(console) : function() {};
    _i18n.prototype = {
        lang: function(name) {
            return this._lang = name, this;
        },
        project: function(name) {
            return this._prj = name, this;
        },
        keyset: function(name, saveCtx) {
            return saveCtx && _pushStack(this._keyset), this._keyset = bemName(name), this;
        },
        key: function(name) {
            return this._key = name, this;
        },
        decl: function(v) {
            var bemitem = bemParse(this._keyset), prj = "i-tanker" === bemitem.block ? "tanker" : this._prj, keyset = bemitem.elem || this._keyset, key = this._key;
            prj = i18n[prj] || (i18n[prj] = {}), keyset = prj[keyset] || (prj[keyset] = {}), 
            keyset[key] = "function" == typeof v ? v : function() {
                return v;
            };
            var l = cache[this._lang] || (cache[this._lang] = {}), k = l[this._keyset] || (l[this._keyset] = {});
            k[key] = v;
        },
        val: function(params, ctx) {
            var value = cache[this._lang] && cache[this._lang][this._keyset], debugString = "keyset: " + this._keyset + " key: " + this._key + " (lang: " + this._lang + ")";
            if (!value) return log("[I18N_NO_KEYSET] %s", debugString), "";
            value = value[this._key];
            var valtype = typeof value;
            return "undefined" === valtype ? (log("[I18N_NO_VALUE] %s", debugString), "") : "string" === valtype ? value : (ctx || (ctx = this), 
            value.call(ctx, params));
        },
        _cache: function() {
            return cache;
        }
    }, bem_.I18N = function(base) {
        var klass = function(keyset, key, params) {
            return klass.keyset(keyset).key(key, params);
        };
        return klass._proto = base, klass.project = function(name) {
            return this._proto.project(name), this;
        }, klass.keyset = function(name) {
            return this._proto.keyset(name, !0), this;
        }, klass.key = function(name, params) {
            var result, ksetRestored, proto = this._proto;
            return proto.lang(this._lang).key(name), result = proto.val.call(proto, params, klass), 
            ksetRestored = _popStack(), ksetRestored && proto.keyset(ksetRestored, !1), result;
        }, klass.decl = function(bemitem, keysets, params) {
            var k, proto = this._proto;
            params || (params = {}), params.lang && proto.lang(params.lang), proto.keyset(bemitem);
            for (k in keysets) keysets.hasOwnProperty(k) && proto.key(k).decl(keysets[k]);
            return this;
        }, klass.lang = function(lang) {
            return "undefined" != typeof lang && (this._lang = lang), this._lang;
        }, klass.lang(DEFAULT_LANG), klass;
    }(new _i18n());
}(this, "undefined" == typeof BEM ? {} : BEM), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return "При помощи " + params.url + " злоумышленники, возможно, списывают деньги со счетов мобильных телефонов. Это может происходить как по желанию владельцев сайта, так и без их ведома.";
    },
    fraudPageSecondParagraph: "Подробнее об смс-мошенничестве",
    fraudPageSubtitle: "По данным Яндекса, сайт может быть связан с смс-мошенничеством.",
    fraudPageTitle: "Осторожно!",
    ignoreWarning: "Игнорировать предупреждение",
    leavePage: "Уйти со страницы",
    loadingPageFirstParagraph: function(params) {
        return "Идёт проверка страницы " + params.url + " с помощью технологии Safe Browsing Яндекса. Подождите, пожалуйста.";
    },
    loadingPageTitle: "Проверка безопасности",
    mainPageFirstParagraph: "По нашей информации на странице сайта был размещен вредоносный код. Это могло произойти как по желанию владельцев сайта, так и без их ведома, в результате действий злоумышленников.",
    mainPageSecondParagraph: "Более подробную информацию об угрозе или безопасную копию сайта можно посмотреть на %%странице с полными данными о заражении%%.",
    mainPageSubtitle: "может угрожать безопасности вашего компьютера",
    mainPageTitle: function(params) {
        return "Сайт " + params.url;
    },
    pageTitle: "Сайт может угрожать безопасности вашего компьютера.",
    promoButtonWhenBrowserInstalled: "Узнать подробнее",
    promoButtonWhenBrowserNotInstalled: "Установить",
    promoTextSafeYandexBrowser: "Безопасный Яндекс.Браузер предупреждает об опасных сайтах и проверяет скаченные файлы антивирусом.",
    promoTextWhenBrowserInstalled: "У вас на компьютере уже установлен Яндекс.Браузер — он предупреждает при попытке зайти на опасные и мошеннические сайты, а также проверяет скачиваемые файлы встроенным антивирусом.",
    promoTextWhenBrowserNotInstalled: "Яндекс.Браузер предупреждает при попытке зайти на сайты, опасные для вашего компьютера, а также на страницы, связанные с смс-мошенничеством. А скачиваемые файлы проверяет встроенным антивирусом.",
    promoTitleWhenBrowserInstalled: "Переходите на более безопасный браузер",
    promoTitleWhenBrowserNotInstalled: "Попробуйте более безопасный браузер"
}, {
    lang: "ru"
}), BEM.I18N.lang("ru"), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return "З дапамогай " + params.url + " злачынцы, магчыма, спісваюць грошы з рахункаў мабільных тэлефонаў. Гэта можа адбывацца і ў адпаведнасці з жаданнем уладальнікаў сайта, і без іх ведання.";
    },
    fraudPageSecondParagraph: "Падрабязней пра смс-махлярства",
    fraudPageSubtitle: "Паводле звестак Яндекса, сайт можа быць звязаны з смс-махлярствам.",
    fraudPageTitle: "Асцярожна!",
    ignoreWarning: "Ігнараваць папярэджанне",
    leavePage: "Пакінуць старонку",
    loadingPageFirstParagraph: function(params) {
        return "Ідзе праверка старонкі " + params.url + " з дапамогай тэхналогіі Safe Browsing Яндекса. Пачакайце, калі ласка.";
    },
    loadingPageTitle: "Праверка бяспекі",
    mainPageFirstParagraph: "У нас ёсць інфармацыя, што на старонцы сайта быў размешчаны шкодніцкі код. Гэта магло адбыцца і ў адпаведнасці з жаданнем уладальнікаў сайта, і без іх ведання, у выніку дзеянняў злачынцаў.",
    mainPageSecondParagraph: "Больш падрабязную інфармацыю пра пагрозу або бяспечную копію сайта можна паглядзець на %%старонцы з поўнымі дадзенымі пра заражэнне%%.",
    mainPageSubtitle: "можа пагражаць бяспецы вашага камп'ютара",
    mainPageTitle: function(params) {
        return "Сайт " + params.url;
    },
    pageTitle: "Сайт можа пагражаць бяспецы вашага камп'ютара.",
    promoButtonWhenBrowserInstalled: "Даведацца падрабязней",
    promoButtonWhenBrowserNotInstalled: "Усталяваць",
    promoTextSafeYandexBrowser: "Бяспечны Яндекс.Браўзер папярэджвае пра небяспечныя сайты і правярае спампаваныя файлы антывірусам.",
    promoTextWhenBrowserInstalled: "У вас на камп'ютары ўжо ўсталяваны Яндекс.Браўзер — ён папярэджвае пры спробе зайсці на небяспечныя і махлярскія сайты, а таксама правярае спампаваныя файлы ўбудаваным антывірусам.",
    promoTextWhenBrowserNotInstalled: "Яндекс.Браўзер папярэджвае пры спробе зайсці на сайты, небяспечныя для вашага камп'ютара, а таксама на старонкі, звязаныя з смс-махлярствам. А спампаваныя файлы правярае ўбудаваным антывірусам.",
    promoTitleWhenBrowserInstalled: "Пераходзьце на больш бяспечны браўзер",
    promoTitleWhenBrowserNotInstalled: "Паспрабуйце больш бяспечны браўзер"
}, {
    lang: "be"
}), BEM.I18N.lang("be"), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return "Using " + params.url + ", fraudsters may deduct money from mobile telephone accounts. This may occur by site owners' wishes or without their knowledge.";
    },
    fraudPageSecondParagraph: "More details on SMS fraud",
    fraudPageSubtitle: "According to Yandex's information, the site may be linked to SMS fraud.",
    fraudPageTitle: "Warning!",
    ignoreWarning: "Ignore warning",
    leavePage: "Leave this page",
    loadingPageFirstParagraph: function(params) {
        return "Yandex Safe Browsing technology is checking " + params.url + ". Please wait.";
    },
    loadingPageTitle: "Safety check",
    mainPageFirstParagraph: "According to our information, a harmful code was placed on the webpage. The site's owners could have allowed this to happen or this could have happened without their knowledge as a result of hacker activities.",
    mainPageSecondParagraph: "You can read more detailed information about the threat or see a safe version of the site on the %%page with full information about the infection%%.",
    mainPageSubtitle: "it may threaten your computer's security",
    mainPageTitle: function(params) {
        return "Site " + params.url;
    },
    pageTitle: "This site may harm your computer.",
    promoButtonWhenBrowserInstalled: "Find out more",
    promoButtonWhenBrowserNotInstalled: "Install",
    promoTextSafeYandexBrowser: "Yandex.Browser warns you about dangerous sites and checks downloaded files using antivirus software.",
    promoTextWhenBrowserInstalled: "Yandex.Browser is already installed on your computer. It warns you when you try to visit unsafe or fraudulent sites and checks downloading files using built-in antivirus software.",
    promoTextWhenBrowserNotInstalled: "Yandex.Browser warns you when you try to visit sites that may harm your computer or that have been linked to SMS-fraud. Additionally, downloaded files  are checked using built-in antivirus software.",
    promoTitleWhenBrowserInstalled: "Switch to a safer browser",
    promoTitleWhenBrowserNotInstalled: "Please use a more secure browser"
}, {
    lang: "en"
}), BEM.I18N.lang("en"), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return "Зиянкестер " + params.url + " көмегімен мобильді телефондар шоттарынан ақша аударады. Бұл сайт иелері тілегі бойынша, сонымен бірге олардың рұқсатынсыз зиянкестердің әрекеті негізінде пайда болуы мүмкін.";
    },
    fraudPageSecondParagraph: "Смс-қарақшылық туралы толығырақ",
    fraudPageSubtitle: "Яндекс мәліметтері бойынша, сайт смс-қарақшылықпен байланысты болуы мүмкін.",
    fraudPageTitle: "Абайлаңыз!",
    ignoreWarning: "Ескертуді елемеу",
    leavePage: "Беттен шығу",
    loadingPageFirstParagraph: function(params) {
        return params.url + " бетін Яндекстің SafeBrowsing технологиясы тексеру жүргізуде. Күтіңіз.";
    },
    loadingPageTitle: "Қауіпсіздікті тексеру",
    mainPageFirstParagraph: "Білуімізше, сайт бетінде зарарлы код орналастырылған. Бұл сайт иелері тілегі бойынша, сонымен бірге олардың рұқсатынсыз зиянкестердің әрекеті негізінде пайда болуы мүмкін.",
    mainPageSecondParagraph: "Қауіп-қатер туралы ақпаратты немесе сайттың қауіпсіз көшірмесін %%зарарлану туралы толық мәліметтер бетінен%% көруге болады.",
    mainPageSubtitle: "компьютеріңіздің қауіпсіздігіне қатер төндіруі мүмкін",
    mainPageTitle: function(params) {
        return params.url + " сайты";
    },
    pageTitle: "Сайт компьютеріңіздің қауіпсіздігіне зиян келтіруі мүмкін.",
    promoButtonWhenBrowserInstalled: "Толығырақ білу",
    promoButtonWhenBrowserNotInstalled: "Орнату",
    promoTextSafeYandexBrowser: "Қауіпсіз Яндекс.Браузер қауіпті сайттар туралы ескертіп, жүктелген файлдарды антивируспен тексереді.",
    promoTextWhenBrowserInstalled: "Компьютеріңізде Яндекс.Браузер бұрыннан орнатулы — ол қауіпті және айлакерлік сайттарға кіру кезінде ескертіп, сонымен бірге жүктелетін файлдарды кірістірілген антивируспен тексереді.",
    promoTextWhenBrowserNotInstalled: "Яндекс.Браузер компьтеріңізге зиянды сайттарға, сонымен бірге смс-айлакерлікке байланысты беттерге кіру кезінде ескертеді. Ал жүктелетін файлдарды кірістірілген антивируспен тексереді.",
    promoTitleWhenBrowserInstalled: "Қауіпсіз браузерге өтіңіз",
    promoTitleWhenBrowserNotInstalled: "Қауіпсіз браузерді байқап көріңіз"
}, {
    lang: "kk"
}), BEM.I18N.lang("kk"), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return params.url + " yardımıyla kötü niyetli kişiler muhtemelen cep telefonu hesaplarından para alıyor olabilirler. Bu durum site sahibinin bilgisi dahilinde veya dışında gerçekleşmiş olabilir.";
    },
    fraudPageSecondParagraph: "SMS dolandırıcılığı ile ilgili ayrıntılı bilgi",
    fraudPageSubtitle: "Yandex'in verilerine göre sitede SMS dolandırıcılığı yapılıyor olabilir.",
    fraudPageTitle: "Dikkat!",
    ignoreWarning: "Uyarıyı yoksay",
    leavePage: "Sayfadan çık",
    loadingPageFirstParagraph: function(params) {
        return "Yandex Safe Browsing teknolojisini kullanarak " + params.url + " site sayfasının denetlemesi yapılıyor. Lütfen bekleyin.";
    },
    loadingPageTitle: "Güvenlik denetimi",
    mainPageFirstParagraph: "Elimizdeki verilere göre sayfada zararlı kod bulunuyor. Bu, site sahibinin bilgisi dahilinde yapılmış olabildiği gibi, kötü niyetli insanlar tarafından site sahibinin bilgisi olmadan da yapılmış olabilir.",
    mainPageSecondParagraph: "Doğabilecek tehlikeler hakkında ayrıntılı bilgi almak veya güvenli kopyayı görüntülemek için %%zararlı kod hakkında bilgileri içeren sayfayı%% inceleyin.",
    mainPageSubtitle: "bilgisayarınıza zarar verebilir",
    mainPageTitle: function(params) {
        return params.url + " sitesi";
    },
    pageTitle: "Bu site, bilgisayarınız için tehlike oluşturabilir.",
    promoButtonWhenBrowserInstalled: "Daha fazlasını öğren",
    promoButtonWhenBrowserNotInstalled: "Kur",
    promoTextSafeYandexBrowser: "Güvenli Yandex.Browser zararlı siteler ile ilgili sizi uyarır ve indirilen dosyaları antivirüs programı ile denetler.",
    promoTextWhenBrowserInstalled: "Bilgisayarınızda Yandex.Browser zaten kurulu; tehlikeli ve sahte sitelere girmeye çalıştığınızda sizi uyarır, ayrıca indirilen dosyaları dahili antivirüs programıyla denetler.",
    promoTextWhenBrowserNotInstalled: "Yandex.Browser, bilgisayarınız için tehlike oluşturabilecek sitelere ve SMS dolandırıcılığı ile ilgili olan sayfalara girmeye çalıştığınızda sizi uyarır. İndirilen dosyaları ise dahili antivirüs programıyla denetler.",
    promoTitleWhenBrowserInstalled: "Daha güvenli tarayıcıya geçin",
    promoTitleWhenBrowserNotInstalled: "Daha güvenli tarayıcı deneyin"
}, {
    lang: "tr"
}), BEM.I18N.lang("tr"), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return "За допомогою " + params.url + " зловмисники, можливо, списують кошти з рахунків мобільних телефонів. Це може відбуватися як за бажанням власників сайту, так і без їх відома.";
    },
    fraudPageSecondParagraph: "Докладніше про SMS-шахрайство",
    fraudPageSubtitle: "За даними Яндекса, сайт може бути пов'язаний із SMS-шахрайством.",
    fraudPageTitle: "Обережно!",
    ignoreWarning: "Ігнорувати попередження",
    leavePage: "Піти зі сторінки",
    loadingPageFirstParagraph: function(params) {
        return "Триває перевірка сторінки " + params.url + " за допомогою технології Safe Browsing Яндекса. Зачекайте, будь ласка.";
    },
    loadingPageTitle: "Перевірка безпеки",
    mainPageFirstParagraph: "За нашою інформацією, на сторінці сайту було розміщено шкідливий код. Це могло статися як за бажанням власників сайту, так і без їх відома, в результаті дій зловмисників.",
    mainPageSecondParagraph: "Докладнішу інформацію про загрозу або безпечну копію сайту можна подивитися на %%сторінці з повними даними про зараження%%.",
    mainPageSubtitle: "може загрожувати безпеці вашого комп'ютера",
    mainPageTitle: function(params) {
        return "Сайт " + params.url;
    },
    pageTitle: "Сайт може загрожувати безпеці вашого комп'ютера.",
    promoButtonWhenBrowserInstalled: "Дізнатися докладніше",
    promoButtonWhenBrowserNotInstalled: "Встановити",
    promoTextSafeYandexBrowser: "Безпечний Яндекс.Браузер попереджає про небезпечні веб-сайти і перевіряє завантажені файли антивірусом.",
    promoTextWhenBrowserInstalled: "У вас на комп'ютері вже інстальовано Яндекс.Браузер — він попереджає під час спроби зайти на небезпечні та шахрайські сайти, а також перевіряє завантажені файли вбудованим антивірусом.",
    promoTextWhenBrowserNotInstalled: "Яндекс.Браузер попереджає під час спроби зайти на сайти, небезпечні для вашого комп'ютера, а також на сторінки, пов'язані з SMS-шахрайством. А завантажувані файли перевіряє вбудованим антивірусом.",
    promoTitleWhenBrowserInstalled: "Переходьте на безпечніший браузер",
    promoTitleWhenBrowserNotInstalled: "Спробуйте безпечніший браузер"
}, {
    lang: "uk"
}), BEM.I18N.lang("uk"), BEM.I18N.decl("safebrowsing", {
    fraudPageFirstParagraph: function(params) {
        return "При помощи " + params.url + " злоумышленники, возможно, списывают деньги со счетов мобильных телефонов. Это может происходить как по желанию владельцев сайта, так и без их ведома.";
    },
    fraudPageSecondParagraph: "Подробнее об смс-мошенничестве",
    fraudPageSubtitle: "По данным Яндекса, сайт может быть связан с смс-мошенничеством.",
    fraudPageTitle: "Осторожно!",
    ignoreWarning: "Игнорировать предупреждение",
    leavePage: "Уйти со страницы",
    loadingPageFirstParagraph: function(params) {
        return "Идёт проверка страницы " + params.url + " с помощью технологии Safe Browsing Яндекса. Подождите, пожалуйста.";
    },
    loadingPageTitle: "Проверка безопасности",
    mainPageFirstParagraph: "По нашей информации на странице сайта был размещен вредоносный код. Это могло произойти как по желанию владельцев сайта, так и без их ведома, в результате действий злоумышленников.",
    mainPageSecondParagraph: "Более подробную информацию об угрозе или безопасную копию сайта можно посмотреть на %%странице с полными данными о заражении%%.",
    mainPageSubtitle: "может угрожать безопасности вашего компьютера",
    mainPageTitle: function(params) {
        return "Сайт " + params.url;
    },
    pageTitle: "Сайт может угрожать безопасности вашего компьютера.",
    promoButtonWhenBrowserInstalled: "Узнать подробнее",
    promoButtonWhenBrowserNotInstalled: "Nainstalovat",
    promoTextSafeYandexBrowser: "Безопасный Яндекс.Браузер предупреждает об опасных сайтах и проверяет скаченные файлы антивирусом.",
    promoTextWhenBrowserInstalled: "У вас на компьютере уже установлен Яндекс.Браузер — он предупреждает при попытке зайти на опасные и мошеннические сайты, а также проверяет скачиваемые файлы встроенным антивирусом.",
    promoTextWhenBrowserNotInstalled: "Яндекс.Браузер предупреждает при попытке зайти на сайты, опасные для вашего компьютера, а также на страницы, связанные с смс-мошенничеством. А скачиваемые файлы проверяет встроенным антивирусом.",
    promoTitleWhenBrowserInstalled: "Переходите на более безопасный браузер",
    promoTitleWhenBrowserNotInstalled: "Попробуйте более безопасный браузер"
}, {
    lang: "cs"
}), BEM.I18N.lang("cs"), $(function() {
    BEM.DOM.init();
});