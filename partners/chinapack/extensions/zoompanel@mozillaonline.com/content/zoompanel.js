var zoompanel = {
	
	get panel() {
		delete this.panel;
		return this.panel = document.getElementById("zoompanel-popup");
	},
	
	get statusIcon() {
		delete this.statusIcon;
		return this.statusIcon = document.getElementById('zoompanel-statusbar-icon');
	},
	
	showPopup: function(){
		if (this.panel.state === "open" || this.panel.state === "showing") {
			this.panel.hidePopup();
		}		
		this.panel.openPopup(this.statusIcon, "before_end", 0, 0, false, false);
	},
	
	zoomIn: function(){
		if (FullZoom) {
			FullZoom.enlarge();
		}
	},
	
	zoomOut: function(){
		if (FullZoom) {
			FullZoom.reduce();
		}		
	},
	
	zoomReset: function(){
		if (FullZoom) {
			FullZoom.reset();
		}
	},
	
	init: function() {
		window.removeEventListener("load", zoompanel.init, false);
	},
	
	shutdown: function() {
		window.removeEventListener("unload", zoompanel.shutdown, false);
	},

};

window.addEventListener("load", zoompanel.init, false);
window.addEventListener("unload", zoompanel.shutdown, false);