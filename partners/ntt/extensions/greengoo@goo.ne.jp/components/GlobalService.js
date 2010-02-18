// -*- indent-tabs-mode: t -*- 
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is My Theme.
 *
 * The Initial Developer of the Original Code is ClearCode Inc.
 * Portions created by the Initial Developer are Copyright (C) 2007-2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): SHIMODA Hiroshi <shimoda@clear-code.com>
 *                 Kouhei Sutou <kou@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const kCID  = Components.ID('{57f56aca-7338-11dc-8314-0800200c9a66}'); 
const kID   = '@goo.ne.jp/greengoo/startup;1';
const kNAME = "goo Green Label Global Service";

const kEXTENSION_ID = 'greengoo@goo.ne.jp';

const kOVERLAY_STYLE_NAME   = 'greengoo';
const kOVERLAY_STYLE_TARGET = 0; // 0 = all, 1 = specified

const kOVERLAY_STYLE_TARGET_RULES = [
		'chrome://browser/content/.+'
	];
const kOVERLAY_STYLE_TARGET_EXCEPTIONS = [
		'chrome://browser/content/preferences/'
	];

const kPREF_ROOT                = 'extensions.greengoo';
const kPREF_STYLE_ENABLED       = kPREF_ROOT + '.style.enabled';
const kPREF_CONFIRM_ENABLED     = kPREF_ROOT + '.style.confirm.enabled';
const kPREF_TEXTSHADOW_ENABLED  = kPREF_ROOT + '.style.textshadow';

const kPREF_LAST_SELECTED_THEME       = 'extensions.lastSelectedSkin';
const kPREF_SELECTED_THEME            = 'general.skins.selectedSkin';
const kPREF_LIGHTWEIGHT_THEME_ENABLED = 'lightweightThemes.isThemeSelected';
const kPREF_LIGHTWEIGHT_THEME_PREVIEW = kPREF_ROOT + '.lightweightThemes.previewing';

const kMYTHEME_PREF = 'extensions.mytheme.installed';

const kOVERLAY_STYLE_URI = 'chrome://greengoo/content/overlayStyle.xul';
const kBUNDLE_URI        = 'chrome://greengoo/locale/greengoo.properties';

const kCOMPETING_ADDONS = [
		'personas@christopher.beard',
		'greengoo@goo.ne.jp'
	];
const kBASE_THEME = 'classic/1.0';

//--------------------------------------------------------------------------

const kOVERLAY_ATTRIBUTE  = 'global-overlay-style';
const kOVERLAY_READY_ATTRIBUTE  = 'global-overlay-style-ready';
const kOVERLAY_TEXTSHADOW = '_textshadow';

const ObserverService = Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);
const XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
			.getService(Components.interfaces.nsIXULAppInfo);
const Comparator = Components.classes['@mozilla.org/xpcom/version-comparator;1']
			.getService(Components.interfaces.nsIVersionComparator);

var WindowWatcher,
	Pref,
	PromptService,
	EM,
	RDF,
	overlayTargetRule,
	overlayTargetException;
	 
function GlobalOverlayStyleService() { 
}
GlobalOverlayStyleService.prototype = {
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'final-ui-startup', false);
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');

				this.init();
				try {
					this.onStartup();
				}
				catch(e) {
				}
				return;

			case 'domwindowopened':
				this.applyTheme(aSubject);
				return;
		}
	},
 
	init : function() 
	{
		WindowWatcher = Components.classes['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Components.interfaces.nsIWindowWatcher);

		Pref = Components.classes['@mozilla.org/preferences;1']
				.getService(Components.interfaces.nsIPrefBranch)
				.QueryInterface(Components.interfaces.nsIPrefBranch2);

		PromptService = Components.classes['@mozilla.org/embedcomp/prompt-service;1']
				.getService(Components.interfaces.nsIPromptService);

		EM = Components.classes['@mozilla.org/extensions/manager;1']
				.getService(Components.interfaces.nsIExtensionManager);

		RDF = Components.classes['@mozilla.org/rdf/rdf-service;1']
				.getService(Components.interfaces.nsIRDFService);

		overlayTargetRule = kOVERLAY_STYLE_TARGET_RULES.length ? new RegExp('('+kOVERLAY_STYLE_TARGET_RULES.join('|')+')') : /./;
		overlayTargetException = kOVERLAY_STYLE_TARGET_EXCEPTIONS.length ? new RegExp('('+kOVERLAY_STYLE_TARGET_EXCEPTIONS.join('|')+')') : /[^\s\S]/;

		WindowWatcher.registerNotification(this);

	},
 
	get bundle() 
	{
		if (!this._bundle) {
			this._bundle = Components.classes['@mozilla.org/intl/stringbundle;1']
						.getService(Components.interfaces.nsIStringBundleService)
						.createBundle(kBUNDLE_URI);
		}
		return this._bundle;
	},
	_bundle : null,
 
	onStartup : function() 
	{
		Pref.setBoolPref(kPREF_LIGHTWEIGHT_THEME_PREVIEW, false);
		this.checkCompeting();
	},
 
	get installedIDs()
	{
		var installed = [];
		try {
			installed = Pref.getCharPref(kMYTHEME_PREF).split(',');
		}
		catch(e) {
		}
		if (installed.indexOf(kEXTENSION_ID) < 0) {
			installed.push(kEXTENSION_ID);
			Pref.setCharPref(kMYTHEME_PREF, installed.join(','));
		}
		return installed;
	},
	
	checkCompeting : function() 
	{
		if (!Pref.getBoolPref(kPREF_CONFIRM_ENABLED)) return;

		var theme      = this.checkCompetingTheme();
		var extensions = this.getCompetingExtensions(theme);
		if (!theme && !extensions.length) {
			return;
		}

		var shouldRestart = false;
		var checked = { value : true };

		var title, message, checkLabel;
		if (theme && !extensions.length) {
			title = 'resolve_theme_confliction_title';
			message = 'resolve_theme_confliction_text';
			checkLabel = 'resolve_theme_confliction_check';
		}
		else if (!theme && extensions.length) {
			title = 'resolve_extensions_confliction_title';
			message = 'resolve_extensions_confliction_text';
			checkLabel = 'resolve_extensions_confliction_check';
		}
		else {
			title = 'resolve_all_confliction_title';
			message = 'resolve_all_confliction_text';
			checkLabel = 'resolve_all_confliction_check';
		}

		var buttonsFlag =
				(PromptService.BUTTON_TITLE_YES * PromptService.BUTTON_POS_0) +
				(PromptService.BUTTON_TITLE_NO  * PromptService.BUTTON_POS_1);

		if (PromptService.confirmEx(
				null,
				this.bundle.GetStringFromName(title),
				this.bundle.GetStringFromName(message).replace(/%s/i, extensions.join('\n')),
				buttonsFlag,
				null, null, null,
				this.bundle.GetStringFromName(checkLabel),
				checked
			) == 0) {
			if (theme) {
				var isBaseTheme = true;
				try {
					isBaseTheme = Pref.getCharPref(kPREF_LAST_SELECTED_THEME) != kBASE_THEME;
				}
				catch(e) {
				}
				if (!isBaseTheme) {
					Pref.setCharPref(kPREF_LAST_SELECTED_THEME, kBASE_THEME);
					if (Pref.getBoolPref('extensions.dss.enabled')) {
						Pref.setCharPref(kPREF_SELECTED_THEME, kBASE_THEME);
					}
					else {
						Pref.setBoolPref('extensions.dss.switchPending', true);
						shouldRestart = true;
					}
				}
				try {
					if (Pref.getBoolPref(kPREF_LIGHTWEIGHT_THEME_ENABLED))
						Pref.setBoolPref(kPREF_LIGHTWEIGHT_THEME_ENABLED, false);
				}
				catch(e) {
				}
			}
			if (extensions.length) {
				var ids = [].concat(kCOMPETING_ADDONS, this.installedIDs);
				var done = {};
				for (var i = 0, maxi = ids.length; i < maxi; i++)
				{
					if (!EM.getInstallLocation(ids[i]) ||
						ids[i] == kEXTENSION_ID ||
						ids[i] in done)
						continue;
					EM.disableItem(ids[i]);
					done[ids[i]] = true;
				}
				shouldRestart = true;
			}
		}

		if (!checked.value) {
			Pref.setBoolPref(kPREF_CONFIRM_ENABLED, false);
		}

		if (shouldRestart) {
			this.restart();
		}
	},
	
	checkCompetingTheme : function() 
	{
		if (!Pref.getBoolPref(kPREF_STYLE_ENABLED) ||
			StyleChecker.isBaseThemeSelected()) {
			return false;
		}

		try {
			if (Pref.getCharPref(kPREF_LAST_SELECTED_THEME) == kBASE_THEME) {
				return false;
			}
		}
		catch(e) {
		}

		return true;
	},
 
	getCompetingExtensions : function(aThemeShouldBeChanged) 
	{
		var items = [];

		if (
			!aThemeShouldBeChanged &&
			(
				!Pref.getBoolPref(kPREF_STYLE_ENABLED) ||
				!StyleChecker.isBaseThemeSelected()
			)
			) {
			return items;
		}

		var ids = [].concat(kCOMPETING_ADDONS, this.installedIDs);
		var done = {};
		for (var i = 0, maxi = ids.length; i < maxi; i++)
		{
			if (!EM.getInstallLocation(ids[i]) ||
				ids[i] in done) {
				continue;
			}
			var item = EM.getItemForID(ids[i]);
			var res  = RDF.GetResource('urn:mozilla:item:'+ids[i]);
			if (ids[i] == kEXTENSION_ID) {
				if (this._getRDFValue(res, "appDisabled") == 'needs-disable' ||
					this._getRDFValue(res, "userDisabled") == 'needs-disable')
					return [];
				continue;
			}
			if (this._getRDFValue(res, "appDisabled") != 'true' &&
				this._getRDFValue(res, "appDisabled") != 'needs-disable' &&
			    this._getRDFValue(res, "userDisabled") != 'true' &&
			    this._getRDFValue(res, "userDisabled") != 'needs-disable') {
				items.push(item.name);
				done[ids[i]] = true;
			}
		}

		return items;
	},
   
	_getRDFValue : function(aResource, aID) 
	{
	    try {
		var uri, datasource, target, iface;
		uri = 'http://www.mozilla.org/2004/em-rdf#' + aID;
		datasource = EM.datasource;
		target = datasource.GetTarget(aResource,
					      RDF.GetResource(uri),
					      true);
		iface = Components.interfaces.nsIRDFLiteral;
		return target.QueryInterface(iface).Value;
	    }
	    catch(e) {
		return undefined;
	    }
	},
   
	restart : function() 
	{
		const startup = Components.classes['@mozilla.org/toolkit/app-startup;1']
						.getService(Components.interfaces.nsIAppStartup);
		startup.quit(startup.eRestart | startup.eAttemptQuit);
	},
 
	applyTheme : function(aWindow) 
	{
		if (aWindow != '[object ChromeWindow]') return;

		aWindow.addEventListener('load', function() {
			aWindow.removeEventListener('load', arguments.callee, false);

			if (
				kOVERLAY_STYLE_TARGET == 1 &&
				(
					!overlayTargetRule.test(aWindow.location.href) ||
					overlayTargetException.test(aWindow.location.href)
				)
				)
				return;

			aWindow.document.loadOverlay(kOVERLAY_STYLE_URI, null);

			var observer = new WindowObserver(aWindow);

			Pref.addObserver(kPREF_ROOT, observer, false);
			Pref.addObserver(kPREF_LIGHTWEIGHT_THEME_ENABLED, observer, false);

			observer.observe(null, 'nsPref:changed', kPREF_STYLE_ENABLED);

			aWindow.setTimeout(function() {
				aWindow.document.documentElement.setAttribute(kOVERLAY_READY_ATTRIBUTE, true);

				// for lightweight theme
				var gBrowser = aWindow.document.getElementById('content');
				if (gBrowser && gBrowser.localName == 'tabbrowser') {
					gBrowser.mPanelContainer.addEventListener('PreviewBrowserTheme', observer, false, true);
					gBrowser.mPanelContainer.addEventListener('ResetBrowserThemePreview', observer, false, true);
					gBrowser.mTabContainer.addEventListener('TabSelect', observer, false);
				}
				aWindow.addEventListener('pagehide', observer, false);
			}, 0);

			aWindow.addEventListener('unload', function() {
				aWindow.removeEventListener('unload', arguments.callee, false);
				Pref.removeObserver(kPREF_ROOT, observer, false);
				Pref.removeObserver(kPREF_LIGHTWEIGHT_THEME_ENABLED, observer, false);

				// for lightweight theme
				var gBrowser = aWindow.document.getElementById('content');
				if (gBrowser && gBrowser.localName == 'tabbrowser') {
					gBrowser.mPanelContainer.removeEventListener('PreviewBrowserTheme', observer, false, true);
					gBrowser.mPanelContainer.removeEventListener('ResetBrowserThemePreview', observer, false, true);
					gBrowser.mTabContainer.removeEventListener('TabSelect', observer, false);
				}
				aWindow.removeEventListener('pagehide', observer, false);
			}, false);
		}, false);
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 
  
const kOSX_TCOLORS_ATTR = 'titlebarcolor|activetitlebarcolor|inactivetitlebarcolor'.split('|');
const kOSX_TCOLORS_BACKUP = 'titlebarcolors-backup';
const kOSX_UNIFIED_WINDOWS = [
		'chrome://browser/content/browser.xul',
		'chrome://browser/content/pageinfo/pageInfo.xul',
		'chrome://browser/content/places/places.xul',
		'chrome://messenger/content/messenger.xul',
		'chrome://messenger/content/messageWindow.xul',
		'chrome://messenger/content/messengercompose/messengercompose.xul',
		'chrome://messenger/content/addressbook/addressbook.xul',
		'chrome://global/content/console.xul',
		'chrome://mozapps/content/extensions/extensions.xul'
	].join('\n');
 
function WindowObserver(aWindow) { 
	this.window = aWindow;
	this.init();
}
WindowObserver.prototype = {
	
	init : function() 
	{
		this.initUnifiedPrefWindow();
	},
 
	initUnifiedPrefWindow : function() 
	{
		var root = this.window.document.documentElement;
		if (
			!this.isGecko19 ||
			root.localName != 'prefwindow' ||
			(
				!this.isGecko191 &&
				!kOSX_TCOLORS_ATTR.some(function(aAttr) {
					return root.getAttribute(aAttr);
				})
			)
			)
			return;

		this.isUnifiedPrefWindow = true;

		var selector = this.window.document.getAnonymousElementByAttribute(root, 'anonid', 'selector');

		var bgBox = this.window.document.createElement('toolbar');
		bgBox.setAttribute('class', 'greengoo-selector-background toolbar-primary');
		this.window.setTimeout(function(aSelf) {
			bgBox.setAttribute('style',
				'width: '+(aSelf.isGecko191 ?
					aSelf.window.innerWidth :
					selector.boxObject.width
				)+'px !important;'
			);
		}, 0, this);
		root.appendChild(bgBox);
	},
	isUnifiedPrefWindow : false,
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		if (!this.window.document) return;

		switch (aPrefName)
		{
			case kPREF_STYLE_ENABLED:
			case kPREF_TEXTSHADOW_ENABLED:
			case kPREF_LIGHTWEIGHT_THEME_ENABLED:
			case kPREF_LIGHTWEIGHT_THEME_PREVIEW:
				var node = this.window.document.documentElement;
				var color = this.window.getComputedStyle(node, '').backgroundColor;
				if (Pref.getBoolPref(kPREF_STYLE_ENABLED) &&
					StyleChecker.isBaseThemeSelected() &&
					color != 'transparent') {
					node.setAttribute(
						kOVERLAY_ATTRIBUTE,
						kOVERLAY_STYLE_NAME +
						(Pref.getBoolPref(kPREF_TEXTSHADOW_ENABLED) ? ' '+kOVERLAY_TEXTSHADOW : '' ) +
						' gecko1.9-or-later='+(this.isGecko19 ? 'true' : 'false' )
					);

					// for Firefox 3, Mac OS X
					if (
						kOSX_UNIFIED_WINDOWS.indexOf(this.window.location.href) < 0  &&
						!this.isUnifiedPrefWindow &&
						kOSX_TCOLORS_ATTR.some(function(aAttr) {
							return node.getAttribute(aAttr) ? true : false ;
						})
						) {
						if (!node.hasAttribute(kOSX_TCOLORS_BACKUP))
							node.setAttribute(
								kOSX_TCOLORS_BACKUP,
								kOSX_TCOLORS_ATTR.map(function(aAttr) {
									return aAttr+'='+node.getAttribute(aAttr);
								}).join('|')
							);
						kOSX_TCOLORS_ATTR.forEach(function(aAttr) {
							return node.removeAttribute(aAttr);
						});
						this.window.resizeBy(1, 0);
						this.window.resizeBy(-1, 0);
					}
				}
				else {
					node.removeAttribute(kOVERLAY_ATTRIBUTE);

					// for Firefox 3, Mac OS X
					if (node.hasAttribute(kOSX_TCOLORS_BACKUP)) {
						node.getAttribute(kOSX_TCOLORS_BACKUP)
							.split('|')
							.forEach(function(aColor) {
								aColor = aColor.split('=');
								if (aColor[1])
									node.setAttribute(aColor[0], aColor[1]);
							});
						this.window.resizeBy(1, 0);
						this.window.resizeBy(-1, 0);
					}
				}
				return;
		}
	},
 
	get isGecko19()
	{
		return Comparator.compare(XULAppInfo.platformVersion, '1.9') >= 0;
	},
 
	get isGecko191()
	{
		return Comparator.compare(XULAppInfo.platformVersion, '1.9.1') >= 0;
	},
 
	handleEvent : function(aEvent)
	{
		// ignore events from background tabs
		switch (aEvent.type)
		{
			case 'PreviewBrowserTheme':
			case 'ResetBrowserThemePreview':
			case 'TabSelect':
				if (aEvent.target.ownerDocument.defaultView.top != this.window.content)
					return;
				break;
		}

		switch (aEvent.type)
		{
			case 'PreviewBrowserTheme':
				Pref.setBoolPref(kPREF_LIGHTWEIGHT_THEME_PREVIEW, true);
				break;

			case 'ResetBrowserThemePreview':
			case 'pagehide':
			case 'TabSelect':
				Pref.setBoolPref(kPREF_LIGHTWEIGHT_THEME_PREVIEW, false);
				break;
		}
	}
 
}; 
  
var StyleChecker = { 
	isBaseThemeSelected : function()
	{
		var isBaseTheme = false;
		var usingLightWeightTheme = false;
		var previewingLightWeightTheme = false;
		try {
			isBaseTheme = Pref.getCharPref(kPREF_SELECTED_THEME) == kBASE_THEME;
		}
		catch(e) {
		}
		try {
			usingLightWeightTheme = Pref.getBoolPref(kPREF_LIGHTWEIGHT_THEME_ENABLED);
		}
		catch(e) {
		}
		try {
			previewingLightWeightTheme = Pref.getBoolPref(kPREF_LIGHTWEIGHT_THEME_PREVIEW);
		}
		catch(e) {
		}
		return isBaseTheme && !usingLightWeightTheme && !previewingLightWeightTheme;
	},
};
 
  
   
var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);

		var catMgr = Components.classes['@mozilla.org/categorymanager;1']
					.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry('app-startup', kNAME, kID, true, true);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		createInstance : function(aOuter, aIID)
		{
			return new GlobalOverlayStyleService();
		}
	},

	canUnload : function(aCompMgr)
	{
		return true;
	}
};

function NSGetModule(aCompMgr, aFileSpec) {
	return gModule;
}
 	
