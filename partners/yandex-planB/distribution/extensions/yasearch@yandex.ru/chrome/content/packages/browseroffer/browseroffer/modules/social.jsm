"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const SUGGETS_HISTORY_SETTING_NAME = "widgetSuggest.history";
var module = function (app, common) {
    let browserofferSocial = {
        get app() {
            return this._app;
        },
        init: function (application) {
            this._app = application;
            this._restoreSuggestHistory();
            this._markActiveSocialWidgetsInSuggestHistory();
        },
        finalize: function () {
            this._saveSuggestHistory();
            this._app = null;
        },
        shouldMonitor: function () {
            return Boolean(this.app.socialPagesInfo.length);
        },
        _markSocialWidgetAdded: function (aWidgetId) {
            let widgetSuggestHistory = this._suggestHistory[aWidgetId];
            if (!widgetSuggestHistory) {
                throw new Error("Unknown social page widget id:" + aWidgetId);
            }
            widgetSuggestHistory.existed = true;
        },
        findSocialWidgetForHost: function (aHost) {
            let emptyResult = [];
            let socialPageData = this._findSocialPageData(aHost);
            if (!socialPageData) {
                return emptyResult;
            }
            let socialPageSuggestHistory = this._suggestHistory[socialPageData.widgetID];
            if (socialPageSuggestHistory.existed || socialPageSuggestHistory.counter >= 3) {
                return emptyResult;
            }
            let socialWidgetIsActive = this._checkWidgetIsActive(socialPageData.widgetID);
            if (socialWidgetIsActive) {
                socialPageSuggestHistory.existed = true;
                return emptyResult;
            }
            if (socialWidgetIsActive === false) {
                if (!this._isAuthorzedInSocialPage(socialPageData.name)) {
                    return emptyResult;
                }
                if (socialPageSuggestHistory.shownAt) {
                    if (socialPageSuggestHistory.shownAt < 0) {
                        let eclipseTime = 60 * 60 * 1000;
                        let showStartTime = -socialPageSuggestHistory.shownAt;
                        if (Math.abs(Date.now() - showStartTime) > eclipseTime) {
                            this._pauseWidgetSuggest(socialPageData.widgetID, showStartTime + eclipseTime);
                        }
                    }
                    if (socialPageSuggestHistory.shownAt > 0) {
                        let eclipseTime = 7 * 24 * 60 * 60 * 1000;
                        let periodStartTime = socialPageSuggestHistory.shownAt;
                        if (Math.abs(Date.now() - periodStartTime) < eclipseTime) {
                            return emptyResult;
                        }
                        this._playWidgetSuggest(socialPageData.widgetID);
                    }
                } else {
                    this._playWidgetSuggest(socialPageData.widgetID);
                }
                return [
                    socialPageData.name,
                    socialPageData.widgetID
                ];
            }
            return emptyResult;
        },
        handleUserAction: function (aAction, aWidgetId) {
            switch (aAction) {
            case "close":
                this._pauseWidgetSuggest(aWidgetId);
                break;
            case "agree":
                this._markSocialWidgetAdded(aWidgetId);
                common.observerService.notify("add-social-widget", aWidgetId);
                break;
            default:
                return;
            }
            common.observerService.notify("close-notification", JSON.stringify({
                social: true,
                widgetId: aWidgetId
            }));
        },
        _suggestHistory: Object.create(null),
        _restoreSuggestHistory: function () {
            let wsHistory = this._getSuggestHistoryFromPrefs();
            if (!isObject(wsHistory)) {
                wsHistory = Object.create(null);
            }
            this.app.socialPagesInfo.forEach(aSocialPage => {
                if (!isObject(wsHistory[aSocialPage.widgetID])) {
                    wsHistory[aSocialPage.widgetID] = Object.create(null);
                }
            });
            this._suggestHistory = wsHistory;
        },
        _saveSuggestHistory: function () {
            let suggestHistory = {};
            try {
                suggestHistory = JSON.stringify(this._suggestHistory);
            } catch (e) {
                this.app.log("Suggest history serializing failed. msg:" + e.message);
            }
            this._saveSuggestHistoryToPrefs(suggestHistory);
        },
        _getSuggestHistoryFromPrefs: function () {
            try {
                return JSON.parse(this.app.getPref(SUGGETS_HISTORY_SETTING_NAME, undefined));
            } catch (e) {
                return null;
            }
        },
        _saveSuggestHistoryToPrefs: function (aSuggestHistory) {
            try {
                this.app.setPref(SUGGETS_HISTORY_SETTING_NAME, aSuggestHistory);
            } catch (e) {
                this.app.log("Saving suggest history failed. msg:" + e.message);
            }
        },
        _pauseWidgetSuggest: function (aWidgetId, aSinceTime) {
            let socialPageSuggestHistory = this._suggestHistory[aWidgetId];
            if (!socialPageSuggestHistory) {
                throw new Error("Unknown social page widget id:" + aWidgetId);
            }
            let timestamp = aSinceTime || Date.now();
            if (!socialPageSuggestHistory.counter) {
                socialPageSuggestHistory.counter = 0;
            }
            socialPageSuggestHistory.counter++;
            socialPageSuggestHistory.shownAt = timestamp;
            logger("Pause social page widget suggest. WidgetId:" + aWidgetId + "; timestamp:" + timestamp);
        },
        _playWidgetSuggest: function (aWidgetId) {
            let socialPageSuggestHistory = this._suggestHistory[aWidgetId];
            if (!socialPageSuggestHistory) {
                throw new Error("Unknown social page widget id: " + aWidgetId);
            }
            socialPageSuggestHistory.shownAt = -Date.now();
            logger("Start social page widget suggest. WidgetId:" + aWidgetId + "; timestamp:" + socialPageSuggestHistory.shownAt);
        },
        _markActiveSocialWidgetsInSuggestHistory: function () {
            let widgetsId = this.app.socialPagesInfo.reduce(function (aIds, aSocialPage) {
                aIds.push(aSocialPage.widgetID);
                return aIds;
            }, []);
            let activeWidgets = this._checkWidgetsAreActive(widgetsId);
            for (let widgetID in activeWidgets) {
                if (activeWidgets[widgetID]) {
                    this._markSocialWidgetAdded(widgetID);
                }
            }
        },
        _checkWidgetsAreActive: function (aWidgetsId) {
            return this.app.api.Overlay.checkWidgetsInCurrentSet(aWidgetsId);
        },
        _checkWidgetIsActive: function (aWidgetID) {
            let widgetsInfo = this.app.api.Overlay.checkWidgetsInCurrentSet(aWidgetID);
            return widgetsInfo[aWidgetID];
        },
        _findSocialPageData: function (aHost) {
            return this.app.socialPagesInfo.filter(aSocialPage => aSocialPage.domain.indexOf(aHost) > -1)[0];
        },
        _isAuthorzedInSocialPage: function (aSocialName) {
            let socialPage = this.app.socialPagesInfo.filter(aSocialPage => aSocialPage.name === aSocialName)[0];
            if (!socialPage) {
                throw new Error("Social page authorization check failed. Unknown social page name: " + aSocialName);
            }
            if (socialPage.name === "vk") {
                let regexp = /^remixsid/i;
                return socialPage.domain.some(function (aDomain) {
                    let cookies = this.app.api.Network.getCookiesFromHost(aDomain);
                    return cookies.some(function (aCookie) {
                        return regexp.test(aCookie.name);
                    });
                }, this);
            }
            return socialPage.domain.some(function (aDomain) {
                return socialPage.cookie.some(function (aCookieName) {
                    return this.app.api.Network.findCookies("http://" + aDomain, aCookieName, true, true, false).length;
                }, this);
            }, this);
        }
    };
    function isObject(aObj) {
        return aObj && typeof aObj === "object" && !Array.isArray(aObj);
    }
    function logger(msg) {
        app.log(msg);
    }
    return browserofferSocial;
};
