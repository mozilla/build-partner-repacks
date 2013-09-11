"use strict";
const EXPORTED_SYMBOLS = ["installer"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
const PKG_UPD_TOPIC = "package updated";
var branding = null;
var barApp = null;
const installer = {
init: function Installer_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = barApp = application;
this._logger = application.getLogger("Installer");
this._brandPrefs = new Preferences(application.preferencesBranch + "branding.");
branding = application.branding;
(this._cachedBrandTplMap = branding.brandTemplateMap, this._cachedBrowserConf = branding.browserConf);
if (! this.checkLicenseAccepted())
throw new Error("License agreement rejected");
this._loadDefaultBrowserPreferences();
const ObserverService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
ObserverService.addObserver(this,"sessionstore-windows-restored",false);
var addonManagerInfo = barApp.addonManager.info;
if (addonManagerInfo.isFreshAddonInstall)
{
this._migrateYandexBarData();
this._application.preferences.set("general.install.time",Math.round(Date.now() / 1000));
}

if (addonManagerInfo.addonVersionChanged && ! addonManagerInfo.isFreshAddonInstall && addonManagerInfo.addonUpgraded)
{
this._onAddonUpdate();
}

this._application.branding.addListener(PKG_UPD_TOPIC,this);
AddonManager.addAddonListener(this);
if (this._application.addonManager.info.isFreshAddonInstall || this._application.preferences.get("disabled") === true)
{
if (! this.isDefaultNewTabUrl)
{
this._setAlienNewTabUrls();
}

this.setBrowserNewTabUrl();
this._application.preferences.reset("disabled");
}

if (addonManagerInfo.isFreshAddonInstall || addonManagerInfo.addonUpgraded && sysutils.versionComparator.compare(addonManagerInfo.addonLastVersion,"2") < 0)
{
if (! this.isDefaultNewTabUrl)
{
this._setAlienNewTabUrls();
}

}

}
,
finalize: function Installer_finalize(doCleanup) {
this._application.branding.removeListener(PKG_UPD_TOPIC,this);
}
,
onAddonEvent: function Installer_onAddonEvent(aEventType, aAddon, aPendingRestart) {
const ADDON_DISABLE_EVENTS = {
onUninstalling: 1,
onDisabling: 1};
const ADDON_INSTALL_EVENTS = {
onInstalling: 1,
onInstalled: 1};
if (aAddon.id == this._application.addonManager.addonId && aEventType in ADDON_DISABLE_EVENTS)
this._onAddonUninstall();
if (aAddon.id == this._application.addonManager.addonId && aEventType === "onOperationCancelled")
{
this.setBrowserNewTabUrl();
this._application.preferences.reset("disabled");
}

if (aAddon.id == "yasearch@yandex.ru" && aEventType in ADDON_INSTALL_EVENTS)
{
this._logger.config("Yandex.Bar installed. Disabling its visual bookmarks...");
Preferences.set("yasearch.general.ftab.enabled",false);
}

}
,
observe: function Installer_observe(aSubject, aTopic, aData) {
switch (aTopic) {
case "sessionstore-windows-restored":
let addonManagerInfo = this._application.addonManager.info;
if (addonManagerInfo.isFreshAddonInstall)
{
this.closeTabs("bar:tabs");
new sysutils.Timer(this.closeTabs.bind(this,"bar:tabs"), 1000);
}

this._showWelcomePageOnStartup();
Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).removeObserver(this,aTopic,false);
break;
case PKG_UPD_TOPIC:
this._onBrandPkgUpdated();
break;
}

}
,
closeTabs: function Installer_closeTabs(url) {
if (! url)
return;
misc.getBrowserWindows().forEach(function (chromeWin) {
var tabBrowser = chromeWin.gBrowser;
var tabs = tabBrowser && tabBrowser.tabContainer && Array.slice(tabBrowser.tabContainer.childNodes);
if (! Array.isArray(tabs))
return;
tabs.forEach(function (tab) {
try {
if (tab.linkedBrowser.currentURI.spec === url)
tabBrowser.removeTab(tab);
}
catch (e) {

}

}
);
}
);
}
,
get anonymousStatistic() {
var isAMOPack = this._application.preferences.get("amo",false);
var isAMOStatPrefSet = this._application.preferences.get("amo.statChosen",false);
if (! isAMOPack || isAMOStatPrefSet)
return false;
var sendStatPrefSet = this._application.preferences.get("stat.usage.send");
if (sendStatPrefSet)
{
this._application.preferences.set("amo.statChosen",true);
return false;
}

var installTime = this._application.preferences.get("general.install.time") * 1000;
var threeDays = 3 * 60 * 60 * 24 * 1000;
if (Date.now() < installTime + threeDays)
return false;
return true;
}
,
set anonymousStatistic(aEnable) {
this._application.barnavig.forceRequest({
statsend: aEnable ? 1 : 0});
this._application.preferences.set("stat.usage.send",aEnable);
this._application.preferences.set("amo.statChosen",true);
}
,
_onBrandPkgUpdated: function Installer__onBrandPkgUpdated() {
try {
this._logger.info("Applying branding package settings for HP, QS, etc...");
this._applyPartnerSettings();
}
catch (e) {
this._logger.error("Could not apply partner package settings. \n" + strutils.formatError(e));
this._logger.debug(e.stack);
}
 finally {
this._cachedBrandTplMap = branding.brandTemplateMap;
this._cachedBrowserConf = branding.browserConf;
}

}
,
_prefBranch2: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch2),
_getLocalizedPref: function Installer__getLocalizedPref(aPrefName, aDefault) {
try {
return this._prefBranch2.getComplexValue(aPrefName,Ci.nsIPrefLocalizedString).data;
}
catch (ex) {

}

return aDefault;
}
,
_brandPrefs: null,
checkLicenseAccepted: function Installer_checkLicenseAccepted() {
if (barApp.addonManager.isAddonUninstalling)
return false;
const acceptedPrefName = barApp.preferencesBranch + "license.accepted";
var needRestartBrowser = false;
if (! Preferences.get(acceptedPrefName,false))
{
if (! this.setupData.hiddenWizard)
{
try {
let accepted = this._showLicenseWindow();
if (! accepted)
{
this._uninstallAddonOnLicenseRefuse();
return false;
}

}
catch (e) {
Cu.reportError(e);
}

}

Preferences.set(acceptedPrefName,true);
if (Preferences.get(acceptedPrefName,false) === true)
needRestartBrowser = true;
try {
let prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
prefService.savePrefFile(null);
}
catch (e) {
needRestartBrowser = false;
this._logger.error("Could not write prefs file. " + e);
}

this._onAddonInstall();
}

try {
this._setActiveQS();
}
catch (e) {
this._logger.error("Could not set active QS engine. " + e);
this._logger.debug(e.stack);
}

if (needRestartBrowser)
{
this._logger.debug("Restart browser.");
const appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
appStartup.quit(appStartup.eForceQuit | appStartup.eRestart);
return false;
}

new sysutils.Timer(function () {
var selectedEngineName = this._getLocalizedPref("browser.search.selectedEngine",null);
var defaultEngineName = this._getLocalizedPref("browser.search.defaultenginename",null);
if ((! selectedEngineName || /^chrome:/.test(selectedEngineName)) && defaultEngineName)
Preferences.set("browser.search.selectedEngine",defaultEngineName);
}
.bind(this), 5 * 1000);
return true;
}
,
_setActiveQS: function Installer__setActiveQS() {
const hackPrefName = "qsEngineNameForSelect";
var qsNameToSet = this._brandPrefs.get(hackPrefName,null);
if (qsNameToSet)
{
this._brandPrefs.reset(hackPrefName);
Preferences.set("browser.search.selectedEngine",qsNameToSet);
}

}
,
_setupData: null,
set setupData(aValue) {
this._setupData = null;
}
,
get setupData() {
if (! this._setupData)
{
let data = {
hiddenWizard: true,
License: {
display: false,
checked: false,
text: ""},
HomePage: {
display: false,
checked: false,
text: ""},
DefaultSearch: {
display: false,
checked: false,
text: ""},
UsageStat: {
display: false,
checked: false,
multipack: false,
text: ""}};
let setupElement;
try {
let productXML = branding.brandPackage.getXMLDocument("/about/product.xml");
setupElement = productXML.querySelector("Product > Setup");
}
catch (e) {
Cu.reportError(e);
}

if (setupElement)
{
["License", "HomePage", "DefaultSearch", "UsageStat"].forEach(function (aElementName) {
var el = setupElement.querySelector(aElementName);
if (el)
{
for(let [prop, val] in Iterator(data[aElementName])) {
let attrValue = el.getAttribute(prop);
if (typeof val == "boolean")
attrValue = attrValue == "true";
data[aElementName][prop] = attrValue;
}

}

if (data.hiddenWizard && data[aElementName].display)
data.hiddenWizard = false;
}
);
}

data.License.url = branding.brandPackage.resolvePath("/license/fx/license.xhtml");
data.HomePage.title = "";
data.HomePage.url = "";
data.HomePage.force = false;
try {
let configXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
let configHPElement = configXML.querySelector("Browser > HomePage");
if (configHPElement)
{
let homePageURL = configHPElement.textContent;
data.HomePage.url = homePageURL && branding.expandBrandTemplatesEscape(homePageURL);
data.HomePage.title = configHPElement.getAttribute("title") || "";
data.HomePage.force = configHPElement.getAttribute("force") === "true";
}

}
catch (e) {
this._logger.error(e);
this._logger.debug(e.stack);
}

let stringBundle = new barApp.appStrings.StringBundle("dialogs/license/wizard.properties");
if (! data.HomePage.text && data.HomePage.display)
{
data.HomePage.text = stringBundle.get("homepage.label");
if (branding.getYandexFeatureState("homepage-protection"))
data.HomePage.text += " " + stringBundle.get("homepageProtect.label");
}

if (! data.DefaultSearch.text && data.DefaultSearch.display)
{
data.DefaultSearch.text = stringBundle.get("defaultsearch.label");
}

if (! data.UsageStat.text && data.UsageStat.display)
{
data.UsageStat.text = stringBundle.get("confirmSendUsageStat.label");
}

data.productName = branding.productInfo.ProductName1.nom;
this._setupData = data;
}

return this._setupData;
}
,
get isDefaultNewTabUrl() {
var ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
var values = [ftabUrl, "about:blank", "about:newtab"];
var pref = Preferences.get("browser.newtab.url","about:blank");
if (~ values.indexOf(pref))
return true;
return false;
}
,
getBrowserHomePage: function Installer_getBrowserHomePage() {
const browserHPPrefName = "browser.startup.homepage";
var currentHP = this._getLocalizedPref(browserHPPrefName,null);
if (! currentHP)
{
const SBS = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
let configBundle = SBS.createBundle("chrome://branding/locale/browserconfig.properties");
currentHP = configBundle.GetStringFromName(browserHPPrefName);
}

return currentHP;
}
,
setBrowserHomePage: function Installer_setBrowserHomePage(aHomePageURL) {
var url = arguments.length ? aHomePageURL : this.setupData.HomePage.url;
this._setBrowserHomePage(url,true);
}
,
isYandexURL: function Installer_isYandexURL(aURL) {
return ! ! (aURL && (/^(https?:\/\/)?(www\.)?yandex\.(ru|ua|kz|by|com|com\.tr)(\/|$)/i.test(aURL) || /^(https?:\/\/)?ya\.ru(\/|$)/i.test(aURL)));
}
,
isOverridableURL: function Installer_isOverridableURL(aURL) {
return ! (aURL && (this.isYandexURL(aURL) || /^(https?:\/\/)?((www|search)\.)?seznam\.cz(\/|$)/i.test(aURL) || /^(https?:\/\/)?(www\.)?bozzon\.com(\/|$)/i.test(aURL)));
}
,
isCurrentQSOverridable: function Installer_isCurrentQSOverridable() {
var selectedEngineName = this._getLocalizedPref("browser.search.selectedEngine",null) || this._getLocalizedPref("browser.search.defaultenginename",null);
return this.isQSOverridable(selectedEngineName);
}
,
isQSOverridable: function Installer_isQSOverridable(aQSName) {
return ["/=45:A", "Yandex", "Seznam", "Bozzon"].indexOf(aQSName) == - 1;
}
,
_setAlienNewTabUrls: function Installer__setAlienNewTabUrls() {
var pref = Preferences.get("browser.newtab.url");
this._application.preferences.set("browser.alien.newtab.url",pref);
}
,
_showWelcomePageOnStartup: function Installer__showWelcomePageOnStartup() {
var needShow = true;
var showPageUrl = "";
var focusUrlBar = false;
var wpPrefs = new Preferences("extensions." + barApp.addonManager.addonId + ".welcomepage.");
var wpVersionIntroduced = wpPrefs.get("version.introduced","0");
if (wpVersionIntroduced != "0")
return;
new sysutils.Timer(function Installer_showWelcomePageOnStartup_timed() {
barApp.navigate({
url: barApp.protocolSupport.url,
target: "new tab"});
wpPrefs.set("version.introduced",barApp.addonManager.addonVersion);
misc.getTopBrowserWindow().focusAndSelectUrlBar();
}
, 500);
}
,
_onAddonInstall: function Installer__onAddonInstall() {
var setupData = this.setupData;
if (setupData.HomePage.checked)
this._setBrowserHomePage(setupData.HomePage.url,false,true);
if (setupData.DefaultSearch.checked)
Preferences.reset("keyword.URL");
this._writeQuickSearches(setupData.DefaultSearch.checked);
if (! this._application.preferences.has("stat.usage.send"))
{
let usageStatChecked = setupData.UsageStat.checked;
if (! usageStatChecked && setupData.hiddenWizard && this._application.core.CONFIG.APP.TYPE == "vbff")
{
usageStatChecked = Preferences.get("extensions.yasearch@yandex.ru.stat.usage.send",false);
}

this._application.preferences.set("stat.usage.send",usageStatChecked);
}

if (setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == "barff")
{
let vbPrefName = "extensions.vb@yandex.ru.stat.usage.send";
if (! Preferences.has(vbPrefName))
Preferences.set(vbPrefName,setupData.UsageStat.checked);
}

}
,
_onAddonUpdate: function Installer__onAddonUpdate() {

}
,
_onAddonUninstall: function Installer__onAddonUninstall() {
const ftabAddress = this._application.protocolSupport.url;
const BROWSER_HOMEPAGE_PREFNAME = "browser.startup.homepage";
this.closeTabs(ftabAddress);
var ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
if (Preferences.get("browser.newtab.url") === ftabUrl)
Preferences.reset("browser.newtab.url");
Preferences.reset("extensions.tabmix.newtab.url");
this._application.preferences.set("disabled",true);
if (Preferences.get(BROWSER_HOMEPAGE_PREFNAME) === ftabAddress)
Preferences.reset(BROWSER_HOMEPAGE_PREFNAME);
}
,
_cachedBrandTplMap: null,
_cachedBrowserConf: null,
_applyPartnerSettings: function Installer__applyPartnerSettings() {
var prevBrandMap = this._cachedBrandTplMap;
var prevBrowserConf = this._cachedBrowserConf;
this.setupData = null;
var setupData = this.setupData;
this._logger.debug("prevBrowserConf " + sysutils.dump(prevBrowserConf,5));
var prevBrandHP = branding.expandBrandTemplatesEscape(prevBrowserConf.HomePage,prevBrandMap);
this._logger.debug("prevBrandHP " + prevBrandHP);
this._setBrowserHomePage(setupData.HomePage.url,false,setupData.HomePage.force,prevBrandHP);
var prevDefaultQSName;
try {
let osDescription = prevBrowserConf.QuickSearch && prevBrowserConf.QuickSearch.OpenSearchDescription;
if (osDescription)
prevDefaultQSName = branding.expandBrandTemplates(osDescription.ShortName,prevBrandMap);
}
catch (e) {
this._logger.error("Could not get previous QS name. " + e);
}

this._writeQuickSearches(null,prevDefaultQSName);
}
,
_setBrowserHomePage: function Installer__setBrowserHomePage(aHomePageURL, aForce, aBrandForce, aPrevBrandHP) {
if (! aHomePageURL)
return;
var currentHP = this.getBrowserHomePage();
if (! (aForce || aBrandForce) && (! aPrevBrandHP || aPrevBrandHP !== currentHP))
return;
var setCurrentHP = ! aForce && ! this.isOverridableURL(currentHP);
var homePageURL = setCurrentHP ? currentHP : aHomePageURL;
Preferences.set("browser.startup.homepage",homePageURL);
if (Preferences.get("browser.startup.page",1) === 0)
Preferences.set("browser.startup.page",1);
Preferences.set(this._application.preferencesBranch + "defender.homepage.protected",homePageURL);
this._logger.debug("Changed browser HP from '" + currentHP + "' to '" + homePageURL + "'");
}
,
_getDataForDistribution: function Installer__getDataForDistribution() {
var homePageURL = this.setupData.HomePage.url;
var currentHomePageURL = this.getBrowserHomePage();
var homePageEqualDefault = currentHomePageURL == homePageURL || ! this.isOverridableURL(currentHomePageURL) && ! this.isOverridableURL(homePageURL);
var quickSearchers = this._getQuickSearchers();
var firstQSShortName = quickSearchers[0] && quickSearchers[0].shortName;
var defaultEngineName = this._getLocalizedPref("browser.search.defaultenginename",null);
var quickSearchEqualDefault = ! ! (defaultEngineName && (defaultEngineName == firstQSShortName || ! this.isQSOverridable(defaultEngineName) && ! this.isQSOverridable(firstQSShortName)));
return {
isHomepageChecked: false,
isDefaultHomepage: homePageEqualDefault,
HP: {
url: homePageURL},
isSearchChecked: false,
isDefaultQS: quickSearchEqualDefault,
QS: quickSearchers};
}
,
_getQuickSearchers: function Installer__getQuickSearchers() {
var qsList = [];
var quickSearches;
var configXML;
try {
configXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
quickSearches = configXML.querySelectorAll("Browser > QuickSearch > OpenSearchDescription");
}
catch (e) {
Cu.reportError(e);
return qsList;
}

if (! quickSearches || ! quickSearches.length)
return qsList;
const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm",{
}).DataURI;
const YB_NS = "http://bar.yandex.ru/";
for (let i = 0, len = quickSearches.length;i < len;i++) {
let qs = quickSearches[i];
let uniqName = qs.getAttributeNS(YB_NS,"uniqName");
if (! uniqName)
continue;
let shortName = qs.querySelector("ShortName");
shortName = shortName && shortName.textContent || "";
if (! shortName)
continue;
let osUrls = qs.querySelectorAll("Url");
for (let j = 0, len = osUrls.length;j < len;j++) {
let url = osUrls[j];
let templateAttr = url.getAttribute("template");
if (templateAttr)
url.setAttribute("template",branding.expandBrandTemplatesEscape(templateAttr));
}

let searchURL = "";
let searchURLElement = qs.querySelector("Url:not([rel])[type='text/html']");
if (searchURLElement && searchURLElement.hasAttribute("template"))
searchURL = searchURLElement.getAttribute("template");
let suggestURL = "";
let suggestURLElement = qs.querySelector("Url[rel='suggestions'][type='application/json']");
if (suggestURLElement && suggestURLElement.hasAttribute("template"))
suggestURL = suggestURLElement.getAttribute("template");
let inputEncoding = qs.querySelector("InputEncoding");
inputEncoding = inputEncoding && inputEncoding.textContent || "UTF-8";
let imageURL;
let image = qs.querySelector("Image");
if (image)
{
let imageFile;
let imagePath = image.textContent;
imageURL = imagePath;
if (imagePath && (imageFile = branding.brandPackage.findFile(imagePath)))
{
image.textContent = DataURI.fromFile(imageFile);
imageURL = image.textContent;
}

}

let qsObject = {
uniqName: uniqName,
isDefault: i == 0,
shortName: shortName,
image: imageURL,
searchURL: searchURL,
suggestURL: suggestURL,
inputEncoding: inputEncoding};
qsList.push(qsObject);
}

return qsList;
}
,
_writeQuickSearches: function Installer__writeQuickSearches(forceSetDefault, prevDefaultQSName) {
var searchPluginsDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);
searchPluginsDir.append("searchplugins");
const QS_FILENAME_PREFIX = "yqs-" + this._application.core.CONFIG.APP.TYPE + "-";
var installedQSNames = {
__proto__: null};
if (searchPluginsDir.exists() && searchPluginsDir.isDirectory())
{
let searchPluginsDirEntries = searchPluginsDir.directoryEntries;
while (searchPluginsDirEntries.hasMoreElements()) {
let qsFile = searchPluginsDirEntries.getNext().QueryInterface(Ci.nsIFile);
if (! qsFile.isFile())
continue;
let name = qsFile.leafName;
if (name.indexOf(QS_FILENAME_PREFIX) == 0 || name.indexOf("ybqs-") == 0 && this._application.core.CONFIG.APP.TYPE == "barff")
{
fileutils.removeFileSafe(qsFile);
continue;
}

let uniqName = /^(?:yqs\-[^\-]+|ybqs)\-(.+)\.xml$/.exec(name);
if (uniqName && uniqName[1])
installedQSNames[uniqName[1]] = true;
}

}

var quickSearches;
var configXML;
try {
configXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
quickSearches = configXML.querySelectorAll("Browser > QuickSearch > OpenSearchDescription");
}
catch (e) {
Cu.reportError(e);
return;
}

if (! quickSearches || ! quickSearches.length)
return;
fileutils.forceDirectories(searchPluginsDir);
const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm",{
}).DataURI;
const YB_NS = "http://bar.yandex.ru/";
for (let i = 0, len = quickSearches.length;i < len;i++) {
let qs = quickSearches[i];
let uniqName = qs.getAttributeNS(YB_NS,"uniqName");
if (! uniqName)
continue;
if (i == 0 && forceSetDefault !== false && this.isCurrentQSOverridable())
{
let shortName = qs.querySelector("ShortName");
shortName = shortName && shortName.textContent || "";
let browserDefaultEngineName = this._getLocalizedPref("browser.search.defaultenginename","");
if (forceSetDefault || shortName != prevDefaultQSName && prevDefaultQSName === browserDefaultEngineName)
{
if (forceSetDefault)
Preferences.set("browser.search.selectedEngine",shortName); else
this._brandPrefs.set("qsEngineNameForSelect",shortName);
this._logger.debug("Changed browser QS to '" + shortName + "'");
Preferences.set("browser.search.defaultenginename",shortName);
}

}

if (uniqName in installedQSNames)
continue;
let qsFile = searchPluginsDir.clone();
qsFile.append(QS_FILENAME_PREFIX + uniqName + ".xml");
if (uniqName == "yandex")
{
let qsFileCopy = this._copyYandexQSFromApplication(qsFile);
if (qsFileCopy)
{
if (i == 0 && forceSetDefault)
{
try {
let qsCopyXML = fileutils.xmlDocFromFile(qsFileCopy);
let shortName = qsCopyXML.querySelector("ShortName");
shortName = shortName && shortName.textContent || "";
Preferences.set("browser.search.selectedEngine",shortName);
Preferences.set("browser.search.defaultenginename",shortName);
this._logger.debug("Changed browser QS to '" + shortName + "'");
}
catch (e) {
this._logger.debug("Can not get shortName from copy of Yandex QS.\n" + e);
}

}

continue;
}

}

let osUrls = qs.querySelectorAll("Url");
for (let j = 0, len = osUrls.length;j < len;j++) {
let url = osUrls[j];
let templateAttr = url.getAttribute("template");
if (templateAttr)
url.setAttribute("template",branding.expandBrandTemplatesEscape(templateAttr));
let typeAttr = url.getAttribute("type");
if (typeAttr == "application/json")
url.setAttribute("type","application/x-suggestions+json");
}

let searchFormURLElement = qs.querySelector("Url[rel='search-form'][type='text/html']");
if (searchFormURLElement)
{
let searchFormURL = searchFormURLElement.getAttribute("template");
searchFormURLElement.parentNode.removeChild(searchFormURLElement);
let searchFormElement = configXML.createElement("SearchForm");
searchFormElement.textContent = searchFormURL;
qs.appendChild(searchFormElement);
}

let image = qs.querySelector("Image");
if (image)
{
let imageFile;
let imagePath = image.textContent;
if (imagePath && (imageFile = branding.brandPackage.findFile(imagePath)))
image.textContent = DataURI.fromFile(imageFile);
}

fileutils.writeTextFile(qsFile,xmlutils.serializeXML(qs));
}

}
,
_copyYandexQSFromApplication: function Installer__copyYandexQSFromApplication(aFile) {
var curProcDir;
try {
curProcDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("CurProcD",Ci.nsIFile);
}
catch (e) {
return false;
}

var yandexQSFile = curProcDir.clone();
["distribution", "searchplugins", "common", "yasearch.xml"].forEach(function (aPath) yandexQSFile.append(aPath));
["yandex.xml", "yandex.ru-be.xml", "yandex-tr.xml"].some(function (qsName) {
if (yandexQSFile.exists() && yandexQSFile.isFile())
return true;
yandexQSFile = curProcDir.clone();
yandexQSFile.append("searchplugins");
yandexQSFile.append(qsName);
return false;
}
);
if (yandexQSFile.exists() && yandexQSFile.isFile())
{
try {
let resultFile = aFile.parent.clone();
resultFile.append(aFile.leafName);
yandexQSFile.copyTo(aFile.parent,aFile.leafName);
return resultFile.exists() ? resultFile : false;
}
catch (e) {

}

}

return false;
}
,
_migrateYandexBarData: function Installer__migrateYandexBarData() {
this._logger.debug("Migrating Yandex.Bar data...");
var barDataDirectory = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);
barDataDirectory.append("yandex");
if (! barDataDirectory.exists() || ! barDataDirectory.isDirectory())
{
this._logger.debug("Yandex.Bar extension was not found. Nothing to do");
this._application.preferences.set("yabar.migrated",false);
return;
}

var ftabsDataDirectory = barDataDirectory.clone(), ftabsDataDirectoryName = "ftab-data", ftabsXmlDataFile = barDataDirectory.clone(), ftabsXmlDataFileName = "ftab.data.xml", storageSqliteFile = barDataDirectory.clone(), storageSqliteFileName = "yasearch-storage.sqlite";
ftabsDataDirectory.append(ftabsDataDirectoryName);
ftabsXmlDataFile.append(ftabsXmlDataFileName);
storageSqliteFile.append(storageSqliteFileName);
if (ftabsXmlDataFile.exists() && ftabsXmlDataFile.isFile())
{
ftabsXmlDataFile.copyTo(this._application.core.rootDir,ftabsXmlDataFileName);
this._application.preferences.set("yabar.migrated",true);
Preferences.set("yasearch.general.ftab.enabled",false);
}

if (ftabsDataDirectory.exists() && ftabsDataDirectory.isDirectory())
{
try {
let targetDir = this._application.core.rootDir;
targetDir.append(ftabsDataDirectoryName);
if (targetDir.exists() && targetDir.isDirectory())
{
targetDir.remove(true);
}

ftabsDataDirectory.copyTo(this._application.core.rootDir,ftabsDataDirectoryName);
}
catch (e) {
this._logger.error(e);
}

}

if (storageSqliteFile.exists() && storageSqliteFile.isFile())
{
storageSqliteFile.copyTo(this._application.core.rootDir,barApp.name + "-storage.sqlite");
}

const extensionId = this._application.addonManager.addonId;
const migratedPrefNames = ["backgroundImage", "hideInfoBlock", "showBookmarks", "backgroundAdjustment", "backgroundForceResize", "backgroundAlignVertical", "backgroundAlignHorizontal", "refreshTimeGlobal", "gridLayout"];
migratedPrefNames.forEach(function Installer__migrateYandexBarData_migrateSettings(prefName) {
var prefValue = Preferences.get("yasearch.general.ftab." + prefName);
var newPrefName = "ftabs." + prefName;
if (prefValue === undefined)
{
return;
}

if (typeof prefValue === "string" && prefValue.indexOf("yandex-profile-data") !== - 1)
{
prefValue = prefValue.replace(/yandex\-profile\-data/,"vb-profile-data");
}

if (prefName === "hideInfoBlock")
{
prefValue = ! prefValue;
newPrefName = newPrefName.replace(/hide/,"show");
}

this._logger.trace("Migrating preference yasearch.general.ftab." + prefName + "...");
this._application.preferences.set(newPrefName,prefValue);
}
,this);
["stat.firstSearch"].forEach(function Installer__migrateYandexBarData_migrateSettings(prefName) {
var prefValue = Preferences.get("extensions.yasearch@yandex.ru." + prefName);
if (prefValue === undefined)
{
return;
}

this._application.preferences.set(prefName,prefValue);
}
,this);
this._logger.debug("Yandex.Bar extension data was successfully migrated!");
}
,
_showLicenseWindow: function Installer__showLicenseWindow() {
var windowURL = "chrome://" + barApp.name + "/content/dialogs/license/wizard.xul";
var args = [sysutils.platformInfo.os.name, this.setupData];
args.wrappedJSObject = args;
try {
let setupWin = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher).openWindow(null,windowURL,null,"centerscreen,modal,resizable",args);
let accepted = this.setupData.License.checked;
if (accepted)
this._logLicenseWindowStatistics();
return accepted;
}
catch (e) {
Cu.reportError(e);
}

return true;
}
,
_logLicenseWindowStatistics: function Installer__logLicenseWindowStatistics() {
var flags = {
defhp: "HomePage",
defqs: "DefaultSearch",
statsend: "UsageStat"};
for([flagName, checkboxName] in Iterator(flags)) {
if (! (checkboxName in this.setupData) || ! this.setupData[checkboxName].display)
delete flags[flagName];
flags[flagName] = this.setupData[checkboxName].checked ? 1 : 0;
}

this._application.addonStatus.logAddonEvents(flags);
}
,
_uninstallAddonOnLicenseRefuse: function Installer__uninstallAddonOnLicenseRefuse() {
var addonsToUninstall = [barApp.addonManager.addonId];
if (this.setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == "barff")
{
addonsToUninstall.push("vb@yandex.ru");
}

AddonManager.uninstallAddonsByIDs(addonsToUninstall,true);
}
,
setBrowserNewTabUrl: function Installer_setBrowserNewTabUrl() {
var ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
Preferences.set("browser.newtab.url",ftabUrl);
Preferences.set("extensions.tabmix.newtab.url",ftabUrl);
}
,
_loadDefaultBrowserPreferences: function Installer__loadDefaultBrowserPreferences() {
if (branding.getYandexFeatureState("safe-browsing"))
{
let sbPrefName = this._application.preferencesBranch + "safebrowsing.installed";
if (! Preferences.get(sbPrefName,false))
{
Preferences.set(sbPrefName,true);
let safeBrowsingFile = this._application.core.extensionPathFile;
"defaults/dynamic-preferences/safebrowsing.js".split("/").forEach(function (s) safeBrowsingFile.append(s));
this._application.preferences.loadFromFile(safeBrowsingFile);
}

}

}
};
