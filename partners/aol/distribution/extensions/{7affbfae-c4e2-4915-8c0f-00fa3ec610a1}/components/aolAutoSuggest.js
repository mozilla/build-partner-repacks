//max sets the number of results to show in dropdown, up to 10
const max=6,
C=Components,
g=C.ID("87c57a2d-6812-4ce1-9242-a1656bbe0d1e"),
Ci=C.interfaces,
Cc=C.classes,
Cg=Ci.nsIComponentRegistrar;
var JSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);

const InvocationType_Source= "tb50-ff-aol";

var log = function(msg) {
    var lg = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    lg.logStringMessage(msg);
}

function gS(){};

gS.prototype={

    log:function(msg){
        var lg = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
        lg.logStringMessage(msg);
    },
	
  /*
   * Search for a given string and notify a listener (either synchronously
   * or asynchronously) of the result
   *
   * @param searchString - The string to search for
   * @param searchParam - An extra parameter
   * @param previousResult - A previous result to use for faster searchinig
   * @param listener - A listener to notify when the search is complete
   */
    startSearch:function(s,p,t,l){
	// This autocomplete source assumes the developer attached a JSON string
    // to the the "autocompletesearchparam" attribute or "searchParam" property
    // of the <textbox> element. The JSON is converted into an array and used
    // as the source of match data. Any values that match the search string
    // are moved into temporary arrays and passed to the AutoCompleteResult
	
     var j=this,q=C.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        q.onload=function(){
        var r=[],
        rT = q.responseText,
        suggestions = "";
        json_suggestions = JSON.decode(rT);
        if (json_suggestions.length >1) {
            suggestions = json_suggestions[1];
        }
        for (var i=0;i<Math.min(max,suggestions.length);i++)
            r.push(suggestions[i]);
        l.onSearchResult(j,new gR(Ci.nsIAutoCompleteResult.RESULT_SUCCESS,r));
     };
     q.open('GET','http://autocomplete.search.aol.com/autocomplete/get?it=' + InvocationType_Source + '&output=json&q='+encodeURIComponent(s),true);
     q.send(null);
   },
   stopSearch:function(){},
   QueryInterface:function(a){return this}
}


function gR(z,r){this._z=z;this._r=r;}

gR.prototype={
   _z:0,_r:[],

  get searchString() {
    return this._z;
  },
  
  get searchResult(){return this._z},
  
  get matchCount(){return this._r.length},
   
   getValueAt:function(i){return this._r[i]},
   
   getStyleAt:function(i){return null},
   
   getImageAt:function(i){return ''},
   
   getLabelAt: function(index) { return this._r[index]; },
   
   QueryInterface:function(a){
      if(a.equals(Ci.nsIAutoCompleteResult)){
	     return this
	   }
   }
}

var gF={createInstance:function(o,i){return new gS().QueryInterface(i)}}

var gM={
   registerSelf:function(c,f,l,t){c.QueryInterface(Cg).registerFactoryLocation(g,"aol Search Suggest",
      "@mozilla.org/autocomplete/search;1?name=aol-search-suggest",f,l,t)},
   unregisterSelf:function(c,l,t){c.QueryInterface(Cg).unregisterFactoryLocation(g,l)},
   getClassObject:function(c,a,i){return gF},
   canUnload:function(c){return true}
}

function NSGetModule(c,f){return gM}

function NSGetFactory(cid) {
  if (cid.toString().toUpperCase() != g.toString().toUpperCase()) {
    throw Components.results.NS_ERROR_FACTORY_NOT_REGISTERED;
  }

  return gF;
}