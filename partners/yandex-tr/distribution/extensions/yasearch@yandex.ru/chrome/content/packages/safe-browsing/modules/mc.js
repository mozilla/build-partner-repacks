const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const resources = {
    browser: {
        styles: ["/styles/mc/browser.css"],
        urlBarItems: { button: 10100 }
    }
};
const WIDGET_ID = "ru.yandex.bar.mistype-corrector";
function URLBarItem(itemElement, itemClass, module) {
    itemElement.module = module;
    itemElement.setAttribute("yb-native-widget-name", WIDGET_ID);
    this.element = itemElement;
}
URLBarItem.prototype = {
    finalize: function URLBarItem_finalize() {
        delete this.element;
    }
};
const core = {
    init: function MCCore_init(api) {
        this.api = api;
        this._loadModules();
        Cu.import("resource://gre/modules/Services.jsm");
        this.communicator.enableComponent(this);
    },
    get WIDGET_ID() WIDGET_ID,
    finalize: function MCCore_finalize() {
        this._saveConfig();
        this._saveWhitelist();
        this.__config = null;
        this.__whitelist = null;
        this.communicator.disableComponent(this);
        this.communicator = null;
    },
    couldPerform: function MCCore_couldPerform(data) {
        return this.communicator.communicate(this.WIDGET_ID, "could-perform", data);
    },
    clearCheck: function MCCore_clearCheck(aTab) {
        if (!aTab) {
            return;
        }
        Services.obs.notifyObservers(aTab, this.WIDGET_ID + ".clear-tab-data", null);
    },
    initURLBarItem: function MCCore_initURLBarItem(itemElement, itemClass) {
        return new URLBarItem(itemElement, itemClass, this);
    },
    _copyDefaultConfig: function MCCore__copyDefaultConfig(fromFile, toFile) {
        this.api.Files.writeStreamToFile(this.api.Package.getFileInputChannel(fromFile).contentStream, toFile);
    },
    _loadConfigHelper: function MCCore__loadConfigHelper(fileName) {
        let packageFile = "data/" + fileName;
        let configFile = this.api.Files.getWidgetStorage(true);
        configFile.append(fileName);
        if (!configFile.exists())
            this._copyDefaultConfig(packageFile, configFile);
        return this.api.XMLUtils.xmlDocFromFile(configFile);
    },
    _MODULES: { communicator: "communicator.js" },
    _loadModules: function MCCore__loadModules() {
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            Cu.import(this.api.Package.resolvePath("/modules/" + moduleFileName), this);
            let module = this[moduleName];
            if (typeof module.init == "function")
                module.init(this.api);
        }
    },
    _loadConfig: function MCCore__loadConfig() {
        return this._loadConfigHelper("config.xml");
    },
    __config: null,
    __whitelist: null,
    getConfig: function MCCore_getConfig() {
        if (this.__config === null)
            this.__config = this._loadConfig();
        return this.__config;
    },
    _loadWhitelist: function MCCore__loadWhitelist() {
        return this._loadConfigHelper("whitelist.xml");
    },
    getWhitelist: function MCCore_getWhitelist() {
        if (this.__whitelist === null)
            this.__whitelist = this._loadWhitelist();
        return this.__whitelist;
    },
    getNavigateLink: function MCCore_getNavigateLink(from) {
        from = this._normalizeHostnameHelper(from);
        let subjectResult = this._queryXML("string(/config/rules/rule[@id='" + encodeURIComponent(from) + "']/@value)", this.getConfig());
        if (!subjectResult)
            return null;
        return decodeURIComponent(subjectResult);
    },
    _saveConfig: function MCCore__saveConfig() {
        let configFile = this.api.Files.getWidgetStorage(true);
        configFile.append("config.xml");
        this._saveXMLToFile(this.getConfig(), configFile);
    },
    _saveWhitelist: function MCCore__saveWhitelist() {
        let whitelistFile = this.api.Files.getWidgetStorage(true);
        whitelistFile.append("whitelist.xml");
        this._saveXMLToFile(this.getWhitelist(), whitelistFile);
    },
    _normalizeHostnameHelper: function MCCore__normalizeHostnameHelper(host) {
        return host && host.replace(/^https?:\/\//, "") || "";
    },
    appendRule: function MCCore_appendRule(from, to) {
        this.clearWhitelist(from);
        from = this._normalizeHostnameHelper(from);
        if (!from)
            return;
        to = this._normalizeHostnameHelper(to);
        if (!to)
            return;
        let rules = this._queryXML("/config/rules[@id='user-rules']", this.getConfig())[0];
        let newRule = this.getConfig().createElement("rule");
        newRule.setAttribute("id", encodeURIComponent(from));
        newRule.setAttribute("value", encodeURIComponent(to));
        rules.appendChild(newRule);
        this.api.Statistics.logShortAction(5310);
    },
    removeRule: function MCCore_removeRule(from) {
        let fromOrig = String(from);
        from = this._normalizeHostnameHelper(from);
        if (!from)
            return;
        let rules = this._queryXML("/config/rules[@id='user-rules']", this.getConfig())[0];
        let subjectResult = this._queryXML("rule[@id='" + encodeURIComponent(from) + "']", rules)[0];
        if (!subjectResult)
            subjectResult = this._queryXML("rule[@id='" + encodeURIComponent(fromOrig) + "']", rules)[0];
        if (!subjectResult)
            return;
        rules.removeChild(subjectResult);
        this.api.Statistics.logShortAction(5330);
    },
    incrementWhitelist: function MCCore_incrementWhitelist(from, count) {
        count = count || 1;
        from = this._normalizeHostnameHelper(from);
        let existingHost = from && this._queryXML("/whitelist/hosts/host[@id='" + encodeURIComponent(from) + "']", this.getWhitelist())[0];
        if (existingHost) {
            let value = parseInt(existingHost.getAttribute("value"), 10);
            existingHost.setAttribute("value", value + count);
            return;
        }
        let hosts = from && this._queryXML("/whitelist/hosts[@id='user-whitelist']", this.getWhitelist())[0];
        let newHost = this.getWhitelist().createElement("host");
        newHost.setAttribute("id", encodeURIComponent(from));
        newHost.setAttribute("value", count);
        hosts.appendChild(newHost);
    },
    clearWhitelist: function MCCore_clearWhitelist(from) {
        from = this._normalizeHostnameHelper(from);
        let existingHost = from && this._queryXML("/whitelist/hosts/host[@id='" + encodeURIComponent(from) + "']", this.getWhitelist())[0];
        if (existingHost) {
            let hosts = this._queryXML("/whitelist/hosts[@id='user-whitelist']", this.getWhitelist())[0];
            hosts.removeChild(existingHost);
        }
    },
    getWhitelistValue: function MCCore_getWhitelistValue(from) {
        from = this._normalizeHostnameHelper(from);
        let value = from && this._queryXML("string(/whitelist/hosts/host[@id='" + encodeURIComponent(from) + "']/@value)", this.getWhitelist());
        return parseInt(value, 10) || 0;
    },
    _saveXMLToFile: function MCCore__saveXMLToFile(xmldoc, file) {
        let serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
        let foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 2 | 8 | 32, parseInt("0644", 8), 0);
        serializer.serializeToStream(xmldoc, foStream, "");
        foStream.close();
    },
    _queryXML: function MCCore__queryXML(query, xml) {
        return this.api.XMLUtils.queryXMLDoc(query, xml);
    }
};
