"use strict";
var YaSubPrefController = {
    pane: document.getElementsByTagName("prefpane")[0],
    init: function YaPrefController_init() {
        for (let [
                    key,
                    val
                ] in Iterator(window.arguments[0])) {
            this[key] = val;
        }
        document.title = this.widget.name;
        let settingsXULDocument = this.widget.getSubSettingsXULDocument(document);
        let nativeNodesData = this.SettingsDocumentHelper.createNativeNodes(document, settingsXULDocument, this.pane);
        nativeNodesData.appendNodes(this.pane);
    },
    onLoad: function YaPrefController_onLoad() {
        this.widget.updatePreferenceNodes(document);
        this._executeHandler("onSettingsShown");
    },
    beforeAccept: function YaPrefController_beforeAccept() {
        if (!this._accepted) {
            this._apply();
            this._accepted = true;
        }
        return true;
    },
    onUnload: function YaPrefController_onUnload() {
        this._executeHandler("onSettingsHidden");
        this.beforeAccept();
        if (!this._accepted) {
            this._cancel();
        }
        for (let key in window.arguments[0]) {
            delete this[key];
        }
        this.pane = null;
    },
    _accepted: false,
    _apply: function YaPrefController__apply() {
        this._executeHandler("onSettingsApply");
    },
    _cancel: function YaPrefController__cancel() {
        this._executeHandler("onSettingsCancel");
    },
    _executeHandler: function YaPrefController__executeHandler(aHandlerName) {
        if (this.pane.hasAttribute(aHandlerName)) {
            try {
                new Function(this.pane.getAttribute(aHandlerName))();
            } catch (ex) {
                this.Preferences._logger.error(ex);
            }
        }
    }
};
YaSubPrefController.init();
