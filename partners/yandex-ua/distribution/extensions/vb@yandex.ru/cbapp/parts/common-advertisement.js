var EXPORTED_SYMBOLS = ["commonAdvertisement"];
var commonAdvertisement = function () {
    var SILENT_PERIOD_MS = 24 * 60 * 60 * 1000;
    var config;
    var locale;
    var brandId;
    function deepExtend(source, destination) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null) {
                destination[property] = destination[property] || {};
                deepExtend(source[property], destination[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    }
    return {
        init: function () {
        },
        finalize: function () {
        },
        calcShownBlockId: function (stateJson) {
            if (!this.isValidStateJson(stateJson)) {
                return null;
            }
            if (!this.isValidConfig()) {
                return null;
            }
            if (this.isSilentPeriod(stateJson)) {
                throw new Error("Called calcShownBlockId inside silent period.");
            }
            var ids = Object.keys(stateJson.blocks);
            ids = ids.filter(function (id) {
                return config.ads[id] && config.ads[id].enabled;
            });
            ids = ids.filter(function (id) {
                if (config.ads[id]["max-refuse-count"] === 0)
                    return true;
                if (config.ads[id]["max-show-count"] === 0)
                    return true;
                var overRefused = stateJson.blocks[id].refuseCount >= config.ads[id]["max-refuse-count"];
                var overShown = stateJson.blocks[id].showCount >= config.ads[id]["max-show-count"];
                return !overRefused && !overShown;
            });
            var now = Date.now();
            ids = ids.filter(function (id) {
                var intervalMs = config.ads[id].interval * 24 * 60 * 60 * 1000;
                var adBlock = stateJson.blocks[id];
                return adBlock.lastShown + intervalMs < now;
            });
            ids = ids.sort(function (a, b) {
                return parseInt(config.ads[a].priority, 10) - parseInt(config.ads[b].priority, 10);
            });
            return ids.length ? ids[0] : null;
        },
        isSilentPeriod: function (stateJson) {
            if (!this.isValidStateJson(stateJson)) {
                throw new Error("Incorrect state json");
            }
            var maxLastShown = 0;
            Object.keys(stateJson.blocks).forEach(function (key) {
                var lastShown = stateJson.blocks[key].lastShown;
                if (lastShown > maxLastShown) {
                    maxLastShown = lastShown;
                }
            });
            return Date.now() - maxLastShown < SILENT_PERIOD_MS;
        },
        setConfig: function (params) {
            brandId = params.brandId;
            locale = params.locale;
            config = this.localizeJSON(params.cloudData, locale, brandId);
        },
        localizeJSON: function (json, currentLocale, currentBranding) {
            var localizedJSON = {};
            deepExtend(json, localizedJSON);
            if (!this.isValidCloudJson(localizedJSON)) {
                throw new Error("Bad arguments passed");
            }
            Object.keys(localizedJSON.ads).forEach(function (key) {
                var adBlock = localizedJSON.ads[key];
                if (adBlock.locale && adBlock.locale[currentLocale]) {
                    deepExtend(adBlock.locale[currentLocale], adBlock);
                }
                if (adBlock.branding && adBlock.branding[currentBranding]) {
                    deepExtend(adBlock.branding[currentBranding], adBlock);
                    if (adBlock.branding[currentBranding].locale && adBlock.branding[currentBranding].locale[currentLocale]) {
                        deepExtend(adBlock.branding[currentBranding].locale[currentLocale], adBlock);
                    }
                }
            });
            return localizedJSON;
        },
        getLocalizedString: function (adId, key) {
            var adBlock = config.ads[adId];
            if (adBlock) {
                var localized = adBlock.locale[locale];
                if (localized) {
                    return localized.texts[key];
                } else {
                    return adBlock.texts[key];
                }
            } else {
                return key;
            }
        },
        getLocalizedURL: function (adId, key) {
            var adBlock = config.ads[adId];
            if (adBlock) {
                return adBlock.urls[key];
            }
            return str;
        },
        isFileForYB: function (filename) {
            return /\.(epub|fb2|pdf|doc|docx|ppt|pptx|rtf)$/i.test(filename);
        },
        isValidConfig: function () {
            return this.isValidCloudJson(config);
        },
        isValidStateJson: function (json) {
            return json && json.blocks;
        },
        isValidCloudJson: function (json) {
            return json && json.ads;
        },
        getSilentPeriodMs: function () {
            return SILENT_PERIOD_MS;
        }
    };
}();
