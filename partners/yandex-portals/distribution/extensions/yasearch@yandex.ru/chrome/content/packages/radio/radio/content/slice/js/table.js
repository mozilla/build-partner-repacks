window.YBRadio = window.YBRadio || {};
YBRadio.table = function () {
    var PREFIX = "rowid_";
    var parentDiv = null;
    var handlers = {};
    function getRow(id) {
        return document.getElementById(PREFIX + id);
    }
    function getNameCell(row) {
        return row.firstChild.nextSibling;
    }
    function getUrlCell(row) {
        return row.lastChild;
    }
    function getRowData(row) {
        return row && {
            id: row.id.substr(PREFIX.length),
            current: row.getAttribute("row-current") == "true",
            name: YBRadio.DOM.fromHTML(getNameCell(row).innerHTML),
            url: YBRadio.DOM.fromHTML(getUrlCell(row).innerHTML)
        };
    }
    function setRowData(row, data) {
        if (!row || !data) {
            return;
        }
        if (data.name) {
            getNameCell(row).innerHTML = YBRadio.DOM.toHTML(data.name);
        }
        if (data.url) {
            getUrlCell(row).innerHTML = YBRadio.DOM.toHTML(data.url);
        }
        if (typeof data.current === "boolean") {
            if (data.current) {
                row.setAttribute("row-current", "true");
            } else {
                row.removeAttribute("row-current");
            }
        }
    }
    function tplBtn(type) {
        return {
            tag: "i.img img-" + type,
            title: YBRadio.adapter.getString("dialog.settings.button-" + type)
        };
    }
    function createRow(id) {
        return YBRadio.DOM.node({
            tag: "div.row",
            id: PREFIX + id,
            content: [
                {
                    tag: "div.cellplay",
                    content: [
                        tplBtn("play"),
                        tplBtn("stop")
                    ]
                },
                { tag: "div.cellname" },
                {
                    tag: "div.cellcmd",
                    content: [
                        tplBtn("change"),
                        tplBtn("delete")
                    ]
                },
                { tag: "div.cellurl" }
            ]
        });
    }
    return {
        init: function (callbacks) {
            if (parentDiv) {
                return;
            }
            handlers = callbacks || handlers;
            parentDiv = YBRadio.DOM.node({
                onclick: function (e) {
                    e = e || window.event;
                    var el = e.target || e.srcElement;
                    if (/img-(\S+)/.test(el.className)) {
                        var cmd = RegExp.$1;
                        var cb = handlers[cmd];
                        if (cb) {
                            cb.call(handlers, getRowData(el.parentNode.parentNode));
                        }
                    }
                },
                ondblclick: function (e) {
                    e = e || window.event;
                    var el = e.target || e.srcElement;
                    var dblClc = {
                        cellname: 1,
                        cellurl: 1
                    };
                    if (dblClc[el.className]) {
                        handlers.change(getRowData(el.parentNode));
                    }
                    return false;
                }
            }, "id_list");
            YBRadio.DOM.node({ text: YBRadio.adapter.getString("dialog.settings.row-name") }, "id_hdname");
            YBRadio.DOM.node({ text: YBRadio.adapter.getString("dialog.settings.row-url") }, "id_hdurl");
        },
        getRowData: function (id) {
            return getRowData(getRow(id));
        },
        createRow: function (data) {
            if (data) {
                var row = createRow(data.id);
                setRowData(row, data);
                parentDiv.appendChild(row);
            }
        },
        createRows: function (data) {
            for (var i = 0; i < data.length; ++i) {
                this.createRow(data[i]);
            }
        },
        deleteRow: function (id) {
            var row = getRow(id);
            if (row) {
                row.parentNode.removeChild(row);
            }
        },
        editRow: function (data) {
            var row = getRow(data.id);
            setRowData(row, data);
        },
        clear: function () {
            parentDiv.innerHTML = "";
        }
    };
}();
