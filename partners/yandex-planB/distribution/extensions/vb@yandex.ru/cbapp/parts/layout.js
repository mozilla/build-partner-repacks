"use strict";
const EXPORTED_SYMBOLS = ["layout"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const SCREEN_MGR = Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager);
const OPTIMAL_NUMBER_OF_THUMBS = 12;
Cu.import("resource://gre/modules/Services.jsm");
const layout = {
    MAX_DIMENSION: 7,
    REGULAR_DIMENSION: 5,
    init: function Layout_init(application) {
        this._application = application;
        this._logger = application.getLogger("Layout");
    },
    finalize: function Layout_finalize() {
        this._application = null;
        this._logger = null;
    },
    getOptimalNumberOfThumbs: function Layout_getOptimalNumberOfThumbs() {
        return OPTIMAL_NUMBER_OF_THUMBS;
    },
    getMaxXY: function Layout_getMaxXY() {
        let increased = this._application.preferences.get("ftabs.maxAvailableIncreased", false);
        return increased ? [
            this.MAX_DIMENSION,
            this.MAX_DIMENSION
        ] : [
            this.REGULAR_DIMENSION,
            this.REGULAR_DIMENSION
        ];
    },
    get hasEmptySpace() {
        let [
            maxX,
            maxY
        ] = this.getMaxXY();
        let thumbsNumber = this._application.internalStructure.length;
        if (thumbsNumber === 0) {
            return false;
        }
        return thumbsNumber < maxX * maxY;
    }
};
