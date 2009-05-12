var mainwin = document.getElementById("main-window");
var gBrowser = document.getElementById("content");
var Stype = "tot";
var prefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.daumtoolbar.");
var isLoaded = false;
var cur_menu = "";

// 현재 사이트의 랭킹 레벨 얻어 오기
function getSiteRank()
{
	var SiteRank = {
		siteseq: 0,
		title: "",
		url: "",
		rank: 0,
		level: 0
	}


	var browser = gBrowser.mCurrentBrowser;
	var host = "";
	try
	{
		if (browser.currentURI)
		{
			host = browser.currentURI.host;
		}
		else
		{
			return 0;
		}
	}
	catch (e)
	{
		return 0;
	}


	var request = new XMLHttpRequest();
	request.open("GET", "http://toolbar.directory.search.daum.net/wss4toolbar/site_rank.daum?url=" + "http://" + host + "/", false);
	request.send(null);


	// SiteRank(XML)를 JSON형태로 변환
	var jsonobj = eval("(" + xml2json(request.responseXML, false, false) + ")");

	SiteRank.siteseq = jsonobj.siteRank.siteseq;
	SiteRank.title = jsonobj.siteRank.title;
	SiteRank.url = jsonobj.siteRank.url;
	SiteRank.rank = jsonobj.siteRank.rank;
	// 랭킹에 따라 사이트 Level을 정한다.
	SiteRank.level = 0;
	if (SiteRank.rank >= 1 && SiteRank.rank <= 1000)			SiteRank.level = 6;
	else if (SiteRank.rank > 1001 && SiteRank.rank <= 5000)		SiteRank.level = 5;
	else if (SiteRank.rank > 5001 && SiteRank.rank <= 10000)	SiteRank.level = 4;
	else if (SiteRank.rank > 10001 && SiteRank.rank <= 50000)	SiteRank.level = 3;
	else if (SiteRank.rank > 50001 && SiteRank.rank <= 100000)	SiteRank.level = 2;
	else if (SiteRank.rank > 100001 && SiteRank.rank <= 400000)	SiteRank.level = 1;
	return SiteRank;
}

// 랭킹 아이콘 갱신
function refreshRankingLevel()
{
	var SiteRank = getSiteRank();
	var tidRanking = document.getElementById("tidRanking");
	tidRanking.image = (SiteRank.level > 0) ? "chrome://daumfox/skin/tb_ranking_" + SiteRank.level + ".gif" : "chrome://daumfox/skin/tb_ranking.gif";
	
}

// 주어진 url로 가기
function goURL(url)
{
	var browser = gBrowser.mCurrentBrowser;
	browser.loadURI(url);
}

function getDummy()
{
	var today = new Date();
	var dummy = new Number(new Date());

	return dummy;
}

// 팝업 창내의 문서에서 target이 _blank인 링크들을 전부 새로운 탭으로 바꾼다.
// popup창
var pops = new Array();
var pop = null;
var intervalId = 0;
function closePopup()
{
	isLoaded = false;
	clearInterval(intervalId);
	if(pops.length > 0)
	{
		for(var i = 0; i < pops.length; i++)
		{
			var pop = pops.pop();
			pop.close();
		}
	}
}

function print_r(obj)
{
	var msg = "";

	for(var i in obj)
	{
		msg += i + ":" + obj[i] + "\n";
	}

	alert(msg);
}


// 창 사이즈 조정.
function resizeWindow()
{
	if(crr_menu == "tidRanking")
	{
		var maxX = pop.scrollMaxX + pop.outerWidth + 2;
		var maxY = pop.scrollMaxY + pop.outerHeight + 2;
		// 문서의 크기만큼 지정(하지만 생각보다 더 크게 나온다.)
		pop.resizeTo(maxX, maxY);
		
		// 여백 없애기(스크롤바가 생기기 직전까지만 줄인다.)
		while(pop.scrollMaxX == 0)
		{
			pop.resizeBy(-1, 0);
		}
		pop.resizeBy(1, 0);

		while(pop.scrollMaxY == 0)
		{
			pop.resizeBy(0, -1);
		}
		pop.resizeBy(0, 2);
		return;
	}

	var b = pop.document.getElementsByTagName("body")[0]
	b.style.overflow = "auto";

	var maxX = b.scrollWidth + 2;
	var maxY = b.scrollHeight + 2;

	if(crr_menu == "tidNews")	maxX = 245;

	pop.resizeTo(maxX, maxY);
	b.style.overflow = "hidden";
}

function viewPopup(anchor_name, pop_name, url, event)
{
	var anchor = document.getElementById(anchor_name);
	var popupFrame = document.getElementById(pop_name + "_frame");
	var w = parseInt(popupFrame.width) + 1;
	var h = parseInt(popupFrame.height) + 1;

	crr_menu = anchor_name;
	
	var winfeature = "dependent=yes,titlebar=no,scrollbars,chrome,width=" + w + ",height=" + h + ",left=" + (anchor.boxObject.screenX) + ",top=" + (anchor.boxObject.screenY + anchor.boxObject.height);
	closePopup();

	pop = window.open(url, pop_name, winfeature);
	pops.push(pop);
	pop.focus();
	createPopEvents();
	intervalId = setInterval("createPopEvents()", 800);
}


function createPopEvents()
{
	if(isLoaded == true)	return;
	if(!pop || !pop.document) return;

	// 창 크기 조정(스크롤바가 생기지 않도록)
	pop.addEventListener("load", function() { resizeWindow(); }, false);
	// div 형태의 툴팁
	// FF에서 Chrome형태로 window.open을 하면 html에서 툴팁으로 표현하는 title 속성이 안 먹힌다.
	pop.tooltip = pop.document.createElement("div");
	pop.addEventListener("blur", function(event) { closePopup(); }, false);
	pop.addEventListener("mouseover", function(event) {
					var orgTarget = event.originalTarget;

					orgTarget.addEventListener("mouseover", function(event) {

							if(trim(orgTarget.title) && pop.tooltip.setVisible)
							{
								pop.tooltip.style.width = "160px";
								pop.tooltip.style.border = "1px solid black";
								pop.tooltip.style.backgroundColor = "#ffffe1";
								pop.tooltip.style.position = "absolute";
								pop.tooltip.style.left = "10px";
								pop.tooltip.style.padding = " 3px";
								pop.tooltip.style.top = event.clientY + 18 + "px";
								pop.tooltip.innerHTML = "<span style='font-size:9pt; color:black'>" + orgTarget.title + "</span>";
								pop.tooltip.setVisible(true);

								var body = pop.document.body;
								body.appendChild(pop.tooltip);
							}
						}, true);
					orgTarget.addEventListener("mouseout", function(event) {

							if(pop.tooltip && pop.tooltip.setVisible)
							{
								pop.tooltip.setVisible(false);
							}
						}, true);

				}, true);

	pop.addEventListener("click", function(event) {
						var array_a = this.document.links;
						if(array_a.length > 0)
						{
							for(var i = 0; i < array_a.length; i++)
							{
								if(array_a[i].href && "_blank" == array_a[i].target )
								{
									array_a[i].onclick = function(){										
										var browser = pop.opener.gBrowser;
										browser.selectedTab = browser.addTab(this.href);
										closePopup();
									};
								}
							}
						}

						var orgTarget = event.originalTarget;

						//************************ 블로그
						if( "rssBtn" == orgTarget.className )
						{
							var browser = gBrowser.mCurrentBrowser;
							browser.loadURI("http://blog.daum.net/_blog/rss/ChannelInsertDirect.do?channelUrl=" + browser.currentURI.spec + "#ajax_history_home");
							closePopup();
							event.stopPropagation();
						}
						//************************ 블로그

						//************************ 캘린더

						// 상단에 날짜 클릭하는 경우
						if( "top_today" == orgTarget.id || "korDay" == orgTarget.id )
						{
							var today = new Date();
							var dummy = new Number(new Date());
							var browser = pop.opener.gBrowser;
							var today_string = today.getFullYear() + "" + (today.getMonth() + 1) + today.getDate();
							browser.selectedTab = browser.addTab("http://calendar.daum.net/?" + dummy + "#daily_view:" + today_string);
							closePopup();
							event.stopPropagation();
							return;
						}

						// [쓰기] 버튼을 누른 경우
						if( "left_todo_write" == orgTarget.id )
						{
							var browser = pop.opener.gBrowser;
							browser.selectedTab = browser.addTab("http://calendar.daum.net/?" + getDummy() + "#todo_view");
							closePopup();
							event.stopPropagation();
							return;
						}

						// [일정입력] 버튼을 누른 경우
						if( "appMiniCalendarButton" == orgTarget.className )
						{
							var browser = pop.opener.gBrowser;
							browser.selectedTab = browser.addTab("http://calendar.daum.net/?" + getDummy() + "#toolbar_monthly_view");
							closePopup();
							event.stopPropagation();
							return;
						}

						// 각 날짜들을 누른 경우
						if(orgTarget.id && orgTarget.id.indexOf("minical_") == 0)
						{
							var date_string = orgTarget.date.getFullYear() + "" + zeroPad((orgTarget.date.getMonth() + 1), 2) + "" + zeroPad(orgTarget.date.getDate(), 2);
							var browser = pop.opener.gBrowser;
							browser.selectedTab = browser.addTab("http://calendar.daum.net/?" + dummy + "#daily_view:" + date_string);
							closePopup();
							event.stopPropagation();
							return;
						}
						
						// 새로코침을 누른 경우
						if( "refresh" == orgTarget.className)
						{
							isLoaded = false;
							pop.location.href = pop.location.href;

							event.stopPropagation();
							
							return;
						}
						//************************ 캘린더

						//************************ 랭킹

						if("지표보기" == orgTarget.title)
						{
							var siteRank = getSiteRank();
							var browser = pop.opener.gBrowser;
							browser.selectedTab = browser.addTab("http://directory.search.daum.net/site_detail.daum?siteseq=" + siteRank.siteseq);
							closePopup();
							event.stopPropagation();
							return;
						}

						//************************ 랭킹


					}, true);

	isLoaded = true;
}

function viewWindowPopup(pop_name, url)
{
	var winfeature = "dependent=yes,resizable=yes,scrollbars=yes,status=no,titlebar=yes,width=420,height=500,chrome=yes,centerscreen";
	window.open(url, pop_name, winfeature);
}

// 로그인 체크가 필요한 경우 popup
function viewLogedinPopup(anchor_name, pop_name, url)
{
	// 로그인 체크
	if(isLogin() == true)
	{
		viewPopup(anchor_name, pop_name, url);
	}
	else
	{
		login();
	}
}

// 사전 보기
function viewDic(q)
{
	var winDic;
	var winfeature = "dependent=yes,chrome,resizable=yes,scrollbars=yes,status=no,titlebar=yes,width=420,height=550,centerscreen";

	if(!q)
	{
		winDic = window.open("http://engdic.daum.net/dicen/small_top.do?nil_profile=toolbar&nil_ch=daum&nil_btn=",
				"dicpopup",
                winfeature);
	}
	else
	{
		winDic = window.open("http://engdic.daum.net/dicen/small_search_word.do?q=" + escape(q),
				"dicpopup",
				winfeature);
	}

	winDic.focus();
}

// 쿠키 얻기
function getCookies()
{
	var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);

	var cookies = Array();
	var iter = cookieManager.enumerator;
	
	while (iter.hasMoreElements())
	{
		var cookie = iter.getNext();

		if ( cookie instanceof Components.interfaces.nsICookie)
		{
			cookies[cookie.host + "/" + cookie.name] = cookie;
		}		
	}

	return cookies;
}

// 로그인 쿠키 삭제
function deleteCookie(cookie)
{
	var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
	cookieManager.remove(cookie.host, cookie.name, cookie.path, false);
}

// 로그인/로그아웃 여부
function isLogin()
{
	var retVal = false;

	var cookies = getCookies();

	// 로그인 했는지 체크
	if(cookies[".daum.net/PROF"])
	{
		retVal = true;
	}
	else
	{
		retVal = false;
	}
	return retVal;
}


// 로그인 상태 갱신
function refreshLoginStatus()
{
	var tidLogin = document.getElementById("tidLogin");
	var tidMail = document.getElementById("tidMail");

	if(tidLogin != null)
	{
		if(isLogin() == true)
		{
			// 로그인 유지
			var request = new XMLHttpRequest();
			request.open("GET", "http://go.daum.net/bin/daumtrans.gif", false);
			request.send(null);

			tidLogin.image = "chrome://daumfox/skin/tb_logout.gif";
		}
		else
		{
			tidLogin.image = "chrome://daumfox/skin/tb_login.gif";
			tidMail.image = "chrome://daumfox/skin/tb_mail.gif";
		}
	}
}


// 로그인
function login()
{
	window.open("chrome://daumfox/content/login.html", "login", "dialog=yes,dependent=yes,chrome=yes,width=270,height=180,statusbar=no,centerscreen");
}

// 로그아웃
function logout()
{
	var browser = gBrowser.mCurrentBrowser;

	if(isLogin() == true)
	{
			// 현재 탭이 Daum 사이트면 logout.cgi에게 logout 맡김
			if( browser.currentURI.spec.substring(0, 7) == "http://" && browser.currentURI.host.lastIndexOf(".daum.net") > 0)
			{
				browser.loadURI("http://login.daum.net/Mail-bin/logout.cgi?url=" + encodeURIComponent("http://www.daum.net/?nil_profile=logout"));
			}
			// 현재 탭이 Daum 사이트가 아니면 cookie만 삭제
			else
			{
				var cookies= getCookies();
				deleteCookie(cookies[".daum.net/PROF"]);
			}
	}
}

function toggleLogin()
{
	if(isLogin() == true)
		logout();
	else
		login();
}

function viewToolbarInfo()
{
	var winfeature = "dialog=yes,dependent=yes,resizable=no,scrollbars=yes,status=no,titlebar=yes,width=360,height=220,chrome=yes,centerscreen,modal=yes";
	window.open("chrome://daumfox/content/aboutDialog.xul", "aboutDaumToolbar", winfeature);
}

function viewConfig()
{
	var winfeature = "dialog=yes,dependent=yes,resizable=no,scrollbars=yes,status=no,titlebar=yes,width=200,height=350,chrome=yes,centerscreen,modal=yes";
	window.open("chrome://daumfox/content/configDialog.xul", "configToolbar", winfeature);
}

function hideElement(element)
{
	var e = document.getElementById(element);
	e.hidden = true;
}

function changeStype(Stype_name, Stype_local)
{
	var tidSearchType = document.getElementById("tidSearchType");

	tidSearchType.label = Stype_name;
	Stype = Stype_local;
}

function daumSearch()
{
	var q = document.getElementById("DaumSearchInput").value;

	if(Stype == "tot" || Stype == "cafe" || Stype == "blog" )
	{
		goURL("http://search.daum.net/search?t__nil_searchbox=btn&w=" + Stype + "&q=" + encodeURIComponent(q));
	}
	else if(Stype == "knowledge" || Stype == "board" || Stype == "dir" || Stype == "news" || Stype == "musictab" || Stype == "img" || Stype == "vclip")
	{
		goURL("http://search.daum.net/search?nil_suggest=btn&nil_ch=&rtupcoll=&w=" + Stype + "&m=&lpp=&q=" + encodeURIComponent(q));
	}
	else if(Stype == "dic")
	{
		goURL("http://alldic.daum.net/dic/search_result_total.do?q=" + encodeURIComponent(q));
	}
	else if(Stype == "100")
	{
		goURL("http://enc.daum.net/dic100/search.do?q=" + encodeURIComponent(q));
	}
	else if(Stype == "endic")
	{
		goURL("http://engdic.daum.net/dicen/search_result_total.do??t__nil_searchbox=btn&q=" + q);
	}
	else if(Stype == "krdic")
	{
		goURL("http://krdic.daum.net/dickr/search.do?t__nil_searchbox=btn&chset=euckr&q=" + q);
	}
	else if(Stype == "cndic")
	{
		goURL("http://cndic.daum.net/index.html?search=yes&=cn&q=" + encodeURIComponent(q)) + "&x=0&y=0";
	}
	else if(Stype == "handic")
	{
		goURL("http://handic.daum.net/dicha/search_result_total.do?q=" + escape(q));
	}
	else if(Stype == "jpdic")
	{
		goURL("http://jpdic.daum.net/dicjp/search_result_total.do?q=" + escape(q));
	}
	else if(Stype == "book")
	{
		goURL("http://book.daum.net/search/mainSearch.do?query=" + encodeURIComponent(q));
	}
	else if(Stype == "shop")
	{
		goURL("http://shopping.daum.net/product/searchresult.daum?t__nil_searchbox=btn&q=" + escape(q));
	}
	else if(Stype == "yp")
	{
		goURL("http://local.daum.net/localsearch/search.daum?t__nil_searchbox=btn&q=" + escape(q));
	}
}

setInterval("refreshLoginStatus()", 1000);

// 브라우저 로드될 때
gBrowser.addEventListener("load", refreshRankingLevel , true);

// 탭 바뀔 때
gBrowser.addEventListener("select", refreshRankingLevel, true);