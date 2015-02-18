"use strict";
const EXPORTED_SYMBOLS = ["VB_CONFIG"];
const VB_CONFIG = function () {
    let config = {
        APP: {
            ID: "vb@yandex.ru",
            NAME: "yandex-vb",
            TYPE: "vbff",
            COOKIE: "vb.ff",
            PROTOCOL: "yafd"
        },
        BUILD: {
            DATE: "Thu Feb 12 2015 15:02:34 GMT+0000",
            REVISION: "6_17"
        },
        CORE: {
            CONTRACT_ID: "@yandex.ru/vb-core;1",
            CLASS_ID: Components.ID("{1ad918b4-4729-11e1-ab8a-dff4577f00a5}")
        }
    };
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
