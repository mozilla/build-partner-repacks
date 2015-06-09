"use strict";
const EXPORTED_SYMBOLS = ["searchOffer"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const searchOffer = {
    init: function (application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("searchOffer");
    },
    finalize: function (doCleanup) {
        this._application = null;
        this._logger = null;
    },
    get isYandexHomepage() {
        return this._installer.isYandexHomePage();
    },
    get isCurrentQSOverridable() {
        return this._installer.isCurrentQSOverridable();
    },
    setYandexAsCurrentSearchEngine: function () {
        this._installer.setCurrentSearchEngine();
        this._logger.info("Yandex is set as current search engine");
    },
    setYandexAsHomePage: function () {
        this._installer.setBrowserHomePage();
        this._logger.info("Yandex is set as homepage");
    },
    get _installer() {
        delete this._installer;
        return this._installer = this._application.installer;
    }
};
