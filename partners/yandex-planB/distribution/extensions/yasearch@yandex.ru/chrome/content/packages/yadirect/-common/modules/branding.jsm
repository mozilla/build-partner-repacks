var EXPORTED_SYMBOLS = ["module"];
function module(app, common) {
    var BRANDING_PROVIDER_ID = "ru.yandex.custombar.branding";
    var BRANDING_SERVICE_NAME = "package";
    var BRANDING_TOPIC_UPDATED = "package updated";
    var BRANDING_DEFAULT_ID = "";
    var srcConfig = {
        domains: {
            ya: "yandex.ru",
            locale: {
                be: { ya: "yandex.by" },
                uk: { ya: "yandex.ua" },
                kk: { ya: "yandex.kz" }
            }
        },
        branding: {
            tb: { domains: { ya: "yandex.com.tr" } },
            ua: { domains: { ya: "yandex.ua" } }
        }
    };
    var config = null;
    function brandingConfig() {
        config = {
            notLocalized: brandingModule.brandingObject(srcConfig, false),
            full: brandingModule.brandingObject(srcConfig)
        };
    }
    var log = function (str, method) {
        common.log("[-common.branding]: " + str, method);
    };
    var logr = function (str, method) {
        common.logr("[-common.branding]: " + str, method);
    };
    var barAPI = common.api;
    var brandingService = null;
    var brID = "";
    var onbridchange = null;
    var inited = false;
    function getBrandId() {
        var retVal = BRANDING_DEFAULT_ID;
        if (!brandingService) {
            return retVal;
        }
        try {
            retVal = String(brandingService.getBrandID());
        } catch (e) {
            Components.utils.reportError(e);
        }
        return retVal;
    }
    var brandingServiceListener = {
        observeServiceEvent: function (providerID, serviceName, topic, data) {
            if (topic == BRANDING_TOPIC_UPDATED) {
                var oldBrid = brID;
                brID = getBrandId();
                if (oldBrid != brID) {
                    brandingConfig();
                    if (onbridchange) {
                        onbridchange(brID, oldBrid);
                    }
                }
            }
        }
    };
    var brandingModule = {
        getBrandId: function () {
            return brID;
        },
        getDomain: function (withKUBR) {
            return config[withKUBR ? "full" : "notLocalized"].domains.ya;
        },
        brandingObject: function (obj, lang) {
            if (lang !== false) {
                lang = lang || barAPI.Environment.addon.locale.language;
            }
            function brandingLocalize(obj, brid, loc, ret) {
                if (!obj || !brid && !loc && !ret || typeof obj != "object") {
                    return obj;
                }
                if (common.utils.isRegExp(obj)) {
                    return obj;
                }
                if (common.utils.isArray(obj)) {
                    var arr = obj;
                    if (obj.length) {
                        arr = [];
                        for (var i = 0; i < obj.length; ++i) {
                            arr.push(brandingLocalize(obj[i], brid, loc));
                        }
                    }
                    return arr;
                }
                ret = ret || {};
                for (var i in obj) {
                    if (i !== "locale" && i !== "branding" && obj.hasOwnProperty(i)) {
                        ret[i] = brandingLocalize(obj[i], brid, loc);
                    }
                }
                if (brid && obj.branding) {
                    var bdepth = 10, brand = obj.branding[brid];
                    while (--bdepth && brand && typeof brand === "string") {
                        brand = obj.branding[brand];
                    }
                    brandingLocalize(brand, brid, loc, ret);
                }
                if (loc && obj.locale) {
                    var ldepth = 10, locale = obj.locale[loc];
                    while (--ldepth && locale && typeof locale === "string") {
                        locale = obj.locale[locale];
                    }
                    brandingLocalize(locale, brid, loc, ret);
                }
                return ret;
            }
            return brandingLocalize(obj, brID, lang);
        },
        init: function (callback) {
            if (inited) {
                return;
            }
            inited = true;
            onbridchange = callback;
            this.start();
            brandingConfig();
            return this;
        },
        start: function () {
            if (brandingService) {
                return;
            }
            try {
                brandingService = barAPI.Services.obtainService(BRANDING_PROVIDER_ID, BRANDING_SERVICE_NAME, brandingServiceListener);
            } catch (exc) {
                brandingService = null;
                logr("[common.branding]: service error", "error");
                return;
            }
            brID = getBrandId();
        },
        stop: function () {
            if (!brandingService) {
                return;
            }
            barAPI.Services.releaseService(BRANDING_PROVIDER_ID, BRANDING_SERVICE_NAME, brandingServiceListener);
            brandingService = null;
        },
        finalize: function () {
            if (!inited) {
                return;
            }
            log("finalize");
            inited = false;
            this.stop();
            brID = "";
            onbridchange = null;
        }
    };
    return brandingModule;
}
