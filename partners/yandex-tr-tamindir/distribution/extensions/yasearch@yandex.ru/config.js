"use strict";
const EXPORTED_SYMBOLS = ["CB_CONFIG"];
const CB_CONFIG = function () {
    const APP_NAME = "yasearch";
    let config = {
        APP: {
            ID: "yasearch@yandex.ru",
            NAME: APP_NAME,
            TYPE: "barff",
            COOKIE: "bar.ff"
        },
        BUILD: {
            DATE: 'Mon Jun 08 2015 13:53:05 GMT+0000',
            REVISION: 4
        },
        PLATFORM: { VERSION: 28 },
        CORE: {
            CONTRACT_ID: "@yandex.ru/custombarcore;" + APP_NAME,
            CLASS_ID: "{F25B83DE-5817-11DE-8EB3-C9A656D89593}"
        }
    };
    config.PROTOCOLS = Object.create(null);
    config.PROTOCOLS[APP_NAME] = "{1A2ADED0-64D1-11DE-8047-DBAA3A7E4459}";
    config.PROTOCOLS.bar = "{15886E59-CCD8-495A-8A39-1CB57479AE47}";
    function freeze(aObject) {
        if (!(aObject && typeof aObject == "object")) {
            return aObject;
        }
        Object.freeze(aObject);
        for (let [
                    ,
                    obj
                ] in Iterator(aObject)) {
            freeze(obj);
        }
        return aObject;
    }
    return freeze(config);
}();
