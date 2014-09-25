var EXPORTED_SYMBOLS = ["commonUtils"];
var commonUtils = function () {
        return {
            init: function () {
            },
            finalize: function () {
            },
            compareVersions: function advertisement_compareVersions(ver1, ver2) {
                if (typeof ver1 === "number")
                    ver1 = ver1.toString();
                if (typeof ver2 === "number")
                    ver2 = ver2.toString();
                ver1 = ver1.split(".");
                ver2 = ver2.split(".");
                var maxLevel = Math.max(ver1.length, ver2.length) - 1;
                for (var currentLevel = 0; currentLevel <= maxLevel; currentLevel++) {
                    var subVer1 = parseInt(ver1[currentLevel] || 0, 10);
                    var subVer2 = parseInt(ver2[currentLevel] || 0, 10);
                    if (subVer1 > subVer2)
                        return 1;
                    else if (subVer1 < subVer2)
                        return -1;
                    else if (currentLevel === maxLevel)
                        return 0;
                }
                return 0;
            }
        };
    }();
