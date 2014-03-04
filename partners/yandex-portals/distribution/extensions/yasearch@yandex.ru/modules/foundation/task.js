'use strict';
EXPORTED_SYMBOLS.push('task');
const task = {
        spawn: function Task_spawn(aTask) {
            if (aTask && typeof aTask == 'function') {
                try {
                    aTask = aTask();
                } catch (ex) {
                    Cu.reportError(ex);
                    return promise.reject(ex);
                }
            }
            if (aTask && typeof aTask.send === 'function')
                return new TaskImpl(aTask).deferred.promise;
            return promise.resolve(aTask);
        },
        Result: function Task_Result(aValue) {
            this.value = aValue;
        }
    };
function TaskImpl(iterator) {
    this.deferred = promise.defer();
    this._iterator = iterator;
    Services.tm.mainThread.dispatch(this._run.bind(this, true), Ci.nsIThread.DISPATCH_NORMAL);
}
TaskImpl.prototype = {
    deferred: null,
    _iterator: null,
    _run: function TaskImpl_run(aSendResolved, aSendValue) {
        try {
            let yielded = aSendResolved ? this._iterator.send(aSendValue) : this._iterator.throw(aSendValue);
            if (yielded && typeof yielded.send === 'function')
                yielded = task.spawn(yielded);
            if (yielded && typeof yielded.then === 'function') {
                yielded.then(this._run.bind(this, true), this._run.bind(this, false));
            } else {
                this._run(true, yielded);
            }
        } catch (ex if ex instanceof task.Result) {
            this.deferred.resolve(ex.value);
        } catch (ex if ex instanceof StopIteration) {
            this.deferred.resolve(aSendValue);
        } catch (ex) {
            Cu.reportError(ex);
            this.deferred.reject(ex);
        }
    }
};
