"use strict";
const EXPORTED_SYMBOLS = ["Corrector"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const UConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
UConverter.charset = "UTF-8";
const russianLayout = UConverter.ConvertToUnicode("йцукенгшщзхъфывапролджэячсмитьбюёЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮЁіІ");
const englishLayout = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`QWERTYUIOP[]ASDFGHJKL;'ZXCVBNM,.`sS";
const Corrector = {
    init: function Corrector_init(api) {
        this.api = api;
    },
    finalize: function Corrector_finalize() {
    },
    getSwitchedLayout: function Corrector_getSwitchedLayout(aString) {
        return aString.split("").map(function (chr) {
            let engIndex = englishLayout.indexOf(chr);
            if (engIndex !== -1) {
                return russianLayout[engIndex];
            }
            let rusIndex = russianLayout.indexOf(chr);
            if (rusIndex !== -1) {
                return englishLayout[rusIndex];
            }
            return chr;
        }).join("");
    },
    hasCurrentLayout: function Corrector_hasCurrentLayout(aString) {
        return true;
    }
};
