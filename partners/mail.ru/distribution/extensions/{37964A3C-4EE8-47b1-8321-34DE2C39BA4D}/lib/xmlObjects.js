function MRInstallOptions() {
    this.debugZone = "MRInstallOptions";
    this.setHomepage = true;
    this.setDefSearch = true;
    this.setShortMode = false;
    this.partnerNewUrl = '';
    this.referer = '';
    this.toolbarid = '';
    this.toolbarNewSig = '';
    this.partnerOnlineUrl = '';
    this.file = '';
    this.newOptions = false;
    this.read();
    
};

MRInstallOptions.prototype.read = function() {
	try
	{
		this.file = G_File.getProfileFile(MRSputnikDataDir);
		if(this.file.exists() && this.file.isDirectory())
		{
			this.file.appendRelativePath("install_options.xml");
			var xmlInstall = G_FirefoxXMLUtils.loadXML(this.file);
			if(xmlInstall)
			{
				var xmlDefSearch = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='default_search']");
				if(xmlDefSearch)
				{
					if(xmlDefSearch.getAttribute("value")=="0")
					{
						this.setDefSearch = false;
					}
					else if(xmlDefSearch.getAttribute("value")=="1")
					{
						this.setDefSearch = true;
					}
				}
				var xmlNoHomepage = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='nohomepage']");
				if(xmlNoHomepage)
				{
				    this.setHomepage = (xmlNoHomepage.getAttribute("value")!="1");
				}
				var xmlShortMode = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='shortmode']");
				if (xmlShortMode) {
				    this.setShortMode = (xmlShortMode.getAttribute("value") == "1");
				}
				var xmlReferer = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='partner_referer']");
				if (xmlReferer)
				{
    				this.referer = xmlReferer.getAttribute("value");
				}
				var xmlGUID = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='guid']");
				if(xmlGUID)
				{
    				this.toolbarid = xmlGUID.getAttribute("value");
				}
                                var xmlNewSig = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='new_sig']");
				if(xmlNewSig)
				{
                                    this.toolbarNewSig = xmlNewSig.getAttribute("value");
				}
                                
                                var xmlSearchName = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='search_name']");
				if(xmlSearchName)
				{
                                    this.providerSearchName = xmlSearchName.getAttribute("value");
				}
                                
                                var partnerOnlineUrl = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='partner_online_url']");
				if(partnerOnlineUrl)
				{
                                    this.partnerOnlineUrl = partnerOnlineUrl.getAttribute("value");
				}
				var xmlPartnerNewURL = G_FirefoxXMLUtils.selectSingleNode(xmlInstall, "//params/param[@name='partner_new_url']");
				if (xmlPartnerNewURL) {
				    this.partnerNewUrl = xmlPartnerNewURL.getAttribute("value");
				}
            }
            this.newOptions = true;
			this.file.remove(false);
		}
	}
	catch(e)
	{
	}
};

function MRInformerParser() {
    this.debugZone = "MRInformerParser";
    this.status = "";
    this.id = "";
    this.url = "";
    this.valid = "";
    this.refetch = 300;
    this.delay = 3000;
    this.imageURL = "";
    this.text = "";
    this.shortText = "";
    this.textColor = "";
    this.tooltip = "";
    this.empty = true;
    this.display = 1;
    this.textAfter = [];

    this.mPrefs = new G_Preferences(MRSputnikPrefBase, false, false);    
};

MRInformerParser.prototype.copy = function(info) {
    this.status = info.status;
    this.id = info.id;
    this.url = info.url;
    this.valid = info.valid;
    this.refetch = info.refetch;
    this.delay = info.delay;
    this.imageURL = info.imageURL;
    this.text = info.text;
    this.shortText = info.shortText;
    this.textColor = info.textColor;
    this.tooltip = info.tooltip;
    this.empty = info.empty;
    this.display = info.display;
    for (var i = 0; i < info.textAfter.length; ++i) {
        this.textAfter.push(
            {
                textFull: info.textAfter[i].textFull,
                textShort: info.textAfter[i].textShort,
                color: info.textAfter[i].color,
                bold: info.textAfter[i].bold
            }
        );
    }
}

MRInformerParser.prototype.parse = function(brick) {
    if (brick.nodeName != 'brick' || !brick.hasAttributes()) {
        return false;
    }
    //     this.status = brick.attributes.getNamedItem('status').value;
    this.id = brick.attributes.getNamedItem('id').value;
    var mail_url = brick.attributes.getNamedItem('href');
    if (mail_url != null) {
        this.url = mail_url.value;
    }
    var valid = brick.attributes.getNamedItem('valid');
    if (valid != null && valid.value.length > 0) {
        this.valid = valid.value * 1000;
    }
    var refetch = brick.attributes.getNamedItem('refetch');
    if (refetch != null && refetch.value.length > 0) {
        this.refetch = refetch.value * 1000;
    }
    var delay = brick.attributes.getNamedItem('delay');
    if (delay != null && delay.value.length > 0) {
        this.delay = delay.value;
    }
    var display = brick.attributes.getNamedItem('display');
    if (display != null) {
        this.display = parseInt(display.value);
    }
    this.textAfter = [];
    for (var j = 0; j < brick.childNodes.length; j++) {
        var node = brick.childNodes.item(j);
        switch (node.nodeName) {
            case 'image':
                {
                    this.imageURL = node.textContent;
                    break;
                }
            case 'textafter':
                {
                    this.textColor = node.hasAttribute('textcolor') ? node.getAttribute('textcolor') : '';
                    this.text = node.textContent;
                    this.shortText = node.hasAttribute('s') ? node.getAttribute('s') : this.text;
                    this.textAfter.push(
                        {
                            textFull: this.text,
                            textShort: this.shortText,
                            color: this.textColor,
                            bold: node.getAttribute("bold")
                        }
                    );
                    break;
                }
            case 'tooltip':
                {
                    this.tooltip = node.textContent;
                    break;
                }
            default:
                {
                    break;
                }
        }

    }
    this.empty = false;
    return true;
}

MRInformerParser.prototype.saveBrick = function(sKey, nodeBrick)
{
    var sBrick = G_FirefoxXMLUtils.getXMLString(nodeBrick);
    this.mPrefs.setUnicodePref(sKey + ".xml", sBrick);
    this.mPrefs.setPref(sKey + ".xml.recived", (new Date()).toGMTString());
}

MRInformerParser.prototype.loadBrick = function(sKey)
{
    var sBrick = this.mPrefs.getUnicodePref(sKey + ".xml", "");
    if (!sBrick || !sBrick.length)
    {
        return;
    }
    var domBrick = G_FirefoxXMLUtils.parseString(sBrick);
    if (!domBrick)
        return;
    this.parse(domBrick.firstChild);
}

MRInformerParser.prototype.loadFromCrome = function(sURL) {
    var loader = G_NewXMLHttpRequest();
    loader.open('GET', sURL, false);
    try {
        loader.send(null);
    }
    catch (e) {
        return;
    }
    if (!loader.responseXML) {
        return;
    }
    var domBrick = G_FirefoxXMLUtils.selectSingleNode(
	                    loader.responseXML,
	                     "//brick"
	               );
    if (!domBrick)
        return;
    this.parse(domBrick);
};

MRInformerParser.prototype.isValid = function() {
    if (this.empty) {
        return false;
    }
    return !this.isTimeout(this.refetch);
}

MRInformerParser.prototype.getTimeAfterRecive = function() {
    var dateRecieved = new Date(this.mPrefs.getPref(this.id + ".xml.recived", ""));
    var dateCur = new Date();
    return dateCur.getTime() - dateRecieved.getTime();
}

MRInformerParser.prototype.isTimeout = function(timeout) {
    var nDif = this.getTimeAfterRecive(this.key);
    if (nDif > 0 && nDif < parseInt(timeout) && nDif < 24 * 60 * 60 * 1000) {
        return false;
    }
    return true;
}

MRInformerParser.prototype.reset = function(sKey)
{
    this.empty = true;
    this.mPrefs.setPref(sKey + ".xml", "");
}

MRInformerParser.prototype.invalidate = function()
{
    if(this.isTimeout(this.valid))
    {
        this.reset(this.id);
    }
}

function MRBrand() {
    this.debugZone = "MRBrand";
    this.provider = false;
    this.brand = "";
    this.filename = "brand.xml";
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
    var doc = G_FirefoxXMLUtils.newXML("brand");
    var root = doc.documentElement;
    root.setAttribute("version", "1.0");
    var brand = doc.createElement("brand");
    brand.setAttribute("name", this.brand);
    brand.setAttribute("provider", this.provider);
    root.appendChild(brand);

    var dir = G_File.getProfileFile(MRSputnikDataDir);
    dir.exists() && !dir.isDirectory() && dir.remove(true);
    dir.exists() || dir.create(dir.DIRECTORY_TYPE, 484);
    dir.append(this.filename);
    if (!this.brand.length) {
        if (dir.exists()) {
            dir.remove(false);
        }
        return;
    }
    var stream = Cc["@mozilla.org/network/file-output-stream;1"]
			    .createInstance(Ci.nsIFileOutputStream);
    stream.init(dir, G_File.PR_WRONLY | G_File.PR_CREATE_FILE
					    | G_File.PR_TRUNCATE, -1, 0);
    var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"]
			    .createInstance(Ci.nsIDOMSerializer);
    serializer.serializeToStream(doc.documentElement, stream, "UTF-8");
}

MRBrand.prototype.load = function() {
	var file = G_File.getProfileFile(MRSputnikDataDir);
 	file.append(this.filename);
	if (!file.exists())
		return;
	var doc;
	try
	{
		doc = G_FirefoxXMLUtils.loadXML(file)
	}
	catch (e) 
	{
	}
	if (!doc)
		return;
    var brand = doc.documentElement.childNodes[0];
    this.brand = brand.getAttribute("name");
    this.provider = (brand.getAttribute("provider") == "true");
}

MRBrand.prototype.getProvider = function(brand) {
    if (!this.provider) {
        return 0;
    }
    return parseInt(this.brand);
}
