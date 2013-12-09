"use strict";
const EXPORTED_SYMBOLS = ["CB_CONFIG"];
const CB_CONFIG = (function () {
const APP_NAME = "yasearch";
var config = {
APP: {
NAME: APP_NAME,
TYPE: "barff",
COOKIE: "bar.ff"},
BUILD: {
DATE: "Mon Dec 09 2013 08:58:43 GMT+0000",
REVISION: 57792},
PLATFORM: {
VERSION: 16,
BLACKLIST_URL: "http://export.yandex.ru/bar/blacklist.xml"},
CORE: {
CONTRACT_ID: "@yandex.ru/custombarcore;" + APP_NAME,
CLASS_ID: "{F25B83DE-5817-11DE-8EB3-C9A656D89593}"},
PREFS_PATH: {
XB_WIDGETS: APP_NAME + ".xbwidgets.",
NATIVES: APP_NAME + ".native_comps.",
STATIC: APP_NAME + ".static."}};
config.PROTOCOLS = {
};
config.PROTOCOLS[APP_NAME] = "{1A2ADED0-64D1-11DE-8047-DBAA3A7E4459}";
config.PROTOCOLS.bar = "{15886E59-CCD8-495A-8A39-1CB57479AE47}";
function freeze(aObject) {
if (! (aObject && typeof aObject == "object"))
return aObject;
Object.freeze(aObject);
for each(let obj in aObject) freeze(obj);
return aObject;
}

return freeze(config);
}
)();
