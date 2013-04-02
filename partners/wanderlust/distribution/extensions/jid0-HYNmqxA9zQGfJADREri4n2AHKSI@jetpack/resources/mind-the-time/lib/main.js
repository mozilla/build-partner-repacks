/* ***** BEGIN LICENSE BLOCK ***** 

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this file,
You can obtain one at http://mozilla.org/MPL/2.0/.
 
Some of the code in this "main.js" file is Original Code from the 
"LeechBlock" Add-on for Firefox (v. 0.5.2), which is licensed under 
the Mozilla Public License Version 1.1

The Initial Developer of this Original "LeechBlock" Code is James Anderson. 
Portions created by the Initial Developer are Copyright (C) 2007-2008
the Initial Developer. All Rights Reserved.

The Original "LeechBlock" (v. 0.5.2) Code is available here:
https://addons.mozilla.org/en-US/firefox/addon/leechblock/

Under the terms of the Mozilla Public License Version 2.0, Paul Morris 
adapted and revised portions of the Original "LeechBlock" (v. 0.5.2)
Code (primarily parts related to tracking time spent at a given domain), 
that can now be found below in this "main.js" file, to create a "Larger Work," 
namely this "Mind the Time" Add-on for Firefox.

Portions created by Paul Morris are Copyright © 2011-2012 Paul Morris. 
All Rights Reserved. 

Contributor(s): Paul Morris. 

***** END LICENSE BLOCK ***** */

exports.main = function() {};
const data = require("self").data;
const timers = require("timers");
const privateBrowsing = require("private-browsing");
const stor = require("simple-storage");
const tabs = require("tabs");
const windows = require("windows").browserWindows;
const pageMod = require("page-mod");
const urlModule = require("url");
const notifications = require("notifications");
const sprf = require("simple-prefs");
const iconURL = data.url("hourglassicon.png");
const addonPage = require("addon-page");

const { MatchPattern } = require("match-pattern");
const URL_http_https_ftp = new MatchPattern("*"); 
const URL_summaryPage = new MatchPattern("resource://jid0-hynmqxa9zqgfjadreri4n2ahksi-at-jetpack/mind-the-time/data/index.html"); 

var timingStartStamp = null;
var currURL = null;
var summaryWorker;

var showSecsPref = false;

var timeOut; // holds the timeout for idle user

var whitelist = false; // false when needs to be (re)parsed from pref, null when empty, else an array 

if (stor.storage.timerMode == undefined) { stor.storage.timerMode = 1; }

if (stor.storage.nextAlertAt == undefined) { 
    stor.storage.nextAlertAt = sprf.prefs.reminderRatePref*60; 
}

// pref change listeners etc.

function onReminderRateChange() {
    var rateSecs = sprf.prefs.reminderRatePref*60;
    stor.storage.nextAlertAt = stor.storage.mdata[0][0] + ( rateSecs - (stor.storage.mdata[0][0] % rateSecs) );
}
sprf.on("reminderRatePref", onReminderRateChange);


function onWhiteListChange() { 
    // console.log("white list changed");
    whitelist = false;
}
sprf.on("whiteListPref", onWhiteListChange);


// simple-prefs "delete data" button handler
sprf.on("deleteData", function() {
    for (i=0; i<9; i++) {
        stor.storage.mdata[i][0] = 0;
        stor.storage.dmns[i].length = 0;
        MTT_updateTicker(0);
    }
    try{summaryWorker.port.emit("loadData-A2", stor.storage.dmns[0], stor.storage.mdata[0] ) }
    catch(e){ }
});


// internal "data-storage" version
// lets you make changes to data storage and 
// convert existing installations to new format if needed 
// 
if (stor.storage.MTTvsn != "BBB") {
    stor.storage.dmns = []; 
    for (i=0; i<9; i++) {
        stor.storage.dmns[i] = [];
    }
    var d = new Date();
    if (d.getHours() < 4) {
        d = new Date(d.getTime()-86400000);  // 86,400,000 millisecs in a day 
    }
    stor.storage.mdata = []; 
    // mdata[0][ total-seconds, days-since-1-1-1970, headertext, weekday-number, month-number, date-number, dateObject ]
    stor.storage.mdata[0] = [ 0, Math.floor(d.getTime() / 86400000), MTT_getHeader(d), d.getDay(), d.getMonth()+1, d.getDate(), d  ];  
    
    for (i=1; i<9; i++) {
        stor.storage.mdata[i] = [ 0, null, null, null, null, null, null ];
    }
    stor.storage.MTTvsn = "BBB";
    
    // data for debugging (goes here) 
}

// White list handling  

function MTT_parseWhiteListPref(){
    whitelist = sprf.prefs.whiteListPref.split(',');
    // trim whitespace and delete empties
    for (i=0, len=whitelist.length; i<len; i++ ) {
        // trims whitespace
        whitelist[i] = whitelist[i].trim();
        // delete empties
        if (whitelist[i].length == 0) {
            whitelist.splice(i, 1);
            len--;
            i--;
        }
        else {
            // remove sub-directories or trailing slashes, add http when missing
            try{
                whitelist[i] = MTT_domainFromURL(whitelist[i]);
            }
            catch(e) {
                whitelist[i] = "http://" + whitelist[i];
                try{
                    whitelist[i] = MTT_domainFromURL(whitelist[i]);
                }
                catch(e) { // die gracefully
                }
            }
        }
    }
    // overwrite the pref with the reformatted string
    sprf.prefs.whiteListPref = whitelist.join(", ");
    // console.log("parsed whitelist: " + whitelist);   
}

function MTT_inWhiteList(theURL) {
    if (whitelist == false) {
        MTT_parseWhiteListPref();
    }    
    // console.log("Checking for: " + currURL + "  In: " + whitelist);

    if (whitelist == null) {
        return false;
    }
    for (i=0, len=whitelist.length; i<len; i++ ) {
        if (currURL == whitelist[i]) {
            // console.log("it's in the list!");
            return true;
        }
    }
    return false;
}


// time-tracking events/inputs

windows.on('close', function(window){
    MTT_clockTime(false);
});

tabs.on('deactivate', function(tab) {
    MTT_clockTime(false);
});

tabs.on('activate', function(tab) {  
    // normal site tabs
    if( URL_http_https_ftp.test(tab.url) == true ) {
        currURL = MTT_domainFromURL(tab.url); 
        MTT_clockTime(true);
    }
    // summary page tab
    else if (URL_summaryPage.test(tab.url) == true) {
        // ticker.port.emit("tickerOff"); // no longer needed since no longer shown
        MTT_updateTicker();
        try{ summaryWorker.port.emit('getPref', "autoRefreshPref", sprf.prefs.autoRefreshPref); }
        catch (e) { console.log(e) }
		
		if (sprf.prefs.autoRefreshPref == true) {
	        try { summaryWorker.port.emit("loadData-A0"); }
	        catch (e) { console.log(e) }
		}
    } 
});

// sets up worker for webpage.js, which is attached by the pagemod below
//
var MTT_setUpWebpagejs = function(worker) {

    worker.port.on("focusOn", function() {    
        currURL = MTT_domainFromURL(tabs.activeTab.url); 
        MTT_clockTime(true); 
    });
    worker.port.on("focusOff", function() {
        MTT_clockTime(false);
    });
    worker.port.on("activity", function() {
        MTT_clockTime(false); 
        currURL = MTT_domainFromURL(tabs.activeTab.url); 
        MTT_clockTime(true);
        MTT_checkForDateChange();
        worker.port.emit("addListeners");
    });
};

// handles page focus/blur and user activity 
// a pageMod that adds script to webpages to listen for those time-tracking events
//
pageMod.PageMod({
    include: ['*'] ,
    contentScriptFile: data.url("webpage.js"),
    contentScriptWhen: 'end',
    attachTo: ["existing", "top", "frame"],
    onAttach: function(worker) {
        MTT_setUpWebpagejs(worker);
    }
});


// handling time-tracking events

function MTT_clockTime(switchOn) {    
    
    // just return if not logging for some reason
    if (privateBrowsing.isActive || stor.storage.timerMode == 3 ) { 
        return;
    }
    if (MTT_inWhiteList(currURL) == true) {
        MTT_updateTicker(0);
        return;
    }

    var moreSeconds = 0; 
    var timeOutSecs = 75000; // 75 seconds
    timers.clearTimeout(timeOut);

    // if switching on, un-grey-out the ticker, and set a starting time stamp
    if (switchOn) { 
        if (URL_http_https_ftp.test(tabs.activeTab.url) === true) { 
            ticker.port.emit("tickerOn");
        }
        if (timingStartStamp === null) { 
        	timingStartStamp = Date.now();
		}
	} 
    // else switching off, so grey-out the ticker, and calculate how many seconds have passed,
    // don't log more seconds than the idle timeout (timeOutSecs), and reset the timingStartStamp.
    else {  
        ticker.port.emit("tickerOff");
        if (timingStartStamp !== null) {
            moreSeconds = Math.round((Date.now() - timingStartStamp) / 1000);
            if (moreSeconds > (timeOutSecs / 1000) && stor.storage.timerMode == 1 ) {  
                moreSeconds = (timeOutSecs / 1000); 
            }
            timingStartStamp = null; 
		}
	}

    // check if domain is already logged, and log it if needed
    var ndex = MTT_indexOf(stor.storage.dmns[0], currURL);

	if ( ndex == -1 ) {  
        stor.storage.dmns[0].push( [currURL, 0] );  
        ndex = (stor.storage.dmns[0].length - 1); 
    }
    
    // add any additional seconds to logs
	if (moreSeconds > 0) {		
        stor.storage.dmns[0][ndex][1] += moreSeconds
        stor.storage.mdata[0][0] += moreSeconds;
	}
    
    if (switchOn) {
        MTT_updateTicker( stor.storage.dmns[0][ndex][1]  ); 
        
        // re-start idle timeout
        if (stor.storage.timerMode == 1) {
            timeOut = timers.setTimeout( function() {
                if (URL_http_https_ftp.test(currURL) == true) { 
                    MTT_clockTime(false);
                    MTT_updateTicker( stor.storage.dmns[0][ndex][1]  );
                }
            }, timeOutSecs ); 
        }  

        // messages
        if (stor.storage.mdata[0][0] >= stor.storage.nextAlertAt && sprf.prefs.showRemindersPref == true && sprf.prefs.reminderRatePref > 0 ) {
            if (sprf.prefs.notificationsPref == true) {
                mPanel.port.emit('alert', MTT_formatTime(stor.storage.mdata[0][0]) , false );
                mPanel.show();
            } 
            else {
                notifications.notify({
                  title: MTT_formatTime(stor.storage.mdata[0][0]) + " - Mind the Time",
                  iconURL: iconURL // ,
                  // text: "Time spent on the web so far today.",
                  // onClick: function() { openSummary() } 
                }); 
            }
            
            var rateSecs = sprf.prefs.reminderRatePref*60;
            stor.storage.nextAlertAt = stor.storage.mdata[0][0] + ( rateSecs - (stor.storage.mdata[0][0] % rateSecs) );
            // stor.storage.nextAlertAt = stor.storage.mdata[0][0] + rateSecs;    
        }     
    } 
}


function MTT_checkForDateChange() {
    var d = new Date();        
    if (stor.storage.mdata[0][5] != d.getDate()) {
        if  (d.getHours() > 3 || ( Math.floor(d.getTime() / 86400000) ) - stor.storage.mdata[0][1] > 1 ) {   
            MTT_newDay();
        }
    }
}

// function to return the index of a given value in a given multi-level array
function MTT_indexOf(array, query) {
    for (i=0, len=array.length; i<len; i++) {
        if (array[i][0] == query) {
            return i;
        }
    }
    return -1;
}

// updates the time shown in the ticker
function MTT_updateTicker(secsHere) {      
    if (privateBrowsing.isActive) {
        ticker.port.emit("updateTicker", "0:00 / 0:00");
    } 
    else if (secsHere == null) {
        ticker.port.emit("updateTicker", "0:00 / " + MTT_formatTime(stor.storage.mdata[0][0]) );   
    } 
    else {
        ticker.port.emit("updateTicker", MTT_formatTime(secsHere) + " / " + MTT_formatTime(stor.storage.mdata[0][0]) );       
    }
};

// return focus to the page, ugh.
function MTT_focusActivePage(){
    if ( URL_http_https_ftp.test(tabs.activeTab.url) == true ) {
        tabs.activeTab.attach({
            contentScript: 'window.focus()'
        });
    }
}

// Ticker Panel (tPanel.html)
var tPanel = require("panel").Panel({
    width:200,
    height:270,
    contentURL: data.url("tPanel.html"),
    onShow: function() { MTT_focusActivePage() },
    onHide: function() { MTT_focusActivePage() }
});

tPanel.port.on("panelClicked", function() {
    tPanel.hide();
});

tPanel.port.on("timerModeChange", function(mode) {
    ticker.port.emit("updateMode", mode);
    stor.storage.timerMode = mode;
    tPanel.hide();
});

tPanel.port.on("openSummary", function() {
    tPanel.hide();
    openSummary();
});

// open summary page or go to it if already open
function openSummary() {
    var winlen = windows.length;
    for (i=0; i<winlen; i++) {
        var tabslen = windows[i].tabs.length;        
        for (j=0; j<tabslen; j++) {
            if (windows[i].tabs[j].url == "resource://jid0-hynmqxa9zqgfjadreri4n2ahksi-at-jetpack/mind-the-time/data/index.html" ) {
                windows[i].activate();
                windows.activeWindow.tabs[j].activate();
                return
            }
        }
    }    
    tabs.open(data.url("index.html"));
};


// sets up worker for index.js (summary page), attached by pagemod below
var MTT_setUpSummaryjs = function(worker) {

    summaryWorker = worker;

    summaryWorker.port.on('loadData-A1', function() {
        MTT_checkForDateChange();
        stor.storage.dmns[0] = MTT_cleanUpData( stor.storage.dmns[0] );
        stor.storage.dmns[0].sort(function(a,b) { return b[1] - a[1] } );
        summaryWorker.port.emit("loadData-A2", stor.storage.dmns[0], stor.storage.mdata[0] ); 
    });

    summaryWorker.port.on('loadData-B1', function() {
        summaryWorker.port.emit("loadData-B2", stor.storage.dmns, stor.storage.mdata );    
    });
    
    summaryWorker.port.on('goToPrefs', function() {
        tabs.open("about:addons");
    });
    
    summaryWorker.port.on('getPref', function(prefName) {
        if (prefName == "autoRefreshPref") {
            summaryWorker.port.emit('getPref', "autoRefreshPref", sprf.prefs.autoRefreshPref);
        }
    });
    
    /*
    summaryWorker.port.on('newDay', function() {
        MTT_newDay();
        summaryWorker.port.emit("loadData-A2", stor.storage.dmns[0], stor.storage.mdata[0] ); 
    });
    */
};

// pageMod to add script to summary page (index.html)
pageMod.PageMod({
    include: data.url("index.html"),
    contentScriptFile: data.url("index.js"), 
    contentScriptWhen: 'end',
    onAttach: function(worker) {
        MTT_setUpSummaryjs(worker);
    }
});



// Message Panel (mPanel.html)
var mPanel = require("panel").Panel({
    width: 300,
    height: 150,
    contentURL: data.url("mPanel.html"),
    onShow: function() { MTT_focusActivePage() },
    onHide: function() { MTT_focusActivePage() }
});

mPanel.port.on("alertClicked", function() {
    mPanel.hide();
});


// Ticker Widget (ticker.html)
var ticker = require("widget").Widget({
    id: "ticker",
    label: "Mind the Time", 
    contentURL: data.url("ticker.html"),
    width: 92, // 96
    tooltip: "h:mm / h:mm", 
    panel: tPanel
});

ticker.port.on("getTimerMode", function(){
    ticker.port.emit("updateMode", stor.storage.timerMode);
});

// Time formatter
function MTT_formatTime(time) {
    time = Math.abs(time);
    var h = Math.floor(time / 3600);
    var m = Math.floor(time / 60) % 60;     
    if (showSecsPref == false) {
        return ((h<1)   ?   "0:"    :  h+":"  )  
        	 + ((m<10)  ?   ((m<1)   ?   "00"  :  "0"+m  )      :  m );    
    }
    else {          
        var s = Math.floor(time) % 60; 
        return ((h<1)   ?   "0:"    :  h+":"  )  
    		 + ((m<10)  ?   ((m<1)   ?   "00:"  :  "0"+m+":"  )      :  m+":" )
             + ((s<10)  ?   ((s<1)   ?   "00"  :  "0"+s  )      :  s );         
    }
}

// Domain extractor
function MTT_domainFromURL(theUrl) {
    var urlObj = urlModule.URL(theUrl);
    return urlObj.scheme + "://" + urlObj.host;
}

// New day handler
function MTT_newDay() {
    stor.storage.dmns[0].sort(function(a,b) { return b[1] - a[1] } );
    stor.storage.dmns[0] = MTT_cleanUpData( stor.storage.dmns[0] );
    
    // shift data from one day to the next
    for (i=7; i>0; i--) {
        stor.storage.dmns[i] = stor.storage.dmns[i-1].slice(); 
        stor.storage.mdata[i] = stor.storage.mdata[i-1].slice();  
    }
    
    // initialize new date
    stor.storage.dmns[0].length = 0;
    var d = new Date();
    stor.storage.mdata[0] = [ 0, Math.floor(d.getTime() / 86400000), MTT_getHeader(d), d.getDay(), d.getMonth()+1, d.getDate(), d  ];
    
    // new weekly summary
    stor.storage.mdata[8] = [0, null, null, null, null, null, null];
    stor.storage.dmns[8].length = 0;
    
    // only needed if more than 1 day
    if (stor.storage.mdata[1][0] > 0 ||  
        stor.storage.mdata[2][0] > 0 || 
        stor.storage.mdata[3][0] > 0) { 
            
        for (i=1; i<8; i++) {
        
            // only include a day if it's in the past week
            if (stor.storage.mdata[i][1] >= stor.storage.mdata[0][1]-7) {
                stor.storage.mdata[8][0] += stor.storage.mdata[i][0];
                var len = stor.storage.dmns[i].length;
                for (j=0; j<len; j++) {
                    stor.storage.dmns[8].push( stor.storage.dmns[i][j].slice() );
                }
            }
        }        
        
        // sort, combine and then delete duplicates 
        stor.storage.dmns[8].sort();
        var len = stor.storage.dmns[8].length;
        for (i=0; i<len; i++) {
            if (stor.storage.dmns[8][i+1] != undefined && stor.storage.dmns[8][i][0] == stor.storage.dmns[8][i+1][0] ) {
                stor.storage.dmns[8][i][1] += stor.storage.dmns[8][i+1][1];
                stor.storage.dmns[8].splice(i+1,1);
                i--;
            }
        }
        
        // sort again and add header
        stor.storage.dmns[8].sort(function(a,b) { return b[1] - a[1] } );
        var weekAgo = new Date((stor.storage.mdata[1][1]-5) * 86400000);
        stor.storage.mdata[8][2] = "Past Week   " + (weekAgo.getMonth()+1) + "/" + weekAgo.getDate() + " - " + stor.storage.mdata[1][4] + "/" + stor.storage.mdata[1][5];
    }
    
    // reset alert messages
    stor.storage.nextAlertAt = (sprf.prefs.reminderRatePref*60);
}

// generates headers for use on summary page
function MTT_getHeader(d) {
    var dayname;
    switch (d.getDay()) {
        case 0: dayname="Sunday";    break;
        case 1: dayname="Monday";    break;
        case 2: dayname="Tuesday";   break; 
        case 3: dayname="Wednesday"; break;
        case 4: dayname="Thursday";  break;
        case 5: dayname="Friday";    break;
        case 6: dayname="Saturday";  break;
    }     
    var header = dayname + "   " + (d.getMonth()+1) + "/" + d.getDate() ;
    return header;
}

// clean up data, for new day 
function MTT_cleanUpData(dmnsX) {
    var len = dmnsX.length;
    for (i=0; i<len; i++) {
        if ( dmnsX[i] != undefined && ( dmnsX[i][1] == 0 || URL_http_https_ftp.test(dmnsX[i][0]) == false ) ) {   // dmnsX[i][0] == null
            dmnsX.splice(i, 1);
            i--; 
        }
    }
    len = dmnsX.length;
    return dmnsX;
}

// private browsing, clear ticker value
privateBrowsing.on("start", function() {
    MTT_updateTicker(0);
});