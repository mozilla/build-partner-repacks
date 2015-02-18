"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
let appCore;
switch (APP_NAME) {
case "yasearch":
    appCore = Cc["@yandex.ru/custombarcore;yasearch"].getService().wrappedJSObject;
    break;
case "yandex-vb":
    appCore = Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject;
    break;
default:
    throw new Error("Unknown application type '" + APP_NAME + "'");
}
(function (global) {
    window.addEventListener("load", function onload(event) {
        window.removeEventListener("load", onload, false);
        collectInfo();
    }, false);
    global.collectInfo = function collectInfo() {
        let setCollectingState = function setCollectingState(aDisabled) {
            this.classList[aDisabled ? "add" : "remove"]("wait");
        }.bind($("collect-info"));
        setCollectingState(true);
        hide($("send-info"));
        Snapshoter.capture(function formatSnapshot(snapshot) {
            for (let prop in formatters) {
                formatters[prop](snapshot[prop]);
            }
            packManager.prepeare(snapshot);
            setCollectingState(false);
        });
    };
    global.savePack = function savePack() {
        packManager.savePack();
    };
    global.restoreBackup = function restoreBackup() {
        let optionChecked = $("backup-list").querySelector("input:checked");
        let formButton = $("restore-button");
        if (!optionChecked) {
            return;
        }
        formButton.setAttribute("disabled", "disabled");
        Snapshoter.restoreBackup(optionChecked.value);
        appCore.application.navigate({
            url: appCore.application.protocolSupport.url,
            target: "new tab"
        });
        window.close();
    };
    const fileutils = appCore.Lib.fileutils;
    let browserWindow = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
    let packManager = {
        _pack: null,
        savePack: function packManager_savePack() {
            let displayDirectory;
            [
                "DfltDwnld",
                "Desk",
                "Home"
            ].forEach(function (dirType) {
                if (displayDirectory) {
                    return;
                }
                try {
                    displayDirectory = Services.dirsvc.get(dirType, Ci.nsIFile);
                } catch (e) {
                }
            });
            let filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
            if (displayDirectory) {
                filePicker.displayDirectory = displayDirectory;
            }
            filePicker.defaultString = this._pack.zipFile.leafName;
            filePicker.init(window, null, filePicker.modeSave);
            let rv = filePicker.show();
            if (!(rv == Ci.nsIFilePicker.returnOK || rv == Ci.nsIFilePicker.returnReplace)) {
                return;
            }
            let excludeFileNames = [];
            let packFiles = this._pack.files;
            for (let fileType in packFiles) {
                if ($(fileType + "-to-send").querySelector("input[type='checkbox']").checked) {
                    continue;
                }
                if (isHidden($(fileType + "-to-send"))) {
                    continue;
                }
                excludeFileNames.push(packFiles[fileType]);
            }
            if (excludeFileNames.length === Object.keys(packFiles).length) {
                return;
            }
            if (excludeFileNames.length) {
                let zipWriter = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
                zipWriter.open(this._pack.zipFile, fileutils.MODE_RDWR);
                excludeFileNames.forEach(fileName => zipWriter.removeEntry(fileName, false));
                zipWriter.close();
            }
            let fileName = filePicker.file.leafName.replace(/(\.zip)?$/i, ".zip");
            this._pack.zipFile.moveTo(filePicker.file.parent, fileName);
            hide($("send-info"));
            show($("rebuild-pack"));
        },
        prepeare: function packManager_prepeare(aSnapshot) {
            this._pack = null;
            let supportDir = appCore.rootDir;
            supportDir.append("support");
            fileutils.forceDirectories(supportDir);
            let debugLogFile = appCore.rootDir;
            debugLogFile.append("debug.log");
            let supportInfoFile = supportDir.clone();
            supportInfoFile.append("info.json");
            fileutils.writeTextFile(supportInfoFile, JSON.stringify(aSnapshot, null, "	"));
            let fastdialInfoFile = supportDir.clone();
            fastdialInfoFile.append("fastdial.json");
            let fastdialJSON = Snapshoter.getFastdialInfo();
            if (fastdialJSON) {
                fileutils.writeTextFile(fastdialInfoFile, JSON.stringify(fastdialJSON, null, "	"));
            }
            let browser = browserWindow.gBrowser;
            let selectedTab = browser.selectedTab;
            browserWindow.BrowserOpenTab();
            let newTab = browser.selectedTab;
            browser.selectedTab = selectedTab;
            browser.hideTab(newTab);
            appCore.Lib.task.spawn(function () {
                let promiseSleep = appCore.Lib.sysutils.promiseSleep;
                yield promiseSleep(2000, function () {
                    return newTab.linkedBrowser.contentDocument.readyState === "complete";
                });
                browser.selectedTab = newTab;
                yield promiseSleep(100);
                let canvas = document.getElementById("screenshot-canvas");
                let context = canvas.getContext("2d");
                canvas.height = browserWindow.innerHeight;
                canvas.width = browserWindow.innerWidth;
                context.drawWindow(browserWindow, 0, 0, canvas.width, canvas.height, "rgba(0,0,0,0)");
                browser.removeCurrentTab({ animate: false });
                browser.selectedTab = selectedTab;
                let screenFile = supportDir.clone();
                screenFile.append("screenshot.png");
                let screenDataURL = canvas.toDataURL("image/png", "");
                let screenURI = Services.io.newURI(screenDataURL, null, null);
                let stream = Services.io.newChannelFromURI(screenURI).open();
                fileutils.writeStreamToFile(stream, screenFile);
                let supportZipFile = appCore.rootDir;
                supportZipFile.append(APP_NAME + ".support.zip");
                fileutils.removeFileSafe(supportZipFile);
                this._pack = {
                    zipFile: supportZipFile,
                    files: {
                        log: "debug.log",
                        info: "info.json",
                        screenshot: "screenshot.png",
                        fastdial: "fastdial.json"
                    },
                    getDataURL: function packInfo_getDataURL(aType) {
                        if (aType == "screenshot") {
                            return screenDataURL;
                        }
                        try {
                            let zipReader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
                            zipReader.open(this.zipFile, fileutils.MODE_RDWR);
                            let stream = zipReader.getInputStream(this.files[aType]);
                            let result = "data:text/plain;charset=utf-8," + encodeURIComponent(fileutils.readStringFromStream(stream));
                            stream.close();
                            zipReader.close();
                            return result;
                        } catch (e) {
                        }
                        return "data:,Error";
                    }
                };
                let zipWriter = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
                let compressionLevel = zipWriter.COMPRESSION_BEST;
                zipWriter.open(supportZipFile, fileutils.MODE_WRONLY | fileutils.MODE_CREATE | fileutils.MODE_TRUNCATE);
                if (debugLogFile.exists()) {
                    zipWriter.addEntryFile(debugLogFile.leafName, compressionLevel, debugLogFile, false);
                } else {
                    delete this._pack.files.log;
                }
                if (fastdialInfoFile.exists()) {
                    zipWriter.addEntryFile(fastdialInfoFile.leafName, compressionLevel, fastdialInfoFile, false);
                } else {
                    delete this._pack.files.fastdial;
                }
                zipWriter.addEntryFile(supportInfoFile.leafName, compressionLevel, supportInfoFile, false);
                zipWriter.addEntryFile(screenFile.leafName, compressionLevel, screenFile, false);
                zipWriter.close();
                fileutils.removeFileSafe(supportDir);
                this._showForm();
            }.bind(this));
        },
        _showForm: function packManager__showForm() {
            show($("send-info"));
            for (let fileType in this._pack.files) {
                let elem = $(fileType + "-to-send");
                show(elem);
                elem.querySelector("a").setAttribute("href", this._pack.getDataURL(fileType));
                elem.querySelector("a").setAttribute("target", "_blank");
                let checkbox = elem.querySelector("input[type='checkbox']");
                checkbox.checked = true;
                checkbox.onchange = function _checkSendButton() {
                    let checked = Array.prototype.some.call($("send-info").querySelectorAll("ul > li"), function (listElement) {
                        let checkbox = listElement.querySelector("input[type='checkbox']");
                        return checkbox && checkbox.checked && !isHidden(listElement);
                    });
                    $("save-info-button").disabled = !checked;
                };
            }
        }
    };
    let formatters = {
        extension: function formatters_extension(data) {
            $("version-box").textContent = data.version;
            $("date-box").textContent = data.date;
        },
        backup: function formatters_backup(data) {
            if (!data) {
                return;
            }
            if (!data.length) {
                show($("no-backups"));
                return;
            }
            append($("backup-list-elem"), data.map(function (fileData) {
                let radioInput = create("input");
                radioInput.setAttribute("type", "radio");
                radioInput.setAttribute("name", "backupfile");
                radioInput.value = fileData.name;
                return create("li", [create("label", [
                        radioInput,
                        create("span", new Date(fileData.date).toDateString(), "backup-name")
                    ])]);
            }));
            show($("backup-list"));
        },
        application: function formatters_application(data) {
            $("useragent-box").textContent = data.userAgent;
            $("os-box").textContent = data.os;
            let version = data.version;
            if (data.vendor) {
                version += " (" + data.vendor + ")";
            }
            $("browser-box").textContent = data.name + "; " + version;
            if (data.theme) {
                show($("theme-box").parentNode);
                $("theme-box").textContent = data.theme;
            }
            if (data.lightweightTheme) {
                show($("lightweightTheme-box").parentNode);
                $("lightweightTheme-box").textContent = data.lightweightTheme;
            }
        },
        extensions: function formatters_extensions(data) {
            append($("extensions-tbody"), data.map(function (extension) {
                return create("tr", [
                    create("td", extension.name),
                    create("td", extension.version),
                    create("td", extension.isActive, "center"),
                    create("td", extension.id),
                    create("td", extension.homepageURL)
                ]);
            }));
        },
        components: function formatters_components(data) {
            if (!Array.isArray(data) || !data.length) {
                return;
            }
            show($("components"));
            data.forEach(function (package_) {
                append($("components-tbody"), [create("tr", [
                        create("td", package_.id + " (" + package_.version + ")", "packageName"),
                        create("td", "")
                    ])]);
                append($("components-tbody"), package_.components.map(function (component) {
                    return create("tr", [
                        create("td", component.name, "componentName"),
                        create("td", typeof component.enabled == "boolean" ? component.enabled : "", "center")
                    ]);
                }));
            });
        },
        modifiedBrowserPreferences: function formatters_modifiedBrowserPreferences(data) {
            appendModifiedPreferences($("browser-preferences-tbody"), data);
        },
        modifiedExtensionPreferences: function formatters_modifiedExtensionPreferences(data) {
            appendModifiedPreferences($("extension-preferences-tbody"), data);
        }
    };
    let $ = document.getElementById.bind(document);
    function create(tag, children, classNames) {
        let elt = document.createElementNS("http://www.w3.org/1999/xhtml", tag);
        if (classNames) {
            classNames.split(/\s+/).forEach(className => elt.classList.add(className));
        }
        if (Array.isArray(children)) {
            append(elt, children);
        } else {
            elt.textContent = String(children);
        }
        return elt;
    }
    function append(parent, children) {
        children.forEach(c => parent.appendChild(c));
    }
    function show(element) {
        element.classList.remove("hidden");
    }
    function hide(element) {
        element.classList.add("hidden");
    }
    function isHidden(element) {
        return element.classList.contains("hidden");
    }
    function appendModifiedPreferences(element, data) {
        append(element, sortedArrayFromObject(data).map(function ([
            name,
            value
        ]) {
            let val = String(value);
            if (val.length > 240) {
                val = val.substr(0, 240) + "…";
            }
            return create("tr", [
                create("td", name, "pref-name"),
                create("td", val, "pref-value")
            ]);
        }));
    }
    function sortedArrayFromObject(obj) {
        let arr = [];
        for (let [
                    name,
                    value
                ] in Iterator(obj)) {
            arr.push([
                name,
                value
            ]);
        }
        return arr.sort(function ([
            name1,
            value1
        ], [
            name2,
            value2
        ]) {
            return name1.localeCompare(name2);
        });
    }
}(this));
