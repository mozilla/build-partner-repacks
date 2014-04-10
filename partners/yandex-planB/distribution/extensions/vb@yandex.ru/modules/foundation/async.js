"use strict";
EXPORTED_SYMBOLS.push("async");
const async = {
        parallel: function async_parallel(tasks, concurrency, callback) {
            if (arguments.length === 2) {
                callback = concurrency;
                concurrency = 0;
            }
            var isNamedQueue = !Array.isArray(tasks);
            var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
            var resultsData = isNamedQueue ? {} : [];
            if (!tasksKeys.length)
                return callback(null, resultsData);
            var tasksProcessedNum = 0;
            var tasksBeingProcessed = 0;
            var tasksTotalNum = tasksKeys.length;
            (function processTasks() {
                if (!tasksKeys.length || concurrency && concurrency <= tasksBeingProcessed)
                    return;
                var taskIndex = tasksKeys.shift() || tasks.length - tasksKeys.length - 1;
                tasksBeingProcessed += 1;
                tasks[taskIndex](function (err, data) {
                    tasksBeingProcessed -= 1;
                    if (err) {
                        let originalCallback = callback;
                        callback = function () true;
                        return originalCallback(err);
                    }
                    resultsData[taskIndex] = data;
                    tasksProcessedNum += 1;
                    if (tasksProcessedNum === tasksTotalNum)
                        return callback(null, resultsData);
                    processTasks();
                });
                processTasks();
            }());
        },
        series: function async_series(tasks, callback) {
            var isNamedQueue = !Array.isArray(tasks);
            var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
            var resultsData = isNamedQueue ? {} : [];
            if (!tasksKeys.length)
                return callback(null, resultsData);
            (function processTasks(numTasksProcessed) {
                if (numTasksProcessed === tasksKeys.length)
                    return callback(null, resultsData);
                var taskIndex = isNamedQueue ? tasksKeys[numTasksProcessed] : numTasksProcessed;
                tasks[taskIndex](function (err, data) {
                    if (err)
                        return callback(err);
                    resultsData[taskIndex] = data;
                    processTasks(++numTasksProcessed);
                });
            }(0));
        },
        waterfall: function async_waterfall(tasks, callback) {
            var isNamedQueue = !Array.isArray(tasks);
            var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
            if (!tasksKeys.length)
                return callback();
            tasksKeys.reverse();
            if (!isNamedQueue)
                tasks.reverse();
            (function processTasks() {
                var addArgs = Array.slice(arguments, 0);
                if (!tasksKeys.length)
                    return callback.apply(null, [null].concat(addArgs));
                var taskIndex = tasksKeys.pop() || tasksKeys.length;
                var internalCallback = function (err) {
                    if (err)
                        return callback(err);
                    processTasks.apply(null, Array.slice(arguments, 1));
                };
                tasks[taskIndex].apply(null, addArgs.concat(internalCallback));
            }());
        },
        nextTick: function async_nextTick(callback, ctx) {
            if (ctx)
                callback = callback.bind(ctx);
            var currentThread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
            currentThread.dispatch({ "run": callback }, Ci.nsIEventTarget.DISPATCH_NORMAL);
        }
    };
