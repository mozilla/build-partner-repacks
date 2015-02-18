window.YBRadio = window.YBRadio || {};
YBRadio.overlay = function () {
    var overlay = null, currDlgData = null, editDlg = {}, confirmDlg = {};
    var onclicks = {
        close: function () {
            module.close(false);
        },
        confirm: function () {
            module.close(true);
        },
        edit: function () {
            var data = {
                name: editDlg.name.value.replace(/^\s+|\s+$/g, ""),
                url: editDlg.url.value.replace(/^\s+|\s+$/g, ""),
                play: editDlg.play.checked
            };
            if (!data.name || !data.url) {
                return;
            }
            var err = currDlgData.callback(true, currDlgData.data, data);
            if (err) {
                editDlg.error.innerHTML = err;
            } else {
                module.close();
            }
        },
        checkboxPlay: function () {
            YBRadio.adapter.saveChBoxPlay(this.checked);
        }
    };
    var templates = {
        rbuttons: function (text1, text2, click1, click2) {
            return {
                tag: "div.rbuttons",
                content: [
                    {
                        tag: "input",
                        type: "button",
                        value: YBRadio.adapter.getString(text1),
                        onclick: click1
                    },
                    {
                        tag: "input",
                        type: "button",
                        value: YBRadio.adapter.getString(text2),
                        onclick: click2
                    }
                ]
            };
        },
        textBox: function (text, id) {
            return {
                tag: "tr",
                content: [
                    {
                        tag: "td",
                        text: YBRadio.adapter.getString(text) + ":",
                        style: { whiteSpace: "nowrap" }
                    },
                    {
                        tag: "td",
                        width: "100%",
                        content: {
                            tag: "div.input",
                            content: {
                                tag: "input",
                                type: "text",
                                ID: id
                            }
                        }
                    }
                ]
            };
        },
        overlay: function () {
            return {
                tag: "div.overlay",
                style: { display: "none" }
            };
        },
        confirmDlg: function () {
            return {
                tag: "div.dialog dialog-confirm",
                ID: "dom",
                style: { display: "none" },
                content: [
                    {
                        tag: "div.dialog-caption",
                        ID: "caption"
                    },
                    {
                        tag: "div.dialog-content",
                        content: [
                            {
                                tag: "div",
                                ID: "text"
                            },
                            templates.rbuttons("dialog.yes", "dialog.no", onclicks.confirm, onclicks.close)
                        ]
                    }
                ]
            };
        },
        editDlg: function () {
            return {
                tag: "div.dialog dialog-edit",
                ID: "dom",
                style: { display: "none" },
                content: [
                    {
                        tag: "div.dialog-caption",
                        ID: "caption"
                    },
                    {
                        tag: "div.dialog-content",
                        content: [
                            {
                                tag: "table",
                                content: [
                                    templates.textBox("dialog.settings.row-name", "name"),
                                    templates.textBox("dialog.settings.row-url", "url"),
                                    {
                                        tag: "tr",
                                        content: [
                                            {
                                                tag: "td",
                                                html: " "
                                            },
                                            {
                                                tag: "td",
                                                text: YBRadio.adapter.getString("dialog.addstation.notice")
                                            }
                                        ]
                                    },
                                    {
                                        tag: "tr",
                                        content: [
                                            {
                                                tag: "td",
                                                html: " "
                                            },
                                            {
                                                tag: "td",
                                                content: [
                                                    {
                                                        tag: "input",
                                                        type: "checkbox",
                                                        id: "id_edit_play",
                                                        ID: "play",
                                                        onclick: onclicks.checkboxPlay
                                                    },
                                                    {
                                                        tag: "label",
                                                        htmlFor: "id_edit_play",
                                                        text: YBRadio.adapter.getString("dialog.changestation.alert")
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        tag: "tr",
                                        content: [
                                            {
                                                tag: "td",
                                                html: " "
                                            },
                                            {
                                                tag: "td.error-text",
                                                ID: "error"
                                            }
                                        ]
                                    }
                                ]
                            },
                            templates.rbuttons("dialog.ok", "dialog.cancel", onclicks.edit, onclicks.close)
                        ]
                    }
                ]
            };
        }
    };
    function init() {
        if (overlay) {
            return;
        }
        document.body.appendChild(overlay = YBRadio.DOM.node(templates.overlay()));
        document.body.appendChild(YBRadio.DOM.node(templates.editDlg(), null, editDlg));
        document.body.appendChild(YBRadio.DOM.node(templates.confirmDlg(), null, confirmDlg));
    }
    function showDialog(data, dom, callback) {
        currDlgData = { data: data };
        currDlgData.dom = dom;
        currDlgData.callback = callback;
        overlay.style.display = "";
        dom.style.display = "";
    }
    var module = {
        close: function (ret) {
            init();
            if (currDlgData) {
                if (ret !== void 0) {
                    currDlgData.callback(ret);
                }
                currDlgData.dom.style.display = "none";
                overlay.style.display = "none";
                currDlgData = null;
            }
        },
        show: function (caption, data, callback) {
            this.close(false);
            editDlg.caption.innerHTML = YBRadio.DOM.toHTML(caption);
            editDlg.name.value = data.name || "";
            editDlg.url.value = data.url || "";
            editDlg.error.innerHTML = "";
            showDialog(data, editDlg.dom, callback);
            editDlg.play.checked = YBRadio.adapter.getChBoxPlay();
        },
        confirm: function (caption, text, callback) {
            this.close(false);
            confirmDlg.caption.innerHTML = YBRadio.DOM.toHTML(caption);
            confirmDlg.text.innerHTML = YBRadio.DOM.toHTML(text);
            showDialog(null, confirmDlg.dom, callback);
        }
    };
    return module;
}();
