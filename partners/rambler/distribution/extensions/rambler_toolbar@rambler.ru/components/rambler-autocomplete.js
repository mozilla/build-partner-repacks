const max=5,C=Components,g=C.ID("58C7660C-9BCD-11DF-8EE8-53FCDED72085"),Ci=C.interfaces,Cg=Ci.nsIComponentRegistrar;
C.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function gS(){};

gS.prototype={
    classDescription: "Rambler AutoComplete",
    classID: Components.ID("58C7660C-9BCD-11DF-8EE8-53FCDED72085"),
    contractID: "@mozilla.org/autocomplete/search;1?name=rambler-autocomplete",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch, Ci.nsISupports]),

    startSearch:function(s,p,t,l){
      var j=this,q=C.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

      q.onload = (p?(function(){
            var doc = q.responseXML;
            var items = doc.getElementsByTagName('item');
            for (var r0=[], idx=0; idx<items.length; idx++){
                var id = items[idx].getElementsByTagName('id');
                var name = items[idx].getElementsByTagName('name');
                var parents = items[idx].getElementsByTagName('parents');
                if (name.length && parents.length && parents[0] && parents[0].textContent) { 
                    // r0.push( name[0].textContent + ' (' + parents[0].textContent + ')' ); 
                    r0.push({'id': id[0].textContent, 'name':  name[0].textContent + ' (' + parents[0].textContent + ')'} ); 
                }
            }
            l.onSearchResult(j,new gR(4,r0));}) : (function(){
        var rm = q.responseText.match(/\[\[.*?\]\]/g);
        var rt = rm? (rm.length? JSON.parse(rm[0]) : []) : [];
        for (var r = [], i=0;i<Math.min(max,rt.length);i++){ r.push(rt[i][0]); }
        l.onSearchResult(j,new gR(4,r));
      }));
      
      var uri1 = 'http://'+(p? p :  'nova.rambler.ru/suggest?v=2&query='); 
      q.open('GET',uri1+encodeURIComponent(s),true);
      q.send(null);
   },
   stopSearch:function(){}
};

function gR(z,r){
  this._z=z;
  this._r=r;
}
gR.prototype={
  _z:0,
  _r:[],
  get searchResult(){return this._z},
  get matchCount(){return this._r.length},
  getValueAt:function(i){
    return this._r[i].name || this._r[i];
  },
  getLabelAt:function(i){
    return this._r[i].name || this._r[i];
  },
  getCommentAt:function(i){
    return this._r[i].id || '';
  },  
  getStyleAt:function(i){return null},
  getImageAt:function(i){return ''},
  
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch, Ci.nsISupports])   
}


if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([gS]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([gS]);