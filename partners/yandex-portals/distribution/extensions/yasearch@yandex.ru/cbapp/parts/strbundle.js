"use strict";
const EXPORTED_SYMBOLS = ["appStrings"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const appStrings = {
    init: function StringBundlePart_init(application) {
        this._application = application;
        this.defaultPrefixForURL = "chrome://" + application.name + "/locale/";
    },
    get getPluralForm() {
        this._lazyPluralFormLoader();
        return this.getPluralForm;
    },
    get getNumForms() {
        this._lazyPluralFormLoader();
        return this.getNumForms;
    },
    _lazyPluralFormLoader: function StringBundlePart__lazyPluralFormLoader() {
        delete this.getPluralForm;
        delete this.getNumForms;
        let globalPropsBundle = Services.strings.createBundle(this.defaultPrefixForURL + "global.properties");
        let pluralRule = parseInt(globalPropsBundle.GetStringFromName("pluralRule"), 10);
        const {PluralForm} = Cu.import("resource://gre/modules/PluralForm.jsm", {});
        [
            this.getPluralForm,
            this.getNumForms
        ] = PluralForm.makeGetter(pluralRule);
    },
    defaultPrefixForURL: undefined,
    _application: null
};
appStrings.StringBundle = function StringBundle(aURL) {
    this._url = aURL;
};
appStrings.StringBundle.prototype = {
    get: function StringBundle_get(key, args) {
        let nonBrandResult = args ? this._stringBundle.formatStringFromName(key, args, args.length) : this._stringBundle.GetStringFromName(key);
        return appStrings._application.branding.expandBrandTemplates(nonBrandResult);
    },
    getPlural: function StringBundle_getPlural(key, pluralData, args) {
        if (typeof pluralData == "number") {
            return this._getPluralString(key, pluralData);
        }
        let str = this.get(key, args);
        for (let i = pluralData.length; i--;) {
            let purIndex = i + 1;
            let data = pluralData[i];
            let plurStringKey = typeof data == "number" || !("key" in data) ? [
                key,
                purIndex,
                "Plur"
            ].join("") : data.key;
            let plurNumber = (typeof data == "number" ? data : data.number) || 0;
            let plurString = this._getPluralString(plurStringKey, plurNumber);
            str = str.replace(new RegExp("#" + purIndex, "g"), plurString);
        }
        return str;
    },
    tryGet: function StringBundle_tryGet(key, args, defaultString) {
        try {
            return this.get(key, args);
        } catch (e) {
        }
        return defaultString || "";
    },
    _createURL: function StringBundle__createURL(aURL) {
        if (aURL.startsWith("xb://")) {
            let xbURI = Services.io.newURI(aURL, null, null);
            xbURI.QueryInterface(Ci.nsIFileURL);
            aURL = "file://" + xbURI.file.path;
        }
        return (/^[a-z]+:\/\//.test(aURL) ? "" : appStrings.defaultPrefixForURL) + aURL;
    },
    get _stringBundle() {
        let stringBundle = Services.strings.createBundle(this._createURL(this._url));
        this.__defineGetter__("_stringBundle", function _stringBundle() {
            return stringBundle;
        });
        return this._stringBundle;
    },
    _getPluralString: function StringBundle__getPluralString(aStringKey, aNumber) {
        let plurStrings = this.get(aStringKey).split(";");
        let plurStringNone = appStrings.getNumForms() < plurStrings.length ? plurStrings.shift() : null;
        return aNumber === 0 && plurStringNone !== null ? plurStringNone : appStrings.getPluralForm(aNumber, plurStrings.join(";"));
    }
};
