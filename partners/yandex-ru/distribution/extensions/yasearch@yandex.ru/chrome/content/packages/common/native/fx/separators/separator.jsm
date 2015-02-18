"use strict";
const EXPORTED_SYMBOLS = ["core"];
const {
    classes: Cc,
    interfaces: Ci
} = Components;
const core = {
    init: function SeparatorWidget_init(api) {
        this._api = api;
    },
    finalize: function SeparatorWidget_finalize() {
        delete this._api;
    },
    buildWidget: function SeparatorWidget_buildWidget(WIID, item) {
        let parent = item.parentNode;
        while (parent && !("insertItem" in parent)) {
            parent = parent.parentNode;
        }
        if (parent) {
            parent.insertItem("separator", item);
        }
        let me = this;
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback({
            notify: function () {
                if (me._api) {
                    me._api.Controls.removeWidget(WIID);
                }
            }
        }, 0, timer.TYPE_ONE_SHOT);
    },
    destroyWidget: function SeparatorWidget_destroyWidget(WIID, item, context) {
    }
};
