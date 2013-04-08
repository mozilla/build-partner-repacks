// StretchClock 2.0 by Shane Gildnes
// (C)2006 - 2012 by FitClock Productions
// All rights reserved.
//
//
// Are you interested in this code? Do you want your own stretch reminder gadget?
// if so, you should check out StretchClock Pro, it is a product for people who need their own stretch gadgets.
//
// www.StretchClock.com/pro
//
//
// Please contact us for more info.
// www.StretchClock.com
//

var com_StretchClock_Fox = {
	prefs: null,
	paused: false,
	autoStretch: false,
	computerPerformedPause: false,
	minsBetweenStretches: "",
	timeNextStretch: "",
	atBreak: "",
	warpFactor: 1, // countdown in minutes
	//warpFactor: 60, // countdown in seconds	

	// Initialize the extension
	startup: function()	{
		// Register to receive notifications of preference changes
		com_StretchClock_Fox.prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("extensions.com_StretchClock_Fox.");
		com_StretchClock_Fox.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		com_StretchClock_Fox.prefs.addObserver("", this, false);
		
		com_StretchClock_Fox.minsBetweenStretches 	= com_StretchClock_Fox.prefs.getCharPref("mins_between_stretches");
		com_StretchClock_Fox.hoursBetweenStretches 	= com_StretchClock_Fox.prefs.getCharPref("hours_between_stretches");

		com_StretchClock_Fox.timeNextStretch 		= com_StretchClock_Fox.prefs.getCharPref("time_next_stretch");
		com_StretchClock_Fox.paused 				= com_StretchClock_Fox.prefs.getBoolPref("paused");

		com_StretchClock_Fox.computerPerformedPause = com_StretchClock_Fox.prefs.getBoolPref("computer_performed_pause");
		var computerPaused 							= com_StretchClock_Fox.prefs.getBoolPref("computer_performed_pause");

		com_StretchClock_Fox.askToStretch 			= com_StretchClock_Fox.prefs.getBoolPref("ask_to_stretch");

		if (computerPaused)	{
			com_StretchClock_Fox.prefs.setBoolPref("computer_performed_pause",false);
			com_StretchClock_Fox.unpauseClock();
		}
		com_StretchClock_Fox.paintPauseButton();
		com_StretchClock_Fox.refreshInformation();


		// add the toolbar button
		var navbar = document.getElementById("scf__toolbar");
		navbar.setAttribute("removable", true);

		// Open the post install url if this has just been installed	
		// If we just installed, open the post-install page and update the preferences.
		var just_installed = com_StretchClock_Fox.prefs.getBoolPref("just_installed");
		var post_install_url = com_StretchClock_Fox.prefs.getCharPref("post_install_url");
		if (just_installed) {			
			//com_StretchClock_Fox.OpenUrl(post_install_url, "stretchclock");
			com_StretchClock_Fox.prefs.setBoolPref("just_installed", false);
		}
		window.setInterval(com_StretchClock_Fox.refreshInformation, 1000*20/com_StretchClock_Fox.warpFactor);
	},
	
	// Clean up after ourselves and save the prefs	
	shutdown: function()
	{
		// if this is the last window open
		var morewindows = com_StretchClock_Fox.isMoreWindows();
		if (!morewindows)	{
			// pause clock on shutdown
			var isPaused = com_StretchClock_Fox.prefs.getBoolPref("paused"); 
			if (!isPaused)	{
				com_StretchClock_Fox.pauseClock();
				com_StretchClock_Fox.prefs.setBoolPref("computer_performed_pause", true);
			}
		}
		com_StretchClock_Fox.prefs.removeObserver("", this);
	},
	
	// Called when events occur on the preferences	
	observe: function(subject, topic, data)
	{
		if (topic != "nsPref:changed")	{
			return;
		}		
//		alert('subject: ' + subject + '\r\ntopic: ' + topic + '\r\n\data: ' + data);
//		alert(data.substr(0, 8));
		if ((data.substr(0, 8) == "hour_on_") ||
			(data.substr(0, 7) == "min_on_") ||
			(data.substr(0, 8) == "ampm_on_") ||
			(data.substr(0, 9) == "hour_off_") ||
			(data.substr(0, 8) == "min_off_") ||
			(data.substr(0, 9) == "ampm_off_") ||
			(data == "enable_schedule") || 
			(data.substr(0, 10) == "stretch_on"))	{
				com_StretchClock_Fox.refreshInformation();
			}
			
		switch(data)		{
			case "paused":
				var clockPaused = com_StretchClock_Fox.prefs.getBoolPref("paused");
				if (clockPaused != com_StretchClock_Fox.paused)	{
					if (clockPaused)	{
						com_StretchClock_Fox.pauseClock();
						com_StretchClock_Fox.pauseDisplay();
					}
					else	{
						com_StretchClock_Fox.unpauseClock();
						com_StretchClock_Fox.unpauseDisplay();
					}
				}
				break;
			case "time_next_stretch":
				com_StretchClock_Fox.timeNextStretch = com_StretchClock_Fox.prefs.getCharPref("time_next_stretch");
				com_StretchClock_Fox.updateDisplay('');
				com_StretchClock_Fox.paintPauseButton();
				com_StretchClock_Fox.paintStretchButton();
				break;
			case "mins_between_stretches":
				com_StretchClock_Fox.minutesBetweenStretches = com_StretchClock_Fox.prefs.getCharPref("mins_between_stretches");
				com_StretchClock_Fox.ResetClock();
				break;
			case "hours_between_stretches":
				com_StretchClock_Fox.hoursBetweenStretches = com_StretchClock_Fox.prefs.getCharPref("hours_between_stretches");
				com_StretchClock_Fox.ResetClock();
				break;
			case "ask_before_stretching":
				com_StretchClock_Fox.askBeforeStretching = com_StretchClock_Fox.prefs.getBoolPref("ask_before_stretching");
				break;
			case "show_addonbar":
				com_StretchClock_Fox.showHideAddonbar();
				break;			
		}
	},
	
	
	// Refresh the clock	
	refreshInformation: function()	{

		if (com_StretchClock_Fox.isSleeping()) {	
			com_StretchClock_Fox.updateDisplay('sleeping');
			return;
		}

		if (com_StretchClock_Fox.paused) {	
			com_StretchClock_Fox.updateDisplay('paused');
			return;
		}
		
		// how many minutes until next stretch?
		var timeLeft = com_StretchClock_Fox.minutesToNextStretch();
		if (timeLeft <= 0) {
			com_StretchClock_Fox.TimeToStretch();
		}
		else	{
			com_StretchClock_Fox.updateDisplay(timeLeft.toString() + ' minutes');
		}
	},
	
	minutesToNextStretch: function()	{
		var timeNow = new Date();
		var nextStretch = parseInt(com_StretchClock_Fox.prefs.getCharPref("time_next_stretch"));
		var minsLeft = (nextStretch - timeNow.valueOf())/1000/60*com_StretchClock_Fox.warpFactor; // count in minutes

//		return the truncated minutes (not the fraction)
		var retVal = Math.ceil(minsLeft);
		return retVal;
	},
	
	TimeToStretch: function()	{	
	    if (com_StretchClock_Fox.isPaused)   {
	        // do nothing
	        return;
	    }
	    if (com_StretchClock_Fox.prefs.getBoolPref("play_reminder") == true) {
	        com_StretchClock_Fox.timeToPlayReminder();
	    }
	    if (com_StretchClock_Fox.prefs.getBoolPref("ask_to_stretch") == true) {
                if (confirm("Stretch Now?")) {
                    com_StretchClock_Fox.Stretch();
                } else { 
                    com_StretchClock_Fox.ResetClock();
		}
	    } else {
                var just_installed = com_StretchClock_Fox.prefs.getBoolPref("just_installed");
		if (!just_installed) {
                    com_StretchClock_Fox.Stretch();
		}
	    }
	},

	Stretch: function()	{
		// launch the stretch
		var stretchURL = com_StretchClock_Fox.prefs.getCharPref("StretchRouter") + 
			"?utm_source=Gadget&utm_medium=Firefox&utm_content=stretch&utm_campaign=v2";
		com_StretchClock_Fox.OpenUrl(stretchURL,"stretchclock");
		
		// reset clock
		com_StretchClock_Fox.ResetClock();		
	},
	
	timeToPlayReminder: function()  {
	    // have we already played it?

	    var playedReminder = com_StretchClock_Fox.prefs.getBoolPref("played_reminder");
	    if (!playedReminder)    {

	        com_StretchClock_Fox.playReminder();
	        com_StretchClock_Fox.prefs.setBoolPref("played_reminder", true);
	    }
	},
	
	ResetClock: function()	{

		com_StretchClock_Fox.prefs.setBoolPref("paused", false);		
		var timeNow = new Date();
		var minsBetweenStretches = parseInt(com_StretchClock_Fox.prefs.getCharPref("mins_between_stretches"));
		minsBetweenStretches += (60 * parseInt(com_StretchClock_Fox.prefs.getCharPref("hours_between_stretches")));
		var nextStretch = parseInt(timeNow.valueOf()) + ((minsBetweenStretches)*60*1000/com_StretchClock_Fox.warpFactor);
		var strNextStretch = nextStretch.toString();
		com_StretchClock_Fox.prefs.setCharPref("time_next_stretch", strNextStretch);

		//change the pause button to Normal
		document.getElementById('btn_stretch').className = 'btn_stretch_normal';		

		// update the display
		com_StretchClock_Fox.updateDisplay('');
		
        com_StretchClock_Fox.prefs.setBoolPref("played_reminder", false);


	},
	
	isMoreWindows: function()	{
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);  
		var enumerator = wm.getEnumerator("navigator:browser");  	
		var more = enumerator.hasMoreElements();
		return more;
	},
	
	OpenUrl: function(url) {
            // Try again after a short delay if session store is initializing
            let {__SSi, __SS_restoreID, gBrowser, setTimeout} = window;
            if (__SSi == null || __SS_restoreID != null) {
		setTimeout(function() com_StretchClock_Fox.OpenUrl(url), 250);
		return;
            }

	  var attrName = "com_StretchClock_Fox.tab";
	  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
	                     .getService(Components.interfaces.nsIWindowMediator);
	  for (var found = false, index = 0, tabbrowser = wm.getEnumerator('navigator:browser').getNext().gBrowser;
	       index < tabbrowser.tabContainer.childNodes.length && !found;
	       index++) {
	
			// Get the next tab
			var currentTab = tabbrowser.tabContainer.childNodes[index];
			
			// Does this tab contain our custom attribute?
			if (currentTab.hasAttribute(attrName)) {
			
			// Yes--select and focus it.
			//var oldTab = tabbrowser.selectedTab;
			tabbrowser.selectedTab = currentTab;
			
			// Focus *this* browser window in case another one is currently focused
			tabbrowser.ownerDocument.defaultView.focus();
			
			// if the tab's location contains "stretchclock.com/stretch", or "gildnes.com/stretchclock.com"
			var tabLocation = tabbrowser.contentWindow.location;
			if ((tabLocation.toString().search(/stretchclock\.com\//i) > 0)
				|| (tabLocation.toString().search(/gildnes\.com\/stretchclock\.com/i) > 0)) {
				tabbrowser.contentWindow.location = url;
				found = true;		  			  
		  	}
		}
	  }
	
	  if (!found) {
	    // Our tab isn't open. Open it now.
	    var browserEnumerator = wm.getEnumerator("navigator:browser");
	    var tabbrowser = browserEnumerator.getNext().gBrowser;
	  
	    // Create tab
	    var newTab = tabbrowser.addTab(url);
	    newTab.setAttribute(attrName, "xyz");
	  
	    // Focus tab
	    tabbrowser.selectedTab = newTab;
	    
	    // Focus *this* browser window in case another one is currently focused
	    tabbrowser.ownerDocument.defaultView.focus();
	  }
	},
	
	updateDisplay: function(newText)	{
		var isPaused = com_StretchClock_Fox.prefs.getBoolPref("paused");
		var sNewText = newText.toString();
		if (sNewText == '')	{
			if (com_StretchClock_Fox.isSleeping())	{	sNewText = "sleeping";	}
			else if (isPaused)	{   sNewText = "paused";	}
			else if	(parseInt(com_StretchClock_Fox.minutesToNextStretch()) < 1)	{ sNewText = 'stretch now';}
			else 	{sNewText = com_StretchClock_Fox.minutesToNextStretch() + ' minutes';}
		}
		try	{
			document.getElementById('SCF__menu_display').setAttribute("label", sNewText);
		}
		catch(e)	{
			console.log('update com_StretchClock_Fox_display failed.' + e.message);
		}

		try	{
			document.getElementById('com_StretchClock_Fox_display').setAttribute("value", sNewText);						
		}
		catch(e)	{
			console.log('update com_StretchClock_Fox_display failed.' + e.message);
		}
		try	{
		document.getElementById('SCF__toolbar_display').setAttribute("value", sNewText);
		}
		catch(e)	{
			console.log('update SCF__toolbar_display failed.' + e.message);
			// display is probably hidden;
		}
	},
	
	paintPauseButton: function()	{
		var isPaused = com_StretchClock_Fox.prefs.getBoolPref("paused");
		if (isPaused)	{
			document.getElementById('btn_pause').className = 'pause_on';
			document.getElementById('SCF__menu_pause').setAttribute("label", 'resume');
								
		}
		else	{
			document.getElementById('btn_pause').className = 'pause_normal';		
			document.getElementById('SCF__menu_pause').setAttribute("label", 'pause');
		}
		
	},
	
	paintStretchButton: function()	{
		var isPaused = com_StretchClock_Fox.prefs.getBoolPref("paused");
		if ((parseInt(com_StretchClock_Fox.minutesToNextStretch()) < 1) && !isPaused && !isSleeping())		{
			document.getElementById('btn_stretch').className = 'btn_stretch_anim';					
		}
		else	{
			document.getElementById('btn_stretch').className = 'btn_stretch_normal';		
		}
		
	},
	
	pauseDisplay: function()	{	
		//change the pause button to ON
		document.getElementById('btn_pause').className = 'pause_on';
		document.getElementById('btn_stretch').className = 'btn_stretch_normal';
		com_StretchClock_Fox.paintStretchButton();
	},
	
	pauseClock: function()	{
		// user is pausing, so go to sleep
		// calculate how much time there is left until next stretch
		var timeNow = new Date();
		var timeNext = com_StretchClock_Fox.prefs.getCharPref("time_next_stretch");
		var nextStretch =  parseInt(timeNext) - parseInt(timeNow.valueOf());
		var strNextStretch = nextStretch.toString();
		// save the amount of time until next stretch
		com_StretchClock_Fox.prefs.setCharPref("time_remaining_when_paused", strNextStretch);
		
		// set the pref to paused
		com_StretchClock_Fox.paused = true;
		com_StretchClock_Fox.prefs.setBoolPref("paused", true);

		//repaint
		com_StretchClock_Fox.updateDisplay('');
		com_StretchClock_Fox.paintPauseButton();

	},

	unpauseClock: function()	{
		// stretchclock is waking up from pause
		var timeNow = new Date();
		var timeNext = com_StretchClock_Fox.prefs.getCharPref("time_remaining_when_paused");
		var nextStretch = parseInt(timeNow.valueOf()) + parseInt(timeNext);
		var strNextStretch = nextStretch.toString();
		com_StretchClock_Fox.prefs.setCharPref("time_next_stretch", strNextStretch);
		// set pref to not paused
		com_StretchClock_Fox.paused = false;
		com_StretchClock_Fox.prefs.setBoolPref("paused", false);		
		
		//repaint
		com_StretchClock_Fox.updateDisplay('');
		com_StretchClock_Fox.paintPauseButton();		
	},

	unpauseDisplay: function()	{
		//change the pause button to Normal
		document.getElementById('btn_pause').className = 'pause_normal';
		com_StretchClock_Fox.paintStretchButton();
	},

	togglePause: function()	{		
		var isPaused = com_StretchClock_Fox.prefs.getBoolPref("paused");
		if (isPaused)	{
			// user is unpausing
			com_StretchClock_Fox.unpauseClock();
		}
		else	{
			// user is pausing
			com_StretchClock_Fox.pauseClock();
		}
	},	
	playReminder: function() {
		try	{
			
		var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var url1 = ioService.newURI("chrome://stretchclock/skin/reminder.wav", null, null);
		var sound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
		sound.play(url1);		
		}		
		catch(e)	{
//			alert(e);
		}
	},

	openPreferences : function() {
	  if (null == com_StretchClock_Fox._preferencesWindow || com_StretchClock_Fox._preferencesWindow.closed) {
		features = "chrome,titlebar,toolbar,centerscreen,dialog=yes,alwaysRaised";
		com_StretchClock_Fox._preferencesWindow =
		  window.openDialog(
			"chrome://stretchclock/content/settings.xul",
			"stretchclock-preferences-window", features);
	  }
	  com_StretchClock_Fox._preferencesWindow.focus();
	},

	showToolbarDisplay: function()	{
		// Get the toolbaritem "container" that we added to our XUL markup
		var container = document.getElementById("SCF__toolbaritem_display");
		
		// Remove all of the existing buttons
		for(i=container.childNodes.length; i > 0; i--) {
			container.removeChild(container.childNodes[0]);
		}
		
		var show = (document.getElementById("SCF__checkbox_showdisplay").getAttribute("checked") == "true");		
		if(show)	{
			var display = null;
			display = document.createElement("textbox");
			display.setAttribute("id", "SCF__toolbar_display");
			display.setAttribute("class", "SCF__toolbar_display");
			display.setAttribute("disabled", "true");
			display.setAttribute("value", com_StretchClock_Fox.minutesToNextStretch() + ' minutes');			
			container.appendChild(display);				
		}
	},
	
	isSleeping: function ()   {
        // this function uses short circuit to return immediately when it knows the answer

        // if the schedule is not enabled then return false
        if (com_StretchClock_Fox.prefs.getBoolPref("enable_schedule") == false)   { return false; }

        // get current day of week
        var d = new Date();
        var dow = d.getDay();

        // If Stretch on (today) is not checked then return true
        if (com_StretchClock_Fox.prefs.getBoolPref("stretch_on_" + dow.toString()) == false)      {return true;}  

        // get the "on time" for today
        var on_hour = com_StretchClock_Fox.prefs.getCharPref("hour_on_" + dow);
        var on_min = com_StretchClock_Fox.prefs.getCharPref("min_on_" + dow);
        var on_ampm = com_StretchClock_Fox.prefs.getCharPref("ampm_on_" + dow);
        var on_time = new Date(d.toDateString() + ' ' + on_hour + ':' + on_min + ' ' + on_ampm);

        // get the "off time" for today
        var off_hour = com_StretchClock_Fox.prefs.getCharPref("hour_off_" + dow);
        var off_min = com_StretchClock_Fox.prefs.getCharPref("min_off_" + dow);
        var off_ampm = com_StretchClock_Fox.prefs.getCharPref("ampm_off_" + dow);
        var off_time = new Date(d.toDateString() + ' ' + off_hour + ':' + off_min + ' ' + off_ampm);

        if (on_time.getTime() == off_time.getTime()) {return true;}
        
        if (off_time.getTime() > on_time.getTime())  {
                // day shift				
                if ((d.getTime() > on_time.getTime()) &&  (d.getTime() < off_time.getTime())) {return false;							}
                else {return true};
        }                       
        else    { 
                // graveyard shift
                if ((d.getTime() > off_time.getTime()) && (d.getTime() < on_time.getTime())) {return true;}
                else {return false}
        }
        // actually we should never make it here.
        return false;   
	},
	
	showHideAddonbar:	function(showhide)	{
		showhide = com_StretchClock_Fox.prefs.getBoolPref("show_addonbar");
		document.getElementById("stretchclock-panel").setAttribute("hidden", !showhide);							
		showhide && document.getElementById("addon-bar").setAttribute("hidden", false); 							
	}
}

// Install load and unload handlers
window.addEventListener("load", function(e) { com_StretchClock_Fox.startup(); }, false);
window.addEventListener("unload", function(e) { com_StretchClock_Fox.shutdown(); }, false);
