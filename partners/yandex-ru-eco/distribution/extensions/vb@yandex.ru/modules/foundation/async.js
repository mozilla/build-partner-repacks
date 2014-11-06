"use strict";
EXPORTED_SYMBOLS.push("async");
const async = {
    parallel: function async_parallel(tasks, concurrency, callback) {
        if (arguments.length === 2) {
            callback = concurrency;
            concurrency = 0;
        }
        let isNamedQueue = !Array.isArray(tasks);
        let tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
        let resultsData = isNamedQueue ? {} : [];
        if (!tasksKeys.length) {
            return callback(null, resultsData);
        }
        let tasksProcessedNum = 0;
        let tasksBeingProcessed = 0;
        let tasksTotalNum = tasksKeys.length;
        (function processTasks() {
            if (!tasksKeys.length || concurrency && concurrency <= tasksBeingProcessed) {
                return;
            }
            let taskIndex = tasksKeys.shift() || tasks.length - tasksKeys.length - 1;
            tasksBeingProcessed += 1;
            tasks[taskIndex](function (err, data) {
                tasksBeingProcessed -= 1;
                if (err) {
                    let originalCallback = callback;
                    callback = function () {
                        return true;
                    };
                    return originalCallback(err);
                }
                resultsData[taskIndex] = data;
                tasksProcessedNum += 1;
                if (tasksProcessedNum === tasksTotalNum) {
                    return callback(null, resultsData);
                }
                processTasks();
            });
            processTasks();
        }());
    },
    series: function async_series(tasks, callback) {
        let isNamedQueue = !Array.isArray(tasks);
        let tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
        let resultsData = isNamedQueue ? {} : [];
        if (!tasksKeys.length) {
            return callback(null, resultsData);
        }
        (function processTasks(numTasksProcessed) {
            if (numTasksProcessed === tasksKeys.length) {
                return callback(null, resultsData);
            }
            let taskIndex = isNamedQueue ? tasksKeys[numTasksProcessed] : numTasksProcessed;
            tasks[taskIndex](function (err, data) {
                if (err) {
                    return callback(err);
                }
                resultsData[taskIndex] = data;
                processTasks(++numTasksProcessed);
            });
        }(0));
    },
    waterfall: function async_waterfall(tasks, callback) {
        let isNamedQueue = !Array.isArray(tasks);
        let tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
        if (!tasksKeys.length) {
            return callback();
        }
        tasksKeys.reverse();
        if (!isNamedQueue) {
            tasks.reverse();
        }
        (function processTasks() {
            let addArgs = Array.slice(arguments, 0);
            if (!tasksKeys.length) {
                return callback.apply(null, [null].concat(addArgs));
            }
            let taskIndex = tasksKeys.pop() || tasksKeys.length;
            let internalCallback = function (err) {
                if (err) {
                    return callback(err);
                }
                processTasks.apply(null, Array.slice(arguments, 1));
            };
            tasks[taskIndex].apply(null, addArgs.concat(internalCallback));
        }());
    },
    nextTick: function async_nextTick(callback, ctx) {
        if (ctx) {
            callback = callback.bind(ctx);
        }
        let currentThread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
        currentThread.dispatch({ run: callback }, Ci.nsIEventTarget.DISPATCH_NORMAL);
    }
};
