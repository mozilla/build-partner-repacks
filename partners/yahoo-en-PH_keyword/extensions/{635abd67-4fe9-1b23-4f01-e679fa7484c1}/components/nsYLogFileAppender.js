/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
var yahooCI = Components.interfaces;
var yahooCC = Components.classes;
var CC = Components.classes;
var CI = Components.interfaces;
/** 
 * File Appender for YLogger
 */
function debug(message) {
    var console = CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);         
   var d = new Date();
   var time = "Logger :"+d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds();
   console.logStringMessage(time + ": " + message);   
}
function YLogFileAppender() {
    debug(" *********** Appender created********");
}
YLogFileAppender.prototype = {
    buffer : null,
    file : null,
    name : null,
    init : function(modulename) {
        this.name = modulename;
        debug(" ***********File Appender Init********");
    },
    append : function(msg) {
          if (this.buffer === null) {
              this.buffer = "";
          }
          this.buffer += msg;
          this.buffer += '\n';
    },
    flush : function() {
        if (this.buffer !== null) {
            if (this.file === null) {
                this.createLogFile();
            }
            this.file.write(this.buffer, this.buffer.length);
            this.buffer = "";
        }
    },
    shutdown : function() {
        if (this.buffer !== null) {
            this.flush();
        }
        if (this.file !== null) {
            this.file.close();
            this.file = null;
        }
    },
    //getLogFileName : function(isBackUp) {
    //    var name = this.name;
    //    if (isBackUp) {
    //        name = name + "_previous";
    //    }
    //    name = name + ".log";
    //    return name;
    //},
    getLogFileName : function(isBackUp) {
        var name = this.name;
        var d=new Date();
        var weekday=new Array(7);
        weekday[0]="sun";
        weekday[1]="mon";
        weekday[2]="tue";
        weekday[3]="wed";
        weekday[4]="thu";
        weekday[5]="fri";
        weekday[6]="sat";
        // example: ytff.wed.log
        // append the day
        name = name + "." + weekday[d.getDay()];
        // if it is backup, append backup in the file name
        if (isBackUp) {
            name = name + ".bak";
        }
        name = name + ".log";
        return name;
    },
    createLogFile : function() {
        //FIXME: Cache the location once resolved in member variable.
        var componentFile = __LOCATION__;
        var componentDir = componentFile.parent;
        var extensionDir = componentDir.parent;
        logdir = extensionDir.clone().QueryInterface(yahooCI.nsILocalFile);
        logdir.appendRelativePath("logs");
        if (!logdir.exists()) {
            logdir.create(yahooCI.nsILocalFile.DIRECTORY_TYPE, 0777);
        }
        logfile = logdir.clone().QueryInterface(yahooCI.nsILocalFile);
        // initialize the primary log file.(eg: ytff.wed.log )
        logfile.appendRelativePath(this.getLogFileName(false));
        if (logfile.exists() && logfile.fileSize >= 102400) {
            // get handle to backup file.
            var logfile_backup = logdir.clone().QueryInterface(yahooCI.nsILocalFile);
            logfile_backup.appendRelativePath(this.getLogFileName(true));
            // if backup file exists remove it.
            if (logfile_backup.exists()) {
                logfile_backup.remove(false);
            }
            // move primary log file as backup file.
            logfile.moveTo(logdir, this.getLogFileName(true));
            // get a new primary backup file.
            logfile = logdir.clone().QueryInterface(yahooCI.nsILocalFile); 
            logfile.appendRelativePath(this.getLogFileName(false));
        }           
        this.file = yahooCC["@mozilla.org/network/file-output-stream;1"].createInstance(yahooCI.nsIFileOutputStream);
        this.file.init(logfile, 0x02 | 0x08 | 0x10, 0666, 0);
    },
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(yahooCI.nsIYLogAppender) && !iid.equals(yahooCI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }        
        return this;
    }
};
function NSGetModule(compMgr, fileSpec) {
    return {
        myCID       : Components.ID("{892FB683-B43B-40d9-B54B-AC8DCBCE4067}"),
        myProgID    : "@yahoo.com/ylogfileappender;1",
        firstTime   : true,
        registerSelf : function (compMgr, fileSpec, location, type) {
            if (this.firstTime) {
                this.firstTime = false;
                throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
            }
            compMgr = compMgr.QueryInterface(yahooCI.nsIComponentRegistrar);
            compMgr.registerFactoryLocation(this.myCID, "Yahoo! Log File Appender", this.myProgID, fileSpec, location, type);
        },
        getClassObject : function (compMgr, cid, iid) {
            if (!cid.equals(this.myCID)) {
                throw Components.results.NS_ERROR_NO_INTERFACE;
            }
            if (!iid.equals(yahooCI.nsIFactory)) {
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
            }
            return this.myFactory;
        },
        myFactory : {
            createInstance : function (outer, iid) {
                if (outer !== null) {
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                }
                return new YLogFileAppender().QueryInterface(iid);
            }
        },
        canUnload : function(compMgr) { return true; }
    };
}
