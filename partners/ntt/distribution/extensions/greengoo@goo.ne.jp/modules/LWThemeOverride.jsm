/* ***** BEGIN LICENSE BLOCK *****
 * Green Goo
 * Copyright (C) 2010  NTT Resonant Inc.
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 * ***** END LICENSE BLOCK ***** */

const ADDON_ID      = 'greengoo@goo.ne.jp';
const THEME_URI     = 'chrome://greengoo/skin/lwtheme.json';
const MODULES_ROOT  = 'resource://greengoo-modules/';


var EXPORTED_SYMBOLS = ['LWThemeOverride'];

const Cc = Components.classes;
const Ci = Components.interfaces;

const BACKEND_LIGHTWEIGHT_THEME = 1;
const BACKEND_PERSONAS          = 2;

const MAX_USED_THEMES_COUNT = 8;

try { // Firefox 3.6 or later
	Components.utils.import('resource://gre/modules/LightweightThemeManager.jsm');
}
catch(e) {
	var LightweightThemeManager = null;
}
try { // Personas Plus
	Components.utils.import('resource://personas/modules/service.js');
}
catch(e) {
	var PersonaService = null;
}

Components.utils.import(MODULES_ROOT+'jstimer.jsm');

var prefs = {}; 
Components.utils.import(MODULES_ROOT+'prefs.js', prefs);
prefs = prefs.window['piro.sakura.ne.jp'].prefs;

var UninstallationListener = {}; 
Components.utils.import(MODULES_ROOT+'UninstallationListener.js', UninstallationListener);
UninstallationListener = UninstallationListener.window['piro.sakura.ne.jp'].UninstallationListener;


var LWThemeOverride = {
	backend : (LightweightThemeManager ? BACKEND_LIGHTWEIGHT_THEME : 0 ) |
				(PersonaService ? BACKEND_PERSONAS : 0 ),
	BACKEND_LIGHTWEIGHT_THEME : BACKEND_LIGHTWEIGHT_THEME,
	BACKEND_PERSONAS : BACKEND_PERSONAS,

	ObserverService : Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService),

	init : function()
	{
		this.ObserverService.addObserver(this, 'lightweight-theme-styling-update', false);
		prefs.addPrefListener(this);

		if (this.backend & this.BACKEND_LIGHTWEIGHT_THEME) {
			Cc['@mozilla.org/embedcomp/window-watcher;1']
					.getService(Ci.nsIWindowWatcher)
					.registerNotification(this);

			if (prefs.getPref('lightweightThemes.isThemeSelected') &&
				this.usedThemes[0].id == this.theme.id)
				this.activate();
		}

		var self = this;
		var clearTheme = function() {
				self.destroy();
				self.clearTheme();
			};
		new UninstallationListener({
			id : ADDON_ID,
			onuninstalled : clearTheme,
			ondisabled : clearTheme
		});
	},

	destroy : function()
	{
		this.ObserverService.removeObserver(this, 'lightweight-theme-styling-update');
		prefs.removePrefListener(this);
	},

	get theme()
	{
		delete this.theme;
		var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
						.createInstance(Ci.nsIXMLHttpRequest);
		request.open('GET', THEME_URI, false);
		request.send(null);
		this.theme = JSON.parse(request.responseText);
		return this.theme;
	},
	get themeString()
	{
		delete this.themeString;
		this.themeString = JSON.stringify(this.theme);
		return this.themeString;
	},

	get safeTheme()
	{
		delete this.safeTheme;
		this.safeTheme = JSON.parse(JSON.stringify(this.theme));
		this.safeTheme.headerURL = this.safeTheme.safeHeaderURL;
		this.safeTheme.footerURL = this.safeTheme.safeFooterURL;
		return this.safeTheme;
	},
	get safeThemeString()
	{
		delete this.safeThemeString;
		this.safeThemeString = JSON.stringify(this.safeTheme);
		return this.safeThemeString;
	},

	get personaString()
	{
		return this.backend & this.BACKEND_LIGHTWEIGHT_THEME ?
				this.safeThemeString :
				this.themeString ;
	},


	get installed()
	{
		var builtin = this.safeTheme;
		return this.usedThemes.some(function(aData) {
				if (aData.id == builtin.id) {
					return true;
				}
				return false;
			});
	},


	activate : function()
	{
		if (this.backend & this.BACKEND_LIGHTWEIGHT_THEME)
			LightweightThemeManager.currentTheme = this.safeTheme;
		else if (this.backend & this.BACKEND_PERSONAS)
			PersonaService.changeToPersona(this.theme);
	},

	overrideTheme : function()
	{
		prefs.setPref('lightweightThemes.persisted.headerURL', false);
		prefs.setPref('lightweightThemes.persisted.footerURL', false);
		this.ObserverService.notifyObservers(null, 'lightweight-theme-styling-update', this.themeString);
	},

	ensureThemeOverridden : function(aWindow)
	{
		if (
			!(this.backend & this.BACKEND_LIGHTWEIGHT_THEME) ||
			LightweightThemeManager.currentThemeForDisplay.id != this.safeTheme.id ||
			!aWindow.document.documentElement.hasAttribute('lightweightthemes') ||
			!aWindow.document.documentElement._lightweightTheme ||
			!aWindow.document.documentElement._lightweightTheme._update
			)
			return;

		aWindow.document.documentElement._lightweightTheme._update(this.theme);
	},
	ensureThemeOverriddenAfterLoad : function(aWindow)
	{
		aWindow = aWindow.QueryInterface(Ci.nsIDOMWindow);
		if (aWindow != '[object ChromeWindow]')
			return;

		var self = this;
		aWindow.addEventListener('load', function() {
			aWindow.removeEventListener('load', arguments.callee, false);
			self.ensureThemeOverridden(aWindow);
		}, false);
	},

	updateUsedThemes : function()
	{
		var theme = this.safeTheme;
		var themeString = this.safeThemeString;

		var usedThemes = this.usedThemes;
		var index = -1;
		usedThemes.some(function(aData, aIndex) {
			if (aData.id == theme.id) {
				index = aIndex;
				return true;
			}
			return false;
		});

		if (
			index > -1 &&
			usedThemes[index].iconURL &&
			usedThemes[index].previewURL
			)
			return;

		if (index < 0) {
			usedThemes = usedThemes.slice(0, MAX_USED_THEMES_COUNT-1);
			usedThemes.push(theme);
		}
		else {
			usedThemes.splice(index, 1, theme);
		}
		prefs.setPref('lightweightThemes.usedThemes', JSON.stringify(usedThemes));
	},
	get usedThemes()
	{
		return JSON.parse(prefs.getPref('lightweightThemes.usedThemes') || '[]');
	},

	clearTheme : function()
	{
		this.clearLWTheme();
		this.clearPersona();
	},
	clearLWTheme : function()
	{
		var theme = this.safeTheme;

		var usedThemes = this.usedThemes;
		var index = -1;
		usedThemes = usedThemes.filter(function(aData, aIndex) {
						if (aData.id == theme.id) {
							index = aIndex;
							return false;
						}
						return true;
					});

		if (index == 0 && prefs.getPref('lightweightThemes.isThemeSelected'))
			prefs.setPref('lightweightThemes.isThemeSelected', false);

		prefs.setPref('lightweightThemes.usedThemes', JSON.stringify(usedThemes));
	},
	clearPersona : function()
	{
		var builtin = this.theme;
		var index = -1;
		for (let i = 0, theme;
		     theme = prefs.getPref('extensions.personas.lastselected'+i);
		     i++)
		{
			try {
				theme = JSON.parse(theme);
				if (builtin.id == theme.id) {
					index = i;
					break;
				}
			}
			catch(e) {
			}
		}

		if (index > -1) {
			let next;
			do {
				next = prefs.getPref('extensions.personas.lastselected'+(index+1));

				if (next)
					prefs.setPref('extensions.personas.lastselected'+index, next);
				else
					prefs.clearPref('extensions.personas.lastselected'+index);

				index++;
			} while (next);
		}

		var theme = prefs.getPref('extensions.personas.current');
		if (theme && JSON.parse(theme).id == this.theme.id)
			prefs.clearPref('extensions.personas.current');
	},


	domains : [
		'lightweightThemes.usedThemes'
	],

	observe : function(aSubject, aTopic, aData)
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				return this.onPrefChange(aData);

			case 'lightweight-theme-styling-update':
				let (theme = JSON.parse(aData)) {
					if (
						theme.id == this.safeTheme.id &&
						theme.headerURL == this.safeTheme.headerURL
						)
						setTimeout(function(aSelf) {
							aSelf.overrideTheme();
						}, 250, this);
				}
				return;

			case 'domwindowopened':
				return this.ensureThemeOverriddenAfterLoad(aSubject);

			default:
				return;
		}
	},

	onPrefChange : function(aPrefName)
	{
		switch (aPrefName)
		{
			case 'lightweightThemes.usedThemes':
				return this.updateUsedThemes();

			default:
				return;
		}
	}
};

LWThemeOverride.init();
