"use strict";
var YaSearchPrefs = {
    setBrowserHomepage: function YaSearchPrefs_setBrowserHomepage() {
        ProductBranding.setBrowserHomePage();
    },
    _inited: false,
    onPaneLoad: function YaSearchPrefs_onPaneLoad() {
        if (this._inited) {
            return;
        }
        this._inited = true;
        let homepageProtectionBox = document.getElementById("homepage-protection-box");
        if (homepageProtectionBox) {
            homepageProtectionBox.hidden = !Preferences.barCore.application.defender;
        }
        let homepageButton = document.getElementById("homepage-button");
        if (homepageButton && ProductBranding.homepageName) {
            let homepageButtonLabel = Preferences.getString("MakeHomepageLabel", [ProductBranding.homepageName]);
            homepageButton.setAttribute("label", homepageButtonLabel);
            homepageButton.hidden = false;
        }
        function getYandexFeatureState(aFeatureName) {
            return ProductBranding.getYandexFeatureState(aFeatureName);
        }
        let yaFeatures = { "homepage-protection": "homepage-protection-box" };
        for (let [
                    featureName,
                    elementId
                ] in Iterator(yaFeatures)) {
            if (!getYandexFeatureState(featureName)) {
                let el = document.getElementById(elementId);
                if (el) {
                    el.hidden = true;
                }
            }
        }
    },
    onDialogAccept: function YaSearchPrefs_onDialogAccept() {
        if (!this._inited) {
            return;
        }
    },
    onDialogUnload: function YaSearchPrefs_onDialogUnload() {
    }
};
