"use strict";
EXPORTED_SYMBOLS.push("patterns");
const patterns = {};
patterns.NotificationSource = function NotificationSource() {
    this._listeners = {};
};
patterns.NotificationSource.prototype = {
    constructor: patterns.NotificationSource,
    addListener: function NotificationSource_addListener(topic, listener) {
        let topicListeners = this._listeners[topic] || (this._listeners[topic] = []);
        if (topicListeners.indexOf(listener) >= 0) {
            return;
        }
        topicListeners.push(listener);
        this._listenerAdded(topic, listener);
    },
    removeListener: function NotificationSource_removeListener(topic, listener) {
        let topicListeners = this._listeners[topic] || (this._listeners[topic] = []);
        if (!topicListeners) {
            return;
        }
        let listenerIdx = topicListeners.indexOf(listener);
        if (listenerIdx < 0) {
            return;
        }
        topicListeners.splice(listenerIdx, 1);
        if (topicListeners.length < 1) {
            delete this._listeners[topic];
        }
        this._listenerRemoved(topic, listener);
    },
    removeAllListeners: function NotificationSource_removeAllListeners() {
        if (this._hasListeners) {
            this._listeners = {};
            this._listenerRemoved();
        }
    },
    _listeners: null,
    get _hasListeners() {
        for (let [
                    topic,
                    list
                ] in Iterator(this._listeners)) {
            if (list && list.length) {
                return true;
            }
        }
        return false;
    },
    _getListeners: function NotificationSource__getListeners(topic) {
        return this._listeners[topic] || [];
    },
    _notifyListeners: function NotificationSource__notifyListeners(topic, data) {
        let topicListeners = this._getListeners(topic);
        topicListeners.forEach(function NotificationSource__notificatorFunc(listener) {
            try {
                if (this._listeners[topic].indexOf(listener) != -1) {
                    listener.observe(this, topic, data);
                }
            } catch (e) {
                Cu.reportError("Could not notify event listener. " + e + "\n" + e.stack);
            }
        }, this);
    },
    _listenerAdded: function NotificationSource__listenerAdded(topic, listener) {
    },
    _listenerRemoved: function NotificationSource__listenerRemoved(topic, listener) {
    }
};
patterns.NotificationSource.objectMixIn = function NotificationSource_objectMixIn(object) {
    let notificationSourceInstance = new this();
    for (let prop in notificationSourceInstance) {
        if (prop === "constructor") {
            continue;
        }
        object[prop] = notificationSourceInstance[prop];
    }
};
patterns.AsyncTaskQueue = function AsyncTaskQueue(watcher, chainTasks) {
    this._chainTasks = Boolean(chainTasks);
    this._pendingTasks = [];
    this._runningTasks = [];
    this._finishedTasks = [];
    this._finished = false;
    this._parallelTasks = 1;
    this._owner = null;
    this._onComplete = undefined;
    if (watcher !== undefined) {
        if (sysutils.isObject(watcher)) {
            this._ownerInterface.checkImplementation(watcher);
            this._owner = watcher;
        } else if (typeof watcher == "function") {
            this._onComplete = watcher;
        } else {
            throw new CustomErrors.EArgType("");
        }
    }
};
patterns.AsyncTaskQueue.prototype = {
    get pendingTasks() {
        return this._pendingTasks.slice();
    },
    get runningTasks() {
        return this._runningTasks.slice();
    },
    get finishedTasks() {
        return this._finishedTasks.slice();
    },
    addTask: function AsyncTaskQueue_addTask(task) {
        if (!(task instanceof patterns.AsyncTask)) {
            throw new CustomErrors.EArgType("task", "AsyncTask", asyncTask);
        }
        this._pendingTasks.push(task);
    },
    startTasks: function AsyncTaskQueue_doTasks(parallelTasks) {
        if (parallelTasks !== undefined) {
            if (typeof parallelTasks != "number") {
                throw new CustomErrors.EArgType("parallelTasks", "number", parallelTasks);
            }
            if (isNaN(parallelTasks) || parallelTasks < 1) {
                throw new CustomErrors.EArgRange("parallelTasks", "1+", parallelTasks);
            }
            if (this._chainTasks && parallelTasks > 1) {
                throw new Error("Can't parallel chained tasks");
            }
            this._parallelTasks = Math.floor(parallelTasks);
        }
        this._proceed();
    },
    abortTasks: function AsyncTaskQueue_abortTasks(reason) {
        this._finishedTasks = this._finishedTasks.concat(this._pendingTasks);
        this._pendingTasks = [];
        let currIndex = 0;
        while (currIndex < this._runningTasks.length) {
            let task = this._runningTasks[currIndex];
            try {
                task.abort(reason);
                currIndex++;
            } catch (e) {
                Cu.reportError("Task can't abort gracefully. Error: " + strutils.formatError(e));
                this._runningTasks.splice(currIndex, 1);
                this._finishedTasks.push(task);
            }
        }
        if (this._runningTasks.length < 1) {
            this._finish();
        }
    },
    onTaskProgress: function AsyncTaskQueue_onTaskProgress(task) {
        if (this._runningTasks.length > 0) {
            this._notyfyTaskProgress(task);
        }
    },
    onTaskFinished: function AsyncTaskQueue_onTaskFinished(task) {
        let runIndex = this._runningTasks.indexOf(task);
        if (runIndex < 0) {
            throw new Error("Alien task");
        }
        this._runningTasks.splice(runIndex, 1);
        this._finishedTasks.push(task);
        this._notyfyTaskFinished(task);
        this._proceed(task);
    },
    _startTask: function AsyncTaskQueue__startFirst(task, prevTask) {
        task.start(this, prevTask);
    },
    _proceed: function AsyncTaskQueue__proceed(prevTask) {
        if (this._pendingTasks.length > 0) {
            let task = this._pendingTasks.shift();
            try {
                this._startTask(task, prevTask);
                this._runningTasks.push(task);
            } catch (e) {
                this._finishedTasks.push(task);
                this._notyfyTaskFinished(task);
            }
            if (this._runningTasks.length < this._parallelTasks) {
                this._proceed();
            }
        } else if (this._runningTasks.length < 1) {
            this._finish();
        }
    },
    _notyfyTaskFinished: function AsyncTaskQueue__notyfyTaskFinished(task) {
        if (!this._owner) {
            return;
        }
        try {
            if (typeof this._owner.onTaskFinished == "function") {
                this._owner.onTaskFinished(task);
            }
        } catch (e) {
            Cu.reportError(e);
        }
    },
    _notyfyTaskProgress: function AsyncTaskQueue__notyfyTaskProgress(task) {
        if (!this._owner) {
            return;
        }
        try {
            if (typeof this._owner.onTaskProgress == "function") {
                this._owner.onTaskProgress(task);
            }
        } catch (e) {
            Cu.reportError(e);
        }
    },
    _finish: function AsyncTaskQueue__finish() {
        this._finished = true;
        let context = this._owner;
        let func = context ? context.onTasksFinished : this._onComplete;
        if (!func) {
            return;
        }
        try {
            func.call(context, this);
        } catch (e) {
            Cu.reportError(e);
        }
    },
    _ownerInterface: new sysutils.Interface("ITaskQueueOwner", ["onTasksFinished"])
};
patterns.AsyncTask = function AsyncTask(owner, prevTask) {
};
patterns.AsyncTask.prototype = {
    start: function AsyncTask_start(owner, prevTask) {
        this._ownerInterface.checkImplementation(owner);
        this._owner = owner;
        this._prevTask = prevTask;
    },
    abort: function AsyncTask_abort(reason) {
        this._abortReason = reason;
    },
    get abortReason() {
        return this._abortReason;
    },
    get progress() {
        return this._progress;
    },
    get error() {
        return this._error;
    },
    _progress: 0,
    _abortReason: undefined,
    _error: undefined,
    _prevTask: undefined,
    _finish: function AsyncTask__finish() {
        this._owner.onTaskFinished(this);
    },
    _step: function AsyncTask_step(by) {
        this._progress += by;
        this._owner.onTaskProgress(this);
    },
    _ownerInterface: new sysutils.Interface("IAsyncTaskOwner", [
        "onTaskProgress",
        "onTaskFinished"
    ])
};
