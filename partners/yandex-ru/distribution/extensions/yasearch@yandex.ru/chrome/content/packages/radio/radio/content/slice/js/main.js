(function () {
    var tableHandlers = {
        "play": function (data) {
            YBRadio.adapter.play(data.id, true);
        },
        "stop": function (data) {
            YBRadio.adapter.play(data.id, false);
        },
        "change": function (data) {
            YBRadio.overlay.show(YBRadio.adapter.getString("dialog.changestation.title"), data, function (ret, conf, data) {
                if (ret) {
                    return YBRadio.adapter.edit(conf.id, data);
                }
            });
        },
        "delete": function (data) {
            YBRadio.overlay.confirm(YBRadio.adapter.getString("dialog.delstattion.title"), YBRadio.adapter.getString("dialog.delstation.question"), function (ret) {
                if (ret) {
                    YBRadio.adapter.remove(data.id);
                }
            });
        }
    };
    var adapterHandlers = {
        "play": function (data) {
            document.body.setAttribute("yb-play", data);
        },
        "add": function (data) {
            YBRadio.table.createRow(data);
        },
        "addDialog": function () {
            YBRadio.overlay.show(YBRadio.adapter.getString("dialog.addstation.title"), { name: YBRadio.adapter.newName() }, function (ret, conf, data) {
                if (ret) {
                    return YBRadio.adapter.add(data);
                }
            });
        },
        "edit": function (data) {
            YBRadio.table.editRow(data);
        },
        "remove": function (id) {
            YBRadio.table.deleteRow(id);
        },
        "list": function () {
            YBRadio.table.clear();
            YBRadio.table.createRows(YBRadio.adapter.getAll());
        },
        "current": function (data) {
            if (data.old) {
                YBRadio.table.editRow({
                    id: data.old,
                    current: false
                });
            }
            if (data.id) {
                YBRadio.table.editRow({
                    id: data.id,
                    current: true
                });
            }
        }
    };
    YBRadio.init = function () {
        if (YBRadio.debug) {
            YBRadio.debug.init();
        }
        YBRadio.table.init(tableHandlers);
        YBRadio.adapter.init(adapterHandlers);
        YBRadio.DOM.node({
            value: YBRadio.adapter.getString("dialog.settings.button-add"),
            onclick: function () {
                YBRadio.adapter.fireEvent("addDialog");
            }
        }, "id_btnAdd");
        YBRadio.table.createRows(YBRadio.adapter.getAll());
        document.body.setAttribute("yb-play", YBRadio.adapter.getPlayState());
        if (YBRadio.adapter.startCommand() == "add") {
            YBRadio.adapter.fireEvent("addDialog");
        }
    };
}());
