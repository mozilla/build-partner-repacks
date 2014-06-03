"use strict";
const EXPORTED_SYMBOLS = ["backgroundImages"];
const GLOBAL = this;
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const SYNC_JSON_URL = "https://download.cdn.yandex.net/bar/vb/bgs.json";
const BG_IMAGES_BASEPATH = "resource://vb-profile-data/backgroundImages/";
const USER_FILE_LEAFNAME = "user.jpg";
const INTERVAL_SEC = 86400;
const PREF_LAST_REQUEST_TIME = "backgroundImages.lastRequestTime";
const PREF_HEADER_LASTMODIFIED = "backgroundImages.lastModified";
const PREF_LAST_SYNCED_VERSION = "backgroundImages.lastVersion";
const PREF_SELECTED_SKIN = "ftabs.backgroundImage";
const OVERLAY_FILENAME = "skins_fontcolors.json";
const OVERLAY_COLOR_WHITE = "ffffff";
const OVERLAY_COLOR_BLACK = "000000";
const MODIFICATOR_OVERLAY_NEEDS_BLACK = "vb-sync_status-bg";
const MAX_DOWNLOAD_BACKGROUND_MS = 30000;
const backgroundImages = {
        init: function BackgroundImages_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger("BackgroundImages");
            this._initFileSystem();
            var now = Math.round(Date.now() / 1000);
            var lastRequestTime = this._application.preferences.get(PREF_LAST_REQUEST_TIME, 0);
            var requestDateDiff = Math.abs(now - lastRequestTime);
            var requestTimeoutMs = Math.max(INTERVAL_SEC - requestDateDiff, 0) * 1000;
            this._syncTimer = new sysutils.Timer(this._sync.bind(this), requestTimeoutMs, INTERVAL_SEC * 1000);
        },
        finalize: function BackgroundImages_finalize(doCleanup, callback) {
            Object.keys(this._downloadTasks).forEach(function (downloadTask) {
                downloadTask.abort(Components.results.NS_ERROR_NET_INTERRUPT);
            });
            this._application = null;
            this._logger = null;
        },
        get list() {
            var cloudSkins = this._cloudSkins;
            var downloadedCloudSkins = {};
            var output = {};
            var previouslySelectedImage;
            this._brandingSkins.forEach(function (imgFile) {
                var uri = BG_IMAGES_BASEPATH + imgFile.leafName;
                output[imgFile.leafName] = {
                    id: imgFile.leafName,
                    preview: uri,
                    image: uri
                };
            });
            var bgImagesDirEntries = this._imagesDir.directoryEntries;
            while (bgImagesDirEntries.hasMoreElements()) {
                let imgFile = bgImagesDirEntries.getNext().QueryInterface(Ci.nsIFile);
                if (/^\./.test(imgFile.leafName) || imgFile.leafName === USER_FILE_LEAFNAME || output[imgFile.leafName] !== undefined) {
                    continue;
                }
                let uri = BG_IMAGES_BASEPATH + imgFile.leafName;
                if (cloudSkins[imgFile.leafName] !== undefined) {
                    downloadedCloudSkins[imgFile.leafName] = uri;
                } else {
                    output[imgFile.leafName] = {
                        id: imgFile.leafName,
                        preview: uri,
                        image: uri
                    };
                }
            }
            Object.keys(cloudSkins).forEach(function (id) {
                output[id] = cloudSkins[id];
                if (downloadedCloudSkins[id]) {
                    output[id].image = downloadedCloudSkins[id];
                }
            });
            return Object.keys(output).map(function (key) output[key]);
        },
        get userImageURL() {
            this._userUploadedRandom = this._userUploadedRandom || Math.floor(Math.random() * Date.now());
            var userUploadedFile = this._imagesDir;
            userUploadedFile.append(USER_FILE_LEAFNAME);
            return userUploadedFile.exists() && userUploadedFile.isFile() && userUploadedFile.isReadable() ? BG_IMAGES_BASEPATH + userUploadedFile.leafName + "?rnd=" + this._userUploadedRandom : null;
        },
        get currentSelected() {
            var prefValue = this._application.preferences.get(PREF_SELECTED_SKIN, "");
            var fontColors = this._fontColors;
            var output = {
                    id: "",
                    color: OVERLAY_COLOR_BLACK,
                    image: "",
                    preview: ""
                };
            if (prefValue === USER_FILE_LEAFNAME) {
                let userImageURL = this.userImageURL;
                if (userImageURL) {
                    output.id = userImageURL;
                    output.image = userImageURL;
                    output.preview = userImageURL;
                    if (fontColors[USER_FILE_LEAFNAME]) {
                        output.color = fontColors[USER_FILE_LEAFNAME];
                    } else {
                        this._calculateFontColor(USER_FILE_LEAFNAME);
                    }
                }
                return output;
            }
            this.list.forEach(function ({
                id: id,
                image: image,
                preview: preview,
                color: color
            }) {
                if (output.image)
                    return;
                var leafName = image.split("/").pop();
                if (leafName !== prefValue)
                    return;
                output.id = id;
                output.preview = preview;
                output.image = image;
                if (fontColors[leafName]) {
                    output.color = fontColors[leafName];
                } else if (color) {
                    output.color = color;
                } else {
                    this._calculateFontColor(image);
                }
            }, this);
            return output;
        },
        select: function BackgroundImages_select(outerWindowId, id) {
            this._logger.debug("Select " + id + " as background, windowId: " + outerWindowId);
            var fontColors = this._fontColors;
            this._waitingForBackground = null;
            if (id === "user") {
                let userImageURL = this.userImageURL;
                if (!userImageURL) {
                    this._logger.error("User-uploaded image needs to be set as background, but it does not exist");
                    return;
                }
                this._application.preferences.set(PREF_SELECTED_SKIN, USER_FILE_LEAFNAME);
                this._application.fastdial.sendRequest("backgroundChanged", {
                    image: userImageURL,
                    color: fontColors[USER_FILE_LEAFNAME] || OVERLAY_COLOR_BLACK
                });
                if (fontColors[USER_FILE_LEAFNAME] === undefined) {
                    this._calculateFontColor(USER_FILE_LEAFNAME);
                }
                return;
            }
            if (this._downloadTasks[id]) {
                this._logger.trace("Background '" + id + "' downloading process has already been started");
                return;
            }
            var skinSelectedData;
            this.list.forEach(function (skinData) {
                if (skinSelectedData || skinData.id !== id)
                    return;
                skinSelectedData = skinData;
            });
            if (!skinSelectedData) {
                this._logger.error("Selected skin doesn't exist in skins list: " + id);
                return;
            }
            var leafName = skinSelectedData.image.split("/").pop();
            var resultFile = this._imagesDir;
            resultFile.append(leafName);
            var resultFileExists = resultFile.exists() && resultFile.isFile() && resultFile.isReadable();
            if (resultFileExists) {
                this._logger.trace("Background '" + id + "' has already been downloaded");
                this._application.preferences.set(PREF_SELECTED_SKIN, leafName);
                let fontColor;
                if (this._cloudSkins[leafName] !== undefined) {
                    fontColor = this._cloudSkins[leafName].color;
                } else if (fontColors[leafName] !== undefined) {
                    fontColor = fontColors[leafName];
                } else {
                    fontColor = OVERLAY_COLOR_BLACK;
                }
                this._application.fastdial.sendRequest("backgroundChanged", {
                    image: BG_IMAGES_BASEPATH + leafName,
                    color: fontColor
                });
                return;
            }
            var self = this;
            this._downloadTasks[id] = new netutils.DownloadTask(skinSelectedData.image, resultFile);
            this._waitingForBackground = skinSelectedData.image;
            var timer = new sysutils.Timer(function () {
                    this._downloadTasks[id].abort(Cr.NS_ERROR_NET_TIMEOUT);
                }.bind(this), MAX_DOWNLOAD_BACKGROUND_MS);
            this._downloadTasks[id].start({
                onTaskFinished: function (task) {
                    var isStatusOK = task.statusCode === Cr.NS_OK;
                    var isImageDownloaded = isStatusOK && task.findHttpResponseHeader("content-type").indexOf("image/") === 0;
                    var isDownloadOK = isImageDownloaded && resultFile.fileSize > 0;
                    if (isDownloadOK) {
                        timer.cancel();
                        self._logger.debug("Background '" + id + "' downloaded");
                        if (self._cloudSkins[leafName] !== undefined) {
                            fontColors[leafName] = self._cloudSkins[leafName].color;
                        } else if (fontColors[leafName] === undefined) {
                            self._calculateFontColor(skinSelectedData.image);
                        }
                        if (self._waitingForBackground === skinSelectedData.image) {
                            self._application.preferences.set(PREF_SELECTED_SKIN, leafName);
                            self._application.fastdial.sendRequest("backgroundChanged", {
                                image: BG_IMAGES_BASEPATH + leafName,
                                color: fontColors[leafName] || OVERLAY_COLOR_BLACK
                            });
                        }
                    } else {
                        self._logger.warn("Background '" + id + "' download process failed: " + task.statusCode);
                        fileutils.removeFileSafe(resultFile);
                        self._application.fastdial.sendRequestToTab(outerWindowId, "backgroundChanged", { error: true });
                    }
                    delete self._downloadTasks[id];
                    if (timer.isRunning) {
                        timer.cancel();
                    }
                },
                onTaskProgress: function () {
                }
            });
        },
        upload: function BackgroundImages_upload(aWindow, callback) {
            var filepickerBundle = new this._application.appStrings.StringBundle("chrome://global/locale/filepicker.properties");
            var filterTitle = filepickerBundle.tryGet("imageTitle");
            if (filterTitle.length === 0) {
                this._logger.warn("Can not find \"imageTitle\" key in the filepicker.properties");
            }
            var filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
            filePicker.init(aWindow, null, filePicker.modeOpen);
            filePicker.appendFilter(filterTitle, "*.jpg; *.jpeg; *.gif; *.png");
            var modalDialog = filePicker.show();
            if (modalDialog !== filePicker.returnOK)
                return callback("");
            this._userUploadedRandom = null;
            var resultFile = this._imagesDir;
            resultFile.append(USER_FILE_LEAFNAME);
            fileutils.removeFileSafe(resultFile);
            var output = "";
            try {
                filePicker.file.copyTo(this._imagesDir, USER_FILE_LEAFNAME);
                output = this.userImageURL;
                let fontColors = this._fontColors;
                delete fontColors[USER_FILE_LEAFNAME];
                this._fontColors = fontColors;
            } catch (ex) {
                this._logger.error("Could not copy user image: " + strutils.formatError(ex));
                this._logger.debug(ex.stack);
            }
            callback(output);
        },
        get _imagesDir() {
            var bgImagesDir = this._application.core.rootDir;
            bgImagesDir.append("backgroundImages");
            return bgImagesDir;
        },
        get _skinsFile() {
            var resultFile = this._application.core.rootDir;
            resultFile.append("skins.json");
            return resultFile;
        },
        get _cloudSkins() {
            var skinsFile = this._skinsFile;
            var output = {};
            var skinsData;
            if (skinsFile.exists() && skinsFile.isFile() && skinsFile.isReadable()) {
                try {
                    skinsData = fileutils.jsonFromFile(skinsFile);
                } catch (ex) {
                    this._logger.error(ex.message);
                    this._logger.debug(ex.stack);
                }
            }
            (skinsData || []).forEach(function ({
                id: id,
                preview: preview,
                image: image,
                modificators: modificators
            }) {
                var leafName = image.split("/").pop();
                if (preview && image) {
                    output[leafName] = {
                        id: id,
                        preview: preview,
                        image: image,
                        color: Array.isArray(modificators) && modificators[0] === MODIFICATOR_OVERLAY_NEEDS_BLACK ? OVERLAY_COLOR_BLACK : OVERLAY_COLOR_WHITE
                    };
                }
            });
            return output;
        },
        get _brandingSkins() {
            var brandingBgImages = this._application.branding.brandPackage.findFile("fastdial/backgrounds/").directoryEntries;
            var output = [];
            while (brandingBgImages.hasMoreElements()) {
                let imgFile = brandingBgImages.getNext().QueryInterface(Ci.nsIFile);
                if (/^\./.test(imgFile.leafName))
                    continue;
                output.push(imgFile);
            }
            delete this._brandingSkins;
            return this._brandingSkins = output;
        },
        get brandingXMLDoc() {
            delete this.brandingXMLDoc;
            return this.brandingXMLDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/config.xml");
        },
        _initFileSystem: function BackgroundImages__initFileSystem() {
            var bgImagesDir = this._imagesDir;
            var needsUpdateDirContents = false;
            if (!bgImagesDir.exists()) {
                bgImagesDir.create(Ci.nsIFile.DIRECTORY_TYPE, fileutils.PERMS_DIRECTORY);
                needsUpdateDirContents = true;
            }
            var appInfo = this._application.addonManager.info;
            if (needsUpdateDirContents || appInfo.isFreshAddonInstall || appInfo.addonUpgraded) {
                this._logger.debug("Update background images directory contents");
                let backgroundImagePref = this._application.preferences.get(PREF_SELECTED_SKIN, "");
                let files = bgImagesDir.directoryEntries;
                while (files.hasMoreElements()) {
                    let imgFile = files.getNext().QueryInterface(Ci.nsIFile);
                    if (/^\./.test(imgFile.leafName) || imgFile.leafName === USER_FILE_LEAFNAME || imgFile.leafName === backgroundImagePref) {
                        continue;
                    }
                    this._logger.debug("Remove " + imgFile.leafName + " skin");
                    fileutils.removeFileSafe(imgFile);
                }
                this._brandingSkins.forEach(function (imgFile) {
                    try {
                        imgFile.copyTo(bgImagesDir, imgFile.leafName);
                        this._logger.debug("Copy " + imgFile.leafName + " skin");
                    } catch (ex) {
                    }
                }, this);
                let forceChangeBg = false;
                if (backgroundImagePref) {
                    let bgImage = bgImagesDir.clone();
                    bgImage.append(backgroundImagePref);
                    if (!bgImage.exists() || !bgImage.isFile() || !bgImage.isReadable()) {
                        forceChangeBg = true;
                    }
                }
                let backgroundElem = this.brandingXMLDoc.querySelector("background");
                let hasJustMigrated = appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated", false) || appInfo.addonUpgraded && /^1\./.test(appInfo.addonLastVersion);
                let force = forceChangeBg || backgroundElem.getAttribute("force") === "true" || hasJustMigrated && this._application.preferences.get(PREF_SELECTED_SKIN).length === 0;
                if (force || appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated", false) === false) {
                    this._application.preferences.set(PREF_SELECTED_SKIN, backgroundElem.getAttribute("file"));
                }
            }
        },
        _sync: function BackgroundImages_sync() {
            var self = this;
            this._logger.debug("Sync background images");
            var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            request.mozBackgroundRequest = true;
            request.QueryInterface(Ci.nsIDOMEventTarget);
            request.open("GET", SYNC_JSON_URL, true);
            request.responseType = "json";
            var skinsFile = this._skinsFile;
            var skinsFileExists = skinsFile.exists() && skinsFile.isFile() && skinsFile.isReadable();
            if (!skinsFileExists) {
                this._application.preferences.reset(PREF_LAST_SYNCED_VERSION);
            }
            var lastModified = this._application.preferences.get(PREF_HEADER_LASTMODIFIED);
            if (lastModified && skinsFileExists) {
                request.setRequestHeader("If-Modified-Since", lastModified);
            }
            var timer = new sysutils.Timer(request.abort.bind(request), 10000);
            request.addEventListener("load", function () {
                timer.cancel();
                var now = Math.round(Date.now() / 1000);
                self._application.preferences.set(PREF_LAST_REQUEST_TIME, now);
                if (request.status === 304) {
                    self._logger.debug("JSON file on server has not yet changed, status = 304");
                    return;
                }
                if (!request.response) {
                    self._logger.error("Not valid JSON: " + request.responseText);
                    return;
                }
                var lastModified = request.getResponseHeader("last-modified");
                if (lastModified) {
                    self._application.preferences.set(PREF_HEADER_LASTMODIFIED, lastModified);
                }
                var lastVersion = self._application.preferences.get(PREF_LAST_SYNCED_VERSION);
                var newVersion = request.response.version || 1;
                if (newVersion > lastVersion) {
                    self._logger.debug("Replace old skins.json (" + lastVersion + ") with a new one (" + newVersion + ")");
                    let skins = Array.isArray(request.response.skins) ? request.response.skins : [];
                    fileutils.jsonToFile(skins, self._skinsFile);
                    self._application.preferences.set(PREF_LAST_SYNCED_VERSION, newVersion);
                    let selectedBgImage = self._application.preferences.get(PREF_SELECTED_SKIN);
                    let brandingSkins = self._brandingSkins.map(function (imgFile) imgFile.leafName);
                    let bgImagesDirEntries = self._imagesDir.directoryEntries;
                    while (bgImagesDirEntries.hasMoreElements()) {
                        let imgFile = bgImagesDirEntries.getNext().QueryInterface(Ci.nsIFile);
                        if (/^\./.test(imgFile.leafName))
                            continue;
                        if (imgFile.leafName === USER_FILE_LEAFNAME || imgFile.leafName === selectedBgImage || brandingSkins.indexOf(imgFile.leafName) !== -1)
                            continue;
                        self._logger.debug("Remove " + imgFile.leafName + " skin");
                        fileutils.removeFileSafe(imgFile);
                    }
                }
            });
            var errorListener = function BackgroundImages_sync_errorListener(evt) {
                self._logger.debug(evt.type);
            };
            request.addEventListener("abort", errorListener, false);
            request.addEventListener("error", errorListener, false);
            request.send();
        },
        _calculateFontColor: function Background__calculateFontColor(url) {
            var self = this;
            var fontColorKey = url === USER_FILE_LEAFNAME ? USER_FILE_LEAFNAME : url.split("/").pop();
            var imageURL = url === USER_FILE_LEAFNAME ? this.userImageURL : BG_IMAGES_BASEPATH + fontColorKey;
            this._application.colors.requestImageDominantColor(imageURL, {
                bottomQuarter: true,
                rightHalf: true,
                minifyCanvas: true,
                preventSkipColors: true
            }, function (err, color) {
                var fontColor;
                if (err) {
                    fontColor = OVERLAY_COLOR_BLACK;
                } else {
                    let fontColorNum = self._application.colors.getFontColorByBackgroundColor(color);
                    fontColor = fontColorNum === 1 ? OVERLAY_COLOR_WHITE : OVERLAY_COLOR_BLACK;
                }
                var fontColors = self._fontColors;
                fontColors[fontColorKey] = fontColor;
                self._fontColors = fontColors;
                var backgroundImagePref = self._application.preferences.get(PREF_SELECTED_SKIN, "");
                if (backgroundImagePref === fontColorKey) {
                    self._application.fastdial.sendRequest("backgroundChanged", {
                        image: imageURL,
                        color: fontColor
                    });
                }
            });
        },
        get _fontColors() {
            var colorsData;
            var colorsFile = this._application.core.rootDir;
            colorsFile.append(OVERLAY_FILENAME);
            if (colorsFile.exists() && colorsFile.isFile() && colorsFile.isReadable()) {
                try {
                    colorsData = fileutils.jsonFromFile(colorsFile);
                } catch (ex) {
                    this._logger.error(ex.message);
                    this._logger.debug(ex.stack);
                }
            }
            return colorsData || {};
        },
        set _fontColors(json) {
            var colorsFile = this._application.core.rootDir;
            colorsFile.append(OVERLAY_FILENAME);
            fileutils.jsonToFile(json, colorsFile);
            return json;
        },
        _application: null,
        _logger: null,
        _userUploadedRandom: null,
        _waitingForBackground: null,
        _syncTimer: null,
        _downloadTasks: {}
    };
