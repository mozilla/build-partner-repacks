function MRAjaxService() {
    this.debugZone = "MRAjaxService";
    this.ajax = G_NewXMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.url = "";
    this.showError = false;
    this.updateTimer = null;
    this.refetchTimeout = 300 * 1000;
    this.toolbarObject = null;
};

MRAjaxService.prototype.init = function(toolbarObject) {
    this.toolbarObject = toolbarObject;
}

MRAjaxService.prototype.update = function() {
    this.begin();
    if(this.refetchTimeout<60000)
    {
        this.refetchTimeout = 60000;
    }
    this.setUpdateTimer();
}

MRAjaxService.prototype.setUpdateTimer = function(timeout) {
    var localThis = this;
    var callback = { 
        notify: function(timer) { 
            localThis.update();
        } 
    } 
    if(!this.updateTimer)
    {
        this.updateTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer); 
    }
    this.updateTimer.cancel();
    var nTimeout = timeout;
    if(!nTimeout)
    {
        nTimeout = this.refetchTimeout;
    }
    this.updateTimer.initWithCallback(callback, nTimeout, Components.interfaces.nsITimer.TYPE_ONE_SHOT);    
}

MRAjaxService.prototype.begin = function() {
    if (!this.isReady()) {
        return;
    }
    G_Debug(this, "begin");
    this.send(this.url);
}

MRAjaxService.prototype.end = function() {
    try {
        if (this.ajax.readyState != 4) {
            return;
        }
        if (this.ajax.status == 200) {
            if (!this.ajax.responseXML) {
                var parser = new DOMParser();
                this.parse(
				    parser.parseFromString(
					    this.ajax.responseText,
					    "text/xml"
				    )
				);
            }
            else {
                this.parse(this.ajax.responseXML)
            }
        }
        else {
            this.parse(null)
        }
    }
    catch (e) {
        this.error();
    }
}

MRAjaxService.prototype.parse = function(responceXML) {
    if (responceXML == null) {
        if (this.showError) {
            this.error();
            this.apply(true);
        }
        return;
    }
}

MRAjaxService.prototype.isReady = function() {
    if (
			    !(this.ajax.readyState == 0)
			    && !(this.ajax.readyState == 4)
		    ) {
        return false;
    }
    if (!this.url.length) {
        return false;
    }
    return true;
};

MRAjaxService.prototype.send = function(sURL) {
    this.ajax.open(this.method, sURL, true);
    if (this.mimeType && this.mimeType.length) {
        this.ajax.overrideMimeType(this.mimeType);
    }
    this.ajax.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
    this.ajax.onreadystatechange = this.toolbarObject.appContext.BindToObject(this.end, this);
    this.ajax.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;    
    this.ajax.send(null);
}

MRAjaxService.prototype.apply = function() {
}

MRAjaxService.prototype.error = function() {
}

MRAjaxService.prototype.isAllowedServerError = function(status) {
    return (status>=400 && status <=599);
}

function MRInformerService() {
    this.debugZone = "MRInformerService";
    this.ajax = G_NewXMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.url = "";
    this.showError = false;
    this.updateTimer = null;
    this.key = "";
    this.infos = {};
    this.refetchTimeout = 300 * 1000;
};
MRInformerService.prototype = new MRAjaxService;

MRInformerService.prototype.update = function(bForce) {
    G_Debug(this, "update:" + bForce);
    this.applyCurrentState();
    if (bForce || !this.valid()) {
        
        this.begin();
    }
    this.calcRefetch();
    this.timeoutLimit();
    this.setUpdateTimer();
}

MRInformerService.prototype.initInfos = function() {
    if (!this.infos.length) {
        this.infos[this.key] = new MRInformerParser();
    }
}

MRInformerService.prototype.applyCurrentState = function() {
    this.initInfos();
    for (var i in this.infos) {
        if (this.infos[i].empty) {
            this.infos[i].loadBrick(i);
        }
        if (this.infos[i].empty) {
            this.infos[i].loadFromCrome(this.toolbarObject.informersURL + "informer." + i + ".xml");
        }
    }
    this.apply();
    
}

MRInformerService.prototype.valid = function() {
    for (var i in this.infos) {
        if(!this.infos[i].isValid())
        {
            return false;
        }
    }
    return true;
}

MRInformerService.prototype.timeoutLimit = function() {
    if (this.refetchTimeout < 60000) {
        this.refetchTimeout = 60000;
    }
}


MRInformerService.prototype.parse = function(responceXML) {
try {
    if (responceXML == null) {
        if (this.showError) {
            this.error();
            this.apply(true);
        }
        return;
    }
    var root = responceXML.childNodes.item(0);
    if (root.nodeName != 'spudata') {
        return;
    }
    for (var i = 0; i < root.childNodes.length; i++) {
        var brick = root.childNodes.item(i);
        var info = new MRInformerParser();
        if (info.parse(brick)) {
            info.saveBrick(info.id, brick);
            this.infos[info.id] = info;
        };
    }
    this.apply(true);
}catch (err) {  G_Debug(this, "exception: " + err + ", stack: " + err.stack + "\n");}

}

MRInformerService.prototype.error = function() {
    for (var i in this.infos) {
        this.infos[i].reset();
    }
}

MRInformerService.prototype.calcRefetch = function() {
    var refetch = this.refetchTimeout;
    var nRestTime = 0;
    for (var i in this.infos) {
        var nTimeLeft = this.refetchTimeout - this.infos[i].getTimeAfterRecive(this.infos[i].id);
        if(nTimeLeft>0 && nTimeLeft < this.refetchTimeout && nTimeLeft < refetch)
        {
            refetch = nTimeLeft;
        }
    }
    this.refetchTimeout = refetch;
}

MRInformerService.prototype.applyRefetch = function(timeout) {
    if (timeout <= 0) {
        return;
    }
    this.refetchTimeout = timeout;
}