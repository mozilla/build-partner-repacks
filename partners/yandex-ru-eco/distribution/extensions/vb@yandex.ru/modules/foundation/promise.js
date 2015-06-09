"use strict";
EXPORTED_SYMBOLS.push("promise");
Cu.import("resource://gre/modules/Promise.jsm");
function race(promises) {
    let res = Promise.defer();
    if (!promises || !promises.length) {
        return res;
    }
    promises.forEach(function (promise) {
        promise.then(res.resolve, res.reject);
    });
    return res;
}
const promise = {
    defer: Promise.defer,
    resolve: Promise.resolve,
    reject: Promise.reject,
    all: Promise.all,
    race: Promise.race || race
};
