var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Install.Uninstall = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Install.Uninstall",
			IMPLEMENT : [FoxcubService.LogInterface],
			VERSION : "0.1"
		});

FoxcubService.Install.Uninstall.prototype.$constructor = function() {
	this.browserSearchServices = Components.classes["@mozilla.org/browser/search-service;1"]
			.getService(Components.interfaces.nsIBrowserSearchService);
	this.preferenceService = Components.classes['@mozilla.org/preferences-service;1']
			.getService(Components.interfaces.nsIPrefService);
};

FoxcubService.Install.Uninstall.prototype.removeSearchModules = function() {
	var modules = FoxcubService.pref.get().getPref("addedModules").value
			.split(",");
	for (var i = 0; i < modules.length; i++) {
		if (modules[i].indexOf("Zbo") == 0) {
			var mod = "Zboží.cz"
		} else {
			var mod = modules[i];
		}
		var engine = this.browserSearchServices.getEngineByName(mod);
		if (engine) {
			try {
				this.browserSearchServices.removeEngine(engine);
			} catch (e) {
			}
		}
	}
	
};

FoxcubService.Install.Uninstall.prototype.uninstall = function() {
	try {
		// odregistrovanie
		FoxcubService.register.release();

		// obnovenie predchadzajucich nastaveni
		var preferenceBranch = this.preferenceService
				.getBranch("browser.search.");

		if (FoxcubService.pref.get().getPref("prev.search.selected").success) {
			preferenceBranch
					.setCharPref("selectedEngine", FoxcubService.pref.get()
									.getPref("prev.search.selected").value);
		}

		if (FoxcubService.pref.get().getPref("prev.KWD").success
				&& FoxcubService.pref.get().getPref("prev.KWD").value) {
			var preferenceBranch = this.preferenceService.getBranch("keyword.");
			preferenceBranch.setCharPref("URL", FoxcubService.pref.get()
							.getPref("prev.KWD").value);
		}

		if (FoxcubService.pref.get().getPref("prev.HP").success) {
			var preferenceBranch = this.preferenceService
					.getBranch("browser.startup.");
			preferenceBranch.setCharPref("homepage", FoxcubService.pref.get()
							.getPref("prev.HP").value);
		}

		// zmazanie vyhladavacich modulov
		try {
			this.removeSearchModules();
		} catch (e) {
			FoxcubService.debug(e.toString());
		}
		// zmazanie zaloziek
		FoxcubService.speedDial.init();
		FoxcubService.speedDial.bookmarks.removeBookmarks();
		// zmazanie preferencii
		var list = FoxcubService.pref.get().getList().list;
		for (var i = 0; i < list.length; i++) {
			FoxcubService.pref.get().delPref(list[i]);
		}

	} catch (e) {
		FoxcubService.debug(e.toString());
	}

};
