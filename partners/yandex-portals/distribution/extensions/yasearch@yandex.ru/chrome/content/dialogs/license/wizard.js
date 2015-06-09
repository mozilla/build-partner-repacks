"use strict";
let [
    osName,
    setupData
] = window.arguments[0].wrappedJSObject;
const LicenseWizard = {
    onLoad: function LicenseWizard_onLoad() {
        let homePageCheckbox = document.getElementById("default-homepage");
        homePageCheckbox.checked = setupData.HomePage.checked;
        homePageCheckbox.setAttribute("label", setupData.HomePage.text);
        homePageCheckbox.hidden = !setupData.HomePage.display;
        let defaultSearchCheckbox = document.getElementById("default-search");
        defaultSearchCheckbox.hidden = !setupData.DefaultSearch.display;
        defaultSearchCheckbox.checked = setupData.DefaultSearch.checked;
        defaultSearchCheckbox.setAttribute("label", setupData.DefaultSearch.text);
        let usageStatCheckbox = document.getElementById("usage-stat");
        usageStatCheckbox.hidden = !setupData.UsageStat.display;
        usageStatCheckbox.checked = setupData.UsageStat.checked;
        usageStatCheckbox.setAttribute("label", setupData.UsageStat.text);
        document.getElementById("options-groupbox").hidden = homePageCheckbox.hidden && defaultSearchCheckbox.hidden && usageStatCheckbox.hidden;
        document.getElementById("apply-button").focus();
    },
    onAccept: function LicenseWizard_onAccept() {
        try {
            setupData.License.checked = true;
            setupData.HomePage.checked = document.getElementById("default-homepage").checked;
            setupData.DefaultSearch.checked = document.getElementById("default-search").checked;
            setupData.UsageStat.checked = document.getElementById("usage-stat").checked;
        } catch (e) {
        }
        return true;
    },
    onCancel: function LicenseWizard_onCancel() {
        try {
            let dialogDeck = document.getElementById("dialog-deck");
            if (dialogDeck.selectedIndex == 1) {
                dialogDeck.selectedIndex = 0;
                if (dialogDeck.selectedIndex === 0) {
                    return false;
                }
            }
            setupData.License.checked = false;
            [
                "HomePage",
                "DefaultSearch",
                "UsageStat"
            ].forEach(function (dataType) {
                if (setupData[dataType].display) {
                    setupData[dataType].checked = false;
                }
            });
        } catch (e) {
        }
        return true;
    },
    showLicense: function LicenseWizard_showLicense() {
        document.getElementById("license-frame-object").setAttribute("src", setupData.License.url);
        document.getElementById("dialog-deck").selectedIndex = 1;
    }
};
window.addEventListener("load", function loadEventListener(aLoadEvent) {
    aLoadEvent.currentTarget.removeEventListener("load", loadEventListener, false);
    LicenseWizard.onLoad();
}, false);
let shadow = false;
let transparent = true;
if (osName == "windows") {
    shadow = true;
} else if (osName == "linux") {
    transparent = false;
}
document.documentElement.setAttribute("style", "background: none !important");
document.documentElement.setAttribute("ex-shadow", shadow);
document.documentElement.setAttribute("ex-transparent", transparent);
