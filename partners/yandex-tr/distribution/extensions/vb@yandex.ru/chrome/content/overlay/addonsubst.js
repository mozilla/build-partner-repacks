(function addonSubstituentInitializer() {
    "use strict";
    const libScope = {};
    const {
        classes: Cc,
        interfaces: Ci
    } = Components;
    const MAX_INSTALL_NOTIFICATION_LAUNCHES = 10;
    const addonSubstituent = {
        init: function addonSubstituent_init() {
            let core = Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject;
            this._application = core.application;
            this._logger = this._application.getLogger("AddonSubstituent");
            this._windowListener = window[this._application.name + "OverlayController"].windowListener;
            core.Lib.sysutils.copyProperties(core.Lib, libScope);
            this._notification = new AddonSubstituentNotification();
            this.checkAlienTabUrl();
            this.checkAlienAddons(function () {
                if (this._notificationStack.length) {
                    this._notification.showInstallNotification(this._notificationStack);
                }
                this._enableGuard();
            }.bind(this));
        },
        finalize: function addonSubstituent_finalize() {
            this._disableGuard();
            this._notification.finalize();
        },
        checkAlienTabUrl: function addonSubstituent_checkAlienTabUrl() {
            let alienTabUrl = this._application.preferences.get("browser.alien.newtab.url", "");
            if (!alienTabUrl) {
                return;
            }
            this._checkAlienRecord(alienTabUrl, true);
        },
        checkAlienAddons: function addonSubstituent_checkAlienAddons(callback) {
            libScope.AddonManager.gre_AddonManager.getAllAddons(function (addons) {
                let appAddonId = this._application.addonManager.addonId;
                let appAddon = addons.filter(a => a.id === appAddonId)[0];
                addons.forEach(function (addon) {
                    if (appAddon === addon) {
                        return;
                    }
                    if (!addon.installDate) {
                        return;
                    }
                    if (!addon.isActive) {
                        return;
                    }
                    if (addon.installDate.getTime() - appAddon.installDate.getTime() > 5000) {
                        return;
                    }
                    this._alienAddons.forEach(function (alienAddon) {
                        let addonId = addon.id.toLowerCase();
                        if (alienAddon.id === addonId && libScope.sysutils.versionComparator.compare(addon.version, alienAddon.version) <= 0) {
                            this._checkAlienRecord(addonId);
                        }
                    }, this);
                }, this);
                if (typeof callback === "function") {
                    callback();
                }
            }.bind(this));
        },
        _checkAlienRecord: function addonSubstituent__checkAlienRecord(recordId, isTabUrl) {
            let alienAddonRecordsPref = this._application.preferences.get("alienAddonRecords", "{}");
            let alienAddonRecords = JSON.parse(alienAddonRecordsPref);
            let status = alienAddonRecords[recordId] || 0;
            this._checkStatusAlienRecord(recordId, isTabUrl, status);
        },
        _checkStatusAlienRecord: function addonSubstituent__checkStatusAlienRecord(recordId, isTabUrl, status) {
            switch (status) {
            case "enabled":
            case "disabled":
                this._setStatusAlienRecord(recordId, isTabUrl, status);
                break;
            default:
                let count = parseInt(status, 10);
                this._setStatusAlienRecord(recordId, isTabUrl, status);
                if (count < MAX_INSTALL_NOTIFICATION_LAUNCHES) {
                    this._addNotificationCallback(recordId, isTabUrl);
                }
                break;
            }
        },
        _setStatusAlienRecord: function addonSubstituent__setStatusAlienRecord(recordId, isTabUrl, status) {
            if (status === "increment") {
                let count = this._getStatusAlienRecordPref(recordId);
                status = parseInt(count, 10);
                if (status < MAX_INSTALL_NOTIFICATION_LAUNCHES) {
                    status++;
                }
            }
            switch (status) {
            case "enabled":
            case "disabled":
            case MAX_INSTALL_NOTIFICATION_LAUNCHES:
                this._removeNotificationCallback(recordId);
                break;
            default:
                break;
            }
            if (!this._notificationStack.length) {
                if (status === MAX_INSTALL_NOTIFICATION_LAUNCHES) {
                    let tabUrl = this._application.preferences.get("browser.alien.newtab.url", "");
                    this._application.barnavig.sendRequest({ "vb-accepted": tabUrl });
                }
                this._notification.removeAllInstallNotifications();
            }
            if (isTabUrl) {
                if (status === "enabled") {
                    libScope.Preferences.set("browser.newtab.url", recordId);
                } else if (recordId === libScope.Preferences.get("browser.newtab.url", "")) {
                    this._application.installer.setBrowserNewTabUrl();
                }
                this._setStatusAlienRecordPref(recordId, status);
                return;
            }
            let alienAddon = null;
            this._alienAddons.forEach(function (a) {
                if (a.id === recordId) {
                    alienAddon = a;
                }
            });
            if (!alienAddon) {
                return;
            }
            if (status !== "enabled") {
                if (typeof alienAddon.onDisable === "function") {
                    alienAddon.onDisable(recordId);
                }
            } else {
                if (typeof alienAddon.onEnable === "function") {
                    alienAddon.onEnable(recordId);
                }
            }
            this._setStatusAlienRecordPref(recordId, status);
        },
        _setStatusAlienRecordPref: function addonSubstituent__setStatusAlienRecordPref(recordId, status) {
            let alienAddonRecordsPref = this._application.preferences.get("alienAddonRecords", "{}");
            let alienAddonRecords = JSON.parse(alienAddonRecordsPref);
            alienAddonRecords[recordId] = status;
            this._application.preferences.set("alienAddonRecords", JSON.stringify(alienAddonRecords));
        },
        _getStatusAlienRecordPref: function addonSubstituent__getStatusAlienRecordPref(recordId) {
            let alienAddonRecordsPref = this._application.preferences.get("alienAddonRecords", "{}");
            let aliensAddonRecords = JSON.parse(alienAddonRecordsPref);
            return aliensAddonRecords[recordId];
        },
        _addNotificationCallback: function addonSubstituent__addNotificationCallback(recordId, isTabUrl) {
            this._notificationStack.push({
                id: recordId,
                init: this._setStatusAlienRecord.bind(this, recordId, isTabUrl)
            });
        },
        _removeNotificationCallback: function addonSubstituent__removeNotificationCallback(recordId) {
            this._notificationStack = this._notificationStack.filter(callback => callback.id !== recordId);
        },
        _enableGuard: function addonSubstituent__enableGuard() {
            libScope.Preferences.observe("browser.newtab.url", this._guardObserver, this);
        },
        _disableGuard: function addonSubstituent__disableGuard() {
            libScope.Preferences.ignore("browser.newtab.url", this._guardObserver);
        },
        _guardObserver: function addonSubstituent__guardObserver(value) {
            setTimeout(function addonSubstituent__guardObserverTimed() {
                let pref = libScope.Preferences.get("browser.newtab.url");
                if (this._application.installer.isDefaultNewTabUrl) {
                    return;
                }
                let alienTabUrl = this._application.preferences.get("browser.alien.newtab.url", "");
                if (pref === alienTabUrl && this._getStatusAlienRecordPref(pref) !== "disabled") {
                    return;
                }
                this._notification.showPrefNotification(this._guardCallback.bind(this));
            }.bind(this), 0);
        },
        _guardCallback: function addonSubstituent__guardCallback(status) {
            switch (status) {
            case "fix":
                this._application.installer.setBrowserNewTabUrl();
                this._notification.removeAllPrefNotifications();
                break;
            default:
                break;
            }
        },
        _alienAddons: [{
                name: "Sputnik @Mail.ru",
                id: "{37964a3c-4ee8-47b1-8321-34de2c39ba4d}",
                version: "2.5.3.17",
                onEnable: function onEnableSputnik(recordId) {
                    libScope.Preferences.set("mail.ru.toolbar.visualbookmarks", true);
                },
                onDisable: function onDisableSputnik(recordId) {
                    libScope.Preferences.set("mail.ru.toolbar.visualbookmarks", false);
                }
            }],
        _windowListener: null,
        _notificationStack: []
    };
    function AddonSubstituentNotification() {
        let core = Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject;
        this._application = core.application;
        if (this._application === null) {
            return;
        }
        this._logger = this._application.getLogger("AddonSubstituentNotification");
        this._windowListener = window[this._application.name + "OverlayController"].windowListener;
    }
    AddonSubstituentNotification.prototype = {
        showInstallNotification: function AddonSubstNotification_showInstallNotification(callbacks) {
            let currentBrowser = gBrowser.mCurrentBrowser;
            let ftabUrl = this._application.protocolSupport.url;
            let that = this;
            if (currentBrowser.contentWindow.location.href === ftabUrl) {
                this._createInstallNotification(currentBrowser, callbacks);
            }
            this._loadINListener = {
                observe: function _loadINListener_observe(aSubject, aTopic, aData) {
                    let browser = aData.tab;
                    let ftabUrl = that._application.protocolSupport.url;
                    if (browser.contentWindow.location.href !== ftabUrl) {
                        return;
                    }
                    that._createInstallNotification(browser, callbacks);
                }
            };
            this._windowListener.addListener("PageShow", this._loadINListener);
        },
        showPrefNotification: function AddonSubstNotification_showPrefNotification(callback) {
            libScope.misc.getBrowserWindows().forEach(function (chromeWin) {
                chromeWin.gBrowser.browsers.forEach(function (browser) {
                    this._createPrefNotification(browser, [callback]);
                }, this);
            }, this);
            let that = this;
            this._loadPrefListener = {
                observe: function _loadPrefListener_observe(aSubject, aTopic, aData) {
                    that._createPrefNotification(aData.tab, [callback]);
                }
            };
            this._windowListener.addListener("PageShow", this._loadPrefListener);
        },
        removeAllInstallNotifications: function AddonSubstNotification_removeAllInstallNotifications() {
            this._removeINListener();
            this._closeAllInstallNotifications();
        },
        removeAllPrefNotifications: function AddonSubstNotification_removeAllPrefNotifications() {
            this._removePrefListener();
            this._closeAllPrefNotifications();
        },
        finalize: function AddonSubstNotification__finalize() {
            this._removeINListener();
            this._removePrefListener();
            this._application = null;
            this._logger = null;
            this._windowListener = null;
        },
        _createInstallNotification: function AddonSubstNotification__createInstallNotification(browser, callbacks) {
            let notification = this._createNotification(browser, this.INSTALL_NOTIFICATION_ID);
            notification.setStatus = this._setStatus.bind(this, callbacks);
            this._setStatus(callbacks, "increment");
        },
        _createPrefNotification: function AddonSubstNotification__createPrefNotification(browser, callbacks) {
            let notification = this._createNotification(browser, this.PREF_NOTIFICATION_ID);
            notification.setStatus = this._setStatus.bind(this, callbacks);
        },
        _createNotification: function AddonSubstNotification__createNotification(browser, id) {
            let notificationBox = gBrowser.getNotificationBox(browser);
            let notification = notificationBox.getNotificationWithValue(id);
            if (notification) {
                return notification;
            }
            notification = notificationBox.appendNotification("", id, null, notificationBox.PRIORITY_WARNING_HIGH, [], null);
            return notification;
        },
        _removeINListener: function AddonSubstNotification__removeINListener() {
            this._windowListener.removeListener("PageShow", this._loadINListener);
            this._loadINListener = null;
        },
        _removePrefListener: function AddonSubstNotification__removePrefListener() {
            this._windowListener.removeListener("PageShow", this._loadPrefListener);
            this._loadPrefListener = null;
        },
        _closeAllInstallNotifications: function AddonSubstNotification__closeAllInstallNotifications() {
            this._closeAllNotifications(this.INSTALL_NOTIFICATION_ID);
        },
        _closeAllPrefNotifications: function AddonSubstNotification__closeAllPrefNotifications() {
            this._closeAllNotifications(this.PREF_NOTIFICATION_ID);
        },
        _closeAllNotifications: function AddonSubstNotification__closeAllNotifications(id) {
            if (!id) {
                return;
            }
            libScope.misc.getBrowserWindows().forEach(function (win) {
                let browser = win.gBrowser;
                let panelsLen = browser.mPanelContainer.childNodes.length;
                for (let i = 0; i < panelsLen; i++) {
                    let notificationBox = browser.getNotificationBox(browser.getBrowserAtIndex(i));
                    let notification = notificationBox.getNotificationWithValue(id);
                    if (notification) {
                        notificationBox.removeNotification(notification, true);
                    }
                }
            }, this);
        },
        _setStatus: function AddonSubstNotification__setStatus(callbacks, status) {
            if (!Array.isArray(callbacks)) {
                return;
            }
            callbacks.forEach(function (callback) {
                if (typeof callback === "function") {
                    callback(status);
                } else if (callback && typeof callback.init === "function") {
                    callback.init(status);
                }
            });
        },
        get INSTALL_NOTIFICATION_ID() {
            return this._application.name + "-alien-addon-notification";
        },
        get PREF_NOTIFICATION_ID() {
            return this._application.name + "-pref-addon-notification";
        },
        _loadINListener: null,
        _loadPrefListener: null
    };
    window.addEventListener("load", function onLoadListener() {
        window.removeEventListener("load", onLoadListener, false);
        setTimeout(function onLoadTimed() {
            addonSubstituent.init();
        }, 0);
        window.addEventListener("unload", function unLoadListener() {
            window.removeEventListener("unload", unLoadListener, false);
            addonSubstituent.finalize();
        }, false);
    }, false);
}());
