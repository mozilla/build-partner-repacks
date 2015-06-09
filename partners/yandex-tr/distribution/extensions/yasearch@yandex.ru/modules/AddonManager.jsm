"use strict";
const EXPORTED_SYMBOLS = ["AddonManager"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const AddonManager = {
    SCOPE_PROFILE: 1,
    SCOPE_APPLICATION: 4,
    _started: false,
    _applyCallback: function AM__applyCallback(aCallback) {
        if (!aCallback) {
            return;
        }
        try {
            aCallback.apply(null, Array.slice(arguments, 1));
        } catch (e) {
            Cu.reportError(e);
        }
    },
    get gre_AddonManager() {
        delete this.gre_AddonManager;
        return this.gre_AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm", {}).AddonManager;
    },
    _getInstallRdfContent: function AM__getInstallRdfContent(aExtensionURI) {
        if (aExtensionURI instanceof Ci.nsIFile) {
            let installRDFFile = aExtensionURI;
            installRDFFile.append("install.rdf");
            let content = "";
            try {
                let inputStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
                inputStream.init(installRDFFile, 1, 0, inputStream.CLOSE_ON_EOF);
                let fileSize = inputStream.available();
                let cvstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
                cvstream.init(inputStream, "UTF-8", fileSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
                let data = {};
                cvstream.readString(fileSize, data);
                content = data.value;
                cvstream.close();
            } catch (e) {
                Cu.reportError(e);
            }
            return content;
        }
        let installFileURI = Services.io.newURI(aExtensionURI.resolve("install.rdf"), null, null);
        let installFileChannel = Services.io.newChannelFromURI(installFileURI);
        let installFileStream = installFileChannel.open();
        let content = "";
        let streamSize = installFileStream.available();
        let converterStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
        try {
            let data = {};
            converterStream.init(installFileStream, "UTF-8", streamSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            converterStream.readString(streamSize, data);
            content = data.value;
        } catch (e) {
            Cu.reportError(e);
        } finally {
            converterStream.close();
        }
        return content;
    },
    getAddonVersion: function AM_getAddonVersion(aExtensionURI) {
        let installRdfContent = this._getInstallRdfContent(aExtensionURI);
        if (installRdfContent) {
            let version = installRdfContent.match(/<em:version>([^<]*)<\/em:version>/);
            if (version && /^\d+\.\d+/.test(version[1])) {
                return version[1];
            }
        }
        throw new Error("AddonManager: can't get addon version from install.rdf");
    },
    getAddonId: function AM_getAddonId(aExtensionURI) {
        let installRdfContent = this._getInstallRdfContent(aExtensionURI);
        if (installRdfContent) {
            let addonId = installRdfContent.match(/<em:id>([^<]*)<\/em:id>/);
            if (addonId && addonId[1]) {
                return addonId[1];
            }
        }
        throw new Error("AddonManager: can't get addon id from install.rdf");
    },
    getAddonByID: function AM_getAddonByID(aId, aCallback) {
        this.gre_AddonManager.getAddonByID(aId, aCallback);
    },
    getAddonsByIDs: function AM_getAddonsByIDs(aIds, aCallback) {
        this.gre_AddonManager.getAddonsByIDs(aIds, aCallback);
    },
    _addonListeners: [],
    startup: function AM_startup() {
        if (this._started) {
            return;
        }
        this._started = true;
        let me = this;
        [
            "onEnabling",
            "onEnabled",
            "onDisabling",
            "onDisabled",
            "onInstalling",
            "onInstalled",
            "onUninstalling",
            "onUninstalled",
            "onOperationCancelled",
            "onUpdateAvailable",
            "onNoUpdateAvailable",
            "onUpdateFinished",
            "onCompatibilityUpdateAvailable",
            "onNoCompatibilityUpdateAvailable",
            "onPropertyChanged"
        ].forEach(function (aEvent) {
            me[aEvent] = function () {
                me._notifyAddonListeners.apply(me, [aEvent].concat(Array.slice(arguments)));
            };
        });
        this.gre_AddonManager.addAddonListener(this);
    },
    shutdown: function AM_shutdown() {
        if (!this._started) {
            return;
        }
        this._started = false;
        this.gre_AddonManager.removeAddonListener(this);
        this._addonListeners = null;
        this._watchingAddons = null;
    },
    observe: function AM_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case "browser-ui-startup-complete":
            Services.obs.removeObserver(this, "browser-ui-startup-complete");
            Services.obs.addObserver(this, "xpcom-shutdown", false);
            this.startup();
            break;
        case "xpcom-shutdown":
            Services.obs.removeObserver(this, "xpcom-shutdown");
            this.shutdown();
            break;
        default:
            break;
        }
    },
    onAddonEvent: function AM_onAddonEvent(aEventType, aAddon, aPendingRestart) {
        let addonId = aAddon.id;
        let watchingAddon = this._watchingAddons[addonId] || null;
        if (!watchingAddon) {
            return;
        }
        watchingAddon.installed = aEventType !== "onUninstalling";
    },
    _watchingAddons: Object.create(null),
    watchAddonUninstall: function AM_watchAddonUninstall(aAddonId) {
        this._watchingAddons[aAddonId] = {
            __proto__: null,
            installed: null
        };
        this.addAddonListener(this);
    },
    isAddonUninstalling: function AM_isAddonUninstalling(aAddonId) {
        let watchingAddon = this._watchingAddons[aAddonId] || null;
        return watchingAddon && watchingAddon.installed === false;
    },
    addAddonListener: function AM_addAddonListener(aListener) {
        if (!this._addonListeners.some(function (listener) {
                return listener == aListener;
            })) {
            this._addonListeners.push(aListener);
        }
    },
    removeAddonListener: function AM_removeAddonListener(aListener) {
        this._addonListeners = this._addonListeners.filter(function (listener) {
            return listener != aListener;
        });
    },
    _notifyAddonListeners: function AM__notifyAddonListeners() {
        let args = arguments;
        this._addonListeners.forEach(function (aListener) {
            try {
                aListener.onAddonEvent.apply(aListener, args);
            } catch (e) {
                Cu.reportError("AddonManager._notifyAddonListeners threw exception " + "when calling Listener.onAddonEvent: " + e);
            }
        });
    }
};
Services.obs.addObserver(AddonManager, "browser-ui-startup-complete", false);
