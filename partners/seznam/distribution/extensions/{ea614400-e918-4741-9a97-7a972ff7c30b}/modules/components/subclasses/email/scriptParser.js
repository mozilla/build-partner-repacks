var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.ScriptParser = FoxcubService.JAK.ClassMaker.makeStatic({
			NAME : "FoxcubService.Email.ScriptParser",
			VERSION : "0.1"
		});
/**
 * parsuje prihlasovacie skripty - podla formatu ktory definoval ondro
 * @param {string} str
 * @return {array} - postupnost prikazov
 */
FoxcubService.Email.ScriptParser.parse= function(str){
  var actions = str.split("\\");
  var obj=[]

  for(var i in actions){
     var action = actions[i]
     var matches = action.match(/^(?:(\{onload\})|\{(\d+)\}|(.*)\?\?(.*)|(.*))$/)
     if(matches[1]){
        obj.push({action:"onload"});
     }else if(matches[2]){
        obj.push({action:"wait",time:parseInt(matches[2])});
     }else if(matches[3] && matches[4]){
        obj.push({action:"post",url:matches[3],data:matches[4]});
     }else if(matches[5]){
        obj.push({action:"get",url:matches[5]});
     }
  }
  
  return obj;

}
/**
 * vytvori stringy z aktualneho uri, ktore sa budu nahradzat v scripte
 */
FoxcubService.Email.ScriptParser.parseUri= function(uri){
	
    var index = uri.path.indexOf("?");
	if (index != -1) {
		var clearPath = uri.path.substring(0,index);
		var qs = uri.path.substring(index+1)
	} else {
		var clearPath = uri.path;
		var qs = "";
	}
	
    var out = {
    	//cela cesta
        '$${}':uri.prePath + uri.path,
        //domena
        '$${/}':uri.prePath + "/",
        //cesta bez query stringu
        '$${%?}':uri.prePath + clearPath,
        //query string
        '$${?%}':qs
    }
    //FoxcubService.debug(out,'object');
 	//parametre cesty napr pre : test.sk/aa/bb/cc,  $${/#1} ->  aa/
    var path = clearPath.split("/");
    for(var i=1;i<path.length;i++){
      if(!path[i])continue;
      out['$${/#'+i+'}'] = path[i] + ((i+1<path.length)?"/":"");
      out['$${/'+path[i]+'}'] = ((i+1<path.length)?path[i+1] + "/":"");
    }
    //rozparsovanie parametrov z query stringu
    var qsa = qs.split("&");
    for(var i=0;i<qsa.length;i++){
      if(!qsa[i])continue;
      var index = qsa[i].indexOf("=");
      if(index != -1){
          out['$${'+qsa[i].substring(0,index)+'}'] = qsa[i].substring(index+1)
      }else{
          out['$${'+qsa[i]+'}'] = "";
      }
    }
    //FoxcubService.debug(out,'object');
    return out;   
    

}