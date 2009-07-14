/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
/**
YLogger for FireFox extensions.
* @class
*/
var CI = Components.interfaces;
var CC = Components.classes;
var loader = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);             
var gConfigFilePath = "file://"+__LOCATION__.parent.path+"/extconfig.js";
loader.loadSubScript(gConfigFilePath);
function YLogFormatter() {
}
YLogFormatter.prototype = {
    format : function (level, msg,stacktrace) {     
        var dt = new Date();
        var lmsg = "[" + dt.getTime()+"]";
        //"[" + dt.substr(dt.indexOf(", ") + 2)+"]";       
        if (level !== null) {
            lmsg += "[" + level + "]";
        }
        lmsg += msg + "\n" ;
        if (stacktrace !== null) {
            lmsg +=  stacktrace;
        }
        return lmsg;
    },
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(CI.nsIYLogFormatter ) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }        
        return this;
    }
};
function LogCSVFormatter() {
}
LogCSVFormatter.prototype = {
	mRegToReplace : new RegExp('"',"g")
	,
    format : function (level, msg,stacktrace) {
    	if (level === null) {
         	level = "No Level";   
        }
        var dt = new Date();
        var lmsg =  + dt.getTime()+"," + level +",\"" + msg +"\"";
        if (stacktrace !== null) {
            lmsg +=  stacktrace;
        }
        return lmsg;
    },
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(CI.nsIYLogFormatter ) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }        
        return this;
    }
};
function YLogConsoleAppender() {
    this.console = CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);
}
YLogConsoleAppender.prototype = {
    name : null,
    console : null,
    init : function(modulename) {
        this.name = modulename;
    },
    append : function(msg) {
        var dt = new Date().toLocaleString();
        var message = "[" + dt.substr(dt.indexOf(", ") + 2)+"]\n" + msg;
        this.console.logStringMessage(message);
    },
    flush : function() {
        //NO-OP. Logs are not buffered for console
        return;
    },
    shutdown : function() {
        //NO-OP.
        return;
    },
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(CI.nsIYLogAppender) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }        
        return this;
    }
};
function YLogger() {
    try {
        //TODO: Expose adding appenders dynamically.
        this.appenders = [];        
        this.formatter = new LogCSVFormatter();// CC[YahooExtConfig.mProgID+"/ylogformatter;1"].createInstance(CI.nsIYLogFormatter);        
        this.init(YahooExtConfig.mName);
        this.setLoggingLevel(this.YMLog_All);                
        this.registerLogAppender(CC["@yahoo.com/ylogfileappender;1"].createInstance(CI.nsIYLogAppender));        
        var str =  "**** System Info ****" ; 
        try {
            var proto = CC["@mozilla.org/network/protocol;1?name=http"].getService(CI.nsIHttpProtocolHandler);        
            var em = CC["@mozilla.org/extensions/manager;1"].getService(CI.nsIExtensionManager); 
            var item = em.getItemForID("{635abd67-4fe9-1b23-4f01-e679fa7484c1}");
                str += "\nUser Agent :" + proto["userAgent"] +
                "\nToolbar Version:" + item.version;            
            var pref = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);
            if (pref.prefHasUserValue ("yahoo.debug.console") && pref.getBoolPref("yahoo.debug.console")) {        
                this.registerLogAppender(CC["@yahoo.com/ylogconsoleappender;1"].createInstance(CI.nsIYLogAppender));
            }
        } catch (e) {        
        }        
        this.diagnose(str);
    } catch (e) {     
    }
}
YLogger.prototype = {
    YMLog_All : 0x0,
    YMLog_Debug : 0x1,
    YMLog_Info : 0x2,
    YMLog_Warn : 0x3,
    YMLog_Error : 0x4,
    YMLog_Fatal : 0x5,
    YMLog_Diagnose : 0x6,
    appenders : [],
    formatter : null,    
    count : 0,
    level : 0,
    mEnableStackTrace : false,
    mName : "Logger",
    init : function(name) {
        this.mName = name;        
    },
    registerLogAppender : function(appender) {
        this.appenders.push(appender);
        appender.init(this.mName);
    }
    ,
    getName : function() {
        return this.mName;
    },
    log : function(level, msg) {        
        if (this.isEnabledFor(level)) {
            var stacktrace = null; 
            if (this.mEnableStackTrace) {
                stacktrace = this.stackTrace();
            }
            var formattedmsg = this.formatter.format(this.getLevelString(level), msg, stacktrace);
            for (appender in this.appenders) {
                try {
                    this.appenders[appender].append(formattedmsg);
                } catch(e) {
                }
            }
            this.count++;
        }        
        //For Warn and above levels flush during each logging.
        if ((level >= this.YMLog_Warn) || this.count > 5) {
            this.flush();
            this.count = 0;
        }
    },
    diagnose : function(msg) {
        this.log(this.YMLog_Diagnose, msg);
    }
    ,
    debug : function(msg) {
        this.log(this.YMLog_Debug, msg);
    },
    info : function(msg) {
        this.log(this.YMLog_Info, msg);
    },
    warn : function(msg) {
        this.log(this.YMLog_Warn, msg);
    },
    error : function(msg) {
        this.log(this.YMLog_Error, msg);
    },
    fatal : function(msg) {
        this.log(this.YMLog_Fatal, msg);
    },    
    setLoggingLevel : function(level) {
        this.level = level;
    },
    enableStackTrace : function() {
        this.mEnableStackTrace = true;
    },
    disableStackTrace : function() {
        this.mEnableStackTrace = false;
    },
    getLoggingLevel : function() {
        return this.level;
    },
    isDebugEnabled : function() {
        //FIXME: For testing;
        return this.isEnabledFor(this.YMLog_Debug);
        //return true;
    },
    isInfoEnabled : function() {
        return this.isEnabledFor(this.YMLog_Info);
    },
    isWarnEnabled : function() {
        return this.isEnabledFor(this.YMLog_Warn);
    },
    isErrorEnabled : function() {
        return this.isEnabledFor(this.YMLog_Error);
    },
    isFatalEnabled : function() {
        return this.isEnabledFor(this.YMLog_Fatal);
    },
    isEnabledFor : function(level) {
        return this.level <= level;
    },
    flush : function() {
        for (appender in this.appenders) {
            this.appenders[appender].flush();
        }
    },
    shutdown : function() {
        for (appender in this.appenders) {
            this.appenders[appender].shutdown();
        }
    },
    getLevelString : function(level) {
        var ret = "";
        switch(level) {
            case this.YMLog_Debug : 
                ret = "Debug";
                break;
            case this.YMLog_Info :
                ret = "Info";
                break;
            case this.YMLog_Warn :
                ret = "Warn";
                break;
            case this.YMLog_Error :
                ret = "Error";
                break;
            case this.YMLog_Fatal :
                ret = "Fatal";
                break;
            case this.YMLog_Diagnose :
                ret = "Diagnose";
                break;
        }
        return ret;
    },
    /** Utility function to get the stack trace
    * @param int [num] , the number of call stacks need to be traversed Default value is 999
    */
    stackTrace : function(num) {    
        num = num || 999;
        var trace = "";
        var caller = Components.stack.caller;
        caller = caller.caller.caller; // Removing the redundant logging call in the stack trace;
        try {
            while(caller && num > 0) {              
                if (caller.filename) {
                    var fileName = caller.filename;
                    if (fileName.indexOf("chrome") != 0 ) {
                        fileName = fileName.substr(fileName.indexOf("extensions"))
                    }
                    trace += "\n" + fileName +":" +caller.lineNumber;
                }
                num--;
                caller = caller.caller;
            }
        } catch (e) {
        }   
        return trace;
    },   
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(CI.nsIYLogger) && !iid.equals(CI.nsISupports) && !iid.equals(CI.nsIRunnable)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }        
        return this;
    }
};
function debug(message) {
    var console = CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);         
   var d = new Date();
   var time = "Logger :"+d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds();
   console.logStringMessage(time + ": " + message);   
}
var Module = {                        
    mObjects :[] ,        
    mFirstTime: true,
    registerSelf : function (compMgr, fileSpec, location, type) {  
        if (this.mFirstTime) {
            this.mFirstTime = false;
            throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
        }
        compMgr = compMgr.QueryInterface(CI.nsIComponentRegistrar);   
        for (var idx = 0; idx < this.mObjects.length; idx++) {
            var obj = this.mObjects[idx];
            compMgr.registerFactoryLocation(obj.mCID, obj.mName, obj.mProgID, fileSpec, location, type);
            debug("Registered ["+obj.mProgID+"]---> "+ obj.mCID);
        }        
    },
    getClassObject : function (compMgr, cid, iid) {       
        try {
            if (!iid.equals(CI.nsIFactory) ) {
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED; 
            }      
            for (var idx =  0; idx < this.mObjects.length; idx++) {    
                if (cid.equals(this.mObjects[idx].mCID)) {
                   return this.mObjects[idx].mFactory;            
                }            
            } 
            throw Components.results.NS_ERROR_NO_INTERFACE;
        } catch (e) {  
            debug(e);
            throw e;
        }
    },        
    canUnload : function(compMgr) { return true; }
};
function NSGetModule(compMgr, fileSpec) {
    Module.mObjects.push( {
        mCID   : Components.ID("{43E76C2E-603D-4bf4-99CC-BAB4C289E4B7}"),      
        mProgID : YahooExtConfig.mProgID+"/ytoolbarlogger;1",
        mName : "Yahoo! Logger",
        mFactory : {
            createInstance : function (outer, iid) {                
                if (outer !== null) {
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                }                          
                return new YLogger().QueryInterface(iid);
            }
        }
    });     
    Module.mObjects.push( {
        mCID   : Components.ID("{80A9F3D2-F4A6-470a-82DC-0921BD206F86}"),
        mProgID : YahooExtConfig.mProgID+"/ylogformatter;1",
        mName : "Yahoo! Log Formatter",
        mFactory : {    
            createInstance : function (outer, iid) {
                if (outer !== null) {
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                }                          
                return new YLogFormatter().QueryInterface(iid);
            }
        }
    });        
     Module.mObjects.push( {
        mCID   : Components.ID("{89EFB683-B43B-40d9-B54B-AC8DCBCE4067}"),
        mProgID : YahooExtConfig.mProgID+"/ylogconsoleappender;1",
        mName :  "Yahoo! Log Console Appender",
        mFactory : {    
            createInstance : function (outer, iid) {
                if (outer !== null) {
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                }                          
                return new YLogConsoleAppender().QueryInterface(iid);
            }
        }
    });      
    return Module;
}
