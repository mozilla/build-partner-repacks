"use strict";
const EXPORTED_SYMBOLS = ["downloads"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const downloads = {
    init: function downloads_init(application) {
        this._application = application;
        this._logger = application.getLogger("StatisticsDownloads");
        Services.obs.addObserver(this, "sessionstore-windows-restored", false);
        Services.ww.registerNotification(this);
    },
    finalize: function downloads_finalize(doCleanup, callback) {
        Services.ww.unregisterNotification(this);
        try {
            let {Downloads} = Cu.import("resource://gre/modules/Downloads.jsm");
            Downloads.getList(Downloads.PUBLIC).then(list => list.removeView(this));
        } catch (ex) {
        }
    },
    observe: function downloads_observe(subject, topic, data) {
        switch (topic) {
        case "domwindowopened":
            subject.addEventListener("load", this, false);
            break;
        case "domwindowclosed":
            subject.removeEventListener("load", this, false);
            break;
        case "sessionstore-windows-restored":
            Services.obs.removeObserver(this, "sessionstore-windows-restored", false);
            try {
                let {Downloads} = Cu.import("resource://gre/modules/Downloads.jsm");
                Downloads.getList(Downloads.PUBLIC).then(list => list.addView(this));
            } catch (ex) {
            }
            break;
        }
    },
    onDownloadAdded: function downloads_onDownloadAdded(download) {
        if (download.stopped) {
            return;
        }
        let fileName = download.target.path || download.source.url;
        let fileExtension = fileName && fileName.match(/\.([a-z0-9]{1,20})$/i);
        if (fileExtension) {
            this._logClickStatistics("download.dialog.open." + fileExtension[1]);
        }
    },
    onDownloadChanged: function downloads_onDownloadChanged(download) {
        if (!download.stopped) {
            return;
        }
        if (download.succeeded) {
            downloads._logClickStatistics("download.dialog.done");
        } else if (download.error) {
            downloads._logClickStatistics("download.dialog.false");
        }
    },
    handleEvent: function downloads_handleEvent(event) {
        if (event.type !== "load") {
            return;
        }
        let window = event.target.defaultView;
        switch (window.location.toString()) {
        case "chrome://browser/content/browser.xul":
            this._onBrowserWindowOpen(window);
            break;
        case "chrome://mozapps/content/downloads/unknownContentType.xul":
            this._onDownloadDialogOpen(window);
            break;
        case "chrome://browser/content/places/places.xul":
            this._onDownloadManagerOpen(window);
            break;
        }
    },
    _onBrowserWindowOpen: function downloads__onBrowserWindowOpen(window) {
        let browserEventHandler = {
            handleEvent: function downloads_browserEventHandler_handleEvent(event) {
                switch (event.type) {
                case "popupshowing": {
                        let {target} = event;
                        if (target.id !== "downloadsPanel") {
                            return;
                        }
                        target.addEventListener("popuphiding", this, false);
                        target.addEventListener("command", this, true);
                        target.addEventListener("keypress", this, false);
                        target.addEventListener("click", this, true);
                        downloads._logClickStatistics("download.menu.button");
                        break;
                    }
                case "popuphiding": {
                        let {target} = event;
                        target.removeEventListener("popuphiding", this, false);
                        target.removeEventListener("command", this, true);
                        target.removeEventListener("keypress", this, false);
                        target.removeEventListener("click", this, true);
                        break;
                    }
                case "command": {
                        let commandId;
                        if (event.originalTarget) {
                            let command = event.originalTarget.getAttribute("oncommand") || "";
                            command = command.match(/['"]downloadsCmd_(.+)['"]/) || command.match(/DownloadsPanel\.(showDownloadsHistory)\(/);
                            if (command) {
                                commandId = command[1];
                            }
                        }
                        switch (commandId) {
                        case "show":
                            downloads._logClickStatistics("download.menu.explorer");
                            break;
                        case "cancel":
                            downloads._logClickStatistics("download.menu.cancel");
                            break;
                        case "retry":
                            downloads._logClickStatistics("download.menu.continue");
                            break;
                        case "showDownloadsHistory":
                            downloads._logClickStatistics("download.menu.manager");
                            break;
                        }
                        break;
                    }
                case "keypress":
                    if (event.keyCode !== event.DOM_VK_RETURN) {
                        return;
                    }
                case "click": {
                        if (event.type === "click" && event.button !== 0 || event.originalTarget.hasAttribute("oncommand")) {
                            return;
                        }
                        let richListBox = event.target;
                        while (richListBox && richListBox.id !== "downloadsListBox") {
                            richListBox = richListBox.parentNode;
                        }
                        if (!richListBox || richListBox.selectedIndex === -1) {
                            return;
                        }
                        if (richListBox.selectedItem.getAttribute("state") !== "1") {
                            return;
                        }
                        downloads._logClickStatistics("download.menu.file." + (richListBox.selectedIndex + 1));
                        break;
                    }
                case "unload": {
                        let win = event.currentTarget;
                        win.removeEventListener("unload", browserEventHandler, false);
                        win.removeEventListener("popupshowing", browserEventHandler, false);
                        break;
                    }
                }
            }
        };
        window.addEventListener("unload", browserEventHandler, false);
        window.addEventListener("popupshowing", browserEventHandler, false);
    },
    _onDownloadDialogOpen: function downloads__onDownloadDialogOpen(window) {
        this._logClickStatistics("download.dialog.open");
        let dialogEventHandler = {
            handleEvent: function downloads_dialogEventHandler_handleEvent(event) {
                switch (event.type) {
                case "dialogaccept":
                    downloads._logClickStatistics("download.dialog.ok");
                    break;
                case "dialogcancel":
                    downloads._logClickStatistics("download.dialog.cancel");
                    break;
                case "unload": {
                        let win = event.currentTarget;
                        win.removeEventListener("unload", dialogEventHandler, false);
                        win.removeEventListener("dialogaccept", dialogEventHandler, false);
                        win.removeEventListener("dialogcancel", dialogEventHandler, false);
                        break;
                    }
                }
            }
        };
        window.addEventListener("unload", dialogEventHandler, false);
        window.addEventListener("dialogaccept", dialogEventHandler, false);
        window.addEventListener("dialogcancel", dialogEventHandler, false);
    },
    _onDownloadManagerOpen: function downloads__onDownloadManagerOpen(window) {
        let managerEventHandler = {
            handleEvent: function downloads_managerEventHandler_handleEvent(event) {
                switch (event.type) {
                case "command": {
                        let commandId;
                        if ([
                                "command",
                                "textbox"
                            ].indexOf(event.target.localName) !== -1) {
                            commandId = event.target.getAttribute("id");
                        }
                        if (!commandId && event.originalTarget) {
                            let command = event.originalTarget.getAttribute("oncommand") || "";
                            command = command.match(/['"](downloadsCmd_.+)['"]/);
                            if (command) {
                                commandId = command[1];
                            }
                        }
                        commandId = commandId && commandId.replace("downloadsCmd_", "");
                        switch (commandId) {
                        case "show":
                            downloads._logClickStatistics("download.manager.explorer");
                            break;
                        case "cancel":
                            downloads._logClickStatistics("download.manager.cancel");
                            break;
                        case "retry":
                            downloads._logClickStatistics("download.manager.continue");
                            break;
                        case "clearDownloads":
                            downloads._logClickStatistics("download.manager.clear");
                            break;
                        case "searchFilter": {
                                let placesSearchBox = event.view.PlacesSearchBox;
                                if (placesSearchBox && placesSearchBox.value && placesSearchBox.filterCollection === "downloads") {
                                    downloads._logClickStatistics("download.manager.search");
                                }
                                break;
                            }
                        }
                        break;
                    }
                case "keypress":
                    if (event.keyCode !== event.DOM_VK_RETURN) {
                        return;
                    }
                case "dblclick": {
                        let richListBox = event.currentTarget;
                        if (richListBox.selectedIndex !== -1) {
                            downloads._logClickStatistics("download.manager.file." + (richListBox.selectedIndex + 1));
                        }
                        break;
                    }
                case "unload": {
                        let win = event.currentTarget;
                        win.removeEventListener("unload", managerEventHandler, false);
                        win.removeEventListener("command", managerEventHandler, false);
                        let downloadsRichListBox = win.document.getElementById("downloadsRichListBox");
                        if (downloadsRichListBox) {
                            downloadsRichListBox.removeEventListener("keypress", managerEventHandler, false);
                            downloadsRichListBox.removeEventListener("dblclick", managerEventHandler, false);
                        }
                        break;
                    }
                }
            }
        };
        window.addEventListener("unload", managerEventHandler, false);
        window.addEventListener("command", managerEventHandler, false);
        let downloadsRichListBox = window.document.getElementById("downloadsRichListBox");
        if (downloadsRichListBox) {
            downloadsRichListBox.addEventListener("keypress", managerEventHandler, false);
            downloadsRichListBox.addEventListener("dblclick", managerEventHandler, false);
        }
    },
    _logClickStatistics: function downloads__logClickStatistics(paramString) {
        this._application.statistics.logClickStatistics({
            cid: 72508,
            path: "fx." + paramString
        });
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver])
};
