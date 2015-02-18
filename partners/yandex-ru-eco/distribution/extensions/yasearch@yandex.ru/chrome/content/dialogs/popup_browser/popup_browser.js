(function () {
    "use strict";
    let yabarPopupBrowser = {
        onLoad: function YBPB_obLoad() {
            let args = window.arguments[0] && window.arguments[0].wrappedJSObject;
            if (!args) {
                return;
            }
            if ("title" in args && args.title !== null) {
                document.title = args.title;
            } else {
                document.title = this._application.branding.expandBrandTemplates("{product1.nom}");
            }
            let url = "url" in args ? args.url : null;
            if (!url) {
                return;
            }
            let postData = "postData" in args ? args.postData : null;
            let referrer = "referrer" in args ? args.referrer : null;
            this._browser.loadURI(url, referrer, postData, false);
        },
        get _browser() {
            delete this._browser;
            return this._browser = document.getElementById(APP_NAME + "-content-browser");
        },
        get _application() {
            let barCore = Components.classes["@yandex.ru/custombarcore;" + APP_NAME].getService().wrappedJSObject;
            delete this._application;
            return this._application = barCore.application;
        }
    };
    window.addEventListener("load", function loadEventListener(aLoadEvent) {
        aLoadEvent.currentTarget.removeEventListener("load", loadEventListener, false);
        yabarPopupBrowser.onLoad();
    }, false);
}());
