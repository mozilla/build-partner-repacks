function iso8601ToJSDate(a)
{
	var b = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
	var d = a.match(new RegExp(b));
	var c = 0;
	var e = new Date(d[1], 0, 1);
	if (d[3])
	{
		e.setMonth(d[3] - 1)
	}
	if (d[5])
	{
		e.setDate(d[5])
	}
	if (d[7])
	{
		e.setHours(d[7])
	}
	if (d[8])
	{
		e.setMinutes(d[8])
	}
	if (d[10])
	{
		e.setSeconds(d[10])
	}
	if (d[12])
	{
		e.setMilliseconds(Number("0." + d[12]) * 1000)
	}
	if (d[14])
	{
		c = (Number(d[16]) * 60) + Number(d[17]);
		c *= ((d[15] == '-') ? 1 : -1)
	}
	else
	{
		c = 180
	}
	c -= e.getTimezoneOffset();
	var f = (Number(e) + (c * 60 * 1000));
	e.setTime(Number(f));
	return e
}
function trim(a)
{
	if (!a) return '';
	a = a.replace(/^\s+/, '');
	a = a.replace(/\s+$/, '');
	a = a.replace(/\s+/g, ' ');
	return a
}
function itrim(a)
{
	return trim(a).replace(/\s+/g, ' ')
}
function split_string(a)
{
	var b = itrim(a);
	var d = '';
	var e = false;
	var f = false;
	var g = new Array();
	for (var i = 0; i < b.length; i++ )
	{
		var c = b.charAt(i);
		switch(c)
		{
		case ' ':
			{
				if (e == false)
				{
					g.push(d);
					d = '';
					if (f == true) f = false
				}
				else d += c;
				break
			}
		case '"':
			{
				if (e == false)
				{
					e = true;
					f = true
				}
				else
				{
					e = false;
					f = false
				}
				break
			}
		case ',':
			{
				break
			}
		case '+':
		case '~':
			{
				if (f == false) break
			}
		default:
			{
				if (f == false) f = true;
				d += c
			}

		}

	}
	if (d != '') g.push(d);
	return g
}
function get_extension_version(a)
{
	try
	{
		return Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager).getItemForID(a).version
	}
	catch(e)
	{

	}
	return 'Unknown'
}
function read_reg_string(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		return c.getCharPref(a)
	}
	catch(e)
	{
		return b
	}

}
function write_reg_string(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		c.setCharPref(a, b);
		return true
	}
	catch(e)
	{
		return false
	}

}
function read_reg_unicode_string(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		return c.getComplexValue(a, Components.interfaces.nsISupportsString).data
	}
	catch(e)
	{
		return b
	}

}
function write_reg_unicode_string(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		var d = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		d.data = b;
		c.setComplexValue(a, Components.interfaces.nsISupportsString, d);
		return true
	}
	catch(e)
	{
		return false
	}

}
function read_reg_bool(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		return c.getBoolPref(a)
	}
	catch(e)
	{
		return b
	}

}
function write_reg_bool(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		c.setBoolPref(a, b);
		return true
	}
	catch(e) {
	    G_Debug("write_reg_bool", "excception");
		return false
	}

}
function read_reg_int(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		return c.getIntPref(a)
	}
	catch(e)
	{
		return b
	}

}
function write_reg_int(a, b)
{
	var c = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	try
	{
		c.setIntPref(a, b);
		return true
	}
	catch(e)
	{
		return false
	}

}



/**return the domain of the given url
@param url - page addres
@return domain from the url*/
function getDomain(url) {
    var expIP4 = /(http:\/\/|http%3A\/\/)(\d+\.\d+\.\d+\.\d+)/i;
    var expDomain = /(http:\/\/|http%3A\/\/)([^\/]+\.)?([^\.]+\.[^\.]+)\/.*/i;
    var aIPResult = url.match(expIP4);
    if (aIPResult) 
    {
        return aIPResult[2];
    }
    var aDomainResult = url.match(expDomain);
    if(aDomainResult)
    {
        return aDomainResult[3];
    }
    return "";
}

function getSite(url){
    dump("get site for "+url+"\n");
    var string=new String(url);
	//truncate "http://"
	var index=string.search("http://");
	//dump("string=|"+string+"| index="+index+"\n");
	if(index==0){
            string=string.substring(7, string.length);
    }
    else{
        var index1=string.search("http%3A//");
        //dump("search for index1="+index1+"\n");
        if(index1==0){
            string=string.substring(9, string.length);
        }

    }
    dump("1get site for "+string+"\n");
	//dump("Get domain string="+string+"\n");
	if(string.search("/")!=-1){
		string=string.substring(0, string.indexOf("/"));
	}
    dump("2get site for "+string+"\n");
    return string;
    
    /*var reg=/http:\/\/(.*)/gi;
    var site=url;
    if(reg.test(url)){
        site=RegExp.$1;
        
        var reg2=/(.*)\//gi;
        if(reg2.test(site)){
            site=RegExp.$1;
            
        }
    }
    return site;*/
}

function  element_width(elment) {
    if (elment.nodeName == 'toolbarspring') {
        return 0;
    }
    var elementStyle = document.defaultView.getComputedStyle(elment, '');
    var marginLeft = elementStyle.getPropertyValue('margin-left');
    marginLeft = marginLeft ? Math.round(parseFloat(marginLeft)) : 0;
    var marginRight = elementStyle.getPropertyValue('margin-right');
    marginRight = marginRight ? Math.round(parseFloat(marginRight)) : 0;
    return elment.boxObject.width + marginLeft + marginRight
};
