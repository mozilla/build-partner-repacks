"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        aMigrationModule.app.core.Lib.sysutils.copyProperties(aMigrationModule.app.core.Lib, GLOBAL);
        this._migrationArray = [{
                id: "settings",
                action: this._migrateSettings.bind(this)
            }];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _migrateSettings: function migrator__migrateSettings() {
        let app = this._migrationModule.app;
        let prefs = app.preferences;
        const BAR_EXTENSION_ID = "yasearch@yandex.ru";
        if (prefs.get("ftabs.searchStatus") === 3) {
            AddonManager.gre_AddonManager.getAddonByID(BAR_EXTENSION_ID, function (addonData) {
                let isBarInstalled = addonData !== null && addonData.installDate && addonData.isActive;
                if (app.addonManager.info.isFreshAddonInstall) {
                    if (isBarInstalled === false) {
                        prefs.set("ftabs.searchStatus", 0);
                    }
                } else {
                    if (isBarInstalled) {
                        prefs.set("ftabs.searchStatus", 1);
                    } else {
                        prefs.set("ftabs.searchStatus", 0);
                    }
                }
            });
        }
        let userBgImagePref = prefs.get("ftabs.backgroundImage", "");
        if (userBgImagePref.length) {
            let userBgImage = app.core.rootDir;
            userBgImage.append("ftab-data");
            userBgImage.append("backgrounds");
            if (userBgImage.exists() && userBgImage.isDirectory()) {
                userBgImage.append(userBgImagePref.split("/").pop());
                if (userBgImage.exists() && userBgImage.isFile() && userBgImage.isReadable()) {
                    let extension = userBgImage.leafName.split(".").pop().toLowerCase();
                    let fileName = "user." + extension;
                    let bgImagesDir = app.core.rootDir;
                    bgImagesDir.append("backgroundImages");
                    if (!bgImagesDir.exists()) {
                        bgImagesDir.create(Ci.nsIFile.DIRECTORY_TYPE, fileutils.PERMS_DIRECTORY);
                    }
                    prefs.set("ftabs.backgroundImage", fileName);
                    userBgImage.copyTo(bgImagesDir, fileName);
                }
            }
        }
        let oldScreensDB = app.core.rootDir;
        oldScreensDB.append(app.name + "-storage.sqlite");
        if (oldScreensDB.exists() && oldScreensDB.isFile()) {
            oldScreensDB.remove(true);
        }
        let ftabsXmlDataFile = app.core.rootDir;
        ftabsXmlDataFile.append("ftab.data.xml");
        if (ftabsXmlDataFile.exists() && ftabsXmlDataFile.isFile()) {
            let xmlDoc = fileutils.xmlDocFromFile(ftabsXmlDataFile);
            let now = Math.round(Date.now() / 1000);
            let dbFile = app.core.rootDir;
            dbFile.append("fastdial.sqlite");
            let database = new Database(dbFile);
            let defaultXY = this._getDefaultThumbsNumXY();
            let numThumbsDefault = defaultXY[0] * defaultXY[1];
            let gridPrefValue = prefs.get("ftabs.gridLayout");
            let backbone;
            try {
                let backbonePrefValue = JSON.parse(gridPrefValue);
                backbone = [
                    backbonePrefValue[0].length,
                    backbonePrefValue.length
                ];
            } catch (ex) {
                backbone = defaultXY;
            }
            let newLayoutX = false;
            let newLayoutY = false;
            let maxAvailableIncreased = false;
            let filledPages = xmlDoc.querySelectorAll("pages > page:not([url=''])");
            let filledPagesNum = 0;
            let totalPagesNum = backbone[0] * backbone[1];
            let foldEmptyThumbs = false;
            let threadPosition;
            Array.forEach(filledPages, function (page) {
                let position = parseInt(page.getAttribute("index"), 10);
                if (position <= totalPagesNum) {
                    filledPagesNum += 1;
                }
            });
            this._migrationModule.logger.debug("Total thumbs num: " + totalPagesNum);
            this._migrationModule.logger.debug("Filled thumbs num: " + filledPagesNum);
            this._migrationModule.logger.debug("Default thumbs num: " + numThumbsDefault);
            if (filledPagesNum > 25) {
                maxAvailableIncreased = true;
                newLayoutX = Math.min(7, backbone[0]);
                newLayoutY = Math.min(7, backbone[1]);
                threadPosition = 1;
            } else {
                if (totalPagesNum > 25) {
                    foldEmptyThumbs = true;
                    newLayoutX = 5;
                    newLayoutY = 5;
                    threadPosition = 2;
                } else {
                    if (totalPagesNum < numThumbsDefault) {
                        [
                            newLayoutX,
                            newLayoutY
                        ] = defaultXY;
                        foldEmptyThumbs = true;
                        threadPosition = 3;
                    } else {
                        if (filledPagesNum < numThumbsDefault) {
                            [
                                newLayoutX,
                                newLayoutY
                            ] = defaultXY;
                            foldEmptyThumbs = true;
                            threadPosition = 4;
                        } else {
                            newLayoutX = 5;
                            newLayoutY = 5;
                            threadPosition = 5;
                        }
                    }
                }
            }
            this._migrationModule.logger.debug("Thread position selected: " + threadPosition);
            prefs.set("ftabs.layoutX", newLayoutX);
            prefs.set("ftabs.layoutY", newLayoutY);
            if (newLayoutX * newLayoutY > totalPagesNum) {
                prefs.set("ftabs.emptyLastThumb", true);
            }
            if (maxAvailableIncreased) {
                prefs.set("ftabs.maxAvailableIncreased", true);
            }
            let newTotalThumbsNum = newLayoutX * newLayoutY;
            let insertedURLs = {};
            Array.forEach(filledPages, function (page, index) {
                let position = foldEmptyThumbs ? index : parseInt(page.getAttribute("index"), 10) - 1;
                if (position >= newTotalThumbsNum) {
                    return;
                }
                let url = page.getAttribute("url");
                try {
                    let title = page.getAttribute("custom_title");
                    if (title.length === 0) {
                        title = null;
                    }
                    if (insertedURLs[url] === undefined) {
                        database.execQuery("INSERT INTO thumbs(url, title, insertTimestamp) VALUES(:url, :title, :ts)", {
                            url: url,
                            title: title,
                            ts: now
                        });
                        insertedURLs[url] = [
                            database.lastInsertRowID,
                            title
                        ];
                        this._migrationModule.logger.debug("Thumb '" + url + "' inserted " + "with rowid " + insertedURLs[url][0]);
                    } else {
                        this._migrationModule.logger.debug("Thumb '" + url + "' has been already " + "inserted with rowid " + insertedURLs[url][0]);
                        if (insertedURLs[url][1] === null && title !== null) {
                            database.execQuery("UPDATE thumbs SET title = :title WHERE rowid = :id", {
                                title: title,
                                id: insertedURLs[url][0]
                            });
                            insertedURLs[url][1] = title;
                        }
                    }
                    database.execQuery("INSERT INTO thumbs_shown(thumb_id, position, fixed) VALUES(:id, :position, 1)", {
                        id: insertedURLs[url][0],
                        position: position
                    });
                    this._migrationModule.logger.debug("Thumb info inserted");
                } catch (e) {
                    this._migrationModule.logger.error("Failed to migrate thumb with URL '" + url + "': " + strutils.formatError(e));
                    this._migrationModule.logger.debug(e.stack);
                    throw e;
                }
            }, this);
            fileutils.removeFileSafe(ftabsXmlDataFile);
            database.close();
        }
        let oldDataDir = app.core.rootDir;
        oldDataDir.append("ftab-data");
        if (oldDataDir.exists() && oldDataDir.isDirectory()) {
            oldDataDir.remove(true);
        }
    },
    _getDefaultThumbsNumXY: function migrator__getDefaultThumbsNumXY() {
        let thumbsNumX;
        let thumbsNumY;
        let width = {};
        let height = {};
        let primaryScreen = Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager).primaryScreen;
        primaryScreen.GetRect({}, {}, width, height);
        [
            width,
            height
        ] = [
            width.value,
            height.value
        ];
        if (width > 1599) {
            thumbsNumX = 5;
            thumbsNumY = 5;
        } else if (width < 1024) {
            thumbsNumX = 4;
            thumbsNumY = 2;
        } else {
            let conf = [
                [
                    1024,
                    600,
                    4,
                    2
                ],
                [
                    1024,
                    768,
                    4,
                    3
                ],
                [
                    1280,
                    800,
                    4,
                    3
                ],
                [
                    1280,
                    1024,
                    4,
                    4
                ],
                [
                    1366,
                    768,
                    4,
                    3
                ],
                [
                    1440,
                    900,
                    5,
                    4
                ]
            ];
            let maxSum = [
                0,
                -1
            ];
            for (let i = 0; i < conf.length; i++) {
                if (conf[i][0] <= width && conf[i][1] <= height) {
                    let sum = conf[i][0] + conf[i][1];
                    if (sum > maxSum[0]) {
                        maxSum[0] = sum;
                        maxSum[1] = i;
                    }
                }
            }
            if (maxSum[1] === -1) {
                thumbsNumX = 4;
                thumbsNumY = 2;
            } else {
                [
                    thumbsNumX,
                    thumbsNumY
                ] = conf[maxSum[1]].slice(2);
            }
        }
        return [
            thumbsNumX,
            thumbsNumY
        ];
    }
};
