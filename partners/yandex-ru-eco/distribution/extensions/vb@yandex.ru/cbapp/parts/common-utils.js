"use strict";
var EXPORTED_SYMBOLS = ["commonUtils"];
var commonUtils = function () {
    return {
        init: function () {
        },
        finalize: function () {
        },
        compareVersions: function advertisement_compareVersions(ver1, ver2) {
            if (typeof ver1 === "number") {
                ver1 = ver1.toString();
            }
            if (typeof ver2 === "number") {
                ver2 = ver2.toString();
            }
            ver1 = ver1.split(".");
            ver2 = ver2.split(".");
            var maxLevel = Math.max(ver1.length, ver2.length) - 1;
            for (var currentLevel = 0; currentLevel <= maxLevel; currentLevel++) {
                var subVer1 = parseInt(ver1[currentLevel] || 0, 10);
                var subVer2 = parseInt(ver2[currentLevel] || 0, 10);
                if (subVer1 > subVer2) {
                    return 1;
                }
                if (subVer1 < subVer2) {
                    return -1;
                }
                if (currentLevel === maxLevel) {
                    return 0;
                }
            }
            return 0;
        },
        compareDate: function advertisement_compareDate(date1, date2) {
            date1 = date1.split(".");
            date2 = date2.split(".");
            var maxDate = Math.max(date1.length, date2.length) - 1;
            for (var currentLevel = maxDate; currentLevel >= 0; currentLevel--) {
                var subDate1 = parseInt(date1[currentLevel] || 0, 10);
                var subDate2 = parseInt(date2[currentLevel] || 0, 10);
                if (subDate1 > subDate2) {
                    return 1;
                }
                if (subDate1 < subDate2) {
                    return -1;
                }
            }
            return 0;
        },
        getTodayDateString: function advertisement_getCustomDateString() {
            var today = new Date();
            var day = today.getDate();
            var month = today.getMonth() + 1;
            var year = today.getFullYear();
            return [
                day < 10 ? "0" + day : day,
                month < 10 ? "0" + month : month,
                year
            ].join(".");
        }
    };
}();
