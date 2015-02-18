"use strict";
const EXPORTED_SYMBOLS = ["OmniBoxSearchAutoCompleteResult"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
function OmniBoxSearchAutoCompleteResult(searchString, searchResultState, suggestions, maxNumResults, defaultIndex, errorDescription) {
    this._searchString = searchString;
    this._searchResultState = searchResultState;
    this._defaultIndex = defaultIndex;
    this._errorDescription = errorDescription;
    this._maxNumResults = maxNumResults;
    this._entries = suggestions.map(function (suggestion) {
        let value = suggestion.value;
        let styles = (suggestion.style || "").split(/\s+/);
        let action = suggestion.action || null;
        if (action) {
            value = "moz-action:yaaction-" + action.type + "," + action.value + "_yaacsep_" + value;
            styles.push("action");
        }
        return {
            value: value,
            comment: suggestion.comment,
            image: suggestion.image || "",
            style: styles.join(" ")
        };
    });
    if (defaultIndex === 0 && this._entries.length) {
        if (!/(^|\s)yaDefaultComplete(\s|$)/.test(this._entries[0].style)) {
            this._entries[0].style += " yaDefaultComplete";
        }
    }
}
OmniBoxSearchAutoCompleteResult.prototype = {
    _searchString: "",
    _searchResult: 0,
    _defaultIndex: 0,
    _errorDescription: "",
    _entries: [],
    get searchString() {
        return this._searchString;
    },
    get searchResult() {
        return this._searchResultState;
    },
    get defaultIndex() {
        return this._defaultIndex;
    },
    get errorDescription() {
        return this._errorDescription;
    },
    get matchCount() {
        return Math.min(this._entries.length, this._maxNumResults);
    },
    getValueAt: function SACR_getValueAt(aIndex) {
        return this.getLabelAt(aIndex);
    },
    getLabelAt: function SACR_getLabelAt(aIndex) {
        this._checkIndexBounds(aIndex);
        return this._entries[aIndex].value;
    },
    getCommentAt: function SACR_getCommentAt(aIndex) {
        this._checkIndexBounds(aIndex);
        return this._entries[aIndex].comment;
    },
    getStyleAt: function SACR_getStyleAt(aIndex) {
        this._checkIndexBounds(aIndex);
        return this._entries[aIndex].style;
    },
    getImageAt: function SACR_getImageAt(aIndex) {
        this._checkIndexBounds(aIndex);
        return this._entries[aIndex].image;
    },
    removeValueAt: function SACR_removeValueAt(aIndex, aRemoveFromDb) {
        this._checkIndexBounds(aIndex);
    },
    _checkIndexBounds: function SACR__checkIndexBounds(aIndex) {
        if (aIndex < 0 || aIndex >= this._entries.length) {
            throw new Error("Index out of range.");
        }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteResult])
};
