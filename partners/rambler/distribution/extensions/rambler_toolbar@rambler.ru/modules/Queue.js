/**
 * @author Max L Dolgov bananafishbone at gmail dot com
 * @description Function Timeout Queue
 * @sample
 *   var data = [                   // 3 frames for example
 *     ['one','by U2'],             // arguments for handlerFunction
 *     ['two', 'by Spin Doctors'],  // arguments for handlerFunction
 *     ['5','Five']                 // arguments for handlerFunction
 *   ]; 
 *   var popQ = new Queue(data, 1000, handlerFunction, {});
 *   popQ.play();
 *
**/

let EXPORTED_SYMBOLS = ["Queue"];

var Queue = function(data, period, handler, context, finalize){
  this.data = Array.isArray(data) && data || [];
  this.period = !isNaN(period)? period : this.period;
  this.handler = 'function' == typeof handler? handler : function(){};
  this.context = context || {};
  this.finalize = 'function' == typeof finalize? finalize : function(){};
};
  
Queue.prototype = {
  timer: null,
  period: 1500,
  data: [],
  index: 0,
  handler: function(){},
  context: {},
  reset: function() {
    this.stop();
    this.period = 1500;
    this.data = [];
    this.index = 0;
    this.handler = function(){};
    this.context = {};
  },
  play: function(){
    this.step();
  },
  stop: function(){
    if (this.timer)  
      this.clearTimer();
    this.finalize();
  },
  
  setTimer: function(){
    if (this.timer)
      this.clearTimer();
      
    if ('undefined' !== typeof setTimeout) {
      this.timer = setTimeout(this.fnBind(this.step, this), this.period);
    } else {
      this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
      this.timer.initWithCallback(this.fnBind(this.step, this), this.period, this.timer.TYPE_ONE_SHOT);
    }  
  },
  clearTimer: function(){
    if (!this.timer)
      return;
      
    if ('undefined' !== typeof clearTimeout)
      clearTimeout(this.timer);
    else 
      this.timer.cancel();
    this.timer = null;
  },
  step: function(){
    var params = this.data[this.index++] || null;
    if (!params)
      return this.stop();
      
    this.handler.apply(this.context, params);
    
    this.setTimer.apply(this);
  },
  fnBind: function(fn, context, params){
    return function(){
      fn.apply(context, params);
    };
  }
};