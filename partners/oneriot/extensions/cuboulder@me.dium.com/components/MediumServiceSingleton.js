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

var Cr = Components.results;
var Ci = Components.interfaces;
var Cc = Components.classes;

const extensionId = "cuboulder@me.dium.com";

var logger;
var preferences;
var version;
var cookieManager;
var cookiePermissions;
var ioService;
var observerService;
var singleton = null;
var serviceDomain;

const cookieObserver = {
    QueryInterface: function() {
          if(!aIID.equals(Ci.nsISupports) ||
             !aIID.equals(Ci.nsIObserver))
            throw Cr.NS_ERROR_NO_INTERFACE;

            return this;
    },
    
    observe: function(subject, topic, data) {
        if (subject) {
            var cookie = subject.QueryInterface( Ci.nsICookie);
        }
        
        if (cookie && cookie.host == serviceDomain && cookie.name == "tok") {
            switch(data) {
                case "added" :
                    if (singleton.isAuthenticated) {    
                        singleton.addConnectionListener(tokenAuthListener);
                        singleton.loggingInFromWebsite = true;
                        singleton.disconnect();
                    }
                    break;
                case "changed" :                                     
                case "cleared" :
                case "deleted" :
                    if (singleton.isAuthenticated) {
                        singleton.disconnect();
                    }
            }
        }
    }
};

const tokenAuthListener =
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
            singleton.loggingInFromWebsite = false;
            singleton.removeConnectionListener(tokenAuthListener);            
            singleton.authenticate();
        }
        catch ( e)
        {
            logException( e);
        }
    },

    onAuthenticationSucceeded: function ()
    {
    },

    onAuthenticationFailed: function ( message)
    {
    },

    onMessageReceived: function ( message)
    {
        return true;
    }
};


function MediumServiceSingleton()
{
    logger = Cc[ "@me.dium.com/logger;1"].getService( Ci.IMediumLogger);
    preferences = Cc[ "@mozilla.org/preferences-service;1"].getService( Ci.nsIPrefService).getBranch( "me.dium.");
    ioService = Cc[ "@mozilla.org/network/io-service;1"].getService( Ci.nsIIOService);
    observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);    
    cookiePermissions = Cc[ "@mozilla.org/cookie/permission;1"].getService( Ci.nsICookiePermission);
    cookieManager = Cc[ "@mozilla.org/cookiemanager;1"].getService( Ci.nsICookieManager);

    var extensionManager = Cc[ "@mozilla.org/extensions/manager;1"].getService( Ci.nsIExtensionManager);
    version = extensionManager.getItemForID( extensionId).version;
    
    const host = ioService.newURI( preferences.getCharPref( "service.url"), null, null).host
    
    var sliceTo = host.indexOf(".com");
    if (sliceTo > 0) {
    	serviceDomain = host.slice(host.substr(0, sliceTo).lastIndexOf(".", sliceTo));
    } else {
        serviceDomain = host;
    }

    this._updateConnection = new UpdateConnection();
    this._requestConnection = new QueuingServiceConnection( "service");
    this._connectionListeners = [];
    
    observerService.addObserver(cookieObserver, "cookie-changed", false);

}

MediumServiceSingleton.prototype =
{
    username: null,
    password: null,
    isConnected: false,
    isAuthenticated: false,
    isAuthenticationInProgress: false,
    loggingInFromWebsite: false,

    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.IMediumServiceSingleton) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },
    
    get username() {
        var username;
        var enumerator = cookieManager.enumerator;
        while ( enumerator.hasMoreElements())
        {
            try
            {
                var entry = enumerator.getNext().QueryInterface( Ci.nsICookie);        
                if ( entry.host == serviceDomain && entry.name == "tok") {
                    username = entry.value.substr(0, entry.value.indexOf(':'));
                    break;
                }
            } catch( e) {
                logException(e);
            }
        }
        
        // try to get the username off the guest token if we couldn't find it
        if (!username) {
            var enumerator = cookieManager.enumerator;
            while ( enumerator.hasMoreElements())
            {
                try
                {
                    var entry = enumerator.getNext().QueryInterface( Ci.nsICookie);        
                    if ( entry.host == serviceDomain && entry.name == "gtok") {
                        username = entry.value.substr(0, entry.value.indexOf(':'));
                        break;
                    }
                } catch( e) {
                    logException(e);
                }
            }
        }
        
        return username;
    },
    
    authenticate: function (username, password, rememberMe)
    {
        if ( this.isAuthenticated)
        {
            assert( this, function () { return !username });
            
            function listenerCaller( listener)
            {
                listener.onAuthenticationSucceeded();
                return true;
            }
            callListeners( this._connectionListeners, listenerCaller);
        }
        else
        {   
            this._updateConnection.authenticate(username, password, rememberMe);
        }
    },

    disconnect: function ()
    {
        if ( this.isAuthenticated || this.isAuthenticationInProgress)
        {
            var self = this;
            function closeSessionCallback()
            {
                // Prevent the following close() calls from reporting disconnection.
                self.isConnected = false;
                self._requestConnection.close();
                self._updateConnection.close();

                const serviceUri = ioService.newURI( preferences.getCharPref( "service.url"), null, null);
                cookieManager.remove( serviceUri.host, "JSESSIONID", "/", false);

                if ( !self.loggingInFromWebsite)
                {
                    const websiteUri = ioService.newURI( preferences.getCharPref( "website.url"), null, null);
                    cookieManager.remove( websiteUri.host, "JSESSIONID", "/", false);
                }

                self.isAuthenticated = false;
                self.isAuthenticationInProgress = false;

                // Now report disconnection.
                self._notifyConnectionFailed();
            }

            this.isAuthenticated = false;
            this._requestConnection.send( new ServiceRequest( "requestType=closeSession", -1, closeSessionCallback));
        }
    },
    
    logout: function() {
        try {
            cookieManager.remove(serviceDomain, "tok", "/", false);
        } catch ( e) {
            logException(e);
        }
        this.disconnect();
    },

    addConnectionListener: function ( listener)
    {
        addToArraySet( this._connectionListeners, listener);
    },

    removeConnectionListener: function ( listener)
    {
        removeFromArraySet( this._connectionListeners, listener);
    },

    createContext: function ()
    {
        return new MediumServiceContext();
    },

    sendMessage: function ( message, callback)
    {
        function callbackWrapper( response)
        {
            if ( callback != null)
            {
                callback.onMessageSent( response.status == 200, response.text);
            }
        }
        this._requestConnection.send( new ServiceRequest( message, -1, callbackWrapper));
    },

    connectionSucceeded: function ()
    {
        if ( !this.isConnected)
        {
            this.isConnected = true;

            function listenerCaller( listener)
            {
                listener.onConnected();
                return true;
            }
            callListeners( this._connectionListeners, listenerCaller);
        }
    },

    connectionFailed: function ()
    {
        if ( this.isConnected)
        {
            this.isConnected = false;
            this._notifyConnectionFailed();
        }
    },

    _notifyConnectionFailed: function ()
    {
        function listenerCaller( listener)
        {
            listener.onDisconnected();
            return true;
        }
        callListeners( this._connectionListeners, listenerCaller);
    },

    authenticationSucceeded: function ()
    {
        this.isAuthenticated = true;

        function listenerCaller( listener)
        {
            listener.onAuthenticationSucceeded();
            return true;
        }
        callListeners( this._connectionListeners, listenerCaller);
        
        this._updateConnection.onAuthenticationSucceeded();
    },

    authenticationFailed: function ( message)
    {
        this.isAuthenticated = false;

        function listenerCaller( listener)
        {
            listener.onAuthenticationFailed( message);
            return true;
        }
        callListeners( this._connectionListeners, listenerCaller);
    },

    messageReceived: function ( message)
    {
        function listenerCaller( listener)
        {
            return listener.onMessageReceived( message);
        }
        var retval = callListeners( this._connectionListeners, listenerCaller);
        return retval;
    },

    registerContext: function ( context)
    {
        this._updateConnection.registerContext( context);
    },

    unregisterContext: function ( context)
    {
        this._updateConnection.unregisterContext( context);
    },

    contextSensorOn: function ( context)
    {
        this._updateConnection.contextSensorOn( context);
    },

    contextSensorOff: function ( context)
    {
        this._updateConnection.contextSensorOff( context);
    },

    contextActivated: function ( context)
    {
        this._updateConnection.contextActivated( context);
    },

    contextDeactivated: function ( context)
    {
        this._updateConnection.contextDeactivated( context);
    }
};

function MediumServiceContext()
{
    this.id = generateUUID();
    singleton.registerContext( this);
}

MediumServiceContext.prototype =
{
    isSensing: false,
    isActive: false,
    lastSequenceNumber: null,

    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.IMediumServiceContext) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    sensorOn: function ()
    {
        if ( !this.isSensing)
        {
            this.isSensing = true;
            singleton.contextSensorOn( this);
        }
    },

    sensorOff: function ()
    {
        if ( this.isSensing)
        {
            this.isSensing = false;
            singleton.contextSensorOff( this);
        }
    },

    activate: function ()
    {
        this.isActive = true;
        this.lastSequenceNumber = null;
        singleton.contextActivated( this);
    },

    deactivate: function ()
    {
        if ( this.isActive)
        {
            if ( singleton.isAuthenticated)
            {
                singleton.sendMessage( "requestType=contextDeactivated&contextId=" + this.id, null);
            }

            this.isActive = false;
            this.lastSequenceNumber = null;
            singleton.contextDeactivated( this);
        }
    },

    close: function ()
    {
        if ( ( this.isSensing || this.isActive) && singleton.isAuthenticated)
        {
            singleton.sendMessage( "requestType=contextClosed&contextId=" + this.id, null);
        }

        this.isActive = false;
        singleton.unregisterContext( this);
    }
};

function UpdateConnection()
{
    this._connection = new ServiceConnection( "update");
    this._updateCallback = hitch( this, this._handleResponse);
    this._updateRetryTimer = Cc[ "@mozilla.org/timer;1"].createInstance( Ci.nsITimer);
    this._updateRetryCallback = new UpdateConnection._UpdateRetryCallback( this);
    this._registeredContexts = {};
}

UpdateConnection.prototype =
{
    get hasPendingRequest()
    {
        return this._connection.hasPendingRequest;
    },

    authenticate: function (username, password, rememberMe)
    {
        this._connection.authenticate(username, password, rememberMe);
    },

    onAuthenticationSucceeded: function ()
    {
        if ( !this._connection.hasPendingRequest)
        {
            this._pollForUpdates();
        }
    },

    registerContext: function ( context)
    {
        assert( this, function () { return !context.isSensing; });
        assert( this, function () { return !context.isActive; });
        assert( this, function () { return !( context.id in this._registeredContexts); });

        this._registeredContexts[ context.id] = context;
    },

    unregisterContext: function ( context)
    {
        assert( this, function () { return this._registeredContexts[ context.id] == context; });

        delete this._registeredContexts[ context.id];

        if ( context.isSensing || context.isActive)
        {
            this._pollForUpdates();
        }
    },

    contextSensorOn: function ( context)
    {
        assert( this, function () { return this._registeredContexts[ context.id] == context; });
        assert( this, function () { return context.isSensing; });

        this._pollForUpdates();
    },

    contextSensorOff: function ( context)
    {
        assert( this, function () { return this._registeredContexts[ context.id] == context; });
        assert( this, function () { return !context.isSensing; });

        if ( context.isActive)
        {
            this._pollForUpdates();
        }
    },

    contextActivated: function ( context)
    {
        assert( this, function () { return this._registeredContexts[ context.id] == context; });
        assert( this, function () { return context.isActive; });

        this._pollForUpdates();
    },

    contextDeactivated: function ( context)
    {
        assert( this, function () { return this._registeredContexts[ context.id] == context; });
        assert( this, function () { return !context.isActive; });

        this._pollForUpdates();
    },

    close: function ()
    {
        this._connection.close();
    },

    _pollForUpdates: function ()
    {
        if ( singleton.isAuthenticated)
        {
            if ( this._connection.hasPendingRequest)
            {
                singleton.sendMessage( "requestType=releaseUpdate", null);
            }
            else
            {
                var body = [ "requestType=getUpdate" ];
                
                var sendUpdateRequest = false;
                var sendVersionNumber = false;
                var registeredContexts = this._registeredContexts;
                for ( id in registeredContexts)
                {
                    var context = registeredContexts[ id];
                    if ( context.isActive)
                    {
                        sendUpdateRequest = true;
                        var listeningSessionId = id;
                        var sequenceNumber = context.lastSequenceNumber;
                        if ( sequenceNumber != null)
                        {
                            listeningSessionId += ":" + sequenceNumber;
                        }
                        else
                        {
                            sendVersionNumber = true;
                        }
                        body.push( "&listeningSessionIds=");
                        body.push( encodeURIComponent( listeningSessionId));
                    }
                    else if ( context.isSensing)
                    {
                        sendUpdateRequest = true;
                        body.push( "&nonListeningSessionIds=");
                        body.push( id);
                    }
                }

                if ( sendUpdateRequest)
                {
                    if ( sendVersionNumber)
                    {
                        body.push( "&version=");
                        body.push( encodeURIComponent( extensionId + "/" + version));
                    }

                    var timeout = preferences.getIntPref( "update.request.timeout");

                    this._connection.send( new ServiceRequest( body.join( ""), timeout, this._updateCallback));
                }
            }
        }
    },

    _handleResponse: function ( response)
    {
        this._updateRetryTimer.cancel();

        var pollImmediately = false;

        if ( response.status == 200)
        {
            const text = response.text;

            var processedSuccessfully = singleton.messageReceived( text);

            if ( processedSuccessfully)
            {
                try
                {
                    var registeredContexts = this._registeredContexts;
                    const updates = text != null && text != "" ? safeEval( text) : {};
                    for ( var id in updates)
                    {
                        const update = updates[ id];
                        var newSequenceNumber = update.sequenceNumber;
                        if ( newSequenceNumber != undefined)
                        {
                            const context = registeredContexts[ id];
                            if ( context != undefined)
                            {
                                context.lastSequenceNumber = newSequenceNumber;
                            }
                        }
                    }

                    pollImmediately = true;
                }
                catch ( e)
                {
                    logException( e);
                }
            }

            if ( !pollImmediately)
            {
                var registeredContexts = this._registeredContexts;
                for ( id in registeredContexts)
                {
                    registeredContexts[ id].lastSequenceNumber = null;
                }
            }
        }

        if ( pollImmediately)
        {
            this._pollForUpdates();
        }
        else
        {
            var interval = preferences.getIntPref( "update.retry.interval");
            this._updateRetryTimer.initWithCallback( this._updateRetryCallback, interval, Ci.nsITimer.TYPE_ONE_SHOT);
        }
    },

    _retryUpdate: function ()
    {
        if ( !this._connection.hasPendingRequest)
        {
            this._pollForUpdates();
        }
    }
}

UpdateConnection._UpdateRetryCallback = function ( connection)
{
    this._connection = connection;
}

UpdateConnection._UpdateRetryCallback.prototype =
{
    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.nsITimerCallback) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    notify: function ( timer)
    {
        this._connection._retryUpdate();
    }
};

function QueuingServiceConnection( name)
{
    this._connection = new ServiceConnection( name);
    this._queue = [];
}

QueuingServiceConnection.prototype =
{
    _haveRequestOutstanding: false,

    get hasPendingRequest()
    {
        return this._queue.length > 0 || this._connection.hasPendingRequest;
    },

    send: function ( request)
    {
        this._queue.push( request);

        if ( !this._haveRequestOutstanding)
        {
            this._haveRequestOutstanding = true;
            this._next();
        }
    },

    close: function ()
    {
        var queue = this._queue;
        this._queue = [];

        this._connection.close();

        while ( queue.length > 0)
        {
            var callback = queue.shift().callback;
            if ( callback != null)
            {
                try
                {
                    callback( null);
                }
                catch ( e)
                {
                    logException( e);
                }
            }
        }

        assert( this, function () { return !this._haveRequestOutstanding; });
    },

    _next: function ()
    {
        assert( this, function () { return this._queue.length > 0; });
        var originalRequest = this._queue.shift();

        var self = this;
        function dequeuingCallback( response)
        {
            if ( self._queue.length == 0)
            {
                self._haveRequestOutstanding = false;
            }
            else
            {
                self._next();
            }

            var callback = originalRequest.callback;
            if ( callback != null)
            {
                try
                {
                    callback( response);
                }
                catch ( e)
                {
                    logException( e);
                }
            }
        }

        this._connection.send( new ServiceRequest( originalRequest.body, originalRequest.timeout, dequeuingCallback));
    }
};

function ServiceConnection( name)
{
    this._connection = new HttpConnection( name);
}

ServiceConnection.prototype =
{
    get hasPendingRequest()
    {
        return this._connection.hasPendingRequest;
    },

    authenticate: function (username, password, rememberMe)
    {
        this._authenticate( username, password, rememberMe, null, null);
    },

    send: function ( request)
    {
        var self = this;
        function authenticatingCallback( response)
        {
            self._checkResponse( response);

            if ( response.status == 403)
            {
                self._authenticate( null, null, false, request, response);
            }
            else
            {
                try
                {
                    var callback = request.callback;
                    if ( callback != null)
                    {
                        callback( response);
                    }
                }
                catch ( e)
                {
                    logException( e);
                }
            }
        }
        this._send( new ServiceRequest( request.body, request.timeout, authenticatingCallback));
    },

    close: function ()
    {
        this._connection.close();
    },

    _send: function ( request)
    {
        var timeout = request.timeout;
        if ( timeout < 0)
        {
            timeout = preferences.getIntPref( "default.request.timeout");
        }
            
        this._connection.send( "POST", preferences.getCharPref( "service.url"), request.body, timeout, request.callback);
    },

    _authenticate: function ( username, password, rememberMe, originalRequest, originalResponse)
    {
        if ( singleton.isAuthenticationInProgress)
        {
            return;
        }
        singleton.isAuthenticationInProgress = true;

        assert( this, function () { return originalRequest == null || originalResponse != null; });
        assert( this, function () { return originalRequest != null || originalResponse == null; });
        
        const host = ioService.newURI( preferences.getCharPref( "service.url"), null, null).host;
        
        var self = this;
        function authenticationCallback( response)
        {            
            singleton.isAuthenticationInProgress = false;

            if ( self._checkResponse( response))
            {
                if ( response.status == 200)
                {
                    var enumerator = cookieManager.enumerator;
                    while ( enumerator.hasMoreElements())
                    {
                        try
                        {
                            var entry = enumerator.getNext().QueryInterface( Ci.nsICookie);
                                
                            if ( entry.host == host && entry.name == "JSESSIONID")
                            {
                                var hasSession =  true;
                                break;                                
                            }
                            
                        }
                        catch ( e)
                        {
                            logException( e);
                        }
                    }
                    
                    if ( hasSession)
                    {       
                        if ( originalRequest != null)
                        {
                            self._send( originalRequest);
                        }

                        singleton.authenticationSucceeded();
                    
                    }
                    else
                    { 
                        singleton.authenticationFailed();

                        if ( originalRequest != null && originalRequest.callback != null)
                        {
                            try
                            {
                                originalRequest.callback( originalResponse);
                            }
                            catch ( e)
                            {
                                logException( e);
                            }
                        }
                    }
                }
                else
                {
                    if ( response.status == 403)
                    {
                        if (username && password) {
                            // Authenticate failed
                            singleton.authenticationFailed( response.text);
                        } else if (!self.triedGuest){
                            // Retry (as guest).
                            self.triedGuest = true;
                            self._authenticate( null, null, false, originalRequest, originalResponse);
                        } else {
                            // Authenticate failed
                            singleton.authenticationFailed( response.text);
                        }
                    } else {
                        // Authenticate failed
                        singleton.authenticationFailed( response.text);
                    }

                    if ( originalRequest != null && originalRequest.callback != null)
                    {
                        try
                        {
                            originalRequest.callback( originalResponse);
                        }
                        catch ( e)
                        {
                            logException( e);
                        }
                    }
                }
            }
            else
            {
                singleton.authenticationFailed( "Connection failed");

                if ( originalRequest != null && originalRequest.callback != null)
                {
                    try
                    {
                        originalRequest.callback( originalResponse);
                    }
                    catch ( e)
                    {
                        logException( e);
                    }
                }
            }
        }

        var body = [ "requestType=Authenticate", "&version=", encodeURIComponent( extensionId + "/" + version)];

        if (username && password) {
            body.push("&username=", encodeURIComponent(username), "&password=", encodeURIComponent(password));                
        }

        if (rememberMe) {
            body.push("&rememberMe=true");
        }
        
        this._send( new ServiceRequest( body.join( ""), -1, authenticationCallback));
    },

    _checkResponse: function ( response)
    {
        var connectionOk = false;
        if ( response != null)
        {
            var status = response.status;
            if ( 100 <= status && status <= 599)
            {
                connectionOk = true;
            }
        }

        if ( connectionOk)
        {
            singleton.connectionSucceeded();
        }
        else
        {
            singleton.connectionFailed();
        }
        return connectionOk;
    }
};

function ServiceRequest( body, timeout, callback)
{
    this.body = body;
    this.timeout = timeout;
    this.callback = callback;
}

function HttpConnection( name)
{
    this._name = name;
    this._timer = Cc[ "@mozilla.org/timer;1"].createInstance( Ci.nsITimer);
}

HttpConnection.prototype =
{
    _requestNumber: 1,
    _pendingRequest: null,
    _idleRequest: null,
    _callback: null,

    hasPendingRequest: false,

    send: function ( method, url, body, timeout, callback)
    {
        if ( method != "GET" && method != "POST")
        {
            throw Cr.NS_ERROR_INVALID_ARG;
        }
        if ( typeof( url) != "string")
        {
            throw Cr.NS_ERROR_INVALID_ARG;
        }
        if ( this.hasPendingRequest)
        {
            throw Cr.NS_ERROR_UNEXPECTED;
        }

        this.hasPendingRequest = true;

        assert( this, function () { return this._callback == null; });
        if ( callback != undefined)
        {
            this._callback = callback;
        }

        this._timer.initWithCallback( new HttpConnection._SendCallback( this, method, url, body, timeout), 0, Ci.nsITimer.TYPE_ONE_SHOT);
    },

    close: function ()
    {
        this._abort();
        this._idleRequest = null;
    },

    _send: function ( method, url, body, timeout)
    {
        if ( method != "GET" && method != "POST")
        {
            throw Cr.NS_ERROR_INVALID_ARG;
        }
        if ( typeof( url) != "string")
        {
            throw Cr.NS_ERROR_INVALID_ARG;
        }
        if ( this._pendingRequest != null)
        {
            throw Cr.NS_ERROR_UNEXPECTED;
        }

        var request = this._idleRequest;
        if ( request != null)
        {
            this._idleRequest = null;
        }
        else
        {
            request = Cc[ "@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance( Ci.nsIXMLHttpRequest);
        }

        const requestNumber = this._requestNumber;

        if ( logger.isDebugLoggingEnabled)
        {
            logger.logDebug( [ this._name, " request ", requestNumber, " to <", url, ">: ", method, " ", body].join( ""));
        }
        cookiePermissions.setAccess( ioService.newURI( url, null, null), Ci.nsICookiePermission.ACCESS_ALLOW);

        request.open( method, url, true);
        const eventHandler = new HttpConnection._EventHandler();
        eventHandler.advise( this, request, requestNumber);
        this._pendingRequest = request;

        if ( method == "POST")
        {            
            request.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded");
        }

        try
        {
            request.send( body);
        }
        catch ( e)
        {
                        
            // Break the reference cycle
            eventHandler.unadvise();

            this.hasPendingRequest = false;
            this._pendingRequest = null;
            var callback = this._callback;
            this._callback = null;

            if ( callback != undefined)
            {
                try
                {
                    callback( null);
                }
                catch ( e)
                {
                    logException( e);
                }
            }
            
            throw e;
        }

        // No need to start the timer if the request was fulfilled completely within request.send()
        if ( this._requestNumber == requestNumber)
        {
            assert( this, function () { return this.hasPendingRequest; });
            this._timer.initWithCallback( new HttpConnection._TimeoutCallback( this, requestNumber), timeout, Ci.nsITimer.TYPE_ONE_SHOT);
        }
        else
        {
            assert( this, function () { return !this.hasPendingRequest; });
        }
    },

    _onRequestComplete: function ( request, requestNumber)
    {
        if ( requestNumber == this._requestNumber)
        {
            var status;
            try
            {
                status = request.status;
            }
            catch ( e)
            {
                if ( e.result == Cr.NS_ERROR_NOT_AVAILABLE)
                {
                    status = request.channel.status;
                }
                else
                {
                    throw e;
                }
            }

            if ( logger.isDebugLoggingEnabled)
            {
                logger.logDebug( [ this._name, " response ", requestNumber, ": ", status, " ", request.responseText].join( ""));
            }

            assert( this, function () { return this.hasPendingRequest; });
            assert( this, function () { return this._pendingRequest == request; });

            this._timer.cancel();

            this.hasPendingRequest = false;
            this._pendingRequest = null;

            const response = new HttpConnection.Response( status, request.responseText);

            this._idleRequest = request;
            ++this._requestNumber;

            var callback = this._callback;
            if ( callback != null)
            {
                this._callback = null;
                try
                {
                    callback( response);
                }
                catch ( e)
                {
                    logException( e);
                }
            }
        }
    },

    _onTimeout: function ( requestNumber)
    {
        if ( requestNumber == this._requestNumber)
        {
            this._abort();
        }
    },

    _abort: function ()
    {
        this._timer.cancel();

        var request = this._pendingRequest;
        if ( request != null)
        {
            if ( logger.isDebugLoggingEnabled)
            {
                logger.logDebug( "aborting " + this._name + " request " + this._requestNumber);
            }

            ++this._requestNumber;
            this.hasPendingRequest = false;
            this._pendingRequest = null;

            try
            {
                request.abort();
            }
            catch ( e)
            {
                logException( e);
            }
        }

        var callback = this._callback;
        if ( callback != null)
        {
            this._callback = null;
            
            try
            {
                callback( new HttpConnection.Response( -1, null));
            }
            catch ( e)
            {
                logException( e);
            }
        }
    }
}

HttpConnection._SendCallback = function ( connection, method, url, body, timeout)
{
    this._connection = connection;
    this._method = method;
    this._url = url;
    this._body = body;
    this._timeout = timeout;
}

HttpConnection._SendCallback.prototype =
{
    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.nsITimerCallback) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    notify: function ( timer)
    {
        this._connection._send( this._method, this._url, this._body, this._timeout);
    }
};

HttpConnection.Response = function ( status, text)
{
    this.status = status;
    this.text = text;
}

HttpConnection._EventHandler = function ()
{
}

HttpConnection._EventHandler.prototype =
{
    _requestNumber: 0,
    _request: null,
    _connection: null,

    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.nsIDOMEventListener) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    advise: function ( connection, request, requestNumber)
    {
        this._connection = connection;
        this._request = request;
        this._requestNumber = requestNumber;

        request.addEventListener( "load", this, false);
        request.addEventListener( "error", this, false);
    },

    unadvise: function ()
    {
        const request = this._request;
        request.removeEventListener( "load", this, false);
        request.removeEventListener( "error", this, false);
    },

    handleEvent: function ( event)
    {
        this.unadvise();
        this._connection._onRequestComplete( this._request, this._requestNumber);
    }
};

HttpConnection._TimeoutCallback = function ( connection, requestNumber)
{
    this._connection = connection;
    this._requestNumber = requestNumber;
}

HttpConnection._TimeoutCallback.prototype =
{
    QueryInterface: function ( iid)
    {
        if ( iid.equals( Ci.nsITimerCallback) ||
             iid.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    notify: function ( timer)
    {
        this._connection._onTimeout( this._requestNumber);
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

function hitch( context, method)
{
    return function () { return method.apply( context, arguments); };
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

function generateUUID()
{
    var uuid;
    const UUIDGenerator = Cc[ "@mozilla.org/uuid-generator;1"];
    if ( UUIDGenerator != undefined)
    {
        uuid = UUIDGenerator.getService( Ci.nsIUUIDGenerator).generateUUID().toString().slice( 1, -1)
    }
    else
    {
        // Creates a version 4 UUID
        uuid = [ generateRandomDoubleOctet() + generateRandomDoubleOctet(), // time_low
                 generateRandomDoubleOctet(), // time_mid
                 generateRandomDoubleOctet( 0x4000, 0xF000), // time_hi_and_version
                 generateRandomDoubleOctet( 0x8000, 0xC000), // clk_seq_hi_and_reserved, clk_seq_low
                 generateRandomDoubleOctet() + generateRandomDoubleOctet() + generateRandomDoubleOctet() // node
               ].join( "-");
    }
    return uuid;
}

function generateRandomDoubleOctet( flags, mask)
{
    if ( flags == undefined)
    {
        flags = 0;
    }
    if ( mask == undefined)
    {
        mask = 0;
    }
    mask &= 0xffff;
    return ( ( ( Math.floor( Math.random() * 0x10000) & ~mask) | ( flags & mask)) + 0x10000).toString( 16).substring( 1);
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
        "{26b449a7-6287-4938-93d6-53cf78ee9aa8}":
        {
            className: "MediumServiceSingleton",
            contractId: "@me.dium.com/service-singleton;1",
                            
            createInstance: function( outer, iid)
            {
                if ( outer != null)
                {
                    throw Cr.NS_ERROR_NO_AGGREGATION;
                }
                if ( !iid.equals( Ci.IMediumServiceSingleton) &&
                     !iid.equals( Ci.nsISupports))
                {
                    throw Cr.NS_ERROR_INVALID_ARG;
                }

                if ( singleton == null)
                {
                    singleton = new MediumServiceSingleton();
                }
                return singleton;
            }
        }
    };

    return new Module( classFactories);
}
