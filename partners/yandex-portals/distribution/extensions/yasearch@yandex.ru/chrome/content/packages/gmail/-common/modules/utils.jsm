EXPORTED_SYMBOLS = ["module"];
var module = function (app, common, path) {
    var log = function (str, method) {
        common.log("-common.utils: " + str, method);
    };
    var logr = function (str, method) {
        common.logr("-common.utils: " + str, method);
    };
    function logObj(obj, str) {
        common.logObj(obj, "-common.utils: " + (str || ""));
    }
    var barAPI = common.api;
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    var Utils = {};
    Utils.copy = function (src, dest) {
        dest = dest || {};
        if (src) {
            for (var i in src) {
                if (src.hasOwnProperty(i)) {
                    dest[i] = src[i];
                }
            }
        }
        return dest;
    };
    Utils.getValue = function (obj, key) {
        if (!obj && !key) {
            return void 0;
        }
        var val = obj[key];
        while (val && typeof val == "string") {
            val = obj[val];
        }
        return val;
    };
    Utils.now = function () {
        return Math.floor(Date.now() / 1000);
    };
    Utils.isArray = function (obj) {
        return !!obj && !!obj.splice && Object.prototype.toString.call(obj) === "[object Array]";
    };
    Utils.isRegExp = function (obj) {
        return !!obj && !!obj.test && Object.prototype.toString.call(obj) === "[object RegExp]";
    };
    var decodeJS = function (str) {
        if (!str) {
            return "";
        }
        return str.replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\u([0-9a-f]{4})/gi, function (a, b) {
            return String.fromCharCode(parseInt(b, 16));
        });
    };
    var decodeXML = function (str) {
        if (!str) {
            return "";
        }
        return str.replace(/&#13;&#10;|&#10;&#13;|&#10;|&#13;/g, "\n").replace(/&#(\d+);/g, function (a, b) {
            return String.fromCharCode(parseInt(b, 10));
        }).replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "'").replace(/&amp;/g, "&");
    };
    function parseDTD(str, file) {
        if (!str) {
            return null;
        }
        var dict = {};
        var m, re = /<!ENTITY\s+([^>"]+)\s+"([^"]*)">/gm;
        while (m = re.exec(str)) {
            var val = decodeJS(m[2]);
            dict[m[1]] = {
                state: 0,
                v: val
            };
        }
        var rre = /&([^;"]+);/gm;
        function replaceFunc(a, b) {
            var r = dict[b];
            return r ? resolve(r) : a;
        }
        function resolve(r) {
            if (!r || r.state === 2) {
                return r.v;
            }
            if (r.state === 1) {
                throw "parse error: cycle";
            }
            r.state = 1;
            r.v = r.v.replace(rre, replaceFunc);
            r.state = 2;
            return r.v;
        }
        function getResolved(key) {
            var r = dict[key];
            if (!r || r.state === 2) {
                return r;
            }
            try {
                resolve(r);
            } catch (exc) {
                logr("dtd \"" + file + "\" error: cycle entity " + key, "error");
                r.v = "";
                r.text = "";
            }
            return r;
        }
        return {
            source: str,
            get: function (key) {
                var r = getResolved(key);
                return r ? r.v : "";
            },
            text: function (key) {
                var r = getResolved(key);
                if (!r) {
                    return "";
                }
                if (r.hasOwnProperty("text")) {
                    return r.text;
                }
                r.text = decodeXML(r.v);
                return r.text;
            }
        };
    }
    ;
    Utils.readFile = function (packagePath, format, noErrMsg) {
        var path = packagePath;
        if (!/^xb:/i.test(packagePath)) {
            path = common.resolvePath(path);
        }
        var data = "";
        try {
            if (format == "properties") {
                var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle(path);
                data = {
                    get: function (name) {
                        try {
                            return bundle.GetStringFromName(name);
                        } catch (ex) {
                            return "";
                        }
                    }
                };
            } else {
                var fileStream = barAPI.Package.getFileInputChannel(path).contentStream;
                data = barAPI.StrUtils.readStringFromStream(fileStream);
                fileStream.close();
            }
        } catch (exc) {
            if (!noErrMsg) {
                logr("error read file \"" + packagePath + "\"");
            }
            return null;
        }
        if (format == "json") {
            data = JSON.parse(data);
        }
        if (format == "xml") {
            data = common.utils.str2xml(data);
        }
        if (format == "dtd") {
            data = parseDTD(data, packagePath);
        }
        return data;
    };
    Utils.urlParams2Obj = function (urlParams, decode) {
        var res = {}, nodecode = decode === false;
        if (!urlParams || urlParams.length == 0) {
            return res;
        }
        var params = urlParams.split("&");
        for (var i = 0, l = params.length; i < l; ++i) {
            var kv = params[i].split("=");
            var key = kv[0], value = kv[1];
            key = nodecode ? key : Utils.decodeURIComponent(key);
            if (key) {
                res[key] = nodecode ? value : Utils.decodeURIComponent(value);
            }
        }
        return res;
    };
    Utils.obj2UrlParams = function (obj, encode) {
        var value = "", keyText, res = [], noencode = encode === false, keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        keys.sort();
        for (var key, i = 0, l = keys.length; i < l; ++i) {
            key = keys[i];
            value = noencode ? obj[key] : Utils.encodeURIComponent(obj[key]);
            keyText = noencode ? key : Utils.encodeURIComponent(key);
            res.push(keyText + "=" + value);
        }
        return res.join("&");
    };
    Utils.encodeURIComponent = function (str) {
        return encodeURIComponent(str).replace(/[!'\(\)\*]/g, function (x) {
            return "%" + ("0" + x.charCodeAt(0).toString(16)).slice(-2).toUpperCase();
        });
    };
    Utils.decodeURIComponent = function (str) {
        str = str || "";
        return decodeURIComponent(str.replace(/\+/g, "%20"));
    };
    var pluginHost = null;
    Utils.flashDetect = function () {
        if (!pluginHost) {
            pluginHost = Components.classes["@mozilla.org/plugin/host;1"].getService(Components.interfaces.nsIPluginHost);
        }
        return pluginHost.getPluginTags({}).some(function (plugin) {
            return plugin.name == "Shockwave Flash" && plugin.disabled !== true;
        });
    };
    Utils.bind = function (scope, funcs) {
        if (!scope || !funcs) {
            return funcs;
        }
        var r = {};
        for (var i in funcs) {
            if (funcs.hasOwnProperty(i)) {
                r[i] = funcs[i].bind(scope);
            }
        }
        return r;
    };
    Utils.xml2str = function (doc) {
        var ser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer);
        return ser.serializeToString(doc);
    };
    Utils.str2xml = function (s) {
        if (!s) {
            return null;
        }
        var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
        return parser.parseFromString(s, "text/xml");
    };
    var nsScriptableUnicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"];
    var nsIScriptableUnicodeConverter = Components.interfaces.nsIScriptableUnicodeConverter;
    var nsHash = Components.classes["@mozilla.org/security/hash;1"];
    var nsICryptoHash = Components.interfaces.nsICryptoHash;
    function dechex(number) {
        if (number < 0) {
            number = 4294967295 + number + 1;
        }
        return parseInt(number, 10).toString(16).toUpperCase();
    }
    function toHexString(charCode) {
        return ("0" + charCode.toString(16)).slice(-2);
    }
    var crc32table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
    var converterUTF8 = null;
    function UTF8Bytes(str) {
        if (!str) {
            return [];
        }
        if (!converterUTF8) {
            converterUTF8 = nsScriptableUnicodeConverter.createInstance(nsIScriptableUnicodeConverter);
            converterUTF8.charset = "UTF-8";
        }
        var result_converterUTF8 = {};
        return converterUTF8.convertToByteArray(str, result_converterUTF8);
    }
    var digest = function (algo, str) {
        var data = UTF8Bytes(str);
        var ch = nsHash.createInstance(nsICryptoHash);
        var init;
        switch (algo) {
        case "md5":
            init = ch.MD5;
            break;
        case "sha1":
            init = ch.SHA1;
            break;
        }
        ch.init(init);
        ch.update(data, data.length);
        var hash = ch.finish(false);
        var s = [];
        for (var i = 0, l = hash.length; i < l; ++i) {
            s.push(toHexString(hash.charCodeAt(i)));
        }
        return s.join("");
    };
    var str_pluralFunc = null;
    var strUtils = {
        utf8Bytes: UTF8Bytes,
        decodeJS: decodeJS,
        decodeXML: decodeXML,
        template: function (pattern, data) {
            return pattern && data ? pattern.replace(/\$(\w+)/g, function (entry, key) {
                return data.hasOwnProperty(key) ? data[key] : entry;
            }) : pattern || "";
        },
        getRandomString: function (length) {
            var code, result = Array(length || 1);
            for (var i = 0; i < length; ++i) {
                code = 48 + Math.floor(Math.random() * 62);
                if (code > 57)
                    code += 7;
                if (code > 90)
                    code += 6;
                result[i] = String.fromCharCode(code);
            }
            return result.join("");
        },
        pluralIndex: function (number) {
            return Number(strUtils.plural(number, "0;1;2;3;4;5;6;7;8;9"));
        },
        plural: function (number, forms) {
            if (!str_pluralFunc) {
                Components.utils.import("resource://gre/modules/PluralForm.jsm");
                var plural_rule = common._app.entities.get("plural.rule");
                if (plural_rule && /^\d\d?$/.test(plural_rule)) {
                    log("plural.rule = " + plural_rule);
                    var a = PluralForm.makeGetter(Number(plural_rule));
                    str_pluralFunc = a[0];
                } else {
                    str_pluralFunc = PluralForm.get;
                }
            }
            if (Utils.isArray(forms)) {
                var num = Math.min(strUtils.pluralIndex(number), forms.length - 1);
                return forms[num];
            }
            return str_pluralFunc(Number(number), forms);
        },
        md5: function (str) {
            return digest("md5", str);
        },
        sha1: function (str) {
            return digest("sha1", str);
        },
        toBase64: function (input) {
            return btoa(unescape(encodeURIComponent(input)));
        },
        fromBase64: function (input) {
            return decodeURIComponent(escape(atob(input)));
        },
        crc32: function (str, crc) {
            var x = 0, y = 0;
            str = UTF8Bytes(str);
            crc = (crc || 0) ^ -1;
            for (var i = 0, iTop = str.length; i < iTop; i++) {
                y = (crc ^ str[i]) & 255;
                x = parseInt("0x" + crc32table.substr(y * 9, 8), 16);
                crc = crc >>> 8 ^ x;
            }
            return dechex(crc ^ -1);
        }
    };
    var Async = {
        parallel: function async_parallel(tasks, concurrency, callback, scope, stopError) {
            if (typeof concurrency === "function") {
                stopError = scope;
                scope = callback;
                callback = concurrency;
                concurrency = 0;
            }
            let isNamedQueue = !Array.isArray(tasks);
            let tasksKeys = isNamedQueue ? Object.keys(tasks) : [];
            let resultsData = isNamedQueue ? {} : [];
            let tasksTotalNum = (isNamedQueue ? tasksKeys : tasks).length;
            if (!tasksTotalNum) {
                return callback.call(scope, null, resultsData);
            }
            let tasksProcessedNum = 0;
            let tasksBeingProcessed = 0;
            let taskIndex0 = 0;
            (function processTasks() {
                if (!callback || taskIndex0 >= tasksTotalNum || concurrency && concurrency <= tasksBeingProcessed) {
                    return;
                }
                let taskIndex = taskIndex0;
                ++taskIndex0;
                ++tasksBeingProcessed;
                tasks[taskIndex].call(scope, function (err, data) {
                    --tasksBeingProcessed;
                    if (!callback) {
                        return;
                    }
                    if (err && stopError) {
                        let originalCallback = callback;
                        callback = null;
                        return originalCallback.call(scope, err);
                    }
                    if (data !== void 0) {
                        resultsData[taskIndex] = data;
                    }
                    tasksProcessedNum += 1;
                    if (tasksProcessedNum === tasksTotalNum) {
                        return callback.call(scope, null, resultsData);
                    }
                    processTasks();
                });
                processTasks();
            }());
        },
        series: function async_series(tasks, callback, scope) {
            let isNamedQueue = !Array.isArray(tasks);
            let tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
            let resultsData = isNamedQueue ? {} : [];
            if (!tasksKeys.length)
                return callback.call(scope, null, resultsData);
            (function processTasks(numTasksProcessed) {
                if (numTasksProcessed === tasksKeys.length)
                    return callback.call(scope, null, resultsData);
                let taskIndex = isNamedQueue ? tasksKeys[numTasksProcessed] : numTasksProcessed;
                tasks[taskIndex].call(scope, function (err, data) {
                    if (err)
                        return callback.call(scope, err);
                    resultsData[taskIndex] = data;
                    processTasks(++numTasksProcessed);
                });
            }(0));
        },
        nextTick: function async_nextTick(callback) {
            var func = callback;
            if (arguments.length > 1) {
                var arr = arguments;
                func = function () {
                    return callback.call.apply(callback.call, arr);
                };
            }
            var currentThread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
            currentThread.dispatch({ "run": func }, Ci.nsIEventTarget.DISPATCH_NORMAL);
        }
    };
    var XML = {};
    XML.xml2str = function (doc) {
        var ser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer);
        return ser.serializeToString(doc);
    };
    XML.str2xml = function (s) {
        if (!s) {
            return null;
        }
        var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
        return parser.parseFromString(s, "text/xml");
    };
    XML.getValue = function (node, selector) {
        if (!node) {
            return "";
        }
        node = selector ? node.querySelector(selector) : node;
        return node ? node.textContent || "" : "";
    };
    XML.getAttr = function (node, selector, attr) {
        if (arguments.length < 3) {
            attr = selector;
            selector = null;
        }
        if (!node || !attr) {
            return "";
        }
        node = selector ? node.querySelector(selector) : node;
        return node ? node.getAttribute(attr) || "" : "";
    };
    XML.getAttrNS = function (node, selector, attr, ns) {
        if (arguments.length < 4) {
            ns = attr;
            attr = selector;
            selector = null;
        }
        if (!node || !attr || !ns) {
            return "";
        }
        node = selector ? node.querySelector(selector) : node;
        return node ? node.getAttributeNS(ns, attr) || "" : "";
    };
    var loginManager = {
        hasSavedLogins: function loginManager_hasSavedLogins(query) {
            return this.searchLogins(query).length;
        },
        searchLogins: function loginManager_searchLogins(query) {
            let logins;
            if ("hostnames" in query) {
                let hostnames = query.hostnames;
                delete query.hostnames;
                return hostnames.map(function (hostname) {
                    query.hostname = hostname;
                    return this.searchLogins(query);
                }, this).reduce(function (prev, el) {
                    return prev.concat(el);
                }, []);
            }
            let hostname = query.hostname || null;
            if (!hostname || /^https?:\/\//.test(hostname)) {
                logins = this._loginManager.searchLogins({}, this._newPropertyBag(query));
            } else {
                query.hostname = "https://" + hostname;
                logins = logins.concat(this._loginManager.searchLogins({}, this._newPropertyBag(query)));
                query.hostname = "http://" + hostname;
                logins = logins.concat(this._loginManager.searchLogins({}, this._newPropertyBag(query)));
            }
            if (query.formSubmitURL && !hostname) {
                logins = logins.filter(function (login) {
                    return !!login.formSubmitURL;
                });
            }
            return logins;
        },
        get _loginManager() {
            return Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
        },
        _newPropertyBag: function loginManager__newPropertyBag(properties) {
            let propertyBag = Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);
            if (properties) {
                for (let [
                            name,
                            value
                        ] in Iterator(properties)) {
                    propertyBag.setProperty(name, value);
                }
            }
            return propertyBag.QueryInterface(Ci.nsIPropertyBag).QueryInterface(Ci.nsIPropertyBag2).QueryInterface(Ci.nsIWritablePropertyBag2);
        }
    };
    common.utils = Utils;
    common.strUtils = strUtils;
    common.async = Async;
    common.xml = XML;
    common.loginManager = loginManager;
};
