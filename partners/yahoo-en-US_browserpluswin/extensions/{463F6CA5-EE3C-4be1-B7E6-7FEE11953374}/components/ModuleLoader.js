/*
 * ModuleLoader.js by Alex Sirota, FoxyTunes
 * 
 * Based on:
 *   aboutKitchenSinkModules.js
 *   JavaScript framework for JavaScript-based XPCOM component registration
 *   Mook 2004 / 2005
 *   License: MPL
 */

var KnownComponents = [
    {
		Constructor: 'FoxyTunesService',
		ProgID: "@foxytunes.org/FoxyTunesEngine/FoxyTunesService;1",
		CID: Components.ID("{8AE88EE0-C1A6-4691-B1CC-6370F5F5E158}"),
		Description: "FoxyTunes Service",
        Filename : "chrome://foxytunes/content/players/FoxyTunesService.js"
	},

	{
		Constructor: 'FoxyTunesPandoraController',
		ProgID: "@foxytunes.org/FoxyTunes/Pandora;1",
		CID: Components.ID("{FBCF974A-4E29-4f1e-B4BC-51953D408523}"),
		Description: "FoxyTunes Pandora Controller",
        Filename : "chrome://foxytunes/content/players/FoxyTunesPandora.js"
	},

    {
		Constructor: 'FoxyTunesLastFMController',
		ProgID: "@foxytunes.org/FoxyTunes/Last.fm;1",
		CID: Components.ID("{1FE309A9-96BE-4243-9051-8D3877CDD735}"),
		Description: "FoxyTunes Last.fm Controller",
        Filename : "chrome://foxytunes/content/players/FoxyTunesLastFM.js"
	},
	
	{
		Constructor: 'FoxyTunesRhapsodyController',
		ProgID: "@foxytunes.org/FoxyTunes/Rhapsody;1",
		CID: Components.ID("{A4B65999-9849-4206-A9D4-180039232132}"),
		Description: "FoxyTunes Rhapsody Controller",
        Filename : "chrome://foxytunes/content/players/FoxyTunesRhapsody.js"
	},

    {
		Constructor: 'FoxyTunesYahooMediaPlayerController',
		ProgID: "@foxytunes.org/FoxyTunes/YahooMediaPlayer;1",
		CID: Components.ID("{8A042AE6-CB43-11DC-81AB-072F56D89593}"),
		Description: "FoxyTunes Yahoo! Media Player Controller",
        Filename : "chrome://foxytunes/content/players/FoxyTunesYahooMediaPlayer.js"
	},

    {
		Constructor: 'FoxyTunesXBMCController',
		ProgID: "@foxytunes.org/FoxyTunes/XboxMediaCenter;1",
		CID: Components.ID("{35125915-C29D-48f6-85F3-38161D4A781E}"),
		Description: "FoxyTunes Xbox Media Center Controller",
        Filename : "chrome://foxytunes/content/players/FoxyTunesXBMC.js"
	},

    {
		Constructor: 'FoxyTunesYouTubeController',
		ProgID: "@foxytunes.org/FoxyTunes/YouTube;1",
		CID: Components.ID("{CFB58D38-1597-11DE-A654-78EF55D89593}"),
		Description: "FoxyTunes YouTube Controller",
        Filename : "chrome://foxytunes/content/players/FoxyTunesYouTube.js"
	},

	{
		Constructor: 'FoxyTunesSearchEngineService',
		ProgID: "@mozilla.org/rdf/datasource;1?name=foxyTunesSearchEngines",
		CID: Components.ID("{f0dfffdb-8b44-416a-b338-fa1f7b40cf14}"),
		Description: "FoxyTunes Search Engine Service and DS",
        Filename : "chrome://foxytunes/content/search/FoxyTunesSearchEngineService.js"
	},

    {
		Constructor: 'FoxyTunesAnonymousInstallStatsService',
		ProgID: "@foxytunes.org/FoxyTunesEngine/FoxyTunesAnonymousInstallStatsService;1",
		CID: Components.ID("{1C8BFC60-8E56-11DD-8175-657D56D89593}"),
		Description: "FoxyTunes Anonymous Install Statistics Service",
        Filename : "chrome://foxytunes/content/anonymous-stats/FoxyTunesAnonymousInstallStatsService.js"
	}

];

var ModuleName = "FoxyTunesJSModule";


/* DO NOT CHANGE ANYTHING BELOW THIS LINE !!! */

function loadExternalScript(url) {
	var loader = Components.classes['@mozilla.org/moz/jssubscript-loader;1']
		.createInstance(Components.interfaces['mozIJSSubScriptLoader']);
	try {
			loader.loadSubScript(url);
	} catch (ex) {
			dump('JavaScript-XPCOM module error:\n');
			dump('While loading external script "' 
				+ url + '":\n');
			dump(ex + '\n');
			try {
				dump('File: ' + ex.filename + '\n');
				dump('Line: ' + ex.lineNumber + '\n');
				if (ex.location) {
					dump('Stack File: ' + ex.location.filename + '\n');
					dump('Stack Line: ' + ex.location.lineNumber + '\n');
					dump('Stack Source: ' + ex.location.sourceLine + '\n');
				}
			} catch (e) {
				// we had problems dumping the error - too bad
				dump('(Error retrieving error location)\n');
			}
			throw(ex);
	}
}

var ftJSModules = {
	_firstTime: true,
	
	registerSelf: function (aComponentManager, aFileSpec, aLocation, aType) {
		var index, info;
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results['NS_ERROR_FACTORY_REGISTER_AGAIN'];
		}
		aComponentManager = aComponentManager
			.QueryInterface(Components.interfaces['nsIComponentRegistrar']);
		
		// No idea how to do this only for debug builds... :p
		dump("*** Registering " + ModuleName
			+ " components (all right -- a JavaScript module!)\n");
		
		for (index in KnownComponents) {
			var info = KnownComponents[index];
			if ("undefined" == typeof(info.CID) || !(info.CID))
				continue;
			aComponentManager.registerFactoryLocation(
				info.CID,
				info.Description,
				info.ProgID,
				aFileSpec,
				aLocation,
				aType
				);
		}
	},

	getClassObject: function (aComponentManager, aCID, aIID) {
		var index, info;
		for (index in KnownComponents) {
			info = KnownComponents[index];
			if (("undefined" != typeof(info.CID)) && (info.CID) 
			  && (aCID.equals(info.CID)))
				return {
					createInstance: function( aOuter, aIID ) {
						if (aOuter != null)
							throw Components.results['NS_ERROR_NO_AGGREGATION'];
                        if (eval('typeof ' + info.Constructor) == 'undefined') {
                            loadExternalScript(info.Filename); 
                        }
                        
	                    var newObject = (new (eval(info.Constructor)));
                        // we can implement a JS XPCOM component w/o QI:
			            return newObject.QueryInterface ? newObject.QueryInterface(aIID) : newObject;  
					},
					lockFactory: function ( aLock ) {
						throw Components.results['NS_ERROR_NOT_IMPLEMENTED'];
					},
					QueryInterface: function( aIID ) {
						if ( aIID.equals(Components.interfaces['nsISupports'])
						  || aIID.equals(Components.interfaces['nsIFactory']))
							return this;
						throw Components.results['NS_ERROR_NO_INTERFACE'];
					}
				};
		}

		if (!aIID.equals(Components.interfaces['nsIFactory']))
			throw Components.results['NS_ERROR_NOT_IMPLEMENTED'];
	
		throw Components.results['NS_ERROR_NO_INTERFACE'];
	},

	canUnload: function (aComponentManager) {
		return true;
	}
};

function NSGetModule( aComponentManager, aFileSpec ) {
	return ftJSModules;
}
