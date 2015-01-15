
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.com_StretchClock_Fox.");
	this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		

	function showHideSchedule()	{
		show = !(document.getElementById('mySchedule').getAttribute("checked"));
		document.getElementById('schedule_tabbox').hidden = show;
		for (day = 0; day<7;day++)	{
			showHideDay(day);		
		}
	}

	function showHideDay(day)	{
		
		show = !(document.getElementById('check_stretch_' + day).getAttribute("checked"));
		time = document.getElementById('time_' + day);	
		time.setAttribute("hidden", show);
		prefValue = this.prefs.getCharPref("on_time_" + day);
		try	{
			document.getElementById('on_time_' + day).value = prefValue;	
		}
		catch (e)	{}
		prefValue = this.prefs.getCharPref("off_time_" + day);
		try	{
		document.getElementById('off_time_' + day).value = prefValue;	
		}
		catch (e)	{}
		window.sizeToContent();
	}
	
	function savePrefs()	{
		// if hours + minutes < 15 minutes then display warning message
		var mins = 0;
		try 	{
			mins = 60 * parseInt(document.getElementById('hours-between-stretches').value);
			mins += parseInt(document.getElementById('mins-between-stretches').value);
		}
		catch (e)	{
			mins = 0
		}
		if (mins < 15)	{
			alert('on the \'settings\' screen:\r\nchange \'time between stretches\' to 15 minutes or more');
			return false
		}

		return true;
	}
	function saveShowAddonbarPref()	{
		var prefValue = document.getElementById('check_show_addonbar').getAttribute("checked");
		this.prefs.setBoolPref("show_addonbar", prefValue);		
	}