"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
const DOWNLOADS_SETTING_NAME = "downloads";
var module = function (app, common) {
    let downloads = {};
    let yadiskDownloader = {
        get app() {
            return this._app;
        },
        get dataImageRegexp() {
            if (!this._dataImageRegexp) {
                this._dataImageRegexp = /^data:image\/((x\-ms\-)?bmp|gif|jpeg|jpg|png|tiff|svg\+xml|x\-icon);base64,/i;
            }
            return this._dataImageRegexp;
        },
        STATES: {
            progress: 1,
            success: 2,
            failed: 3
        },
        init: function yadisk_downloader_init(application) {
            this._app = application;
            this._restoreAllDownloadsFromCache();
        },
        finalize: function yadisk_downloader_finalize() {
            this._saveAllDownloads();
            Object.keys(downloads).forEach(function (aAccountId) {
                Object.keys(downloads[aAccountId]).forEach(function (aTransferKey) {
                    downloads[aAccountId][aTransferKey].cancel();
                });
            }, this);
            this._app = null;
        },
        tryDownloadMedia: function yadisk_downloader_tryDownloadMedia(aURL, aMetaInfo) {
            if (!aURL) {
                this.app.log("Downloading of a resource failed. No URL.");
                return false;
            }
            if (!aMetaInfo) {
                this.app.log("Downloading of a resource failed. No meta information.");
                return false;
            }
            let url;
            let locator;
            if (this.dataImageRegexp.test(aURL)) {
                let match = this.dataImageRegexp.exec(aURL);
                let filename = common.strUtils.md5(aURL);
                let ext = "";
                if (match[1]) {
                    ext = "." + match[1];
                }
                let tmpFile = FileUtils.getFile("TmpD", [filename + ext]);
                try {
                    this._saveDataURLToFile(tmpFile, aURL);
                } catch (e) {
                    this.app.log("Couldn't save data url to file. Msg: " + e.message);
                    return false;
                }
                url = Services.io.newFileURI(tmpFile);
                locator = tmpFile;
            } else {
                url = aURL;
            }
            if (this._downloadingURLs.indexOf(url) > -1) {
                let accountTransfers = this._getAccountTransfers();
                if (!accountTransfers) {
                    this.app.log("The requested url is in the downloadingURLs list, but no current account.");
                    return false;
                }
                let transfer;
                Object.keys(accountTransfers).some(function (aTransferKey) {
                    let currentTransfer = accountTransfers[aTransferKey];
                    if ((currentTransfer.sourceURL || currentTransfer.fileURL) === url) {
                        transfer = currentTransfer;
                        return true;
                    }
                });
                if (transfer) {
                    return this.retryTransfer(transfer.id);
                }
                this.app.log("The requested url is in the downloadingURLs list, but no transfer corresponding to it.");
                this._releaseDownloadingURL(url);
            }
            if (/^file:\/\/\//i.test(aURL)) {
                let pHandler = Services.io.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
                try {
                    locator = pHandler.getFileFromURLSpec(aURL);
                } catch (e) {
                    this.app.log("Downloading of a resource failed. file:/// url is not valid. aURL: " + aURL);
                    return false;
                }
            }
            if (!locator) {
                locator = aURL;
            }
            let transfer;
            try {
                transfer = this._createTransfer(locator, aMetaInfo);
            } catch (e) {
                this.app.log("Downloading of a resource failed. msg:" + e.message);
                return false;
            }
            this._downloadingURLs.push(aURL);
            this._getUploadURL(transfer);
            this._progressCounter++;
            return true;
        },
        downloadMedia: function yadisk_downloader_downloadMedia(aData) {
            let [
                accountId,
                downloadId
            ] = aData.id.split("#");
            if (!(accountId && downloadId)) {
                this.app.log("Download media failed. Transfer id is not valid. id: " + aData.id);
                return false;
            }
            let transfer = this._getAccountTransferByAccountAndId(accountId, downloadId);
            if (!transfer) {
                return false;
            }
            let error = aData.error;
            let targetURL;
            if (!error) {
                try {
                    targetURL = Services.io.newURI(aData.url, null, null);
                } catch (e) {
                    error = "TargetURL is not valid. url=" + aData.url;
                }
            }
            if (error) {
                this.app.log("Error while parsing data from slice. Msg:" + error);
                transfer.urlRequest = false;
                this._onTransferFail(transfer);
                return false;
            }
            transfer.filename = aData.name;
            transfer.targetURL = targetURL;
            this._downloadMedia(transfer);
            return true;
        },
        restoreAccountDownloads: function yadisk_downloader_restoreAccountDownloads(aAccountId) {
            let accountDownloads = this._getAccountTransfers(aAccountId);
            if (!accountDownloads) {
                return;
            }
            this._resetCounters();
            this._downloadingURLs = [];
            Object.keys(accountDownloads).forEach(function (accountTransferKey) {
                let transfer = accountDownloads[accountTransferKey];
                if (transfer.inProgress) {
                    this._progressCounter++;
                }
                if (transfer.error) {
                    this._errorCounter++;
                }
                this._downloadingURLs.push(transfer.sourceURL || transfer.fileURL);
                this.retryTransfer(transfer.id);
            }, this);
        },
        cancelTransfer: function yadisk_downloader_cancelTransfer(aTransferId) {
            if (!aTransferId) {
                return false;
            }
            let transfer;
            try {
                transfer = this._getAccountTransferById(aTransferId);
            } catch (e) {
                this.app.log("Cancel transfer failed. Msg: " + e.message);
                return false;
            }
            if (!transfer) {
                return false;
            }
            let inProgress = transfer.inProgress;
            let urlRequest = transfer.urlRequest;
            this._canceledTransfers[transfer.id] = true;
            if (!inProgress || urlRequest) {
                this._onTransferCancel(transfer, urlRequest);
            } else {
                transfer.cancel();
            }
            return true;
        },
        retryTransfer: function yadisk_downloader_retryTransfer(aTransferId) {
            if (!aTransferId) {
                this.app.log("Transfer retry failed. Empty transfer id.");
                return false;
            }
            let [
                accountId,
                accountTransferKey
            ] = aTransferId.split("#");
            if (!(accountId && accountTransferKey)) {
                this.app.log("Transfer retry failed. Invalid transfer id. aTransferId=" + aTransferId);
                return false;
            }
            let transfer = this._getAccountTransferByAccountAndId(accountId, accountTransferKey);
            if (!transfer) {
                let canceledTransfer = {
                    id: aTransferId,
                    uid: accountId,
                    canceled: true
                };
                this._notifySliceAboutTransfer(canceledTransfer);
                return true;
            }
            if (transfer.inProgress) {
                return true;
            }
            if (transfer.error) {
                transfer.error = false;
                this._errorCounter--;
            }
            this._getUploadURL(transfer);
            this._progressCounter++;
            return true;
        },
        notifySliceAboutAllTransfers: function yadisk_downloader_notifySliceAboutAllTransfers() {
            if (!this.app) {
                return;
            }
            let downloadsList = [];
            for (let accountId in downloads) {
                let accountDownloads = downloads[accountId];
                Object.keys(accountDownloads).forEach(function (accountTransferKey) {
                    downloadsList.push(this._prepareSliceTransferInfo(accountDownloads[accountTransferKey]));
                }, this);
            }
            this.app.notifySlices({
                message: "yadisk:uploads",
                data: downloadsList
            });
        },
        resetCompleteStatus: function yadisk_downloader_resetCompleteStatus() {
            this._successState = false;
            this.__error = 0;
            this._notifyWidgetAboutState();
        },
        _successState: false,
        _canceledTransfers: {},
        _downloadingURLs: [],
        __progress: 0,
        __error: 0,
        get _progressCounter() {
            return this.__progress;
        },
        set _progressCounter(val) {
            if (val < 0) {
                val = 0;
            }
            this.__progress = val;
            if (this.__progress <= 1) {
                this._notifyWidgetAboutState();
            }
        },
        get _errorCounter() {
            return this.__error;
        },
        set _errorCounter(val) {
            if (val < 0) {
                val = 0;
            }
            this.__error = val;
        },
        _resetCounters: function yadisk_downloader__resetCounters() {
            this._successState = false;
            this.__error = 0;
            this.__progress = 0;
        },
        _getUploadURL: function yadisk_downloader__getUploadURL(aTransfer) {
            aTransfer.urlRequest = true;
            this.app.notifySlices({
                message: "yadisk:get-upload-info",
                data: {
                    id: aTransfer.id,
                    name: aTransfer.filename,
                    url: aTransfer.sourceURL
                }
            });
        },
        _getFileNameFromURL: function yadisk_downloader__getFileNameFromURL(aURL) {
            return aURL.substring(aURL.lastIndexOf("/") + 1);
        },
        _saveDataURLToFile: function yadisk_downloader__saveDataURLToFile(aFile, aData) {
            let channel = Services.io.newChannelFromURI(Services.io.newURI(aData, null, null));
            this.app.api.Files.writeStreamToFile(channel.open(), aFile);
        },
        _getAccountTransferById: function yadisk_downloader__getAccountTransferById(aId) {
            let [
                accountId,
                accountTransferKey
            ] = aId.split("#");
            if (!(accountId && accountTransferKey)) {
                throw new Error("_getAccountTransferById: transfer id is not valid. Id: " + aId);
            }
            return this._getAccountTransferByAccountAndId(accountId, accountTransferKey);
        },
        _getAccountTransferByAccountAndId: function yadisk_downloader__getAccountTransferByAccountAndId(aAccountId, aAccountTransferKey) {
            return this._getAccountTransfers(aAccountId)[aAccountTransferKey];
        },
        _getAccountTransfers: function yadisk_downloader__getAccountTransfers(aAccountId) {
            let accountId = aAccountId || this.app.getCurrentAccountId();
            if (!accountId) {
                return null;
            }
            if (!downloads[accountId]) {
                downloads[accountId] = {};
            }
            return downloads[accountId];
        },
        _removeAccountTransfer: function yadisk_downloader__removeAccountTransfer(aAccountId, aTransferId) {
            let accountTransfers = this._getAccountTransfers(aAccountId);
            let accountTransferKey = aTransferId.split("#")[1];
            delete accountTransfers[accountTransferKey];
            if (!Object.keys(accountTransfers).length) {
                delete downloads[aAccountId];
            }
        },
        _restoreAllDownloadsFromCache: function yadisk_downloader__restoreAllDownloadsFromCache() {
            try {
                let downloadsFromCache = JSON.parse(this.app.getPref(DOWNLOADS_SETTING_NAME, undefined));
                if (typeof downloadsFromCache === "object" && !Array.isArray(downloadsFromCache)) {
                    Object.keys(downloadsFromCache).forEach(function (aUid) {
                        Object.keys(downloadsFromCache[aUid]).forEach(function (aTransferKey) {
                            let transferDescriptor = downloadsFromCache[aUid][aTransferKey];
                            let locator = transferDescriptor.sourceURL;
                            if (/^blob:/i.test(locator)) {
                                return;
                            }
                            if (transferDescriptor.file) {
                                locator = new FileUtils.File(transferDescriptor.file);
                            }
                            try {
                                this._createTransfer(locator, transferDescriptor.meta, null, transferDescriptor.id, true);
                            } catch (e) {
                                this.app.log("Couldn't create transfer for account {" + aUid + "}. Msg: " + e.message);
                            }
                        }, this);
                    }, this);
                }
            } catch (e) {
                this.app.log("Restoring downloads list from cache failed. Msg: " + e.message);
            }
        },
        _saveAllDownloads: function yadisk_downloader__saveAllDownloads() {
            let currentDownloads = {};
            try {
                currentDownloads = JSON.stringify(downloads);
            } catch (e) {
                this.app.log("Downloads serializing failed. msg:" + e.message);
            }
            try {
                this.app.setPref(DOWNLOADS_SETTING_NAME, currentDownloads);
            } catch (e) {
                this.app.log("Saving downloads list failed. msg:" + e.message);
            }
        },
        _createTransfer: function yadisk_downloader__createTransfer(aResourceLoc, aMetaInfo, aUid, aTransferId, aAddToList = true) {
            let id;
            let uid;
            let accountTransferKey;
            if (aTransferId) {
                id = aTransferId;
                [
                    uid,
                    accountTransferKey
                ] = aTransferId.split("#");
            } else {
                uid = aUid || this.app.getCurrentAccountId();
                if (!uid) {
                    throw new Error("No uid");
                }
                accountTransferKey = Date.now();
                id = uid + "#" + accountTransferKey;
            }
            let resource;
            if (typeof aResourceLoc === "string") {
                resource = Services.io.newURI(aResourceLoc, null, null);
            } else if (aResourceLoc instanceof Ci.nsIFile) {
                resource = aResourceLoc;
            } else {
                throw new Error("Unknown resourceLocator type. " + typeof aResourceLoc);
            }
            let result = new Transfer(id, uid, resource, aMetaInfo);
            if (aAddToList) {
                let accountDownloads = this._getAccountTransfers(uid);
                accountDownloads[accountTransferKey] = result;
            }
            return result;
        },
        _prepareSliceTransferInfo: function yadisk_downloader__prepareSliceTransferInfo(aTransfer) {
            let result = {};
            result.id = aTransfer.id;
            result.uid = aTransfer.uid;
            result.name = aTransfer.filename;
            result.srcURL = aTransfer.sourceURL;
            result.error = aTransfer.error;
            result.percent = aTransfer.success ? 100 : aTransfer.progress.percent;
            if (aTransfer.success) {
                result.pageURL = aTransfer.metaInfo.pageURL;
                result.pageTitle = aTransfer.metaInfo.pageTitle;
                result.imageAlt = aTransfer.metaInfo.imageAlt;
            }
            if (aTransfer.canceled !== undefined) {
                result.canceled = aTransfer.canceled;
            } else {
                result.canceled = this._canceledTransfers[aTransfer.id] ? true : false;
            }
            return result;
        },
        _notifyWidgetAboutState: function yadisk_downloader__notifyWidgetAboutState() {
            let state;
            if (this._progressCounter) {
                state = this.STATES.progress;
            } else {
                if (this._successState && !this._errorCounter) {
                    state = this.STATES.success;
                }
                if (this._errorCounter) {
                    state = this.STATES.failed;
                }
                this._successState = false;
            }
            this.app.onState(state);
        },
        _notifySliceAboutTransfer: function yadisk_downloader__notifySliceAboutTransfer(aTransfer) {
            if (!this.app) {
                return;
            }
            this.app.notifySlices({
                message: "yadisk:upload",
                data: this._prepareSliceTransferInfo(aTransfer)
            });
        },
        _downloadMedia: function yadisk_downloader__downloadMedia(aTransfer) {
            try {
                aTransfer.start({
                    onStart: function Transfer_callback_onStart(aTransfer) {
                        this._onTransferStart(aTransfer);
                    }.bind(this),
                    onComplete: function Transfer_callback_onComplete(aSuccess, aTransfer) {
                        if (aSuccess) {
                            this._onTransferSuccess(aTransfer);
                        } else {
                            this._onTransferFail(aTransfer);
                        }
                    }.bind(this),
                    onProgress: function Transfer_callback_onProgress(aProgress, aTransfer) {
                        this._notifySliceAboutTransfer(aTransfer);
                    }.bind(this)
                });
            } catch (e) {
                this.app.log("Transfer starting failed. Msg:" + e.message);
                this._onTransferFail(aTransfer);
            }
        },
        _releaseDownloadingURL: function yadisk_downloader__releaseDownloadingURL(aURL) {
            let index = this._downloadingURLs.indexOf(aURL);
            if (index > -1) {
                this._downloadingURLs.splice(index, 1);
            }
        },
        _onTransferStart: function yadisk_downloader__onTransferStart(aTransfer) {
            this._notifySliceAboutTransfer(aTransfer);
        },
        _onTransferSuccess: function yadsik_downloader__onTransferSuccess(aTransfer) {
            this._notifySliceAboutTransfer(aTransfer);
            if (this.app) {
                let currentUid = this.app.getCurrentAccountId();
                if (currentUid == aTransfer.uid) {
                    this._successState = true;
                    this._progressCounter--;
                }
            }
            this._releaseDownloadingURL(aTransfer.sourceURL || aTransfer.fileURL);
            this._removeAccountTransfer(aTransfer.uid, aTransfer.id);
        },
        _onTransferFail: function yadisk_downloader__onTransferFail(aTransfer) {
            if (this._canceledTransfers[aTransfer.id]) {
                this._onTransferCancel(aTransfer);
                return;
            }
            aTransfer.error = true;
            this._notifySliceAboutTransfer(aTransfer);
            if (this.app) {
                let currentUid = this.app.getCurrentAccountId();
                if (currentUid == aTransfer.uid) {
                    this._errorCounter++;
                    this._progressCounter--;
                }
            }
        },
        _onTransferCancel: function yadisk_downloader__onTransferCancel(aTransfer, aWasInProgress = true) {
            this._notifySliceAboutTransfer(aTransfer);
            this._releaseDownloadingURL(aTransfer.sourceURL || aTransfer.fileURL);
            this._removeAccountTransfer(aTransfer.uid, aTransfer.id);
            delete this._canceledTransfers[aTransfer.id];
            if (aWasInProgress) {
                this._progressCounter--;
            }
        }
    };
    function Transfer(aId, aUid, aResource, aMetaInfo) {
        if (!(aId && aUid)) {
            throw new Error("No id or uid. id=" + aId + "; uid=" + aUid);
        }
        if (!aResource) {
            throw new Error("Resource is missing.");
        }
        if (!(aResource instanceof Ci.nsIURI || aResource instanceof Ci.nsIFile)) {
            throw new Error("Resource should be instance of nsIURI or nsIFile. Type: " + typeof aResource);
        }
        this._id = aId;
        this._uid = aUid;
        this._filename = "";
        this._file = null;
        this._sourceURL = null;
        this._targetURL = null;
        this._sending = false;
        this._success = false;
        if (aResource instanceof Ci.nsIFile) {
            if (!aResource.exists()) {
                throw new Error("Specified resource doesn't exist. Path: " + aResource.path);
            }
            this._file = aResource;
            this._filename = this._file.leafName;
        } else {
            this._sourceURL = aResource;
        }
        this._metaInfo = {
            pageURL: aMetaInfo.pageURL,
            pageTitle: aMetaInfo.pageTitle,
            imageAlt: aMetaInfo.imageAlt
        };
        if (aMetaInfo.filename) {
            this._filename = aMetaInfo.filename;
        }
        this.urlRequest = false;
        this.error = false;
    }
    Object.defineProperty(Transfer.prototype, "id", {
        enumberable: true,
        get: function () {
            return this._id;
        }
    });
    Object.defineProperty(Transfer.prototype, "uid", {
        enumberable: true,
        get: function () {
            return this._uid;
        }
    });
    Object.defineProperty(Transfer.prototype, "sourceURL", {
        enumberable: true,
        get: function () {
            return this._sourceURL && this._sourceURL.spec;
        }
    });
    Object.defineProperty(Transfer.prototype, "fileURL", {
        enumberable: true,
        get: function () {
            return this._file && Services.io.newFileURI(this._file).spec;
        }
    });
    Object.defineProperty(Transfer.prototype, "metaInfo", {
        enumberable: true,
        get: function () {
            return this._metaInfo;
        }
    });
    Object.defineProperty(Transfer.prototype, "success", {
        enumberable: true,
        get: function () {
            return this._success;
        }
    });
    Object.defineProperty(Transfer.prototype, "inProgress", {
        enumberable: true,
        get: function () {
            return this.urlRequest || this._sending;
        }
    });
    Object.defineProperty(Transfer.prototype, "filename", {
        enumberable: true,
        get: function () {
            return this._filename;
        },
        set: function (val) {
            if (val) {
                this._filename = val;
            }
        }
    });
    Object.defineProperty(Transfer.prototype, "targetURL", {
        enumberable: true,
        get: function () {
            return this._targetURL && this._targetURL.spec;
        },
        set: function (val) {
            if (!(val instanceof Ci.nsIURI)) {
                throw new Error("Wrong type, should be nsIURI. Type; " + typeof val);
            }
            this._targetURL = val;
        }
    });
    Object.defineProperty(Transfer.prototype, "progress", {
        enumberable: true,
        get: function () {
            if (!this._progress) {
                this._progress = {
                    downloaded: 0,
                    uploaded: 0,
                    max: 0,
                    get percent() {
                        if (this.max == 0) {
                            return 0;
                        }
                        let percent = 0;
                        if (this.downloaded < 0) {
                            percent = parseInt(this.uploaded / this.max * 100, 10);
                        } else {
                            percent = parseInt((this.downloaded + this.uploaded) / (this.max * 2) * 100, 10);
                        }
                        return percent <= 100 ? percent : 100;
                    }
                };
            }
            return this._progress;
        }
    });
    Transfer.prototype.start = function Transfer_start(aCallbacks) {
        if (this._sending) {
            return;
        }
        this.urlRequest = false;
        this._sending = true;
        this._success = false;
        let fis = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        let tmpFile;
        let needDownloading = true;
        if (this._file) {
            needDownloading = false;
            fis.init(this._file, 1, parseInt("0644", 8), false);
        } else {
            tmpFile = FileUtils.getFile("TmpD", [this._getTmpFilename(this.sourceURL)]);
            if (tmpFile.exists()) {
                needDownloading = false;
                fis.init(tmpFile, 1 | 8, parseInt("0644", 8), false);
            }
        }
        var initUploadProcess = function (aTriggerOnStart) {
            this._uploader = new Uploader(fis, this._targetURL);
            this._uploader.addListener({
                onStart: function (aRequest) {
                }.bind(this),
                onStop: function (aRequest, aStatus) {
                    fis.close();
                    let success = false;
                    if (Components.isSuccessCode(aStatus) && aRequest.responseStatus === 201) {
                        success = true;
                    }
                    if (success) {
                        if (tmpFile) {
                            try {
                                tmpFile.remove(false);
                            } catch (e) {
                            }
                        }
                        this._success = true;
                    }
                    this._sending = false;
                    aCallbacks.onComplete(success, this);
                }.bind(this),
                onProgress: function (aProgress) {
                    this.progress.uploaded = aProgress.current;
                    aCallbacks.onProgress(this.progress, this);
                }.bind(this)
            });
            this._uploader.start();
            if (aTriggerOnStart) {
                aCallbacks.onStart(this);
            }
        }.bind(this);
        if (needDownloading) {
            tmpFile.leafName = tmpFile.leafName + ".part";
            this._downloader = new Downloader(tmpFile, this._sourceURL);
            this._downloader.addListener({
                onStart: function Transfer_Downloader_callback_onStart(aRequest) {
                    aCallbacks.onStart(this);
                    if (!Components.isSuccessCode(aRequest.status)) {
                        return;
                    }
                    try {
                        aRequest.QueryInterface(Ci.nsIHttpChannel);
                    } catch (e) {
                    }
                    if (aRequest.responseStatus < 200 || aRequest.responseStatus > 399) {
                        this.cancel();
                        return;
                    }
                    let contentLength = aRequest.contentLength;
                    if (contentLength) {
                        this.progress.max = contentLength;
                    }
                }.bind(this),
                onStop: function Transfer_Downloader_callback_onStop(aStatus) {
                    let success = Components.isSuccessCode(aStatus);
                    if (!success) {
                        this._sending = false;
                        aCallbacks.onComplete(false, this);
                        return;
                    }
                    if (this.progress.max == 0) {
                        this.progress.max = this.progress.downloaded;
                    }
                    let fileName = tmpFile.leafName.split(".")[0];
                    try {
                        tmpFile.moveTo(null, fileName);
                    } catch (e) {
                    }
                    fis.init(tmpFile, 1, parseInt("0644", 8), false);
                    initUploadProcess();
                }.bind(this),
                onProgress: function (aProgress) {
                    this.progress.downloaded = aProgress.current;
                    aCallbacks.onProgress(this.progress, this);
                }.bind(this)
            });
            this._downloader.start();
            return;
        } else {
            this.progress.downloaded = -1;
            this.progress.max = (this._file || tmpFile).fileSize;
        }
        initUploadProcess(true);
    };
    Transfer.prototype.cancel = function Transfer_cancel() {
        if (this.inProgress) {
            this.urlRequest = false;
            this._abort();
        }
    };
    Transfer.prototype.toJSON = function Transfer_toJSON() {
        return {
            id: this._id,
            uid: this._uid,
            sourceURL: this.sourceURL,
            file: this._file && this._file.path,
            meta: {
                pageURL: this._metaInfo.pageURL,
                pageTitle: this._metaInfo.pageTitle,
                imageAlt: this._metaInfo.imageAlt,
                filename: this.filename
            }
        };
    };
    Transfer.prototype._abort = function Transfer__abort() {
        if (this._downloader) {
            this._downloader.abort();
            this._downloader = null;
        }
        if (this._uploader) {
            this._uploader.abort();
            this._uploader = null;
        }
    };
    Transfer.prototype._getTmpFilename = function Transfer__getTmpFilename(aLocator) {
        return common.strUtils.md5(aLocator);
    };
    function Downloader(aFile, aSourceURL) {
        this._file = aFile;
        this._url = aSourceURL;
        this._data = "";
        this._handlers = {};
        this._progress = {
            current: 0,
            max: 0
        };
        this._setupChannel();
    }
    Downloader.prototype.addListener = function Downloader_addListener(aHandlers) {
        this._handlers = aHandlers;
    };
    Downloader.prototype.getProgress = function Downloader_getProgress() {
        return this._progress;
    };
    Downloader.prototype.abort = function Downloader_abort() {
        if (this._channel) {
            this._channel.cancel(Cr.NS_BINDING_ABORTED);
        }
    };
    Downloader.prototype.start = function Downloader_start() {
        if (this._channel) {
            this._channel.asyncOpen(this, null);
        }
    };
    Downloader.prototype.onStartRequest = function Downloader_onStartRequest(aRequest, aContext) {
        let fileOutputStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        let accessRights = parseInt("0644", 8);
        let modeFlags = 2 | 8 | 32;
        fileOutputStream.init(this._file, modeFlags, accessRights, 0);
        this._fileOutputStream = fileOutputStream;
        this._emit("onStart", aRequest);
    };
    Downloader.prototype.onStopRequest = function Downloader_onStopRequest(aRequest, aContext, aStatus) {
        this._flush();
        this._fileOutputStream.close();
        this._fileOutputStream = null;
        this._emit("onStop", aStatus);
    };
    Downloader.prototype.onDataAvailable = function Downloader_onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount) {
        let bis = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        bis.setInputStream(aInputStream);
        let bytes = bis.readBytes(aCount);
        this._data += bytes;
        if (this._data.length > 100000) {
            this._flush();
        }
        this._emit("onData");
    };
    Downloader.prototype.onChannelRedirect = function Downloader_onChannelRedirect(aOldChannel, aNewChannel, aFlags) {
        this._channel = aNewChannel;
    };
    Downloader.prototype.asyncOnChannelRedirect = function Downloader_asyncOnChannelRedirect(aOldChannel, aNewChannel, aFlags, aCallback) {
        this._channel = aNewChannel;
        aCallback.onRedirectVerifyCallback(Cr.NS_OK);
    };
    Downloader.prototype.onProgress = function Downloader_onProgress(aRequest, aContext, aCurrentProgress, aMaxProgress) {
        this._progress.current = aCurrentProgress;
        this._progress.max = aMaxProgress;
        this._emit("onProgress", this._progress);
    };
    Downloader.prototype.onStatus = function Downloader_onStatus(aRequest, aContext, aStatus, aStatusArg) {
    };
    Downloader.prototype.onRedirect = function Downloader_onRedirect(aHttpChannel, aNewChannel) {
    };
    Downloader.prototype.getInterface = function Downloader_getInterface(aIID) {
        try {
            return this.QueryInterface(aIID);
        } catch (e) {
            throw Components.results.NS_NOINTERFACE;
        }
    };
    Downloader.prototype.QueryInterface = function Downloader_QueryInterface(aIID) {
        if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIInterfaceRequestor) || aIID.equals(Ci.nsIChannelEventSink) || aIID.equals(Ci.nsIProgressEventSink) || aIID.equals(Ci.nsIHttpEventSink) || aIID.equals(Ci.nsIStreamListener)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    };
    Downloader.prototype._setupChannel = function Downloader__setupChannel() {
        if (this._channel) {
            this._channel = null;
        }
        this._channel = Services.io.newChannelFromURI(this._url);
        this._channel.notificationCallbacks = this;
    };
    Downloader.prototype._flush = function Downloader__flush() {
        if (this._data) {
            this._fileOutputStream.write(this._data, this._data.length);
            this._data = "";
        }
    };
    Downloader.prototype._emit = function Downloader__emit(aEventName) {
        if (typeof this._handlers[aEventName] === "function") {
            let args = Array.prototype.slice.call(arguments, 1);
            this._handlers[aEventName].apply(null, args);
        }
    };
    function Uploader(aInputStream, aTargetURL, aChunked) {
        this._stream = aInputStream;
        this._url = aTargetURL;
        this._progress = {
            current: 0,
            max: 0
        };
        this._setupChannel(aChunked);
    }
    Uploader.prototype.addListener = function Uploader_addListener(aHandlers) {
        this._handlers = aHandlers;
    };
    Uploader.prototype.getProgress = function Uploader_getProgress() {
        return this._progress;
    };
    Uploader.prototype.abort = function Uploader_abort() {
        if (this._channel) {
            this._channel.cancel(Cr.NS_BINDING_ABORTED);
        }
    };
    Uploader.prototype.start = function Uploader_start() {
        if (this._channel) {
            this._channel.asyncOpen(this, null);
        }
    };
    Uploader.prototype.onStartRequest = function Uploader_onStartRequest(aRequest, aContext) {
        this._emit("onStart", aRequest);
    };
    Uploader.prototype.onStopRequest = function Uploader_onStopRequest(aRequest, aContext, aStatus) {
        this._stream.close();
        this._emit("onStop", aRequest, aStatus);
    };
    Uploader.prototype.onDataAvailable = function Uploader_onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount) {
        this._emit("onData");
    };
    Uploader.prototype.onChannelRedirect = function Uploader_onChannelRedirect(aOldChannel, aNewChannel, aFlags) {
        this._channel = aNewChannel;
    };
    Uploader.prototype.asyncOnChannelRedirect = function Uploader_asyncOnChannelRedirect(aOldChannel, aNewChannel, aFlags, aCallback) {
        this._channel = aNewChannel;
        aCallback.onRedirectVerifyCallback(Cr.NS_OK);
    };
    Uploader.prototype.onProgress = function Uploader_onProgress(aRequest, aContext, aCurrentProgress, aMaxProgress) {
        this._progress.current = aCurrentProgress;
        this._progress.max = aMaxProgress;
        this._emit("onProgress", this._progress);
    };
    Uploader.prototype.onStatus = function Uploader_onStatus() {
    };
    Uploader.prototype.onRedirect = function Uploader_onRedirect() {
    };
    Uploader.prototype.getInterface = function Uploader_getInterface(aIID) {
        try {
            return this.QueryInterface(aIID);
        } catch (e) {
            throw Components.results.NS_NOINTERFACE;
        }
    };
    Uploader.prototype.QueryInterface = function Uploader_QueryInterface(aIID) {
        if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIInterfaceRequestor) || aIID.equals(Ci.nsIChannelEventSink) || aIID.equals(Ci.nsIProgressEventSink) || aIID.equals(Ci.nsIHttpEventSink) || aIID.equals(Ci.nsIStreamListener)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    };
    Uploader.prototype._setupChannel = function Uploader__setupChannel(aChunked) {
        if (this._channel) {
            this._channel = null;
        }
        this._channel = Services.io.newChannelFromURI(this._url);
        this._channel.QueryInterface(Ci.nsIHttpChannel);
        this._channel.QueryInterface(Ci.nsIUploadChannel);
        this._channel.notificationCallbacks = this;
        this._channel.setUploadStream(this._stream, "text/plain", -1);
    };
    Uploader.prototype._emit = function Uploader__emit(aEventName) {
        if (typeof this._handlers[aEventName] === "function") {
            let args = Array.prototype.slice.call(arguments, 1);
            this._handlers[aEventName].apply(null, args);
        }
    };
    return yadiskDownloader;
};
