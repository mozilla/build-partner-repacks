var appContext = Components.classes["@mail.ru/toolbar/application;1"].getService().wrappedJSObject;

function MRMailbox(toolbarObject) {
    this.debugZone = "MRMailbox";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://mailsputnik.mail.ru/cgi-bin/checknew?sputnik=2";
    this.key = "mail";
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.mail.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};
MRMailbox.prototype = new gMRRefService.MRInformerService;

MRMailbox.prototype.initInfos = function() {
    if (!this.infos.length) {
        this.infos["mail"] = new gMRRefService.MRInformerParser();
        this.infos["money"] = new gMRRefService.MRInformerParser();
    }
}

MRMailbox.prototype.apply = function() {
    var p = document.getElementById('mailru_mail_btn');
    if (p != null) {
        this.applyRefetch(this.infos["mail"].refetch);
        p.brickInfo = this.infos["mail"];
    }
    p = document.getElementById('mailru_money_btn');
    if (p != null) {
        this.applyRefetch(this.infos["money"].refetch);
        p.brickInfo = this.infos["money"];
    }

}

function MRMy(toolbarObject) {
    this.debugZone = "MRMy";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://xml.my.mail.ru/sputnik";
    this.key = "mir";
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.my.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};

MRMy.prototype = new gMRRefService.MRInformerService;

MRMy.prototype.apply = function() {
    var p = document.getElementById('mailru_my_btn');
    if (p != null) {
        this.applyRefetch(this.infos[this.key].refetch);
        p.brickInfo = this.infos[this.key];
    }
}

function MROk(toolbarObject) {
    this.debugZone = "MROk";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://www.odnoklassniki.ru/browserToolbarGetData?v=2";
    this.key = "odkl";
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.odkl.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};

MROk.prototype = new gMRRefService.MRInformerService;

MROk.prototype.apply = function() {
    var p = document.getElementById('mailru_odkl_btn');
    if (p != null) {
        this.applyRefetch(this.infos[this.key].refetch);
        p.brickInfo = this.infos[this.key];
    }
}

function MRMapsTraffic(toolbarObject) {
    this.debugZone = "MRMapsTraffic";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://maps.mail.ru/informer/informer.aspx?geocode=";
    this.key = "probki";
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.maps.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};
MRMapsTraffic.prototype = new gMRRefService.MRInformerService;

MRMapsTraffic.prototype.begin = function() {
    if (!this.isReady()) {
        return;
    };

    var sCityID = this.getCity();
    if (sCityID == '0') {
        return;
    };
    G_Debug(this, "sCityID:" + sCityID);
    this.send(this.url + sCityID);
};

MRMapsTraffic.prototype.apply = function() {
    var p = document.getElementById('mailru_maps_btn');
    if (p != null) {
        this.applyRefetch(this.infos[this.key].refetch);
        p.brickInfo = this.infos[this.key];
    }
}

MRMapsTraffic.prototype.getCity = function() {
    var sCityID = '0';
    var sUserCityID = read_reg_string('mail.ru.toolbar.city.user_id', '0');
    if (sUserCityID != '0') {
        return sUserCityID;
    }
    else {
        var sServerUserID = read_reg_string('mail.ru.toolbar.ciry.server_id', '0');
        if (sServerUserID == '0') {
            gMRRefToolbar.mMRObject.ajaxCity.begin();
        }
        return sServerUserID;
    }
};

function MRWeather(toolbarObject) {
    this.debugZone = "MRWeather";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://weather.sputnik.mail.ru/inf/sputnik_v2.xml?cityid=";
    this.key = "weather";
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.weather.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};
MRWeather.prototype = new MRMapsTraffic;

MRWeather.prototype.begin = function() {
    if (!this.isReady()) {
        return;
    };

    var sCityID = this.getCity();
    if (sCityID == '0') {
        return;
    }
    var format = read_reg_string('mail.ru.toolbar.weather.temperature.format', 'c');

    this.send(this.url + sCityID + '&grades=' + format);
};

MRWeather.prototype.apply = function() {
    var p = document.getElementById('mailru_weather_btn');
    if (p != null) {
        this.applyRefetch(this.infos[this.key].refetch);
        p.brickInfo = this.infos[this.key];

    }
}


function MRCityDetect(toolbarObject) {
    this.debugZone = "MRCityDetect";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://r.mail.ru/cgi-bin/banners/get/18";
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.maps.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
    
};
MRCityDetect.prototype = new gMRRefService.MRAjaxService;

MRCityDetect.prototype.end = function() {
    try {
        if (this.ajax.readyState != 4) {
            return;
        }
        if (this.ajax.status == 200) {
            var sCityID = 1460;
            if (this.ajax.responseText != null) {
                sCityID = parseInt(this.ajax.responseText);
            }
            if (isNaN(sCityID)) {
                sCityID = 1460;
            }
            write_reg_string('mail.ru.toolbar.city.server_id', sCityID.toString());
            write_reg_string('mail.ru.toolbar.city.user_id', sCityID.toString());
        }
        gMRRefToolbar.mMRObject.ajaxMapsTraffic.begin();
        gMRRefToolbar.mMRObject.ajaxWeather.begin();
    }
    catch (e) {
        this.error();
    }

}

function MRPing(toolbarObject) {
    this.debugZone = "MRPing";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "";
    this.showError = false;
    this.updateTimer = null;
    this.prefs_ = new appContext.G_Preferences("mail.ru.toolbar.", false, true);
    this.url = "http://mrb.mail.ru/update/version.txt";
    this.refetchTimeout = 3600000;
    this.toolbarObject = toolbarObject;
    this.bPartnerPing = false;
    
};
MRPing.prototype = new gMRRefService.MRAjaxService;

MRPing.prototype.start = function() {
    this.setUpdateTimer(5000);
}

MRPing.prototype.begin = function() {
    if (!this.isReady()) {
        return;
    };
    
    this.bPartnerPing = false;
    var sNew = 0;
    if (read_reg_bool('mail.ru.toolbar.first_ping')) {
        sNew = '1';
    }
    
    var referer = read_reg_string('mail.ru.toolbar.referer', '');
    
//    if(referer.length == 0){
//        return;
//    }
    
    var url = gMRRefToolbar.mMRObject.append_sputnik_url(this.url)
    + '&toolbarid=' + gMRRefToolbar.mMRObject.toolbar_id
    + '&version=' + gMRRefToolbar.mMRObject.toolbar_version;
    if (referer.length) {
        url += '&ref=' + referer;
    }
    if (document.getElementById("yasearch-bar")) {
        url += "&ybp=1";
    }
    if (this.prefs_.getBoolPrefOrDefault("shortmode", false)) {
        url += "&lite=1";
    }
    
    if (sNew == '1'){
        var new_sig = read_reg_string('mail.ru.toolbar.new_sig', '');
        if(new_sig != ''){
            url += "&sig="+new_sig;
        }
    }
    
    url += '&new=' + sNew;
    
    G_Debug(this, "ping:" + url);
    this.send(url);
};

MRPing.prototype.end = function() {
    try {
        if ( this.ajax.readyState == 4 
            && ( this.ajax.status == 200 
                || this.isAllowedServerError(this.ajax.status) ) ) {
            if (this.bPartnerPing) {
                this.onPartnerResult();
            } else {
                this.onMailResult();
            }
        }
    }
    catch (e) {
        this.error();
    }
}

MRPing.prototype.onMailResult = function() {
    write_reg_bool("mail.ru.toolbar.first_ping", false);
    this.beginPartner();
}

MRPing.prototype.onPartnerResult = function() {
    write_reg_string("mail.ru.toolbar.partner_new_url", "");
}

MRPing.prototype.beginPartner = function() {
    if (!this.isReady()) {
        return;
    };

    var url = read_reg_string('mail.ru.toolbar.partner_new_url', "");
    if (!url.length) {
        return;
    }
    this.bPartnerPing = true;
    G_Debug(this, "ping partner:" + url);
    this.send(url);
};

MRPing.prototype.partnerOnline = function() {
    this.bPartnerPing = true;
    if (!this.isReady()) {
        return;
    };

    var url = read_reg_string('mail.ru.toolbar.partner_online_url', "");
    if (!url.length) {
        this.partnerOnline();
        return;
    }
    G_Debug(this, "ping partner online:" + url);
    this.send(url);
};

function MRButtons(toolbarObject) {
    this.debugZone = "MRButtons";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://mrb.mail.ru/update/2/version.txt";
    this.refetchTimeout = 3*60*60*1000;
    this.toolbarObject = toolbarObject;
};
MRButtons.prototype = new gMRRefService.MRAjaxService;

MRButtons.prototype.start = function() {
    var timeout = 10000;
    var sended = read_reg_string("mail.ru.toolbar.counter.senddate", "")
    var dateSended = new Date();
    if (sended.length) {
        dateSended.setTime(Date.parse(sended));
        timeout = this.refetchTimeout - ((new Date()).getTime() - dateSended.getTime());
    }

    if (timeout < 0) {
        timeout = 10000;
    }
    if (timeout > this.refetchTimeout) {
        timeout = this.refetchTimeout;
    }

    this.setUpdateTimer(timeout);
}

MRButtons.prototype.begin = function() {
    if (!this.isReady()) {
        return;
    };

    var url = this.url + "?id=" + gMRRefToolbar.mMRObject.toolbar_id;

    var cntZoom = read_reg_int("mail.ru.toolbar.counter.zoom", 0);
    var cntHighlight = read_reg_int("mail.ru.toolbar.counter.highlight", 0);
    var cntPageSearch = read_reg_int("mail.ru.toolbar.counter.pagesearch", 0);
    var cntMusic = read_reg_int("mail.ru.toolbar.counter.music", 0);
    if (cntZoom) {
        url += "&zm=" + cntZoom;
    }
    if (cntHighlight) {
        url += "&hl=" + cntHighlight;
    }
    if (cntPageSearch) {
        url += "&ps=" + cntPageSearch;
    }
    if (cntMusic) {
        url += "&msc=" + cntMusic;
    }


    write_reg_string("mail.ru.toolbar.counter.send", (new Date()).toGMTString());
    G_Debug(this, "send:" + url);
    this.send(url);
};

MRButtons.prototype.end = function() {
    try {
        if (
            this.ajax.readyState == 4
            && (this.ajax.status == 200
                || this.isAllowedServerError(this.ajax.status)
                )
            ) {
            write_reg_int("mail.ru.toolbar.counter.zoom", 0);
            write_reg_int("mail.ru.toolbar.counter.highlight", 0);
            write_reg_int("mail.ru.toolbar.counter.pagesearch", 0);
            write_reg_int("mail.ru.toolbar.counter.music", 0);
            write_reg_string("mail.ru.toolbar.counter.senddate", (new Date()).toGMTString());
        }
    }
    catch (e) {
        this.error();
    }
}

function MRCurrency(toolbarObject) {
    this.debugZone = "MRCurrency";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.showError = false;
    this.updateTimer = null;
    this.url = "http://inf.mail.ru/sputnik/rate/sputnik.xml?v=";
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.maps.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};
MRCurrency.prototype = new gMRRefService.MRInformerService;

MRCurrency.prototype.initInfos = function() {
    if (this.infos.length) {
        return;
    }
    var sCurrency = read_reg_string('mail.ru.toolbar.currency.display', '');
    sCurrency = sCurrency.replace(/ /gi, '');
    if (!sCurrency.length) {
        return;
    }
    var currencies = sCurrency.split(",");
    if (!currencies.length) {
        return;
    }
    G_Debug(this, "currencies11:" + sCurrency + ":");
    for (var i in currencies) {
        this.infos["currency-" + currencies[i]] = new gMRRefService.MRInformerParser();
    }
}

MRCurrency.prototype.begin = function() {
    if (!this.isReady()) {
        return;
    };

    var sCurrency = read_reg_string('mail.ru.toolbar.currency.display', '');
    sCurrency = sCurrency.replace(/ /gi, '');
    if (!sCurrency.length) {
        return;
    }
    var sURL = this.url + sCurrency;
    if (read_reg_bool('mail.ru.toolbar.currency.accurancy', true)) {
        sURL += '&short=1';
    }
    
    this.send(sURL);
};

MRCurrency.prototype.apply = function() {
    var tbCurrencyBox=document.getElementById('mailru_currency_box');
    var buttons=tbCurrencyBox.getElementsByTagName('toolbaritem');
    for(var i=0; i<buttons.length; i++)
    {
        if(buttons[i].hasAttribute('currency'))
        {
            var currency=buttons[i].getAttribute('currency');
            var info = this.infos["currency-" + currency];
            if(info)
            {
                this.applyRefetch(info.refetch);
                buttons[i].brickInfo = info;
            }
        }
    }
}

MRCurrency.prototype.reset = function() {
    this.infos={};
    this.initInfos();
}

function MR2GisInformer(toolbarObject) {
    this.debugZone = "MR2GisInformer";
    this.ajax = new XMLHttpRequest();
    this.method = "GET";
    this.mimeType = "text/xml, charset = windows-1251";
    this.url = "";
    this.showError = false;
    this.updateTimer = null;
    this.urlBase = " http://mailsputnik.mail.ru/2gis";
    this.key = "2gis";
    this.provider = 0;
    this.infos = {};
    this.refetchTimeout = read_reg_string('mail.ru.toolbar.2gis.refetch', '300') * 1000;
    this.toolbarObject = toolbarObject;
};
MR2GisInformer.prototype = new gMRRefService.MRInformerService;

MR2GisInformer.prototype.apply = function() {
    var p = document.getElementById('mailru_2gis_btn');
    if (p != null) {
        this.applyRefetch(this.infos[this.key].refetch);
        p.brickInfo = this.infos[this.key];
    }
}
