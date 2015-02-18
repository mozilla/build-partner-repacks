Y.XTools = {
    xjsont: null,
    initXJT: function (data) {
        this.xjsont = new XJSONT();
        this.xjsont.addFunction("log", function (x) {
            Y.log("#### " + x);
            return x;
        });
        this.xjsont.addFunction("log2", function (x) {
            Y.log("#### " + JSON.stringify(x, "", 4));
            return x;
        });
        this.xjsont.addTemplates(data.overlayTemplate);
        this.xjsont.addTemplates(data.messagesTemplate);
    },
    loadText: function (path) {
        var req;
        if (window.XMLHttpRequest) {
            req = new XMLHttpRequest();
        } else {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        }
        req.open("GET", path, false);
        if (req.overrideMimeType) {
            try {
                req.overrideMimeType("text/plain");
            } catch (exc) {
            }
        }
        req.send();
        return req.responseText;
    },
    transformJSON: function (data, templName, globals) {
        var glob = Y.xParams;
        if (globals) {
            var copy = Twitter.utils.copy;
            glob = copy(globals, copy(Y.xParams));
        }
        return this.xjsont.calc(templName, data, {}, glob);
    },
    destroyChilds: function (resultContainer) {
        Y.ObserverService.getInstance().notifyObservers("destroy", resultContainer);
    },
    replaceContent: function (resultContainer, content) {
        function fixHTML(aStr) {
            return aStr.replace("&amp;lt;", "&lt;", "g").replace("&amp;quot;", "&quot;", "g").replace("&amp;gt;", "&gt;", "g").replace("&amp;amp;", "&amp;", "g");
        }
        this.destroyChilds(resultContainer);
        if (typeof content === "string") {
            resultContainer.innerHTML = content;
        } else {
            var tmpElement = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
            var body = document.getElementById("body");
            tmpElement.style.display = "none";
            body.appendChild(tmpElement);
            tmpElement.appendChild(content);
            var html = tmpElement.innerHTML;
            html = fixHTML(html);
            resultContainer.innerHTML = html;
            body.removeChild(tmpElement);
        }
        Y.UI.buildUI(resultContainer);
    },
    parseEntities: function (str) {
        var entityRx = /<!ENTITY.*?>/g, keyValueRx = /<!ENTITY\s+(\S+)\s+("|')(.*?)\2/, res, tres, key, value, entities = {};
        while (res = entityRx.exec(str)) {
            tres = keyValueRx.exec(res);
            key = tres[1];
            value = tres[3];
            if (key) {
                entities[key] = value || "";
            }
        }
        return entities;
    }
};
