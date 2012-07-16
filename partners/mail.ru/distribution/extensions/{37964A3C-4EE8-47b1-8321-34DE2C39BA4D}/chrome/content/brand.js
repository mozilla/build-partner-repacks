function MRBrand(xcomLib) {
    this.debugZone = "MRBrand";
    this.provider = false;
    this.brand = "";
    this.filename = "brand.xml";
    this.xcomLib = xcomLib;
};

MRBrand.prototype.init = function(sReferer) {
    this.brand = sReferer;
    var refParse = this.brand.match(/prov(\d+)/);
    if (refParse != null && refParse[0] == this.brand) {
        this.brand = refParse[1];
        this.provider = true;
    }
    this.save();
}

MRBrand.prototype.save = function() {
    var doc = this.xcomLib.G_FirefoxXMLUtils.newXML("brand");
    var root = doc.documentElement;
    root.setAttribute("version", "1.0");
    var brand = doc.createElement("brand");
    brand.setAttribute("name", this.brand);
    brand.setAttribute("provider", this.provider);
    root.appendChild(brand);

    var dir = this.xcomLib.G_File.getProfileFile(this.xcomLib.MRSputnikDataDir);
    dir.exists() && !dir.isDirectory() && dir.remove(true);
    dir.exists() || dir.create(dir.DIRECTORY_TYPE, 484);
    dir.append(this.filename);
    if (!this.brand.length) {
        dir.exists() && dir.remove(false);
        return;
    }
    var stream = Cc["@mozilla.org/network/file-output-stream;1"]
			    .createInstance(Ci.nsIFileOutputStream);
    stream.init(dir, this.xcomLib.G_File.PR_WRONLY | this.xcomLib.G_File.PR_CREATE_FILE
					    | this.xcomLib.G_File.PR_TRUNCATE, -1, 0);
    var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"]
			    .createInstance(Ci.nsIDOMSerializer);
    serializer.serializeToStream(doc.documentElement, stream, "UTF-8");
}

MRBrand.prototype.load = function() {
	var file = this.xcomLib.G_File.getProfileFile(this.xcomLib.MRSputnikDataDir);
 	file.append(this.filename);
	if (!file.exists())
		return;
	var doc;
	try
	{
		doc = this.xcomLib.G_FirefoxXMLUtils.loadXML(file)
	}
	catch (e) 
	{
	}
	if (!doc)
		return;
    var brand = doc.documentElement.childNodes[0];
    this.brand = brand.getAttribute("name");
    this.provider = brand.getAttribute("provider");
}

MRBrand.prototype.getProvider = function(brand) {
    if (!this.provider) {
        return 0;
    }
    return parseInt(this.brand);
}
