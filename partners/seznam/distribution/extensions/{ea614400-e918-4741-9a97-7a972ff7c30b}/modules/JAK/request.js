var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class XML/TEXT/JSONP request
 * @group jak
 * @example
 * var r = new FoxcubService.JAK.Request(FoxcubService.JAK.Request.XML, {method:"get"});
 * r.setCallback(mujObjekt, "jehoMetoda");
 * r.send("/dobrerano", {a:b, c:"asdf&asdf"});
 */
FoxcubService.JAK.Request = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.JAK.Request",
	VERSION: "2.0"
});

/** @constant */
FoxcubService.JAK.Request.XML		= 0;
/** @constant */
FoxcubService.JAK.Request.TEXT	= 1;
/** @constant */
FoxcubService.JAK.Request.JSONP	= 2;
/** @constant */
FoxcubService.JAK.Request.BINARY	= 3;

/**
 * @param {int} type Type požadavku, jedna z konstant FoxcubService.JAK.Request.*
 * @param {object} [options] Konfigurační objekt
 * @param {bool} [options.async=true] Je-li požadavek asynchronní
 * @param {bool} [options.timeout=0] Timeout v msec; 0 = disable
 * @param {bool} [options.method="get"] HTTP metoda požadavku
 */
FoxcubService.JAK.Request.prototype.$constructor = function(type, options) {
	this._NEW		= 0;
	this._SENT		= 1;
	this._DONE		= 2;
	this._ABORTED	= 3;
	this._TIMEOUT	= 4;
	
	this._xhr = null;
	this._callback = "";
	this._script = null;
	this._type = type;
	this._headers = {};
	this._callbacks = {};
	this._state = this._NEW;
	
	this._options = {
		async: true,
		timeout: 0,
		method: "get"
	}
	for (var p in options) { this._options[p] = options[p]; }

	if (this._type == FoxcubService.JAK.Request.JSONP) {
		if (this._options.method.toLowerCase() == "post") { throw new Error("POST not supported in JSONP mode"); }
		if (!this._options.async) { throw new Error("Async not supported in JSONP mode"); }
	} else {
		try{
			this._xhr = new FoxcubService.windowHelper.getWin().XMLHttpRequest();
		}catch(e){
			this._xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
		}	
		this._xhr.onreadystatechange = FoxcubService.JAK.bind(this,this._onReadyStateChange);
	}

};

FoxcubService.JAK.Request.prototype.$destructor = function() {
	if (this._state == this._SENT) { this.abort(); }
	this._xhr = null;
}

/**
 * Nastaví hlavičky požadavku
 * @param {object} headers Hlavičky (dvojice název:hodnota)
 */
FoxcubService.JAK.Request.prototype.setHeaders = function(headers) {
	if (this._type == FoxcubService.JAK.Request.JSONP) { throw new Error("Request headers not supported in JSONP mode"); }
	for (var p in headers) { this._headers[p] = headers[p]; }
}

/**
 * Vrátí hlavičky odpovědi
 * @returns {object} Hlavičky (dvojice název:hodnota)
 */
FoxcubService.JAK.Request.prototype.getHeaders = function() {
	if (this._state != this._DONE) { throw new Error("Response headers not available"); }
	if (this._type == FoxcubService.JAK.Request.JSONP) { 	throw new Error("Response headers not supported in JSONP mode"); }
	var headers = {};
	var h = this._xhr.getAllResponseHeaders();
	if (h) {
		h = h.split(/[\r\n]/);
		for (var i=0;i<h.length;i++) if (h[i]) {
			var v = h[i].match(/^([^:]+): *(.*)$/);
			headers[v[1]] = v[2];
		}
	}
	return headers;
}

/**
 * Odešle požadavek
 * @param {string} url Cílové URL
 * @param {string || object} [data] Data k odeslání
 */
FoxcubService.JAK.Request.prototype.send = function(url, data) {
	if (this._state != this._NEW) { throw new Error("Request already sent"); }

	this._state = this._SENT;
	this._userCallback();

	switch (this._type) {
		case FoxcubService.JAK.Request.XML:
		case FoxcubService.JAK.Request.TEXT:
		case FoxcubService.JAK.Request.BINARY:
			this._sendXHR(url, data);
		break;
		case FoxcubService.JAK.Request.JSONP:
			this._sendScript(url, data);
		break;
		default:
			throw new Error("Unknown request type");
		break;
	}
}

/**
 * Přeruší probíhající požadavek
 * @returns {bool} Byl požadavek přerušen?
 */
FoxcubService.JAK.Request.prototype.abort = function() {
	if (this._state != this._SENT) { return false; }
	this._state = this._ABORTED;
	if (this._xhr) { this._xhr.abort(); }
	this._userCallback();
	return true;
}

/**
 * Nastavení callbacku po dokončení požadavku
 * @param {object || null} obj
 * @param {function || string} method
 */
FoxcubService.JAK.Request.prototype.setCallback = function(obj, method) {
	this._setCallback(obj, method, this._DONE);
	return this;
}

/**
 * Nastavení callbacku po odeslání
 * @see FoxcubService.JAK.Request#setCallback
 */
FoxcubService.JAK.Request.prototype.setSendCallback = function(obj, method) {
	this._setCallback(obj, method, this._SENT);
	return this;
}

/**
 * Nastavení callbacku po abortu
 * @see FoxcubService.JAK.Request#setCallback
 */
FoxcubService.JAK.Request.prototype.setAbortCallback = function(obj, method) {
	this._setCallback(obj, method, this._ABORTED);
	return this;
}

/**
 * Nastavení callbacku po timeoutu
 * @see FoxcubService.JAK.Request#setCallback
 */
FoxcubService.JAK.Request.prototype.setTimeoutCallback = function(obj, method) {
	this._setCallback(obj, method, this._TIMEOUT);
	return this;
}

/**
 * Interni registrace callbacku pro zadany stav
 */
FoxcubService.JAK.Request.prototype._setCallback = function(obj, method, state) {
	this._callbacks[state] = [obj, method];
}

/**
 * Odeslani pozadavku pres XHR
 */
FoxcubService.JAK.Request.prototype._sendXHR = function(url, data) {
	var u, d;

	if (this._options.method.toLowerCase() == "get") {
		u = this._buildURL(url, data);
		d = null;
	} else {
		u = url;
		d = this._serializeData(data);
		
		var ctSet = false;
		for (var p in this._headers) {
			if (p.toLowerCase() == "content-type") { 
				ctSet = true;
				break;
			}
		}
		if (!ctSet) { this.setHeaders({"Content-Type":"application/x-www-form-urlencoded"}); }
	}

	if (this._type == FoxcubService.JAK.Request.BINARY) {
		if (this._xhr.overrideMimeType) {
			this._xhr.overrideMimeType("text/plain; charset=x-user-defined");
		} else {
			throw new Error("This browser does not support binary transfer");
		}
	}

	this._xhr.open(this._options.method, u, this._options.async);
	for (var p in this._headers) { this._xhr.setRequestHeader(p, this._headers[p]); }
	this._xhr.send(d);
	
	if (this._options.timeout) { setTimeout(FoxcubService.JAK.bind(this,this._timeout), this._options.timeout); }
	if (!this._options.async) { this._onReadyStateChange(); }
}

/**
 * Odeslani JSONP pozadavku pres &lt;script&gt;
 */
FoxcubService.JAK.Request.prototype._sendScript = function(url, data) {
	var o = data || {};

	this._callback = "callback" + FoxcubService.JAK.idGenerator();
	o.callback = this._callback;
	var url = this._buildURL(url, o);
	window[this._callback] = FoxcubService.JAK.bind(this,this._scriptCallback);
	
	this._script = FoxcubService.JAK.mel("script", {type:"text/javascript", src:url});
	document.body.insertBefore(this._script, document.body.firstChild);
}

/**
 * Tvorba URL zmixovanim zakladu + dat
 */
FoxcubService.JAK.Request.prototype._buildURL = function(url, data) {
	var s = this._serializeData(data);
	if (!s.length) { return url; }
	
	if (url.indexOf("?") == -1) {
		return url + "?" + s;
	} else {
		return url + "&" + s;
	}
}

/**
 * Serialize dat podle HTML formularu
 */
FoxcubService.JAK.Request.prototype._serializeData = function(data) {
	if (typeof(data) == "string") { return data; }
	if (!data) { return ""; }
	
	var arr = [];
	for (var p in data) {
		arr.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
	}
	return arr.join("&");
}

/**
 * Zmena stavu XHR
 */
FoxcubService.JAK.Request.prototype._onReadyStateChange = function() {
	if (this._state == this._ABORTED) { return; }
	if (this._xhr.readyState != 4) { return; }

	var status = this._xhr.status;
	var data;

	if (this._type == FoxcubService.JAK.Request.BINARY) {
		data = [];

			var text = this._xhr.responseText;
			var length = text.length;
			for (var i=0;i<length;i++) { data.push(text.charCodeAt(i) & 0xFF); }

	} else {
		data = (this._type == FoxcubService.JAK.Request.XML ? this._xhr.responseXML : this._xhr.responseText);
	}

	this._done(data, status);
}

/**
 * JSONP callback
 */
FoxcubService.JAK.Request.prototype._scriptCallback = function(data) {
	this._script.parentNode.removeChild(this._script);
	this._script = null;
	delete window[this._callback];

	if (this._state != this._ABORTED) { this._done(data, 200); }
}

/**
 * Request uspesne dokoncen
 */
FoxcubService.JAK.Request.prototype._done = function(data, status) {
	this._state = this._DONE;
	this._userCallback(data, status);
}

/**
 * Nastal timeout
 */
FoxcubService.JAK.Request.prototype._timeout = function() {
	if (this._state != this._SENT) { return; }
	this.abort();
	
	this._state = this._TIMEOUT;
	this._userCallback();	
}

/**
 * Volani uziv. callbacku
 */
FoxcubService.JAK.Request.prototype._userCallback = function() {
	var data = this._callbacks[this._state];
	if (!data) { return; }
	
	var obj = data[0] || window;
	var method = data[1];
	
	if (obj && typeof(method) == "string") { method = obj[method]; }
	if (!method) {
		method = obj;
		obj = window;
	}
	
	method.apply(obj, arguments);
}

