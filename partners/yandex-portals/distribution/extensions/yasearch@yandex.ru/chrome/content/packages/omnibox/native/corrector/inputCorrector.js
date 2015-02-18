"use strict";
const EXPORTED_SYMBOLS = ["InputCorrector"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const InputCorrector = {
    init: function InputCorrector_init(core) {
        this.core = core;
        if (this.library) {
            this.library.init(core.api);
        }
    },
    finalize: function InputCorrector_finalize() {
        if (this.library) {
            this.library.finalize();
        }
        this.core = null;
    },
    get api() {
        return this.core.api;
    },
    get _libraryPath() {
        let osName = this.api.Environment.os.name;
        let fileName = osName == "windows" ? osName : "simple";
        let path = this.api.Package.resolvePath("/native/corrector/" + fileName + "Corrector.js");
        delete this._libraryPath;
        return this._libraryPath = path;
    },
    get library() {
        let library = null;
        if (this._libraryPath) {
            try {
                library = Cu.import(this._libraryPath, {}).Corrector;
            } catch (e) {
                this.api.logger.error("Can not load corrector module.");
                this.api.logger.debug(e);
            }
        }
        delete this.library;
        return this.library = library;
    },
    getSwitchedLayout: function InputCorrector_getSwitchedLayout(aString) {
        if (this.library) {
            return this.library.getSwitchedLayout(aString);
        }
    },
    hasCurrentLayout: function InputCorrector_hasCurrentLayout(aString) {
        return this.library && this.library.hasCurrentLayout(aString);
    }
};
