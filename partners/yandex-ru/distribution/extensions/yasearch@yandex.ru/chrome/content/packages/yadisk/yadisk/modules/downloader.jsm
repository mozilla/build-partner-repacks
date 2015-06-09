"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const DOWNLOADS_SETTING_NAME = "downloads";
const ERRORS = {
    DOWNLOAD: {
        HTTP: "download-http",
        FILE_IO: "download-file-io"
    },
    UPLOAD: {
        HTTP: "upload-http",
        FILE_IO: "upload-file-io"
    },
    SYSTEM: {
        NO_CONNECTION: "system-no-connection",
        UNKNOWN: "system-unknown"
    },
    SERVICE: { INVALID_URL: "service-invalid-url" }
};
var module = function (app, common) {
    function logger(msg) {
        app.log(msg);
    }
    let downloads = {};
    let yadiskDownloader = {
        get app() {
            return this._app;
        },
        get dataImageRegexp() {
            return DataImageResource.dataImageRegexp;
        },
        STATES: {
            progress: 1,
            success: 2,
            failed: 3
        },
        init: function (application) {
            this._app = application;
            this._restoreAllDownloadsFromCache();
        },
        finalize: function () {
            this._saveAllDownloads();
            Object.keys(downloads).forEach(function (aAccountId) {
                Object.keys(downloads[aAccountId]).forEach(function (aTransferKey) {
                    downloads[aAccountId][aTransferKey].cancel();
                });
            }, this);
            this._app = null;
        },
        tryDownloadMedia: function (aResource, aMetaInfo = {}) {
            if (!aResource) {
                this.app.log("Downloading of a resource failed. No resource.");
                return false;
            }
            let resource = this._getResource(aResource, aMetaInfo);
            if (!resource) {
                this.app.log("Downloading of a resource failed. Couldn't create instance of Resource.");
                return false;
            }
            if (this._isDownloadingURL(resource.url)) {
                let transfer = this._getTransferByURL(resource.url);
                if (transfer) {
                    return this.retryTransfer(transfer.id);
                }
                this.app.log("The requested url is in the downloadingURLs list, but no transfer corresponding to it.");
                this._releaseDownloadingURL(resource.url);
            }
            return this._startDownloadingProcess(resource);
        },
        isResourceDownloading: function (aResource) {
            let resource = this._getResource(aResource);
            if (!resource) {
                return false;
            }
            return this._isDownloadingURL(resource.url);
        },
        downloadMedia: function (aData) {
            let transfer;
            try {
                transfer = this._getAccountTransferById(aData.id);
            } catch (e) {
                this.app.log("Getting transfer failed. Msg:" + e.message);
                return false;
            }
            if (!transfer) {
                this.app.log("There is no transfer with such id: " + aData.id);
                return false;
            }
            if (transfer.sourceURL) {
                transfer.remoteDownloadFailed = true;
            }
            transfer.operationURL = "";
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
                transfer.error = true;
                transfer._errorDescription = aData.error || ERRORS.SERVICE.INVALID_URL;
                this._onTransferFail(transfer);
                return false;
            }
            transfer.targetURL = targetURL;
            this._downloadMedia(transfer);
            return true;
        },
        restoreAccountDownloads: function (aAccountId) {
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
        cancelTransfer: function (aTransferId) {
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
        retryTransfer: function (aTransferId) {
            let transfer;
            try {
                transfer = this._getAccountTransferById(aTransferId);
            } catch (e) {
                this.app.log("Transfer retry failed. Invalid transfer id. aTransferId=" + aTransferId);
                return false;
            }
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
        setTransferFileName: function (aData) {
            if (!aData.name) {
                return;
            }
            let transfer;
            try {
                transfer = this._getAccountTransferById(aData.id);
            } catch (e) {
                this.app.log("Getting transfer failed. Msg:" + e.message);
                return;
            }
            if (transfer) {
                transfer.filename = aData.name;
            }
        },
        notifySliceAboutAllTransfers: function () {
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
        onRemoteDownloadingStarted: function (aData) {
            let transfer;
            try {
                transfer = this._getAccountTransferById(aData.id);
            } catch (e) {
                this.app.log("Getting transfer failed. Msg:" + e.message);
                return;
            }
            if (transfer) {
                if (aData.operationURL) {
                    transfer.operationURL = aData.operationURL;
                }
            }
        },
        onRemoteDownloadingCompleted: function (aData) {
            let transfer;
            try {
                transfer = this._getAccountTransferById(aData.id);
            } catch (e) {
                this.app.log("Getting transfer failed. Msg:" + e.message);
                return;
            }
            if (transfer) {
                transfer.success = true;
                this._onTransferSuccess(transfer);
            }
        },
        onRemoteDownloadingFailed: function (aData) {
            let transfer;
            try {
                transfer = this._getAccountTransferById(aData.id);
            } catch (e) {
                this.app.log("Getting transfer failed. Msg:" + e.message);
                return;
            }
            if (transfer) {
                transfer.operationURL = "";
                transfer.remoteDownloadFailed = true;
            }
        },
        resetCompleteStatus: function () {
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
        _resetCounters: function () {
            this._successState = false;
            this.__error = 0;
            this.__progress = 0;
        },
        _getResource: function (aResource, aMetaInfo) {
            try {
                return resourceFactory.getResource(aResource, aMetaInfo);
            } catch (e) {
                this.app.log(e.message);
                return null;
            }
        },
        _getTransfer: function (aLocator, aMeta) {
            try {
                return this._createTransfer(aLocator, aMeta);
            } catch (e) {
                this.app.log(e.message);
                return null;
            }
        },
        _startDownloadingProcess: function (aResource) {
            let meta = aResource.metaInfo;
            if (aResource.isDataImage) {
                meta.removeOnComplete = true;
            }
            let transfer = this._getTransfer(aResource.locator, meta);
            if (!transfer) {
                this.app.log("Starting downloading process failed.");
                return false;
            }
            this._downloadingURLs.push(aResource.url);
            this._getUploadURL(transfer);
            this._progressCounter++;
            return true;
        },
        _isDownloadingURL: function (aURL) {
            return this._downloadingURLs.indexOf(aURL) > -1;
        },
        _getUploadURL: function (aTransfer) {
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
        _getAccountTransferById: function (aId) {
            let [
                accountId,
                accountTransferKey
            ] = aId.split("#");
            if (!(accountId && accountTransferKey)) {
                throw new Error("_getAccountTransferById: transfer id is not valid. Id: " + aId);
            }
            return this._getAccountTransferByAccountAndId(accountId, accountTransferKey);
        },
        _getAccountTransferByAccountAndId: function (aAccountId, aAccountTransferKey) {
            return this._getAccountTransfers(aAccountId)[aAccountTransferKey];
        },
        _getAccountTransfers: function (aAccountId) {
            let accountId = aAccountId || this.app.getCurrentAccountId();
            if (!accountId) {
                return null;
            }
            if (!downloads[accountId]) {
                downloads[accountId] = {};
            }
            return downloads[accountId];
        },
        _getTransferByURL: function (aURL) {
            let accountTransfers = this._getAccountTransfers();
            if (!accountTransfers) {
                this.app.log("The requested url is in the downloadingURLs list, but no current account.");
                return null;
            }
            let transfer = null;
            Object.keys(accountTransfers).some(function (aTransferKey) {
                let currentTransfer = accountTransfers[aTransferKey];
                if ((currentTransfer.sourceURL || currentTransfer.fileURL) === aURL) {
                    transfer = currentTransfer;
                    return true;
                }
            });
            return transfer;
        },
        _removeAccountTransfer: function (aAccountId, aTransferId) {
            let accountTransfers = this._getAccountTransfers(aAccountId);
            let accountTransferKey = aTransferId.split("#")[1];
            delete accountTransfers[accountTransferKey];
            if (!Object.keys(accountTransfers).length) {
                delete downloads[aAccountId];
            }
        },
        _restoreAllDownloadsFromCache: function () {
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
        _saveAllDownloads: function () {
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
        _createTransfer: function (aResourceLoc, aMetaInfo, aUid, aTransferId, aAddToList = true) {
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
        _prepareSliceTransferInfo: function (aTransfer) {
            let result = {};
            result.id = aTransfer.id;
            result.uid = aTransfer.uid;
            result.name = aTransfer.filename;
            result.srcURL = aTransfer.sourceURL;
            result.operationURL = aTransfer.operationURL;
            result.error = aTransfer.error;
            result.zaberunFailed = aTransfer.remoteDownloadFailed;
            if (aTransfer.error) {
                result.errorDescription = aTransfer.errorDescription;
            }
            result.percent = aTransfer.progress.percent;
            if (aTransfer.success) {
                result.percent = 100;
            } else if (result.percent >= 100) {
                result.percent = 99;
            }
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
        _notifyWidgetAboutState: function () {
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
        _notifyWidgetAboutTransferComplete: function (aStatus) {
            this.app.onTransferComplete(aStatus);
        },
        _notifySliceAboutTransfer: function (aTransfer) {
            if (!this.app) {
                return;
            }
            this.app.notifySlices({
                message: "yadisk:upload",
                data: this._prepareSliceTransferInfo(aTransfer)
            });
        },
        _downloadMedia: function (aTransfer) {
            try {
                aTransfer.start({
                    onStart: function (aTransfer) {
                        this._onTransferStart(aTransfer);
                    }.bind(this),
                    onComplete: function (aSuccess, aTransfer) {
                        if (aSuccess) {
                            this._onTransferSuccess(aTransfer);
                        } else {
                            this._onTransferFail(aTransfer);
                        }
                    }.bind(this),
                    onProgress: function (aProgress, aTransfer) {
                        this._notifySliceAboutTransfer(aTransfer);
                    }.bind(this)
                });
            } catch (e) {
                this.app.log("Transfer starting failed. Msg:" + e.message);
                this._onTransferFail(aTransfer);
            }
        },
        _releaseDownloadingURL: function (aURL) {
            let index = this._downloadingURLs.indexOf(aURL);
            if (index > -1) {
                this._downloadingURLs.splice(index, 1);
            }
        },
        _onTransferStart: function (aTransfer) {
            this._notifySliceAboutTransfer(aTransfer);
        },
        _onTransferSuccess: function (aTransfer) {
            this._notifySliceAboutTransfer(aTransfer);
            this._notifyWidgetAboutTransferComplete("success");
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
        _onTransferFail: function (aTransfer) {
            if (this._canceledTransfers[aTransfer.id]) {
                this._onTransferCancel(aTransfer);
                return;
            }
            this._notifySliceAboutTransfer(aTransfer);
            this._notifyWidgetAboutTransferComplete("fail");
            if (this.app) {
                let currentUid = this.app.getCurrentAccountId();
                if (currentUid == aTransfer.uid) {
                    this._errorCounter++;
                    this._progressCounter--;
                }
            }
        },
        _onTransferCancel: function (aTransfer, aWasInProgress = true) {
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
        this._operationURL = "";
        this._errorDescription = "";
        this._file = null;
        this._sourceURL = null;
        this._targetURL = null;
        this._started = false;
        this._urlRequest = false;
        this._sending = false;
        this._success = false;
        this.error = false;
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
        if (aMetaInfo.removeOnComplete) {
            this._removeOnComplete = true;
        }
        if (aMetaInfo.operationURL) {
            this._operationURL = aMetaInfo.operationURL;
            this.urlRequest = true;
        }
        this.remoteDownloadFailed = Boolean(aMetaInfo.remoteDownloadFailed);
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
    Object.defineProperty(Transfer.prototype, "errorDescription", {
        enumberable: true,
        get: function () {
            return this._errorDescription;
        }
    });
    Object.defineProperty(Transfer.prototype, "urlRequest", {
        enumberable: true,
        get: function () {
            return this._urlRequest;
        },
        set: function (val) {
            if (val) {
                this._started = true;
            }
            this._urlRequest = val;
        }
    });
    Object.defineProperty(Transfer.prototype, "success", {
        enumberable: true,
        get: function () {
            return this._success;
        },
        set: function (val) {
            this._success = val;
        }
    });
    Object.defineProperty(Transfer.prototype, "inProgress", {
        enumberable: true,
        get: function () {
            return this.urlRequest || this._sending;
        }
    });
    Object.defineProperty(Transfer.prototype, "completed", {
        enumberable: true,
        get: function () {
            return this.started && !this.inProgress;
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
    Object.defineProperty(Transfer.prototype, "operationURL", {
        enumberable: true,
        get: function () {
            return this._operationURL;
        },
        set: function (val) {
            this._operationURL = val;
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
    Transfer.prototype.start = function (aCallbacks) {
        if (this._sending) {
            return;
        }
        this._started = true;
        this._urlRequest = false;
        this._sending = true;
        this._success = false;
        try {
            this._start(aCallbacks);
        } catch (e) {
            this._sending = false;
            this.error = true;
            this._errorDescription = e.message;
            throw e;
        }
    };
    Transfer.prototype.cancel = function () {
        if (this.inProgress) {
            if (this.urlRequest) {
                this._urlRequest = false;
                return;
            }
            this._abort();
        }
    };
    Transfer.prototype.toJSON = function () {
        return {
            id: this._id,
            uid: this._uid,
            sourceURL: this.sourceURL,
            file: this._file && this._file.path,
            meta: {
                pageURL: this._metaInfo.pageURL,
                pageTitle: this._metaInfo.pageTitle,
                imageAlt: this._metaInfo.imageAlt,
                filename: this.filename,
                operationURL: this.operationURL,
                remoteDownloadFailed: this.remoteDownloadFailed,
                removeOnComplete: this._removeOnComplete
            }
        };
    };
    Transfer.prototype._abort = function () {
        if (this._downloader) {
            this._downloader.abort();
            this._downloader = null;
        }
        if (this._uploader) {
            this._uploader.abort();
            this._uploader = null;
        }
    };
    Transfer.prototype._start = function (aCallbacks) {
        let fis = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        let tmpFile;
        let needDownloading = true;
        if (this._file) {
            needDownloading = false;
            try {
                fis.init(this._file, 1, parseInt("0644", 8), false);
            } catch (e) {
                logger("fileInputStream failed. Msg: " + e.message);
                throw new Error(ERRORS.UPLOAD.FILE_IO);
            }
        } else {
            tmpFile = FileUtils.getFile("TmpD", [this._getTmpFilename(this.sourceURL)]);
            if (tmpFile.exists()) {
                needDownloading = false;
                try {
                    fis.init(tmpFile, 1 | 8, parseInt("0644", 8), false);
                } catch (e) {
                    logger("Locally downloaded file exists. But fileInputStream failed. Msg: " + e.message);
                    throw new Error(ERRORS.UPLOAD.FILE_IO);
                }
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
                        if (this._removeOnComplete || tmpFile) {
                            try {
                                let file = tmpFile || this._file;
                                if (file) {
                                    file.remove(false);
                                }
                            } catch (e) {
                            }
                        }
                        this._success = true;
                    }
                    this._sending = false;
                    if (!(success || aStatus === Cr.NS_BINDING_ABORTED)) {
                        this.error = true;
                        let desc = "";
                        if (aStatus) {
                            if (aStatus === Cr.NS_ERROR_CONNECTION_REFUSED) {
                                desc = ERRORS.SYSTEM.NO_CONNECTION;
                            } else {
                                desc = ERRORS.SYSTEM.UNKNOWN + "-" + aStatus;
                            }
                        } else {
                            desc = ERRORS.UPLOAD.HTTP + "-" + aRequest.responseStatus;
                        }
                        this._errorDescription = desc;
                    }
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
            let fileOutputStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            let modeFlags = 2 | 8 | 32;
            try {
                fileOutputStream.init(tmpFile, modeFlags, parseInt("0644", 8), 0);
            } catch (e) {
                logger("download fileOutputStream failed. Msg: " + e.message);
                throw new Error(ERRORS.DOWNLOAD.FILE_IO);
            }
            this._downloader = new Downloader(fileOutputStream, this._sourceURL);
            this._downloader.addListener({
                onStart: function (aRequest) {
                    aCallbacks.onStart(this);
                    if (!Components.isSuccessCode(aRequest.status)) {
                        return;
                    }
                    try {
                        aRequest.QueryInterface(Ci.nsIHttpChannel);
                    } catch (e) {
                    }
                    let contentLength = aRequest.contentLength;
                    if (contentLength > 0) {
                        this.progress.max = contentLength;
                    }
                }.bind(this),
                onStop: function (aStatus, aResponseStatus) {
                    let success = Components.isSuccessCode(aStatus);
                    if (!success) {
                        if (aStatus !== Cr.NS_BINDING_ABORTED) {
                            let errorDesc;
                            if (aStatus === Cr.NS_ERROR_CONNECTION_REFUSED) {
                                errorDesc = ERRORS.SYSTEM.NO_CONNECTION;
                            } else {
                                errorDesc = ERRORS.SYSTEM.UNKNOWN + "-" + aStatus;
                            }
                            this._errorDescription = errorDesc;
                        }
                    } else if (aResponseStatus < 200 || aResponseStatus > 399) {
                        this._errorDescription = ERRORS.DOWNLOAD.HTTP + "-" + aResponseStatus;
                        success = false;
                    }
                    if (!success) {
                        this._sending = false;
                        if (aStatus !== Cr.NS_BINDING_ABORTED) {
                            this.error = true;
                        }
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
                    try {
                        fis.init(tmpFile, 1, parseInt("0644", 8), false);
                    } catch (e) {
                        logger("Couldn't initalize fileInputStream after downloading. Msg: " + e.message);
                        this._sending = false;
                        this.error = true;
                        this._errorDescription = ERRORS.SYSTEM.FILE_IO;
                        aCallbacks.onComplete(false, this);
                        return;
                    }
                    initUploadProcess();
                }.bind(this),
                onProgress: function (aProgress) {
                    this.progress.downloaded = aProgress.current;
                    aCallbacks.onProgress(this.progress, this);
                }.bind(this)
            });
            this._downloader.start();
        } else {
            this.progress.downloaded = -1;
            this.progress.max = (this._file || tmpFile).fileSize;
            initUploadProcess(true);
        }
    };
    Transfer.prototype._getTmpFilename = function (aLocator) {
        return common.strUtils.md5(aLocator);
    };
    function Transmitter() {
    }
    Transmitter.prototype.addListener = function (aHandlers) {
        this._handlers = aHandlers;
    };
    Transmitter.prototype.getProgress = function () {
        return this._progress;
    };
    Transmitter.prototype.abort = function () {
        if (this._channel) {
            this._channel.cancel(Cr.NS_BINDING_ABORTED);
        }
    };
    Transmitter.prototype.onChannelRedirect = function (aOldChannel, aNewChannel, aFlags) {
        this._channel = aNewChannel;
    };
    Transmitter.prototype.asyncOnChannelRedirect = function (aOldChannel, aNewChannel, aFlags, aCallback) {
        this._channel = aNewChannel;
        aCallback.onRedirectVerifyCallback(Cr.NS_OK);
    };
    Transmitter.prototype.onStatus = function (aRequest, aContext, aStatus, aStatusArg) {
    };
    Transmitter.prototype.onRedirect = function (aHttpChannel, aNewChannel) {
    };
    Transmitter.prototype.getInterface = function (aIID) {
        try {
            return this.QueryInterface(aIID);
        } catch (e) {
            throw Cr.NS_NOINTERFACE;
        }
    };
    Transmitter.prototype.QueryInterface = function (aIID) {
        if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIInterfaceRequestor) || aIID.equals(Ci.nsIChannelEventSink) || aIID.equals(Ci.nsIProgressEventSink) || aIID.equals(Ci.nsIHttpEventSink) || aIID.equals(Ci.nsIStreamListener)) {
            return this;
        }
        throw Cr.NS_NOINTERFACE;
    };
    Transmitter.prototype._setupChannel = function () {
        if (this._channel) {
            this._channel = null;
        }
        this._channel = Services.io.newChannelFromURI(this._url);
        this._channel.notificationCallbacks = this;
    };
    Transmitter.prototype._emit = function (aEventName) {
        if (this._handlers && typeof this._handlers[aEventName] === "function") {
            let args = Array.prototype.slice.call(arguments, 1);
            this._handlers[aEventName].apply(null, args);
        }
    };
    function Downloader(aOutputSteam, aSourceURL) {
        this._stream = aOutputSteam;
        this._url = aSourceURL;
        this._data = "";
        this._handlers = {};
        this._progress = {
            current: 0,
            max: 0
        };
        this._setupChannel();
    }
    Downloader.prototype = Object.create(Transmitter.prototype);
    Downloader.prototype.constructor = Downloader;
    Downloader.prototype.start = function () {
        if (this._channel) {
            this._channel.asyncOpen(this, null);
        }
    };
    Downloader.prototype.onStartRequest = function (aRequest, aContext) {
        this._emit("onStart", aRequest);
    };
    Downloader.prototype.onStopRequest = function (aRequest, aContext, aStatus) {
        this._flush();
        this._stream.close();
        this._stream = null;
        this._emit("onStop", aStatus, aRequest.responseStatus);
    };
    Downloader.prototype.onDataAvailable = function (aRequest, aContext, aInputStream, aOffset, aCount) {
        let bis = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        bis.setInputStream(aInputStream);
        let bytes = bis.readBytes(aCount);
        this._data += bytes;
        if (this._data.length > 100000) {
            this._flush();
        }
        this._emit("onData");
    };
    Downloader.prototype.onProgress = function (aRequest, aContext, aCurrentProgress, aMaxProgress) {
        this._progress.current = aCurrentProgress;
        this._progress.max = aMaxProgress;
        this._emit("onProgress", this._progress);
    };
    Downloader.prototype._flush = function () {
        if (this._data) {
            this._stream.write(this._data, this._data.length);
            this._data = "";
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
    Uploader.prototype = Object.create(Transmitter.prototype);
    Uploader.prototype.constructor = Uploader;
    Uploader.prototype.start = function () {
        if (this._channel) {
            this._channel.asyncOpen(this, null);
        }
    };
    Uploader.prototype.onStartRequest = function (aRequest, aContext) {
        this._emit("onStart", aRequest);
    };
    Uploader.prototype.onStopRequest = function (aRequest, aContext, aStatus) {
        this._stream.close();
        this._emit("onStop", aRequest, aStatus);
    };
    Uploader.prototype.onDataAvailable = function (aRequest, aContext, aInputStream, aOffset, aCount) {
        this._emit("onData");
    };
    Uploader.prototype.onProgress = function (aRequest, aContext, aCurrentProgress, aMaxProgress) {
        this._progress.current = aCurrentProgress;
        this._progress.max = aMaxProgress;
        this._emit("onProgress", this._progress);
    };
    Uploader.prototype._setupChannel = function (aChunked) {
        if (this._channel) {
            this._channel = null;
        }
        this._channel = Services.io.newChannelFromURI(this._url);
        this._channel.QueryInterface(Ci.nsIHttpChannel);
        this._channel.QueryInterface(Ci.nsIUploadChannel);
        this._channel.notificationCallbacks = this;
        this._channel.setUploadStream(this._stream, "text/plain", -1);
    };
    let resourceFactory = {
        getResource: function (aResource, aMetaInfo = {}) {
            if (!aResource) {
                throw new Error("Resource is missing.");
            }
            if (this._isLocalFileURL(aResource)) {
                aResource = this._getFileFromFileURL(aResource);
            }
            if (aResource instanceof Ci.nsIFile) {
                return new FileResource(aResource, aMetaInfo);
            }
            if (this._isDataImageURL(aResource)) {
                return new DataImageResource(aResource, aMetaInfo);
            }
            if (this._isRemoteURL(aResource)) {
                return new RemoteResource(aResource, aMetaInfo);
            }
            throw new Error("Not valid resource.");
        },
        _isDataImageURL: function (aURL) {
            return DataImageResource.dataImageRegexp.test(aURL);
        },
        _isLocalFileURL: function (aURL) {
            return /^file:\/\/\//i.test(aURL);
        },
        _isRemoteURL: function (aURL) {
            return /^(https?|file):\/\//i.test(aURL);
        },
        _getFileFromFileURL: function (aURL) {
            let pHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            return pHandler.getFileFromURLSpec(aURL);
        }
    };
    function Resource() {
    }
    Object.defineProperty(Resource.prototype, "url", {
        enumberable: true,
        get: function () {
            return this._url;
        }
    });
    Object.defineProperty(Resource.prototype, "locator", {
        enumberable: true,
        get: function () {
            return this._locator;
        }
    });
    Object.defineProperty(Resource.prototype, "isDataImage", {
        enumberable: true,
        get: function () {
            return false;
        }
    });
    Object.defineProperty(Resource.prototype, "metaInfo", {
        enumberable: true,
        get: function () {
            return this._meta;
        }
    });
    Resource.prototype._getFileURLFromFile = function (aFile) {
        return Services.io.newFileURI(aFile).spec;
    };
    function RemoteResource(aResource, aMetaInfo) {
        this._url = aResource;
        this._locator = aResource;
        this._meta = aMetaInfo;
    }
    RemoteResource.prototype = Object.create(Resource.prototype);
    RemoteResource.prototype.constructor = RemoteResource;
    function FileResource(aFile, aMetaInfo) {
        this._locator = aFile;
        this._meta = aMetaInfo;
        this._setupURL();
    }
    FileResource.prototype = Object.create(Resource.prototype);
    FileResource.prototype.constructor = FileResource;
    FileResource.prototype._setupURL = function () {
        this._url = this._getFileURLFromFile(this._locator);
    };
    function DataImageResource(aDataImage, aMetaInfo) {
        this._locator = null;
        this._meta = aMetaInfo;
        this._dataImage = aDataImage;
        this._setupURL();
    }
    DataImageResource.prototype = Object.create(Resource.prototype);
    DataImageResource.prototype.constructor = DataImageResource;
    DataImageResource.dataImageRegexp = /^data:image\/((?:x\-ms\-)?bmp|gif|jpeg|jpg|png|tiff|svg\+xml|x\-icon);base64,/i;
    Object.defineProperty(DataImageResource.prototype, "isDataImage", {
        enumberable: true,
        get: function () {
            return true;
        }
    });
    Object.defineProperty(DataImageResource.prototype, "locator", {
        enumberable: true,
        get: function () {
            if (!this._locator) {
                this._setupLocator();
            }
            return this._locator;
        }
    });
    DataImageResource.prototype._setupURL = function () {
        let tmpFile = this._getTmpFile();
        this._url = this._getFileURLFromFile(tmpFile);
    };
    DataImageResource.prototype._setupLocator = function () {
        this._locator = this._createImageFile(this._dataImage);
    };
    DataImageResource.prototype._createImageFile = function (aData) {
        let file = this._getTmpFile();
        let channel = Services.io.newChannelFromURI(Services.io.newURI(aData, null, null));
        try {
            yadiskDownloader.app.api.Files.writeStreamToFile(channel.open(), file);
        } catch (e) {
            return null;
        }
        return file;
    };
    DataImageResource.prototype._getTmpFile = function () {
        return FileUtils.getFile("TmpD", [this._getTmpFileName()]);
    };
    DataImageResource.prototype._getTmpFileName = function () {
        let match = DataImageResource.dataImageRegexp.exec(this._dataImage);
        let filename = common.strUtils.md5(this._dataImage);
        if (match[1]) {
            filename += "." + match[1];
        }
        return filename;
    };
    return yadiskDownloader;
};
