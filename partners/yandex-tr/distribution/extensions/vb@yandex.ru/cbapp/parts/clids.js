"use strict";
const EXPORTED_SYMBOLS = ["clids"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const DEFAULT_VENDOR_XML_PATH = "defaults/vendor/vendor.xml";
const clids = {
    init: function clids_init(aApplication) {
        this._application = aApplication;
        this._logger = aApplication.getLogger("Clids");
        if (aApplication.addonManager.info.addonVersionChanged) {
            if (aApplication.addonManager.info.isFreshAddonInstall && aApplication.core.CONFIG.APP.TYPE == "vbff") {
                this._migrateBarsClidsOnInstall();
            }
            this._mergeWithInternalData();
        }
    },
    finalize: function clids_finalize(aDoCleanup) {
        if (aDoCleanup) {
            this._removeVendorFile();
        }
        this.__vendorData = null;
        this._logger = null;
        this._application = null;
    },
    get vendorData() {
        if (this.__vendorData) {
            return this.__vendorData;
        }
        let data = Object.create(null);
        let vendorXML = this._vendorXML;
        if (!vendorXML) {
            try {
                this._application.addonFS.copySource(DEFAULT_VENDOR_XML_PATH, this._vendorFile.parent, this._vendorFileName);
            } catch (e) {
                this._logger.error("Can not create vendor file from internal xml.");
                this._logger.debug(e);
            }
            vendorXML = this._vendorXML;
        }
        if (vendorXML) {
            let nodes = vendorXML.querySelectorAll("vendor > *");
            for (let i = nodes.length; i--;) {
                let node = nodes[i];
                let nodeName = node.nodeName;
                if (!/^clid/.test(nodeName)) {
                    continue;
                }
                let clidData = data[nodeName] = Object.create(null);
                if (nodeName in this._yandexFirefoxClids) {
                    clidData.clid = this._yandexFirefoxClids[nodeName] || null;
                    clidData.clidAndVid = clidData.clid;
                    continue;
                }
                let attributes = node.attributes;
                for (let i = attributes.length; i--;) {
                    let attribute = attributes[i];
                    clidData[attribute.name] = attribute.value;
                }
                clidData.clid = node.textContent || null;
                if (clidData.clid) {
                    clidData.clidAndVid = clidData.clid;
                    if (clidData.vid) {
                        clidData.clidAndVid += "-" + clidData.vid;
                    }
                }
            }
        }
        return this.__vendorData = data;
    },
    __vendorData: null,
    get _vendorFileName() {
        return "clids-" + this._application.core.CONFIG.APP.TYPE + ".xml";
    },
    get _vendorFile() {
        let vendorFile = this._application.directories.userDir;
        vendorFile.append(this._vendorFileName);
        return vendorFile;
    },
    get _vendorXML() {
        let vendorFile = this._vendorFile;
        if (!vendorFile.exists()) {
            return;
        }
        let vendorXML;
        try {
            vendorXML = this._application.core.Lib.fileutils.xmlDocFromFile(vendorFile);
        } catch (e) {
            this._logger.error("Can not read vendor file.");
            this._logger.debug(e);
        }
        return vendorXML;
    },
    _mergeWithInternalData: function clids__mergeWithInternalData() {
        this.__vendorData = null;
        let installedFile = this._vendorFile;
        if (!installedFile.exists()) {
            return;
        }
        try {
            installedFile.permissions = parseInt("0644", 8);
        } catch (e) {
        }
        let installedXML = this._vendorXML;
        if (!installedXML) {
            this._removeVendorFile();
            return;
        }
        let fileutils = this._application.core.Lib.fileutils;
        let distribXML;
        try {
            distribXML = fileutils.xmlDocFromStream(this._application.addonFS.getStream(DEFAULT_VENDOR_XML_PATH));
        } catch (e) {
            this._logger.error("Can not read internal vendor file.");
            this._logger.debug(e);
        }
        if (!distribXML) {
            return;
        }
        let writeNewData = false;
        let nodes = distribXML.querySelectorAll("vendor > *");
        for (let i = nodes.length; i--;) {
            let node = nodes[i];
            let nodeName = node.nodeName;
            let nodeValue = node.textContent;
            if (!nodeValue) {
                continue;
            }
            let existsNode;
            try {
                existsNode = installedXML.querySelector("vendor > " + nodeName);
            } catch (e) {
                this._logger.debug(e);
                continue;
            }
            if (!existsNode) {
                installedXML.documentElement.appendChild(node);
                writeNewData = true;
            } else {
                if (!existsNode.textContent) {
                    existsNode.textContent = node.textContent || "";
                    writeNewData = true;
                }
                let attributes = node.attributes;
                for (let i = attributes.length; i--;) {
                    let attribute = attributes[i];
                    if (existsNode.hasAttribute(attribute.name)) {
                        continue;
                    }
                    existsNode.setAttribute(attribute.name, attribute.value);
                    writeNewData = true;
                }
            }
        }
        if (writeNewData) {
            fileutils.xmlDocToFile(installedXML, installedFile);
        }
    },
    _migrateBarsClidsOnInstall: function clids__migrateBarsClidsOnInstall() {
        let vendorFile = this._vendorFile;
        if (vendorFile.exists()) {
            return;
        }
        let fileutils = this._application.core.Lib.fileutils;
        let barClidsFile = this._application.directories.userDir;
        barClidsFile.append("clids-barff.xml");
        if (barClidsFile.exists() && barClidsFile.isFile() && barClidsFile.isReadable()) {
            try {
                let barClidsXML;
                try {
                    barClidsXML = fileutils.xmlDocFromFile(barClidsFile);
                } catch (ex) {
                    this._logger.error("Can not read bar clids file.");
                    this._logger.debug(ex);
                }
                if (barClidsXML) {
                    let nodes = barClidsXML.querySelectorAll("vendor > *");
                    for (let i = nodes.length; i--;) {
                        let node = nodes[i];
                        let nodeName = node.nodeName;
                        let nodeValue = node.textContent;
                        if ([
                                "clid1",
                                "clid7",
                                "clid8"
                            ].indexOf(nodeName) == -1) {
                            barClidsXML.documentElement.removeChild(node);
                        }
                    }
                    fileutils.xmlDocToFile(barClidsXML, vendorFile);
                }
            } catch (e) {
                this._logger.error("Can not migrate clids on install.");
                this._logger.debug(e);
                return;
            }
        }
        this._mergeWithInternalData();
    },
    _removeVendorFile: function clids__removeVendorFile() {
        this._application.core.Lib.fileutils.removeFileSafe(this._vendorFile);
    },
    get _yandexFirefoxClids() {
        delete this._yandexFirefoxClids;
        let clids = Object.create(null);
        let yandexQSFile = !this._application.installer.isYandexFirefoxDistribution && this._application.installer.getYandexQSApplicationFile();
        function profileYandexXMLNotPresent() {
            let searchPluginsDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
            searchPluginsDir.append("searchplugins");
            if (!searchPluginsDir.exists() || !searchPluginsDir.isDirectory()) {
                return true;
            }
            let searchPluginsDirEntries = searchPluginsDir.directoryEntries;
            while (searchPluginsDirEntries.hasMoreElements()) {
                let qsFile = searchPluginsDirEntries.getNext().QueryInterface(Ci.nsIFile);
                if (qsFile.isFile() && /.*yandex.*\.xml$/.test(qsFile.leafName)) {
                    return false;
                }
            }
            return true;
        }
        if (yandexQSFile && profileYandexXMLNotPresent()) {
            let qsXML;
            try {
                qsXML = this._application.core.Lib.fileutils.xmlDocFromFile(yandexQSFile);
            } catch (e) {
                this._logger.error("Can not get XML from Yandex QS.");
                this._logger.debug(e);
            }
            if (qsXML) {
                let urlNode = qsXML.querySelector("SearchPlugin > Url[type=\"text/html\"]");
                let clid10Node = urlNode && (urlNode.querySelector("MozParam[name=\"clid\"][purpose=\"contextmenu\"][value]") || urlNode.querySelector("Param[name=\"clid\"][value]"));
                clids.clid10 = clid10Node && clid10Node.getAttribute("value") || null;
                if (!clids.clid10) {
                    this._logger.error("Can not get clid10 from Yandex QS.");
                }
            }
        }
        return this._yandexFirefoxClids = clids;
    }
};
