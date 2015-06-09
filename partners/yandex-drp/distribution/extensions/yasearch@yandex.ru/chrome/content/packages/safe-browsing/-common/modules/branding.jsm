var EXPORTED_SYMBOLS = ["module"];
function module(app, common) {
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
    var log = function (str, method) {
        common.log("[-common.branding]: " + str, method);
    };
    var logr = function (str, method) {
        common.logr("[-common.branding]: " + str, method);
    };
    var getBridOldResult = null;
    function getBridOld() {
        if (getBridOldResult) {
            return getBridOldResult;
        }
        var BRANDING_PROVIDER_ID = "ru.yandex.custombar.branding";
        var BRANDING_SERVICE_NAME = "package";
        var brandingServiceListener = {
            observeServiceEvent: function (providerID, serviceName, topic, data) {
            }
        };
        try {
            var brandingService = common.api.Services.obtainService(BRANDING_PROVIDER_ID, BRANDING_SERVICE_NAME, brandingServiceListener);
            if (brandingService) {
                try {
                    getBridOldResult = String(brandingService.getBrandID());
                } catch (exc) {
                }
                common.api.Services.releaseService(BRANDING_PROVIDER_ID, BRANDING_SERVICE_NAME, brandingServiceListener);
            }
        } catch (exc) {
        }
        log(getBridOldResult);
        return getBridOldResult;
    }
    var config = null;
    var brandingModule = {
        getBrandId: function () {
            return common.api.Environment.branding && common.api.Environment.branding.brandID || getBridOld();
        },
        getDomain: function (withKUBR) {
            if (!config) {
                config = {
                    notLocalized: brandingModule.brandingObject(srcConfig, false),
                    full: brandingModule.brandingObject(srcConfig)
                };
            }
            return config[withKUBR ? "full" : "notLocalized"].domains.ya;
        },
        brandingObject: function (obj, lang) {
            if (lang !== false) {
                lang = lang || common.api.Environment.addon.locale.language;
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
            return brandingLocalize(obj, brandingModule.getBrandId(), lang);
        },
        init: function () {
            return this;
        },
        start: function () {
        },
        stop: function () {
        },
        finalize: function () {
        }
    };
    return brandingModule;
}
