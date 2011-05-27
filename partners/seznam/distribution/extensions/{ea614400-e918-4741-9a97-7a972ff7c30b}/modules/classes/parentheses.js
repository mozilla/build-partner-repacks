var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/**
*
*  Javascript crc32
*  http://www.webtoolkit.info/
*
**/
FoxcubService.Parentheses = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : "FoxcubService.Parentheses",
	VERSION : "0.1"
});


FoxcubService.Parentheses.prototype.$constructor = function(charL,charR){
      this.charL =  charL;
      this.charR =  charR;
};

FoxcubService.Parentheses.prototype.analyze = function(str,toSimpleArray){
    var out = false;
    try{
      var outx = this._analyze(str,0)
      if(toSimpleArray){
        out = this._arrayFromStructure(outx);
      }else{
        out = outx;
      }
    }catch(e){
    } 
    return out;
}
FoxcubService.Parentheses.prototype._analyze = function(str,recursionDepth){
  if(!str){
     return [];
  }
  var matches = [];
  var depth=0;
  var state = false;
  var left=0;
  for(var i=0;i<str.length;i++){
     var leftX = left;
     switch(str.charAt(i)){    
         case this.charL: 
                   if(state){
                     depth++;
                   }else{
                     state = true;
                     left = i+1;                     
                   }
                   break;
         case this.charR:
                   if(state){
                       if(depth > 0){
                           depth--
                       }else{
                           var strMatch = str.substring(left,i);
                           matches.push(this._createObj(strMatch,recursionDepth))
                           state = false;
                           left = i+1;
                       }
                       
                    }else{
                       throw new Error("Bad bracketting");
                    }
        break;
              
     }
     var end = (str.length == i + 1);
     if(end && state) throw new Error("Bad bracketting");
     if((leftX!=left && state)||end){
           var l = end ? left:leftX
           var r = i + (end?1:0)
           matches.push(this._createObj(str.substring(l,r),recursionDepth,true)); 
                    
     }  
  }
  return matches ;
} 
FoxcubService.Parentheses.prototype._createObj = function(match,depth,nonrecursive){ 
  childs = nonrecursive ? [] : this._analyze(match ,depth+1);
  return {
    match:match,
    depth:depth,
    childs : childs,
    bracketed: !nonrecursive
  };
}
FoxcubService.Parentheses.prototype._arrayFromStructure = function(structure){ 
    var out = [{root:true,childs:structure}];
    var j=1;
		for (var i=0;i<j;i++) {
			if (out[i].childs.length) {
				var empty = 0;
				for(var ii in out[i].childs){
					child = out[i].childs[ii]
					if(!child.match)empty++;
					var obj = {
						parent:i,
						match:child.match,
						depth:child.depth,
						bracketed:child.bracketed,
						childs:child.childs,
						left:ii,
						leftNoEmpty:ii-empty
					}
					out.push(obj)
					j++;
				}	
			}
			delete(out[i].childs);
		}  
    return out;
}