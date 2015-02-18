window.YBRadio = window.YBRadio || {};
(function () {
    var rxEscape = /&|  |<|>|\r\n|\n|"/g;
    var rxUnescape = /&amp;|&nbsp;|&lt;|&gt;|<(br|BR)\s*\/?>|&quot;/g;
    var mapEscape = {
        "&": "&amp;",
        "  ": "&nbsp; ",
        "<": "&lt;",
        ">": "&gt;",
        "\n": "<br />",
        "\r\n": "<br />",
        "\"": "&quot;"
    };
    var mapUnescape = {
        "&amp;": "&",
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "<br />": "\n",
        "<br/>": "\n",
        "<br>": "\n",
        "&quot;": "\""
    };
    var funcReplaceEscape = function (str) {
        return mapEscape[str];
    };
    var funcReplaceUnescape = function (str) {
        return mapUnescape[str.toLowerCase()];
    };
    YBRadio.DOM = {
        _elemProps: [
            "id",
            "title",
            "type",
            "title",
            "value",
            "onclick",
            "ondblclick",
            "htmlFor",
            "width",
            "colSpan"
        ],
        node: function (obj, n, ids) {
            if (typeof obj === "string") {
                return document.createTextNode(obj);
            }
            if (!obj || obj.nodeType) {
                return obj;
            }
            if (n && typeof n == "string") {
                n = document.getElementById(n);
            }
            var tag = obj.tag, className = obj.className;
            if (tag && tag.indexOf(".") > 0) {
                var tcn = tag.split(".");
                tag = tcn[0] || "div";
                if (tcn[1]) {
                    className = className ? tcn[1] + " " + className : tcn[1];
                }
            }
            n = n || document.createElement(tag);
            if (ids && obj.ID) {
                ids[obj.ID] = n;
            }
            if (className) {
                n.className = className;
            }
            for (var i = 0; i < this._elemProps.length; ++i) {
                var pr = this._elemProps[i];
                if (obj[pr] != null) {
                    n[pr] = obj[pr];
                }
            }
            if (obj.text) {
                n.innerHTML = YBRadio.DOM.toHTML(obj.text);
            } else {
                if (obj.html) {
                    n.innerHTML = obj.html;
                }
            }
            if (obj.style) {
                for (var s in obj.style) {
                    if (obj.style.hasOwnProperty(s)) {
                        n.style[s] = obj.style[s];
                    }
                }
            }
            if (obj.content) {
                if (obj.content.pop && obj.content.splice) {
                    for (var i = 0; i < obj.content.length; ++i) {
                        n.appendChild(this.node(obj.content[i], null, ids));
                    }
                } else {
                    n.appendChild(this.node(obj.content, null, ids));
                }
            }
            return n;
        },
        toHTML: function (str) {
            return str ? String(str).replace(rxEscape, funcReplaceEscape) : "";
        },
        fromHTML: function (str) {
            return str ? String(str).replace(rxUnescape, funcReplaceUnescape) : "";
        },
        on: function (el, event, handler) {
            if (el.addEventListener) {
                el.addEventListener(event, handler, false);
            } else {
                el.attachEvent("on" + event, handler);
            }
        }
    };
}());
