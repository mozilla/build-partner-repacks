"use strict";
const EXPORTED_SYMBOLS = ["Corrector"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/ctypes.jsm");
const MAPVK_VK_TO_VSC = 0;
const Corrector = {
    init: function Corrector_init(api) {
        this._englishLayout = new this.HKL(67699721);
    },
    finalize: function Corrector_finalize() {
        this._englishLayout = null;
    },
    get HKL() {
        let hkl = ctypes.StructType("HKL", [{ unused: ctypes.int }]);
        this.__defineGetter__("HKL", function HKL_maker() {
            return hkl;
        });
        return this.HKL;
    },
    get GetCurrentThreadId() {
        delete this.GetCurrentThreadId;
        return this.GetCurrentThreadId = this._libraries.kernel32.declare("GetCurrentThreadId", ctypes.winapi_abi, ctypes.int32_t);
    },
    get GetKeyboardLayout() {
        delete this.GetKeyboardLayout;
        return this.GetKeyboardLayout = this._libraries.user32.declare("GetKeyboardLayout", ctypes.winapi_abi, ctypes.int, this.HKL);
    },
    get GetKeyboardLayoutList() {
        delete this.GetKeyboardLayoutList;
        return this.GetKeyboardLayoutList = this._libraries.user32.declare("GetKeyboardLayoutList", ctypes.winapi_abi, ctypes.int32_t, ctypes.int32_t, ctypes.voidptr_t);
    },
    get VkKeyScanExW() {
        delete this.VkKeyScanExW;
        return this.VkKeyScanExW = this._libraries.user32.declare("VkKeyScanExW", ctypes.winapi_abi, ctypes.int16_t, ctypes.jschar, this.HKL);
    },
    get MapVirtualKeyW() {
        delete this.MapVirtualKeyW;
        return this.MapVirtualKeyW = this._libraries.user32.declare("MapVirtualKeyW", ctypes.winapi_abi, ctypes.int32_t, ctypes.int, ctypes.int);
    },
    get ToUnicodeEx() {
        delete this.ToUnicodeEx;
        return this.ToUnicodeEx = this._libraries.user32.declare("ToUnicodeEx", ctypes.winapi_abi, ctypes.int, ctypes.int, ctypes.int, ctypes.char.ptr.array(), ctypes.jschar.ptr, ctypes.int, ctypes.int, this.HKL);
    },
    get _libraries() {
        let libraries = {
            user32: ctypes.open(this._getSystem32LibPath("User32.dll")),
            kernel32: ctypes.open(this._getSystem32LibPath("Kernel32.dll"))
        };
        if (!libraries.user32) {
            throw new Error("Unable to load User32.dll library");
        }
        if (!libraries.kernel32) {
            throw new Error("Unable to load Kernel32.dll library");
        }
        delete this._libraries;
        return this._libraries = libraries;
    },
    _getSystem32LibPath: function Corrector__getSystem32LibPath(dllName) {
        let sysPath = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("SysD", Ci.nsIFile);
        sysPath.append(dllName);
        return sysPath.path;
    },
    get _keyboardLayoutList() {
        let layoutsCount = this.GetKeyboardLayoutList(0, null);
        let theLayouts = new new ctypes.ArrayType(this.HKL, layoutsCount)();
        this.GetKeyboardLayoutList(layoutsCount, theLayouts.address());
        delete this._keyboardLayoutList;
        return this._keyboardLayoutList = theLayouts;
    },
    _determineCharLayout: function Corrector__determineCharLayout(ch) {
        let systemLocales = this._keyboardLayoutList;
        for (let i = 0; i < systemLocales.length; i++) {
            let virtualKey = this.VkKeyScanExW(ch, this.HKL(systemLocales[i].unused));
            if (virtualKey !== -1) {
                return systemLocales[i];
            }
        }
        return null;
    },
    _determineTextLayout: function Corrector__determineTextLayout(string) {
        let textLayout;
        let i = 0;
        while (!textLayout && i < string.length) {
            textLayout = this._determineCharLayout(string[i++]);
        }
        if (!textLayout) {
            return null;
        }
        let layouts = {
            text: textLayout,
            alt: null
        };
        if (textLayout.unused !== this._englishLayout.unused) {
            layouts.alt = this._englishLayout;
        } else if (this._keyboardLayoutList.length > 1) {
            layouts.alt = textLayout.unused === this._keyboardLayoutList[0].unused ? this._keyboardLayoutList[1] : this._keyboardLayoutList[0];
        }
        return layouts;
    },
    _translateChar: function Corrector__translateChar(ch, srcLayout, dstLayout) {
        if (/\d/.test(ch)) {
            return null;
        }
        let virtualKey = this.VkKeyScanExW(ch, this.HKL(srcLayout.unused));
        if (virtualKey === -1) {
            return null;
        }
        let scanCode = this.MapVirtualKeyW(virtualKey, MAPVK_VK_TO_VSC);
        let charBuffer = new new ctypes.ArrayType(ctypes.jschar, 1)();
        let translated = this.ToUnicodeEx(virtualKey, scanCode, ctypes.char.ptr.array(255)(), charBuffer, 1, 0, this.HKL(dstLayout.unused));
        if (translated === 1) {
            let translatedChar = charBuffer.readString();
            if (!/\d/.test(translatedChar)) {
                return translatedChar;
            }
        }
        return null;
    },
    _translateString: function Corrector__translateString(string, srcLayout, dstLayout) {
        return string.split("").map(function (ch) {
            let ret = this._translateChar(ch, srcLayout, dstLayout);
            if (ret !== null && ch.toLowerCase() !== ch) {
                return ret.toUpperCase();
            }
            return ret || "";
        }, this).join("");
    },
    getSwitchedLayout: function Corrector_getSwitchedLayout(string) {
        if (!string) {
            return string;
        }
        let layouts = this._determineTextLayout(string);
        if (layouts && layouts.alt !== null && layouts.alt.unused !== 0) {
            return this._translateString(string, layouts.text, layouts.alt);
        }
        return string;
    },
    hasCurrentLayout: function Corrector_hasCurrentLayout(string) {
        let threadID = this.GetCurrentThreadId();
        let currentLayout = this.GetKeyboardLayout(this.HKL(threadID));
        let layouts = this._determineTextLayout(string);
        return Boolean(layouts && layouts.text.unused === currentLayout);
    }
};
