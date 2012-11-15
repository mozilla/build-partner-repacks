function musicTimer(){
    var observer=Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    observer.notifyObservers(null,'MAIL-apply-music',0);
} 

function MRMusicContoller(xcomLib, chromeURL) {
    this.debugZone = "MRMusicContoller";
    this.url = 'http://sputnik.mail.ru/sp/music.html';
    this.timer = null;
    this.detected = false;
    this.doc = null;
    this.win = null;
    this.topWindow = null;
    this.xcomLib = xcomLib;
    this.chromeURL = chromeURL;
};

MRMusicContoller.prototype.open = function() {
    if(this.detect())
    {
        this.flash();
        return;
    }
	this.topWindow = window.open(
	    this.url,
	    "",
	    "resizable=no,scrollbars=no,status=no,left=50,right=50,width=320,height=300"
	);
};

MRMusicContoller.prototype.flash = function() {
    this.topWindow.focus();
    this.topWindow.getAttention();
};

MRMusicContoller.prototype.close = function() {
    this.detect();
    if(this.detected)
    {
        this.topWindow.close();
    }
};

MRMusicContoller.prototype.setMusicWindow = function(win) {
    if(win==null)
    {
 	    this.detected = false;
        this.doc = null;
        this.win = null;
        this.topWindow = null;
        return;
    }
    this.detected = true;
    this.topWindow = win;
    this.win=win.content.window;
    this.doc=win.content.document;
    this.doc.addEventListener("blur", this.xcomLib.BindToObject(this.OnBlur,this), false);
    this.doc.addEventListener("gotourl_event", this.xcomLib.BindToObject(this.OnGotoURL,this), false);
    
}

MRMusicContoller.prototype.detect = function() {
	var mediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
	var enumerator = mediator.getEnumerator("navigator:browser");
	var winMusic = null;
	while (enumerator.hasMoreElements())
	{    
	    var win=enumerator.getNext();
	    if(win.content && win.locationbar && win.content.document.URL == this.url && !win.locationbar.visible)
	    {
	        winMusic = win;
	        break;
	    }
	}
	this.setMusicWindow(winMusic);
    if(!this.timer && this.detected)
    {
        this.timer = setInterval(function(){musicTimer();},500);
    }
    else if(!this.detected && this.timer)
    {
        musicTimer();
        clearInterval(this.timer);
        this.timer = null;
    }
    return this.detected;
};

MRMusicContoller.prototype.getStatus = function() {
    var status = "stop";
    this.detect();
    if(!this.detected)
    {
        return status;
    }
    try
    {
        status = this.doc.title;
    }
    catch (e) 
    {
        return "stop";
    }
    return status;
}

MRMusicContoller.prototype.OnBlur = function() {
   this.topWindow.minimize();
}

MRMusicContoller.prototype.OnGotoURL = function() {
    if(this.doc.title.length)
    {
       window.open(this.doc.title);
       this.doc.title = "";
       this.win.location.reload();
    }
   
}

MRMusicContoller.prototype.reload = function() {
    this.detect();
    if(this.detected)
    {
       G_Debug(this, "reload");
       this.win.location.reload();
    }
   
}

MRMusicContoller.prototype.CloseLast = function() {
	var mediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
	var enumerator = mediator.getEnumerator("navigator:browser");
	var count = 0;
	var winMusic = null;
	while (enumerator.hasMoreElements())
	{
	    var win = enumerator.getNext();
	    if(win && win.content && win.locationbar && win.content.document.URL == this.url && !win.locationbar.visible)
	    {
	        winMusic = win;
	    }
	    count++;
	}
	this.setMusicWindow(winMusic);
	if(this.detected && count<=1)
	{
	    this.topWindow.close();
	}
}

MRMusicContoller.prototype.mail_playstatus = function(){
    var status = this.musicController.getStatus();
    var elButton = document.getElementById("mailru_music_btn");
    if(status=="play"){
        if(elButton.image != this.chromeURL + "skin/eqv.gif")
        {
            elButton.image = this.chromeURL + "skin/eqv.gif";
        }
    }
    else{
        if(elButton.image != this.chromeURL + "skin/stop.gif")
        {
            elButton.image = this.chromeURL + "skin/stop.gif";
        }
    }
};

