"use strict";
const EXPORTED_SYMBOLS = ["componentsUsage"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
const componentsUsage = {
        init: function componentsUsage_init(aApplication) {
            this._application = aApplication;
            this._logger = aApplication.getLogger("CompsUsage");
            aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
            this.clear();
            var statDBFile = this._cacheFile;
            if (statDBFile.exists())
                this._database = new Database(statDBFile);
        },
        finalize: function componentsUsage_finalize(doCleanup, callback) {
            var self = this;
            if (this._timer)
                this._timer.cancel();
            this._timer = null;
            if (this._database) {
                this._database.close(function () {
                    if (doCleanup) {
                        fileutils.removeFileSafe(self._cacheFile);
                    }
                    self._database = null;
                    callback();
                });
                return true;
            }
            this._database = null;
        },
        dump: function componentsUsage_dump() {
            this._logger.debug("Statistics:" + "\nshort actions:\n" + sysutils.dump(this._shortActions, 2) + "\nsys actions:\n" + sysutils.dump(this._sysActions, 2) + "\ncustom actions:\n" + sysutils.dump(this._customActions, 2));
        },
        clear: function componentsUsage_clear() {
            this._shortActions = {};
            this._sysActions = {};
            this._customActions = {};
        },
        logCustomAction: function componentsUsage_logCustomAction(componentID, actionID) {
            this._incAction(this._customActions, componentID, actionID);
        },
        logSysAction: function componentsUsage_logSysAction(componentID, actionID) {
            this._incAction(this._sysActions, componentID, actionID);
        },
        logShortAction: function componentsUsage_logShortAction(actionID) {
            if (!(actionID = this._filterActionID(actionID)))
                return;
            if (!(actionID in this._shortActions))
                this._shortActions[actionID] = 0;
            this._shortActions[actionID]++;
        },
        readActions: function componentsUsage_readActions() {
            var allChunks = [];
            for (let actionID in this._shortActions) {
                let actionCount = this._shortActions[actionID];
                let chunk = actionID + (actionCount > 1 ? "." + actionCount : "");
                allChunks.push(chunk);
            }
            for (let componentHash in this._sysActions) {
                for (let actionID in this._sysActions[componentHash]) {
                    let actionCount = this._sysActions[componentHash][actionID];
                    let chunk = componentHash + "-" + actionID + (actionCount > 1 ? "." + actionCount : "");
                    allChunks.push(chunk);
                }
            }
            for (let componentHash in this._customActions) {
                for (let actionID in this._customActions[componentHash]) {
                    let actionCount = this._customActions[componentHash][actionID];
                    let chunk = componentHash + "+" + actionID + (actionCount > 1 ? "." + actionCount : "");
                    allChunks.push(chunk);
                }
            }
            this.clear();
            return allChunks.join(",");
        },
        ACTIONS: {
            COMP_INSTALL: 1,
            COMP_REMOVE: 2,
            COMP_DAYUSE: 3,
            DP_HASH: 4,
            WIDGET_VIS: 5,
            WIDGET_HID: 6,
            BTN_CLICK: 10,
            MENU_CLICK: 11,
            TOOLTIP_SHOWN: 100
        },
        mapToUsageInfo: function componentsUsage_mapToUsageInfo(widgetIDs) {
            var result = [];
            widgetIDs.forEach(function (wdgtProtoID) {
                var componentStat = this.getComponentStat(wdgtProtoID);
                if (!componentStat)
                    return;
                var avgDayUse = componentStat.total / componentStat.days;
                if (avgDayUse > 1 / 7)
                    result.push({
                        id: wdgtProtoID,
                        avgUsage: avgDayUse
                    });
            }, this);
            result.sort(function (a, b) b.weight - a.weight);
            return result;
        },
        getComponentStat: function componentsUsage_getComponentStat(componentID) {
            var result;
            if (this._database) {
                try {
                    result = this._database.execQuery(this._COMPSTAT_QUERY, { id: componentID })[0];
                } catch (e) {
                }
            }
            return result || null;
        },
        onFisrtNavigatorReady: function componentsUsage_onFisrtNavigatorReady() {
            this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            var chkTimePref = this._application.preferences.get(this._consts.LAST_CHK_PREF_NAME, 0);
            this._lastCheckTime = parseInt(chkTimePref, 10) || 0;
            var nextCheckInterval = this._consts.CHK_INTERVAL * 1000 - Math.abs(this._lastCheckTime * 1000 - Date.now());
            nextCheckInterval = Math.max(nextCheckInterval, 0);
            this._timer.initWithCallback(this, nextCheckInterval, this._timer.TYPE_ONE_SHOT);
        },
        notify: function componentsUsage_notify() {
            this._logDaylyStatistics();
            this._rememberDaylyStatTry();
            this._timer.initWithCallback(this, this._consts.CHK_INTERVAL * 1000, this._timer.TYPE_ONE_SHOT);
        },
        _consts: {
            LAST_CHK_PREF_NAME: "daylystat.sent",
            CHK_INTERVAL: 24 * 60 * 60
        },
        _sysActions: null,
        _customActions: null,
        _shortActions: null,
        _database: null,
        _lastReturnedRowID: 0,
        _EMPTY_ROW_RANGE: null,
        _COMPSTAT_QUERY: "        SELECT id, days, btn_clicks, menu_clicks, tooltips, (btn_clicks + menu_clicks + tooltips) as total         FROM (             SELECT id,                 count(*) as days,                 sum(btn_clicks) as btn_clicks,                 sum(menu_clicks) as menu_clicks,                 sum(tooltips) as tooltips             FROM componentsusage             WHERE id = :id )",
        get _cacheFile() {
            var cacheFile = this._application.directories.appRootDir;
            cacheFile.append("statcache.sqlite");
            return cacheFile;
        },
        _filterActionID: function componentsUsage__filterActionID(actionID) {
            var action = Number(actionID);
            if (action > 0) {
                action = "" + action;
                if (action === "" + actionID)
                    return action;
            }
            return null;
        },
        _incAction: function componentsUsage__incAction(actionsMap, componentID, actionID) {
            if (!(actionID = this._filterActionID(actionID)))
                return;
            var componentHash = this._compID2Hash(componentID);
            var compActions = actionsMap[componentHash] || (actionsMap[componentHash] = {});
            if (!(actionID in compActions))
                compActions[actionID] = 0;
            compActions[actionID]++;
        },
        _compID2Hash: function componentsUsage__incAction(componentID) {
            return misc.CryptoHash.getFromString(componentID, "MD5");
        },
        _rememberDaylyStatTry: function componentsUsage__rememberDaylyStatTry() {
            var secondsSinceUnixEpoch = Math.floor(Date.now() / 1000);
            this._application.preferences.set(this._consts.LAST_CHK_PREF_NAME, secondsSinceUnixEpoch);
        },
        _logDaylyStatistics: function componentsUsage__logDaylyStatistics() {
            try {
                this._logActiveComps();
            } catch (e) {
                this._logger.error("Could not log current buttons statistics. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
            try {
                this._postDefPresetDigest();
            } catch (e) {
                this._logger.error("Could not log default preset digest. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        },
        _logActiveComps: function componentsUsage__logActiveComps() {
            var currPluginsState = this._application.widgetLibrary.getCurrentPluginsState();
            for (let [
                        pluginID,
                        activated
                    ] in Iterator(currPluginsState)) {
                if (activated)
                    this.logSysAction(pluginID, this.ACTIONS.COMP_DAYUSE);
            }
            var topWnd = misc.getTopBrowserWindow();
            if (!topWnd)
                return;
            var wndCtrl = topWnd[this._application.name + "OverlayController"];
            wndCtrl.getAllWidgetItems().forEach(function (widgetItem) {
                var widgetProtoID = widgetItem.getAttribute("cb-proto-id");
                var wVis = wndCtrl.widgetIsAlwaysVisible(widgetItem);
                this._logger.debug("Reporting " + widgetProtoID + " as " + (wVis ? "visible" : "invisible"));
                this.logSysAction(widgetProtoID, wVis ? this.ACTIONS.WIDGET_VIS : this.ACTIONS.WIDGET_HID);
            }, this);
            var chevronButton = wndCtrl.chevronButton;
            var chevronVisible = chevronButton && "isHidden" in chevronButton && !chevronButton.isHidden;
            var chevronOpen = chevronVisible && !chevronButton.toolbarsCollapsed;
            if (chevronOpen) {
                let chevronID = "bar:chevron";
                this._logger.debug("Reporting " + chevronID + " as OPEN");
                this.logSysAction(chevronID, this.ACTIONS.COMP_DAYUSE);
            } else {
                this._logger.debug(strutils.formatString("Chevron is hidden or closed. chevronButton: %1, chevronVisible: %2, chevronOpen: %3", [
                    chevronButton,
                    chevronVisible,
                    chevronOpen
                ]));
            }
        },
        _postDefPresetDigest: function componentsUsage__postDefPresetDigest() {
            var allIDsSpaceSeparated = this._application.defaultPreset.allEntries.map(function (presetEntry) presetEntry.componentID).join(" ");
            this.logSysAction(allIDsSpaceSeparated, this.ACTIONS.DP_HASH);
        }
    };
