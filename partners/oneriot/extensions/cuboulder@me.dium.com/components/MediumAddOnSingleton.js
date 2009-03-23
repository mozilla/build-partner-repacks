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

const Cc = Components.classes;
const Cr = Components.results;
const Ci = Components.interfaces;

// Sensor states
const SENSOR_ON = Ci.IMediumWindow.SENSOR_ON;
const SENSOR_OFF = Ci.IMediumWindow.SENSOR_OFF;
const SENSOR_SUSPENDED = Ci.IMediumWindow.SENSOR_SUSPENDED;

// Visibility states
const VISIBLE_TO_NONE = Ci.IMediumWindow.VISIBLE_TO_NONE;
const VISIBLE_TO_FRIENDS = Ci.IMediumWindow.VISIBLE_TO_FRIENDS;
const VISIBLE_TO_ALL = Ci.IMediumWindow.VISIBLE_TO_ALL;

const extensionId = "cuboulder@me.dium.com";

var logger;
var serviceSingleton;
var extensionManager;
var observerService;
var prefService;
var preferences;
var ioService;
var addOnSingleton = null;

function MediumAddOnSingleton()
{
    // Service objects
    logger = Cc[ "@me.dium.com/logger;1"].getService( Ci.IMediumLogger);
    serviceSingleton = Cc[ "@me.dium.com/service-singleton;1"].getService( Ci.IMediumServiceSingleton);
    extensionManager = Cc[ "@mozilla.org/extensions/manager;1"].getService( Ci.nsIExtensionManager);
    observerService = Cc[ "@mozilla.org/observer-service;1"].getService( Ci.nsIObserverService);
    prefService = Cc[ "@mozilla.org/preferences-service;1"].getService( Ci.nsIPrefService);
    preferences = prefService.getBranch( "me.dium.");
    ioService = Cc[ "@mozilla.org/network/io-service;1"].getService( Ci.nsIIOService);

    serviceSingleton.addConnectionListener( connectionListener);

    observerService.addObserver( uninstallObserver, "em-action-requested", false);
    observerService.addObserver( quitObserver, "quit-application", false);

    this._mediumWindows = {};
    this._reasons = {};
}

MediumAddOnSingleton.prototype =
{
    wasUninstalled: false,
    currentMediumWindow: null,
    currentFocus: null,

    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.IMediumAddOnSingleton) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    get version()
    {
        return extensionManager.getItemForID( extensionId).version;
    },

    get lastRunVersion()
    {
        return preferences.getCharPref( "version");
    },

    setLastRunVersion: function ()
    {
        preferences.setCharPref( "version", this.version);
    },

    getMediumWindow: function ( window, useContentWindow)
    {
        window = window.top;

        var mediumWindow = null;
        var mediumWindows = this._mediumWindows;
        for ( var id in mediumWindows)
        {
            const candidate = mediumWindows[ id];
            const candidateWindow = candidate.window;
            if ( useContentWindow)
            {
                if ( candidateWindow.content == window)
                {
                    mediumWindow = candidate;
                    break;
                }
            }
            else
            {
                if ( candidateWindow == window)
                {
                    mediumWindow = candidate;
                    break;
                }
            }
        }
        return mediumWindow;
    },

    registerWindow: function ( window)
    {
        var mediumWindow = this.getMediumWindow( window, false);
        if ( mediumWindow == null)
        {
            mediumWindow = new MediumWindow( window);
            this._mediumWindows[ mediumWindow.serviceContext.id] = mediumWindow;

            if ( !serviceSingleton.isAuthenticated && mediumWindow.sensorState != SENSOR_OFF)
            {
                serviceSingleton.authenticate(null, null, false);
            }
        }
        return mediumWindow;
    },

    unregisterWindow: function ( mediumWindow)
    {
        assert( this, function () { return this._mediumWindows[ mediumWindow.serviceContext.id] == mediumWindow; });
        delete this._mediumWindows[ mediumWindow.serviceContext.id];
    },

    storeReasonForNavigation: function ( url, initiatingContextId, reason)
    {
        if ( serviceSingleton.isAuthenticated)
        {
            url = ioService.newURI( url, null, null).spec;
            this._reasons[ url] = { initiatingContextId: initiatingContextId, reason: reason};
        }
    },

    retrieveReasonForNavigation: function ( url)
    {
        var reason = this._reasons[ url];
        if ( reason != undefined)
        {
            delete this._reasons[ url];
        }
        else
        {
            reason = null;
        }
        return reason;
    },

    onDisconnected: function ()
    {
        const mediumWindows = this._mediumWindows;
        for ( id in mediumWindows)
        {
            mediumWindows[ id].onDisconnected();
        }
    },

    onAuthenticationSucceeded: function ()
    {
        const mediumWindows = this._mediumWindows;
        for ( id in mediumWindows)
        {
            mediumWindows[ id].onAuthenticationSucceeded();
        }
    },

    onAuthenticationFailed: function ( message)
    {
        const mediumWindows = this._mediumWindows;
        for ( id in mediumWindows)
        {
            mediumWindows[ id].onAuthenticationFailed( message);
        }
    },

    onMessageReceived: function ( message)
    {
        const updates = message != null && message != "" ? safeEval( message) : {};
        for ( var id in updates)
        {
            const update = updates[ id];
            if ( "sessionId" in update)
            {
                const mediumWindow = this._mediumWindows[ id];
                if ( mediumWindow != undefined)
                {
                    mediumWindow.setLastSessionId( update.sessionId);
                }
            }
        }
        return true;
    }
};

function MediumWindow( window)
{
    window = window.top;

    this.window = window;
    this.serviceContext = serviceSingleton.createContext();

    this._sensorListeners = [];

    var opener = window.opener;
    var useContentWindow = false;
    if ( opener == null)
    {
        const contentWindow = window.content;
        if ( contentWindow != undefined)
        {
            useContentWindow = true;
            opener = contentWindow.opener;
        }
    }

    var parentMediumWindow = null;
    if ( opener != null)
    {
        parentMediumWindow = addOnSingleton.getMediumWindow( opener, useContentWindow);
    }

    if ( parentMediumWindow != null)
    {
        this._sensorEnabled = parentMediumWindow.sensorState != SENSOR_OFF;
    }
    else if ( addOnSingleton.currentMediumWindow != null)
    {
        this._sensorEnabled = addOnSingleton.currentMediumWindow.sensorState != SENSOR_OFF;
    }
    else
    {
        this._sensorEnabled = preferences.getBoolPref( "sensor.optin.dialog.accepted") && preferences.getBoolPref( "sensor.default.enabled");
    }

    if ( this._sensorEnabled)
    {
        this.serviceContext.sensorOn();
    }

    if ( parentMediumWindow != null)
    {
        this._visibilityState = parentMediumWindow.visibilityState;
    }
    else if ( addOnSingleton.currentMediumWindow != null)
    {
        this._visibilityState = addOnSingleton.currentMediumWindow.visibilityState;
    }
    else
    {
        this._visibilityState = VISIBLE_TO_FRIENDS;
    }

    if ( addOnSingleton.currentMediumWindow == null)
    {
        addOnSingleton.currentMediumWindow = this;
    }
}

MediumWindow.prototype =
{
    _activated: false,
    _lastSessionId: null,
    _credentialsSetExplicitly: false,
    _lastReportedVisibilityState: null,
    _currentFocus: null,
    _currentInitiatingContextId: null,
    _currentReason: null,
    _lastReportedUrl: null,

    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.IMediumWindow) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    setLastSessionId: function ( sessionId)
    {
        if ( sessionId == null)
        {
            throw Cr.NS_ERROR_INVALID_ARG;
        }

        if ( this._lastSessionId == null)
        {
            this._maybeReportFocus();
        }
        else if ( sessionId != this._lastSessionId)
        {
            this._lastReportedUrl = null;
            this._lastReportedVisibilityState = null;
            this._maybeReportFocus();
        }
        this._lastSessionId = sessionId;
    },

    get sensorState()
    {
        var sensorState = SENSOR_ON;

        if ( !this._sensorEnabled)
        {
            sensorState = SENSOR_OFF;
        }
        else if ( this._currentUrl == null)
        {
            sensorState = SENSOR_SUSPENDED;
        }
        return sensorState;
    },

    enableSensor: function ()
    {
        const oldSensorState = this.sensorState;
        this._sensorEnabled = true;
        this._maybeNotifySensorState( oldSensorState);
        this.serviceContext.sensorOn();
    },

    disableSensor: function ()
    {
        const oldSensorState = this.sensorState;
        this._sensorEnabled = false;
        this._maybeNotifySensorState( oldSensorState);
        this.serviceContext.sensorOff();
    },

    toggleSensorState: function ()
    {
        if ( this._sensorEnabled)
        {
            this.disableSensor();
        }
        else
        {
            this.enableSensor();
        }
    },

    _maybeNotifySensorState: function ( oldState)
    {
        if ( this.sensorState != oldState)
        {
            this._notifySensorState( oldState);
        }
    },

    _notifySensorState: function ( oldState)
    {
        function listenerCaller( listener)
        {
            listener.onSensorStateChange();
            return true;
        }
        callListeners( this._sensorListeners, listenerCaller);

        this._maybeReportVisibilityState();
        this._maybeReportFocus();

        if ( serviceSingleton.isAuthenticated && oldState == SENSOR_ON && this.sensorState != SENSOR_ON)
        {
            serviceSingleton.sendMessage( "requestType=contextSharingSuspended&contextId=" + this.serviceContext.id, null);
            this._lastReportedUrl = null;
        }
    },

    get visibilityState()
    {
        var visibilityState;

        if ( this._activated)
        {
            if ( serviceSingleton.isAuthenticated && /^guest/.test( serviceSingleton.username))
            {
                visibilityState = VISIBLE_TO_FRIENDS;
            }
            else
            {
                visibilityState = this._visibilityState;
            }
        }
        else
        {
            visibilityState = VISIBLE_TO_NONE;
        }

        return visibilityState;
    },

    set visibilityState( newState)
    {
        switch ( newState)
        {
            case VISIBLE_TO_NONE:
            case VISIBLE_TO_FRIENDS:
            case VISIBLE_TO_ALL:
            {
                var oldState = this.visibilityState;
                this._visibilityState = newState;
                this._maybeSaveDefaultVisibilityState();
                this._maybeNotifyVisibilityState( oldState);
                break;
            }

            default:
                throw Cr.NS_ERROR_INVALID_ARG;
        }
    },

    _maybeSaveDefaultVisibilityState: function ()
    {
        if ( serviceSingleton.isAuthenticated && !/^guest/.test( serviceSingleton.username))
        {
            var stateString = "VISIBLE_TO_NONE";
            switch ( this._visibilityState)
            {
                case VISIBLE_TO_FRIENDS:
                    stateString = "VISIBLE_TO_FRIENDS";
                    break;
                case VISIBLE_TO_ALL:
                    stateString = "VISIBLE_TO_ALL";
                    break;
            }
            preferences.setCharPref( serviceSingleton.username + ".visibility", stateString);
        }
    },

    _maybeNotifyVisibilityState: function ( oldState)
    {
        if ( this.visibilityState != oldState)
        {
            function listenerCaller( listener)
            {
                listener.onVisibilityStateChange();
                return true;
            }
            callListeners( this._sensorListeners, listenerCaller);
            this._maybeReportVisibilityState();
        }
    },

    _maybeReportVisibilityState: function ()
    {
        const visibilityState = this.visibilityState;
        if ( visibilityState != this._lastReportedVisibilityState && serviceSingleton.isAuthenticated)
        {
            var visibilityStateString = "VISIBLE_TO_NONE";
            switch ( visibilityState)
            {
                case VISIBLE_TO_NONE:
                    break;

                case VISIBLE_TO_FRIENDS:
                    visibilityStateString = "VISIBLE_TO_FRIENDS";
                    break;

                case VISIBLE_TO_ALL:
                    visibilityStateString = "VISIBLE_TO_ALL";
                    break;

                default:
                    AtlThrow( E_FAIL);
            }

            serviceSingleton.sendMessage( [ "requestType=setPresence&contextId=", this.serviceContext.id, "&visibilityState=", visibilityStateString].join( ""), null);
            this._lastReportedVisibilityState = visibilityState;

            this._lastReportedUrl = null;
            this._maybeReportFocus();
        }
    },

    credentialsSetExplicitly: function ()
    {
        this._credentialsSetExplicitly = true;
    },

    addSensorListener: function ( listener)
    {
        addToArraySet( this._sensorListeners, listener);
    },

    removeSensorListener: function ( listener)
    {
        removeFromArraySet( this._sensorListeners, listener);
    },

    activate: function ()
    {
        const oldVisibilityState = this.visibilityState;

        this._lastSessionId = null;

        this.serviceContext.activate();
        this._activated = true;

        this._maybeNotifyVisibilityState( oldVisibilityState);
        this._maybeReportFocus();
    },

    deactivate: function ()
    {
        if ( this._activated)
        {
            const oldVisibilityState = this.visibilityState;

            this._lastSessionId = null;

            this.serviceContext.deactivate();

            this._activated = false;

            this._maybeNotifyVisibilityState( oldVisibilityState);
        }
    },

    onDisconnected: function ()
    {
        if ( !serviceSingleton.isAuthenticated)
        {
            // logged out
            this.deactivate();
            this._lastSessionId = null;
            this._lastReportedVisibilityState = null;
            this._lastReportedUrl = null;
        }
    },

    onAuthenticationSucceeded: function ()
    {
        if ( !serviceSingleton.isAuthenticated)
        {
            throw Cr.NS_ERROR_UNEXPECTED;
        }

        if ( /^guest/.test( serviceSingleton.username))
        {
            this._visibilityState = VISIBLE_TO_FRIENDS;
        }
        else
        {
            this._visibilityState = VISIBLE_TO_FRIENDS;
            const visibilityStatePreferenceName = serviceSingleton.username + ".visibility";
            if ( preferences.prefHasUserValue( visibilityStatePreferenceName))
            {
                this._visibilityState = VISIBLE_TO_NONE;
                switch ( preferences.getCharPref( visibilityStatePreferenceName))
                {
                    case "VISIBLE_TO_ALL":
                        this._visibilityState = VISIBLE_TO_FRIENDS;
                        break;
                    case "VISIBLE_TO_FRIENDS":
                        this._visibilityState = VISIBLE_TO_FRIENDS;
                        break;
                }
            }
        }

        const oldSensorState = this.sensorState;

        if ( this._credentialsSetExplicitly)
        {
            this._credentialsSetExplicitly = false;
            this.enableSensor();
        }

        this._notifySensorState( oldSensorState);
    },

    onAuthenticationFailed: function ( message)
    {
        if ( serviceSingleton.isAuthenticated)
        {
            throw Cr.NS_ERROR_UNEXPECTED;
        }

        this._notifySensorState( this.sensorState);
    },

    onFocus: function ( url)
    {
        var reason = addOnSingleton.retrieveReasonForNavigation( url);

        var approvedUrl = null;

        if ( url == "about:blank")
        {
            approvedUrl = url;
        }
        else
        {
            const allowUrlPattern = new RegExp( preferences.getCharPref( "sensor.allow.url.pattern"));
            const denyUrlPattern = new RegExp( preferences.getCharPref( "sensor.deny.url.pattern"));
            const exceptUrlPattern = new RegExp( preferences.getCharPref( "sensor.except.url.pattern"));
            if ( allowUrlPattern.test( url) && ( !denyUrlPattern.test( url) || exceptUrlPattern.test( url)))
            {
                // Strip username@ or username:password@, if any.  Not sure that
                // this is strictly necessary as it seems to have already been done
                // by the time we get it, but we just want to make sure.
                approvedUrl = url.replace( /^(\w+:\/+)[^/]*@/, "$1");
            }
        }

        if ( this._currentUrl != approvedUrl)
        {
            const oldSensorState = this.sensorState;

            this._currentUrl = approvedUrl;

            if ( reason != null)
            {
                this._currentInitiatingContextId = reason.initiatingContextId;
                this._currentReason = reason.reason;
            }
            else
            {
                this._currentInitiatingContextId = null;
                this._currentReason = null;
            }

            this._maybeNotifySensorState( oldSensorState);
            this._maybeReportFocus();
        }
    },

    _maybeReportFocus: function ()
    {
        if ( this.sensorState == SENSOR_ON && this._currentUrl != null && this._currentUrl != "about:blank" && this._currentUrl != this._lastReportedUrl && serviceSingleton.isAuthenticated)
        {
            this._maybeReportVisibilityState();

            var body = [ "requestType=shareLocation&contextId=", this.serviceContext.id, "&url=", encodeURIComponent( this._currentUrl)];

            if ( this._currentInitiatingContextId != null && this._currentInitiatingContextId != this.serviceContext.id)
            {
                body.push( "&initiatingContextId=");
                body.push( this._currentInitiatingContextId);
                this._currentInitiatingContextId = null;
            }

            if ( this._currentReason != null)
            {
                body.push( "&reason=");
                body.push( encodeURIComponent( this._currentReason));
                this._currentReason = null;
            }

            serviceSingleton.sendMessage( body.join( ""), null);

            this._lastReportedUrl = this._currentUrl;
        }
    },

    onFocused: function( url)
    {
        if ( addOnSingleton.currentMediumWindow != this)
        {
            addOnSingleton.currentMediumWindow = this;
            this._maybeSaveDefaultVisibilityState();
            this._lastReportedUrl = null;
            this._maybeReportFocus();
        }
    },

    addSensorListener: function ( listener)
    {
        addToArraySet( this._sensorListeners, listener);
    },

    removeSensorListener: function ( listener)
    {
        removeFromArraySet( this._sensorListeners, listener);
    },

    hasUpdateHandler: function ()
    {
        return this._updateHandler != null;
    },

    handleUpdate: function ( updateObject, updatesString)
    {
        delete this.sequenceNumber;

        const updateSessionId = updateObject.sessionId;
        if ( updateSessionId != undefined && updateSessionId != this._updateSessionId)
        {
            this._updateSessionId = updateSessionId;

            // Make sure to report our visibility state to the server
            // before sharing our location...
            this._reportVisibilityState();

            if ( this._sensorState == SENSOR_ON)
            {
                // Make sensor to send current location to
                // server.
                this._reportCurrentFocus();
            }
        }

        var allUpdatesSucceeded = true;
        const updateHandler = this._updateHandler;
        if ( updateHandler != null)
        {
            // The listeners may choose to unregister themselves, so we need
            // to make a copy first.
            try
            {
                if ( updateHandler.handleUpdate( updatesString))
                {
                    this.sequenceNumber = updateObject.sequenceNumber;
                }
                else
                {
                    allUpdatesSucceeded = false;
                }
            }
            catch ( e)
            {
                logException( e);
            }
        }

        return allUpdatesSucceeded;
    },

    close: function ()
    {
        addOnSingleton.unregisterWindow( this);
        this.serviceContext.close();
    }
};

const connectionListener =
{
    QueryInterface: function ( iid)
    {
        if ( iid.equals( IMediumConnectionListener) ||
             iid.equals( nsISupports))
        {
            return this;
        }
        throw NS_ERROR_NO_INTERFACE;
    },

    onConnected: function ()
    {
    },

    onDisconnected: function ()
    {
        try
        {
            addOnSingleton.onDisconnected();
        }
        catch ( e)
        {
            logException( e);
        }
    },

    onAuthenticationSucceeded: function ()
    {
        try
        {
            addOnSingleton.onAuthenticationSucceeded();
        }
        catch ( e)
        {
            logException( e);
        }
    },

    onAuthenticationFailed: function ( message)
    {
        try
        {
            addOnSingleton.onAuthenticationFailed( message);
        }
        catch ( e)
        {
            logException( e);
        }
    },

    onMessageReceived: function ( message)
    {
        try
        {
            return addOnSingleton.onMessageReceived( message);
        }
        catch ( e)
        {
            logException( e);
            return false;
        }
    }
};

const uninstallObserver =
{
    QueryInterface: function ( iid)
    {
        if ( iid.equals( nsIObserver) ||
             iid.equals( nsISupports))
        {
            return this;
        }
        throw NS_ERROR_NO_INTERFACE;
    },

    observe: function( subject, topic, data)
    {
        if ( subject.QueryInterface( Ci.nsIUpdateItem).id == extensionId)
        {
            switch ( data)
            {
                case "item-uninstalled":
                {
                    addOnSingleton.wasUninstalled = true;
                    break;
                }

                case "item-cancel-action":
                {
                    addOnSingleton.wasUninstalled = false;
                    break;
                }
            }
        }
    }
};

const quitObserver =
{
    QueryInterface: function ( iid)
    {
        if ( iid.equals( nsIObserver) ||
             iid.equals( nsISupports))
        {
            return this;
        }
        throw NS_ERROR_NO_INTERFACE;
    },

    observe: function( subject, topic, data)
    {
        observerService.removeObserver( quitObserver, "quit-application");
        observerService.removeObserver( uninstallObserver, "em-action-requested");

        var savePrefFile = false;

        if ( preferences.prefHasUserValue( "sensor.optin.dialog.presented"))
        {
            preferences.clearUserPref( "sensor.optin.dialog.presented");
            savePrefFile = true;
        }

        if ( addOnSingleton.wasUninstalled)
        {
            preferences.deleteBranch( "");
            savePrefFile = true;
        }

        if ( savePrefFile)
        {
            prefService.savePrefFile( null);
        }
    }
};


//////////////////////////////////////////////////////////////////////////////////////
// Utility Functions
//////////////////////////////////////////////////////////////////////////////////////

function assert( context, expressionFunction)
{
    if ( typeof( expressionFunction) != "function" || !expressionFunction.apply( context, []))
    {
        if ( logger.isDebugLoggingEnabled)
        {
            eval( "debugger;");
        }

        var message = "ASSERTION FAILED: " + expressionFunction.toSource().replace( /^.*return\s*/, "").replace( /\s*(;\s*)?\}\s*(\)\s*)?$/, "");

        try
        {
            throw new Error();
        }
        catch ( e)
        {
            message += "\n" + e.stack;
        }

        if ( logger.isDebugLoggingEnabled)
        {
            throw new Error( message);
        }
        else
        {
            logger.logError( message);
        }
    }
}

function safeEval( s)
{
    const expression = "(" + s + ")";
    try
    {
        return Components.utils.evalInSandbox( expression, Components.utils.Sandbox( "about:blank"));
    }
    catch ( e)
    {
        throw new Error( e.message + " [while evaluating expression: " + expression + "]");
    }
}

function addToArraySet( arraySet, item)
{
    for ( var i = arraySet.length; i-- > 0;)
    {
        if ( item == arraySet[ i])
        {
            throw Cr.NS_ERROR_UNEXPECTED;
        }
    }
    arraySet.push( item);
}

function removeFromArraySet( arraySet, item)
{
    for ( var i = arraySet.length; i-- > 0;)
    {
        if ( item == arraySet[ i])
        {
            arraySet.splice( i, 1);
            return;
        }
    }
    throw Cr.NS_ERROR_UNEXPECTED;
}

function callListeners( listeners, caller)
{
    var allSucceeded = true;
    const listenersCopy = [];
    for ( var i = listeners.length; i-- > 0;)
    {
        listenersCopy.push( listeners[ i]);
    }
    for ( var i = listenersCopy.length; i-- > 0;)
    {
        var succeeded = false;
        try
        {
            succeeded = caller( listenersCopy[ i]);
        }
        catch ( e)
        {
            logException( e);
        }

        if ( !succeeded)
        {
            allSucceeded = false;
        }
    }
    return allSucceeded;
}

function logException( exception)
{
    try
    {
        logger.logException( exception.QueryInterface( Ci.nsIException));
    }
    catch ( e)
    {
        logger.logJSException( exception);
    }
}


//////////////////////////////////////////////////////////////////////////////////////
// XPCOM Registration
//////////////////////////////////////////////////////////////////////////////////////

function Module( classFactories)
{
    this.classFactories = classFactories;
}

Module.prototype =
{
    registerSelf: function( compMgr, fileSpec, location, type)
    {
        compMgr = compMgr.QueryInterface( Ci.nsIComponentRegistrar);
        const factories = this.classFactories;
        for ( var classId in factories)
        {
            const factory = factories[ classId];
            compMgr.registerFactoryLocation( Components.ID( classId), factory.className, factory.contractId, fileSpec, location, type);
        }
    },

    getClassObject: function( compMgr, cid, iid)
    {
        const classId = cid.toString();
        const factory = this.classFactories[ classId];
        if ( factory == undefined)
        {
            throw Cr.NS_ERROR_FACTORY_NOT_REGISTERED;
        }
        if ( !iid.equals( Ci.nsIFactory))
        {
            throw Cr.NS_ERROR_NO_INTERFACE;
        }
        return factory;
    },

    canUnload: function( compMgr)
    {
        return true;
    }
};

function NSGetModule( comMgr, fileSpec)
{
    var classFactories =
    {
        "{b20b9a32-37b2-42fc-b2de-459b411107cb}":
        {
            className: "MediumAddOnSingleton",
            contractId: "@me.dium.com/addon-singleton;1",
                            
            createInstance: function( outer, iid)
            {
                if ( outer != null)
                {
                    throw Cr.NS_ERROR_NO_AGGREGATION;
                }
                if ( !iid.equals( Ci.IMediumAddOnSingleton) &&
                     !iid.equals( Ci.nsISupports))
                {
                    throw Cr.NS_ERROR_INVALID_ARG;
                }

                if ( addOnSingleton == null)
                {
                    addOnSingleton = new MediumAddOnSingleton();
                }
                return addOnSingleton;
            }
        }
    };

    return new Module( classFactories);
}
