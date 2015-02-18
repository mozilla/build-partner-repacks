"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var log = function (str, method) {
        common.log("[-common.stat]: " + str, method);
    };
    function empty() {
    }
    return {
        log: function statistics_log({dtype, pid, cid, path}) {
            if (common.api.Statistics.logClickStatistics) {
                common.api.Statistics.logClickStatistics(arguments[0]);
            } else {
                var url = "http://clck.yandex.ru/click" + "/dtype=" + encodeURIComponent(dtype || "stred") + "/pid=" + (pid || 12) + "/cid=" + cid + "/path=" + encodeURIComponent(path) + "/*";
                common.http.GET({
                    url: url,
                    end: empty
                });
            }
        },
        logNotif: function statistics_logNotif(path) {
            this.log({
                cid: 72358,
                path: path
            });
        },
        logWidget: function statistics_logWidget(path) {
            this.log({
                cid: 72359,
                path: path
            });
        },
        get alwaysSendUsageStat() {
            return common.api.Statistics.alwaysSendUsageStat;
        }
    };
};
