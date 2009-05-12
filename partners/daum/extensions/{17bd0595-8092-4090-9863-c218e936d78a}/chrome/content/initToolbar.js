var prefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.daumtoolbar.");

function hiddenProc()
{
	try
	{
		win = (opener) ? opener : window;

		win.document.getElementById("tidDaum").hidden = !prefBranch.getBoolPref("isViewGoDaum");
		win.document.getElementById("DaumSearchInput").hidden = !prefBranch.getBoolPref("isViewSearchBar");
		win.document.getElementById("DaumSearchSubmit").hidden = !prefBranch.getBoolPref("isViewSearchBar");
		win.document.getElementById("tidMail").hidden = !prefBranch.getBoolPref("isViewMail");
		win.document.getElementById("tidCafe").hidden = !prefBranch.getBoolPref("isViewCafe");
		win.document.getElementById("tidBlog").hidden = !prefBranch.getBoolPref("isViewBlog");
		win.document.getElementById("tidDic").hidden = !prefBranch.getBoolPref("isViewDic");
		win.document.getElementById("tidNews").hidden = !prefBranch.getBoolPref("isViewNews");
		win.document.getElementById("tidCalendar").hidden = !prefBranch.getBoolPref("isViewCalendar");
//		win.document.getElementById("tidUCC").hidden = !prefBranch.getBoolPref("isViewUCC");
		win.document.getElementById("tidSearchRank").hidden = !prefBranch.getBoolPref("isViewSearchRank");
		win.document.getElementById("tidRanking").hidden = !prefBranch.getBoolPref("isViewRanking");
	}
	catch (e)
	{
	}

}

// 툴바 초기화
function initToolbar()
{
	// 처음 실행했으면,
	if(prefBranch.getBoolPref("isFirstTime") == true)
	{
		try
		{
			// UUID를 생성하여 저장해 둔다.
			var req = new XMLHttpRequest();
			req.open("GET", "http://ted.mielczarek.org/code/uuid.pl", false);
			req.send(null);
			if(req.status == 200)
			{
				var uuid = "{" + req.responseText.replace(/\n/g, '') + "}";
				prefBranch.setCharPref("uuid", uuid );
			}

			req.open("GET", "http://dna.daum.net/firefox/welcome/?nil_profile=toolbar&nil_ch=firefox&nil_install=1", false);
			req.send(null);

			prefBranch.setBoolPref("isFirstTime", false);

			if(req.status == 200)
			{
				
			}
		}
		catch(ex)
		{
			dump("Error: " + ex + "\n");
		}
	}

	// 라이브 수치(1일 1회)
	var today = (new Date()).toDateString();

	if(prefBranch.getCharPref("lastDate") != today)
	{
		try
		{
			req.open("GET", "http://toolbar.daum.net/updatecheck/?nil_profile=toolbar&nil_ch=firefox&nil_install=2&version=firefox&uuid={" + prefBranch.getCharPref("uuid") + "}", false );
			req.send(null);
			prefBranch.setCharPref("lastDate", today);
		}
		catch (ex)
		{
			dump("Error: " + ex + "\n");
		}

	}
	setTimeout("hiddenProc()", 1000);
}

initToolbar();