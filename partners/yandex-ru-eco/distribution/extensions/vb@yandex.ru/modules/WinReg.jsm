"use strict";
const EXPORTED_SYMBOLS = ["WinReg"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const nsIWindowsRegKey = Ci.nsIWindowsRegKey || null;
const WINDOW_OS = Boolean(nsIWindowsRegKey);
var WinReg;
if (!WINDOW_OS) {
    WinReg = {
        read: function WinReg_read() {
            return null;
        },
        write: function WinReg_write() {
            return;
        },
        remove: function WinReg_remove() {
            return;
        }
    };
} else {
    const KEY_NAMES_HASH = {
        CURRENT_USER: [
            "HKCU",
            "USER",
            "CURRENT_USER"
        ],
        CLASSES_ROOT: [
            "HKCR",
            "ROOT",
            "CLASSES_ROOT"
        ],
        LOCAL_MACHINE: [
            "HKLM",
            "MACHINE",
            "LOCAL_MACHINE"
        ]
    };
    let convertName2Key = function convertName2Key(aKeyName) {
        aKeyName = aKeyName.replace(/^(HKEY_)/i, "").toUpperCase();
        let keyName;
        for (let kName in KEY_NAMES_HASH) {
            if (KEY_NAMES_HASH[kName].indexOf(aKeyName) !== -1) {
                keyName = kName;
                break;
            }
        }
        if (!keyName) {
            throw new TypeError("Wrong key name");
        }
        return nsIWindowsRegKey["ROOT_KEY_" + keyName];
    };
    WinReg = {
        read: function WinReg_read(aKey, aPath, aName) {
            let result = null;
            let key = convertName2Key(aKey);
            let wrk = this._getWRK();
            try {
                wrk.open(key, aPath, wrk.ACCESS_READ);
                result = this._readValue(wrk, aName);
            } catch (e) {
            }
            try {
                wrk.close();
            } catch (e) {
            }
            return result;
        },
        write: function WinReg_write(aKey, aPath, aName, aValue, aValueType) {
            let key = convertName2Key(aKey);
            let wrk = this._getWRK();
            try {
                wrk.create(key, aPath, wrk.ACCESS_WRITE);
                this._writeValue(wrk, aName, aValue, aValueType);
            } catch (e) {
            }
            try {
                wrk.close();
            } catch (e) {
            }
        },
        remove: function WinReg_remove(aKey, aPath, aName) {
            let key = convertName2Key(aKey);
            let wrk = this._getWRK();
            try {
                wrk.open(key, aPath, wrk.ACCESS_ALL);
                if (typeof aName == "undefined") {
                    this._removeChildren(wrk);
                } else {
                    wrk.removeChild(aName);
                }
            } catch (e) {
            }
            try {
                wrk.close();
            } catch (e) {
            }
        },
        _readValue: function WinReg__readValue(wrk, value) {
            if (wrk.hasValue(value)) {
                switch (wrk.getValueType(value)) {
                case wrk.TYPE_STRING:
                    return wrk.readStringValue(value);
                case wrk.TYPE_BINARY:
                    return wrk.readBinaryValue(value);
                case wrk.TYPE_INT:
                    return wrk.readIntValue(value);
                case wrk.TYPE_INT64:
                    return wrk.readInt64Value(value);
                default:
                    break;
                }
            }
            return null;
        },
        _writeValue: function WinReg__writeValue(wrk, name, value, type) {
            switch (type.toLowerCase()) {
            case "string":
                wrk.writeStringValue(name, value);
                break;
            case "binary":
                wrk.writeBinaryValue(name, value);
                break;
            case "int":
                wrk.writeIntValue(name, value);
                break;
            case "int64":
                wrk.writeInt64Value(name, value);
                break;
            default:
                throw new TypeError("nsIYaSearch.WinReg: wrong key type");
                break;
            }
        },
        _removeChildren: function WinReg__removeChildren(wrk) {
            for (let i = wrk.childCount - 1; i >= 0; i--) {
                let name = wrk.getChildName(i);
                let subkey = wrk.openChild(name, wrk.ACCESS_ALL);
                this._removeChildren(subkey);
                subkey.close();
                wrk.removeChild(name);
            }
        },
        _getWRK: function WinReg__getWRK() {
            return Cc["@mozilla.org/windows-registry-key;1"].createInstance(nsIWindowsRegKey);
        }
    };
}
