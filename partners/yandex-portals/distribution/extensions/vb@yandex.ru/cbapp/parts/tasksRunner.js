"use strict";
const EXPORTED_SYMBOLS = ["tasksRunner"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
const tasksRunner = {
pseudoSync: function Tasks_pseudoSync(callback, ctx) {
if (this._isWorking)
return this._queue.push({
cb: callback,
ctx: ctx});
var done = (function () {
this._isWorking = false;
if (this._queue.length)
{
let task = this._queue.shift();
this.pseudoSync(task.cb,task.ctx);
}

}
).bind(this);
this._isWorking = true;
callback.call(ctx,done);
}
,
_isWorking: false,
_queue: []};
