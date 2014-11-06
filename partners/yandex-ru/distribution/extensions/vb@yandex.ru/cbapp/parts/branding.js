"use strict";
const EXPORTED_SYMBOLS = ["branding"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const PKG_UPD_TOPIC = "package updated";
const branding = {
    init: function PartnerPack_init(application) {
        this._logger = application.getLogger("Branding");
        this._application = application;
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        patterns.NotificationSource.objectMixIn(this);
        this._loadPackage();
        try {
            if (this._application.addonManager.info.addonVersionChanged)
                this._checkBPAndReplaceIfSame();
        } catch (e) {
            this._logger.error("Failed replacing the same BP with internal version. \n" + strutils.formatError(e));
            this._logger.debug(e.stack);
        }
        this._trySetAddonDescription();
    },
    updateFrom: function Branding_updateFrom(newPkgDir, newProductInfo, responseDate) {
        this._logger.config(strutils.formatString("Preparing to update to a new branding package. BrandID: '%1', date: %2", [
            newProductInfo.BrandID,
            responseDate
        ]));
        try {
            fileutils.safeReplace(this._currPackageDir, newPkgDir);
        } catch (e) {
            this._logger.error("Could not replace old directory with a new one. \n" + strutils.formatError(e));
            return;
        } finally {
            fileutils.removeFileSafe(newPkgDir);
        }
        this._updatePackage(newProductInfo, responseDate);
    },
    finalize: function PartnerPack_finalize() {
        if (this._package) {
            this._package.finalize();
            this._package = null;
        }
        this._application = null;
    },
    get brandPackage() {
        return this._package;
    },
    get brandID() {
        if (!this._productInfo)
            return null;
        return String(this.productInfo.BrandID);
    },
    get barless() {
        if (this._barless === null) {
            try {
                this._barless = strutils.xmlAttrToBool(this.productInfo.Barless && this.productInfo.Barless.enabled);
            } catch (e) {
                this._barless = false;
            }
        }
        return this._barless;
    },
    get brandTemplateMap() {
        return this._brandTemplateMap;
    },
    getYandexFeatureState: new function () {
        let cache = Object.create(null);
        return function PartnerPack_getYandexFeatureState(aFeatureName) {
            if (aFeatureName in cache)
                return cache[aFeatureName];
            return cache[aFeatureName] = strutils.xmlAttrToBool(this.productInfo.YandexFeatures[aFeatureName]);
        };
    }(),
    expandBrandTemplatesEscape: function PartnerPack_expandBrandTemplatesEscape(aTemplateStr, aParams) {
        return this.expandBrandTemplates(aTemplateStr, aParams, true);
    },
    expandBrandTemplates: function PartnerPack_expandBrandTemplates(aTemplateString, aParams, aEncodeParams) {
        let result = "" + aTemplateString;
        if (!/\{/.test(result))
            return result;
        function encode(str) {
            return aEncodeParams ? encodeURIComponent(str) : str;
        }
        let self = this;
        function replacer(aMatch) {
            let match = aMatch.replace(/[{}]/g, "");
            if (aParams && aParams.hasOwnProperty(match))
                return encode(aParams[match]);
            if (match == "brandID")
                return encode(self.productInfo.BrandID);
            if (/clid(.+)/.test(match)) {
                let clidData = self._vendorData[match];
                if (!(clidData && clidData.clidAndVid))
                    return "";
                return encode(clidData.clidAndVid);
            }
            const namesRe = /^(product[12]|vendor)\.(\w+)$/;
            let matchNames = match.match(namesRe);
            if (matchNames) {
                try {
                    switch (matchNames[1]) {
                    case "product1":
                        return encode(self.productInfo.ProductName1[matchNames[2]] || "");
                    case "product2":
                        return encode(self.productInfo.ProductName2[matchNames[2]] || "");
                    case "vendor":
                        return encode(self.productInfo.VendorName[matchNames[2]] || "");
                    }
                } catch (e) {
                    self._logger.error("Could not expand branding templates. \n" + strutils.formatError(e));
                    return "";
                }
            }
            return aMatch;
        }
        return result.replace(/\{[^\{\}]+\}/g, replacer);
    },
    get productInfo() {
        if (this._productInfo === undefined) {
            try {
                this._productInfo = this._getBPProductInfo(this._package);
            } catch (e) {
                this._logger.error("Could not read file '/about/product.xml' \n" + strutils.formatError(e));
                this._productInfo = null;
            }
        }
        return this._productInfo;
    },
    get browserConf() {
        if (this._browserConf === undefined) {
            try {
                this._browserConf = xmlutils.dom2jsObj(this._package.getXMLDocument("/browser/browserconf.xml"));
            } catch (e) {
                this._logger.error("Could not read file '/browser/browserconf.xml'");
                this._browserConf = null;
            }
        }
        return this._browserConf;
    },
    _application: null,
    _logger: null,
    _package: null,
    _productInfo: undefined,
    _browserConf: undefined,
    _updateUrl: undefined,
    _barless: null,
    _consts: {
        GCASES: [
            "nom",
            "gen",
            "dat",
            "acc",
            "ins",
            "pre",
            "loc",
            "ex1",
            "ex2"
        ],
        BRAND_TS_PREF_NAME: "branding.lastupdate",
        PKG_DIR_NAME: "branding"
    },
    get _brandingDate() {
        let brandTimestamp = Number(this._application.preferences.get(this._consts.BRAND_TS_PREF_NAME, undefined));
        let brandingDate = brandTimestamp ? new Date(brandTimestamp * 1000) : this._application.core.buildDate;
        if (!brandTimestamp) {
            let seconds = parseInt(brandingDate.getTime() / 1000, 10);
            this._application.preferences.overwrite(this._consts.BRAND_TS_PREF_NAME, seconds);
        }
        return brandingDate;
    },
    set _brandingDate(newDate) {
        let seconds = parseInt(newDate.getTime() / 1000, 10);
        this._application.preferences.overwrite(this._consts.BRAND_TS_PREF_NAME, seconds);
    },
    _beforeBrandReplacement: function PartnerPack__beforeBrandReplacement() {
        let btm = this._brandTemplateMap;
        let bc = this.browserConf;
    },
    _afterBrandReplacement: function PartnerPack__afterBrandReplacement() {
        let [
            _,
            newProductInfo
        ] = this._validateBrandPkg(this._currPackageDir, true);
        this._updatePackage(newProductInfo, new Date(), this._brandTemplateMap, this.browserConf);
    },
    get _currPackageDir() {
        let currPkgDir = this._application.directories.vendorDir;
        currPkgDir.append(this._consts.PKG_DIR_NAME);
        return currPkgDir;
    },
    _loadPackage: function PartnerPack__loadPackage() {
        let package_;
        let productInfo;
        try {
            let currPkgDir = this._currPackageDir;
            if (!currPkgDir.exists())
                this._application.addonFS.copySource("$content/branding", this._application.directories.vendorDir, this._consts.PKG_DIR_NAME);
            [
                package_,
                productInfo
            ] = this._validateBrandPkg(currPkgDir);
        } catch (e) {
            this._logger.error("Existing branding package is invalid! Will try internal version. \n" + strutils.formatError(e));
            this._logger.debug(e.stack);
            fileutils.removeFileSafe(this._currPackageDir);
            this._application.addonFS.copySource("$content/branding", this._application.directories.vendorDir, this._consts.PKG_DIR_NAME);
            [
                package_,
                productInfo
            ] = this._validateBrandPkg(this._currPackageDir);
            this._brandingDate = this._application.core.buildDate;
        }
        this._package = package_;
        this._productInfo = productInfo;
    },
    _checkBPAndReplaceIfSame: function PartnerPack__checkBPAndReplaceIfSame() {
        let currentPackage = this._package;
        let currPkgDir = currentPackage.rootDirectory;
        let currentProductInfo = this._productInfo;
        let internalPkgDir = this._application.directories.vendorDir;
        internalPkgDir.append("tmp");
        if (internalPkgDir.exists())
            internalPkgDir.remove(true);
        this._application.addonFS.copySource("$content/branding", this._application.directories.vendorDir, "tmp");
        let internalProductInfo;
        let internalTmpPkg = new this._application.FilePackage(internalPkgDir);
        try {
            internalProductInfo = this._getBPProductInfo(internalTmpPkg);
            this._validateProductInfo(internalProductInfo);
        } finally {
            internalTmpPkg.finalize();
            if (!internalProductInfo)
                fileutils.removeFileSafe(internalPkgDir);
        }
        let canUpdatePackage = true;
        if (this._application.core.CONFIG.APP.TYPE === "barff") {
            let sameAddresses = String(currentProductInfo.BrandingURL) == String(internalProductInfo.BrandingURL);
            if (sameAddresses)
                this._logger.debug("Package addresses are the same: " + currentProductInfo.BrandingURL);
            else
                this._logger.debug(strutils.formatString("Package addresses are: %1, %2", [
                    currentProductInfo.BrandingURL,
                    internalProductInfo.BrandingURL
                ]));
            let currentIsBarless = strutils.xmlAttrToBool(currentProductInfo.Barless && currentProductInfo.Barless.enabled);
            let internalIsBarless = strutils.xmlAttrToBool(internalProductInfo.Barless && internalProductInfo.Barless.enabled);
            let viewModeChanged = currentIsBarless != internalIsBarless;
            this._logger.debug(strutils.formatString("Barless modes are: %1, %2", [
                currentIsBarless,
                internalIsBarless
            ]));
            canUpdatePackage = sameAddresses || viewModeChanged;
        }
        if (canUpdatePackage) {
            this._logger.debug("Replacing existing BP with internal one");
            this.updateFrom(internalPkgDir, internalProductInfo, this._application.core.buildDate);
        } else {
            fileutils.removeFileSafe(internalPkgDir);
        }
    },
    _trySetAddonDescription: function PartnerPack__trySetAddonDescription() {
        let productInfo = this.productInfo;
        let prefs = this._application.preferences;
        try {
            prefs.set("name", productInfo.ProductName1.nom);
            prefs.set("description", productInfo.ProductDescription.fx);
            prefs.set("creator", productInfo.VendorName.nom);
            let homepageURL = productInfo.HomePage && productInfo.HomePage.toString() || "";
            prefs.set("homepageURL", homepageURL);
        } catch (e) {
            this._logger.error("Could not set branded addon description. " + strutils.formatError(e));
        }
    },
    _validateBrandPkg: function PartnerPack__validateBrandPkg(packageDir, autoFinalizePkg) {
        let package_ = new this._application.FilePackage(packageDir);
        try {
            let productInfo = this._getBPProductInfo(package_);
            this._validateProductInfo(productInfo);
            return [
                package_,
                productInfo
            ];
        } finally {
            if (autoFinalizePkg) {
                try {
                    package_.finalize();
                } catch (e) {
                    this._logger.error("Error finalizing temporary package instance. \n" + strutils.formatError(e));
                }
                package_ = null;
            }
        }
    },
    _validateProductInfo: function Branding__validateProductInfo(productInfo) {
        this._logger.debug("Validating product info...");
        if (!productInfo.BrandID || productInfo.BrandID == "")
            throw new Error("No brand ID");
        if (!productInfo.ProductName1.nom)
            throw new Error("No product name");
        try {
            let updateURL = productInfo.BrandingURL;
            netutils.newURI(updateURL, null, null);
        } catch (e) {
            throw new Error("Branding update URL unavailable. \n" + strutils.formatError(e));
        }
    },
    _updatePackage: function PartnerPack__updatePackage(newProductInfo, responseDate) {
        this._package.finalize();
        this._browserConf = undefined;
        this._brandTemplateMap = undefined;
        this._package = new this._application.FilePackage(this._currPackageDir);
        this._productInfo = newProductInfo;
        this._brandingDate = responseDate;
        this._application.preferences.set(this._consts.BRAND_TS_PREF_NAME, Math.round(responseDate.getTime() / 1000));
        this._logger.config("Branding replaced. Notifying listeners...");
        this._notifyListeners(PKG_UPD_TOPIC, this._package);
    },
    get _vendorData() {
        delete this._vendorData;
        return this._vendorData = sysutils.copyObj(this._application.clids.vendorData);
    },
    get _brandTemplateMap() {
        if (!this.__brandMap)
            this.__brandMap = this._makeBrandTemplateMap(this._package);
        return this.__brandMap;
    },
    set _brandTemplateMap(val) {
        this.__brandMap = val;
    },
    _makeBrandTemplateMap: function PartnerPack__makeBrandTemplateMap(brandPackage) {
        let productInfo = this._getBPProductInfo(brandPackage || this._package);
        let result = Object.create(null);
        result.brandID = productInfo.BrandID;
        for (let [
                    _,
                    gCase
                ] in Iterator(this._consts.GCASES)) {
            result["product1." + gCase] = productInfo.ProductName1[gCase] || "";
            result["product2." + gCase] = productInfo.ProductName2[gCase] || "";
            result["vendor." + gCase] = productInfo.VendorName[gCase] || "";
        }
        for (let [
                    clidName,
                    clidData
                ] in Iterator(this._vendorData))
            result[clidName] = clidData ? clidData.clidAndVid : "";
        return result;
    },
    _getBPProductInfo: function Branding__getBPProductInfo(brandPackage) {
        let productInfo = xmlutils.dom2jsObj(brandPackage.getXMLDocument("/about/product.xml"));
        if (!brandPackage.findFile("/fx/about/product.xml"))
            return productInfo;
        try {
            let fxProductInfo = xmlutils.dom2jsObj(brandPackage.getXMLDocument("/fx/about/product.xml"));
            this._application.core.Lib.sysutils.copyProperties(fxProductInfo, productInfo);
        } catch (e) {
            this._logger.error("Could not read '/fx/about/product.xml'. " + e);
        }
        return productInfo;
    },
    _getBPBrowserConf: function Branding__getBPBrowserConf(brandPackage) {
        return xmlutils.dom2jsObj(brandPackage.getXMLDocument("/browser/browserconf.xml"));
    }
};
