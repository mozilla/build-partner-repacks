var goog = goog || {};
goog.global = this;
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
	if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name])
		throw 'Namespace "' + name + '" already declared.';
	var namespace = name;
	while (namespace = namespace.substring(0, namespace.lastIndexOf(".")))
		goog.implicitNamespaces_[namespace] = true;
	goog.exportPath_(name)
};
goog.implicitNamespaces_ = {};
goog.exportPath_ = function(name, opt_object) {
	var parts = name.split("."), cur = goog.global, part;
	!(parts[0] in cur) && cur.execScript && cur.execScript("var " + parts[0]);
	while (parts.length && (part = parts.shift()))
		if (!parts.length && goog.isDef(opt_object))
			cur[part] = opt_object;
		else
			cur = cur[part] ? cur[part] : (cur[part] = {})
};
goog.getObjectByName = function(name, opt_obj) {
	var parts = name.split("."), cur = opt_obj || goog.global;
	for (var part; part = parts.shift();)
		if (cur[part])
			cur = cur[part];
		else
			return null;
	return cur
};
goog.globalize = function(obj, opt_global) {
	var global = opt_global || goog.global;
	for (var x in obj)
		global[x] = obj[x]
};
goog.addDependency = function(relPath, provides, requires) {
	var provide, require, path = relPath.replace(/\\/g, "/"), deps = goog.dependencies_;
	for (var i = 0; provide = provides[i]; i++) {
		deps.nameToPath[provide] = path;
		path in deps.pathToNames || (deps.pathToNames[path] = {});
		deps.pathToNames[path][provide] = true
	}
	for (var j = 0; require = requires[j]; j++) {
		path in deps.requires || (deps.requires[path] = {});
		deps.requires[path][require] = true
	}
};
goog.require = function(rule) {
	if (goog.getObjectByName(rule))
		return;
	var path = goog.getPathFromDeps_(rule);
	if (path) {
		goog.included_[path] = true;
		goog.writeScripts_()
	} else if (goog.useStrictRequires)
		throw new Error("goog.require could not find: " + rule);
};
goog.useStrictRequires = false;
goog.basePath = "";
goog.nullFunction = function() {
};
goog.identityFunction = function() {
	return arguments[0]
};
goog.abstractMethod = function() {
	throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
	ctor.getInstance = function() {
		return ctor.instance_ || (ctor.instance_ = new ctor)
	}
};
goog.included_ = {};
goog.dependencies_ = {
	pathToNames : {},
	nameToPath : {},
	requires : {},
	visited : {},
	written : {}
};
goog.findBasePath_ = function() {
	var doc = goog.global.document;
	if (typeof doc == "undefined")
		return;
	if (goog.global.CLOSURE_BASE_PATH) {
		goog.basePath = goog.global.CLOSURE_BASE_PATH;
		return
	} else
		goog.global.CLOSURE_BASE_PATH = null;
	var scripts = doc.getElementsByTagName("script");
	for (var script, i = 0; script = scripts[i]; i++) {
		var src = script.src, l = src.length;
		if (src.substr(l - 7) == "base.js") {
			goog.basePath = src.substr(0, l - 7);
			return
		}
	}
};
goog.writeScriptTag_ = function(src) {
	var doc = goog.global.document;
	if (typeof doc != "undefined" && !goog.dependencies_.written[src]) {
		goog.dependencies_.written[src] = true;
		doc
				.write('<script type="text/javascript" src="' + src
						+ '"><\/script>')
	}
};
goog.writeScripts_ = function() {
	var scripts = [], seenScript = {}, deps = goog.dependencies_;
	function visitNode(path) {
		if (path in deps.written)
			return;
		if (path in deps.visited) {
			if (!(path in seenScript)) {
				seenScript[path] = true;
				scripts.push(path)
			}
			return
		}
		deps.visited[path] = true;
		if (path in deps.requires)
			for (var requireName in deps.requires[path])
				if (requireName in deps.nameToPath)
					visitNode(deps.nameToPath[requireName]);
				else
					throw Error("Undefined nameToPath for " + requireName);
		if (!(path in seenScript)) {
			seenScript[path] = true;
			scripts.push(path)
		}
	}
	for (var path in goog.included_)
		deps.written[path] || visitNode(path);
	for (var i = 0; i < scripts.length; i++)
		if (scripts[i])
			goog.writeScriptTag_(goog.basePath + scripts[i]);
		else
			throw Error("Undefined script input");
};
goog.getPathFromDeps_ = function(rule) {
	return rule in goog.dependencies_.nameToPath
			? goog.dependencies_.nameToPath[rule]
			: null
};
goog.findBasePath_();
goog.writeScriptTag_(goog.basePath + "deps.js");
goog.typeOf = function(value) {
	var s = typeof value;
	if (s == "object")
		if (value) {
			if (typeof value.length == "number"
					&& typeof value.splice != "undefined"
					&& !goog.propertyIsEnumerable_(value, "length"))
				return "array";
			if (typeof value.call != "undefined")
				return "function"
		} else
			return "null";
	else if (s == "function" && typeof value.call == "undefined")
		return "object";
	return s
};
goog.propertyIsEnumerable_ = Object.prototype.propertyIsEnumerable ? function(
		object, propName) {
	return Object.prototype.propertyIsEnumerable.call(object, propName)
} : function(object, propName) {
	if (propName in object)
		for (var key in object)
			if (key == propName
					&& Object.prototype.hasOwnProperty.call(object, propName))
				return true;
	return false
};
goog.isDef = function(val) {
	return typeof val != "undefined"
};
goog.isNull = function(val) {
	return val === null
};
goog.isDefAndNotNull = function(val) {
	return goog.isDef(val) && !goog.isNull(val)
};
goog.isArray = function(val) {
	return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
	var type = goog.typeOf(val);
	return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
	return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
	return typeof val == "string"
};
goog.isBoolean = function(val) {
	return typeof val == "boolean"
};
goog.isNumber = function(val) {
	return typeof val == "number"
};
goog.isFunction = function(val) {
	return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
	var type = goog.typeOf(val);
	return type == "object" || type == "array" || type == "function"
};
goog.getHashCode = function(obj) {
	if (obj.hasOwnProperty && obj.hasOwnProperty(goog.HASH_CODE_PROPERTY_)) {
		var hashCode = obj[goog.HASH_CODE_PROPERTY_];
		if (hashCode)
			return hashCode
	}
	obj[goog.HASH_CODE_PROPERTY_]
			|| (obj[goog.HASH_CODE_PROPERTY_] = ++goog.hashCodeCounter_);
	return obj[goog.HASH_CODE_PROPERTY_]
};
goog.removeHashCode = function(obj) {
	"removeAttribute" in obj && obj.removeAttribute(goog.HASH_CODE_PROPERTY_);
	try {
		delete obj[goog.HASH_CODE_PROPERTY_]
	} catch (ex) {
	}
};
goog.HASH_CODE_PROPERTY_ = "closure_hashCode_";
goog.hashCodeCounter_ = 0;
goog.cloneObject = function(proto) {
	var type = goog.typeOf(proto);
	if (type == "object" || type == "array") {
		if (proto.clone)
			return proto.clone();
		var clone = type == "array" ? [] : {};
		for (var key in proto)
			clone[key] = goog.cloneObject(proto[key]);
		return clone
	}
	return proto
};
goog.bind = function(fn, self) {
	var boundArgs = fn.boundArgs_;
	if (arguments.length > 2) {
		var args = Array.prototype.slice.call(arguments, 2);
		boundArgs && args.unshift.apply(args, boundArgs);
		boundArgs = args
	}
	self = fn.boundSelf_ || self;
	fn = fn.boundFn_ || fn;
	var newfn, context = self || goog.global;
	newfn = boundArgs ? function() {
		var args = Array.prototype.slice.call(arguments);
		args.unshift.apply(args, boundArgs);
		return fn.apply(context, args)
	} : function() {
		return fn.apply(context, arguments)
	};
	newfn.boundArgs_ = boundArgs;
	newfn.boundSelf_ = self;
	newfn.boundFn_ = fn;
	return newfn
};
goog.partial = function(fn) {
	var args = Array.prototype.slice.call(arguments, 1);
	args.unshift(fn, null);
	return goog.bind.apply(null, args)
};
goog.mixin = function(target, source) {
	for (var x in source)
		target[x] = source[x]
};
goog.now = Date.now || function() {
	return (new Date).getTime()
};
goog.globalEval = function(script) {
	if (goog.global.execScript)
		goog.global.execScript(script, "JavaScript");
	else if (goog.global.eval) {
		if (goog.evalWorksForGlobals_ == null) {
			goog.global.eval("var _et_ = 1;");
			if (typeof goog.global._et_ != "undefined") {
				delete goog.global._et_;
				goog.evalWorksForGlobals_ = true
			} else
				goog.evalWorksForGlobals_ = false
		}
		if (goog.evalWorksForGlobals_)
			goog.global.eval(script);
		else {
			var doc = goog.global.document, scriptElt = doc
					.createElement("script");
			scriptElt.type = "text/javascript";
			scriptElt.defer = false;
			scriptElt.appendChild(doc.createTextNode(script));
			doc.body.appendChild(scriptElt);
			doc.body.removeChild(scriptElt)
		}
	} else
		throw Error("goog.globalEval not available");
};
goog.getMsg = function(str, opt_values) {
	var values = opt_values || {};
	for (var key in values)
		str = str
				.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), values[key]);
	return str
};
goog.exportSymbol = function(publicPath, object) {
	goog.exportPath_(publicPath, object)
};
goog.exportProperty = function(object, publicName, symbol) {
	object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
	function tempCtor() {
	}
	tempCtor.prototype = parentCtor.prototype;
	childCtor.superClass_ = parentCtor.prototype;
	childCtor.prototype = new tempCtor;
	childCtor.prototype.constructor = childCtor
};
Function.prototype.bind = function(self) {
	if (arguments.length > 1) {
		var args = Array.prototype.slice.call(arguments, 1);
		args.unshift(this, self);
		return goog.bind.apply(null, args)
	} else
		return goog.bind(this, self)
};
Function.prototype.partial = function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift(this, null);
	return goog.bind.apply(null, args)
};
Function.prototype.inherits = function(parentCtor) {
	goog.inherits(this, parentCtor)
};
Function.prototype.mixin = function(source) {
	goog.mixin(this.prototype, source)
};
function G_JSModule() {
	this.factoryLookup_ = {};
	this.categoriesLookup_ = {}
}
goog.exportSymbol("G_JSModule", G_JSModule);
G_JSModule.prototype.registerObject = function(classID, contractID, className,
		instance, opt_categories) {
	this.registerFactory(new G_JSFactory(Components.ID(classID), contractID,
			className, instance, opt_categories))
};
goog.exportProperty(G_JSModule.prototype, "registerObject",
		G_JSModule.prototype.registerObject);
G_JSModule.prototype.registerFactory = function(factory) {
	var classIdString = factory.classID.toString();
	this.factoryLookup_[classIdString] = factory;
	this.categoriesLookup_[classIdString] = factory.categories_
};
goog.exportProperty(G_JSModule.prototype, "registerFactory",
		G_JSModule.prototype.registerFactory);
G_JSModule.prototype.registerSelf = function(compMgr, fileSpec, location, type) {
	compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
	for (var factory in this.factoryLookup_) {
		compMgr.registerFactoryLocation(this.factoryLookup_[factory].classID,
				this.factoryLookup_[factory].className,
				this.factoryLookup_[factory].contractID, fileSpec, location,
				type);
		this.factoryLookup_[factory].registerCategories()
	}
};
goog.exportProperty(G_JSModule.prototype, "registerSelf",
		G_JSModule.prototype.registerSelf);
G_JSModule.prototype.getClassObject = function(compMgr, classID) {
	var factory = this.factoryLookup_[classID.toString()];
	if (!factory)
		throw new Error("Invalid classID {%s}".subs(classID));
	return factory
};
goog.exportProperty(G_JSModule.prototype, "getClassObject",
		G_JSModule.prototype.getClassObject);
G_JSModule.prototype.canUnload = function() {
	return true
};
goog.exportProperty(G_JSModule.prototype, "canUnload",
		G_JSModule.prototype.canUnload);
function G_JSFactory(classID, contractID, className, instance, opt_categories) {
	this.classID = classID;
	this.contractID = contractID;
	this.className = className;
	this.instance_ = instance;
	this.categories_ = opt_categories
}
G_JSFactory.prototype.registerCategories = function() {
	if (this.categories_) {
		var catMgr = Cc["@mozilla.org/categorymanager;1"]
				.getService(Ci.nsICategoryManager);
		for (var i = 0, cat; cat = this.categories_[i]; i++)
			catMgr.addCategoryEntry(cat, this.className, this.contractID, true,
					true)
	}
};
G_JSFactory.prototype.createInstance = function() {
	return this.instance_
};
goog.exportProperty(G_JSFactory.prototype, "createInstance",
		G_JSFactory.prototype.createInstance);
var global = this;
function isDef(val) {
	return typeof val != "undefined"
}
function isString(val) {
	return typeof val == "string"
}
function isFunction(val) {
	return typeof val == "function"
}
String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) == 0
};
String.prototype.endsWith = function(suffix) {
	var l = this.length - suffix.length;
	return l >= 0 && this.lastIndexOf(suffix, l) == l
};
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "")
};
String.prototype.subs = function() {
	var ret = this;
	for (var i = 0; i < arguments.length; i++)
		ret = ret.replace(/\%s/, String(arguments[i]));
	return ret
};
if (!Function.prototype.apply)
	Function.prototype.apply = function(oScope, opt_args) {
		var sarg = [], rtrn, call;
		oScope || (oScope = global);
		var args = opt_args || [];
		for (var i = 0; i < args.length; i++)
			sarg[i] = "args[" + i + "]";
		call = "oScope.__applyTemp__.peek()(" + sarg.join(",") + ");";
		if (!oScope.__applyTemp__)
			oScope.__applyTemp__ = [];
		oScope.__applyTemp__.push(this);
		rtrn = eval(call);
		oScope.__applyTemp__.pop();
		return rtrn
	};
function bind(fn, self) {
	var boundargs = fn.boundArgs_ || [];
	boundargs = boundargs.concat(Array.prototype.slice.call(arguments, 2));
	if (typeof fn.boundSelf_ != "undefined")
		self = fn.boundSelf_;
	if (typeof fn.boundFn_ != "undefined")
		fn = fn.boundFn_;
	var newfn = function() {
		var args = boundargs.concat(Array.prototype.slice.call(arguments));
		return fn.apply(self, args)
	};
	newfn.boundArgs_ = boundargs;
	newfn.boundSelf_ = self;
	newfn.boundFn_ = fn;
	return newfn
}
Function.prototype.bind = function(self) {
	return bind.apply(null, [this, self].concat(Array.prototype.slice.call(
					arguments, 1)))
};
Function.prototype.partial = function() {
	return bind.apply(null, [this, null].concat(Array.prototype.slice
					.call(arguments)))
};
Function.prototype.inherits = function(parentCtor) {
	goog.inherits(this, parentCtor)
};
Function.prototype.mixin = function(source) {
	goog.mixin(this.prototype, source)
};
function G_JSModule() {
	this.factoryLookup_ = {};
	this.categoriesLookup_ = {}
}
goog.exportSymbol("G_JSModule", G_JSModule);
G_JSModule.prototype.registerObject = function(classID, contractID, className,
		instance, opt_categories) {
	this.registerFactory(new G_JSFactory(Components.ID(classID), contractID,
			className, instance, opt_categories))
};
goog.exportProperty(G_JSModule.prototype, "registerObject",
		G_JSModule.prototype.registerObject);
G_JSModule.prototype.registerFactory = function(factory) {
	var classIdString = factory.classID.toString();
	this.factoryLookup_[classIdString] = factory;
	this.categoriesLookup_[classIdString] = factory.categories_
};
goog.exportProperty(G_JSModule.prototype, "registerFactory",
		G_JSModule.prototype.registerFactory);
G_JSModule.prototype.registerSelf = function(compMgr, fileSpec, location, type) {
	compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
	for (var factory in this.factoryLookup_) {
		compMgr.registerFactoryLocation(this.factoryLookup_[factory].classID,
				this.factoryLookup_[factory].className,
				this.factoryLookup_[factory].contractID, fileSpec, location,
				type);
		this.factoryLookup_[factory].registerCategories()
	}
};
goog.exportProperty(G_JSModule.prototype, "registerSelf",
		G_JSModule.prototype.registerSelf);
G_JSModule.prototype.getClassObject = function(compMgr, classID) {
	var factory = this.factoryLookup_[classID.toString()];
	if (!factory)
		throw new Error("Invalid classID {%s}".subs(classID));
	return factory
};
goog.exportProperty(G_JSModule.prototype, "getClassObject",
		G_JSModule.prototype.getClassObject);
G_JSModule.prototype.canUnload = function() {
	return true
};
goog.exportProperty(G_JSModule.prototype, "canUnload",
		G_JSModule.prototype.canUnload);
function G_JSFactory(classID, contractID, className, instance, opt_categories) {
	this.classID = classID;
	this.contractID = contractID;
	this.className = className;
	this.instance_ = instance;
	this.categories_ = opt_categories
}
G_JSFactory.prototype.registerCategories = function() {
	if (this.categories_) {
		var catMgr = Cc["@mozilla.org/categorymanager;1"]
				.getService(Ci.nsICategoryManager);
		for (var i = 0, cat; cat = this.categories_[i]; i++)
			catMgr.addCategoryEntry(cat, this.className, this.contractID, true,
					true)
	}
};
G_JSFactory.prototype.createInstance = function() {
	return this.instance_
};
goog.exportProperty(G_JSFactory.prototype, "createInstance",
		G_JSFactory.prototype.createInstance);
var global = this;
function isDef(val) {
	return typeof val != "undefined"
}
function isString(val) {
	return typeof val == "string"
}
function isFunction(val) {
	return typeof val == "function"
}
String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) == 0
};
String.prototype.endsWith = function(suffix) {
	var l = this.length - suffix.length;
	return l >= 0 && this.lastIndexOf(suffix, l) == l
};
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "")
};
String.prototype.subs = function() {
	var ret = this;
	for (var i = 0; i < arguments.length; i++)
		ret = ret.replace(/\%s/, String(arguments[i]));
	return ret
};
if (!Function.prototype.apply)
	Function.prototype.apply = function(oScope, opt_args) {
		var sarg = [], rtrn, call;
		oScope || (oScope = global);
		var args = opt_args || [];
		for (var i = 0; i < args.length; i++)
			sarg[i] = "args[" + i + "]";
		call = "oScope.__applyTemp__.peek()(" + sarg.join(",") + ");";
		if (!oScope.__applyTemp__)
			oScope.__applyTemp__ = [];
		oScope.__applyTemp__.push(this);
		rtrn = eval(call);
		oScope.__applyTemp__.pop();
		return rtrn
	};
if (!Array.prototype.push)
	Array.prototype.push = function() {
		for (var i = 0; i < arguments.length; i++)
			this[this.length] = arguments[i];
		return this.length
	};
if (!Array.prototype.pop)
	Array.prototype.pop = function() {
		if (!this.length)
			return;
		var val = this[this.length - 1];
		this.length--;
		return val
	};
// Array.prototype.peek = function() {
// 	return this[this.length - 1]
// };
if (!Array.prototype.shift)
	Array.prototype.shift = function() {
		if (this.length == 0)
			return;
		var val = this[0];
		for (var i = 0; i < this.length - 1; i++)
			this[i] = this[i + 1];
		this.length--;
		return val
	};
if (!Array.prototype.unshift)
	Array.prototype.unshift = function() {
		var numArgs = arguments.length;
		for (var i = this.length - 1; i >= 0; i--)
			this[i + numArgs] = this[i];
		for (var j = 0; j < numArgs; j++)
			this[j] = arguments[j];
		return this.length
	};
if (!Array.prototype.forEach)
	Array.prototype.forEach = function(callback, opt_scope) {
		for (var i = 0; i < this.length; i++)
			callback.call(opt_scope, this[i], i, this)
	};
function bind(fn, self) {
	var boundargs = fn.boundArgs_ || [];
	boundargs = boundargs.concat(Array.prototype.slice.call(arguments, 2));
	if (typeof fn.boundSelf_ != "undefined")
		self = fn.boundSelf_;
	if (typeof fn.boundFn_ != "undefined")
		fn = fn.boundFn_;
	var newfn = function() {
		var args = boundargs.concat(Array.prototype.slice.call(arguments));
		return fn.apply(self, args)
	};
	newfn.boundArgs_ = boundargs;
	newfn.boundSelf_ = self;
	newfn.boundFn_ = fn;
	return newfn
}
Function.prototype.bind = function(self) {
	return bind.apply(null, [this, self].concat(Array.prototype.slice.call(
					arguments, 1)))
};
Function.prototype.partial = function() {
	return bind.apply(null, [this, null].concat(Array.prototype.slice
					.call(arguments)))
};
Function.prototype.inherits = function(parentCtor) {
    var tempCtor = function() {
	};
	tempCtor.prototype = parentCtor.prototype;
	this.superClass_ = parentCtor.prototype;
	this.prototype = new tempCtor
};
Function.prototype.mixin = function(props) {
	for (var x in props)
		this.prototype[x] = props[x];
	if (isFunction(props.toString) && props.toString != this.prototype.toString)
		this.prototype.toString = props.toString
};
function G_Preferences(opt_startPoint, opt_getDefaultBranch, opt_noUnicode) {
	this.debugZone = "prefs";
	this.observers_ = {};
	var startPoint = opt_startPoint || null, prefSvc = Cc["@mozilla.org/preferences-service;1"]
			.getService(Ci.nsIPrefService);
	this.prefs_ = opt_getDefaultBranch
			? prefSvc.getDefaultBranch(startPoint)
			: prefSvc.getBranch(startPoint);
	this.prefs_.QueryInterface(Ci.nsIPrefBranchInternal);
	this.noUnicode_ = !!opt_noUnicode
}
G_Preferences.setterMap_ = {
	string : "setCharPref",
	"boolean" : "setBoolPref",
	number : "setIntPref"
};
G_Preferences.getterMap_ = {};
G_Preferences.getterMap_[Ci.nsIPrefBranch.PREF_STRING] = "getCharPref";
G_Preferences.getterMap_[Ci.nsIPrefBranch.PREF_BOOL] = "getBoolPref";
G_Preferences.getterMap_[Ci.nsIPrefBranch.PREF_INT] = "getIntPref";
G_Preferences.prototype.setPref = function(key, val) 
{
	var datatype = typeof val;
	if (datatype == "number" && val % 1 != 0)
		throw new Error("Cannot store non-integer numbers in preferences.");
	if (datatype == "string" && !this.noUnicode_)
		return this.setUnicodePref(key, val);
	var meth = G_Preferences.setterMap_[datatype];
	if (!meth)
		throw new Error("Pref datatype {" + datatype + "} not supported.");
	return this.prefs_[meth](key, val)
};
G_Preferences.prototype.getPref = function(key, opt_default) 
{
	var type = this.prefs_.getPrefType(key);
	if (type == Ci.nsIPrefBranch.PREF_INVALID)
		return opt_default;
	if (type == Ci.nsIPrefBranch.PREF_STRING && !this.noUnicode_)
		return this.getUnicodePref(key, opt_default);
	var meth = G_Preferences.getterMap_[type];
	if (!meth)
		throw new Error("Pref datatype {" + type + "} not supported.");
	try {
		return this.prefs_[meth](key)
	} catch (e) {
		return opt_default
	}
};
G_Preferences.prototype.setUnicodePref = function(key, value) {
	var s = Cc["@mozilla.org/supports-string;1"]
			.createInstance(Ci.nsISupportsString);
	s.data = value;
	return this.prefs_.setComplexValue(key, Ci.nsISupportsString, s)
};
G_Preferences.prototype.getUnicodePref = function(key, opt_default) {
	try {
		return this.prefs_.getComplexValue(key, Ci.nsISupportsString).data
	} catch (e) {
		return opt_default
	}
};
G_Preferences.prototype.setBoolPref = function(which, value) {
	return this.setPref(which, value)
};
G_Preferences.prototype.getBoolPref = function(which) {
	return this.prefs_.getBoolPref(which)
};
G_Preferences.prototype.getBoolPrefOrDefault = function(which, def) {
	return this.getPref(which, def)
};
G_Preferences.prototype.getBoolPrefOrDefaultAndSet = function(which, def) {
	try {
		return this.prefs_.getBoolPref(which)
	} catch (e) {
		this.prefs_.setBoolPref(which, !!def);
		return def
	}
};
G_Preferences.prototype.clearPref = function(which) {
	try {
		this.prefs_.clearUserPref(which)
	} catch (e) {
	}
};
G_Preferences.prototype.addObserver = function(which, callback) {
	var observer = new G_PreferenceObserver(callback);
	this.observers_[which] || (this.observers_[which] = new G_ObjectSafeMap);
	this.observers_[which].insert(callback, observer);
	this.prefs_.addObserver(which, observer, false)
};
G_Preferences.prototype.removeObserver = function(which, callback) {
	var observer = this.observers_[which].find(callback);
	this.prefs_.removeObserver(which, observer);
	this.observers_[which].erase(callback)
};
G_Preferences.prototype.removeAllObservers = function() {
	for (var which in this.observers_) {
		var observersMap = this.observers_[which], observers = observersMap
				.getAllValues();
		for (var i = 0; i < observers.length; i++) {
			var observer = observers[i];
			this.prefs_.removeObserver(which, observer)
		}
	}
	this.observers_ = {}
};
G_Preferences.prototype.getChildNames = function(opt_startingPoint) {
	opt_startingPoint || (opt_startingPoint = "");
	return this.prefs_.getChildList(opt_startingPoint, {})
};
G_Preferences.savePrefFile = function() {
	var prefService = Cc["@mozilla.org/preferences;1"]
			.getService(Ci.nsIPrefService);
	try {
		prefService.savePrefFile(null)
	} catch (e) {
	}
};
function G_PreferenceObserver(callback) {
	this.debugZone = "prefobserver";
	this.callback_ = callback
}
G_PreferenceObserver.prototype.observe = function(subject, topic, data) {
	this.callback_(data)
};
G_PreferenceObserver.prototype.QueryInterface = function(iid) {
	var Ci = Ci;
	if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIObserver)
			|| iid.equals(Ci.nsISupportsWeakReference))
		return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};
function G_Base64() {
	this.byteToCharMap_ = {};
	this.charToByteMap_ = {};
	this.byteToCharMapWebSafe_ = {};
	this.charToByteMapWebSafe_ = {};
	this.init_()
}
G_Base64.ENCODED_VALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
G_Base64.ENCODED_VALS_WEBSAFE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
G_Base64.prototype.init_ = function() {
	for (var i = 0; i < G_Base64.ENCODED_VALS.length; i++) {
		this.byteToCharMap_[i] = G_Base64.ENCODED_VALS.charAt(i);
		this.charToByteMap_[this.byteToCharMap_[i]] = i;
		this.byteToCharMapWebSafe_[i] = G_Base64.ENCODED_VALS_WEBSAFE.charAt(i);
		this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i
	}
};
G_Base64.prototype.encodeByteArray = function(input, opt_webSafe) {
	if (!(input instanceof Array))
		throw new Error("encodeByteArray takes an array as a parameter");
	var byteToCharMap = opt_webSafe
			? this.byteToCharMapWebSafe_
			: this.byteToCharMap_, output = [], i = 0;
	while (i < input.length) {
		var byte1 = input[i], haveByte2 = i + 1 < input.length, byte2 = haveByte2
				? input[i + 1]
				: 0, haveByte3 = i + 2 < input.length, byte3 = haveByte3
				? input[i + 2]
				: 0, outByte1 = byte1 >> 2, outByte2 = (byte1 & 3) << 4
				| byte2 >> 4, outByte3 = (byte2 & 15) << 2 | byte3 >> 6, outByte4 = byte3
				& 63;
		if (!haveByte3) {
			outByte4 = 64;
			haveByte2 || (outByte3 = 64)
		}
		output.push(byteToCharMap[outByte1]);
		output.push(byteToCharMap[outByte2]);
		output.push(byteToCharMap[outByte3]);
		output.push(byteToCharMap[outByte4]);
		i += 3
	}
	return output.join("")
};
G_Base64.prototype.decodeString = function(input, opt_webSafe) {
	if (input.length % 4)
		throw new Error("Length of b64-encoded data must be zero mod four");
	var charToByteMap = opt_webSafe
			? this.charToByteMapWebSafe_
			: this.charToByteMap_, output = [], i = 0;
	while (i < input.length) {
		var byte1 = charToByteMap[input.charAt(i)], byte2 = charToByteMap[input
				.charAt(i + 1)], byte3 = charToByteMap[input.charAt(i + 2)], byte4 = charToByteMap[input
				.charAt(i + 3)];
		if (byte1 === undefined || byte2 === undefined || byte3 === undefined
				|| byte4 === undefined)
			throw new Error("String contains characters not in our alphabet: "
					+ input);
		var outByte1 = byte1 << 2 | byte2 >> 4;
		output.push(outByte1);
		if (byte3 != 64) {
			var outByte2 = byte2 << 4 & 240 | byte3 >> 2;
			output.push(outByte2);
			if (byte4 != 64) {
				var outByte3 = byte3 << 6 & 192 | byte4;
				output.push(outByte3)
			}
		}
		i += 4
	}
	return output
};
G_Base64.prototype.arrayifyString = function(str) {
	var output = [];
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		while (c > 255) {
			output.push(c & 255);
			c >>= 8
		}
		output.push(c)
	}
	return output
};
G_Base64.prototype.stringifyArray = function(array) {
	var output = [];
	for (var i = 0; i < array.length; i++)
		output[i] = String.fromCharCode(array[i]);
	return output.join("")
};
var G_File = {};
G_File.getHomeFile = function(opt_file) {
	return this.getSpecialFile("Home", opt_file)
};
G_File.getProfileFile = function(opt_file) {
	return this.getSpecialFile("ProfD", opt_file)
};
G_File.getTempFile = function(opt_file) {
	return this.getSpecialFile("TmpD", opt_file)
};
G_File.getSpecialFile = function(loc, opt_file) {
	var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get(loc, Ci.nsILocalFile);
	opt_file && file.append(opt_file);
	return file
};
G_File.createUniqueTempFile = function(opt_baseName) {
	var baseName = (opt_baseName || (new Date).getTime()) + ".tmp", file = this
			.getSpecialFile("TmpD", baseName);
	file.createUnique(file.NORMAL_FILE_TYPE, 420);
	return file
};
G_File.createUniqueTempDir = function(opt_baseName) {
	var baseName = (opt_baseName || (new Date).getTime()) + ".tmp", dir = this
			.getSpecialFile("TmpD", baseName);
	dir.createUnique(dir.DIRECTORY_TYPE, 484);
	return dir
};
G_File.fromFileURI = function(uri) {
	if (uri.indexOf("file://") != 0)
		throw new Error("File path must be a file:// URL");
	var fileHandler = Cc["@mozilla.org/network/protocol;1?name=file"]
			.getService(Ci.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(uri)
};
G_File.PR_RDONLY = 1;
G_File.PR_WRONLY = 2;
G_File.PR_RDWR = 4;
G_File.PR_CREATE_FILE = 8;
G_File.PR_APPEND = 16;
G_File.PR_TRUNCATE = 32;
G_File.PR_SYNC = 64;
G_File.PR_EXCL = 128;
G_File.__defineGetter__("LINE_END_CHAR", function() {
	var end_char;
	end_char = "@mozilla.org/xre/app-info;1" in Cc
			? Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS == "WINNT"
					? "\r\n"
					: "\n"
			: Cc["@mozilla.org/network/protocol;1?name=http"]
					.getService(Ci.nsIHttpProtocolHandler).platform
					.toLowerCase().indexOf("win") == 0 ? "\r\n" : "\n";
	G_File.__defineGetter__("LINE_END_CHAR", function() {
				return end_char
			});
	return end_char
});
function G_FileReader(file) {
	this.file_ = isString(file) ? G_File.fromFileURI(file) : file
}
G_FileReader.readAll = function(file) {
	var reader = new G_FileReader(file);
	try {
		return reader.read()
	} finally {
		reader.close()
	}
};
G_FileReader.prototype.read = function(opt_maxBytes) {
	if (!this.stream_) {
		var fs = Cc["@mozilla.org/network/file-input-stream;1"]
				.createInstance(Ci.nsIFileInputStream);
		fs.init(this.file_, G_File.PR_RDONLY, 292, 0);
		this.stream_ = Cc["@mozilla.org/scriptableinputstream;1"]
				.createInstance(Ci.nsIScriptableInputStream);
		this.stream_.init(fs)
	}
	isDef(opt_maxBytes) || (opt_maxBytes = this.stream_.available());
	return this.stream_.read(opt_maxBytes)
};
G_FileReader.prototype.close = function() {
	if (this.stream_) {
		this.stream_.close();
		this.stream_ = null
	}
};
function G_FileWriter(file, opt_append) {
	this.file_ = typeof file == "string" ? G_File.fromFileURI(file) : file;
	this.append_ = !!opt_append
}
G_FileWriter.writeAll = function(file, data, opt_append) {
	var writer = new G_FileWriter(file, opt_append);
	try {
		return writer.write(data)
	} finally {
		writer.close();
		return 0
	}
};
G_FileWriter.prototype.write = function(data) {
	if (!this.stream_) {
		this.stream_ = Cc["@mozilla.org/network/file-output-stream;1"]
				.createInstance(Ci.nsIFileOutputStream);
		var flags = G_File.PR_WRONLY | G_File.PR_CREATE_FILE
				| (this.append_ ? G_File.PR_APPEND : G_File.PR_TRUNCATE);
		this.stream_.init(this.file_, flags, -1, 0)
	}
	return this.stream_.write(data, data.length)
};
G_FileWriter.prototype.writeLine = function(data) {
	this.write(data + G_File.LINE_END_CHAR)
};
G_FileWriter.prototype.close = function() {
	if (this.stream_) {
		this.stream_.close();
		this.stream_ = null
	}
};
function G_ObjectSafeMap(opt_name) {
	this.debugZone = "objectsafemap";
	this.name_ = opt_name ? opt_name : "noname";
	this.keys_ = [];
	this.values_ = []
}
G_ObjectSafeMap.prototype.indexOfKey_ = function(key) {
	for (var i = 0; i < this.keys_.length; i++)
		if (this.keys_[i] === key)
			return i;
	return -1
};
G_ObjectSafeMap.prototype.insert = function(key, value) {
	if (key === null)
		throw new Error("Can't use null as a key");
	if (value === undefined)
		throw new Error("Can't store undefined values in this map");
	var i = this.indexOfKey_(key);
	if (i == -1) {
		this.keys_.push(key);
		this.values_.push(value)
	} else {
		this.keys_[i] = key;
		this.values_[i] = value
	}
};
G_ObjectSafeMap.prototype.erase = function(key) {
	var keyLocation = this.indexOfKey_(key), keyFound = keyLocation != -1;
	if (keyFound) {
		this.keys_.splice(keyLocation, 1);
		this.values_.splice(keyLocation, 1)
	}
	return keyFound
};
G_ObjectSafeMap.prototype.find = function(key) {
	var keyLocation = this.indexOfKey_(key);
	return keyLocation == -1 ? undefined : this.values_[keyLocation]
};
G_ObjectSafeMap.prototype.replace = function(other) {
	this.keys_ = [];
	this.values_ = [];
	for (var i = 0; i < other.keys_.length; i++) {
		this.keys_.push(other.keys_[i]);
		this.values_.push(other.values_[i])
	}
};
G_ObjectSafeMap.prototype.forEach = function(func) {
	if (typeof func != "function")
		throw new Error("argument to forEach is not a function, it's a(n) "
				+ typeof func);
	for (var i = 0; i < this.keys_.length; i++)
		func(this.keys_[i], this.values_[i])
};
G_ObjectSafeMap.prototype.getAllKeys = function() {
	return this.keys_
};
G_ObjectSafeMap.prototype.getAllValues = function() {
	return this.values_
};
G_ObjectSafeMap.prototype.size = function() {
	return this.keys_.length
};
function alert(msg, opt_title) {
	opt_title = opt_title || "message";
	Cc["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Ci.nsIPromptService).alert(null, opt_title,
					msg.toString())
}
function BindToObject(func) {
	var args = Array.prototype.splice.call(arguments, 1, arguments.length);
	return Function.prototype.bind.apply(func, args)
};
var G_FirefoxXMLUtils = {};
G_FirefoxXMLUtils.XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
G_FirefoxXMLUtils.XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
G_FirefoxXMLUtils.XUL_NAMESPACE = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
G_FirefoxXMLUtils.newXML = function(opt_root, opt_namespace, opt_nsMap) {
	if (!G_FirefoxXMLUtils.domImpl_)
		G_FirefoxXMLUtils.domImpl_ = Cc["@mozilla.org/xmlextras/domparser;1"]
				.createInstance(Ci.nsIDOMParser).parseFromString("<foo/>",
						"text/xml").implementation;
	if (typeof opt_root == "undefined")
		opt_root = null;
	if (typeof opt_namespace == "undefined")
		opt_namespace = null;
	var doc = G_FirefoxXMLUtils.domImpl_.createDocument(opt_namespace,
			opt_root, null);
	if (opt_nsMap) {
		var root = doc.documentElement;
		for (var prefix in opt_nsMap)
			root.setAttributeNS(this.XMLNS_NAMESPACE, "xmlns:" + prefix,
					opt_nsMap[prefix])
	}
	return doc
};
G_FirefoxXMLUtils.getXMLString = function(node) {
	return Cc["@mozilla.org/xmlextras/xmlserializer;1"]
			.createInstance(Ci.nsIDOMSerializer).serializeToString(node)
};
G_FirefoxXMLUtils.loadXML = function(file) {
	var fis = Cc["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Ci.nsIFileInputStream);
	fis.init(file, 1, 0, 0);
	var doc = Cc["@mozilla.org/xmlextras/domparser;1"]
			.createInstance(Ci.nsIDOMParser).parseFromStream(fis, null,
					fis.available(), "text/xml");
	fis.close();
	if (doc.documentElement.nodeName == "parsererror")
		throw new Error(doc.documentElement.firstChild.nodeValue);
	return doc
};
G_FirefoxXMLUtils.parseString = function(str) {
	var doc = Cc["@mozilla.org/xmlextras/domparser;1"]
			.createInstance(Ci.nsIDOMParser).parseFromString(str, "text/xml");
	if (G_FirefoxXMLUtils.isParserError(doc))
		throw new Error(doc.documentElement.firstChild.nodeValue);
	return doc
};
G_FirefoxXMLUtils.isParserError = function(doc) {
	var root = doc.documentElement;
	return root.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml"
			&& root.nodeName == "parsererror"
};
G_FirefoxXMLUtils.saveXML = function(xml, file) {
	G_FileWriter.writeAll(file, this.getXMLString(xml))
};
G_FirefoxXMLUtils.selectNodes = function(context, xpath, opt_nsResolver,
		opt_snapshot) {
	var doc = context.nodeType == context.DOCUMENT_NODE
			? context
			: context.ownerDocument;
	isDef(opt_nsResolver) || (opt_nsResolver = null);
	var type = opt_snapshot
			? Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE
			: Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE;
	return doc.evaluate(xpath, context, opt_nsResolver, type, null)
};
G_FirefoxXMLUtils.selectSingleNode = function(context, xpath, opt_nsResolver) {
	var doc = context.nodeType == context.DOCUMENT_NODE
			? context
			: context.ownerDocument;
	isDef(opt_nsResolver) || (opt_nsResolver = null);
	return doc.evaluate(xpath, context, opt_nsResolver,
			Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
};
G_FirefoxXMLUtils.isNil = function(elm) {
	return elm.getAttributeNS(this.XSI_NAMESPACE, "nil") == "true"
};
G_FirefoxXMLUtils.setNil = function(elm) {
	elm.setAttributeNS(this.XSI_NAMESPACE, "xsi:nil", "true")
};
function G_Alarm(callback, delayMS, opt_repeating, opt_maxTimes) {
	this.debugZone = "alarm";
	this.callback_ = callback;
	this.repeating_ = !!opt_repeating;
	var Cc = Components.classes, Ci = Components.interfaces;
	this.timer_ = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
	var type = opt_repeating
			? this.timer_.TYPE_REPEATING_SLACK
			: this.timer_.TYPE_ONE_SHOT;
	this.maxTimes_ = opt_maxTimes ? opt_maxTimes : null;
	this.nTimes_ = 0;
	this.timer_.initWithCallback(this, delayMS, type)
}
G_Alarm.prototype.cancel = function() {
	if (this.timer_) {
		this.timer_.cancel();
		this.timer_ = null;
		this.callback_ = null
	}
};
G_Alarm.prototype.notify = function() {
	var ret = this.callback_();
	this.nTimes_++;
	if (this.repeating_ && typeof this.maxTimes_ == "number"
			&& this.nTimes_ >= this.maxTimes_)
		this.cancel();
	else
		this.repeating_ || this.cancel();
	return ret
};
G_Alarm.prototype.QueryInterface = function(iid) {
	if (iid.equals(Components.interfaces.nsISupports)
			|| iid.equals(Components.interfaces.nsIObserver)
			|| iid.equals(Components.interfaces.nsITimerCallback))
		return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};
function G_ConditionalAlarm(callback, delayMS, opt_repeating, opt_maxTimes) {
	G_Alarm.call(this, callback, delayMS, opt_repeating, opt_maxTimes);
	this.debugZone = "conditionalalarm"
}
G_ConditionalAlarm.inherits(G_Alarm);
G_ConditionalAlarm.prototype.notify = function(timer) {
	var rv = G_Alarm.prototype.notify.call(this, timer);
	this.repeating_ && rv && this.cancel()
};
function G_NewXMLHttpRequest() {
	var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
			.createInstance(Ci.nsIXMLHttpRequest);
	request.QueryInterface(Ci.nsIJSXMLHttpRequest);
	return request
}
function G_XMLFetcher(opt_stripCookies) {
	this.debugZone = "xmlfetcher";
	this.request_ = G_NewXMLHttpRequest();
	this.stripCookies_ = !!opt_stripCookies;
	this.callback_ = null;
	this.headers_ = {}
}
G_XMLFetcher.prototype.setRequestHeader = function(header, value) {
	this.headers_[header] = value
};
G_XMLFetcher.prototype.initRequest_ = function(type, url, callback) {
	this.request_.abort();
	this.request_ = G_NewXMLHttpRequest();
	this.callback_ = callback;
	this.request_.open(type, url, true);
	for (var name in this.headers_)
		this.request_.setRequestHeader(name, this.headers_[name]);
	this.stripCookies_ && new G_CookieStripper(this.request_.channel);
	this.request_.onreadystatechange = BindToObject(this.readyStateChange, this)
};
G_XMLFetcher.prototype.head = function(url, callback) {
	this.initRequest_("HEAD", url, callback);
	this.request_.send(null)
};
G_XMLFetcher.prototype.get = function(url, callback) {
	this.initRequest_("GET", url, callback);
	this.request_.send(null)
};
G_XMLFetcher.prototype.post = function(url, postData, callback) {
	this.initRequest_("POST", url, callback);
	"Content-Type" in this.headers_
			|| this.request_.setRequestHeader("Content-Type",
					"application/x-www-form-urlencoded");
	this.request_.send(postData)
};
G_XMLFetcher.prototype.readyStateChange = function() {
	if (this.request_.readyState != 4)
		return;
	var responseText = null, responseXML = null, status = null;
	try {
		responseText = this.request_.responseText;
		responseXML = this.request_.responseXML;
		status = this.request_.status
	} catch (e) {
	}
	if (this.callback_) {
		this.callback_({
					responseText : responseText,
					responseXML : responseXML,
					status : status
				});
		this.request_.onreadystatechange = null;
		this.callback_ = null
	}
};
G_XMLFetcher.prototype.getResponseHeader = function(header) {
	if (this.request_ && this.request_.readyState == 4)
		return this.request_.getResponseHeader(header)
};
function G_CookieStripper(channel) {
	this.debugZone = "cookiestripper";
	this.topic_ = "http-on-modify-request";
	this.channel_ = channel;
	this.observerService_ = Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService);
	this.observerService_.addObserver(this, this.topic_, false);
	var twentySeconds = 20000;
	this.alarm_ = new G_Alarm(BindToObject(this.stopObserving, this),
			twentySeconds)
}
G_CookieStripper.prototype.observe = function(subject, topic) {
	if (topic != this.topic_ || subject != this.channel_)
		return;
	this.channel_.QueryInterface(Ci.nsIHttpChannel);
	this.channel_.setRequestHeader("Cookie", "", false);
	this.alarm_.cancel();
	this.stopObserving()
};
G_CookieStripper.prototype.stopObserving = function() {
	this.observerService_.removeObserver(this, this.topic_);
	this.channel_ = this.alarm_ = this.observerService_ = null
};
G_CookieStripper.prototype.QueryInterface = function(iid) {
	if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIObserver))
		return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};
function G_NoAuthXMLFetcher(opt_stripCookies) {
	G_XMLFetcher.call(this, opt_stripCookies);
	this.debugZone = "noauth-xmlfetcher"
}
G_NoAuthXMLFetcher.inherits(G_XMLFetcher);
G_NoAuthXMLFetcher.prototype.initRequest_ = function(type, url, callback) {
	G_XMLFetcher.prototype.initRequest_.call(this, type, url, callback);
	var channel = this.request_.channel;
	channel.QueryInterface(Ci.nsIChannel);
	channel.notificationCallbacks = new G_NoAuthInterfaceReqestor
};
function G_NoAuthInterfaceReqestor() {
	this.debugZone = "noauth-interface-requestor"
}
G_NoAuthInterfaceReqestor.prototype.getInterface = function(iid) {
	if (iid.equals(Ci.nsIAuthPrompt))
		return new G_NoAuthPrompt;
	return null
};
G_NoAuthInterfaceReqestor.prototype.QueryInterface = function(iid) {
	if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIInterfaceRequestor))
		return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};
function G_NoAuthPrompt() {
}
G_NoAuthPrompt.prototype.prompt = function() {
	throw Components.results.NS_ERROR_NOT_AVAILABLE;
};
G_NoAuthPrompt.prototype.promptPassword = function() {
	throw Components.results.NS_ERROR_NOT_AVAILABLE;
};
G_NoAuthPrompt.prototype.promptUsernameAndPassword = function() {
	throw Components.results.NS_ERROR_NOT_AVAILABLE;
};
G_NoAuthPrompt.prototype.QueryInterface = function(iid) {
	if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIAuthPrompt))
		return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};
function G_ObserverWrapper(topic, observeFunction) {
	this.debugZone = "observer";
	this.topic_ = topic;
	this.observeFunction_ = observeFunction
}
G_ObserverWrapper.prototype.QueryInterface = function(iid) {
	if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIObserver))
		return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};
G_ObserverWrapper.prototype.observe = function(subject, topic, data) {
	topic == this.topic_ && this.observeFunction_(subject, topic, data)
};
function G_ObserverServiceObserver(topic, observeFunction, opt_onlyOnce) {
	this.debugZone = "observerserviceobserver";
	this.topic_ = topic;
	this.observeFunction_ = observeFunction;
	this.onlyOnce_ = !!opt_onlyOnce;
	this.observer_ = new G_ObserverWrapper(this.topic_, BindToObject(
					this.observe_, this));
	this.observerService_ = Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService);
	this.observerService_.addObserver(this.observer_, this.topic_, false)
}
G_ObserverServiceObserver.prototype.unregister = function() {
	this.observerService_.removeObserver(this.observer_, this.topic_);
	this.observerService_ = null
};
G_ObserverServiceObserver.prototype.observe_ = function(subject, topic, data) {
	this.observeFunction_(subject, topic, data);
	this.onlyOnce_ && this.unregister()
};
function FormatCenteredWindowPosition(window, width, height) {
	var left = window.screen.left + window.screenX
			+ (window.outerWidth - width) / 2, top = window.screen.top
			+ window.screenY + (window.outerHeight - height) / 2;
	left = Math.min(window.screen.left + window.screen.width - width, left);
	left = Math.max(left, window.screen.left);
	top = Math.min(window.screen.top + window.screen.height - height, top);
	top = Math.max(top, window.screen.top);
	return "width=" + width + ",height=" + height + ",left=" + left + ",top="
			+ top
}
function GetPlatform() {
	var os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS
			.toUpperCase(), platform = 0;
	switch (os) {
		case "WINNT" :
		case "WINME" :
		case "WIN98" :
			platform = 1;
			break;
		case "DARWIN" :
			platform = 2;
			break;
		case "LINUX" :
		case "LINUX-GNU" :
		case "FREEBSD" :
		case "SUNOS" :
			platform = 3;
			break
	}
	return platform
}
function GetSelectedText(chromeWindow) {
	return GetFocusedWindow(chromeWindow).getSelection()
}
function GetFocusedWindow(chromeWindow) {
	var gto = chromeWindow.MAIL,
		window = gto._getCurrentWindow(),
		focusedWindow;
	if (window.frames.length == 0)
		focusedWindow = window;
	else {
		var xulDocument = chromeWindow.document;
		focusedWindow = xulDocument.commandDispatcher.focusedWindow;
		if (focusedWindow == null)
			focusedWindow = window
	}
	return focusedWindow
}
function StripHTML(html) {
	var unescaper = Cc["@mozilla.org/feed-unescapehtml;1"]
			.createInstance(Ci.nsIScriptableUnescapeHTML);
	return unescaper.unescape(html)
}

function ListDictionary(name) {
	this.name_ = name;
	this.members_ = []
}
ListDictionary.prototype.isMember = function(item) {
	for (var i = 0; i < this.members_.length; i++)
		if (this.members_[i] == item)
			return true;
	return false
};
ListDictionary.prototype.addMember = function(item) {
	this.members_.push(item)
};
ListDictionary.prototype.removeMember = function(item) {
	for (var i = 0; i < this.members_.length; i++)
		if (this.members_[i] == item) {
			for (var j = i; j < this.members_.length; j++)
				this.members_[j] = this.members_[j + 1];
			this.members_.length--;
			return true
		}
	return false
};
ListDictionary.prototype.forEach = function(func) {
	if (typeof func != "function")
		throw new Error("argument to forEach is not a function, it's a(n) "
				+ typeof func);
	for (var i = 0; i < this.members_.length; i++)
		func(this.members_[i])
};
function EventRegistrar(eventTypes) {
	this.eventTypes = [];
	this.listeners_ = {};
	if (eventTypes instanceof Array)
		var events = eventTypes;
	else if (typeof eventTypes == "object") {
		var events = [];
		for (var e in eventTypes)
			events.push(eventTypes[e])
	} else
		throw new Error("Unrecognized init parameter to EventRegistrar");
	for (var i = 0; i < events.length; i++) {
		this.eventTypes.push(events[i]);
		this.listeners_[events[i]] = new ListDictionary(events[i] + "Listeners")
	}
}
EventRegistrar.prototype.isKnownEventType = function(eventType) {
	for (var i = 0; i < this.eventTypes.length; i++)
		if (eventType == this.eventTypes[i])
			return true;
	return false
};
EventRegistrar.prototype.addEventType = function(eventType) {
	if (this.isKnownEventType(eventType))
		throw new Error("Event type already known: " + eventType);
	this.eventTypes.push(eventType);
	this.listeners_[eventType] = new ListDictionary(eventType + "Listeners")
};
EventRegistrar.prototype.registerListener = function(eventType, listener) {
	if (!this.isKnownEventType(eventType))
		throw new Error("Unknown event type: " + eventType);
	this.listeners_[eventType].addMember(listener)
};
EventRegistrar.prototype.removeListener = function(eventType, listener) {
	if (!this.isKnownEventType(eventType))
		throw new Error("Unknown event type: " + eventType);
	this.listeners_[eventType].removeMember(listener)
};
EventRegistrar.prototype.fire = function(eventType, e) {
	if (!this.isKnownEventType(eventType))
		throw new Error("Unknown event type: " + eventType);
	var invoke = function(listener) {
		listener(e)
	};
	this.listeners_[eventType].forEach(invoke)
};
function G_TabbedBrowserWatcher(tabBrowser, name, opt_filterAboutBlank) {
	this.debugZone = "tabbedbrowserwatcher";
	this.tabBrowser_ = tabBrowser;
	this.filterAboutBlank_ = !!opt_filterAboutBlank;
	this.events = G_TabbedBrowserWatcher.events;
	this.name_ = name;
	this.mark_ = G_TabbedBrowserWatcher.mark_ + "-" + this.name_;
	this.registrar_ = new EventRegistrar(G_TabbedBrowserWatcher.events);
	this.tabbox_ = this.getTabBrowser().mTabBox;
	this.onDOMContentLoadedClosure_ = BindToObject(this.onDOMContentLoaded,
			this);
	this.tabbox_.addEventListener("DOMContentLoaded",
			this.onDOMContentLoadedClosure_, true);
	this.onDOMNodeInsertedClosure_ = BindToObject(this.onDOMNodeInserted, this);
	this.tabbox_.addEventListener("DOMNodeInserted",
			this.onDOMNodeInsertedClosure_, true);
	this.onTabSwitchClosure_ = BindToObject(this.onTabSwitch, this);
	this.tabbox_.addEventListener("select", this.onTabSwitchClosure_, true);
	var win = this.tabbox_.ownerDocument.defaultView;
	this.onChromeUnloadClosure_ = BindToObject(this.onChromeUnload_, this);
	win.addEventListener("unload", this.onChromeUnloadClosure_, false);
	this.lastTab_ = this.getCurrentBrowser();
	this.detectNewTabs_()
}
G_TabbedBrowserWatcher.events = {
	DOMCONTENTLOADED : "domcontentloaded",
	LOCATIONCHANGE : "locationchange",
	PAGESHOW : "pageshow",
	PAGEHIDE : "pagehide",
	LOAD : "load",
	UNLOAD : "unload",
	TABLOAD : "tabload",
	TABUNLOAD : "tabunload",
	TABSWITCH : "tabswitch",
	TABMOVE : "tabmove"
};
G_TabbedBrowserWatcher.mark_ = "watcher-marked";
G_TabbedBrowserWatcher.prototype.onChromeUnload_ = function() {
	if (this.tabbox_) {
		this.tabbox_.removeEventListener("DOMContentLoaded",
				this.onDOMContentLoadedClosure_, true);
		this.tabbox_.removeEventListener("DOMNodeInserted",
				this.onDOMNodeInsertedClosure_, true);
		this.tabbox_.removeEventListener("select", this.onTabSwitchClosure_,
				true);
		var win = this.tabbox_.ownerDocument.defaultView;
		win.removeEventListener("unload", this.onChromeUnloadClosure_, false);
		this.tabbox_ = null
	}
	if (this.lastTab_)
		this.lastTab_ = null;
	if (this.tabBrowser_)
		this.tabBrowser_ = null
};
G_TabbedBrowserWatcher.prototype.isInstrumented_ = function(browser) {
	return !!browser[this.mark_]
};
G_TabbedBrowserWatcher.prototype.instrumentBrowser_ = function(browser) {
	G_Assert(this, !this.isInstrumented_(browser),
			"Browser already instrumented!");
	new G_BrowserWatcher(this, browser);
	browser[this.mark_] = true
};
G_TabbedBrowserWatcher.prototype.detectNewTabs_ = function() {
	var tb = this.getTabBrowser();
	for (var i = 0; i < tb.browsers.length; ++i)
		this.maybeFireTabLoad(tb.browsers[i])
};
G_TabbedBrowserWatcher.prototype.registerListener = function(eventType,
		listener) {
	this.registrar_.registerListener(eventType, listener)
};
G_TabbedBrowserWatcher.prototype.removeListener = function(eventType, listener) {
	this.registrar_.removeListener(eventType, listener)
};
G_TabbedBrowserWatcher.prototype.fire = function(eventType, e) {
	this.registrar_.fire(eventType, e)
};
G_TabbedBrowserWatcher.prototype.fireDocEvent_ = function(eventType, doc,
		browser) {
	if (!this.tabBrowser_)
		return;
	try {
		var isTop = doc == browser.contentDocument
	} catch (e) {
		var isTop = undefined
	}
	var inSelected = browser == this.getCurrentBrowser(), location = doc
			? doc.location.href
			: undefined;
	if (!this.filterAboutBlank_ || location != "about:blank")
		this.fire(eventType, {
					doc : doc,
					isTop : isTop,
					inSelected : inSelected,
					browser : browser
				})
};
G_TabbedBrowserWatcher.prototype.maybeFireTabLoad = function(browser) {
	if (!this.isInstrumented_(browser)) {
		this.instrumentBrowser_(browser);
		this.fire(this.events.TABLOAD, {
					browser : browser
				})
	}
};
G_TabbedBrowserWatcher.prototype.onDOMContentLoaded = function(e) {
	var doc = e.target, browser = this.getBrowserFromDocument(doc);
	if (!browser)
		return;
	this.maybeFireTabLoad(browser);
	this.fireDocEvent_(this.events.DOMCONTENTLOADED, doc, browser)
};
G_TabbedBrowserWatcher.prototype.onDOMNodeInserted = function(e) {
	if (e.target.localName != "tab")
		return;
	if (!isDef(e.target._tPos))
		return;
	var fromPos = e.target._tPos, toPos;
	for (var i = 0; i < e.relatedNode.childNodes.length; i++) {
		var child = e.relatedNode.childNodes[i];
		if (child == e.target) {
			toPos = i;
			break
		}
	}
	this.fire(this.events.TABMOVE, {
				tab : e.target,
				fromIndex : fromPos,
				toIndex : toPos
			})
};
G_TabbedBrowserWatcher.prototype.onTabSwitch = function(e) {
	if (e.target == null || e.target.localName != "tabs"
			&& e.target.localName != "tabpanels")
		return;
	var fromBrowser = this.lastTab_, toBrowser = this.getCurrentBrowser();
	if (fromBrowser != toBrowser) {
		this.lastTab_ = toBrowser;
		this.fire(this.events.TABSWITCH, {
					fromBrowser : fromBrowser,
					toBrowser : toBrowser
				})
	}
};
G_TabbedBrowserWatcher.prototype.getTabBrowser = function() {
	return this.tabBrowser_
};
G_TabbedBrowserWatcher.prototype.getCurrentBrowser = function() {
	return this.getTabBrowser().selectedBrowser
};
G_TabbedBrowserWatcher.prototype.getCurrentWindow = function() {
	return this.getCurrentBrowser().contentWindow
};
G_TabbedBrowserWatcher.prototype.getBrowserFromDocument = function(doc) {
	function docInWindow(doc, win) {
		if (win.document == doc)
			return true;
		if (win.frames)
			for (var i = 0; i < win.frames.length; i++)
				if (docInWindow(doc, win.frames[i]))
					return true;
		return false
	}
	var browsers = this.getTabBrowser().browsers;
	for (var i = 0; i < browsers.length; i++)
		if (docInWindow(doc, browsers[i].contentWindow))
			return browsers[i];
	return null
};
G_TabbedBrowserWatcher.prototype.getDocumentFromURL = function(url, opt_browser) {
	function docWithURL(win, url) {
		if (win.document.location.href == url)
			return win.document;
		if (win.frames)
			for (var i = 0; i < win.frames.length; i++) {
				var rv = docWithURL(win.frames[i], url);
				if (rv)
					return rv
			}
		return null
	}
	if (opt_browser)
		return docWithURL(opt_browser.contentWindow, url);
	var browsers = this.getTabBrowser().browsers;
	for (var i = 0; i < browsers.length; i++) {
		var rv = docWithURL(browsers[i].contentWindow, url);
		if (rv)
			return rv
	}
	return null
};
G_TabbedBrowserWatcher.prototype.getDocumentsFromURL = function(url,
		opt_browser) {
	var docs = [];
	function getDocsWithURL(win, url) {
		win.document.location.href == url && docs.push(win.document);
		if (win.frames)
			for (var i = 0; i < win.frames.length; i++)
				getDocsWithURL(win.frames[i], url)
	}
	if (opt_browser)
		return getDocsWithURL(opt_browser.contentWindow, url);
	var browsers = this.getTabBrowser().browsers;
	for (var i = 0; i < browsers.length; i++)
		getDocsWithURL(browsers[i].contentWindow, url);
	return docs
};
G_TabbedBrowserWatcher.prototype.getBrowserFromWindow = function(sub) {
	function containsSubWindow(sub, win) {
		if (win == sub)
			return true;
		if (win.frames)
			for (var i = 0; i < win.frames.length; i++)
				if (containsSubWindow(sub, win.frames[i]))
					return true;
		return false
	}
	var browsers = this.getTabBrowser().browsers;
	for (var i = 0; i < browsers.length; i++)
		if (containsSubWindow(sub, browsers[i].contentWindow))
			return browsers[i];
	return null
};
G_TabbedBrowserWatcher.getTabElementFromBrowser = function(tabBrowser, browser) {
	for (var i = 0; i < tabBrowser.browsers.length; i++)
		if (tabBrowser.browsers[i] == browser)
			return tabBrowser.mTabContainer.childNodes[i];
	return null
};
function G_BrowserWatcher(tabbedBrowserWatcher, browser) {
	this.debugZone = "browserwatcher";
	this.parent_ = tabbedBrowserWatcher;
	this.browser_ = browser;
	this.onPageShowClosure_ = BindToObject(this.onPageShow, this);
	this.browser_.addEventListener("pageshow", this.onPageShowClosure_, true);
	this.onPageHideClosure_ = BindToObject(this.onPageHide, this);
	this.browser_.addEventListener("pagehide", this.onPageHideClosure_, true);
	this.onLoadClosure_ = BindToObject(this.onLoad, this);
	this.browser_.addEventListener("load", this.onLoadClosure_, true);
	this.onUnloadClosure_ = BindToObject(this.onUnload, this);
	this.browser_.addEventListener("unload", this.onUnloadClosure_, true);
	this.webProgressListener_ = {
		QueryInterface : function() {
			return this
		},
		onLocationChange : bind(this.onLocationChange, this),
		onStateChange : function() {
		},
		onStatusChange : function() {
		},
		onSecurityChange : function() {
		},
		onProgressChange : function() {
		},
		onRefreshAttempted : function() {
			return true
		}
	};
	this.browser_.addProgressListener(this.webProgressListener_,
			Ci.nsIWebProgress.NOTIFY_LOCATION)
}
G_BrowserWatcher.prototype.onLocationChange = function(webProgress, request,
		location) {
	G_Debug(this, "onLocationChange for {%s}".subs(location.spec));
	if (!this.parent_)
		return;
	var e = {
		browser : this.browser_,
		isTop : true
	};
	this.parent_.fire(this.parent_.events.LOCATIONCHANGE, e)
};
G_BrowserWatcher.prototype.onPageShow = function(e) {
	if (e.target && e.target.nodeName == "#document") {
		var doc = e.target;
		this.parent_.fireDocEvent_(this.parent_.events.PAGESHOW, doc,
				this.browser_)
	}
};
G_BrowserWatcher.prototype.onLoad = function(e) {
	if (!e.target)
		return;
	if (e.target.nodeName != "#document")
		return;
	var doc = e.target;
	this.parent_.fireDocEvent_(this.parent_.events.LOAD, doc, this.browser_)
};
G_BrowserWatcher.prototype.onUnload = function(e) {
	var doc = e.target;
	doc && doc.nodeName == "#document"
			&& this.parent_.fireDocEvent_("unload", doc, this.browser_);
	if (this.browser_.docShell)
		return;
	if (!doc) {
		this.parent_.fire(this.parent_.events.TABUNLOAD, {
					browser : this.browser_
				});
		this.browser_.removeEventListener("pageshow", this.onPageShowClosure_,
				true);
		this.browser_.removeEventListener("pagehide", this.onPageHideClosure_,
				true);
		this.browser_.removeEventListener("load", this.onLoadClosure_, true);
		this.browser_
				.removeEventListener("unload", this.onUnloadClosure_, true);
		this.parent_ = null;
		this.browser_ = null
	}
};
G_BrowserWatcher.prototype.onPageHide = function(e) {
	if (e.target.nodeName != "#document")
		return;
	var doc = e.target;
	this.parent_
			.fireDocEvent_(this.parent_.events.PAGEHIDE, doc, this.browser_)
};
function G_MozVersionNumber(version) {
	this.debugZone = "mozversion";
	this.version_ = version;
	this.components_ = this.version_.split(".");
	this.comparator_ = Cc["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Ci.nsIVersionComparator)
}
G_MozVersionNumber.prototype.compareToString = function(v) {
	return this.comparator_.compare(this.version_, v)
};
G_MozVersionNumber.prototype.isVersionOf = function(v) {
	if (this.version_.indexOf("+") != -1 || v.indexOf("+") != -1)
		return this.compareToString(v) == 0;
	if (this.compareToString(v) == 0)
		return true;
	var vComponents = v.split(".");
	if (vComponents.length > this.components_)
		return false;
	for (var i = 0; i < vComponents.length; i++)
		if (vComponents[i] != this.components_[i])
			return false;
	return true
};
G_MozVersionNumber.prototype.getVersion = function() {
	return this.version_
};
function G_ThisFirefoxVersion() {
	var version;
	try {
		var appInfo = Cc["@mozilla.org/xre/app-info;1"]
				.getService(Ci.nsIXULAppInfo);
		version = appInfo.version
	} catch (e) {
		version = (new G_Preferences).getPref("app.version")
	}
	if (!version)
		throw new Error("Couldn't get application version!");
	G_MozVersionNumber.call(this, version);
	this.debugZone = "firefoxversion"
}
G_ThisFirefoxVersion.inherits(G_MozVersionNumber);
function MRGeckoVersion() {
	var appInfo = Cc["@mozilla.org/xre/app-info;1"]
			.getService(Ci.nsIXULAppInfo);
	G_MozVersionNumber.call(this, appInfo.platformVersion)
}
MRGeckoVersion.inherits(G_MozVersionNumber);
MRGeckoVersion.prototype.isFirefox3 = function() {
	return this.isVersionOf("1.9")
};
MRGeckoVersion.prototype.isFirefox2 = function() {
	return this.isVersionOf("1.8.1")
};
var G_FirefoxPlatform = {
	UNKNOWN : 0,
	WIN : 1,
	MAC : 2,
	LINUX : 3
};
function G_getFirefoxPlatform() {
	var os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS
			.toUpperCase(), platform = G_FirefoxPlatform.UNKNOWN;
	switch (os) {
		case "WINNT" :
		case "WINME" :
		case "WIN98" :
			platform = G_FirefoxPlatform.WIN;
			break;
		case "DARWIN" :
			platform = G_FirefoxPlatform.MAC;
			break;
		case "LINUX" :
		case "LINUX-GNU" :
		case "FREEBSD" :
		case "SUNOS" :
			platform = G_FirefoxPlatform.LINUX;
			break
	}
	return platform
};
