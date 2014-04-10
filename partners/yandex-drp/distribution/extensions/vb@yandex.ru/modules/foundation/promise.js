"use strict";
EXPORTED_SYMBOLS.push("promise");
function fulfilled(value) {
    return { then: function then(fulfill) fulfill(value) };
}
function rejected(reason) {
    return { then: function then(fulfill, reject) reject(reason) };
}
function isPromise(value) value && typeof value.then === "function"
function defer(prototype) {
    var observers = [];
    var result = null;
    prototype = prototype || prototype === null ? prototype : Object.prototype;
    var promise = Object.create(prototype, {
            then: {
                value: function then(onFulfill, onError) {
                    var deferred = defer(prototype);
                    function resolve(value) {
                        try {
                            deferred.resolve(onFulfill ? onFulfill(value) : value);
                        } catch (e) {
                            deferred.resolve(e);
                        }
                    }
                    function reject(reason) {
                        try {
                            if (onError)
                                deferred.resolve(onError(reason));
                            else
                                deferred.resolve(rejected(reason));
                        } catch (e) {
                            deferred.resolve(rejected(error));
                        }
                    }
                    if (observers) {
                        observers.push({
                            resolve: resolve,
                            reject: reject
                        });
                    } else {
                        result.then(resolve, reject);
                    }
                    return deferred.promise;
                }
            }
        });
    var deferred = {
            promise: promise,
            resolve: function resolve(value) {
                if (!result) {
                    result = isPromise(value) ? value : fulfilled(value);
                    while (observers.length) {
                        let observer = observers.shift();
                        result.then(observer.resolve, observer.reject);
                    }
                    observers = null;
                }
            },
            reject: function reject(reason) {
                deferred.resolve(rejected(reason));
            }
        };
    return deferred;
}
function resolve(value, prototype) {
    var deferred = defer(prototype);
    deferred.resolve(value);
    return deferred.promise;
}
function reject(reason, prototype) {
    var deferred = defer(prototype);
    deferred.reject(reason);
    return deferred.promise;
}
var promised = function promise_promised() {
        var call = Function.call;
        var concat = Array.prototype.concat;
        function execute(args) call.apply(call, args)
        function promisedConcat(promises, unknown) {
            return promises.then(function (values) {
                return resolve(unknown).then(function (value) {
                    return values.concat([value]);
                });
            });
        }
        return function promised(f, prototype) {
            return function promised() {
                return concat.apply([
                    f,
                    this
                ], arguments).reduce(promisedConcat, resolve([], prototype)).then(execute);
            };
        };
    }();
const promise = {
        defer: defer,
        resolve: resolve,
        reject: reject,
        promised: promised
    };
