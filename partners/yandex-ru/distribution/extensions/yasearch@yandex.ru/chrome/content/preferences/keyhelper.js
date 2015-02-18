"use strict";
var KeyHelper = {
    initTextbox: function KeyHelper_initTextbox(aTextbox) {
        return new this.KeyTextboxWrapper(aTextbox);
    },
    get KeyTextboxWrapper() {
        function KeyTextboxWrapper(aTextbox) {
            this._textbox = aTextbox;
            this._prefName = null;
            this._init();
        }
        KeyTextboxWrapper.prototype = {
            recognizeEvent: function KeyTextboxWrapper_recognizeEvent(aEvent) {
                aEvent.preventDefault();
                aEvent.stopPropagation();
                let modifiers = [];
                if (aEvent.altKey) {
                    modifiers.push("alt");
                }
                if (aEvent.ctrlKey) {
                    modifiers.push("control");
                }
                if (aEvent.metaKey) {
                    modifiers.push("meta");
                }
                if (aEvent.shiftKey) {
                    modifiers.push("shift");
                }
                modifiers = modifiers.join(" ");
                let key = null;
                let keycode = null;
                if (aEvent.charCode) {
                    key = String.fromCharCode(aEvent.charCode).toUpperCase();
                } else {
                    keycode = KeyHelper.keyNames[aEvent.keyCode];
                    if (!keycode) {
                        return;
                    }
                }
                if (this._prefName) {
                    Preferences.barCore.Lib.Preferences.set(this._prefName, [
                        modifiers,
                        key,
                        keycode
                    ].join("||"));
                }
            },
            observe: function KeyTextboxWrapper_observe(aTopic, aSubject, aData) {
                this._textbox.value = KeyHelper.getFormattedKeyFromPref(aData);
            },
            handleEvent: function KeyTextboxWrapper_handleEvent(aEvent) {
                switch (aEvent.type) {
                case "unload":
                    this.shutdown();
                    break;
                }
            },
            shutdown: function KeyTextboxWrapper_shutdown() {
                window.removeEventListener("unload", this, false);
                if (this._prefName) {
                    Preferences.barCore.Lib.Preferences.ignore(this._prefName, this);
                }
                this._textbox = null;
            },
            _init: function KeyTextboxWrapper__init() {
                this._prefName = this._textbox.getAttributeNS("http://bar.yandex.ru/firefox", "shortcutPreference");
                if (this._prefName) {
                    this._textbox.value = KeyHelper.getFormattedKeyFromPref(this._prefName);
                    Preferences.barCore.Lib.Preferences.observe(this._prefName, this);
                }
                window.addEventListener("unload", this, false);
            }
        };
        delete this.KeyTextboxWrapper;
        return this.KeyTextboxWrapper = KeyTextboxWrapper;
    },
    get keyNames() {
        let keyNames = [];
        for (let prop in KeyEvent) {
            keyNames[KeyEvent[prop]] = prop.replace("DOM_", "");
        }
        keyNames[8] = "VK_BACK";
        delete this.keyNames;
        return this.keyNames = keyNames;
    },
    get platformKeys() {
        const {StringBundle} = Preferences.barCore.application.appStrings;
        let stringBundle = new StringBundle("chrome://global-platform/locale/platformKeys.properties");
        let platformKeys = {
            __proto__: null,
            shift: stringBundle.get("VK_SHIFT"),
            meta: stringBundle.get("VK_META"),
            alt: stringBundle.get("VK_ALT"),
            ctrl: stringBundle.get("VK_CONTROL"),
            sep: stringBundle.get("MODIFIER_SEPARATOR")
        };
        switch (Preferences.barCore.Lib.Preferences.get("ui.key.accelKey")) {
        case 17:
            platformKeys.accel = platformKeys.ctrl;
            break;
        case 18:
            platformKeys.accel = platformKeys.alt;
            break;
        case 224:
            platformKeys.accel = platformKeys.meta;
            break;
        default:
            let os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
            platformKeys.accel = /darwin/i.test(os) ? platformKeys.meta : platformKeys.ctrl;
            break;
        }
        delete this.platformKeys;
        return this.platformKeys = platformKeys;
    },
    get localeKeysStringBundle() {
        let stringBundle = new Preferences.barCore.application.appStrings.StringBundle("chrome://global/locale/keys.properties");
        delete this.localeKeysStringBundle;
        return this.localeKeysStringBundle = stringBundle;
    },
    getFormattedKeyFromPref: function KeyHelper_getFormattedKeyFromPref(aPrefName) {
        let val = Preferences.barCore.Lib.Preferences.get(aPrefName, "");
        return this.getFormattedKey(val);
    },
    getFormattedKey: function KeyHelper_getFormattedKey(aString) {
        let [
            modifiers,
            key,
            keycode
        ] = aString.split("||");
        if (!key && !keycode) {
            return "";
        }
        let val = "";
        if (modifiers) {
            let platformKeys = this.platformKeys;
            val = modifiers.split(/\s+/g).join(platformKeys.sep).replace("alt", platformKeys.alt).replace("shift", platformKeys.shift).replace("control", platformKeys.ctrl).replace("meta", platformKeys.meta).replace("accel", platformKeys.accel);
            val += platformKeys.sep;
        }
        if (key) {
            if (key === " ") {
                val += "Space";
            } else {
                val += key;
            }
        }
        if (keycode) {
            try {
                val += this.localeKeysStringBundle.get(keycode);
            } catch (e) {
                val += "?";
            }
        }
        return val;
    }
};
