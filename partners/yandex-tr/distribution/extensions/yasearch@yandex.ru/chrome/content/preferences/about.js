"use strict";
const aboutDlg = {
    onDialogLoad: function About_onDialogLoad() {
        this._barCore = Cc["@yandex.ru/custombarcore;" + XB_APP_NAME].getService().wrappedJSObject;
        this._barApplication = this._barCore.application;
        this._logger = this._barApplication.getLogger("About");
        let addonVersion = this._barApplication.addonManager.addonVersion;
        let barVersionLabel = document.getElementById("bar-version").querySelector("label");
        barVersionLabel.setAttribute("value", addonVersion);
        barVersionLabel.setAttribute("tooltiptext", addonVersion + "." + this._barCore.buidRevision);
        let dateStr = this._barCore.Lib.strutils.formatDate(this._barCore.buildDate, "%D.%M.%Y");
        document.getElementById("bar-date").querySelector("span").textContent = dateStr;
        function putText(id, value) {
            document.getElementById(id).textContent = value || "";
        }
        try {
            let branding = this._barApplication.branding;
            let brandPackage = branding.brandPackage;
            document.getElementById("bar-about-logo").src = brandPackage.resolvePath("/about/vendorlogo.png");
            document.getElementById("bar-about-holder").style.backgroundImage = "url('" + brandPackage.resolvePath("/about/background-fx.png") + "')";
            putText("bar-about-title", branding.productInfo.ProductName1.nom);
            putText("bar-about-for", branding.productInfo.NoteLine.fx);
            putText("bar-about-copyright", branding.productInfo.Copyright.fx || branding.productInfo.Copyright);
            let siteLink = document.getElementById("bar-about-bar-site-link");
            if (branding.productInfo.HomePage) {
                siteLink.setAttribute("href", branding.productInfo.HomePage);
                siteLink.setAttribute("style", "visibility: visible;");
            } else {
                siteLink.setAttribute("style", "visibility: hidden;");
            }
            let licenseLink = document.getElementById("bar-license-agreement-link");
            if (branding.productInfo.LicenseURL) {
                licenseLink.setAttribute("href", branding.productInfo.LicenseURL.fx || branding.productInfo.LicenseURL);
                licenseLink.setAttribute("style", "visibility: visible;");
                let linkText = branding.productInfo.LicenseURL.text;
                if (linkText) {
                    licenseLink.textContent = linkText;
                }
            } else {
                licenseLink.setAttribute("style", "visibility: hidden;");
            }
            barVersionLabel.setAttribute("tooltiptext", addonVersion + "." + this._barCore.buidRevision + " (" + branding.brandID + ")");
        } catch (e) {
            this._logger.error("Could not fill about dialog. " + e);
        }
    },
    openLinkURL: function About_openLinkURL(aLinkElement) {
        this._barApplication.core.Lib.misc.navigateBrowser({
            url: this._templater(aLinkElement.getAttribute("href")),
            target: "new tab"
        });
        setTimeout(function () {
            document.documentElement.cancelDialog();
        }, 2);
    },
    _templater: function About_templater(aStr) {
        let res = aStr;
        let branding = this._barApplication.branding;
        if (branding.expandBrandTemplatesEscape) {
            res = branding.expandBrandTemplatesEscape(res);
        }
        return res || aStr;
    }
};
