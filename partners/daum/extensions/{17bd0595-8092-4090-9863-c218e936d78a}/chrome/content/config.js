var prefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.daumtoolbar.");

function initConfig()
{
	var chkGoDaum = document.getElementById("chkGoDaum");
	var chkSearchBar = document.getElementById("chkSearchBar");
	var chkMail = document.getElementById("chkMail");
	var chkCafe = document.getElementById("chkCafe");
	var chkBlog = document.getElementById("chkBlog");
	var chkDic = document.getElementById("chkDic");
	var chkNews = document.getElementById("chkNews");
	var chkCalendar = document.getElementById("chkCalendar");
	var chkUCC = document.getElementById("chkUCC");
	var chkSearchRank = document.getElementById("chkSearchRank");
	var chkRanking = document.getElementById("chkRanking");

	chkGoDaum.checked = prefBranch.getBoolPref("isViewGoDaum");
	chkSearchBar.checked = prefBranch.getBoolPref("isViewSearchbar");
	chkMail.checked = prefBranch.getBoolPref("isViewMail");
	chkCafe.checked = prefBranch.getBoolPref("isViewCafe");
	chkBlog.checked = prefBranch.getBoolPref("isViewBlog");
	chkDic.checked = prefBranch.getBoolPref("isViewDic");
	chkNews.checked = prefBranch.getBoolPref("isViewNews");
	chkCalendar.checked = prefBranch.getBoolPref("isViewCalendar");
	chkUCC.checked = prefBranch.getBoolPref("isViewUCC");
	chkSearchRank.checked = prefBranch.getBoolPref("isViewSearchRank");
	chkRanking.checked = prefBranch.getBoolPref("isViewRanking");
}

function saveConfig()
{
	var chkGoDaum = document.getElementById("chkGoDaum");
	var chkSearchBar = document.getElementById("chkSearchBar");
	var chkMail = document.getElementById("chkMail");
	var chkCafe = document.getElementById("chkCafe");
	var chkBlog = document.getElementById("chkBlog");
	var chkDic = document.getElementById("chkDic");
	var chkNews = document.getElementById("chkNews");
	var chkCalendar = document.getElementById("chkCalendar");
	var chkUCC = document.getElementById("chkUCC");
	var chkSearchRank = document.getElementById("chkSearchRank");
	var chkRanking = document.getElementById("chkRanking");

	prefBranch.setBoolPref("isViewGoDaum", chkGoDaum.checked);
	prefBranch.setBoolPref("isViewSearchbar", chkSearchBar.checked);
	prefBranch.setBoolPref("isViewMail", chkMail.checked);
	prefBranch.setBoolPref("isViewCafe", chkCafe.checked);
	prefBranch.setBoolPref("isViewBlog", chkBlog.checked);
	prefBranch.setBoolPref("isViewDic", chkDic.checked);
	prefBranch.setBoolPref("isViewNews", chkNews.checked);
	prefBranch.setBoolPref("isViewCalendar", chkCalendar.checked);
	prefBranch.setBoolPref("isViewUCC", chkUCC.checked);
	prefBranch.setBoolPref("isViewSearchRank", chkSearchRank.checked);
	prefBranch.setBoolPref("isViewRanking", chkRanking.checked);

	hiddenProc();
}
setTimeout("initConfig()", 100);
