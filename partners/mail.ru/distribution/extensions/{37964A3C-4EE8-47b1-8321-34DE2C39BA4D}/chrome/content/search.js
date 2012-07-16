var flag_select = false;
var select_item;
var flag_url = false;
function removeSpaces(s) {
    var spaceRe = / +/g;
    return s.replace(spaceRe, "");
}
/*Clear form*/
function InputClear() {
    var query = document.getElementById("queryClear");
    var q = document.getElementById("formQuery").value;
    var div_saggest = document.getElementById('suggest');
    document.getElementById('fadeIn_txt').style.display = 'none';
    if (removeSpaces(q).length) {
            query.style.display = "block";
            query.onclick = function() {
                document.getElementById("formQuery").value = '';
                document.getElementById("formQuery").focus();
                query.style.display = "none"; 
            };
    } else {
            query.style.display = "none";
            div_saggest.style.display = 'none';
    }
}

function search_key_press(elem,event){
    InputClear();
//    alert(event.which);
    if(event.which == 13){
        var div_saggest = document.getElementById('suggest');
        div_saggest.style.display = 'none';
        openSearchPage(elem.value);
        return;
    }
    if(event.which == 40 || event.which == 38){
        var val = stepSuggest(event.which);
        if(val){
            elem.value = val.replace(/<.*?>/g,'');
        }
        return;
    }
    
    if(elem.value.length > 0){
        select_item = undefined;
        getSuggestJSON(elem.value);
    }
}
function getSuggestJSON(str){
    var xhr = new XMLHttpRequest();
    
    xhr.open("GET", "http://suggests.go.mail.ru/sg?q="+str, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if(xhr.status == 200) {
                var objJson = eval('(' + xhr.response + ')');
                //createSuggestJSON(objJson.items);       
                createSuggestJSON(objJson);
            }
        }
    };
    xhr.send(null);
}

function getSuggestXML(str){
    var xhr = new XMLHttpRequest();
    
    xhr.open("GET", "http://stat.go.mail.ru/sputnik?utf8in=1&q="+str, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if(xhr.status == 200) {
                var doc = xhr.responseXML;
                var q = doc.getElementsByTagName('query');
                createSuggest(backlightSuggest(str,q));
            }
        }
    };
    xhr.send(null);
}

function createSuggestJSON(element){
    var div_saggest = document.getElementById('suggest');
    var div_items = document.getElementById('suggest_items');
    var type = ['sites','items'];
    if(element[type[0]].length == 0 && element[type[1]].length == 0) {
        div_saggest.style.display = 'none';
        div_items.innerHTML = "";
        return;
    }
    div_saggest.style.display = 'block';
    div_items.innerHTML = "";
    var col_sagest = 0;
    document.getElementById('query').value = element.terms.query;
    for (var g = 0; g < type.length; g++){
        for( var i = 0; i < element[type[g]].length; i++ )
        {
            var elem = element[type[g]][i];
            if(elem.type == 'site' &&  type[g] == 'items'){
                continue;
            }
            if(col_sagest == 7){
                return;
            }
            col_sagest++;
            document.getElementById('query').value = element.terms.query;
            var div_content = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            div_content.className = "go-form__sugg__item__content";
            if ( type[g] == 'sites' ){
                div_content.innerHTML = '<a href="'+element.sites[i].link+'" onclick="return false;" class="go-form__sugg__item__link">'
                +'<i class="go-form__sugg__item__favicon" style="background-image:url(data:image/png;base64,'+element.sites[i].favicon+')"></i>'
                +element.sites[i].site
                +'</a>';
                if(element.sites[i].sig){
                    document.getElementById('sgsig').value = element.sites[i].sig;
                }
            
            } else {
                div_content.innerHTML = '<span class="go-form__sugg__item__text">'+elem.textMarked+'</span>';
            }
            var div_item = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            div_item.className = "go-form__sugg__item";
            div_item.onmouseover = function () {
                flag_select = true;
                selectSuggest(this);
            }
            div_item.onmouseout = function () {
                flag_select = false;
                selectSuggest(this);
            }
            div_item.onclick = function () {
                openSearchPage(this);
            }
            div_item.appendChild(div_content)
            div_items.appendChild(div_item);
        }
    }
}

function createSuggest(element){
    var div = document.getElementById('suggest');
    div.style.display = 'block';
    div.innerHTML = "";
    
    for( var i = 0; i < element.length; i++ )
    {
        
        var div_item = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        div_item.style.paddingLeft = "5px"
        div_item.onmouseover = function () {
            selectSuggest(this);
        }
        div_item.onmouseout = function () {
            selectSuggest(this);
        }
        var onclik = function () {
            //openSearchPage(this.innerHTML);
            openSearchPage(arguments.callee.val);
        };
        onclik.val = element[i].val;
        
        div_item.onclick = onclik;
        
        //div_item.appendChild(document.createTextNode(element.item(i).firstChild.nodeValue));
        div.appendChild(div_item);
        div_item.innerHTML = element[i].text;
    }
}

function selectSuggest(item){
    select_item = item;
    var select_class = "go-form__sugg__item_select";
    var div_items = document.getElementById('suggest_items');
    for(var i = 0; i < div_items.childNodes.length; i++){
        var class_array = div_items.childNodes[i].className.split(' ');
        delete class_array[class_array.indexOf(select_class)];
        div_items.childNodes[i].className = class_array.join(' ');
    }
    var new_class = item.className.split(' ');
    new_class.push(select_class);
    item.className =  new_class.join(' ');
}

function stepSuggest(key){
    //даю тот который надо выделит. Все осталые чищу сам selectSuggest.
    var elem;
    if(key == 40) {
        elem = (select_item == undefined) ? document.getElementById('suggest_items').childNodes[0] : select_item.nextSibling;
    } else {
        elem = (select_item == undefined) ? document.getElementById('suggest_items').childNodes[document.getElementById('suggest_items').childNodes.length-1] : select_item.previousSibling;
    }
    selectSuggest(elem);
    return getValue(elem);
}

function getValue(elem) {
    var result;
    if(elem.childNodes[0].childNodes[0].className == 'go-form__sugg__item__text') {
        flag_url = false;
        result = elem.childNodes[0].childNodes[0].innerHTML.replace(/<.*?>/g,'');
    } else {
        flag_url = true;
        result = elem.childNodes[0].childNodes[0].href;
    }
    return result;
}
 

function openSearchPage(elem){
    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)  
        .getInterface(Components.interfaces.nsIWebNavigation)  
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)  
        .rootTreeItem  
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)  
        .getInterface(Components.interfaces.nsIDOMWindow);  
        
    document.getElementById('formQuery').focus();
    
    var fr = 'fr=fftab';
    if(decodeURIComponent(document.location.search.substr(1)).split('&') == 'referer=mrff'){
        fr = 'fr=mrfftab';
    }
    
    var url = "http://go.mail.ru/search?"+fr;
    if(typeof elem === 'string' ){
        document.getElementById('formQuery').value = elem;
        if(flag_url) {
            if(document.getElementById('sgsig').value != ''){
                url += '&q=' + document.getElementById('formQuery').value
                        + '&sgsig=' + document.getElementById('sgsig').value
                        + '&sg=' + document.getElementById('query').value
                        + '&ce=1';
            } else {
                url = document.getElementById('formQuery').value;
            }
        } else {
            url += '&q='+document.getElementById('formQuery').value;
        }
    } else {
        document.getElementById('formQuery').value = getValue(elem);
        if(flag_url) {
            if(document.getElementById('sgsig').value != ''){
                url += '&q=' + document.getElementById('formQuery').value
                        + '&sgsig=' + document.getElementById('sgsig').value
                        + '&sg=' + document.getElementById('query').value
                        + '&ce=1';
            } else {
                url = document.getElementById('formQuery').value;
            }
        } else {
            url += '&q=' + document.getElementById('formQuery').value;
        }
    }
    
    var div_saggest = document.getElementById('suggest');
    div_saggest.style.display = 'none';
    if(removeSpaces(document.getElementById('formQuery').value).length != 0) {
        mainWindow.gBrowser.loadURI(url, null, null, null, null);
    } else {
        document.getElementById('fadeIn_txt').style.display = 'block';
        document.getElementById('fadeIn_txt').style.opacity = 1;
        hideText(document.getElementById('fadeIn_txt'));
    }
}

function backlightSuggest(str,element){
    var result = [];
    for( var i = 0; i < element.length; i++ ){
        var val = element.item(i).firstChild.nodeValue;
        result.push({
            'val':val,
            'text':val.replace(str,'<b>'+str+'</b>')
            });
    //element.item(i).firstChild.nodeValue = val.replace(str,'<b>'+str+'</b>');
    }
    return result;
}
function search(){
    openSearchPage(document.getElementById('formQuery').value);
}
function disabledSuggest(e){
    if(e.target.id == 'formQuery') {
        return
    }
    var div_saggest = document.getElementById('suggest');
    div_saggest.style.display = 'none';
}
function hideText(elem){
    elem.style.opacity = elem.style.opacity - 0.01;
    if(elem.style.opacity != 0){
        window.setTimeout(hideText, 10,elem);
    } else {
        elem.style.display = 'none';
        return;
    }
}