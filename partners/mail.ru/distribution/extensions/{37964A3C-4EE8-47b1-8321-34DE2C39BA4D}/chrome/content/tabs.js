var thumbnail_id;
var tabsStorage = new TabsStorage();

var modalWindow = {
    url : {},
    wrap : '',
    overlay : '',
    text_group : {
        openTabs : "Открытые вкладки",
        history : "Недавно посещенные сайты"
    },
    
    
    init : function () {
        this.wrap = document.getElementById('wrap');
        this.overlay = document.getElementById('overlay');
        this.getUrlTabs();
        this.gerUrlHistory(20);
        this.create();
        this.view();
    },
    
    view : function () {
        this.overlay.style.display = 'block';
        this.wrap.style.display = 'block'; 
    },
    selChange : function (e) {
        document.getElementById('urladd').value = e.href;
        return false;
    },
    create : function () {
        var div_el = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        div_el.setAttribute('class', 'form_add_link');
        
        var str_el = document.createElementNS('http://www.w3.org/1999/xhtml', 'strong');
        str_el.appendChild(document.createTextNode("Адрес сайта:"));
        div_el.appendChild(str_el);
        
        var inp_url = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
        inp_url.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        inp_url.setAttribute('type','text');
        inp_url.setAttribute('name','urladd');
        inp_url.setAttribute('id','urladd');
        inp_url.setAttribute('placeholder','http://');
        inp_url.setAttribute('value','');
        inp_url.setAttribute('style','width:317px;margin-bottom:10px;');
        inp_url.onkeyup = function (event){
            if(event.which == 13) {
                thumbnail.add();
            }
        }
        div_el.appendChild(inp_url);
        
        var url_box = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        url_box.setAttribute('class', 'select_url');
        //url_box.setAttribute('onChange', 'selChange(this)');
        for (var key in this.url) {
            
            if(this.url[key].length > 0) {
                var url_box_title = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                url_box_title.appendChild(document.createTextNode(this.text_group[key]));
                url_box_title.setAttribute('style', 'font-weight: bolder;margin-left: 5px;');
                url_box.appendChild(url_box_title);
                for (var i = 0; i< this.url[key].length; i++){
                    var div_item = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
                    div_item.setAttribute('class', 'url_box_element');
                    div_item.setAttribute('style', "background-image: url("+this.url[key][i].favicon+");");
                    div_item.setAttribute('href', this.url[key][i].url);
                    div_item.setAttribute('onclick', 'return modalWindow.selChange(this)');
                    div_item.appendChild(document.createTextNode(this.url[key][i].title));
                    //opt_el.setAttribute('value', url[key][i].url);
                    url_box.appendChild(div_item);
                }
            }
        }
        div_el.appendChild(url_box);
        
        var inp_cancel = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
        inp_cancel.setAttribute('type', 'button');
        inp_cancel.setAttribute('value', 'Отмена');
        inp_cancel.setAttribute('onclick', 'modalWindow.remove()');
        div_el.appendChild(inp_cancel);
        
        var inp_add = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
        inp_add.setAttribute('type', 'button');
        inp_add.setAttribute('value', 'Добавить');
        inp_add.setAttribute('style', 'float: right;');
        inp_add.setAttribute('onclick', 'thumbnail.add()');
        div_el.appendChild(inp_add);
        
        this.wrap.appendChild(div_el);
    },
    
    remove : function() {
        this.overlay.style.display = 'none';
        this.wrap.style.display = 'none'; 
        this.wrap.removeChild(this.wrap.firstChild)
    },
    
    getUrlTabs : function() {
        var reg_chrome = /chrome:|about:blank/;
        var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
        var g = 0;
        this.url.openTabs = [];
    
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser"); 
        var num = mainWindow.gBrowser.browsers.length;
        for (var i = 0; i < num; i++) {  
            var b = mainWindow.gBrowser.getBrowserAtIndex(i);  
            if(!reg_chrome.test(b.currentURI.spec)){
                
                var nodeURI = ioservice.newURI(b.currentURI.spec, null, null);
                var icon = faviconService.getFaviconImageForPage(nodeURI).spec;
                
                this.url.openTabs[g++] = {
                    'url' : b.currentURI.spec,
                    'title' : b.contentTitle,
                    'favicon' : icon
                };
            }
        } 
    },
    
    gerUrlHistory : function(maxResults) {
        var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
        var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
        var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        
        var query = historyService.getNewQuery();
        var options = historyService.getNewQueryOptions();
        options.maxResults = maxResults * 2;
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        var result = (historyService.executeQuery(query, options)).root;
        result.containerOpen = true;
        
        const nsIURI = Components.interfaces.nsIURI;
        
        this.url.history = [];
        var g = 0;
        for (var i = 0, count = result.childCount; i < count && i < maxResults; i++) {
            var node = result.getChild(i);
            
            var nodeURI = ioservice.newURI(node.uri, null, null);

            if (!/^https?|file$/.test(nodeURI.scheme))
                continue;

            if (/\.swf$/.test(nodeURI.spec))
                continue;

            var title = node.title == null ? node.uri : node.title;

            var icon = node.icon ?
            (node.icon instanceof nsIURI ? node.icon.spec : node.icon) :
            faviconService.getFaviconImageForPage(nodeURI).spec;

            var pathForTitle = nodeURI.path.split("?")[0].split("/").pop();
            if (title == nodeURI.path || title == pathForTitle) {
                if (!node.icon)
                    continue;

                title = nodeURI.spec;
            }

            this.url.history[g++] = {
                title: title,
                url: node.uri,
                favicon: icon
            };
        }
    }
}

var thumbnail = {
    key : '',
    position : '',
    url : '',
    col : 9,
    
    createBox : function (elem, id){
        if(document.getElementById(id+'_menu') != null){
            return;
        }
        //var div_item = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        var thumbnailPanel = document.getElementById('bookmarks');
    
        var thumbnailBox = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        thumbnailBox.setAttribute('class', 'thumbnail_box');
    
        var thumbnailTomMenu = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        thumbnailTomMenu.setAttribute('class', 'thumbnail_tom_menu');
        thumbnailTomMenu.setAttribute('id', id+'_menu');
        thumbnailTomMenu.onmouseover = function (){ 
            this.style.display = 'block';
        }
        thumbnailTomMenu.onmouseout = function (){
            this.style.display = 'none';
        }
    
        var menuEditLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        menuEditLink.setAttribute('href', '');
        menuEditLink.setAttribute('onclick', 'return thumbnail.editLink('+id+')');
        menuEditLink.appendChild(document.createTextNode('изменить'));
    
        var menuDeleteLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        menuDeleteLink.setAttribute('href', '');
        menuDeleteLink.setAttribute('onclick', 'return thumbnail.removeLink('+id+')');
        menuDeleteLink.appendChild(document.createTextNode('удалить'));
    
        var thumbnailLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        thumbnailLink.setAttribute('class', 'tab');
        thumbnailLink.setAttribute('href', elem['url']);
        thumbnailLink.setAttribute('id', id);
        thumbnailLink.setAttribute('onclick', 'return thumbnail.openLink(this)');
    
        var thumbnailAdd = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        thumbnailAdd.setAttribute('class', 'thumbnail_add');
        thumbnailAdd.setAttribute('id', id+'_add');
    
        var thumbnail = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        thumbnail.setAttribute('class', 'thumbnail');
        thumbnail.setAttribute('id', id+'_scrin');
        if(elem['scrin'] != ''){
            thumbnail.setAttribute('style', 'background-image: url('+elem['scrin']+');');
            thumbnail.onmouseover = function () {
                var id = this.id.split('_')[0];//+'_'+this.id.split('_')[1];
                document.getElementById(id+'_menu').style.display = 'block';
            }
            thumbnail.onmouseout = function () {
                var id = this.id.split('_')[0];//+'_'+this.id.split('_')[1];
                document.getElementById(id+'_menu').style.display = 'none';
            }
        }
    
        var title = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        title.setAttribute('class', 'title');

        var titleIco = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        titleIco.setAttribute('class', 'ico');
        titleIco.setAttribute('id', id+'_ico');
        if(elem['ico'] != '')
            titleIco.setAttribute('style', 'background-image: url('+elem['ico']+');');
    
        var titleText = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        titleText.setAttribute('class', 'text');
        titleText.setAttribute('id', id+'_title');
        titleText.appendChild(document.createTextNode(elem['title']));
    
        thumbnailTomMenu.appendChild(menuEditLink);
        thumbnailTomMenu.appendChild(menuDeleteLink);
    
        title.appendChild(titleIco);
        title.appendChild(titleText);
    
        thumbnailLink.appendChild(thumbnailAdd);
        thumbnailLink.appendChild(thumbnail);
        thumbnailLink.appendChild(title);
    
        thumbnailBox.appendChild(thumbnailTomMenu);
        thumbnailBox.appendChild(thumbnailLink);
    
        thumbnailPanel.appendChild(thumbnailBox);
    },
    
    updateThumbnail : function (elem, id) {
        document.getElementById(id).setAttribute('href', elem['url']);
        document.getElementById(id+'_title').innerHTML = "";
        document.getElementById(id+'_title').appendChild(document.createTextNode(elem['title']));
        
        if(elem['id'] == '-1') {
            document.getElementById(id+'_scrin').removeAttribute('style');
            document.getElementById(id+'_ico').removeAttribute('style');
            document.getElementById(id+'_add').setAttribute('style', 'background-image: url(chrome://mail.ru.toolbar/skin/tabs/add_ico.png);');
            document.getElementById(id+'_add').style.display = "block";
            document.getElementById(id+'_menu').style.display = 'none';
            document.getElementById(id+'_scrin').onmouseover = function () {};
            document.getElementById(id+'_scrin').onmouseout = function () {};
        } else {
            document.getElementById(id+'_scrin').setAttribute('style', 'background-image: url('+elem['scrin']+');');
            document.getElementById(id+'_ico').setAttribute('style', 'background-image: url('+elem['ico']+');');
            document.getElementById(id+'_add').style.display = "none";
            document.getElementById(id+'_scrin').onmouseover = function () {
                var id = this.id.split('_')[0];
                document.getElementById(id+'_menu').style.display = 'block';
            }
            document.getElementById(id+'_scrin').onmouseout = function () {
                var id = this.id.split('_')[0];
                document.getElementById(id+'_menu').style.display = 'none';
            }
        }
    },
    
    openLink : function(e){
        var reg = /chrome:|about:blank/;
        if(reg.test(e.href)) {
            if(!domainData.workFlag) {
                this.position = e.id;
                modalWindow.init();
            }
        } else {
            return true;
        }
        return false;
    },
    editLink : function(id){
        this.position = id;
        modalWindow.init();
        return false;
    },
    removeLink : function (id){
        this.position = id;
        this.remove();
        return false;
    },

    remove : function (){
        this.updateThumbnail(emptyThumbnail,this.position);
        tabsStorage.rowUnpublic(this.position); //тормазит :((((
    },
    add : function (){
        this.url = document.getElementById('urladd').value;
        document.getElementById(this.position+'_scrin').removeAttribute('style');
        document.getElementById(this.position+'_add').style.display = "block";
        document.getElementById(this.position+'_add').setAttribute('style', 'background-image: url(chrome://mail.ru.toolbar/skin/tabs/ajax-loader.gif);');
        var reg = /https?:/;
        if(this.url != '') {
            if(!reg.test(this.url)){
                this.url = 'http://'+this.url;
            }
            modalWindow.remove(); 
            var urlDbData = tabsStorage.searchUrl(this.url);
            if(urlDbData != "") {
                if(urlDbData['public'] == 1) {
                    domainData.url = urlDbData['url'];
                    domainData.title = urlDbData['title'];
                    domainData.scrin = urlDbData['scrin'];
                    domainData.favicon = urlDbData['ico'];
                    thumbnail.saveStorage(true);
                } else {
                    thumbnail.updateThumbnail({'id' : '', 'url' : urlDbData['url'], 'title' : urlDbData['title'], 'scrin' : urlDbData['scrin'], 'ico' : urlDbData['ico']},thumbnail.position);
                    tabsStorage.update({'position' : thumbnail.position, 'public' : '1'}, {'id' : urlDbData['id']});
                }
            } else {
                domainData.init(this.url,thumbnail.saveStorage);
            }
        }
    },
    
    saveStorage : function (errorFlag){
        domainData.workFlag = false;
        if(errorFlag) {
            thumbnail.updateThumbnail({'id' : '', 'url' : domainData.url, 'title' : domainData.title, 'scrin' : domainData.scrin, 'ico' : domainData.favicon},thumbnail.position);
            tabsStorage.insert(domainData.url, domainData.title, domainData.scrin, domainData.favicon, 1, thumbnail.position);
        } else {
            thumbnail.updateThumbnail(emptyThumbnail,thumbnail.position);
            thumbnail.errorMess('Неверно указан адрес сайта.');
        }
    },
    
    init : function(){
        try {
            var storage = globalStorage['MailTab'];
            var url, title, scrin, ico;
            var addTabs = 0;
            if(storage.length > 0) {
                for(var i = 0; i < 9 + addTabs; i++){
                    if(/^http:\/\/soft.yandex\.ru\//.test(storage['thumbnail_'+i+'url']) 
                        || /^http:\/\/.*.yandex\.ru\/.*clid/.test(storage['thumbnail_'+i+'url'])){
                        this.deleteStorage(i);
                        addTabs++;
                    }
                }
                if(storage.length > 0) {
                    tabsStorage.update({'public' : '0'}, null);
                }
                for(var i = 0; i < 9 + addTabs; i++){
                    if(storage['thumbnail_'+i+'url'] != undefined && storage['thumbnail_'+i+'url'] != "") {
                        var urlDbData = tabsStorage.searchUrl(storage['thumbnail_'+i+'url']);
                        if(urlDbData != "") {
                            if(urlDbData['public'] == 1) {
                                url = urlDbData['url'];
                                title = urlDbData['title'];
                                scrin = urlDbData['scrin'];
                                ico = urlDbData['ico'];
                            } else {
                                tabsStorage.update({'position' : i-addTabs, 'public' : '1'}, {'id' : urlDbData['id']});
                                this.deleteStorage(i);
                                continue;
                            }
                        } else {
                                url = storage['thumbnail_'+i+'url'];
                                title = storage['thumbnail_'+i+'title'];
                                scrin = storage['thumbnail_'+i+'scrin'];
                                ico = storage['thumbnail_'+i+'ico'];
                        }
                        tabsStorage.insert(url, 
                                           title, 
                                           scrin, 
                                           ico, 
                                           1, 
                                           i-addTabs
                                       );
                    }
                    this.deleteStorage(i);
                }
            }
        } catch(e) {    
        } finally {
            this.viewThumbnail();
        }
    },
    
    deleteStorage : function(i) {
        try {
            var storage = globalStorage['MailTab'];
            delete storage['thumbnail_'+i+'url'];
            delete storage['thumbnail_'+i+'title'];
            delete storage['thumbnail_'+i+'scrin'];
            delete storage['thumbnail_'+i+'ico'];
        } catch(e) { }
    },
    
    viewThumbnail : function(){
        var tabs = tabsStorage.getTabs();
        for (var i = 0; i < this.col; i++) {
            if(tabs[i] != undefined ) {
                var time = new Date().getTime();
                if(tabs[i]['date_upd'] < new Date().getTime()) {//-1000*60*60*24*7
                   //
                   //domainData.getNewData(tabs[i]['id'],tabs[i]['url']);
                   //TODO: запрос новых данных о домене
                }
                this.createBox(tabs[i],i);
            } else {
                this.createBox(emptyThumbnail,i);
            }
        }
    },
    
    errorMess : function (mess) {
        elemMess = document.getElementById('mess');
        elemMess.innerHTML = mess;
        elemMess.style.display = 'block';
        elemMess.style.opacity = 1;
        this.errorMessHide();
    },
    
    errorMessHide : function () {
        if(document.getElementById('mess').style.opacity > 0.01){
            document.getElementById('mess').style.opacity = document.getElementById('mess').style.opacity - 0.002
            setTimeout(thumbnail.errorMessHide, 1);
        }
    }
}

var emptyThumbnail = {
    'id' : '-1', 
    'url' : '', 
    'title' : 'Добавить сайт', 
    'scrin' : '', 
    'ico' : ''
}

var domainData = {
    url : '',
    iframe : '',
    hiddenWindow : '',
    fun : '',
    title : '',
    favicon : '',
    scrin : '',
    workFlag : false,
    
    init : function (url,fun) {
        this.workFlag = true;
        this.url = url;
        this.fun = fun;
        this.createFrame();
        if(this.domainInfo()) {
            this.createScrin();
        } else {
            this.fun(false);
        }
    },
    getNewData : function (id,url) {
        this.url = url;
        this.fun = thumbnail.saveStorage;
        this.createFrame();
        if(this.domainInfo()) {
            this.createScrin();
        } else {
            this.fun(false);
        }
    },
    createFrame : function () {
        this.hiddenWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
                            .getService(Components.interfaces.nsIAppShellService)
                            .hiddenDOMWindow;
        this.hiddenWindow.innerWidth = 1024;
        this.hiddenWindow.innerHeight = 768;
//        var brow = this.hiddenWindow.document.createElement('browser');// createElementNS('http://www.w3.org/1999/xhtml', 'browser');
//        brow.setAttribute('type', 'content');
//        brow.setAttribute('src', this.url);
//        brow.setAttribute('flex', '1');
        //this.hiddenWindow.document.appendChild(brow);
    },
    
    domainInfo : function () {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.url, false);//true);
        this.favicon = "";
        try {
            xhr.send(null);
        } catch (e) {
            //NS_ERROR_FAILURE
            return false;
        }
        //xhr.onreadystatechange = function() {
        //if (xhr.readyState == 4) {
        if(xhr.status == 200) {
            var data = xhr.responseText;
//            try {
//                this.title = replaseCharCode(data.match(/<title>([^<]*)/i)[1]);
//            } catch(e) {
//                this.title = this.url;
//            }
            
            var ioservice = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService);
            var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
                                    .getService(Components.interfaces.nsIFaviconService);
            var nodeURI = ioservice.newURI(this.url, null, null);
            var icon = faviconService.getFaviconImageForPage(nodeURI).spec;
            if(/chrome:/.test(icon)) {
                try {
                    var favHtml = data.match(/\<link([^>]*[rel\=\"(shortcut.icon)]\"[^>]*)>/i)[1];
                    ///\<link([^>]*type\=\"(image\/x-icon)\"[^>]*)>/i
                    icon = favHtml.match(/.*href\=\"([^\"]*)\".*/i)[1];
                } catch(e) {}
            }
            this.getBase64Image(icon);
        }
        return true;
    //}
    //}
    },
    
    createScrin : function(){
        this.hiddenWindow.document.location = this.url;
        setTimeout(domainData.checkOnLoad, 2000);
    },
    
    checkOnLoad : function () {
        if(domainData.hiddenWindow.document.readyState == 'complete'){
            domainData.doCaptureWin();
            return;
        }
        setTimeout(domainData.checkOnLoad, 2000);
    },
    
    
    doCaptureWin : function (){
        var browserWindow = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
        var canvas = browserWindow.document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
        var ctx = canvas.getContext("2d");
        var width = 1024;
        var height = 768;
        
        var iframeData = domainData.hiddenWindow;//.contentWindow;
        canvas.setAttribute("width", width)
        canvas.setAttribute("height", height);
        ctx.drawWindow(iframeData, 0, 0, width,height, "rgb(255,255,255)");
        var scrin = canvas.toDataURL("image/png");
        //alert(scrin);
        domainData.title = iframeData.document.title;
        domainData.scrin = scrin;

        //domainData.fun(true);
        domainData.resizeImg(domainData.fun);
    },
    getBase64Image : function (url) {
        var image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
        image.onload = function () {
            var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);

            domainData.favicon = canvas.toDataURL("image/png");
        }
        image.src = url;
    },
    
    doCapture : function (){
        var browserWindow = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
        var canvas = browserWindow.document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
        var ctx = canvas.getContext("2d");
        ctx.mozImageSmoothingEnabled = false;
        var width = 1024;
        var height = 768;
        this.iframe.style.width = "1024px";
        this.iframe.style.height = "768px";
        var iframeData = this.iframe.contentWindow;
        canvas.setAttribute("width", width)
        canvas.setAttribute("height", height);
        ctx.drawWindow(iframeData, 0, 0, width,height, "rgb(255,255,255)");
        var scrin = canvas.toDataURL("image/png");
        this.scrin = scrin;
        this.resizeImg(this.fun);
        
        this.iframe.style.width = "0px";
        this.iframe.style.height = "0px";
    },
    
    //img_url
    resizeImg : function (fun) {
        var new_width = 234;
    
        var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
        var image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
        image.onload = function () {
            new thumbnailer(canvas, image, new_width, 4, fun);
        }
        image.src = domainData.scrin;
    }
    
}

function replaseCharCode(str){
    var array = {
        "&#40;" : "(", 
        "&#41;" : ")",
        "&nbsp;" : " ",
        "&#160;" : " ",
        "&#34;" : "\"",
        "&quot;" : "\"",
        "&mdash;" : "-"
        };
    for (var val in array) {
        str = str.replace(new RegExp(val, "g"), array[val]);
    }
    return str;           
}