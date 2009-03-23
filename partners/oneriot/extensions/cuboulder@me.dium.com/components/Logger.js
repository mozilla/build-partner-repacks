/*
 * Copyright (C) 2006 to the Present, Medium, Inc. - ALL RIGHTS RESERVED
 *
 * This source code contains proprietary information of Medium, Inc.
 * and its receipt or possession does not convey any rights to reproduce or
 * disclose its contents, or to manufacture, use or sell anything it may
 * describe. Reproduction, disclosure or use without specific written
 * authorization from Medium, Inc. is strictly prohibited.
 *
 * Medium, Inc. may have patents, patent applications, trademarks, copyrights,
 * or other intellectual property rights covering this source code. The receipt
 * or possession of this source code does not give you any license to these
 * patents, trademarks, copyrights, or other intellectual property.
 *
 * $Id$
 */

// Result codes
const Cr = Components.results;
const NS_ERROR_INVALID_ARG = Cr.NS_ERROR_INVALID_ARG;
const NS_ERROR_NOT_IMPLEMENTED = Cr.NS_ERROR_NOT_IMPLEMENTED;
const NS_ERROR_NO_AGGREGATION = Cr.NS_ERROR_NO_AGGREGATION;
const NS_ERROR_NO_INTERFACE = Cr.NS_ERROR_NO_INTERFACE;

// Interfaces
const Ci = Components.interfaces;
const IMediumLogger = Ci.IMediumLogger;
const nsIFactory = Ci.nsIFactory;
const nsIScriptError = Ci.nsIScriptError;
const nsISupports = Ci.nsISupports;

// nsIScriptError constants
const errorFlag = nsIScriptError.errorFlag;
const warningFlag = nsIScriptError.warningFlag;
const exceptionFlag = nsIScriptError.exceptionFlag;

// Class objects
const Cc = Components.classes;
var ScriptError;

// Service objects
var console;
var preferences;

var isInitialized = false;

var lastLogTime = Date.now();
var firstErrorDisplayed = false;

function initialize()
{
    isInitialized = true;

    // Class objects
    ScriptError = Cc[ "@mozilla.org/scripterror;1"];

    // Service objects
    console = Cc[ "@mozilla.org/consoleservice;1"].getService( Ci.nsIConsoleService);
    preferences = Cc[ "@mozilla.org/preferences-service;1"].getService( Ci.nsIPrefService).getBranch( "me.dium.log.");
}

function loadStackTrace( location, trace)
{
    if ( trace == undefined) {
        trace = [];
    }
    if ( location != null && location.filename != null) {
        trace.push( [ location.name, "@", location.filename, ":", location.lineNumber].join( ""));
        loadStackTrace( location.caller, trace);
    }
    return trace;
}

const logger = {

    get isErrorLoggingEnabled()
    {
        return preferences.getBoolPref( "error.enabled");
    },

    get isWarningLoggingEnabled()
    {
        return preferences.getBoolPref( "warning.enabled");
    },

    get isExceptionLoggingEnabled()
    {
        return preferences.getBoolPref( "exception.enabled");
    },

    get isDebugLoggingEnabled()
    {
        return preferences.getBoolPref( "debug.enabled");
    },

    logError: function ( message)
    {
        if ( this.isErrorLoggingEnabled)
        {
            log( generateLogMessageHeader( "ERROR") + message, errorFlag)
        }
    },

    logWarning: function ( message)
    {
        if ( this.isWarningLoggingEnabled)
        {
            log( generateLogMessageHeader( "WARNING") + message, warningFlag)
        }
    },

    logException: function ( exception)
    {
        if ( this.isExceptionLoggingEnabled)
        {
            const message = [ generateLogMessageHeader( "EXCEPTION")];

            const name = exception.name;
            if ( name != null && name != "")
            {
                message.push( name);
                message.push( ": ");
            }

            message.push( exception.message);

            const location = exception.location;
            if ( location != null)
            {
                message.push( "\n");
                message.push( loadStackTrace( location).join( "\n"));
            }

            log( message.join( ""), exceptionFlag, exception.filename, exception.lineNumber);
        }
    },

    logJSException: function( exception)
    {
        const message = [ generateLogMessageHeader( "EXCEPTION"), exception.message];

        const stack = exception.stack;
        if ( stack != undefined)
        {
            message.push( "\n");
            message.push( stack);
        }

        log( message.join( ""), exceptionFlag, exception.fileName, exception.lineNumber);
    },

    logDebug: function ( message)
    {
        if ( this.isDebugLoggingEnabled)
        {
            log( generateLogMessageHeader( "DEBUG") + message)
        }
    }
};

function generateLogMessageHeader( level)
{
    const now = Date.now();
    const interval = now - lastLogTime;
    lastLogTime = now;
    return [ now, " (+", interval, " ms) Me.dium: ", level, ": "].join( "");
}

function log( message, flag, sourceName, lineNumber)
{
    if ( flag != undefined)
    {
        if ( lineNumber == undefined)
        {
            lineNumber = 0;
        }
        const scriptError = ScriptError.createInstance( nsIScriptError);
        scriptError.init( message, sourceName, null, lineNumber, 0, flag, "component javascript");
        console.logMessage( scriptError);
    }
    else
    {
        console.logStringMessage( message);
    }
    if ( message.charAt( message.length - 1) != "\n")
    {
        dump( message + "\n");
    }
    else
    {
        dump( message);
    }

    if ( !firstErrorDisplayed && ( flag != undefined && flag != warningFlag) && logger.isDebugLoggingEnabled)
    {
        firstErrorDisplayed = true;
        Cc[ "@mozilla.org/embedcomp/prompt-service;1"].getService( Ci.nsIPromptService).alert( null, "Me.dium Error", message.substring( 0, 512) + "... [see Error Console for details]");
    }
}

//////////////////////////////////////////////////////////////////////////////////////
// XPCOM Registration
//////////////////////////////////////////////////////////////////////////////////////

const LoggerClassId = Components.ID( "{aa4a72f6-e52a-4e96-bdb8-db6b0b6cdb4d}");

const loggerFactory = {

    createInstance: function( outer, iid)
    {
        if ( outer != null)
        {
            throw NS_ERROR_NO_AGGREGATION;
        }
        if ( !iid.equals( IMediumLogger) &&
             !iid.equals( nsISupports))
        {
            throw NS_ERROR_INVALID_ARG;
        }
        return logger;
    }
};

const module = {

    registerSelf: function( compMgr, fileSpec, location, type)
    {
        compMgr = compMgr.QueryInterface( Ci.nsIComponentRegistrar);
        compMgr.registerFactoryLocation( LoggerClassId, "MediumLogger", "@me.dium.com/logger;1", fileSpec, location, type);
    },

    getClassObject: function( compMgr, cid, iid)
    {
        if ( !cid.equals( LoggerClassId))
        {
            throw NS_ERROR_NO_INTERFACE;
        }
        if ( !iid.equals( nsIFactory))
        {
            throw NS_ERROR_NOT_IMPLEMENTED;
        }
        if ( !isInitialized)
        {
            initialize();
        }
        return loggerFactory;
    },

    canUnload: function( compMgr)
    {
        return true;
    }
};

function NSGetModule( comMgr, fileSpec)
{
    return module;
}
