(function (namespace) {
    "use strict";
    var util = namespace.ya_.util, json = namespace.ya_.json, ajax = namespace.ya_.ajax;
    var Doc = function (sid, url) {
        this.sid = sid;
        this.url = url;
        this.srv = "tr-url";
        this.trid = 0;
        this.rid = 0;
        this.defLang = "";
        this.state = 0;
        this.window = window;
        this.doc = document;
        this.model = null;
        this.listener = this;
        var loc = document.location;
        this.trUrl = loc.protocol + "//" + loc.host + "/tr.json";
        this.protocol = this.trUrl.indexOf(".json") >= 0 ? "json" : "xml";
        this.initTranslation("");
        this.bgThread = 0;
    };
    Doc.STATE_INIT = 0;
    Doc.STATE_LOAD_START = 1;
    Doc.STATE_LOAD_END = 2;
    Doc.STATE_TR_START = 3;
    Doc.STATE_TR_END = 4;
    Doc.STATE_UNLOAD = 5;
    Doc.STATE_INACCESSIBLE = 6;
    var ELEMENT_NODE = 1;
    var TEXT_NODE = 3;
    var SKIP_TAGS = {
        audio: 1,
        base: 1,
        canvas: 1,
        embed: 1,
        link: 1,
        meta: 1,
        noembed: 1,
        noscript: 1,
        object: 1,
        script: 1,
        style: 1,
        svg: 1,
        video: 1
    };
    var INPUT_TYPES = {
        button: 1,
        reset: 1,
        submit: 1
    };
    var FRAME_TAGS = {
        iframe: 1,
        frame: 1
    };
    var INLINE_TAGS = {
        a: 1,
        b: 1,
        font: 1,
        i: 1,
        img: 1,
        span: 1
    };
    var TEXT_ATTRS = {
        img: "alt",
        input: "value"
    };
    var ENTITY = {
        lt: "<",
        gt: ">",
        amp: "&",
        apos: "'",
        quot: "\""
    };
    var MAX_BLOCK_LEN = navigator.userAgent.indexOf("MSIE") >= 0 ? 300 : 600;
    var MAX_ITEMS = 20;
    var MAX_THREADS = 5;
    var LOAD_TIMEOUT = 7000;
    Doc.prototype.changeState = function (newState) {
        this.state = newState;
        this.listener.onStateChanged(this);
    };
    Doc.prototype.getState = function () {
        return this.state;
    };
    Doc.prototype.initTranslation = function (lang) {
        this.trid += 1;
        this.lang = lang;
        this.errCount = 0;
        this.counters = {
            allowErr: 5,
            good: 0,
            maxGood: 9
        };
        this.threads = 0;
    };
    Doc.prototype.setSrv = function (srv) {
        this.srv = srv;
    };
    Doc.prototype.undo = function () {
        this.initTranslation("");
        this.model.undo();
    };
    Doc.prototype.startTranslation = function (lang, bg) {
        TrUrl.attachDoc(this);
        var ref = this;
        this.defLang = lang;
        this.changeState(Doc.STATE_LOAD_START);
        var delayedStart = function () {
            setTimeout(function () {
                ref.translate("", bg);
            }, 1000);
        };
        this.doc.addEventListener("DOMContentLoaded", delayedStart, false);
        this.window.addEventListener("load", function () {
            ref.changeState(Doc.STATE_LOAD_END);
            delayedStart();
        }, false);
        this.window.addEventListener("unload", function () {
            ref.changeState(Doc.STATE_UNLOAD);
        }, false);
    };
    Doc.prototype.translate = function (lang, bg) {
        lang = lang || this.defLang;
        if (!lang || /^(\w+)-\1$/.test(lang)) {
            return;
        }
        if (lang == this.lang && !this.errCount) {
            return;
        }
        this.initTranslation(lang);
        this.changeState(Doc.STATE_TR_START);
        this.listener.onProgressChanged(0);
        this.model = new Model(this);
        this.model.setLang(this.lang);
        this.model.update();
        this.content = this.model.content;
        this.startThreads();
        if (bg) {
            this.bg();
        }
    };
    Doc.prototype.update = function () {
        if (!this.lang || !this.model.update()) {
            return;
        }
        this.initTranslation(this.lang);
        this.content = this.model.content;
        this.startThreads();
    };
    Doc.prototype.startThreads = function () {
        var ref = this, trid = this.trid, i;
        var translate = function () {
            ref.doTranslate(ref.model, trid);
        };
        for (i = 0; i < MAX_THREADS; ++i) {
            setTimeout(translate, 0);
        }
    };
    Doc.prototype.bg = function () {
        var ref = this;
        if (!this.bgThread) {
            this.bgThread = setInterval(function () {
                ref.onIdle();
            }, 1000);
        }
    };
    Doc.prototype.onIdle = function () {
        if (this.lang && this.state == Doc.STATE_TR_END) {
            this.update();
        }
    };
    function getChunkLen(chunk) {
        var len = 0, i;
        for (i = 0; i < chunk.length; ++i) {
            len += chunk[i].text.length;
        }
        return len;
    }
    function isChunkTranslated(chunk) {
        var i = 0;
        while (i < chunk.length && chunk[i].tr) {
            ++i;
        }
        return i == chunk.length;
    }
    Doc.prototype.doTranslate = function (obj, trid) {
        if (this.trid != trid) {
            return;
        }
        var text = [], textLen = 0, startIndex = obj.index;
        var chunks = obj.content, i, n = chunks.length, chunk, span;
        for (i = startIndex; i < n && isChunkTranslated(chunks[i]); ++i) {
            this.model.skipTranslated(chunks[i]);
        }
        obj.index = startIndex = i;
        for (i = startIndex; i < n && text.length < MAX_ITEMS; ++i) {
            chunk = chunks[i];
            span = chunk[0];
            if (i == startIndex && span.content) {
                ++obj.index;
                span.index = 0;
                this.doTranslate(span, trid);
                return;
            }
            textLen += getChunkLen(chunk);
            if (i > startIndex && textLen > MAX_BLOCK_LEN || span.content || isChunkTranslated(chunk)) {
                break;
            }
            text.push(chunk);
        }
        obj.index = i;
        if (text.length) {
            this.translateArray(obj, startIndex, text);
            return;
        }
        if (obj != this.model) {
            this.doTranslate(this.model, trid);
            return;
        }
        if (++this.threads == MAX_THREADS) {
            this.changeState(Doc.STATE_TR_END);
        }
    };
    Doc.prototype.translateArray = function (obj, index, textArr) {
        var ref = this;
        var text = [], i, j, html, chunk;
        for (i = 0; i < textArr.length; ++i) {
            html = "";
            chunk = textArr[i];
            for (j = 0; j < chunk.length; ++j) {
                if (j) {
                    html += "<wbr/>";
                }
                html += util.htmlEncode(chunk[j].text);
            }
            text[i] = html;
        }
        var args = {
            lang: this.lang,
            format: "html",
            text: text,
            srv: this.srv,
            id: this.sid + "-" + this.rid++
        };
        var query = {
            args: args,
            url: this.trUrl + "/translateArray",
            method: "POST",
            callback: function (result, error) {
                ref.onResponse(query, result, error);
            },
            obj: obj,
            index: index,
            trid: this.trid
        };
        var firstItem = textArr[0][0];
        if (firstItem.length > MAX_BLOCK_LEN) {
            this.onResult(query, textArr);
            return;
        }
        this.sendQuery(query);
    };
    Doc.prototype.sendQuery = function (query) {
        if (this.protocol == "xml") {
            ajax.sendQuery(query);
        } else {
            json.sendQuery(query);
        }
    };
    Doc.prototype.onProgressChanged = Doc.prototype.onStateChanged = Doc.prototype.onError = function () {
        return undefined;
    };
    Doc.prototype.onLoadDoc = function (doc) {
        doc.setListener(this);
    };
    Doc.prototype.onReady = function () {
        var ref = this;
        var lastNode = this.getLastNode();
        setTimeout(function () {
            if (ref.getLastNode() == lastNode) {
                ref.translate();
            }
        }, 1000);
    };
    Doc.prototype.onResult = function (query, textArr) {
        var ref = this, trid = this.trid;
        this.model.setTranslation(query.obj, query.index, textArr);
        var progress = Math.floor(this.model.trTextLen * 100 / this.model.textLen + 0.5);
        this.listener.onProgressChanged(progress);
        setTimeout(function () {
            ref.doTranslate(query.obj, trid);
        }, 1);
    };
    Doc.prototype.onResponse = function (query, result, error) {
        if (this.trid != query.trid) {
            return;
        }
        var c = this.counters;
        if (error) {
            if (--c.allowErr >= 0) {
                this.sendQuery(query);
            } else if (++this.errCount == 1) {
                this.listener.onError(error);
            }
            return;
        }
        if (++c.good >= c.maxGood) {
            ++c.allowErr;
            c.good = 0;
        }
        var text = [], i, j, chunk, nodes, textNode, textArr;
        if (this.protocol == "xml") {
            nodes = result.responseXML.getElementsByTagName("string");
            for (i = 0; i < nodes.length; ++i) {
                textNode = nodes[i].firstChild;
                text.push(textNode ? textNode.nodeValue : "");
            }
        } else {
            text = result;
        }
        textArr = [];
        for (i = 0; i < text.length; ++i) {
            chunk = text[i].split(/<wbr\s?\/>/);
            for (j = 0; j < chunk.length; ++j) {
                chunk[j] = Doc.htmlDecode(chunk[j]);
            }
            textArr[i] = chunk;
        }
        this.onResult(query, textArr);
    };
    Doc.htmlDecode = function (html) {
        var result = "", pos, entity;
        for (;;) {
            pos = html.indexOf("&");
            if (pos < 0) {
                result += html;
                break;
            }
            result += html.substr(0, pos);
            html = html.substr(pos + 1);
            pos = html.indexOf(";");
            if (pos < 0) {
                pos = html.length;
            }
            entity = html.substr(0, pos);
            result += ENTITY[entity] || "?";
            html = html.substr(pos + 1);
        }
        return result;
    };
    Doc.prototype.getLocation = function () {
        return this.doc.location;
    };
    Doc.prototype.setListener = function (listener) {
        this.listener = listener;
    };
    Doc.prototype.getLastNode = function () {
        var node = this.doc.documentElement;
        while (node.lastChild) {
            node = node.lastChild;
        }
        return node;
    };
    function TrDic() {
        this.map = {};
    }
    TrDic.prototype.addSpan = function (span) {
        this.getList(span.tr, true).push(span);
    };
    TrDic.prototype.findSpan = function (text, node) {
        var list = this.getList(text), i;
        if (list) {
            for (i = 0; i < list.length; ++i) {
                if (list[i].node == node) {
                    return list[i];
                }
            }
        }
        return null;
    };
    TrDic.prototype.getList = function (text, doAdd) {
        var list = null;
        if (this.map.hasOwnProperty(text)) {
            list = this.map[text];
        } else if (doAdd) {
            list = [];
            this.map[text] = list;
        }
        return list;
    };
    function Model(doc) {
        this.doc = doc.doc;
        this.lang = "";
        this.dir = "";
        this.reset();
    }
    Doc.Model = Model;
    Model.prototype.reset = function () {
        this.content = [];
        this.prev = null;
        this.textLen = this.trTextLen = 0;
        this.isDirty = false;
        this.index = 0;
    };
    Model.prototype.setLang = function (lang) {
        if (lang == this.lang) {
            return;
        }
        this.undo();
        this.lang = lang;
        var langs = lang.split("-");
        var fromLang = langs[0], toLang = langs[1];
        if (util.getDirection(fromLang) != util.getDirection(toLang)) {
            this.dir = util.getDirection(toLang);
        }
    };
    function setNodeValue(node, value) {
        try {
            node.nodeValue = value;
        } catch (ignore) {
        }
    }
    Model.prototype.undo = function () {
        this.lang = this.dir = "";
        this.textLen = this.trTextLen = 0;
        var i, j, chunk, chunks = this.content;
        for (i = 0; i < chunks.length; ++i) {
            chunk = chunks[i];
            for (j = 0; j < chunk.length; ++j) {
                setNodeValue(chunk[j].node, chunk[j].text);
            }
        }
        this.reset();
    };
    Model.prototype.update = function () {
        var prev = this.prev || Model.getRefs(this.content);
        this.reset();
        this.prev = prev;
        this.visit(this.doc.documentElement, [], true);
        this.breakChunks();
        var result = this.isDirty;
        if (this.isDirty) {
            this.prev = null;
        }
        this.isDirty = false;
        return result;
    };
    Model.getRefs = function (content) {
        var refs = new TrDic(), i, j, chunk;
        for (i = 0; i < content.length; ++i) {
            chunk = content[i];
            for (j = 0; j < chunk.length; ++j) {
                refs.addSpan(chunk[j]);
            }
        }
        return refs;
    };
    Model.prototype.visit = function (node, chunk, translationMode) {
        if (!node) {
            return;
        }
        if (node.nodeType == TEXT_NODE) {
            if (translationMode) {
                chunk.push(node);
            }
        } else if (node.nodeType == ELEMENT_NODE) {
            var tagName = node.tagName.toLowerCase();
            if (SKIP_TAGS[tagName] || node.className.indexOf("notranslate") >= 0) {
                chunk.push("|");
                return;
            }
            var trAttr = node.getAttribute("translate");
            if (trAttr) {
                translationMode = trAttr == "yes";
            }
            this.visitAttrs(node, translationMode);
            var isDiv = !INLINE_TAGS[tagName], child;
            if (isDiv) {
                chunk.push("|");
                chunk = [];
            }
            for (child = node.firstChild; child; child = child.nextSibling) {
                this.visit(child, chunk, translationMode);
            }
            if (isDiv) {
                this.addChunk(chunk);
            }
            if (FRAME_TAGS[tagName] && translationMode) {
                this.visitFrame(node);
            }
        }
    };
    Model.prototype.visitAttrs = function (node, translationMode) {
        if (!translationMode) {
            return;
        }
        if (this.dir) {
            node.style.direction = this.dir;
        }
        var tagName = node.tagName.toLowerCase();
        if (tagName == "input" && !INPUT_TYPES[node.type]) {
            return;
        }
        var textAttrs = ["title"], i, attr, attrName = TEXT_ATTRS[tagName];
        if (attrName) {
            textAttrs.push(attrName);
        }
        for (i = 0; i < textAttrs.length; ++i) {
            attr = node.getAttributeNode(textAttrs[i]);
            if (attr) {
                this.addChunk([attr]);
            }
        }
    };
    Model.prototype.visitFrame = function (node) {
        var frameSrc = node.getAttribute("src");
        if ((!frameSrc || /\s*about:blank\s*/i.test(frameSrc)) && node.contentWindow) {
            try {
                this.visit(node.contentWindow.document.body, [], true);
            } catch (ignore) {
            }
        }
    };
    function normalizeSpaces(node, str) {
        if (node.nodeType != TEXT_NODE || node.parentNode.tagName.toLowerCase() == "pre") {
            return str;
        }
        return str.replace(/\s+/gm, " ");
    }
    Model.hasText = function (str) {
        var i, code;
        for (i = 0; i < str.length; ++i) {
            code = str.charCodeAt(i);
            if (code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 256) {
                return true;
            }
        }
        return false;
    };
    Model.prototype.addChunk = function (chunk) {
        var i, j, n, start, nodes, node, span, str, textLen, isText, isDirty;
        for (i = 0, n = chunk.length; i < n; ++i) {
            start = i;
            while (i < n && chunk[i] != "|") {
                ++i;
            }
            nodes = [];
            textLen = 0;
            isText = false;
            isDirty = false;
            for (j = start; j < i; ++j) {
                node = chunk[j];
                str = node.nodeValue;
                if (!str || /^\s+$/.test(str)) {
                    continue;
                }
                str = normalizeSpaces(node, str);
                span = this.prev.findSpan(str, node);
                if (!span) {
                    span = {
                        node: node,
                        text: str
                    };
                    isDirty = true;
                }
                nodes.push(span);
                textLen += span.text.length;
                isText = isText || Model.hasText(span.text);
            }
            if (isText) {
                this.content.push(nodes);
                this.textLen += textLen;
                this.isDirty = this.isDirty || isDirty;
            }
        }
    };
    Model.prototype.breakChunks = function () {
        var chunks = this.content;
        var i, j, k, textLen, chunk, prev, next, parent, blocks;
        for (i = 0; i < chunks.length; ++i) {
            chunk = chunks[i];
            textLen = 0;
            for (j = 0; j < chunk.length; ++j) {
                textLen += chunk[j].text.length;
                if (textLen <= MAX_BLOCK_LEN) {
                    continue;
                }
                if (j) {
                    prev = chunk.splice(0, j);
                    chunks.splice(i, 0, prev);
                    i += 1;
                    j = -1;
                    textLen = 0;
                    continue;
                }
                if (chunk.length > 1) {
                    next = chunk.splice(1, chunk.length - 1);
                    chunks.splice(i + 1, 0, next);
                }
                parent = chunk[0];
                blocks = Breaker.breakText(parent.text, MAX_BLOCK_LEN);
                parent.content = [];
                for (k = 0; k < blocks.length; ++k) {
                    parent.content[k] = [{
                            text: blocks[k],
                            node: {}
                        }];
                }
            }
        }
    };
    Model.prototype.setTranslation = function (obj, index, textArr) {
        var i, j, chunk, span;
        for (i = 0; i < textArr.length; ++i) {
            chunk = obj.content[index++];
            for (j = 0; j < chunk.length; ++j) {
                span = chunk[j];
                span.tr = textArr[i][j];
                this.trTextLen += span.text.length;
                setNodeValue(span.node, span.tr);
            }
        }
        if (obj.node && obj.index >= obj.content.length) {
            obj.tr = "";
            for (i = 0; i < obj.content.length; ++i) {
                chunk = obj.content[i];
                for (j = 0; j < chunk.length; ++j) {
                    obj.tr += chunk[j].node.nodeValue;
                }
            }
            setNodeValue(obj.node, obj.tr);
        }
    };
    Model.prototype.skipTranslated = function (chunk) {
        this.trTextLen += getChunkLen(chunk);
    };
    var ProgressBar = function (id) {
        this.elem = document.getElementById(id);
        this.child = this.elem.getElementsByTagName("span")[0];
        this.format = this.child.innerHTML;
        if (this.format.indexOf("{0}") < 0) {
            this.format = "{0}%";
        }
        this.currentValue = -1;
    };
    ProgressBar.prototype.show = function (shown) {
        this.elem.style.display = shown ? "inline" : "none";
    };
    ProgressBar.prototype.setValue = function (value) {
        if (value != this.currentValue) {
            this.child.innerHTML = this.format.replace("{0}", value);
            this.currentValue = value;
        }
    };
    var TrUrl = function (params) {
        var ref = this;
        this.doc = document;
        this.form = document.forms[0];
        this.form.onsubmit = function () {
            ref.submit();
            return false;
        };
        this.progress = new ProgressBar("progress");
        this.loader = document.getElementById("loader");
        this.langCtrl = new LangCtrl(this.form, params);
        this.langCtrl.onChange = function () {
            ref.langChanged();
        };
        var flipCtrl = document.getElementById("flip");
        if (flipCtrl) {
            flipCtrl.onclick = function () {
                ref.langCtrl.invertDir();
                ref.langChanged();
                return false;
            };
        }
        this.errCount = 0;
        this.state = Doc.STATE_INIT;
        this.stateTime = 0;
        this.ready = true;
        yt.FrameManager.init();
        var url = util.trim(this.form.url.value);
        this.setOriginalUrl(url);
        if (url) {
            this.submit(true);
        }
        setInterval(function () {
            ref.updateUI();
        }, 500);
    };
    TrUrl.prototype.onLoadDoc = function (doc) {
        this.errCount = 0;
        doc.setListener(this);
        if (!this.ready) {
            return;
        }
        this.setUrl(doc.url);
    };
    TrUrl.prototype.onLoadError = function () {
        this.setState(Doc.STATE_INIT);
    };
    TrUrl.prototype.submit = function (isAutoSubmit) {
        var url = util.trim(this.form.url.value);
        if (!url) {
            return;
        }
        this.setState(Doc.STATE_UNLOAD);
        try {
            var dstFrame = frames.dst;
            dstFrame.window.name = "dst";
            var href = dstFrame.location.href;
        } catch (err) {
            if (isAutoSubmit) {
                return;
            }
            this.form.action = "/translate_f";
            this.form.target = "_self";
        }
        this.form.submit();
    };
    TrUrl.prototype.onStateChanged = function (doc) {
        var state = doc.getState();
        if (state == Doc.STATE_TR_START && this.form.dir.value == "auto") {
            this.langCtrl.setValue(doc.lang);
        }
        this.setState(state);
    };
    TrUrl.prototype.setState = function (state) {
        this.state = state;
        this.stateTime = util.time();
        switch (state) {
        case Doc.STATE_INIT:
            this.showLoader(false);
            this.progress.show(false);
            break;
        case Doc.STATE_LOAD_START:
        case Doc.STATE_UNLOAD:
            this.showLoader(true);
            this.progress.show(false);
            this.showInaccessibleWarn(false);
            break;
        case Doc.STATE_TR_START:
            this.showLoader(false);
            this.progress.show(true);
            break;
        case Doc.STATE_INACCESSIBLE:
            this.showLoader(false);
            this.progress.show(false);
            this.showInaccessibleWarn(true);
            break;
        }
    };
    TrUrl.prototype.onProgressChanged = function (value) {
        if (!this.ready) {
            return;
        }
        this.showLoader(false);
        this.progress.setValue(value);
        this.progress.show(true);
    };
    TrUrl.prototype.onError = function (err) {
        if (this.errCount++ > 0) {
            return;
        }
        window.console.log("Translation failed: " + err.message);
    };
    TrUrl.prototype.langChanged = function () {
        this.form.dir.value = "";
    };
    TrUrl.prototype.setUrl = function (url) {
        this.form.url.value = url;
        this.setOriginalUrl(url);
    };
    TrUrl.prototype.setOriginalUrl = function (url) {
        var original = this.doc.getElementById("original");
        if (!original) {
            return;
        }
        if (!url) {
            original.href = "#";
            return;
        }
        if (url.indexOf("://") < 0) {
            url = "http://" + url;
        }
        original.href = url;
    };
    TrUrl.prototype.showLoader = function (value) {
        this.loader.style.display = value ? "inline" : "none";
    };
    TrUrl.prototype.showInaccessibleWarn = function (shown) {
        document.getElementById("inaccWarn").style.display = shown ? "inline" : "none";
    };
    TrUrl.prototype.updateUI = function () {
        if (this.state == Doc.STATE_UNLOAD && util.time() > this.stateTime + LOAD_TIMEOUT) {
            this.setState(Doc.STATE_INIT);
        }
    };
    TrUrl.attachDoc = function (doc) {
        try {
            if (parent != this && parent.yandexTr) {
                parent.yandexTr.onLoadDoc(doc);
            }
        } catch (ignore) {
        }
    };
    TrUrl.checkTopFrame = function (errorUrl) {
        var intervalId = setInterval(function () {
            if (!document.body) {
                return;
            }
            if (document.body.tagName.toLowerCase() == "frameset" && this == window.top) {
                window.top.location.href = errorUrl;
            }
            clearInterval(intervalId);
        }, 100);
    };
    namespace.Doc = Doc;
    namespace.TrUrl = TrUrl;
}(window));
