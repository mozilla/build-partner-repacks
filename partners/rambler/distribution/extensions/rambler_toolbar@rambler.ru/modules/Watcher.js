let EXPORTED_SYMBOLS = ["Watcher"];

function Watcher(topic, observer) {
  this.topic = topic;
  this.observer = ('function' == typeof observer)? observer : function(subject, topic, data){};
}

Watcher.prototype = {
  observe: function(subject, topic, data) {
    if (this.topic == topic && this.observer) 
      this.observer(subject, topic, data);
  },
  register: function(){
    let observerService = Components.classes["@mozilla.org/observer-service;1"]
                          .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(this, this.topic, false);
  },
  unregister: function(){
    let observerService = Components.classes["@mozilla.org/observer-service;1"]
                            .getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(this, this.topic);
  }      
}
