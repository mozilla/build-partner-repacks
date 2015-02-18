(function(global,main,modules,modules_options,options){var initialized_modules={},global_eval=function(code){return global.Function("return "+code)()
},global_document=global.document,local_undefined,register_module=function(moduleName,module){lmd_trigger("lmd-register:before-register",moduleName,module);
var output={exports:{}};initialized_modules[moduleName]=1;modules[moduleName]=output.exports;if(!module){module=lmd_trigger("js:request-environment-module",moduleName,module)[1]||global[moduleName]
}else if(typeof module==="function"){var module_require=lmd_trigger("lmd-register:decorate-require",moduleName,lmd_require)[1];
if(modules_options[moduleName]&&modules_options[moduleName].sandbox&&typeof module_require==="function"){module_require=local_undefined
}module=module(module_require,output.exports,output)||output.exports}module=lmd_trigger("lmd-register:after-register",moduleName,module)[1];
return modules[moduleName]=module},lmd_events={},lmd_trigger=function(event,data,data2,data3){var list=lmd_events[event],result;
if(list){for(var i=0,c=list.length;i<c;i++){result=list[i](data,data2,data3)||result;if(result){data=result[0]||data;
data2=result[1]||data2;data3=result[2]||data3}}}return result||[data,data2,data3]},lmd_on=function(event,callback){if(!lmd_events[event]){lmd_events[event]=[]
}lmd_events[event].push(callback)},lmd_require=function(moduleName){var module=modules[moduleName];var replacement=lmd_trigger("*:rewrite-shortcut",moduleName,module);
if(replacement){moduleName=replacement[0];module=replacement[1]}lmd_trigger("*:before-check",moduleName,module);
if(initialized_modules[moduleName]&&module){return module}lmd_trigger("*:before-init",moduleName,module);
if(typeof module==="string"&&module.indexOf("(function(")===0){module=global_eval(module)}return register_module(moduleName,module)
},output={exports:{}},sandbox={global:global,modules:modules,modules_options:modules_options,options:options,eval:global_eval,register:register_module,require:lmd_require,initialized:initialized_modules,document:global_document,on:lmd_on,trigger:lmd_trigger,undefined:local_undefined};
for(var moduleName in modules){initialized_modules[moduleName]=0}main(lmd_trigger("lmd-register:decorate-require","main",lmd_require)[1],output.exports,output)
})(this,function main(require){require("channels");require("bem");require("scroll")},{lib:function(require){var Lib={_THUMB_SIZE_BIG:300,_THUMB_SIZE_NORMAL:250,_THUMB_SIZE_SMALL:200,_THUMB_SIZE_TINY:100,_THUMB_MARGIN:20,_CONTENT_SIZE_BIG:1600,_CONTENT_SIZE_NORMAL:1280,_CONTENT_SIZE_SMALL:1024,_HISTORY_SUGGEST_MAX_LENGTH:50,_calculateLayoutsOfThumbs:function(x,y){var sizes=[],margin=this._THUMB_MARGIN;
[this._THUMB_SIZE_TINY,this._THUMB_SIZE_SMALL,this._THUMB_SIZE_NORMAL,this._THUMB_SIZE_BIG].forEach(function(thumbSize){sizes.push({width:(x+1)*margin+x*thumbSize,height:y*thumbSize/2+230+(y+1)*margin,thumbSize:thumbSize})
});return sizes},getThumbSize:function(x,y){var sizes=this._calculateLayoutsOfThumbs(x,y),$win=$(window),winWidth=Math.max($win.width(),this._CONTENT_SIZE_SMALL),winHeight=$win.height(),index=1;
if($win.height()==$(document).height())winWidth=winWidth-20;sizes.some(function(thumbsSize,i){if(thumbsSize.width<winWidth&&thumbsSize.height<winHeight){index=i;
return false}return true});if(index===0&&x<=5){index=1}if(x>5){index=0}return sizes[index].thumbSize},getSuggestedThumbSize:function(){return this._THUMB_SIZE_SMALL
},getThumbSizeMod:function(size){var modSize;switch(size){case this._THUMB_SIZE_BIG:modSize="big";break;
case this._THUMB_SIZE_NORMAL:modSize="normal";break;case this._THUMB_SIZE_SMALL:modSize="small";break;
case this._THUMB_SIZE_TINY:modSize="tiny";break}return modSize},getThumbType:function(item){if(!item){return 0
}else if(item.screenshot){return 6}else if(!item.backgroundImage&&!item.favicon){return 1}else if(item.backgroundImage){return!item.isIndexPage?3:2
}else{if(!item.isIndexPage){if(item.title)return 5;else return 4}else{return 4}}},getThumbTitleMaxLength:function(size){var len;
switch(size){case this._THUMB_SIZE_BIG:len=40;break;case this._THUMB_SIZE_NORMAL:len=30;break;case this._THUMB_SIZE_SMALL:len=15;
break;case this._THUMB_SIZE_TINY:len=15;break}return len},getThumbSubTitleMaxLength:function(size,type){switch(size){case this._THUMB_SIZE_BIG:if(type==1)return 40;
return 20;case this._THUMB_SIZE_NORMAL:if(type==1)return 27;return 15;case this._THUMB_SIZE_SMALL:if(type==1)return 10;
return 7;case this._THUMB_SIZE_TINY:if(type==1)return 10;return 7}},getThumbSizeFromMod:function(modSize){switch(modSize){case"big":return this._THUMB_SIZE_BIG;
case"normal":return this._THUMB_SIZE_NORMAL;case"small":return this._THUMB_SIZE_SMALL;case"tiny":return this._THUMB_SIZE_TINY
}throw new ReferenceError("Unknown modsize "+modSize)},getThumbUrlMaxLength:function(size){var len;switch(size){case this._THUMB_SIZE_BIG:len=20;
break;case this._THUMB_SIZE_NORMAL:len=18;break;case this._THUMB_SIZE_SMALL:len=7;break;case this._THUMB_SIZE_TINY:len=7;
break}return len},getHistorySuggestMaxLength:function(){return this._HISTORY_SUGGEST_MAX_LENGTH},generateSliderScale:function(sizes){return[{value:0,step:1},{value:sizes.length-1}]
},_suggestTypesWeight:{weather:6,traffic:5,market:4,lingvo:3,maps:2,units_converter:1},_parseSuggestData:function(responseText){var parsedData={},res,typesWeight=this._suggestTypesWeight,infoObject,parseJSON=JSON.parse||$.parseJSON;
try{res=parseJSON(responseText)}catch(e){}if(!$.isArray(res))res=[];if(typeof res[0]==="string")parsedData.query=res[0];
parsedData.suggestionResults=$.isArray(res[1])?res[1]:[];if($.isArray(res[2]))parsedData.comments=res[2];
if(res[4]&&"object"==typeof res[4])infoObject=parsedData.infoObject=res[4];if(infoObject&&$.isArray(infoObject["google:suggesttype"]))parsedData.suggestTypes=infoObject["google:suggesttype"];
var answers=new Array(parsedData.suggestionResults.length);if(infoObject&&$.isArray(infoObject["yandex:answer"])){infoObject["yandex:answer"].forEach(function(answer){if(!(answer&&typeof answer=="object"&&typeof answer.answer=="object"&&answer.type in typesWeight&&answer.position))return;
var position=parseInt(answer.position,10)-1;if(position<0||position>parsedData.suggestionResults.length)return;
var a=answers[position]||null;if(!a||typesWeight[a.type]<typesWeight[answer.type])answers[position]=answer
})}return $.extend({query:"",suggestionResults:[],comments:[],infoObject:{},suggestTypes:[],answers:answers},parsedData)
},getAllSuggests:function(responseText){if(!responseText)return null;var parsedData=this._parseSuggestData(responseText),suggestionResults=parsedData.suggestionResults;
if(!suggestionResults.length)return null;var comments=parsedData.comments,infoObject=parsedData.infoObject,suggestTypes=parsedData.suggestTypes,answers=parsedData.answers,query=parsedData.query;
function minifyURL(url){if(!url)return"";var link=document.createElement("a");link.setAttribute("href",url);
return link.hostname}var typesWeight=this._suggestTypesWeight,suggestions=[],usedTypes={};suggestionResults.forEach(function(res,index){var answerData=answers[index]||null,type=answerData&&answerData.type||"text",url=answerData&&answerData.answer.url||null,showingText,image,showingURL=url;
if(answerData){if(showingURL){showingURL=minifyURL(showingURL)}switch(answerData.type){case"units_converter":showingText=suggestionResults[index];
break;case"weather":if(answerData.answer.image){image=answerData.answer.image}break;case"traffic":if(["green","red","yellow"].indexOf(answerData.answer.semaphore)!=-1){image=answerData.answer.semaphore
}break}}var suggest={value:showingText||showingURL||res,title:answerData&&answerData.answer.title,text:answerData&&answerData.answer.text,image:image,type:type};
if(url){suggest.action={type:"openurl",value:url}}if(index===0&&suggestTypes[0]==="NAVIGATION"&&type==="text"){suggest.text=comments[0];
suggest.action={type:"openurl",value:suggest.value}}if(type==="text"&&comments[index]&&!suggest.action){suggest.type="fact";
suggest.text=comments[index]}if(usedTypes[type]){suggestions.push({type:"text",value:res})}else{suggestions.push(suggest)
}if(type!=="text")usedTypes[type]=true},this);return{suggestions:suggestions,query:query}},getNavigationSuggest:function(responseText){if(!responseText)return null;
var parsedData=this._parseSuggestData(responseText),suggestText=parsedData.suggestionResults[0],answer=parsedData.answers[0];
if(suggestText){if(!/^http:\/\//.test(suggestText)){suggestText="http://"+suggestText}}else{return null
}if(parsedData.suggestTypes[0]==="NAVIGATION"&&(!answer||answer.type==="text")){return{url:suggestText,title:parsedData.comments[0]||""}
}return null},highlightText:function(substr){substr=substr.trim();return function(text){text=text.replace(new RegExp(substr,"i"),'<span class="b-page__hl">$&</span>');
return text}},markdownLinkToHTML:function(md,newWindow){var linkReg=/(\[(.+)\]\((.+)\))/g,attrs=newWindow?'target="_blank"':"";
return md.replace(linkReg,"<a "+attrs+' href="$3">$2</a>')},hexToRGB:function(hex){var result=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
return result?[parseInt(result[1],16),parseInt(result[2],16),parseInt(result[3],16)]:null},escapeRegExpSymbols:function(str){return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")
},getUnicodedURL:function(url){var punycode=require("punycode");return punycode?punycode.toUnicode.bind(punycode):function(url){return url
}}()};return Lib},bemhtml:function(require){var BH=function(){var dirtyEnv=false;for(var i in{}){dirtyEnv=true;
break}function BH(){this._lastMatchId=0;this._matchers=[];this._infiniteLoopDetection=false;this.lib={};
this._inited=false;this._options={};this._optJsAttrName="onclick";this._optJsAttrIsJs=true;this.utils={_lastGenId:0,bh:this,extend:function(target){if(typeof target!=="object"){target={}
}for(var i=1,len=arguments.length;i<len;i++){var obj=arguments[i],key;if(obj){if(dirtyEnv){for(key in obj){if(obj.hasOwnProperty(key)){target[key]=obj[key]
}}}else{for(key in obj){target[key]=obj[key]}}}}return target},position:function(){var node=this.node;
return node.index==="content"?1:node.index+1},isFirst:function(){var node=this.node;return node.index==="content"||node.index===0
},isLast:function(){var node=this.node;return node.index==="content"||node.index===node.arr.length-1},tParam:function(key,value){var keyName="__tp_"+key;
if(arguments.length===2){this.node[keyName]=value;return this}else{var node=this.node;while(node){if(node.hasOwnProperty(keyName)){return node[keyName]
}node=node.parentNode}return undefined}},apply:function(bemjson){var prevCtx=this.ctx,prevNode=this.node;
var res=this.bh.processBemjson(bemjson,prevCtx.block);this.ctx=prevCtx;this.node=prevNode;return res},applyCtx:function(changes){return this.applyBase.apply(this,arguments)
},applyBase:function(changes){var prevCtx=this.ctx,prevNode=this.node,prevValues,key;if(changes){prevValues={};
for(key in changes){if(dirtyEnv&&!changes.hasOwnProperty(key))continue;prevValues[key]=prevCtx[key];prevCtx[key]=changes[key]
}}var res=this.bh.processBemjson(this.ctx,this.ctx.block,true);if(res!==prevCtx){this.newCtx=res}if(changes){for(key in changes){if(dirtyEnv&&!changes.hasOwnProperty(key))continue;
prevCtx[key]=prevValues[key]}}this.ctx=prevCtx;this.node=prevNode;return this},stop:function(){this.ctx._stop=true;
return this},generateId:function(){return"uniq"+this._lastGenId++},mod:function(key,value,force){var mods;
if(value!==undefined){mods=this.ctx.mods||(this.ctx.mods={});mods[key]=mods[key]===undefined||force?value:mods[key];
return this}else{mods=this.ctx.mods;return mods?mods[key]:undefined}},mods:function(values,force){var mods=this.ctx.mods||(this.ctx.mods={});
if(values!==undefined){for(var key in values){if(dirtyEnv&&!values.hasOwnProperty(key))continue;mods[key]=mods[key]===undefined||force?values[key]:mods[key]
}return this}else{return mods}},tag:function(tagName,force){if(tagName!==undefined){this.ctx.tag=this.ctx.tag===undefined||force?tagName:this.ctx.tag;
return this}else{return this.ctx.tag}},mix:function(mix,force){if(mix!==undefined){if(force){this.ctx.mix=mix
}else{if(this.ctx.mix){this.ctx.mix=this.ctx.mix.concat(mix)}else{this.ctx.mix=mix}}return this}else{return this.ctx.mix
}},attr:function(key,value,force){var attrs;if(value!==undefined){attrs=this.ctx.attrs||(this.ctx.attrs={});
attrs[key]=attrs[key]===undefined||force?value:attrs[key];return this}else{attrs=this.ctx.attrs;return attrs?attrs[key]:undefined
}},bem:function(bem,force){if(bem!==undefined){this.ctx.bem=this.ctx.bem===undefined||force?bem:this.ctx.bem;
return this}else{return this.ctx.bem}},js:function(js,force){if(js!==undefined){this.ctx.js=this.ctx.js===undefined||force?js:this.ctx.js;
return this}else{return this.ctx.js}},cls:function(cls,force){if(cls!==undefined){this.ctx.cls=this.ctx.cls===undefined||force?cls:this.ctx.cls;
return this}else{return this.ctx.cls}},param:function(key,value,force){if(value!==undefined){this.ctx[key]=this.ctx[key]===undefined||force?value:this.ctx[key];
return this}else{return this.ctx[key]}},content:function(value,force){if(arguments.length>0){this.ctx.content=this.ctx.content===undefined||force?value:this.ctx.content;
return this}else{return this.ctx.content}},json:function(){return this.newCtx||this.ctx}}}BH.prototype={setOptions:function(options){var i;
var bhOptions=this._options;if(dirtyEnv){for(i in options){if(options.hasOwnProperty(i)){bhOptions[i]=bhOptions
}}}else{for(i in options){bhOptions[i]=bhOptions}}if(options.jsAttrName){this._optJsAttrName=options.jsAttrName
}if(options.jsAttrScheme){this._optJsAttrIsJs=options.jsAttrScheme==="js"}return this},getOptions:function(){return this._options
},enableInfiniteLoopDetection:function(enable){this._infiniteLoopDetection=enable;return this},apply:function(bemjson){return this.toHtml(this.processBemjson(bemjson))
},match:function(expr,matcher){matcher.__id="__func"+this._lastMatchId++;this._matchers.push([expr,matcher]);
this._fastMatcher=null},buildMatcher:function(){function groupBy(data,key){var res={};for(var i=0,l=data.length;i<l;i++){var item=data[i];
var value=item[key]||"__no_value__";(res[value]||(res[value]=[])).push(item)}return res}var i,j,l;var res=[""];
var vars=["bh = this"];var allMatchers=this._matchers;var decl,expr,matcherInfo;var declarations=[],exprBits,blockExprBits;
for(i=allMatchers.length-1;i>=0;i--){matcherInfo=allMatchers[i];expr=matcherInfo[0];if(expr){vars.push("_m"+i+" = ms["+i+"][1]");
decl={fn:matcherInfo[1],index:i};if(~expr.indexOf("__")){exprBits=expr.split("__");blockExprBits=exprBits[0].split("_");
decl.block=blockExprBits[0];if(blockExprBits.length>1){decl.blockMod=blockExprBits[1];decl.blockModVal=blockExprBits[2]
}exprBits=exprBits[1].split("_");decl.elem=exprBits[0];if(exprBits.length>1){decl.mod=exprBits[1];decl.modVal=exprBits[2]
}}else{exprBits=expr.split("_");decl.block=exprBits[0];if(exprBits.length>1){decl.mod=exprBits[1];decl.modVal=exprBits[2]
}}declarations.push(decl)}}var declByBlock=groupBy(declarations,"block");res.push("var "+vars.join(", ")+";");
res.push("function applyMatchers(ctx, json) {");res.push("var subRes, newCtx;");res.push("switch (json.block) {");
for(var blockName in declByBlock){if(dirtyEnv&&!declByBlock.hasOwnProperty(blockName))continue;res.push('case "'+escapeStr(blockName)+'":');
var declsByElem=groupBy(declByBlock[blockName],"elem");res.push("switch (json.elem) {");for(var elemName in declsByElem){if(dirtyEnv&&!declsByElem.hasOwnProperty(elemName))continue;
if(elemName==="__no_value__"){res.push("case undefined:")}else{res.push('case "'+escapeStr(elemName)+'":')
}var decls=declsByElem[elemName];for(j=0,l=decls.length;j<l;j++){decl=decls[j];var fn=decl.fn;var conds=[];
conds.push("!json."+fn.__id);if(decl.mod){conds.push("json.mods");if(decl.modVal){conds.push('json.mods["'+escapeStr(decl.mod)+'"] === "'+escapeStr(decl.modVal)+'"')
}else{conds.push('json.mods["'+escapeStr(decl.mod)+'"]')}}if(decl.blockMod){conds.push("json.blockMods");
if(decl.blockModVal){conds.push('json.blockMods["'+escapeStr(decl.blockMod)+'"] === "'+escapeStr(decl.blockModVal)+'"')
}else{conds.push('json.blockMods["'+escapeStr(decl.blockMod)+'"]')}}res.push("if ("+conds.join(" && ")+") {");
res.push("json."+fn.__id+" = true;");res.push("subRes = _m"+decl.index+"(ctx, json);");res.push("if (subRes) { return subRes; }");
res.push("if (newCtx = ctx.newCtx) { ctx.newCtx = null; return newCtx; }");res.push("if (json._stop) return;");
res.push("}")}res.push("return;")}res.push("}");res.push("return;")}res.push("}");res.push("};");res.push("return applyMatchers;");
return res.join("\n")},processBemjson:function(bemjson,blockName,ignoreContent){if(!this._inited){this._init()
}var resultArr=[bemjson];var nodes=[{json:bemjson,arr:resultArr,index:0,blockName:blockName,blockMods:bemjson.mods||{}}];
var node,json,block,blockMods,i,l,p,child,subRes;var compiledMatcher=this._fastMatcher||(this._fastMatcher=Function("ms",this.buildMatcher())(this._matchers));
var processContent=!ignoreContent;var infiniteLoopDetection=this._infiniteLoopDetection;function Ctx(){this.ctx=null;
this.newCtx=null}Ctx.prototype=this.utils;var ctx=new Ctx;while(node=nodes.shift()){json=node.json;block=node.blockName;
blockMods=node.blockMods;if(Array.isArray(json)){for(i=0,l=json.length;i<l;i++){child=json[i];if(child!==false&&child!=null&&typeof child==="object"){nodes.push({json:child,arr:json,index:i,blockName:block,blockMods:blockMods,parentNode:node})
}}}else{var content,stopProcess=false;if(json.elem){block=json.block=json.block||block;blockMods=json.blockMods=json.blockMods||blockMods;
if(json.elemMods){json.mods=json.elemMods}}else if(json.block){block=json.block;blockMods=json.mods||(json.mods={})
}if(json.block){if(infiniteLoopDetection){json.__processCounter=(json.__processCounter||0)+1;if(json.__processCounter>100){throw new Error('Infinite loop detected at "'+json.block+(json.elem?"__"+json.elem:"")+'".')
}}subRes=null;if(!json._stop){ctx.node=node;ctx.ctx=json;subRes=compiledMatcher(ctx,json);if(subRes){json=subRes;
node.json=json;node.blockName=block;node.blockMods=blockMods;nodes.push(node);stopProcess=true}}}if(!stopProcess){if(Array.isArray(json)){node.json=json;
node.blockName=block;node.blockMods=blockMods;nodes.push(node)}else{if(processContent&&(content=json.content)){if(Array.isArray(content)){var flatten;
do{flatten=false;for(i=0,l=content.length;i<l;i++){if(Array.isArray(content[i])){flatten=true;break}}if(flatten){json.content=content=content.concat.apply([],content)
}}while(flatten);for(i=0,l=content.length,p=l-1;i<l;i++){child=content[i];if(child!==false&&child!=null&&typeof child==="object"){nodes.push({json:child,arr:content,index:i,blockName:block,blockMods:blockMods,parentNode:node})
}}}else{nodes.push({json:content,arr:json,index:"content",blockName:block,blockMods:blockMods,parentNode:node})
}}}}}node.arr[node.index]=json}return resultArr[0]},toHtml:function(json){var res,i,l,item;if(json===false||json==null)return"";
if(typeof json!=="object"){return json}else if(Array.isArray(json)){res="";for(i=0,l=json.length;i<l;i++){item=json[i];
if(item!==false&&item!=null){res+=this.toHtml(item)}}return res}else{var cls=json.bem!==false&&json.block?toBEMCssClasses(json,json.block):"",jattr,attrs="",jsParams,hasMixJsParams=false;
if(jattr=json.attrs){if(dirtyEnv){for(i in jattr){if(jattr.hasOwnProperty(i)&&jattr[i]!==null){attrs+=" "+i+'="'+escapeAttr(jattr[i])+'"'
}}}else{for(i in jattr){if(jattr[i]!==null){attrs+=" "+i+'="'+escapeAttr(jattr[i])+'"'}}}}if(json.js){(jsParams={})[json.block+(json.elem?"__"+json.elem:"")]=json.js===true?{}:json.js
}var mixes=json.mix;if(mixes&&mixes.length){for(i=0,l=mixes.length;i<l;i++){var mix=mixes[i];if(mix.js){(jsParams=jsParams||{})[(mix.block||json.block)+(mix.elem?"__"+mix.elem:"")]=mix.js===true?{}:mix.js;
hasMixJsParams=true}}}if(jsParams){if(json.bem!==false){cls=cls+" i-bem"}var jsData=!hasMixJsParams&&json.js===true?"{&quot;"+json.block+(json.elem?"__"+json.elem:"")+"&quot;:{}}":escapeAttr(JSON.stringify(jsParams));
attrs+=" "+(json.jsAttr||this._optJsAttrName)+'="'+(this._optJsAttrIsJs?"return "+jsData+";":jsData)+'"'
}if(json.cls){cls=cls?cls+" "+json.cls:json.cls}var content,tag=json.tag||"div";res="<"+tag+(cls?' class="'+escapeAttr(cls)+'"':"")+(attrs?attrs:"");
if(selfCloseHtmlTags[tag]){res+="/>"}else{res+=">";if(content=json.content){if(Array.isArray(content)){for(i=0,l=content.length;i<l;i++){item=content[i];
if(item!==false&&item!=null){res+=this.toHtml(item)}}}else{res+=this.toHtml(content)}}res+="</"+tag+">"
}return res}},_init:function(){this._inited=true;if(typeof BEM!=="undefined"&&typeof BEM.I18N!=="undefined"){this.lib.i18n=this.lib.i18n||BEM.I18N
}}};var selfCloseHtmlTags={area:1,base:1,br:1,col:1,command:1,embed:1,hr:1,img:1,input:1,keygen:1,link:1,meta:1,param:1,source:1,wbr:1};
var escapeAttr=function(attrVal){attrVal+="";if(~attrVal.indexOf("&")){attrVal=attrVal.replace(/&/g,"&amp;")
}if(~attrVal.indexOf('"')){attrVal=attrVal.replace(/"/g,"&quot;")}return attrVal};var escapeStr=function(str){str+="";
if(~str.indexOf("\\")){str=str.replace(/\\/g,"\\\\")}if(~str.indexOf('"')){str=str.replace(/"/g,'\\"')
}return str};var toBEMCssClasses=function(json,blockName){var mods,res,base=(json.block||blockName)+(json.elem?"__"+json.elem:""),mix,i,l;
res=base;if(mods=json.mods){if(dirtyEnv){for(i in mods){if(mods.hasOwnProperty(i)&&mods[i]){res+=" "+base+"_"+i+"_"+mods[i]
}}}else{for(i in mods){if(mods[i]){res+=" "+base+"_"+i+"_"+mods[i]}}}}if((mix=json.mix)&&(l=mix.length)){for(i=0;i<l;i++){res+=" "+toBEMCssClasses(mix[i],blockName)
}}return res};return BH}();if(typeof module!=="undefined"){module.exports=BH}var bh=new BH;bh.setOptions({jsAttrName:"data-bem",jsAttrScheme:"json"});
bh.match("b-popupa",function(ctx){ctx.js(true,true);ctx.mods({theme:"ffffff",direction:"down"});if(ctx.tParam("_inBDropdowna")){ctx.mix([{block:"b-dropdowna",elem:"popup",mods:ctx.tParam("_dropdownaColor")&&{color:ctx.tParam("_dropdownaColor")}}]);
ctx.tParam("_inBDropdowna",false);ctx.tParam("_dropdownaColor",false)}});bh.match("b-popupa__shadow",function(ctx){ctx.tag("i")
});bh.match("b-popupa_has-close_yes",function(ctx){ctx.content([ctx.content(),{elem:"close"}],true)});
bh.match("b-popupa__close",function(ctx){ctx.content({block:"krestik",mods:{size:"small"}})});bh.match("stat-popup",function(ctx){ctx.js(true)
});bh.match("stat-popup__header",function(ctx){ctx.tag("strong")});bh.match("stat-popup__logo-link",function(ctx){ctx.attr("href",ctx.param("url"));
ctx.tag("a")});bh.match("stat-popup__logo",function(ctx){ctx.attr("src",ctx.param("url"));ctx.tag("img")
});bh.match("stat-popup__paragraph",function(ctx){ctx.tag("p")});bh.match("b-tumb",function(ctx){var isSuggest=ctx.mod("suggest");
if(isSuggest==="yes"){ctx.tag("div")}else{ctx.tag("a")}ctx.js(true);["title","target"].forEach(function(attr){ctx.param(attr)&&ctx.attr(attr,ctx.param(attr))
});var url=ctx.param("url"),bg=ctx.param("bg"),clickAttrs=isSuggest?{draggable:"false"}:{};!isSuggest&&url&&ctx.attr("href",url);
bg&&ctx.attr("style","background-color:"+bg);ctx.content([ctx.content(),{elem:"click",tag:"i",attrs:clickAttrs}],true)
});bh.match("b-tumb__control-item",function(ctx){ctx.tag("span")});bh.match("b-tumb__control",function(ctx){ctx.tag("span");
ctx.attr("aria-label","thumb-control-items")});bh.match("b-tumb__desc",function(ctx){ctx.tag("span")});
bh.match("svg",function(ctx){ctx.tag("svg");ctx.attr("xmlns","http://www.w3.org/2000/svg");ctx.attr("vesion","1.1");
ctx.attr("width","100%");ctx.attr("height","100%")});bh.match("svg__filter",function(ctx){ctx.tag("filter");
ctx.attr("id","blur_ie");ctx.content('<feGaussianBlur in="SourceGraphic" stdDeviation="'+ctx.param("value")+'"></feGaussianBlur>')
});bh.match("svg__image",function(ctx){ctx.tag("image");ctx.attr("x","0");ctx.attr("y","0");ctx.attr("width","100%");
ctx.attr("height","100%");ctx.attr("xlink:href",ctx.param("url"));ctx.attr("style","filter:url(#blur_ie)")
});bh.match("b-link",function(ctx){ctx.tag("a");ctx.param("url")&&ctx.attr("href",ctx.param("url"));["title","target"].forEach(function(prop){ctx.param(prop)&&ctx.attr(prop,ctx.param(prop))
})});bh.match("button",function(ctx){ctx.tag("button");ctx.js(true);ctx.attr("role","button");ctx.content({elem:"text",tag:"span",content:ctx.content()},true)
});bh.match("b-form-button",function(ctx){ctx.tag("span");ctx.js(true,true);ctx.content([{elem:"left"},{elem:"content",content:[{elem:"text",content:ctx.content()}]},{elem:"input"}],true)
});bh.match("b-form-button__input",function(ctx){var content=ctx.content()||"";if(typeof content==="string")ctx.attr("value",content);
else ctx.attr("value","");ctx.tag("input");ctx.attr("hidefocus","true");ctx.attr("tabindex","");ctx.attr("type","button")
});bh.match("b-form-button__left",function(ctx){ctx.tag("i")});bh.match("b-form-button__content",function(ctx){ctx.tag("span")
});bh.match("b-form-button__text",function(ctx){ctx.tag("span")});bh.match("b-menu-horiz",function(ctx){var content=ctx.content();
if(content){content=[].concat(content).map(function(child){return{elem:"layout-unit",content:child}})
}content[0].mods={position:"first"};content[content.length-1].mods={position:"last"};ctx.content({elem:"layout",content:content},true)
});bh.match("b-menu-horiz__item",function(ctx){ctx.tag("div")});bh.match("b-menu-horiz__layout",function(ctx){ctx.tag("ul",true)
});bh.match("b-menu-horiz__layout-unit",function(ctx){ctx.tag("li",true)});bh.match("b-menu-vert",function(ctx){var content=ctx.content();
if(content){content=[].concat(content).map(function(child){return{elem:"layout-unit",content:child}})
}content[0].mods={position:"first"};content[content.length-1].mods={position:"last"};ctx.content({elem:"layout",content:content},true)
});bh.match("b-head-search__arr-i",function(ctx){ctx.tag("i",true)});bh.match("app__icon",function(ctx){var url=ctx.param("url");
if(url){ctx.tag("img");ctx.attr("src",ctx.param("url"));ctx.attr("alt",ctx.param("alt"))}ctx.js(true);
ctx.param("alt")&&ctx.attr("title",ctx.param("alt"))});bh.match("app__btn",function(ctx){ctx.tag("i");
ctx.content({block:"krestik",mods:{size:"small"}})});bh.match("apps__arrow",function(ctx){ctx.tag("a");
ctx.attr("href","#")});bh.match("popup",function(ctx){var mods=ctx.mods();ctx.mods({theme:mods.theme||"ffffff",autoclosable:mods.hasOwnProperty("autoclosable")&&mods.autoclosable||"yes",animate:mods.hasOwnProperty("animate")&&mods.animate||"yes"});
var zIndex=ctx.param("zIndex");if(zIndex){var style=ctx.attr("style")||"";ctx.attr("style",style+"z-index:"+zIndex)
}ctx.content([{elem:"under",mods:ctx.param("underMods")||{}},ctx.content(),ctx.mod("has-close")&&{elem:"close",tag:"i"}],true)
});bh.match("b-icon",function(ctx){if(!ctx.param("url")){ctx.tag("div")}else{ctx.tag("img");ctx.attr("src",ctx.param("url"));
["alt","width","height"].forEach(function(attr){var param=ctx.param(attr);param&&ctx.attr(attr,param);
if(!param&&attr==="alt"){ctx.attr("alt","")}})}});bh.match("b-icon_type_dolan",function(ctx){ctx.tag("div",true)
});bh.match("krestik",function(ctx){ctx.tag("i")});bh.match("auth",function(ctx){var escapeHTML=BEM.blocks["i-common__string"].escapeHTML;
var displayName=ctx.param("username")||"";ctx.tag("a");ctx.attr("aria-expanded","false");ctx.attr("aria-haspopup","true");
ctx.attr("role","button");ctx.attr("href","https://passport.yandex.ru/passport?mode=passport");ctx.content([{elem:"icon",userpic:ctx.param("userpic")},{elem:"name",content:[{elem:"first-letter",content:escapeHTML(displayName.charAt(0))},escapeHTML(displayName.substring(1,displayName.length))]}])
});bh.match("auth__icon",function(ctx){ctx.tag("span");ctx.attr("style","background-image: url("+ctx.param("userpic")+");")
});bh.match("auth__name",function(ctx){ctx.tag("span")});bh.match("auth__first-letter",function(ctx){ctx.tag("span")
});bh.match("menu",function(ctx){ctx.content({elem:"content",content:ctx.content()},true)});bh.match("menu__content",function(ctx){ctx.tag("ul")
});bh.match("menu__item",function(ctx){ctx.tag("li");ctx.content({elem:"item-content",content:ctx.content()},true)
});bh.match("menu__item-content",function(ctx){ctx.content()&&ctx.content({elem:"link",content:ctx.content()},true)
});bh.match("menu__link",function(ctx){ctx.tag("a")});bh.match("menu__hr",function(ctx){ctx.tag("li")
});bh.match("menu__tick",function(ctx){ctx.tag("span")});bh.match("menu__icon",function(ctx){ctx.tag("img");
ctx.attr("src",ctx.param("url"))});bh.match("menu__name",function(ctx){ctx.tag("span")});bh.match("menu__inner",function(ctx){ctx.tag("span")
});bh.match("sync-properties__text",function(ctx){ctx.tag("span")});bh.match("b-spin",function(ctx){var theme=ctx.mod("theme")||"grey-27";
ctx.mods({size:ctx.mod("size")||theme&&/[\d]+/.exec(theme)[0]||27,theme:theme},true);ctx.js(true);ctx.content({block:"b-icon",mix:[{block:"b-spin",elem:"icon"}]})
});bh.match("b-dropdowna",function(ctx){ctx.mods({"is-bem":"yes"},true);ctx.js(true,true)});bh.match("b-popupa__tail",function(ctx){ctx.tag("i")
});bh.match("b-link_pseudo_yes",function(ctx){ctx.tag(ctx.param("url")?"a":"span");ctx.js(true);var mods=ctx.mods();
if(!mods.inner){ctx.content({elem:"inner",content:ctx.content()},true)}});bh.match("b-link__inner",function(ctx){ctx.tag("span")
});bh.match("b-dropdowna__arr",function(ctx){ctx.tag("span",true)});bh.match("b-popupa__content",function(ctx){return[{elem:"shadow"},{elem:"wrap",content:ctx.json()}]
});bh.match("b-vb",function(ctx){ctx.tag("table");ctx.attr("cellpadding","0");ctx.attr("cellspacing","0")
});bh.match("b-vb__content",function(ctx){ctx.tag("tr");ctx.content([{elem:"td",tag:"td",content:ctx.content()}],true)
});bh.match("advert__skin",function(ctx){ctx.tag("img");ctx.attr("src",ctx.param("url"))});bh.match("b-vb__head",function(ctx){ctx.tag("tr");
ctx.content([{elem:"td",tag:"td",content:ctx.content()}],true)});bh.match("b-head-logo",function(ctx){ctx.attr("role","header")
});bh.match("b-head-logo__link",function(ctx){ctx.tag("a");ctx.attr("href",ctx.param("url"))});bh.match("b-head-logo__img",function(ctx){ctx.tag("img");
ctx.attr("src",ctx.param("url"));ctx.attr("alt","yandex");ctx.attr("style","border: 0;")});bh.match("b-head-search",function(ctx){ctx.content([{elem:"wrap",mix:[{elem:"arrow"}],content:[{elem:"arr",tag:"i",content:[{elem:"arr-i"}]},ctx.content()]}],true)
});bh.match("b-form-input",function(ctx){ctx.tag("span");window.uniqId=window.uniqId||0;var placeholder=ctx.param("placeholder"),inputId="uniq"+window.uniqId++,role=ctx.param("role"),aria=ctx.param("aria"),inputAttrs={id:inputId,name:ctx.param("name")||"",value:"",autocomplete:"off"};
if(role){inputAttrs.role=role}if(aria){inputAttrs["aria-label"]=aria}ctx.content([placeholder&&{elem:"hint-wrap",tag:"span",content:{elem:"hint",tag:"label",mods:{visibility:"visible"},attrs:{"for":inputId},content:placeholder}},{elem:"box",tag:"span",content:[{elem:"input",tag:"input",attrs:inputAttrs}]}],true)
});bh.match("b-search",function(ctx){ctx.tag("form");ctx.content([{elem:"table",tag:"table",content:ctx.content()}],true)
});bh.match("b-search__row",function(ctx){ctx.tag("tr")});bh.match("b-search__col",function(ctx){ctx.tag("td")
});bh.match("b-tumb__fav",function(ctx){ctx.tag("span")});bh.match("b-vb-foot",function(ctx){ctx.content([{elem:"wrapper",content:ctx.content()}],true)
});bh.match("b-properties-popup__select-title",function(ctx){ctx.tag("span")});bh.match("b-form-select",function(ctx){ctx.tag("span");
ctx.js(true)});bh.match("b-form-select__select",function(ctx){ctx.tag("select")});bh.match("b-form-select__option",function(ctx){ctx.tag("option")
});bh.match("b-form-slider",function(ctx){ctx.mod("input","hidden");ctx.content([ctx.content(),{elem:"body",mods:{origin:"x"},content:{elem:"click"}}],true)
});bh.match("b-select-theme",function(ctx){ctx.content([{elem:"arrow",elemMods:{type:"left"}},{elem:"arrow",elemMods:{type:"right"}},{elem:"slider",content:{elem:"box",content:ctx.content()}},{elem:"input"}],true)
});bh.match("b-select-theme__input",function(ctx){ctx.tag("input");ctx.attr("type","file");ctx.attr("style","position:fixed; left: -999px;");
ctx.attr("accept","image/*")});bh.match("b-form-checkbox",function(ctx){ctx.tag("span");var attrs=ctx.param("checkboxAttrs");
var checked=ctx.mod("checked");if(checked)attrs.checked="checked";ctx.content([{tag:"span",elem:"inner",content:[{elem:"checkbox",attrs:attrs},{elem:"bg",tag:"i",content:[{elem:"tick",tag:"img"}]}]}],true);
ctx.js(true,true)});bh.match("b-form-checkbox__tick",function(ctx){ctx.attr("src","chrome://yandex-vb/content/fastdial/layout/_/La6qi18Z8LwgnZdsAr1qy1GwCwo.gif",true);
ctx.attr("title","",true)});bh.match("b-form-checkbox__checkbox",function(ctx){ctx.tag("input",true);
ctx.attr("type","checkbox",true)});bh.match("b-form-checkbox_type_islands",function(ctx){ctx.tag("span");
var attrs=ctx.param("checkboxAttrs");attrs.type="checkbox";var checked=ctx.mod("checked");var boxMods={};
if(checked){attrs.checked="checked";boxMods.checked="yes";ctx.mod("checked","yes",true)}ctx.content({elem:"box",tag:"span",mods:boxMods,content:[{elem:"control",tag:"input",attrs:attrs},{elem:"tick",tag:"i"}]});
ctx.stop()});bh.match("b-setting",function(ctx){ctx.tag("form");ctx.attr("action","");ctx.attr("method","post")
});bh.match("radio-button__radio",function(ctx){ctx.tag("label");var controlAttrs=ctx.param("controlAttrs")||{},modsDisabled=ctx.tParam("modsDisabled"),nextForChecked=ctx.tParam("nextForChecked"),controlMods=ctx.mods()||{};
if(modsDisabled){controlMods.disabled="yes"}if(nextForChecked&&!controlMods.checked){controlMods["next-for-pressed"]="yes";
nextForChecked=false}if(controlAttrs.value!==undefined&&controlAttrs.value==ctx.tParam("value")){controlMods.pressed="yes";
controlMods.checked="yes";nextForChecked=true}if(!controlMods.side){controlMods.side=ctx.isFirst()?ctx.isLast()?"both":"left":ctx.isLast()?"right":""
}controlAttrs.id=controlAttrs.id||ctx.generateId();controlAttrs["for"]=controlAttrs.id;Object.keys(controlAttrs).forEach(function(attrName){var attrVal=controlAttrs[attrName];
ctx.attr(attrName,attrVal)});ctx.mods(controlMods);ctx.tParam("nextForChecked",nextForChecked);ctx.tParam("controlAttrs",controlAttrs);
ctx.tParam("controlMods",controlMods);ctx.content([{elem:"control"},{elem:"text",tag:"span",content:ctx.content()}],true)
});bh.match("radio-button__control",function(ctx){ctx.tag("input");var controlAttrs=ctx.tParam("controlAttrs"),controlMods=ctx.tParam("controlMods");
if(controlMods.checked){controlAttrs.checked="checked"}if(controlMods.disabled){controlAttrs.disabled="disabled";
controlAttrs.tabindex="-1"}controlAttrs.type="radio";controlAttrs.name=ctx.tParam("name");Object.keys(controlAttrs).forEach(function(attrName){var attrVal=controlAttrs[attrName];
ctx.attr(attrName,attrVal)})});bh.match("radio-button__text",function(ctx){ctx.tag("span")});bh.match("radio-button",function(ctx){ctx.mod("theme","normal");
ctx.tParam("name",ctx.param("name"));ctx.tParam("value",ctx.param("value"));ctx.tParam("nextForChecked",false);
ctx.tParam("modsDisabled",ctx.mod("disabled"));ctx.tag("span");ctx.js(true)});bh.match("b-setting__close",function(ctx){ctx.content({block:"krestik",mods:{size:"big"}})
});bh.match("b-tumbs-lib__arrow",function(ctx){ctx.tag("a");ctx.attr("href","#")});var BEMHTML=bh;return BEMHTML
},bem:function(require){(function($){var hasIntrospection=function(){_}.toString().indexOf("_")>-1,emptyBase=function(){},objCreate=Object.create||function(ptp){var inheritance=function(){};
inheritance.prototype=ptp;return new inheritance},needCheckProps=true,testPropObj={toString:""};for(var i in testPropObj){testPropObj.hasOwnProperty(i)&&(needCheckProps=false)
}var specProps=needCheckProps?["toString","valueOf"]:null;function override(base,result,add){var hasSpecProps=false;
if(needCheckProps){var addList=[];$.each(specProps,function(){add.hasOwnProperty(this)&&(hasSpecProps=true)&&addList.push({name:this,val:add[this]})
});if(hasSpecProps){$.each(add,function(name){addList.push({name:name,val:this})});add=addList}}$.each(add,function(name,prop){if(hasSpecProps){name=prop.name;
prop=prop.val}if($.isFunction(prop)&&(!hasIntrospection||prop.toString().indexOf(".__base")>-1)){var baseMethod=base[name]||function(){};
result[name]=function(){var baseSaved=this.__base;this.__base=baseMethod;var result=prop.apply(this,arguments);
this.__base=baseSaved;return result}}else{result[name]=prop}})}$.inherit=function(){var args=arguments,hasBase=$.isFunction(args[0]),base=hasBase?args[0]:emptyBase,props=args[hasBase?1:0]||{},staticProps=args[hasBase?2:1],result=props.__constructor||hasBase&&base.prototype.__constructor?function(){return this.__constructor.apply(this,arguments)
}:function(){};if(!hasBase){result.prototype=props;result.prototype.__self=result.prototype.constructor=result;
return $.extend(result,staticProps)}$.extend(result,base);var basePtp=base.prototype,resultPtp=result.prototype=objCreate(basePtp);
resultPtp.__self=resultPtp.constructor=result;override(basePtp,resultPtp,props);staticProps&&override(base,result,staticProps);
return result};$.inheritSelf=function(base,props,staticProps){var basePtp=base.prototype;override(basePtp,basePtp,props);
staticProps&&override(base,base,staticProps);return base}})(jQuery);(function($){var counter=0,expando="__"+ +new Date,get=function(){return"uniq"+ ++counter
};$.identify=function(obj,onlyGet){if(!obj)return get();var key="uniqueID"in obj?"uniqueID":expando;return onlyGet||key in obj?obj[key]:obj[key]=get()
}})(jQuery);(function($){$.isEmptyObject||($.isEmptyObject=function(obj){for(var i in obj)return false;
return true})})(jQuery);(function($){$.extend({debounce:function(fn,timeout,invokeAsap,ctx){if(arguments.length==3&&typeof invokeAsap!="boolean"){ctx=invokeAsap;
invokeAsap=false}var timer;return function(){var args=arguments;ctx=ctx||this;invokeAsap&&!timer&&fn.apply(ctx,args);
clearTimeout(timer);timer=setTimeout(function(){invokeAsap||fn.apply(ctx,args);timer=null},timeout)}},throttle:function(fn,timeout,ctx){var timer,args,needInvoke;
return function(){args=arguments;needInvoke=true;ctx=ctx||this;timer||function(){if(needInvoke){fn.apply(ctx,args);
needInvoke=false;timer=setTimeout(arguments.callee,timeout)}else{timer=null}}()}}})})(jQuery);(function($){var storageExpando="__"+ +new Date+"storage",getFnId=function(fn,ctx){return $.identify(fn)+(ctx?$.identify(ctx):"")
},Observable={buildEventName:function(e){return e},on:function(e,data,fn,ctx,_special){if(typeof e=="string"){if($.isFunction(data)){ctx=fn;
fn=data;data=undefined}var id=getFnId(fn,ctx),storage=this[storageExpando]||(this[storageExpando]={}),eList=e.split(" "),i=0,eStorage;
while(e=eList[i++]){e=this.buildEventName(e);eStorage=storage[e]||(storage[e]={ids:{},list:{}});if(!(id in eStorage.ids)){var list=eStorage.list,item={fn:fn,data:data,ctx:ctx,special:_special};
if(list.last){list.last.next=item;item.prev=list.last}else{list.first=item}eStorage.ids[id]=list.last=item
}}}else{var _this=this;$.each(e,function(e,fn){_this.on(e,fn,data,_special)})}return this},onFirst:function(e,data,fn,ctx){return this.on(e,data,fn,ctx,{one:true})
},un:function(e,fn,ctx){if(typeof e=="string"||typeof e=="undefined"){var storage=this[storageExpando];
if(storage){if(e){var eList=e.split(" "),i=0,eStorage;while(e=eList[i++]){e=this.buildEventName(e);if(eStorage=storage[e]){if(fn){var id=getFnId(fn,ctx),ids=eStorage.ids;
if(id in ids){var list=eStorage.list,item=ids[id],prev=item.prev,next=item.next;if(prev){prev.next=next
}else if(item===list.first){list.first=next}if(next){next.prev=prev}else if(item===list.last){list.last=prev
}delete ids[id]}}else{delete this[storageExpando][e]}}}}else{delete this[storageExpando]}}}else{var _this=this;
$.each(e,function(e,fn){_this.un(e,fn,ctx)})}return this},trigger:function(e,data){var _this=this,storage=_this[storageExpando],rawType;
typeof e==="string"?e=$.Event(_this.buildEventName(rawType=e)):e.type=_this.buildEventName(rawType=e.type);
e.target||(e.target=_this);if(storage&&(storage=storage[e.type])){var item=storage.list.first,ret;while(item){e.data=item.data;
ret=item.fn.call(item.ctx||_this,e,data);if(typeof ret!=="undefined"){e.result=ret;if(ret===false){e.preventDefault();
e.stopPropagation()}}item.special&&item.special.one&&_this.un(rawType,item.fn,item.ctx);item=item.next
}}return this}};$.observable=$.inherit(Observable,Observable)})(jQuery);(function($,undefined){var afterCurrentEventFns=[],blocks={},channels={};
function buildModFnName(elemName,modName,modVal){return(elemName?"__elem_"+elemName:"")+"__mod"+(modName?"_"+modName:"")+(modVal?"_"+modVal:"")
}function modFnsToProps(modFns,props,elemName){$.isFunction(modFns)?props[buildModFnName(elemName,"*","*")]=modFns:$.each(modFns,function(modName,modFn){$.isFunction(modFn)?props[buildModFnName(elemName,modName,"*")]=modFn:$.each(modFn,function(modVal,modFn){props[buildModFnName(elemName,modName,modVal)]=modFn
})})}function buildCheckMod(modName,modVal){return modVal?Array.isArray(modVal)?function(block){var i=0,len=modVal.length;
while(i<len)if(block.hasMod(modName,modVal[i++]))return true;return false}:function(block){return block.hasMod(modName,modVal)
}:function(block){return block.hasMod(modName)}}this.BEM=$.inherit($.observable,{__constructor:function(mods,params,initImmediately){var _this=this;
_this._modCache=mods||{};_this._processingMods={};_this._params=params;_this.params=null;initImmediately!==false?_this._init():_this.afterCurrentEvent(function(){_this._init()
})},_init:function(){if(!this._initing&&!this.hasMod("js","inited")){this._initing=true;if(!this.params){this.params=$.extend(this.getDefaultParams(),this._params);
delete this._params}this.setMod("js","inited");delete this._initing;this.hasMod("js","inited")&&this.trigger("init")
}return this},changeThis:function(fn,ctx){return fn.bind(ctx||this)},afterCurrentEvent:function(fn,ctx){this.__self.afterCurrentEvent(this.changeThis(fn,ctx))
},trigger:function(e,data){this.__base(e=this.buildEvent(e),data).__self.trigger(e,data);return this},buildEvent:function(e){typeof e=="string"&&(e=$.Event(e));
e.block=this;return e},hasMod:function(elem,modName,modVal){var len=arguments.length,invert=false;if(len==1){modVal="";
modName=elem;elem=undefined;invert=true}else if(len==2){if(typeof elem=="string"){modVal=modName;modName=elem;
elem=undefined}else{modVal="";invert=true}}var res=this.getMod(elem,modName)===modVal;return invert?!res:res
},getMod:function(elem,modName){var type=typeof elem;if(type==="string"||type==="undefined"){modName=elem||modName;
var modCache=this._modCache;return modName in modCache?modCache[modName]:modCache[modName]=this._extractModVal(modName)
}return this._getElemMod(modName,elem)},_getElemMod:function(modName,elem,elemName){return this._extractModVal(modName,elem,elemName)
},getMods:function(elem){var hasElem=elem&&typeof elem!="string",_this=this,modNames=[].slice.call(arguments,hasElem?1:0),res=_this._extractMods(modNames,hasElem?elem:undefined);
if(!hasElem){modNames.length?modNames.forEach(function(name){_this._modCache[name]=res[name]}):_this._modCache=res
}return res},setMod:function(elem,modName,modVal){if(typeof modVal=="undefined"){modVal=modName;modName=elem;
elem=undefined}var _this=this;if(!elem||elem[0]){var modId=(elem&&elem[0]?$.identify(elem[0]):"")+"_"+modName;
if(this._processingMods[modId])return _this;var elemName,curModVal=elem?_this._getElemMod(modName,elem,elemName=_this.__self._extractElemNameFrom(elem)):_this.getMod(modName);
if(curModVal===modVal)return _this;this._processingMods[modId]=true;var needSetMod=true,modFnParams=[modName,modVal,curModVal];
elem&&modFnParams.unshift(elem);[["*","*"],[modName,"*"],[modName,modVal]].forEach(function(mod){needSetMod=_this._callModFn(elemName,mod[0],mod[1],modFnParams)!==false&&needSetMod
});!elem&&needSetMod&&(_this._modCache[modName]=modVal);needSetMod&&_this._afterSetMod(modName,modVal,curModVal,elem,elemName);
delete this._processingMods[modId]}return _this},_afterSetMod:function(modName,modVal,oldModVal,elem,elemName){},toggleMod:function(elem,modName,modVal1,modVal2,condition){if(typeof elem=="string"){condition=modVal2;
modVal2=modVal1;modVal1=modName;modName=elem;elem=undefined}if(typeof modVal2=="undefined"){modVal2=""
}else if(typeof modVal2=="boolean"){condition=modVal2;modVal2=""}var modVal=this.getMod(elem,modName);
(modVal==modVal1||modVal==modVal2)&&this.setMod(elem,modName,typeof condition==="boolean"?condition?modVal1:modVal2:this.hasMod(elem,modName,modVal1)?modVal2:modVal1);
return this},delMod:function(elem,modName){if(!modName){modName=elem;elem=undefined}return this.setMod(elem,modName,"")
},_callModFn:function(elemName,modName,modVal,modFnParams){var modFnName=buildModFnName(elemName,modName,modVal);
return this[modFnName]?this[modFnName].apply(this,modFnParams):undefined},_extractModVal:function(modName,elem){return""
},_extractMods:function(modNames,elem){return{}},channel:function(id,drop){return this.__self.channel(id,drop)
},getDefaultParams:function(){return{}},del:function(obj){var args=[].slice.call(arguments);typeof obj=="string"&&args.unshift(this);
this.__self.del.apply(this.__self,args);return this},destruct:function(){}},{_name:"i-bem",blocks:blocks,decl:function(decl,props,staticProps){if(typeof decl=="string")decl={block:decl};
else if(decl.name){decl.block=decl.name}if(decl.baseBlock&&!blocks[decl.baseBlock])throw'baseBlock "'+decl.baseBlock+'" for "'+decl.block+'" is undefined';
props||(props={});if(props.onSetMod){modFnsToProps(props.onSetMod,props);delete props.onSetMod}if(props.onElemSetMod){$.each(props.onElemSetMod,function(elemName,modFns){modFnsToProps(modFns,props,elemName)
});delete props.onElemSetMod}var baseBlock=blocks[decl.baseBlock||decl.block]||this;if(decl.modName){var checkMod=buildCheckMod(decl.modName,decl.modVal);
$.each(props,function(name,prop){$.isFunction(prop)&&(props[name]=function(){var method;if(checkMod(this)){method=prop
}else{var baseMethod=baseBlock.prototype[name];baseMethod&&baseMethod!==props[name]&&(method=this.__base)
}return method?method.apply(this,arguments):undefined})})}if(staticProps&&typeof staticProps.live==="boolean"){var live=staticProps.live;
staticProps.live=function(){return live}}var block;decl.block==baseBlock._name?(block=$.inheritSelf(baseBlock,props,staticProps))._processLive(true):(block=blocks[decl.block]=$.inherit(baseBlock,props,staticProps))._name=decl.block;
return block},_processLive:function(heedLive){return false},create:function(block,params){typeof block=="string"&&(block={block:block});
return new blocks[block.block](block.mods,params)},getName:function(){return this._name},_extractElemNameFrom:function(elem){},afterCurrentEvent:function(fn,ctx){afterCurrentEventFns.push({fn:fn,ctx:ctx})==1&&setTimeout(this._runAfterCurrentEventFns,0)
},_runAfterCurrentEventFns:function(){var fnsLen=afterCurrentEventFns.length;if(fnsLen){var fnObj,fnsCopy=afterCurrentEventFns.splice(0,fnsLen);
while(fnObj=fnsCopy.shift())fnObj.fn.call(fnObj.ctx||this)}},changeThis:function(fn,ctx){return fn.bind(ctx||this)
},del:function(obj){var delInThis=typeof obj=="string",i=delInThis?0:1,len=arguments.length;delInThis&&(obj=this);
while(i<len)delete obj[arguments[i++]];return this},channel:function(id,drop){if(typeof id=="boolean"){drop=id;
id=undefined}id||(id="default");if(drop){if(channels[id]){channels[id].un();delete channels[id]}return
}return channels[id]||(channels[id]=new $.observable)}})})(jQuery);(function(){Object.keys||(Object.keys=function(obj){var res=[];
for(var i in obj)obj.hasOwnProperty(i)&&res.push(i);return res})})();(function(){var ptp=Array.prototype,toStr=Object.prototype.toString,methods={indexOf:function(item,fromIdx){fromIdx=+(fromIdx||0);
var t=this,len=t.length;if(len>0&&fromIdx<len){fromIdx=fromIdx<0?Math.ceil(fromIdx):Math.floor(fromIdx);
fromIdx<-len&&(fromIdx=0);fromIdx<0&&(fromIdx=fromIdx+len);while(fromIdx<len){if(fromIdx in t&&t[fromIdx]===item)return fromIdx;
++fromIdx}}return-1},forEach:function(callback,ctx){var i=-1,t=this,len=t.length;while(++i<len)i in t&&(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t))
},map:function(callback,ctx){var i=-1,t=this,len=t.length,res=new Array(len);while(++i<len)i in t&&(res[i]=ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t));
return res},filter:function(callback,ctx){var i=-1,t=this,len=t.length,res=[];while(++i<len)i in t&&(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t))&&res.push(t[i]);
return res},reduce:function(callback,initialVal){var i=-1,t=this,len=t.length,res;if(arguments.length<2){while(++i<len){if(i in t){res=t[i];
break}}}else{res=initialVal}while(++i<len)i in t&&(res=callback(res,t[i],i,t));return res},some:function(callback,ctx){var i=-1,t=this,len=t.length;
while(++i<len)if(i in t&&(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t)))return true;return false
},every:function(callback,ctx){var i=-1,t=this,len=t.length;while(++i<len)if(i in t&&!(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t)))return false;
return true}};for(var name in methods)ptp[name]||(ptp[name]=methods[name]);Array.isArray||(Array.isArray=function(obj){return toStr.call(obj)==="[object Array]"
})})();(function(){var slice=Array.prototype.slice;Function.prototype.bind||(Function.prototype.bind=function(ctx){var fn=this,args=slice.call(arguments,1);
return function(){return fn.apply(ctx,args.concat(slice.call(arguments)))}})})();(function(BEM,$,undefined){var MOD_DELIM="_",ELEM_DELIM="__",NAME_PATTERN="[a-zA-Z0-9-]+";
function buildModPostfix(modName,modVal,buffer){buffer.push(MOD_DELIM,modName,MOD_DELIM,modVal)}function buildBlockClass(name,modName,modVal,buffer){buffer.push(name);
modVal&&buildModPostfix(modName,modVal,buffer)}function buildElemClass(block,name,modName,modVal,buffer){buildBlockClass(block,undefined,undefined,buffer);
buffer.push(ELEM_DELIM,name);modVal&&buildModPostfix(modName,modVal,buffer)}BEM.INTERNAL={NAME_PATTERN:NAME_PATTERN,MOD_DELIM:MOD_DELIM,ELEM_DELIM:ELEM_DELIM,buildModPostfix:function(modName,modVal,buffer){var res=buffer||[];
buildModPostfix(modName,modVal,res);return buffer?res:res.join("")},buildClass:function(block,elem,modName,modVal,buffer){var typeOf=typeof modName;
if(typeOf=="string"){if(typeof modVal!="string"&&typeof modVal!="number"){buffer=modVal;modVal=modName;
modName=elem;elem=undefined}}else if(typeOf!="undefined"){buffer=modName;modName=undefined}else if(elem&&typeof elem!="string"){buffer=elem;
elem=undefined}if(!(elem||modName||buffer)){return block}var res=buffer||[];elem?buildElemClass(block,elem,modName,modVal,res):buildBlockClass(block,modName,modVal,res);
return buffer?res:res.join("")},buildClasses:function(block,elem,mods,buffer){if(elem&&typeof elem!="string"){buffer=mods;
mods=elem;elem=undefined}var res=buffer||[];elem?buildElemClass(block,elem,undefined,undefined,res):buildBlockClass(block,undefined,undefined,res);
mods&&$.each(mods,function(modName,modVal){if(modVal){res.push(" ");elem?buildElemClass(block,elem,modName,modVal,res):buildBlockClass(block,modName,modVal,res)
}});return buffer?res:res.join("")}}})(BEM,jQuery);jQuery.cookie=function(name,value,options){if(typeof value!="undefined"){options=options||{};
if(value===null){value="";options.expires=-1}var expires="";if(options.expires&&(typeof options.expires=="number"||options.expires.toUTCString)){var date;
if(typeof options.expires=="number"){date=new Date;date.setTime(date.getTime()+options.expires*24*60*60*1e3)
}else{date=options.expires}expires="; expires="+date.toUTCString()}var path=options.path?"; path="+options.path:"";
var domain=options.domain?"; domain="+options.domain:"";var secure=options.secure?"; secure":"";document.cookie=[name,"=",encodeURIComponent(value),expires,path,domain,secure].join("")
}else{var cookieValue=null;if(document.cookie&&document.cookie!=""){var cookies=document.cookie.split(";");
for(var i=0;i<cookies.length;i++){var cookie=jQuery.trim(cookies[i]);if(cookie.substring(0,name.length+1)==name+"="){cookieValue=decodeURIComponent(cookie.substring(name.length+1));
break}}}return cookieValue}};(function($){var map={"%D0":"%D0%A0","%C0":"%D0%90","%C1":"%D0%91","%C2":"%D0%92","%C3":"%D0%93","%C4":"%D0%94","%C5":"%D0%95","%A8":"%D0%81","%C6":"%D0%96","%C7":"%D0%97","%C8":"%D0%98","%C9":"%D0%99","%CA":"%D0%9A","%CB":"%D0%9B","%CC":"%D0%9C","%CD":"%D0%9D","%CE":"%D0%9E","%CF":"%D0%9F","%D1":"%D0%A1","%D2":"%D0%A2","%D3":"%D0%A3","%D4":"%D0%A4","%D5":"%D0%A5","%D6":"%D0%A6","%D7":"%D0%A7","%D8":"%D0%A8","%D9":"%D0%A9","%DA":"%D0%AA","%DB":"%D0%AB","%DC":"%D0%AC","%DD":"%D0%AD","%DE":"%D0%AE","%DF":"%D0%AF","%E0":"%D0%B0","%E1":"%D0%B1","%E2":"%D0%B2","%E3":"%D0%B3","%E4":"%D0%B4","%E5":"%D0%B5","%B8":"%D1%91","%E6":"%D0%B6","%E7":"%D0%B7","%E8":"%D0%B8","%E9":"%D0%B9","%EA":"%D0%BA","%EB":"%D0%BB","%EC":"%D0%BC","%ED":"%D0%BD","%EE":"%D0%BE","%EF":"%D0%BF","%F0":"%D1%80","%F1":"%D1%81","%F2":"%D1%82","%F3":"%D1%83","%F4":"%D1%84","%F5":"%D1%85","%F6":"%D1%86","%F7":"%D1%87","%F8":"%D1%88","%F9":"%D1%89","%FA":"%D1%8A","%FB":"%D1%8B","%FC":"%D1%8C","%FD":"%D1%8D","%FE":"%D1%8E","%FF":"%D1%8F"};
function convert(str){return str.replace(/%.{2}/g,function($0){return map[$0]||$0})}function decode(func,str){var decoded="";
try{decoded=func(str)}catch(e){try{decoded=func(convert(str))}catch(e){decoded=str}}return decoded}$.extend({decodeURI:function(str){return decode(decodeURI,str)
},decodeURIComponent:function(str){return decode(decodeURIComponent,str)}})})(jQuery);(function(BEM,$,undefined){var INTERNAL=BEM.INTERNAL,ELEM_DELIM=INTERNAL.ELEM_DELIM,SHORT_TAGS={area:1,base:1,br:1,col:1,command:1,embed:1,hr:1,img:1,input:1,keygen:1,link:1,meta:1,param:1,source:1,wbr:1},buildClass=INTERNAL.buildClass,buildClasses=INTERNAL.buildClasses,decls={};
function addPropToDecl(decl,name,fn){(decl[name]||(decl[name]=[])).unshift(fn)}function buildDeclFn(fn,desc){return desc.modName?function(ctx){(ctx._curBlock.mods||{})[desc.modName]===desc.modVal&&fn(ctx)
}:fn}function join(a,b){var isArrayB=$.isArray(b),res;$.isArray(a)?isArrayB?res=a.concat(b):(res=a).push(b):isArrayB?(res=b).unshift(a):res=[a,b];
return res}var attrEscapes={'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;"},attrEscapesRE=/["&<>]/g;function escapeAttr(attrVal){return attrVal.replace(attrEscapesRE,function(needToEscape){return attrEscapes[needToEscape]
})}BEM.HTML={decl:function(desc,props){typeof desc=="string"&&(desc={block:desc});desc.name&&(desc.block=desc.name);
var decl=decls[desc.block]||(decls[desc.block]={});props.onBlock&&addPropToDecl(decl,"_block",buildDeclFn(props.onBlock,desc));
if(props.onElem){$.isFunction(props.onElem)?addPropToDecl(decl,"_elem",buildDeclFn(props.onElem,desc)):$.each(props.onElem,function(elem,fn){addPropToDecl(decl,"_elem"+(elem==="*"?"":ELEM_DELIM+elem),buildDeclFn(fn,desc))
})}},build:function(params){var builder=new this.Ctx(params);builder._buildAll();return builder._flush()
},Ctx:$.inherit({__constructor:function(params){this._buffer=[];this._params=params;this._tParams=null;
this._tParamsChanges=null;this._curBlock=undefined},pos:function(){return this._params._pos},isFirst:function(){return this._params._pos===1
},isLast:function(){var params=this._params;return params._pos===params._siblingsCount},params:function(params){var _this=this;
if(typeof params=="undefined")return _this._params;_this._params=params;return _this},param:function(name,val,force,needExtend){var _this=this,params=_this._params;
if(typeof val=="undefined")return params[name];if(force||!(name in params)){params[name]=val}else if(needExtend){params[name]=$.extend(val,params[name])
}return _this},attrs:function(val,force){return this.param("attrs",val,force,true)},attr:function(name,val,force){var _this=this;
if(typeof val=="undefined")return(_this._params.attrs||{})[name];var attrs=_this._params.attrs;attrs?(force||!(name in attrs))&&(attrs[name]=val):(_this._params.attrs={})[name]=val;
return _this},tag:function(val,force){return this.param("tag",val,force)},cls:function(val,force){return this.param("cls",val,force)
},mods:function(val,force){return this.param("mods",val,force,true)},mod:function(name,val,force){var _this=this;
if(typeof val=="undefined")return(_this._params.mods||{})[name];var mods=_this._params.mods;mods?(force||!(name in mods))&&(mods[name]=val):(_this._params.mods={})[name]=val;
return _this},mix:function(val,force){var _this=this,params=_this._params;if(typeof val=="undefined")return params.mix;
if(force||!("mix"in params)){params.mix=val}else{params.mix=params.mix.concat(val)}return _this},js:function(val){return this.param("js",val)
},content:function(val,force){return this.param("content",val,force)},wrapContent:function(obj){var _this=this,params=_this._params;
obj.content=params.content;params.content=obj;return _this},beforeContent:function(obj){var _this=this,params=_this._params;
params.content=join(obj,params.content);return _this},afterContent:function(obj){var _this=this,params=_this._params;
params.content=join(params.content,obj);return _this},wrap:function(obj){var _this=this,params=_this._params;
obj.block||(obj._curBlock=_this._curBlock);obj.content=params._wrapper?params._wrapper:params;params._wrapper=obj;
return _this},tParam:function(name,val){var _this=this,tParams=_this._tParams||(_this._tParams={});if(typeof val=="undefined")return tParams[name];
var tParamsChanges=_this._tParamsChanges||(_this._tParamsChanges={});name in tParamsChanges||(tParamsChanges[name]=tParams[name]);
tParams[name]=val;return _this},generateId:function(){return $.identify()},stop:function(){this._params._isStopped=true
},_buildAll:function(){var _this=this,buffer=_this._buffer,params=_this._params,paramsType=typeof params;
if(paramsType=="string"||paramsType=="number"){buffer.push(params)}else if($.isArray(params)){var i=0,len=params.length,currParams,currParamsType;
while(i<len){_this._params=currParams=params[i++];currParamsType=typeof currParams;if(currParamsType=="string"||currParamsType=="number"){buffer.push(currParams)
}else if(currParams){currParams._pos=i;currParams._siblingsCount=len;_this._buildByDecl()}}}else if(params){_this._params._pos=_this._params._siblingsCount=1;
_this._buildByDecl()}},_build:function(){var _this=this,buffer=_this._buffer,params=_this._params,tag=params.tag||"div",jsParams,isBEM=params.block||params.elem,curBlock=isBEM&&(params.block||_this._curBlock.block),addInitingCls=false;
if(params.js){(jsParams={})[buildClass(curBlock,params.elem)]=params.js===true?{}:params.js;addInitingCls=!params.elem
}buffer.push("<",tag);if(isBEM||params.cls){buffer.push(' class="');if(isBEM){buildClasses(curBlock,params.elem,params.mods,buffer);
params.mix&&$.each(params.mix,function(i,mix){if(mix){buffer.push(" ");buildClasses(mix.block,mix.elem,mix.mods,buffer);
if(mix.js){(jsParams||(jsParams={}))[buildClass(mix.block,mix.elem)]=mix.js===true?{}:mix.js;addInitingCls||(addInitingCls=!mix.elem)
}}})}params.cls&&buffer.push(isBEM?" ":"",params.cls);addInitingCls&&buffer.push(" i-bem");buffer.push('"')
}jsParams&&buffer.push(' data-bem="',escapeAttr(JSON.stringify(jsParams)),'"');params.attrs&&$.each(params.attrs,function(name,val){typeof val!="undefined"&&val!==null&&val!==false&&buffer.push(" ",name,'="',val.toString().replace(/"/g,"&quot;"),'"')
});if(SHORT_TAGS[tag]){buffer.push("/>")}else{buffer.push(">");if(typeof params.content!="undefined"){_this._params=params.content;
_this._buildAll()}buffer.push("</",tag,">")}},_flush:function(){var res=this._buffer.join("");delete this._buffer;
return res},_buildByDecl:function(){var _this=this,currBlock=_this._curBlock,params=_this._params;params._curBlock&&(_this._curBlock=params._curBlock);
params.block&&(_this._curBlock=params);if(!params._wrapper){if(params.block||params.elem){var decl=decls[_this._curBlock.block];
if(decl){var fns;if(params.elem){fns=decl["_elem"+ELEM_DELIM+params.elem];decl._elem&&(fns=fns?fns.concat(decl._elem):decl._elem)
}else{fns=decl._block}if(fns){var i=0,fn;while(fn=fns[i++]){fn(_this);if(params._isStopped)break}}}}if(params._wrapper){params._curBlock=_this._curBlock;
_this._params=params._wrapper;return _this._buildAll()}}var tParamsChanges=_this._tParamsChanges;_this._tParamsChanges=null;
_this._build();_this._curBlock=currBlock;if(tParamsChanges){var tParams=_this._tParams;$.each(tParamsChanges,function(name,val){typeof val=="undefined"?delete tParams[name]:tParams[name]=val
})}}})}})(BEM,jQuery);(function(undefined){if(window.JSON)return;var _toString=Object.prototype.toString,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},stringify;
window.JSON={stringify:stringify=function(val){if(val===null){return"null"}if(typeof val==="undefined"){return undefined
}switch(_toString.call(val)){case"[object String]":escapable.lastIndex=0;return'"'+(escapable.test(val)?val.replace(escapable,function(a){var c=meta[a];
return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}):val)+'"';case"[object Number]":case"[object Boolean]":return""+val;
case"[object Array]":var res="[",i=0,len=val.length,strVal;while(i<len){strVal=stringify(val[i]);res+=(i++?",":"")+(typeof strVal==="undefined"?"null":strVal)
}return res+"]";case"[object Object]":if(_toString.call(val.toJSON)==="[object Function]"){return stringify(val.toJSON())
}var res="{",i=0,strVal;for(var key in val){if(val.hasOwnProperty(key)){strVal=stringify(val[key]);typeof strVal!=="undefined"&&(res+=(i++?",":"")+'"'+key+'":'+strVal)
}}return res+"}";default:return undefined}}}})();(function(BEM,$,undefined){var win=$(window),doc=$(document),uniqIdToDomElems={},uniqIdToBlock={},domElemToParams={},liveEventCtxStorage={},liveClassEventStorage={},blocks=BEM.blocks,INTERNAL=BEM.INTERNAL,NAME_PATTERN=INTERNAL.NAME_PATTERN,MOD_DELIM=INTERNAL.MOD_DELIM,ELEM_DELIM=INTERNAL.ELEM_DELIM,buildModPostfix=INTERNAL.buildModPostfix,buildClass=INTERNAL.buildClass;
function init(domElem,uniqInitId){var domNode=domElem[0];$.each(getParams(domNode),function(blockName,params){processParams(params,domNode,blockName,uniqInitId);
var block=uniqIdToBlock[params.uniqId];if(block){if(block.domElem.index(domNode)<0){block.domElem=block.domElem.add(domElem);
$.extend(block._params,params)}}else{initBlock(blockName,domElem,params)}})}function initBlock(blockName,domElem,params,forceLive,callback){if(typeof params=="boolean"){callback=forceLive;
forceLive=params;params=undefined}var domNode=domElem[0];params=processParams(params||getParams(domNode)[blockName],domNode,blockName);
var uniqId=params.uniqId;if(uniqIdToBlock[uniqId]){return uniqIdToBlock[uniqId]._init()}uniqIdToDomElems[uniqId]=uniqIdToDomElems[uniqId]?uniqIdToDomElems[uniqId].add(domElem):domElem;
var parentDomNode=domNode.parentNode;if(!parentDomNode||parentDomNode.nodeType===11){$.unique(uniqIdToDomElems[uniqId])
}var blockClass=blocks[blockName]||DOM.decl(blockName,{},{live:true});if(!(blockClass._liveInitable=!!blockClass._processLive())||forceLive||params.live===false){var block=new blockClass(uniqIdToDomElems[uniqId],params,!!forceLive);
delete uniqIdToDomElems[uniqId];callback&&callback.apply(block,Array.prototype.slice.call(arguments,4));
return block}}function processParams(params,domNode,blockName,uniqInitId){(params||(params={})).uniqId||(params.uniqId=(params.id?blockName+"-id-"+params.id:$.identify())+(uniqInitId||$.identify()));
var domUniqId=$.identify(domNode),domParams=domElemToParams[domUniqId]||(domElemToParams[domUniqId]={});
domParams[blockName]||(domParams[blockName]=params);return params}function findDomElem(ctx,selector,excludeSelf){var res=ctx.find(selector);
return excludeSelf?res:res.add(ctx.filter(selector))}function getParams(domNode){var uniqId=$.identify(domNode);
return domElemToParams[uniqId]||(domElemToParams[uniqId]=extractParams(domNode))}function extractParams(domNode){var data=domNode.dataset&&domNode.dataset.bem||domNode.getAttribute("data-bem");
return data&&$.parseJSON(data)||{}}function cleanupDomNode(domNode){delete domElemToParams[$.identify(domNode)]
}function removeDomNodeFromBlock(block,domNode){block.domElem.length===1?block.destruct(true):block.domElem=block.domElem.not(domNode)
}function getClientNode(){return doc[0][$.support.boxModel?"documentElement":"body"]}$.fn.bem=function(blockName,params){return initBlock(blockName,this,params,true)
};var DOM=BEM.DOM=BEM.decl("i-bem__dom",{__constructor:function(domElem,params,initImmediately){var _this=this;
_this.domElem=domElem;_this._eventNameCache={};_this._elemCache={};uniqIdToBlock[_this._uniqId=params.uniqId||$.identify(_this)]=_this;
_this._needSpecialUnbind=false;_this.__base(null,params,initImmediately)},findBlocksInside:function(elem,block){return this._findBlocks("find",elem,block)
},findBlockInside:function(elem,block){return this._findBlocks("find",elem,block,true)},findBlocksOutside:function(elem,block){return this._findBlocks("parents",elem,block)
},findBlockOutside:function(elem,block){return this._findBlocks("closest",elem,block)[0]||null},findBlocksOn:function(elem,block){return this._findBlocks("",elem,block)
},findBlockOn:function(elem,block){return this._findBlocks("",elem,block,true)},_findBlocks:function(select,elem,block,onlyFirst){if(!block){block=elem;
elem=undefined}var ctxElem=elem?typeof elem=="string"?this.findElem(elem):elem:this.domElem,isSimpleBlock=typeof block=="string",blockName=isSimpleBlock?block:block.block||block.blockName,selector="."+(isSimpleBlock?buildClass(blockName):buildClass(blockName,block.modName,block.modVal))+(onlyFirst?":first":""),domElems=ctxElem.filter(selector);
select&&(domElems=domElems.add(ctxElem[select](selector)));if(onlyFirst){return domElems[0]?initBlock(blockName,domElems.eq(0),true):null
}var res=[],uniqIds={};$.each(domElems,function(i,domElem){var block=initBlock(blockName,$(domElem),true);
if(!uniqIds[block._uniqId]){uniqIds[block._uniqId]=true;res.push(block)}});return res},bindToDomElem:function(domElem,event,fn){var _this=this;
fn?domElem.bind(_this._buildEventName(event),function(e){(e.data||(e.data={})).domElem=$(this);return fn.apply(_this,arguments)
}):$.each(event,function(event,fn){_this.bindToDomElem(domElem,event,fn)});return _this},bindToDoc:function(event,fn){this._needSpecialUnbind=true;
return this.bindToDomElem(doc,event,fn)},bindToWin:function(event,fn){var _fn=fn,currentHeight,currentWidth;
if(event==="resize"){fn=function(){var height=win.height(),width=win.width();if(currentHeight!==height||currentWidth!==width){currentHeight=height;
currentWidth=width;_fn.apply(this,arguments)}}}this._needSpecialUnbind=true;return this.bindToDomElem(win,event,fn)
},bindTo:function(elem,event,fn){if(!event||$.isFunction(event)){fn=event;event=elem;elem=this.domElem
}else if(typeof elem=="string"){elem=this.elem(elem)}return this.bindToDomElem(elem,event,fn)},unbindFromDomElem:function(domElem,event){domElem.unbind(this._buildEventName(event));
return this},unbindFromDoc:function(event){return this.unbindFromDomElem(doc,event)},unbindFromWin:function(event){return this.unbindFromDomElem(win,event)
},unbindFrom:function(elem,event){if(!event){event=elem;elem=this.domElem}else if(typeof elem=="string"){elem=this.elem(elem)
}return this.unbindFromDomElem(elem,event)},_buildEventName:function(event){var _this=this;return event.indexOf(" ")>1?event.split(" ").map(function(e){return _this._buildOneEventName(e)
}).join(" "):_this._buildOneEventName(event)},_buildOneEventName:function(event){var _this=this,eventNameCache=_this._eventNameCache;
if(event in eventNameCache)return eventNameCache[event];var uniq="."+_this._uniqId;if(event.indexOf(".")<0)return eventNameCache[event]=event+uniq;
var lego=".bem_"+_this.__self._name;return eventNameCache[event]=event.split(".").map(function(e,i){return i==0?e+lego:lego+"_"+e
}).join("")+uniq},trigger:function(e,data){this.__base(e=this.buildEvent(e),data).domElem&&this._ctxTrigger(e,data);
return this},_ctxTrigger:function(e,data){var _this=this,storage=liveEventCtxStorage[_this.__self._buildCtxEventName(e.type)],ctxIds={};
storage&&_this.domElem.each(function(){var ctx=this,counter=storage.counter;while(ctx&&counter){var ctxId=$.identify(ctx,true);
if(ctxId){if(ctxIds[ctxId])break;var storageCtx=storage.ctxs[ctxId];if(storageCtx){$.each(storageCtx,function(uniqId,handler){handler.fn.call(handler.ctx||_this,e,data)
});counter--}ctxIds[ctxId]=true}ctx=ctx.parentNode}})},setMod:function(elem,modName,modVal){if(elem&&typeof modVal!="undefined"&&elem.length>1){var _this=this;
elem.each(function(){var item=$(this);item.__bemElemName=elem.__bemElemName;_this.setMod(item,modName,modVal)
});return _this}return this.__base(elem,modName,modVal)},_extractModVal:function(modName,elem,elemName){var domNode=(elem||this.domElem)[0],matches;
domNode&&(matches=domNode.className.match(this.__self._buildModValRE(modName,elemName||elem)));return matches?matches[2]:""
},_extractMods:function(modNames,elem){var res={},extractAll=!modNames.length,countMatched=0;((elem||this.domElem)[0].className.match(this.__self._buildModValRE("("+(extractAll?NAME_PATTERN:modNames.join("|"))+")",elem,"g"))||[]).forEach(function(className){var iModVal=(className=className.trim()).lastIndexOf(MOD_DELIM),iModName=className.substr(0,iModVal-1).lastIndexOf(MOD_DELIM);
res[className.substr(iModName+1,iModVal-iModName-1)]=className.substr(iModVal+1);++countMatched});countMatched<modNames.length&&modNames.forEach(function(modName){modName in res||(res[modName]="")
});return res},_afterSetMod:function(modName,modVal,oldModVal,elem,elemName){var _self=this.__self,classPrefix=_self._buildModClassPrefix(modName,elemName),classRE=_self._buildModValRE(modName,elemName),needDel=modVal==="";
(elem||this.domElem).each(function(){var className=this.className;className.indexOf(classPrefix)>-1?this.className=className.replace(classRE,needDel?"":"$1"+classPrefix+modVal):needDel||$(this).addClass(classPrefix+modVal)
});elemName&&this.dropElemCache(elemName,modName,oldModVal).dropElemCache(elemName,modName,modVal)},findElem:function(ctx,names,modName,modVal){if(arguments.length%2){modVal=modName;
modName=names;names=ctx;ctx=this.domElem}else if(typeof ctx=="string"){ctx=this.findElem(ctx)}var _self=this.__self,selector="."+names.split(" ").map(function(name){return buildClass(_self._name,name,modName,modVal)
}).join(",.");return findDomElem(ctx,selector)},_elem:function(name,modName,modVal){var key=name+buildModPostfix(modName,modVal),res;
if(!(res=this._elemCache[key])){res=this._elemCache[key]=this.findElem(name,modName,modVal);res.__bemElemName=name
}return res},elem:function(names,modName,modVal){if(modName&&typeof modName!="string"){modName.__bemElemName=names;
return modName}if(names.indexOf(" ")<0){return this._elem(names,modName,modVal)}var res=$([]),_this=this;
names.split(" ").forEach(function(name){res=res.add(_this._elem(name,modName,modVal))});return res},dropElemCache:function(names,modName,modVal){if(names){var _this=this,modPostfix=buildModPostfix(modName,modVal);
names.indexOf(" ")<0?delete _this._elemCache[names+modPostfix]:names.split(" ").forEach(function(name){delete _this._elemCache[name+modPostfix]
})}else{this._elemCache={}}return this},elemParams:function(elem){var elemName;if(typeof elem=="string"){elemName=elem;
elem=this.elem(elem)}else{elemName=this.__self._extractElemNameFrom(elem)}return extractParams(elem[0])[buildClass(this.__self.getName(),elemName)]||{}
},elemify:function(elem,elemName){(elem=$(elem)).__bemElemName=elemName;return elem},containsDomElem:function(domElem){var res=false;
this.domElem.each(function(){return!(res=domElem.parents().andSelf().index(this)>-1)});return res},buildSelector:function(elem,modName,modVal){return this.__self.buildSelector(elem,modName,modVal)
},destruct:function(keepDOM){var _this=this,_self=_this.__self;_this._isDestructing=true;_this._needSpecialUnbind&&_self.doc.add(_self.win).unbind("."+_this._uniqId);
_this.dropElemCache().domElem.each(function(i,domNode){var params=getParams(domNode);$.each(params,function(blockName,blockParams){var block=uniqIdToBlock[blockParams.uniqId];
block?block._isDestructing||removeDomNodeFromBlock(block,domNode):delete uniqIdToDomElems[blockParams.uniqId]
});cleanupDomNode(domNode)});keepDOM||_this.domElem.remove();delete uniqIdToBlock[_this.un()._uniqId];
delete _this.domElem;delete _this._elemCache;_this.__base()},findAndDestruct:function(bl){this.findBlocksInside(bl).forEach(function(block){block.destruct()
})}},{scope:null,doc:doc,win:win,_processLive:function(heedLive){var _this=this,res=_this._liveInitable;
if("live"in _this){var noLive=typeof res=="undefined";if(noLive^heedLive){res=_this.live()!==false;_this.live=function(){}
}}return res},init:function(ctx,callback,callbackCtx){if(!ctx||$.isFunction(ctx)){callbackCtx=callback;
callback=ctx;ctx=doc}var uniqInitId=$.identify();findDomElem(ctx,".i-bem").each(function(){init($(this),uniqInitId)
});callback&&this.afterCurrentEvent(function(){callback.call(callbackCtx||this,ctx)});this._runAfterCurrentEventFns();
return ctx},destruct:function(keepDOM,ctx,excludeSelf){if(typeof keepDOM!="boolean"){excludeSelf=ctx;
ctx=keepDOM;keepDOM=undefined}findDomElem(ctx,".i-bem",excludeSelf).each(function(i,domNode){var params=getParams(this);
$.each(params,function(blockName,blockParams){if(blockParams.uniqId){var block=uniqIdToBlock[blockParams.uniqId];
block?removeDomNodeFromBlock(block,domNode):delete uniqIdToDomElems[blockParams.uniqId]}});cleanupDomNode(this)
});keepDOM||(excludeSelf?ctx.empty():ctx.remove())},update:function(ctx,content,callback,callbackCtx){this.destruct(ctx,true);
this.init(ctx.html(content),callback,callbackCtx)},replace:function(ctx,content){this.destruct(true,ctx);
this.init($(content).replaceAll(ctx))},append:function(ctx,content){this.init($(content).appendTo(ctx))
},prepend:function(ctx,content){this.init($(content).prependTo(ctx))},before:function(ctx,content){this.init($(content).insertBefore(ctx))
},after:function(ctx,content){this.init($(content).insertAfter(ctx))},_buildCtxEventName:function(e){return this._name+":"+e
},_liveClassBind:function(className,e,callback,invokeOnInit){var _this=this;if(e.indexOf(" ")>-1){e.split(" ").forEach(function(e){_this._liveClassBind(className,e,callback,invokeOnInit)
})}else{var storage=liveClassEventStorage[e],uniqId=$.identify(callback);if(!storage){storage=liveClassEventStorage[e]={};
doc.bind(e,_this.changeThis(_this._liveClassTrigger,_this))}storage=storage[className]||(storage[className]={uniqIds:{},fns:[]});
if(!(uniqId in storage.uniqIds)){storage.fns.push({uniqId:uniqId,fn:_this._buildLiveEventFn(callback,invokeOnInit)});
storage.uniqIds[uniqId]=storage.fns.length-1}}return this},_liveClassUnbind:function(className,e,callback){var storage=liveClassEventStorage[e];
if(storage){if(callback){if(storage=storage[className]){var uniqId=$.identify(callback);if(uniqId in storage.uniqIds){var i=storage.uniqIds[uniqId],len=storage.fns.length-1;
storage.fns.splice(i,1);while(i<len)storage.uniqIds[storage.fns[i++].uniqId]=i-1;delete storage.uniqIds[uniqId]
}}}else{delete storage[className]}}return this},_liveClassTrigger:function(e){var storage=liveClassEventStorage[e.type];
if(storage){var node=e.target,classNames=[];for(var className in storage)storage.hasOwnProperty(className)&&classNames.push(className);
do{var nodeClassName=" "+node.className+" ",i=0;while(className=classNames[i++]){if(nodeClassName.indexOf(" "+className+" ")>-1){var j=0,fns=storage[className].fns,fn,stopPropagationAndPreventDefault=false;
while(fn=fns[j++])if(fn.fn.call($(node),e)===false)stopPropagationAndPreventDefault=true;stopPropagationAndPreventDefault&&e.preventDefault();
if(stopPropagationAndPreventDefault||e.isPropagationStopped())return;classNames.splice(--i,1)}}}while(classNames.length&&(node=node.parentNode))
}},_buildLiveEventFn:function(callback,invokeOnInit){var _this=this;return function(e){var args=[_this._name,((e.data||(e.data={})).domElem=$(this)).closest(_this.buildSelector()),true],block=initBlock.apply(null,invokeOnInit?args.concat([callback,e]):args);
if(block&&!invokeOnInit&&callback)return callback.apply(block,arguments)}},liveInitOnEvent:function(elemName,event,callback){return this.liveBindTo(elemName,event,callback,true)
},liveBindTo:function(to,event,callback,invokeOnInit){if(!event||$.isFunction(event)){callback=event;
event=to;to=undefined}if(!to||typeof to=="string"){to={elem:to}}to.elemName&&(to.elem=to.elemName);var _this=this;
if(to.elem&&to.elem.indexOf(" ")>0){to.elem.split(" ").forEach(function(elem){_this._liveClassBind(buildClass(_this._name,elem,to.modName,to.modVal),event,callback,invokeOnInit)
});return _this}return _this._liveClassBind(buildClass(_this._name,to.elem,to.modName,to.modVal),event,callback,invokeOnInit)
},liveUnbindFrom:function(elem,event,callback){var _this=this;if(elem.indexOf(" ")>1){elem.split(" ").forEach(function(elem){_this._liveClassUnbind(buildClass(_this._name,elem),event,callback)
});return _this}return _this._liveClassUnbind(buildClass(_this._name,elem),event,callback)},_liveInitOnBlockEvent:function(event,blockName,callback,findFnName){var name=this._name;
blocks[blockName].on(event,function(e){var args=arguments,blocks=e.block[findFnName](name);callback&&blocks.forEach(function(block){callback.apply(block,args)
})});return this},liveInitOnBlockEvent:function(event,blockName,callback){return this._liveInitOnBlockEvent(event,blockName,callback,"findBlocksOn")
},liveInitOnBlockInsideEvent:function(event,blockName,callback){return this._liveInitOnBlockEvent(event,blockName,callback,"findBlocksOutside")
},liveInitOnBlockInit:function(blockName,callback){return this.liveInitOnBlockEvent("init",blockName,callback)
},liveInitOnBlockInsideInit:function(blockName,callback){return this.liveInitOnBlockInsideEvent("init",blockName,callback)
},on:function(ctx,e,data,fn,fnCtx){return ctx.jquery?this._liveCtxBind(ctx,e,data,fn,fnCtx):this.__base(ctx,e,data,fn)
},un:function(ctx,e,fn,fnCtx){return ctx.jquery?this._liveCtxUnbind(ctx,e,fn,fnCtx):this.__base(ctx,e,fn)
},liveCtxBind:function(ctx,e,data,fn,fnCtx){return this._liveCtxBind(ctx,e,data,fn,fnCtx)},_liveCtxBind:function(ctx,e,data,fn,fnCtx){var _this=this;
if(typeof e=="string"){if($.isFunction(data)){fnCtx=fn;fn=data;data=undefined}if(e.indexOf(" ")>-1){e.split(" ").forEach(function(e){_this._liveCtxBind(ctx,e,data,fn,fnCtx)
})}else{var ctxE=_this._buildCtxEventName(e),storage=liveEventCtxStorage[ctxE]||(liveEventCtxStorage[ctxE]={counter:0,ctxs:{}});
ctx.each(function(){var ctxId=$.identify(this),ctxStorage=storage.ctxs[ctxId];if(!ctxStorage){ctxStorage=storage.ctxs[ctxId]={};
++storage.counter}ctxStorage[$.identify(fn)+(fnCtx?$.identify(fnCtx):"")]={fn:fn,data:data,ctx:fnCtx}
})}}else{$.each(e,function(e,fn){_this._liveCtxBind(ctx,e,fn,data)})}return _this},liveCtxUnbind:function(ctx,e,fn,fnCtx){return this._liveCtxUnbind(ctx,e,fn,fnCtx)
},_liveCtxUnbind:function(ctx,e,fn,fnCtx){var _this=this,storage=liveEventCtxStorage[e=_this._buildCtxEventName(e)];
if(storage){ctx.each(function(){var ctxId=$.identify(this,true),ctxStorage;if(ctxId&&(ctxStorage=storage.ctxs[ctxId])){fn&&delete ctxStorage[$.identify(fn)+(fnCtx?$.identify(fnCtx):"")];
if(!fn||$.isEmptyObject(ctxStorage)){storage.counter--;delete storage.ctxs[ctxId]}}});storage.counter||delete liveEventCtxStorage[e]
}return _this},_extractElemNameFrom:function(elem){if(elem.__bemElemName)return elem.__bemElemName;var matches=elem[0].className.match(this._buildElemNameRE());
return matches?matches[1]:undefined},extractParams:extractParams,_buildModClassPrefix:function(modName,elem){return buildClass(this._name)+(elem?ELEM_DELIM+(typeof elem==="string"?elem:this._extractElemNameFrom(elem)):"")+MOD_DELIM+modName+MOD_DELIM
},_buildModValRE:function(modName,elem,quantifiers){return new RegExp("(\\s|^)"+this._buildModClassPrefix(modName,elem)+"("+NAME_PATTERN+")(?=\\s|$)",quantifiers)
},_buildElemNameRE:function(){return new RegExp(this._name+ELEM_DELIM+"("+NAME_PATTERN+")(?:\\s|$)")},buildSelector:function(elem,modName,modVal){return"."+buildClass(this._name,elem,modName,modVal)
},getBlockByUniqId:function(uniqId){return uniqIdToBlock[uniqId]},getWindowSize:function(){return{width:win.width(),height:win.height()}
}});$(function(){BEM.DOM.scope=$("body")})})(BEM,jQuery);(function(){String.prototype.trim||(String.prototype.trim=function(){var str=this.replace(/^\s\s*/,""),ws=/\s/,i=str.length;
while(ws.test(str.charAt(--i)));return str.slice(0,i+1)})})();(function(){String.prototype.capitalize||(String.prototype.capitalize=function(){return this.substring(0,1).toUpperCase()+this.substring(1)
})})();(function(Lego){if(!Lego)Lego=window.Lego={};Lego.isSessionValid=function(){return!!Lego.getCookie("yandex_login")
}})(window.Lego);BEM.DOM.decl("i-global",{onSetMod:{js:function(){this.del(this.__self._params=$.extend({},this.params),"uniqId","name");
var params=this.__self._params;params["passport-msg"]||(params["passport-msg"]=params.id);if(params["show-counters"]===undefined){params["show-counters"]=Math.round(Math.random()*100)<=params["show-counters-percent"]
}params.locale=params.lang;$(function(){params.oframebust&&Lego.oframebust(params.oframebust)})}},getDefaultParams:function(){return{id:"",login:Lego.isSessionValid()?$.cookie("yandex_login")||"":"",yandexuid:$.cookie("yandexuid"),lang:"ru",tld:"ru",retpath:encodeURI($.decodeURI(location.href)),"passport-host":"https://passport.yandex.ru","pass-host":"//pass.yandex.ru","social-host":"//social.yandex.ru","lego-path":"/lego","show-counters-percent":100}
}},{param:function(name){return(this._params||{})[name]}});(function(Lego){if(!Lego)Lego=window.Lego={};
!Lego.params&&(Lego.params={});function preparseHost(h){return h.replace(/^(?:https?:)?\/\//,"")}Lego.c=function(w,a,opts){var host=preparseHost(opts&&opts.host||BEM.blocks["i-global"].param("click-host")||"clck.yandex.ru"),url=function(w,h,t,a){h=h.replace("'","%27");
return h.indexOf("/dtype=")>-1?h:location.protocol+"//"+host+"/"+t+"/dtype="+w+"/rnd="+((new Date).getTime()+Math.round(Math.random()*100))+(a?"/*"+(h.match(/^http/)?h:location.protocol+"//"+location.host+(h.match("^/")?h:"/"+h)):"/*data="+encodeURIComponent("url="+encodeURIComponent(h.match(/^http/)?h:location.protocol+"//"+location.host+(h.match("^/")?h:"/"+h))))
},click=function(){var head=document.getElementsByTagName("head")[0]||document.getElementsByTagName("body")[0];
var script=document.createElement("script");script.setAttribute("src",url(w,location.href,"jclck"));head.insertBefore(script,head.firstChild)
};if(a){if(a.className.match(/b-link_pseudo_yes/)||a.href&&a.href.match(/^mailto:/)||opts&&opts.noRedirect===true){click()
}else if(a.href){var h=a.href;a.href=url(w,h,"redir");setTimeout(function(){a.href=h},500)}else if(a.form){if(a.type.match(/submit|button|image/)){var h=a.form.action;
a.form.action=url(w,h,"redir",true);setTimeout(function(){a.form.action=h},500)}else{click()}}else if(a.action){a.action=url(w,a.action,"redir",true)
}else{throw"counter.js: not link and not form!"}}else{click()}}})(window.Lego);(function(Lego,undefined){if(!Lego)Lego=window.Lego={};
Lego.cp=function(pi,ci,p,v,a,opts){typeof v==="string"||(opts=a,a=v,v=undefined);Lego.c("stred/pid="+pi+"/cid="+ci+(p?"/path="+p+(v?"/vars="+v:""):""),a,opts)
}})(window.Lego);(function(Lego){if(!Lego)Lego=window.Lego={};Lego.ch=function(p,v,a){BEM.blocks["i-global"].param("show-counters")&&Lego.cp(0,2219,p,v,a)
}})(window.Lego);(function(Lego){if(!Lego)Lego=window.Lego={};Lego.getCookie=function(n){var c=document.cookie;
if(c.length<1)return false;var b=c.indexOf(n+"=");if(b==-1)return false;b+=n.length+1;var e=c.indexOf(";",b);
return decodeURIComponent(e==-1?c.substring(b):c.substring(b,e))}})(window.Lego);(function($,Lego){if(!Lego)Lego=window.Lego={};
Lego.init||(Lego.init=function(params){(params=Lego.params=$.extend({id:"",login:Lego.isSessionValid()?Lego.getCookie("yandex_login")||"":"",yandexuid:Lego.getCookie("yandexuid"),locale:"ru",retpath:window.location.toString(),"passport-host":"//passport.yandex.ru","pass-host":"//pass.yandex.ru","passport-msg":params.id,"social-host":"//social.yandex.ru","lego-path":"/lego","show-counters-percent":100},params,Lego.params))["show-counters"]=Math.round(Math.random()*100)<=params["show-counters-percent"];
BEM.blocks["i-global"]._params||$.extend(BEM.blocks["i-global"]._params={},params);$(function(){params.oframebust&&Lego.oframebust(params.oframebust)
});return params});Lego.block||(Lego.block={});Lego.blockInit||(Lego.blockInit=function(context,blockSelector){context=context||document;
blockSelector=blockSelector||".g-js";$(context).find(blockSelector).each(function(){var block=$(this),params=this.onclick?this.onclick():{},name=params.name||"",init=Lego.block[name];
if(init&&!block.data(name)){init.call(block,params);block.data(name,true).addClass(name+"_js_inited")
}})});Lego.blockInitBinded||(Lego.blockInitBinded=!!$(document).ready(function(){Lego.blockInit()}))})(jQuery,window.Lego);
(function(Lego){if(!Lego)Lego=window.Lego={};Lego.messages=Lego.messages||{};Lego.message=function(id,text){return Lego.params.locale=="ru"?text:Lego.messages[id]||text
}})(window.Lego);$(function(){BEM.DOM.init()});window.blocks={};blocks["b-page"]=function(settings,background,width,height){var blocks=require("bem").blocks;
return[blocks["b-background"](background),blocks["blocker"](),blocks["b-content"](settings,width,height),blocks["gradient"](),blocks["b-paranja"](),blocks["b-popupa_type_properties"]()]
};function onError(msg,url,line,symbol,error){vb.log("error",msg,url||"",line||"",error&&error.stack||"");
throw new Error(msg)}function bindToErrors(){if(vb.navigator!=="ie"){window.onerror=onError}}window.page=function(){var _page=$("body").bem("b-page");
this.page=function(){return _page};return _page};(function($,BEM,undefined){var initHandler;channels("api").on("historyThumbChanged",function(thumb){var historyThumbs=cache.get("historyThumbs")||{};
historyThumbs[thumb.url]=thumb;cache.set("historyThumbs",historyThumbs)});BEM.DOM.decl("b-page",{_timer:null,_winResizeTimerId:null,_windowWidth:0,_windowHeight:0,_scrollbarWidth:17,_scrollbarHeight:17,_boundListeners:{},_badConnectionAlertCount:0,_apiEvents:["thumbChanged","backgroundChanged","historyThumbChanged","bookmarksStateChanged","appsListChanged","closedTabsListChanged","modifierPressed","statisticsModal","action","advertisement","auth"],getSuggestMarginLeft:function(){return $(".b-form-input").offset().left+10+"px"
},onSetMod:{js:function(){var self=this;window.cache=new(require("cache").Cache);window.flags=new(require("cache").Cache);
$(function(){self._onLoad()});this.bindToWin("resize",$.throttle(self._onWinResize,50));this.bindToDoc("contextmenu",this._onContextmenu,this);
this.bindTo("mousedown",function(e){var link=$(e.target).closest("a");if(link.length)vb.onLinkClicked(link.attr("href")||"")
});this.bindToWin("pagehide",self._onPageHide.bind(self));this.bindToWin("mouseup",function(){this.startDnD()
})},"settings-shown":function(modName,modVal){if(modVal==="yes"){this.findBlockInside("blocker").delMod("disabled");
this.findBlockInside("b-tumb").__self.getEmptyThumbs().forEach(function(thumb){thumb.setMod("show-border","yes")
})}else{this.findBlockInside("blocker").setMod("disabled","yes");this.findBlockInside("b-tumb").__self.getEmptyThumbs().forEach(function(thumb){thumb.delMod("show-border")
})}},page:{index:function(){var self=this,winSize=this.__self.getWindowSize(),Lib=require("lib"),BEMHTML=require("bemhtml"),blocks=require("bem").blocks,BEM=require("bem").BEM,init=false,document=require("document"),window=require("window"),screen=require("screen"),$de=$(document.documentElement);
if(vb.navigator==="ie"&&vb.navigatorMajorVersion<9){$(document).on("keydown keypress",function(e){if(e.keyCode!==13)return true;
var classes=$(document.activeElement).attr("class");var matched=["b-decor","b-vb-head","b-vb__td","b-tumbs","b-sync","i-ua","b-content","b-page","b-vb-foot__content"].some(function(className){return classes.indexOf(className)!==-1
});return!matched})}$de.addClass("page_index");if(vb.navigatorMajorVersion===10){$de.addClass("ie10");
this.setMod("ie","10")}var settings=cache.get("settings"),background=cache.get("background"),BEMJSON=blocks["b-page"](settings,background,winSize.width,winSize.height);
this.setMod("bookmarks",!settings.showBookmarks&&"no"||"");this.setMod("search",settings.searchStatus===2?"yes":"");
this.setMod("banner",settings.searchStatus===3?"yes":"");this.setMod("os",vb.osName);this.setMod("theme",cache.get("background").color);
var html=BEMHTML.apply(BEMJSON);this.domElem.html(html);this.afterCurrentEvent(function(){BEM.DOM.init()
})}}},showSettings:function(){$(".b-tumb").trigger("mouseleave");var popupa=this.getSettingsBlock(),_this=this;
vb.requestSettings(function(settings){page().saveSettings(settings,true);var blocks=require("bem").blocks,BEMHTML=require("bemhtml"),json=blocks["b-properties-popup"](settings),html=BEMHTML.apply(json);
popupa.setContent(html,function(){popupa.show(_this.findBlockOn("i-action").findElem("settings"))});_this.setMod("settings-shown","yes")
})},updateWidth:function(x){x=x||cache.get("settings").x;this.setMod("width",x>=5?"big":"normal")},stopDnD:function(){this.findBlockInside("b-tumb").stopDnD();
return this},startDnD:function(){var thumb=this.findBlockInside("b-tumb");if(thumb){thumb.startDnD()}return this
},hideSettings:function(){this.findBlockInside({block:"b-popupa",modName:"type",modVal:"properties"}).hide();
flags.reset("currentSliderPos")},afterInit:function(){this.afterInit=function(){};setTimeout(function(){vb.scrollInfo($.pageHasVerticalScroll());
require("preloader").load({block:"b-spin",mods:{progress:"yes"}},{block:"app",elem:"btn"},{block:"app",elem:"btn",elemMods:{hovered:"yes"}},{block:"krestik",mods:{size:"small"}},{block:"krestik",mods:{size:"big"}})
},0);try{this._apiChannel.emit("advertisement",cache.get("advertisement"))}catch(err){}try{this._apiChannel.emit("auth",cache.get("auth"))
}catch(err){}},isSettingsShown:function(){var settings=this.getSettingsBlock();return settings&&settings.isShowed()||false
},getSettingsBlock:function(){return this.findBlockInside({block:"b-popupa",modName:"type",modVal:"properties"})
},showStatPopup:function(){var popup=this.findBlockInside("stat-popup");if(popup){return popup.show()
}var BEMHTML=require("bemhtml"),blocks=require("bem").blocks,_this=this;BEM.DOM.append(_this.domElem,BEMHTML.apply(blocks["stat-popup"](cache.get("settings"))));
this.findBlockInside("b-paranja").delMod("hide")},getCurrentSettings:function(){var Lib=require("lib"),settings={},bSelectTheme=this.findBlockInside("b-select-theme"),currentImage=bSelectTheme.findElem("item","state","current"),userImage=bSelectTheme.findElem("item","user","yes"),bgImage="";
if(currentImage&&currentImage.length){bgImage=bSelectTheme.elemParams(currentImage).id}if(userImage&&userImage.length)settings.selectedBgImage=bSelectTheme.getMod(userImage,"state")==="current"?"user":bgImage;
else settings.selectedBgImage=bgImage;settings.currentLayout=this.findBlockInside("b-form-slider").getVal();
try{settings.showSearchForm=this.findBlockInside({block:"b-form-checkbox",modName:"name",modVal:"show-search"}).isChecked();
settings.showBookmarks=this.findBlockInside({block:"b-form-checkbox",modName:"name",modVal:"show-bookmarks"}).isChecked();
settings.showAdvertisement=this.findBlockInside({block:"b-form-checkbox",modName:"name",modVal:"show-advertisement"}).isChecked();
settings.thumbStyle=parseInt(this.findBlockInside({block:"b-form-select",modName:"action",modVal:"set-thumbs-style"}).val(),10)
}catch(err){settings=$.extend(cache.get("settings"),settings)}return settings},applySettings:function(setInitFlag){if(!this.isSettingsShown())return;
var settings=this.getCurrentSettings();setInitFlag&&this.initFlag.inc();vb.applySettings(settings.currentLayout,settings.showBookmarks,settings.showSearchForm,settings.showAdvertisement,settings.thumbStyle)
},_onLoad:function(){bindToErrors();var self=this,BEM=require("bem").BEM;initHandler=function(settings){self._onInit(settings)
};vb.onRequest.addListener("init",initHandler);var apiChannel=this._apiChannel=channels("api");this._apiEvents.forEach(function(eventName){var listener=function(){apiChannel.emit(eventName,arguments,true)
};this._boundListeners[eventName]=listener;vb.onRequest.addListener(eventName,listener);var methodName="_on"+eventName.charAt(0).toUpperCase()+eventName.substr(1);
if(this[methodName]){apiChannel.on(eventName,this[methodName],this)}},this);window.onbeforeunload=function(){var tasks=page()._statisticTasks;
for(var taskName in tasks){page().sendStat(taskName)}if(vb.navigator==="ie"&&vb.navigatorMajorVersion<9){$("*").remove();
BEM.DOM.destruct($("body"));BEM.DOM.destruct($(document).unbind());if(typeof window.CollectGarbage==="function"){window.CollectGarbage()
}}};vb.requestInit()},_onContextmenu:function(e){var $target=$(e.target),index=-1,thumb=$target.closest(".b-tumb"),bThumb=thumb.length&&thumb.bem("b-tumb")||null,thumbParams={};
if(bThumb&&!bThumb.isSuggest&&bThumb.getMod("editing")!="yes"){thumbParams=bThumb.params;if(thumbParams){index=thumbParams.index
}}vb.onContextmenu(index,(thumbParams||{}).item)},_onPageShow:function(){bindToErrors();this._onLoad();
this.unbindFromWin("pageshow")},_onPageHide:function(){var apiChannel=this._apiChannel;this._apiEvents.forEach(function(evtName){var methodName="_on"+evtName.charAt(0).toUpperCase()+evtName.substr(1);
vb.onRequest.removeListener(evtName,this._boundListeners[evtName]);apiChannel.off(evtName,this[methodName])
},this);window.onerror=null;this._boundListeners["pageshow"]=this._boundListeners["pageshow"]||this._onPageShow.bind(this);
this.bindToWin("pageshow",this._boundListeners["pageshow"])},_onWinResize:function(){var settings=cache.get("settings");
if(!settings)return;var self=this,winSize=self.__self.getWindowSize(),isNull=!self._windowWidth&&!self._windowHeight;
if(self._windowWidth!==winSize.width&&self._windowWidth!==winSize.width+self._scrollbarWidth&&self._windowWidth!==winSize.width-self._scrollbarWidth||self._windowHeight!==winSize.height&&self._windowHeight!==winSize.height+self._scrollbarHeight&&self._windowHeight!==winSize.height-self._scrollbarHeight||isNull){self._windowWidth=winSize.width;
self._windowHeight=winSize.height;vb.scrollInfo($.pageHasVerticalScroll());var bSetting=this.findBlockInside("b-setting"),Lib=require("lib"),BEMHTML=require("bemhtml"),size=Lib.getThumbSize(settings.x,settings.y,"index"),thumbModSize=Lib.getThumbSizeMod(size),thumbs=this.findBlocksInside("b-tumb");
thumbs&&thumbs.forEach(function(thumb){!thumb.isSuggest&&thumb.setMod("size",thumbModSize)});if(bSetting){bSetting.positionTail();
bSetting.findParanja()}channels("dom").emit("resize");if(!settings.showBookmarks)return;var html=BEMHTML.apply(blocks["b-bookmarks"](settings,winSize.width,winSize.height)),popupa=this.findBlockInside({block:"b-popupa",modName:"type",modVal:"others-bookmarks"});
this.findAndDestruct("b-bookmarks"),popupa&&popupa.hide();BEM.DOM.prepend(this.findBlockInside("b-content").domElem,html)
}},saveSettings:function(settings,isUserSettings){["thumbs","background","sync","auth","advertisement"].forEach(function(propName){if(propName in settings){cache.set(propName,settings[propName]);
delete settings[propName]}});cache.set("settings",$.extend(cache.get("settings"),settings))},_redraw:function(settings){if(!this.initFlag.get()){this.hideSettings()
}else{this.initFlag.dec()}this.updateWidth(settings.x);var oldSettings=cache.get("settings"),oldThumbs=cache.get("thumbs"),blocks=require("bem").blocks,BEMHTML=require("bemhtml"),Lib=require("lib"),isLayoutChanged=this._isThumbsLayoutChanged(oldSettings,settings),isSearchChanged=this._isSearchChanged(oldSettings,settings),isBookmarksChanged=this._isBookmarksChanged(oldSettings,settings),showThumbsBorder=this.getMod("settings-shown")==="yes",winSize=this.__self.getWindowSize();
this.saveSettings(settings);var newThumbs=cache.get("thumbs");if(!isLayoutChanged){for(var index=0;index<settings.x*settings.y;index++){var oldThumb=oldThumbs[index],newThumb=newThumbs[index],diff=this._thumbChangesDiff(oldThumb,newThumb);
if(Object.keys(diff).length){var size=Lib.getThumbSize(settings.x,settings.y),thumbModSize=Lib.getThumbSizeMod(size),thumbHtml=BEMHTML.apply(blocks["b-tumb"](newThumb,index,size,false)),currentThumb=this.findBlockInside({block:"b-tumb",modName:"index",modVal:index+""}),thumbParent=currentThumb.domElem.parent();
currentThumb.destruct();BEM.DOM.append(thumbParent,thumbHtml)}}}if(isBookmarksChanged){if(settings.showBookmarks){this.setMod("bookmarks","yes");
BEM.DOM.prepend(this.findBlockInside("b-content").domElem,BEMHTML.apply(blocks["b-bookmarks"](settings,winSize.width,winSize.height)))
}else{this.setMod("bookmarks","no");this.findAndDestruct("b-bookmarks")}}if(isSearchChanged){var bHead=this.findBlockInside("b-vb-head");
if(settings.searchStatus===1){bHead.findElem("logo").remove();bHead.findElem("search").remove();this.findAndDestruct("b-question");
this.setMod("banner","no");this.delMod("search")}else if(settings.searchStatus===2){this.delMod("banner");
BEM.DOM.append(this.findBlockInside("b-vb-head").domElem,BEMHTML.apply(blocks["b-vb-head__content"](settings)));
this.setMod("search","yes");this.findAndDestruct("b-question")}else{if(!$(".b-question").length)BEM.DOM.append(bHead.domElem,BEMHTML.apply(blocks["b-question"]()));
this.setMod("banner","yes");bHead.findElem("logo").remove();bHead.findElem("search").remove();this.delMod("search")
}}if(isLayoutChanged){this.findAndDestruct("b-tumbs");var td=this.findBlockInside("b-vb").findElem("content").find("td");
BEM.DOM.prepend(td,BEMHTML.apply(blocks["b-tumbs"](newThumbs,settings)));this.findBlockInside("b-vb-foot").repaint();
if(this.isSettingsShown()&&!this.getMod("slider-clicked")){this.getSettingsBlock().pos()}}if(showThumbsBorder){this.findBlockInside("b-tumb").__self.getEmptyThumbs().forEach(function(thumb){thumb.setMod("show-border","yes")
})}vb.scrollInfo($.pageHasVerticalScroll());channels("dom").emit("redraw")},_onInit:function(settings){flags.set("initedWithBackgroundId",settings.background.id);
cache.reset("editingThumb",true);this.updateWidth(settings.x);var self=this,BEM=require("bem").BEM;this.__self.doc[0].title=vb.getLocalizedString("app.name");
for(var key in settings.thumbs){if($.isEmptyObject(settings.thumbs[key]))delete settings.thumbs[key]}this.saveSettings(settings);
self.delMod("page");self.setMod("page","index");if(settings.searchStatus===1){self.setMod("banner","no");
this.delMod("search")}vb.onRequest.removeListener("init",initHandler);vb.onRequest.addListener("init",this._redraw.bind(this))
},_isThumbsLayoutChanged:function(oldSettings,settings){return oldSettings.x!==settings.x||oldSettings.y!==settings.y
},_isSearchChanged:function(oldSettings,settings){return oldSettings.searchStatus!==settings.searchStatus
},_isBookmarksChanged:function(oldSettings,settings){return oldSettings.showBookmarks!==settings.showBookmarks
},initFlag:{inc:function(){var val=parseInt(page().getMod(this._modName)||0,10);val++;page().setMod(this._modName,String(val));
return val},dec:function(){var val=parseInt(page().getMod(this._modName)||0,10);val--;val=val<0?0:val;
page().setMod(this._modName,String(val));return val},get:function(){return parseInt(page().getMod(this._modName)||0,10)
},_modName:"init-waiting-count"},_statisticTasks:{},setStatisticsTimer:function(name,statParam,ms){var _this=this,task=this._statisticTasks[name]=this._statisticTasks[name]||{};
if(task&&task.timerId)clearTimeout(task.timerId);task.fn=function(){_this.sendStat(name)};task.param=statParam;
task.timerId=setTimeout(task.fn,ms)},sendStat:function(name){var task=this._statisticTasks[name];if(task)clearTimeout(task.timerId);
vb.stat(task.param);delete this._statisticTasks[name]}})})(jQuery,BEM);BEM.DOM.decl("b-page",{onSetMod:{js:function(){this._apiEvents.push("sync");
this.__base.apply(this,arguments)}},_onSync:function(params){var BEMHTML=require("bemhtml");if(params.status===3){var block=this.findBlockOutside("b-page").findBlockInside("i-action__settings");
block.findBlockOn("b-link").setMod("alarm","yes")}if(this.isSettingsShown()){var syncProps=this.findBlockInside("sync-properties"),$wrapper=syncProps.domElem.parent();
var syncPropsBEMJSON=blocks["sync-properties"](params);if(syncPropsBEMJSON){BEM.DOM.update($wrapper,BEMHTML.apply(syncPropsBEMJSON))
}else{BEM.DOM.update(syncProps.domElem,"")}cache.set("sync",params)}}});(function(Lego){Lego=Lego||{};
Lego.oframebustMatchDomain=function(whitelist,domain){whitelist=Object.prototype.toString.call(whitelist)==="[object Array]"?whitelist:function(){var arr=[];
for(var k in whitelist){whitelist.hasOwnProperty(k)&&arr.push(k)}return arr}();for(var i=0,l=whitelist.length;i<l;i++){var d=whitelist[i];
if(typeof d=="string"){if(/(\?|\*)/.test(d)){var re=d.replace(/\./g,"\\.").replace(/\*/g,".*").replace(/\?/g,".{1}");
if(new RegExp("^"+re+"$").test(domain))return true}else if(domain==d){return true}}else{try{if(d.test(domain))return true
}catch(e){}}}}})(window.Lego);(function(Lego){Lego=Lego||{};Lego.oframebust=function(whitelist){if(window.top.location!=window.location){var match=document.referrer.match(/^https?:\/\/([^:\/\s]+)\/?.*/);
if(!match)return;!Lego.oframebustMatchDomain(whitelist,match[1])&&(window.top.location=window.location)
}}})(window.Lego);BEM.DOM.decl("b-page",{_onStatisticsModal:function(){this.showStatPopup()},_onBackgroundChanged:function(background){var selectTheme=this.findBlockInside("b-select-theme");
if(background.error){this._badConnectionAlertCount++;if(this._badConnectionAlertCount===10&&vb.locale==="ru"&&(vb.navigator!=="ie"||vb.navigatorMajorVersion>8)&&vb.osName!=="linux"){require("modals").alert({block:"b-icon",mods:{type:"dolan"}})
}else{require("modals").alert(vb.getLocalizedString("app.noInternet"))}selectTheme&&selectTheme.rejectBackground();
return}this._badConnectionAlertCount=0;this.delMod("theme");this.setMod("theme",background.color);var BEMHTML=require("bemhtml");
this.findBlockInside("b-background").change(background);cache.set("background",background);selectTheme&&selectTheme.selectBackground();
this.findBlockInside("b-tumb").__self.getEmptyThumbs().forEach(function(thumb){thumb.setMod("theme","add-"+(background.color||"808080"))
})},_onAppsListChanged:function(params){var link=this.findBlockInside({block:"b-link",modName:"open",modVal:"apps"});
if(!link)return;if(params.empty){link.setMod("disabled","yes")}else{link.delMod("disabled")}},_onClosedTabsListChanged:function(params){var link=this.findBlockInside({block:"b-link",modName:"open",modVal:"bookmark"});
if(!link)return;if(params.empty){link.setMod("disabled","yes")}else{link.delMod("disabled")}},_thumbChangesDiff:function(originalThumb,newThumb){var diff={},keys,key,i,len;
if(originalThumb&&originalThumb.url&&!originalThumb.pinned&&newThumb.pinned&&!newThumb.url)return originalThumb;
for(i=0,keys=Object.keys(newThumb||{}),len=keys.length;i<len;i++){key=keys[i];if(!originalThumb||!originalThumb.hasOwnProperty(key)){diff[key]=newThumb[key]
}else if(originalThumb.hasOwnProperty(key)&&newThumb.hasOwnProperty(key)){if(originalThumb[key]!==newThumb[key]){diff[key]=newThumb[key]
}}}if(originalThumb&&originalThumb.screenshot&&!newThumb.screenshot)diff.screenshot=true;return diff},_onBookmarksStateChanged:function(bookmarks){var BEM=require("bem").BEM;
cache.set("bookmarks",bookmarks);this.trigger("bookmarksStateChanged")},_onAction:function(e){var thumb;
switch(e.type){case"openSettings":if(!this.isSettingsShown()){this.showSettings()}break;case"editThumb":thumb=this.findBlockInside({block:"b-tumb",modName:"index",modVal:""+e.thumb});
if(thumb){if(thumb.params.empty){thumb.add(true)}else{thumb.set(true)}}break;case"removeThumb":thumb=this.findBlockInside({block:"b-tumb",modName:"index",modVal:""+e.thumb});
if(thumb){thumb.remove(true)}break}}});blocks["b-content"]=function(data,width,height){var blocks=require("bem").blocks;
return{block:"b-content",js:true,mods:{type:"index"},content:[blocks["b-decor"](data),{block:"b-auth"},blocks["b-bookmarks"](data,width,height),blocks["b-vb"](data,width,height),blocks["b-vb-foot"](data),{block:"b-content",elem:"bg"}]}
};BEM.DOM.decl("b-content",{});(function(){function fixURL(URL){return URL.replace(/\\/g,"/")}blocks["b-background"]=function(background){return[{block:"b-background",mods:{ff:"yes"},js:{backgroundImage:background.image}},'<!--[if lt IE 8]><v:rect id="bg" stroked="false" class="vml b-background b-background_ie_yes"><v:fill type="frame" aspect="atleast" src="'+background.image+'" class="vml" style="position:absolute;left:0;top:0;width:100%;height:100%;"></v:fill></v:rect><![endif]-->']
};BEM.DOM.decl({block:"b-background",modName:"ff",modVal:"yes"},{onSetMod:{js:function(){var url=fixURL(this.params.backgroundImage);
this.domElem.css({"background-image":'url("'+url+'")'})}},change:function(background){var newURL=fixURL(background.image);
this.domElem.css({"background-image":'url("'+newURL+'")'});$("fill").attr("src",newURL)},destruct:function(){$("rect").remove();
this.__base.apply(this,arguments)}})})();blocks["b-tumbs"]=function(thumbs,settings){var blocks=require("bem").blocks,Lib=require("lib"),size=Lib.getThumbSize(settings.x,settings.y,"index");
return{block:"b-tumbs",js:true,mods:{type:"index",row:""+settings.y},content:function(settings){var rows=[],i=0,row,item;
for(var y=0;y<settings.y;y++){row=[];for(var x=0;x<settings.x;x++){item=null;if(thumbs[i]){item=thumbs[i]
}row.push({elem:"item",mods:{editing:(cache.get("editingThumb")||{}).index==i?"yes":"no",index:i+""},content:blocks["b-tumb"](item,i,size)});
i++}rows.push({elem:"row",content:row})}return rows}(settings)}};BEM.DOM.decl("b-tumbs",{onSetMod:{js:function(){var self=this,BEM=require("bem").BEM,bPage=self.findBlockOutside("b-page"),ie78=vb.navigator==="ie"&&vb.navigatorMajorVersion<9;
channels("api").on("modifierPressed",this._onModifierPressed,this);if(vb.navigator==="ie"){self.bindTo("mousedown",function(e){var $target=$(e.target),$thumb=$target.closest(".b-tumb");
if($thumb.length){if(document.selection&&document.selection.empty){try{document.selection.empty()}catch(err){}}else if(window.getSelection){var sel=window.getSelection();
sel.removeAllRanges()}$thumb.bem("b-tumb").forceDragStart()}});if(vb.navigatorMajorVersion===9){self.bindTo("drag",function(event){var self=this,e=event.originalEvent,dt=e.dataTransfer;
if(self.__self._clone&&!dt.setDragImage){self.__self._clone.css({position:"fixed",left:1+e.clientX+"px",top:1+e.clientY+"px"})
}})}}if(ie78){self.bindTo("dragstart",function(e){var $target=$(e.target),$thumb=$target.closest(".b-tumb"),bThumb=$thumb.bem("b-tumb");
bThumb._onDragstart.apply(bThumb,arguments)}).bindTo("drag",function(e){var $thumb=$(e.target),bThumb=$thumb.bem("b-tumb");
bThumb._onDrag.apply(bThumb,arguments)}).bindTo("dragend",function(e){var $thumb=$(e.target),bThumb=$thumb.bem("b-tumb");
bThumb._onDragend.apply(bThumb,arguments)}).bindTo("dragover",function(e){var dt=e.originalEvent.dataTransfer;
dt.dropEffect="move";return false}).bindTo("dragenter",function(e){var $target=$(e.target),$thumb=$target.closest(".b-tumb");
if($thumb.length){var bThumb=$thumb.bem("b-tumb");bThumb._onDragenter.apply(bThumb,arguments)}return false
}).bindTo("dragleave",function(e){var $target=$(e.target),$thumb=$target.closest(".b-tumb");if($thumb.length){var bThumb=$thumb.bem("b-tumb");
bThumb._onDragleave.apply(bThumb,arguments)}}).bindTo("drop",function(e){var $target=$(e.target),$thumb=$target.closest(".b-tumb");
if($thumb.length){var bThumb=$thumb.bem("b-tumb");bThumb._onDrop.apply(bThumb,arguments)}})}},"show-hint":function(modName,modVal,oldVal){if(modVal==="yes"){this.findBlocksInside("b-tumb").forEach(function(thumb){thumb.setMod("show-hint","yes")
})}else if(modVal===""){this.findBlocksInside("b-tumb").forEach(function(thumb){thumb.delMod("show-hint")
})}}},_onModifierPressed:function(data){if(data.pressed){this.showHints()}else{this.hideHints()}},destruct:function(){var BEM=require("bem").BEM;
this.findBlocksInside("b-tumb").some(function(block){block.__self._bThumbs=null;return true});channels("api").off("modifierPressed",this._onModifierPressed);
this.__base.apply(this,arguments)},showHints:function(){this.setMod("show-hint","yes")},hideHints:function(){this.delMod("show-hint")
}});(function($){var leftClick=$.event.special.leftclick={setup:function(){$(this).bind("click",leftClick.handler)
},teardown:function(){$(this).unbind("click",leftClick.handler)},handler:function(e){if(!e.button){e.type="leftclick";
$.event.handle.apply(this,arguments);e.type="click"}}}})(jQuery);(function($){var ALLOWED_DIRECTIONS=["down-right","down","down-left","up","up-right","up-left","right-down","right","right-up","left-down","left","left-up"];
BEM.DOM.decl("b-popupa",{onSetMod:{js:function(){this._owner=null;this._isShowed=false;this._direction=this.getMod("direction")||"down";
this._lastDirection=null;this._hasTail=!!this.elem("tail").length;if(!this._hasTail){Object.keys(this.params).forEach(function(key){key.indexOf("tail")===0&&(this.params[key]=0)
},this)}}},show:function(owner){if(!this._isShowed||this._owner!==owner){this._owner=owner;this._getUnder().show({left:-1e4,top:-1e4});
this.pos();this._getUnder().setMod("animate","yes")}return this},hide:function(){this._isShowed&&this._getUnder().hide();
return this},toggle:function(owner){return this.isShowed()?this.hide():this.show(owner)},_pos:function(){var params=this._calcParams(this._owner);
this._hasTail&&this.elem("tail").css(params.tailOffsets);this.setMod("direction",params.direction)._getUnder().show(params.offsets);
return this},pos:function(){if(!this._isShowed)return this;return this._pos()},isShowed:function(){return this._isShowed
},setDirection:function(direction){if(this._direction!=direction){this._direction=direction;this.isShowed()&&this.pos()
}},setContent:function(content,callback,callbackCtx){BEM.DOM.update(this.elem("content"),content,callback,callbackCtx);
return this.isShowed()?this.pos():this},_isOwnerNode:function(){return!!(this._owner&&this._owner.jquery)
},_calcDimensions:function(){var posElem=this._getUnder().domElem,underElem=this._getUnder()._getUnder(),win=this.__self.win,owner=this._owner,isOwnerNode=this._isOwnerNode(),ownerOffset=isOwnerNode?owner.offset():owner,ownerWidth=isOwnerNode?owner.outerWidth():0,ownerHeight=isOwnerNode?owner.outerHeight():0,scrollLeft=win.scrollLeft(),scrollTop=win.scrollTop(),winSize=this.__self.getWindowSize(),borderWidth=parseInt(this.elem("content").css("border-top-width"),10);
return{ownerWidth:ownerWidth,ownerHeight:ownerHeight,ownerLeft:ownerOffset.left,ownerTop:ownerOffset.top,ownerRight:ownerOffset.left+ownerWidth,ownerBottom:ownerOffset.top+ownerHeight,ownerHorizMiddle:ownerOffset.left+ownerWidth/2,ownerVertMiddle:ownerOffset.top+ownerHeight/2,posWidth:posElem.outerWidth(),posHeight:posElem.outerHeight(),underWidth:underElem.outerWidth(),underHeight:underElem.outerHeight(),borderWidth:isNaN(borderWidth)?0:borderWidth,windowLeft:scrollLeft,windowRight:scrollLeft+winSize.width,windowTop:scrollTop,windowBottom:scrollTop+winSize.height}
},_calcParams:function(){var d=this._calcDimensions();if(this.hasMod("adjustable","no"))return this.calcDirectionParams(this._direction,d);
var checkedDirections={},allowedDirections=this.params.directions,currentDirectionIdx=$.inArray(this._direction,allowedDirections);
currentDirectionIdx>-1||(currentDirectionIdx=0);var priorityDirectionIdx=currentDirectionIdx,currentDirection,params;
do{currentDirection=allowedDirections[currentDirectionIdx];params=checkedDirections[currentDirection]=this.calcDirectionParams(currentDirection,d);
if(!params.factor){this._lastDirection=currentDirection;return params}++currentDirectionIdx==allowedDirections.length&&(currentDirectionIdx=0)
}while(currentDirectionIdx!==priorityDirectionIdx);return checkedDirections[this._lastDirection||allowedDirections[0]]
},calcDirectionParams:function(direction,d){var factor,params=this.params,offsets={top:0,left:0},tailOffsets={marginLeft:0,marginTop:0},calcDirection=direction.split("-")[0],correctionHoriz=this._hasTail&&d.ownerWidth<params.tailWidthVertical?(params.tailWidthVertical-d.ownerWidth)/2:0,correctionVert=this._hasTail&&d.ownerHeight<params.tailHeightHorizontal?(params.tailHeightHorizontal-d.ownerHeight)/2:0;
switch(direction){case"up":case"down":offsets.left=d.ownerHorizMiddle-d.posWidth/2;offsets.top=direction=="down"?d.ownerBottom+params.tailHeightVertical:d.ownerTop-d.posHeight-params.tailHeightVertical;
tailOffsets.marginLeft=d.posWidth/2-params.tailWidthVertical/2;tailOffsets.marginTop=direction=="down"?0-params.tailHeightVertical:0;
break;case"up-left":case"up-right":case"down-left":case"down-right":offsets.left=direction=="down-right"||direction=="up-right"?d.ownerLeft-correctionHoriz:d.ownerRight-d.posWidth+correctionHoriz;
offsets.top=calcDirection=="down"?d.ownerBottom+params.tailHeightVertical:d.ownerTop-d.posHeight-params.tailHeightVertical;
tailOffsets.marginLeft=d.ownerWidth>d.posWidth?d.posWidth/2-params.tailWidthVertical/2:d.ownerHorizMiddle-offsets.left-params.tailWidthVertical/2;
tailOffsets.marginTop=calcDirection=="down"?d.borderWidth-params.tailHeightVertical:0-d.borderWidth;break;
case"left-down":case"right-down":offsets.left=direction=="left-down"?d.ownerLeft-d.posWidth-params.tailWidthHorizontal:d.ownerRight+params.tailWidthHorizontal;
offsets.top=d.ownerTop-correctionVert;tailOffsets.marginLeft=direction=="left-down"?0-d.borderWidth:d.borderWidth-params.tailWidthHorizontal;
tailOffsets.marginTop=d.ownerHeight<d.posHeight?d.ownerVertMiddle-offsets.top-params.tailHeightHorizontal/2:d.posHeight/2-params.tailHeightHorizontal/2;
break;case"left":case"right":offsets.left=direction=="left"?d.ownerLeft-d.posWidth-params.tailWidthHorizontal:d.ownerRight+params.tailWidthHorizontal;
offsets.top=d.ownerVertMiddle-d.posHeight/2;tailOffsets.marginLeft=direction=="left"?0-d.borderWidth:d.borderWidth-params.tailWidthHorizontal;
tailOffsets.marginTop=d.posHeight/2-params.tailHeightHorizontal/2;break;case"left-up":case"right-up":offsets.left=direction=="left-up"?d.ownerLeft-d.posWidth-params.tailWidthHorizontal:d.ownerRight+params.tailWidthHorizontal;
offsets.top=d.ownerBottom-d.posHeight+correctionVert;tailOffsets.marginLeft=calcDirection=="left"?0-d.borderWidth:d.borderWidth-params.tailWidthHorizontal;
tailOffsets.marginTop=d.ownerHeight>d.posHeight?d.posHeight/2-params.tailHeightHorizontal/2:d.ownerVertMiddle-offsets.top-params.tailHeightHorizontal/2
}factor=this.calcInWindowFactor(offsets,d);return{direction:calcDirection,factor:factor,offsets:offsets,tailOffsets:tailOffsets}
},calcInWindowFactor:function(pos,d){var res=0;d.windowTop>pos.top&&(res+=d.windowTop-pos.top);pos.top+d.underHeight>d.windowBottom&&(res+=pos.top+d.underHeight-d.windowBottom);
d.windowLeft>pos.left&&(res+=d.windowLeft-pos.left);pos.left+d.underWidth>d.windowRight&&(res+=pos.left+d.underWidth-d.windowRight);
return res},getDefaultParams:function(){return{tailOffset:19,tailWidthHorizontal:9,tailWidthVertical:19,tailHeightHorizontal:19,tailHeightVertical:10,shadowSize:7,directions:ALLOWED_DIRECTIONS}
},destruct:function(){var under=this._under;if(!under){this.__base.apply(this,arguments)}else if(!this._destructing){this._destructing=true;
this.hide();BEM.DOM.destruct(false,under.domElem);this.__base(true)}},_getUnder:function(){if(!this._under){var under=$(BEM.HTML.build({block:"i-popup",zIndex:this.params.zIndex,mods:{autoclosable:this.getMod("autoclosable")||"yes",fixed:this.hasMod("direction","fixed")&&"yes",type:this.getMod("type")},underMods:this.params.underMods,underMix:[{block:"b-popupa",elem:"under"}]}));
(this._under=this.findBlockOn(under,"i-popup")).on({show:this._onUnderShowed,hide:this._onUnderHidden,"outside-click":this._onUnderOutsideClicked},this).elem("content").append(this.domElem)
}return this._under},_onUnderShowed:function(){this._isShowed=true;this.bindToResize();this.trigger("show")
},_onUnderHidden:function(){this._isShowed=false;this.unbindFromResize();this.trigger("hide")},bindToResize:function(){this.bindToWin("resize",this.pos)._isOwnerNode()&&this.bindToDomElem(this._owner.parents().add(this.__self.win),"scroll",this.pos)
},unbindFromResize:function(){this.unbindFromWin("resize")._isOwnerNode()&&this.unbindFromDomElem(this._owner.parents().add(this.__self.win),"scroll")
},_onUnderOutsideClicked:function(){this.trigger.apply(this,arguments)}},{live:function(){this.liveBindTo("close","leftclick",function(){this.hide()
})}});BEM.HTML.decl("b-popupa",{onBlock:function(ctx){var hasClose=false;$.each(ctx.param("content"),function(i,item){return!(hasClose=item.elem=="close")
});ctx.mods({theme:"ffffff",direction:"down","has-close":hasClose&&"yes"}).js(true).afterContent({elem:"shadow"})
},onElem:{content:function(ctx){ctx.wrap({elem:"wrap-cell",tag:"td"}).wrap({tag:"tr"}).wrap({elem:"wrap",tag:"table"})
},close:function(ctx){ctx.tag("i")},shadow:function(ctx){ctx.tag("i")},tail:function(ctx){ctx.tag("i").wrapContent({elem:"tail-i",tag:"i"})
}}})})(jQuery);(function($){var template,underPool=[],browser=$.browser;function getUnder(){return underPool.length?underPool.shift():template?template.clone():template=createUnder()
}function putUnder(under){underPool.push(under)}function createUnder(){return $((browser.safari||browser.webkit)&&navigator.userAgent.toLowerCase().indexOf("mobile")>-1?"<div/>":"<iframe"+(browser.msie&&browser.version<9?' frameborder="0"':"")+"/>")
}BEM.DOM.decl("i-popup",{onSetMod:{js:function(){var bro=$.browser;if(bro.msie&&parseInt(bro.version)>=9){this.domElem[0].onresize=function(){this.className+=""
}}},visibility:{visible:function(){var under=this._getUnder(),underParent=under.parent();this.hasMod(under,"type","paranja")?underParent.is("body")||under.appendTo("body"):underParent[0]!==this.domElem[0]&&under.prependTo(this.domElem);
this._inBody||(this._inBody=!!this.domElem.appendTo("body"));this.trigger("show")},"":function(){var under=this._getUnder();
this.hasMod(under,"type","paranja")&&under.remove();this._putUnder();this.trigger("hide")}}},_getUnder:function(){return this._under||(this._under=getUnder().attr("class",this._underClass||(this._underClass=this.findElem("under").remove().attr("class"))))
},_putUnder:function(){putUnder(this._under);delete this._under},show:function(css){css&&this.domElem.css(css);
return this.setMod("visibility","visible")},hide:function(){return this.delMod("animate").delMod("visibility")
}},{live:true})})(jQuery);BEM.HTML.decl("i-popup",{onBlock:function(ctx){ctx.mod("autoclosable","yes").js(true).wrapContent({elem:"content"}).afterContent({elem:"under",mods:ctx.param("underMods"),mix:ctx.param("underMix")}).param("zIndex")&&ctx.attr("style","z-index:"+(32700+ctx.param("zIndex")))
}});BEM.DOM.decl("i-popup",{hide:function(e){if(window.selectClosing===2){window.selectClosing--}else if(window.selectClosing===1){window.selectClosing=0;
return}var hide=true;if(this.findBlockInside({block:"b-popupa",modName:"type",modVal:"apps"})){var _this=this;
this.afterCurrentEvent(function(){_this.findBlockOutside("b-page").findBlockInside({block:"b-link",modName:"open",modVal:"apps"}).bindClick()
})}if(this.hasMod("type","properties")&&!$(".b-paranja").bem("b-paranja").hasMod("hide","yes"))hide=false;
if(this.hasMod("type","search")){page().delMod("search-suggest");this.findBlocksInside("b-autocomplete-item").forEach(function(item){item.delMod("hovered")
})}hide&&this.__base.apply(this,arguments)},show:function(){if(this.hasMod("type","search")){page().setMod("search-suggest","shown")
}this.__base.apply(this,arguments)}});(function($){var KEYDOWN_EVENT=$.browser.opera&&$.browser.version<12.1?"keypress":"keydown";
BEM.DOM.decl({name:"i-popup",modName:"autoclosable",modVal:"yes"},{onSetMod:{visibility:{visible:function(){this.afterCurrentEvent(function(){if(this.hasMod("visibility","visible")){var under=this._under;
this.bindToDoc("leftclick",function(e){var $target=$(e.target);if(!this.containsDomElem($target)&&!$target.parents(".b-form-select__popup").length&&!$(document.activeElement).is(".b-form-slider__runner")){this._onOutClick(e);
e.stopPropagation()}}).bindToDoc(KEYDOWN_EVENT,function(e){e.keyCode==27&&this.hide()});if(under&&under.is("iframe")&&this.hasMod(under,"type","paranja")){this.bindToDomElem($([under[0].contentWindow,under[0].contentWindow.document]),"leftclick",this._onOutClick)
}}});this.__base.apply(this,arguments)},"":function(){return this.unbindFromDoc("leftclick "+KEYDOWN_EVENT).__base.apply(this,arguments)
}}},_onOutClick:function(domEvent){var e=$.Event("outside-click");this.trigger(e,{domEvent:domEvent});
e.isDefaultPrevented()||this.hide()}})})(jQuery);BEM.DOM.decl({name:"i-popup",modName:"autoclosable",modVal:"yes"},{_onOutClick:function(domEvent){var link=$(domEvent.target).closest(".b-link"),popupa=this.findBlockInside("b-popupa");
if(link.length&&popupa._owner&&popupa._owner.get(0)===link.get(0)&&this.getMod("type")==="bookmarks")return;
this.__base.apply(this,arguments)}});BEM.DOM.decl({block:"b-popupa",modName:"type",modVal:"bookmarks"},{show:function(){vb.stat("panel.bookpanel.folder");
this.__base.apply(this,arguments)}});blocks["b-popupa_type_apps"]=function(apps){return{block:"b-popupa",mods:{"only-direction":"up",direction:"up",theme:"ffffff",type:"apps"},content:[{elem:"close"},{elem:"tail"},{elem:"content",content:[blocks["apps"](apps)]}]}
};BEM.DOM.decl({block:"b-popupa",modName:"type",modVal:"apps"},{show:function(){var _this=this;this.__base.apply(this,arguments);
this.afterCurrentEvent(function(){_this._pos()});return this},_calcDimensions:function(){var posElem=this._getUnder().domElem,underElem=this._getUnder()._getUnder(),win=this.__self.win,owner=this._owner,isOwnerNode=this._isOwnerNode(),ownerOffset=isOwnerNode?owner.offset():owner,ownerWidth=isOwnerNode?owner.outerWidth():0,ownerHeight=isOwnerNode?owner.outerHeight():0,scrollLeft=win.scrollLeft(),scrollTop=win.scrollTop(),winSize=this.__self.getWindowSize(),borderWidth=parseInt(this.elem("content").css("border-top-width"),10);
var result={ownerWidth:ownerWidth,ownerHeight:ownerHeight,ownerTop:ownerOffset.top,ownerBottom:ownerOffset.top+ownerHeight,ownerLeft:0,ownerRight:0,ownerHorizMiddle:ownerOffset.left+ownerWidth/2,ownerVertMiddle:ownerOffset.top+ownerHeight/2,posWidth:posElem.outerWidth(),posHeight:posElem.outerHeight(),underWidth:underElem.outerWidth(),underHeight:underElem.outerHeight(),borderWidth:isNaN(borderWidth)?0:borderWidth,windowLeft:scrollLeft,windowRight:scrollLeft+winSize.width,windowTop:scrollTop,windowBottom:scrollTop+winSize.height};
return result}});(function(undefined){BEM.DOM.decl({block:"b-popupa",modName:"only-direction",modVal:"up"},{calcDirectionParams:function(direction,d){direction="up-right";
var factor,params=this.params,offsets={top:0,left:0},tailOffsets={marginLeft:0,marginTop:0},calcDirection=direction.split("-")[0],correctionHoriz=this._hasTail&&d.ownerWidth<params.tailWidthVertical?(params.tailWidthVertical-d.ownerWidth)/2:0,correctionVert=this._hasTail&&d.ownerHeight<params.tailHeightHorizontal?(params.tailHeightHorizontal-d.ownerHeight)/2:0;
offsets.left=direction=="down-right"||direction=="up-right"?d.ownerLeft-correctionHoriz:d.ownerRight-d.posWidth+correctionHoriz;
offsets.top=calcDirection=="down"?d.ownerBottom+params.tailHeightVertical:d.ownerTop-d.posHeight-params.tailHeightVertical;
tailOffsets.marginLeft=d.ownerWidth>d.posWidth?d.posWidth/2-params.tailWidthVertical/2:d.ownerHorizMiddle-offsets.left-params.tailWidthVertical/2;
tailOffsets.marginTop=calcDirection=="down"?d.borderWidth-params.tailHeightVertical:0-d.borderWidth;factor=this.calcInWindowFactor(offsets,d);
return{direction:calcDirection,factor:factor,offsets:offsets,tailOffsets:tailOffsets}}})})();(function(undefined){BEM.DOM.decl({block:"b-popupa",modName:"only-direction",modVal:"up-left"},{calcDirectionParams:function(direction,d){direction="up-left";
var factor,params=this.params,offsets={top:0,left:0},tailOffsets={marginLeft:0,marginTop:0},calcDirection=direction.split("-")[0],correctionHoriz=this._hasTail&&d.ownerWidth<params.tailWidthVertical?(params.tailWidthVertical-d.ownerWidth)/2:0,correctionVert=this._hasTail&&d.ownerHeight<params.tailHeightHorizontal?(params.tailHeightHorizontal-d.ownerHeight)/2:0;
offsets.left=direction=="down-right"||direction=="up-right"?d.ownerLeft-correctionHoriz:d.ownerRight-d.posWidth+correctionHoriz;
offsets.top=calcDirection=="down"?d.ownerBottom+params.tailHeightVertical:d.ownerTop-d.posHeight-params.tailHeightVertical;
tailOffsets.marginLeft=d.ownerWidth>d.posWidth?d.posWidth/2-params.tailWidthVertical/2:d.ownerHorizMiddle-offsets.left-params.tailWidthVertical/2;
tailOffsets.marginTop=calcDirection=="down"?d.borderWidth-params.tailHeightVertical:0-d.borderWidth;factor=this.calcInWindowFactor(offsets,d);
return{direction:calcDirection,factor:factor,offsets:offsets,tailOffsets:tailOffsets}}})})();blocks["stat-popup"]=function(data){var md=require("lib").markdownLinkToHTML;
return{block:"stat-popup",content:[{elem:"logo-wrapper",content:{elem:"logo-link",url:data.branding.logo.url,content:{elem:"logo",url:data.branding.logo.img}}},{elem:"header",content:vb.getLocalizedString("modalStat.header")},{elem:"paragraph",tag:"p",content:vb.getLocalizedString("modalStat.text")+' <a href="'+vb.getLocalizedString("modalStat.moreInfoLink")+'" target="_blank">'+vb.getLocalizedString("modalStat.moreInfoText")+"</a>."},{block:"b-form-button",mods:{theme:"islands",size:"big",color:"yellow",name:"accept-send-stat"},content:vb.getLocalizedString("modalStat.accept")},{block:"b-form-button",mods:{theme:"islands",size:"big",name:"deny-send-stat"},content:vb.getLocalizedString("modalStat.cancel")}]}
};BEM.DOM.decl("stat-popup",{onSetMod:{js:function(){this.show();var _this=this;this.findBlockInside({block:"b-form-button",modName:"name",modVal:"accept-send-stat"}).on("click",function(){vb.setSendStatistics(true,true);
_this.delMod("visibility")});this.findBlockInside({block:"b-form-button",modName:"name",modVal:"deny-send-stat"}).on("click",function(){vb.setSendStatistics(false,true);
_this.delMod("visibility")})},visibility:{"":function(){$(".b-paranja").bem("b-paranja").setMod("hide","yes")
}}},show:function(){this.setMod("visibility","visible")},hide:function(){this.delMod("visibility")}});
(function(){var DEFAULT_THUMB_BGCOLOR="f2f2f2",DEFAULT_SCREENSHOT_BGCOLOR="#f9f9f9",DEFAULT_SCREENSHOT_COLOR="ffffff";
function getEmptyThumbColor(color){return"add-"+(color||cache.get("background").color||"808080")}blocks["b-tumb"]=function(item,index,size,isSuggest){index=parseInt(index,10);
var blocks=require("bem").blocks,BEM=require("bem").BEM,Lib=require("lib"),parseURL=require("parseURL"),thumbType=Lib.getThumbType(item),modSize=Lib.getThumbSizeMod(size);
if(!item||!item.url){return blocks["b-tumb_state_empty"].apply(this,arguments)}item=$.extend({},item);
var backgroundColor=(item.backgroundColor||"").trim()||DEFAULT_THUMB_BGCOLOR;var bgColor=item.backgroundColor,rgb=bgColor&&bgColor.match(/(\w{2})(\w{2})(\w{2})/).slice(1).map(function(color){return parseInt(color,16)
})||null,almostWhite=253,isWhite="";if(isSuggest&&rgb&&(rgb[0]>almostWhite||rgb[1]>almostWhite||rgb[2]>almostWhite)){isWhite="yes"
}var colorTheme=item.fontColor?"ffffff":"000000",title=BEM.blocks["i-common__string"].escapeHTML((item.title||"").trim());
if(thumbType===6){colorTheme="000000"}return{block:"b-tumb",url:item.url,bg:thumbType===6&&item.screenshot.color?"transparent":"#"+backgroundColor,mods:{size:modSize,iswhite:isWhite,index:""+index,pinned:item.pinned?"yes":"no",color:colorTheme,editing:(cache.get("editingThumb")||{}).index==index?"yes":"no",type:thumbType,suggest:isSuggest?"yes":""},attrs:{draggable:true,"aria-label":"thumb"+(index+1)},js:{index:index,item:item},content:[function(){var url=BEM.blocks["i-common__string"].escapeHTML(Lib.getUnicodedURL(parseURL(item.url).host?parseURL(item.url).host:item.url));
if(url==="clck.yandex.ru"){url=title;title=""}if(vb.navigator==="ie"&&vb.navigatorMajorVersion<9){url=url.slice(0,40);
title=title.slice(0,40)}if(vb.navigator==="firefox"){url=url.slice(0,98);title=title.slice(0,98)}url=url.replace(/^www\./,"");
url=url.charAt(0).toUpperCase()+url.slice(1);switch(thumbType){case 1:return[{elem:"text",content:url},!item.isIndexPage&&title&&{elem:"desc",content:title}];
case 2:case 3:return[{block:"b-icon",mix:[{block:"b-tumb",elem:"bg-image"}],url:item.backgroundImage,alt:title},thumbType===3&&{elem:"desc",content:title}];
case 4:case 5:return[{elem:"brand",content:[{elem:"brand-fav",content:{block:"b-icon",mix:[{block:"b-tumb",elem:"fav-image"}],url:item.favicon,alt:title}},{elem:"brand-url",content:[{elem:"brand-url_wrap",content:url}]}]},thumbType===5&&{elem:"desc",content:title}];
case 6:var fontColor;if(rgb&&(rgb[0]<almostWhite||rgb[1]<almostWhite||rgb[2]<almostWhite)){bgColor=item.backgroundColor;
fontColor=item.fontColor}else{bgColor=item.screenshot.color;fontColor=item.screenshot.fontColor}return[{block:"b-icon",mix:[{block:"b-tumb",elem:"screenshot-image"}],url:item.screenshot.url,alt:title},{elem:"crop",content:function(){if(vb.navigator==="ie"&&vb.navigatorMajorVersion>10){return{block:"b-tumb",elem:"screenshot-image-blur",content:[{block:"svg",content:[{elem:"filter",value:"3"},{elem:"image",url:item.screenshot.url}]}]}
}else{return{block:"b-icon",mix:[{block:"b-tumb",elem:"screenshot-image-blur"}],url:item.screenshot.url,alt:title}
}}()},{elem:"screenshot-color",attrs:{style:"background-color: #"+(bgColor||DEFAULT_SCREENSHOT_COLOR)}},{elem:"text",attrs:{style:"color: #"+(fontColor&&"ffffff"||"000000")},content:[item.isIndexPage&&{elem:"site-name",content:url},!item.isIndexPage&&{elem:"site-title",content:title||url}]}]
}}(),{elem:"helper"},{elem:"hint"},!isSuggest&&thumbType===6&&{elem:"control-bg",elemMods:{hide:"yes"}},!isSuggest&&{elem:"control",elemMods:{hide:"yes"},content:function(){var control=[{elem:"control-item-click",content:{elem:"control-item",attrs:{title:item.pinned?vb.getLocalizedString("app.unpinThumb"):vb.getLocalizedString("app.pinThumb")},elemMods:{type:item.pinned?"unpin":"pin"},js:{index:index}}},{elem:"control-item-click",content:{elem:"control-item",attrs:{title:vb.getLocalizedString("app.editThumb")},elemMods:{type:"set"},js:{index:index}}},{elem:"control-item-click",content:{elem:"control-item",attrs:{title:vb.getLocalizedString("app.removeThumb")},elemMods:{type:"del"},js:{index:index}}}];
return control}()}]}};function normalizeThumb(raw){return $.extend({pinned:false},raw)}channels("api").on("thumbChanged",function(newThumbs){var oldThumbs=cache.get("thumbs"),updated=[],repined=[],isSameObjects=require("utils").isSameObjects;
Object.keys(newThumbs).forEach(function(index){var newThumb=normalizeThumb(newThumbs[index]),oldThumb=normalizeThumb(oldThumbs[index]);
delete newThumb.statParam;delete oldThumb.statParam;var newThumbKeys=Object.keys(newThumb),oldThumbKeys=Object.keys(oldThumb);
if(isSameObjects(newThumb,oldThumb)){return}if(newThumbKeys.length===1){if(oldThumbKeys.length!==1){updated.push(index);
return}if(newThumb.pinned!==newThumb.pinned){repined.push(index);return}return}if(newThumbKeys.length!==oldThumbKeys.length){updated.push(index);
return}if(newThumb.pinned!==oldThumb.pinned){if(newThumb.url===oldThumb.url){repined.push(index)}else{updated.push(index)
}return}updated.push(index)});Object.keys(newThumbs).forEach(function(index){oldThumbs[index]=normalizeThumb(newThumbs[index])
});cache.set("thumbs",oldThumbs);repined.forEach(function(index){var pinned=(newThumbs[index]||{}).pinned,thumb=page().findBlockInside({block:"b-tumb",modName:"index",modVal:""+index}),item=thumb&&thumb.findElem("control-item","type",pinned?"pin":"unpin");
if(thumb&&item){thumb.setMod(item,"type",pinned?"unpin":"pin")}});var BEM=require("bem").BEM,blocks=require("bem").blocks,BEMHTML=require("bemhtml"),thumbs=cache.get("thumbs");
updated.forEach(function(index){var item=thumbs[index],thumb=page().findBlockInside({block:"b-tumb",modName:"index",modVal:""+index});
if(thumb){var size=parseInt(thumb.domElem.width(),10),oldItem=thumb.params.item,html=BEMHTML.apply(blocks["b-tumb"](item,index,size));
if(oldItem&&item&&oldItem.screenshot&&item.screenshot&&oldItem.screenshot.url!==item.screenshot.url){(function(html,thumb){$('<img style="top: -1000px; left: -1000px; opacity:0; position:absolute;" src="'+item.screenshot.url+'">').prependTo("body").on("load",function(){if(thumb.domElem){BEM.DOM.update(thumb.domElem.parent(),BEMHTML.apply(html))
}$(this).remove()}).on("error",function(){$(this).remove()})})(html,thumb)}else{BEM.DOM.update(thumb.domElem.parent(),html)
}}})});blocks["b-tumb_state_empty"]=function(item,index,size,isSuggest){index=parseInt(index,10);var Lib=require("lib"),modSize=Lib.getThumbSizeMod(size);
item=item||{pinned:false};return{block:"b-tumb",mods:{size:modSize,index:""+index,color:"000000",theme:!isSuggest?getEmptyThumbColor():"",editing:(cache.get("editingThumb")||{}).index==index?"yes":"no",state:"empty",suggest:isSuggest?"yes":""},js:{index:index,empty:"yes",item:item},attrs:{draggable:false,"aria-label":"thumb"+(index+1)}}
};channels("api").on("historyThumbChanged",function(item){var editingThumb=cache.get("editingThumb")||{};
if(editingThumb.data&&editingThumb.data.url===item.url){editingThumb.data=item;cache.set("editingThumb",editingThumb)
}});channels("cache").on("editingThumb",function(newVal,oldVal){var editingThumb=$(".b-tumb").bem("b-tumb").__self.getEditingThumb();
if(editingThumb){if(newVal.data){editingThumb.beAnotherThumb(newVal.data)}else{editingThumb.beNormal()
}}});BEM.DOM.decl("b-tumb",{_timerId:null,onSetMod:{js:function(){this.isSuggest=this.getMod("suggest")==="yes";
if(!this.params.item.backgroundColor){this.setMod("white","yes")}var _self=this.__self,_this=this,$img=this.domElem.find("img");
if(!_self._bThumbs||!_self._bThumbs.domElem){_self._bThumbs=this.findBlockOutside("b-tumbs")}if(!$img.length)return;
$img.on("error",function(e){_this._onImageCorrupted(e)});$img.on("load",function(e){if($img.width()===1&&$img.height()===1){_this._onImageCorrupted(e)
}})},"show-hint":function(modName,modVal,oldVal){if(modVal==="yes"){this.findElem("hint").text(parseInt(this.params.index,10)+1)
}else if(modVal===""){this.findElem("hint").text("")}}},onElemSetMod:{"control-item":{type:{pin:function(elem){elem.attr("title",vb.getLocalizedString("app.pinThumb"))
},unpin:function(elem){elem.attr("title",vb.getLocalizedString("app.unpinThumb"))}}}},_onImageCorrupted:function(e){var bgClass=this.buildSelector("bg-image").slice(1),favClass=this.buildSelector("fav-image").slice(1),screenshotClass=this.buildSelector("screenshot-image").slice(1),index=this.params.index,$target=$(e.target),thumbs=cache.get("thumbs"),updateThumb=false;
if($target.hasClass(bgClass)){updateThumb=true;delete thumbs[index].backgroundImage}else if($target.hasClass(favClass)){updateThumb=true;
delete thumbs[index].favicon}else if($target.hasClass(screenshotClass)){updateThumb=true;delete thumbs[index].screenshot
}if(updateThumb){cache.set("thumbs",thumbs);this.__self.repaintThumbs([index])}},_openSpeculativeConnect:function(){vb.openSpeculativeConnect(this.params.item.url)
},_repin:function(newPin){var index=parseInt(this.getMod("index"),10);this.__base.apply(this,arguments);
newPin?vb.pinThumb(index):vb.unpinThumb(index);vb.stat("thumb.pin."+(newPin?"on":"off"));return this},beAnotherThumb:function(item){if(!this.domElem){return
}this.beNormal();this.setMod("fake","yes");var blocks=require("bem").blocks,settings=cache.get("settings"),bemjson=blocks["b-tumb"](item,this.params.index,this.domElem.width(),false),html=require("bemhtml").apply(bemjson);
this.domElem.after(html);var newThumb=this.domElem.next();newThumb.css({position:"absolute",left:0,top:0});
this.beFakeTransparent()},_onMouseOver:function(){if(page().isSettingsShown())return;if(this.isSuggest){if(!this.params.empty){var editingThumb=cache.get("editingThumb");
editingThumb.data=$.extend({},this.params.item);cache.set("editingThumb",editingThumb)}return}this._timerId=setTimeout(function(){if(!this.params)return;
if(this.domElem){if(this.params.empty&&!this.hasMod("editing","yes")){this.setMod("show-border","yes");
this.setMod("show-plus","yes")}else{this._onControlShow()}}}.bind(this),700)},_onMouseOut:function(){if(page().isSettingsShown())return;
if(this.isSuggest){var editingThumb=cache.get("editingThumb");if(editingThumb){delete editingThumb.data;
cache.set("editingThumb",editingThumb)}return}if(this.domElem){var settingsBlock=page().findBlockInside("b-setting");
this.setMod(this.findElem("control"),"hide","yes");if(this.hasMod("type","6")){this.setMod(this.findElem("control-bg"),"hide","yes")
}if(!settingsBlock||settingsBlock.getMod("hide")==="yes")this.delMod("show-border");this.delMod("show-plus")
}if(this._timerId){clearTimeout(this._timerId)}},_onControlShow:function(){if(this.__self.isSettingsShown())return;
try{if(this.hasMod("type","6")){this.delMod(this.findElem("control-bg"),"hide")}this.delMod(this.findElem("control"),"hide")
}catch(e){}},_onControlItemClick:function(e,type){e.stopPropagation();e.preventDefault();if(this.__self.isSettingsShown())return;
var handler="_on"+type.capitalize(),bThumbs=this.findBlockOutside("b-tumbs"),item=bThumbs.findElem("item","index",this.getMod("index"));
bThumbs.delMod(item,"state");if(!(handler in this)){throw ReferenceError('No handler for control item type "'+type+'" need implementation of method "'+handler+'"')
}this[handler].apply(this)},_onPin:function(e){this.pin()},_onUnpin:function(e){this.unpin()},_onSet:function(settingsMod,fromContextMenu){this._set.apply(this,arguments)
},_onDel:function(fromContextMenu){this.remove(fromContextMenu)},_set:function(settingsMod,fromContextMenu){settingsMod=settingsMod||this.params.empty?"add":"set";
if(!fromContextMenu){vb.stat("thumb."+settingsMod)}this.stopDnD();var bPage=page(),bThumbs=bPage.findBlockInside("b-tumbs"),bSetting=bPage.findBlockInside("b-setting"),index=this.getMod("index");
if(!bSetting){var blocks=require("bem").blocks,newJson=[blocks["b-setting"]()],BEMHTML=require("bemhtml");
BEM.DOM.append(bPage.domElem,BEMHTML.apply(newJson));bSetting=bPage.findBlockInside("b-setting")}bThumbs.findBlocksInside(this.__self.getName()).forEach(function(block){block.delMod("state").delMod("editing")
});bThumbs.delMod(bThumbs.findElem("item"),"editing","no");bThumbs.setMod(bThumbs.findElem("item","index",index),"editing","yes");
this.setMod("editing","yes");cache.set("editingThumb",{index:index});var item=cache.get("thumbs")[this.params.index],title=item&&item.title||"";
bSetting.findBlockInside({block:"b-form-input",modName:"type",modVal:"url"}).val(item&&item.url||"");
bSetting.findBlockInside({block:"b-form-input",modName:"type",modVal:"title"}).val(title.trim());bSetting.delMod("hide");
bSetting.setMod("action",settingsMod)},normalizeEvent:function(e){var original=e.originalEvent,$window=$(window);
if(!e.pageX&&(original.pageX||original.clientX)){e.pageX=original.pageX||original.clientX+$window.scrollLeft();
e.pageY=original.pageY||original.clientY+$window.scrollTop();e.clientX=original.clientX;e.clientY=original.clientY
}},_dragCheck:function(e){this.normalizeEvent(e);var classes=$(e.currentTarget.activeElement).attr("class"),check;
if(this.isSuggest){return false}if(page().isSettingsShown()){return false}if(classes){check=classes.indexOf("b-tumb")!==-1&&classes.indexOf("b-tumb-lib")===-1;
check=check&&classes.indexOf("b-tumbs")===-1&&classes.indexOf("b-tumbs-lib")===-1}else{check=false}if(classes&&classes.indexOf("b-tumb__control-item")!==-1&&vb.navigator==="ie"&&e.type==="dragstart"){e.preventDefault();
$(e.target).click();return false}if(!this.domElem||!this.params)return false;if(this.__self.stopDnD){e.preventDefault();
return false}if(vb.navigatorMajorVersion<9)return true;if(!check&&e.type==="drop")e.preventDefault();
if(classes.indexOf("b-tumb")!==-1&&e.type==="dragleave"&&(this.domElem.offset().left<e.clientX&&this.domElem.offset().left+this.domElem.width()>e.clientX)&&(this.domElem.offset().top<e.clientY&&this.domElem.offset().top+this.domElem.height()>e.clientY))return false;
if(e.type!=="dragstart"&&!this.__self._bThumbs)return false;return true},_hideClone:function(){this.__self._clone.css({position:"fixed",left:"-9999px",top:"-9999px"})
},_isDnDTime:function(){if(!this.hasHttpURL())return true;return this._dndStarted=this._dndStarted?true:this.dragstart+this.__self._dragTimeout<(new Date).valueOf()
},_isDnD:function(e){if(this._isDnDTime())return true;if(this.__self._cursor&&vb.navigator==="ie"&&vb.navigatorMajorVersion<10){var x=e.pageX,y=e.pageY,deltaX=Math.abs(x-this.__self._cursor.x),deltaY=Math.abs(y-this.__self._cursor.y);
if(this.__self._maxDelta>deltaX+deltaY){this._hideClone();return false}}return true},_locateDragPic:function(e,fromTimeout){var _self=this.__self;
if(_self._dragImageShown&&fromTimeout||vb.navigator!=="ie")return;if(!_self._clone||!_self._dragged)return;
if(vb.navigatorMajorVersion>9)return;_self._dragImageShown=true;_self._clone.css({position:"fixed",left:1+e.clientX+"px",top:1+e.clientY+"px"});
_self._dragged.setMod("state","dragged")},hasHttpURL:function(){return/^https?:\/\/.+/.test(this.params.item.url)
},forceDragStart:function(){var thumbElement=this.domElem.get(0),_self=this.__self;if(this.params.empty==="yes")return;
if(this.hasHttpURL())return;if(thumbElement.dragDrop){_self.dragTimeouts.push(setTimeout(function(){thumbElement.dragDrop()
},_self._showCloneTime))}},_onDragstart:function(e){if(!this._dragCheck(e)){e.preventDefault();return
}if(vb.navigator==="firefox"){var desc=this.elem("desc"),text=this.elem("text"),url=this.elem("brand-url");
if(desc.length){desc.text(desc.text().substring(0,40))}if(text.length){text.text(text.text().substring(0,30))
}if(url.length){url.text(url.text().substring(0,35))}this.domElem.css("boxShadow","none")}this._onMouseOut();
this.__self.clean();this.__self._saveThumbsTimeoutId&&clearTimeout(this.__self._saveThumbsTimeoutId);
this.__self._saveThumbsTimeoutId=null;var self=this,_self=this.__self,dt=e.originalEvent.dataTransfer,$self=self.domElem,offset=$self.offset();
var cursor={x:e.pageX,y:e.pageY};this.__self.getEmptyThumbs().forEach(function(thumb){thumb.setMod("show-border","yes")
});_self._cursor=$.extend(cursor,{left:cursor.x-offset.left,top:offset.top-cursor.y});_self._draggingIndex=self.params.index;
if(vb.navigator==="ie"){self.dragstart=(new Date).valueOf();self._dndStarted=false}_self._dragged=self;
_self._clone=$self.clone();_self._bThumbs=self.findBlockOutside("b-tumbs");_self._clone.width($self.width()).height($self.height()).find(_self._dragged.buildSelector("control-bg")).remove().end().find(_self._dragged.buildSelector("control")).remove().end().find(_self._dragged.buildSelector("control-item")).remove();
_self._clone.appendTo(_self.doc[0].body).css({position:"fixed",left:"-9999px",zIndex:9999});dt.effectAllowed="move";
if(dt.setDragImage){var domNode=this.domElem.get(0);dt.setData("index",_self._dragged.params.index);dt.setDragImage(domNode,~~(_self._clone.width()/2),~~(_self._clone.height()/2))
}if(vb.navigator==="ie"){setTimeout(function(){self._locateDragPic.call(self,e,true)},this.hasHttpURL()?this.__self._showCloneTime:0)
}this.afterCurrentEvent(function(){this.beFakeEmpty()})},beFakeEmpty:function(){if(this.params.empty)return;
if(!this.domElem)return;this.setMod("pseudo-empty","yes");this.setMod("theme",getEmptyThumbColor());var $this=this.domElem;
$this.attr("data-style",$this.attr("style"));$this.removeAttr("style")},beFakeTransparent:function(){if(this.params.empty)return;
this.setMod("pseudo-transparent","yes");var $this=this.domElem;$this.attr("data-style",$this.attr("style"));
$this.removeAttr("style")},beNormal:function(){if(!this.domElem)return;this.delMod("fake");var fakeThumb=this.domElem.next();
if(fakeThumb.length&&fakeThumb.is(".b-tumb")){fakeThumb.remove()}if(this.params.empty)return;this.delMod("pseudo-empty");
this.delMod("pseudo-transparent");this.delMod("theme");var $this=this.domElem;$this.attr("style",$this.attr("data-style"));
$this.removeAttr("data-style")},_onClick:function(e){if($(e.target).attr("class").indexOf("control-item")>0){return
}if(this.getMod("editing")==="yes"){e.preventDefault();return}if(!this.params)return;if(this.isSuggest){if(e.which===3)return;
if(!this.hasMod("state","empty")){var radio=this.findBlockOutside("b-setting").findBlockInside("radio-button"),param=radio.val()==="top-sites"?"thumb.adddone.popular.":"thumb.adddone.recent.",offset=parseInt(page().findBlockInside("b-tumbs-lib").getMod("offset"),10),thumbIndex=parseInt(this.getMod("index"),10)+1+offset;
page().findBlockInside("b-setting").submitThumb(param+thumbIndex,this.params.item)}return}if(this.findBlockOutside("b-page").isSettingsShown()){e.preventDefault();
return}if(!this.hasMod("state","empty")&&!this.params.empty){vb.openThumb(this.domElem.attr("href"),parseInt(this.params.index,10),this.__self._getNavigateCode(e))
}else{if(this.hasMod("show-plus","yes")&&e.which!==2&&e.which!==3)this.add()}if(vb.navigator==="chromium")e.preventDefault();
if(vb.navigator==="ie"){this.domElem&&this.domElem.blur()}if(!this.hasMod("state","empty")&&!this.params.empty){var index=this.params.index,statParam=(cache.get("thumbs")[index]||{}).statParam;
if(statParam&&e.which!==3)vb.stat("thumb.click."+(index+1)+"."+statParam)}return true},_onDrag:function(e){if(!this._dragCheck(e))return;
var self=this,dt=e.originalEvent.dataTransfer;self.__self._clone&&!dt.setDragImage&&this.dragstart+this.__self._showCloneTime<(new Date).valueOf()&&this._isDnD(e)&&this._locateDragPic(e)
},_hideEmptyThumbs:function(){this.__self.getEmptyThumbs().forEach(function(thumb){thumb.delMod("show-border")
})},_onDragend:function(e){if(!this._dragCheck(e))return;var _self=this.__self,bThumbs=_self._bThumbs;
bThumbs.findBlocksInside({block:"b-tumb",modName:"state",modVal:"dragged"}).forEach(function(block){block.delMod("state")
});bThumbs.findElem("item","state","current").each(function(index){bThumbs.delMod($(this),"state","current")
});_self.clean();_self._dragImageShown=false;this._hideEmptyThumbs();this.afterCurrentEvent(function(){this.beNormal()
})},_onDragover:function(e){if($(e.currentTarget.activeElement).hasClass("b-link"))return;if(!this._dragCheck(e))return;
e.preventDefault();var dt=e.originalEvent.dataTransfer;dt.dropEffect="move"},_onDragenter:function(e){if(!this._dragCheck(e))return;
e.preventDefault();var self=this;if(this.__self._draggingIndex===null)return;if(this._isDnD(e)&&!this.params.empty&&!this.hasMod("pseudo-empty","yes"))self.__self._bThumbs.setMod(self.domElem.parent(),"state","current")
},_onDragleave:function(e){if(!this._dragCheck(e))return;var self=this,bThumbs=self.__self._bThumbs;if($(e.currentTarget.activeElement).hasClass("b-link"))return;
bThumbs.findElem("item","state","current").each(function(index){bThumbs.delMod($(this),"state","current")
})},_handleBadClick:function(e){var _self=this.__self,mouseX=_self._cursor.x,mouseY=_self._cursor.y,clicked=false;
this.findElem("control-item-click").each(function(i,elem){var $elem=$(elem),height=$elem.height(),width=$elem.width(),offset=$elem.offset();
if(offset.left<mouseX&&mouseX<offset.left+width&&offset.top<mouseY&&mouseY<offset.top+height){elem.click();
clicked=true;return false}});if(clicked)return;var inNewTab=e.shiftKey&&e.ctrlKey,inNewWindow=e.shiftKey&&!e.ctrlKey,url=this.domElem.attr("href");
if(url){if(inNewTab){$('<a href="'+url+'" target="_blank" class="temp-link"></a>').appendTo("body").get(0).click();
$(".temp-link").remove()}else if(inNewWindow){window.open(url,"_blank","toolbar=0,location=0,menubar=0")
}else{window.location.href=url}var navigateCode=function(){if(inNewWindow)return 2;if(inNewTab)return 3;
return 1}();vb.openThumb(url,parseInt(this.getMod("index"),10),navigateCode)}if(vb.navigator==="ie"){this.domElem&&this.domElem.blur()
}_self.clean()},_onDrop:function(e){e.preventDefault();if(!this._dragCheck(e))return;var self=this,_self=this.__self,bThumbs=_self._bThumbs;
if(!this._isDnD(e)){this._handleBadClick(e);return}this._hideEmptyThumbs();_self._dropzone=self;if(!_self._dragged)return _self.clean();
var thumbs=$.extend({},cache.get("thumbs")),dropzoneIndex=parseInt(_self._dropzone.params.index,10),draggedIndex=parseInt(_self._dragged.params.index,10),newThumb=thumbs[draggedIndex]&&$.extend({},thumbs[draggedIndex],{pinned:true})||null,movedThumb=thumbs[dropzoneIndex]&&$.extend({},thumbs[dropzoneIndex])||null,$dropzone=$(".b-tumbs__item_index_"+draggedIndex),isTransitioned=_self._isTransitionedDnd();
if(dropzoneIndex===draggedIndex){bThumbs.findBlocksInside({block:"b-tumb",modName:"state",modVal:"dragged"}).forEach(function(block){block.delMod("state")
});bThumbs.findElem("item","state","current").each(function(index){bThumbs.delMod($(this),"state","current")
});_self.clean();return}vb.stat("thumb.dnd");thumbs[dropzoneIndex]=newThumb;thumbs[draggedIndex]=movedThumb;
if(movedThumb){thumbs[draggedIndex]=movedThumb}else{delete thumbs[draggedIndex]}cache.set("thumbs",thumbs);
if(!isTransitioned){_self.repaintThumbs([draggedIndex,dropzoneIndex]);bThumbs.findBlocksInside({block:"b-tumb",modName:"state",modVal:"dragged"}).forEach(function(block){block.delMod("state")
});bThumbs.findElem("item","state","current").each(function(index){bThumbs.delMod($(this),"state","current")
});_self.clean();vb.swapThumbs(draggedIndex,dropzoneIndex);return}var draggingSelector=this.buildSelector("state","dragged").substring(1),currentSelector=this.buildSelector("state","current").substring(1),tumbsCurrentSelector="b-tumbs__item_state_current",draggingTumbOriginal=this.findBlockOutside("b-tumbs").findBlockInside({block:"b-tumb",modName:"index",modVal:""+_self._draggingIndex});
draggingTumbOriginal.beNormal();var $draggingTumbOriginal=draggingTumbOriginal.domElem.removeClass(draggingSelector).parent().removeClass(tumbsCurrentSelector),cursor={x:e.originalEvent.pageX,y:e.originalEvent.pageY},$self=self.domElem,$body=$("body"),offsetForDropzone=$self.offset(),offsetForDragzone=$draggingTumbOriginal.offset(),$selfCloned=$self.parent().clone().appendTo($body).removeClass("b-tumbs__item_state_current").css({"z-index":100,left:offsetForDropzone.left,top:offsetForDropzone.top,position:"absolute","margin-left":"0"}),$draggingTumbClone=$draggingTumbOriginal.clone().appendTo($body).removeClass(currentSelector).css($.extend({},$dropzone.offset(),{position:"absolute","margin-left":"0"}));
if(this.params.empty){$draggingTumbOriginal.css("visibility","hidden")}this.afterCurrentEvent(function(){this.beFakeTransparent();
draggingTumbOriginal.beFakeTransparent();$draggingTumbClone.css($.extend({zIndex:3},$selfCloned.offset()));
$selfCloned.css($.extend({zIndex:2},offsetForDragzone))});bThumbs.delMod(bThumbs.findElem("item","state","current"),"state");
var transitionEvents=["transitionend","webkitTransitionEnd","MSTransitionEnd"];function transitionHandler(e){transitionEvents.forEach(function(event){$selfCloned.off(event,transitionHandler);
_self.transitioning=false});vb.swapThumbs(draggedIndex,dropzoneIndex);self.afterCurrentEvent(function(){$draggingTumbOriginal.css("visibility","visible");
_self.repaintThumbs([dropzoneIndex,draggedIndex]);_self.clean();$selfCloned.remove();$draggingTumbClone.remove();
$selfCloned=null;$draggingTumbClone=null},self);_self.stopDnD=false}transitionEvents.forEach(function(event){$selfCloned.on(event,transitionHandler)
});_self.stopDnD=true;_self.transitioning=true},stopDnD:function(){this.__self.clean();this.__self.stopDnD=true;
return this},startDnD:function(){var _self=this.__self;if(_self.transitioning){_self.stopDnD=true;return
}var id;while(id=_self.dragTimeouts.pop()){clearTimeout(id)}_self.stopDnD=false;return this},unpin:function(){this._repin(false);
return this},pin:function(){this._repin(true);return this},remove:function(fromContextMenu){var self=this;
if(!fromContextMenu)vb.stat("thumb.del");require("modals").confirm(vb.getLocalizedString("app.confirmRemoveThumb"),function(confirmed){if(!confirmed)return;
vb.stat("thumb.deldone");var BEMHTML=require("bemhtml"),thumbs=cache.get("thumbs"),blocks=require("bem").blocks,Lib=require("lib"),winSize=self.__self.getWindowSize(),size=parseInt(self.domElem.width(),10),index=parseInt(self.params.index,10),bTumbs=self.findBlockOutside("b-tumbs"),elemItem=bTumbs.findElem("item","index",index+"");
delete thumbs[index];BEM.DOM.update(self.domElem.parent(),BEMHTML.apply(blocks["b-tumb"](null,index,size)));
cache.set("thumbs",thumbs);vb.removeThumb(index)});return this},set:function(fromContextMenu){this._set("set",fromContextMenu);
return this},add:function(fromContextMenu){this._set("add",fromContextMenu);return this},isSuggest:null},{_getNavigateCode:function(e){var code=1;
if(e.shiftKey){code=2}else if(e.ctrlKey||e.metaKey){code=3}if(e.which===2){code=3}return code},isSettingsShown:function(){var setting=$(".b-page").bem("b-page").findBlockInside("b-setting");
if(setting&&setting.getMod("hide")!=="yes")return true;return false},clean:function(){this._clone&&this._clone.remove();
this._clone=null;this._dragged=null;this._dropzone=null;this._cursor=null;this._draggingIndex=null},_dndStarted:false,_showCloneTime:400,_dragTimeout:400,_dragImageShown:false,_maxDelta:30,_cursor:null,stopDnD:false,_cloneOfDraggingThumbPosition:function(dropCursor,self){var navigator=vb.navigator;
return{left:dropCursor.x-self.width()/2,top:dropCursor.y-self.height()/2}},_isTransitionedDnd:function(){return vb.navigator==="ie"&&vb.navigatorMajorVersion>9||vb.navigator==="firefox"||vb.navigator==="chromium"
},_dragged:null,_dropzone:null,dragTimeouts:[],prefix:function(){switch(vb.navigator){case"ie":return"-ms-";
case"firefox":return"-moz-";case"chromium":return"-webkit-"}return""},_clone:null,_bThumbs:null,_draggingIndex:null,_saveThumbsTimeoutId:null,getEmptyThumbs:function(){return["000000","808080","ffffff"].reduce(function(arr,color){return arr.concat(page().findBlocksInside({block:"b-tumb",modName:"theme",modVal:"add-"+color}))
},[])},getEditingThumb:function(){var index=(cache.get("editingThumb")||{}).index,editingThumb=null;if(typeof index==="string"){editingThumb=page().findBlockInside("b-tumbs").findBlockInside({block:"b-tumb",modName:"index",modVal:index})
}return editingThumb},live:function(){var self=this,ie78=vb.navigator==="ie"&&vb.navigatorMajorVersion<9;
self.liveBindTo("control-item-click","leftclick",function(e){var itemClass=this.buildSelector("control-item"),item=$(e.target).closest(itemClass);
if(!item.length)item=$(e.target).children(itemClass);e.preventDefault();this._onControlItemClick(e,this.getMod(item,"type"));
return false}).liveBindTo("click",function(e){if(this.isSuggest)return this._onClick(e);if($(e.target).hasClass(this.buildSelector("click").slice(1))||vb.navigator==="ie")this._onClick(e)
});if(!ie78){self.liveBindTo("dragstart",function(){this._onDragstart.apply(this,arguments)}).liveBindTo("dragend",function(){this._onDragend.apply(this,arguments)
}).liveBindTo("dragover",function(){this._onDragover.apply(this,arguments)}).liveBindTo("dragenter",function(){this._onDragenter.apply(this,arguments)
}).liveBindTo("dragleave",function(){this._onDragleave.apply(this,arguments)}).liveBindTo("drop",function(){this._onDrop.apply(this,arguments)
})}if(vb.navigator==="ie"&&vb.navigatorMajorVersion===9){self.liveBindTo("drag",function(){this._onDrag.apply(this,arguments)
});self.liveBindTo("text","mousedown",function(e){e.preventDefault()})}self.liveBindTo("mouseover",function(){if(!this.params)return;
this._onMouseOver.apply(this,arguments);if(this.params.empty==="yes"||this._connected)return;this._openSpeculativeConnect(this.params.item.url);
this._connected=true});self.liveBindTo("mouseout",function(){this._onMouseOut.apply(this,arguments)});
self.liveBindTo("control","mouseover",function(){this._onControlShow.apply(this,arguments)});return false
},repaintThumbs:function(indexes){if(!indexes.length)return;var self=this,BEM=require("bem").BEM,blocks=require("bem").blocks,BEMHTML=require("bemhtml"),winSize=page().__self.getWindowSize(),thumbs=cache.get("thumbs"),Lib=require("lib");
indexes.forEach(function(index){var item=thumbs[index],thumb=page().findBlockInside({block:"b-tumb",modName:"index",modVal:""+index});
if(thumb){var size=parseInt(thumb.domElem.width(),10),oldItem=thumb.params.item,html=BEMHTML.apply(blocks["b-tumb"](item,index,size));
if(oldItem&&item&&oldItem.screenshot&&item.screenshot&&oldItem.screenshot.url!==item.screenshot.url){(function(html,thumb){$('<img style="top: -1000px; left: -1000px; opacity:0; position:absolute;" src="'+item.screenshot.url+'">').prependTo("body").on("load",function(){BEM.DOM.update(thumb.domElem.parent(),BEMHTML.apply(html));
$(this).remove()}).on("error",function(){$(this).remove()})})(html,thumb)}else{BEM.DOM.update(thumb.domElem.parent(),html)
}}})}})})();BEM.HTML.decl("b-link",{onBlock:function(ctx){ctx.tag("a").attr("href",ctx.param("url"));
var props=["title","target"],p;while(p=props.pop())ctx.param(p)&&ctx.attr(p,ctx.param(p))}});BEM.DOM.decl({block:"b-link",modName:"open",modVal:"bookmark"},{_popupa:null,TITLE_MAX_LENGTH:70,CLOSED_WINDOWS_DELIMETER:", ",onSetMod:{js:function(){var self=this;
self.__base.apply(self,arguments);self._popupa=self._popupa||self.findBlockOutside({block:"b-dropdowna",modName:"type",modVal:"closed-bookmarks"}).findBlockInside("b-popupa");
self.on("click",self._requestClosedPagesList,self)}},destruct:function(){this.un("click",this._requestClosedPagesList,this);
this.__base.apply(this,arguments)},_requestClosedPagesList:function(){var titleMaxLength=this.TITLE_MAX_LENGTH,delimeter=this.CLOSED_WINDOWS_DELIMETER,popupa=this._popupa,BEMHTML=require("bemhtml"),Lib=require("lib"),BEM=require("bem").BEM;
if(!popupa.isShowed())return;vb.stat("panel.closedtabs");vb.requestClosedPagesList(function(closed){var items=[];
closed.forEach(function(item){var title;if(!item.isWindow){title=BEM.blocks["i-common__string"].escapeHTML(item.title&&item.title.trim()||"");
items.push({elem:"item",content:{block:"b-link",js:{id:item.id},mix:[{block:"i-action",elem:"restore-tab"}],mods:{inner:"yes",pseudo:"yes"},content:[{block:"b-wrap",content:{block:"b-icon",mix:[{block:"b-link",elem:"icon"}],url:item.favicon||"",width:16,height:16,alt:title}},{elem:"inner",content:[title,title.length>titleMaxLength&&{elem:"gradient"}],attrs:{title:title}}]}})
}else{var domainsStr=item.domains.map(function(domain){return BEM.blocks["i-common__string"].escapeHTML(Lib.getUnicodedURL(domain))
}).join(", ");title=vb.getLocalizedString("app.closedWindow")+": "+domainsStr;items.push({elem:"item",content:{block:"b-link",js:{id:item.id},mix:[{block:"i-action",elem:"restore-tab"}],mods:{inner:"yes",restore:"windows",pseudo:"yes"},content:[{elem:"inner",content:[title,title.length>titleMaxLength&&{elem:"gradient",mods:{"closed-pages":"yes"}}||null],attrs:{title:title}}]}})
}});if(!closed.length){items.push({elem:"item",content:{block:"b-link",mods:{inner:"yes",pseudo:"yes",disabled:"yes"},content:vb.getLocalizedString("app.empty")}})
}popupa.setContent(BEMHTML.apply({block:"b-menu-vert",mods:{type:"close-bookmark"},js:true,content:items}))
})}});(function($,BEM,undefined){function sendStat(e,param){if(e.which!==3)vb.stat(param)}BEM.DOM.decl("i-action",{hidePopups:function(e){if(e.which===3)return;
$(":focus").blur();this.findBlocksInside("b-form-input").forEach(function(input){input.clear()});this.findBlocksInside("i-popup").forEach(function(block){block.hide()
})},_onThumbListArrowClick:function(direction){var bTumbsLib=this.findBlockInside("b-tumbs-lib"),currentOffset=parseInt(bTumbsLib.getMod("offset"),10),state=bTumbsLib.getMod(bTumbsLib.findElem("arrow","type",direction),"state"),offset;
if(state==="disabled")return;if(direction==="right"){offset=currentOffset+10}else{if(currentOffset<10)offset=0;
else offset=currentOffset-10}bTumbsLib.drawThumbsByOffset(offset)}},{live:function(){this.liveBindTo("settings","leftclick",function(e){var page=this.findBlockOn("b-page");
if(!page.isSettingsShown()){vb.stat("panel.settings");page.showSettings()}else{page.hideSettings()}});
this.liveBindTo("index","click",function(){this.trigger("config_cancel")});this.liveBindTo("upload-background-image","click",function(e){if(e.which!==3){this.findBlockInside("b-select-theme").uploadUserBackground()
}});this.liveBindTo("close-search-tutorial","click",function(){this.findBlockOn("b-page").setMod("banner","no");
vb.search.suppressTutorial()});this.liveBindTo("try-tutorial","click",function(e){var text=this.findBlockInside({block:"b-link",modName:"omni",modVal:"yes"}).domElem.text();
e.preventDefault();vb.search.useExample(text)});this.liveBindTo("sync-vb","click",function(e){var button=e.data.domElem.bem("b-form-button");
if(button.hasMod("disabled","yes"))return;button.delMod("focused").setMod("disabled","yes");setTimeout(function(){if(button&&button.domElem){button.delMod("disabled")
}},3e3);vb.stat("settings.synconvb");vb.sync.enableSyncVB()});this.liveBindTo("show-bookmarks","click",function(e){sendStat(e,"panel.bookmarks");
if(e.which!==3){vb.openExternalWindow("bookmarks")}});this.liveBindTo("bookmark","click",function(e){sendStat(e,"panel.bookpanel.link")
});this.liveBindTo("show-history","click",function(e){sendStat(e,"panel.history");if(e.which!==3){vb.openExternalWindow("history")
}});this.liveBindTo("show-downloads","click",function(e){sendStat(e,"panel.downloads");if(e.which!==3){vb.openExternalWindow("downloads")
}});this.liveBindTo("hide-popup","click",function(e){this.hidePopups(e)});this.liveBindTo("restore-tab","leftclick",function(e){e.preventDefault();
var bLinkClassName="b-link",$link=$(e.target).closest("."+bLinkClassName),id=$link.bem(bLinkClassName).params.id;
vb.stat("panel.closedtabs."+($(".i-action__restore-tab").index($link)+1));this.hidePopups(e);vb.restoreTab(id)
});this.liveBindTo("more-tumbs-right","click",function(e){e.preventDefault();this._onThumbListArrowClick("right")
});this.liveBindTo("more-tumbs-left","click",function(e){e.preventDefault();this._onThumbListArrowClick("left")
});this.liveBindTo("open-sync-page","click",function(e){this.hidePopups(e);var statParam="settings.syncon";
if(cache.get("sync").status===3){statParam="settings.syncfix"}sendStat(e,statParam);vb.sync.openWP()});
this.liveBindTo("turn-on-vb-sync","click",function(e){vb.sync.enableSyncVB();return false});this.liveBindTo("sync-settings-link","click",function(e){sendStat(e,"settings.syncset");
vb.sync.openWP()});this.liveBindTo("login","leftclick",function(e){e.preventDefault();vb.stat("auth.loginclick");
vb.auth.login()});this.__base.apply(this,arguments)}})})(jQuery,BEM);BEM.DOM.decl("button",{onSetMod:{js:function(){var disabled=this.isDisabled(),domElem=this.domElem;
(this._href=domElem.attr("href"))&&disabled&&domElem.removeAttr("href")},disabled:function(modName,modVal){var isDisabled=modVal==="yes",domElem=this.domElem;
this._href&&(isDisabled?domElem.removeAttr("href"):domElem.attr("href",this._href));this.afterCurrentEvent(function(){domElem.attr("disabled",isDisabled)
})},pressed:function(modName,modVal){if(this.isDisabled()){return false}this.trigger(modVal==="yes"?"press":"release")
}},isDisabled:function(){return this.hasMod("disabled","yes")},url:function(val){if(typeof val==="undefined"){return this._href
}else{this._href=val;this.isDisabled()||this.domElem.attr("href",val);return this}},_onClick:function(e){this.isDisabled()?e.preventDefault():this.afterCurrentEvent(function(){this.trigger("click")
})}},{live:function(){this.liveBindTo("leftclick tap",function(e){this._onClick(e)})}});BEM.DOM.decl("button",{onSetMod:{js:function(){this.__base.apply(this,arguments)
},focused:{yes:function(){if(this.isDisabled()){return false}this.bindToWin("unload",function(){this.delMod("focused")
}).bindTo("keydown",this._onKeyDown);this._isControlFocused()||this._getControl().focus();this.afterCurrentEvent(function(){this.trigger("focus")
})},"":function(){this.unbindFromWin("unload").unbindFrom("keydown");this._isControlFocused()&&this._getControl().blur();
this.afterCurrentEvent(function(){this.trigger("blur")})}},disabled:function(modName,modVal){this.__base.apply(this,arguments);
modVal==="yes"&&this.domElem.keyup()},hovered:function(modName,modVal){if(this.isDisabled()){return false
}modVal===""&&this.delMod("pressed")},pressed:function(){this.isDisabled()||this.setMod("focused","yes");
return this.__base.apply(this,arguments)}},_getControl:function(){return this.elem("control").length&&this.elem("control")||this.domElem
},_isControlFocused:function(){try{return this.containsDomElem($(this.__self.doc[0].activeElement))}catch(e){return false
}},_onKeyDown:function(e){var keyCode=e.keyCode;if((keyCode===13||keyCode===32)&&!this._keyDowned){this._keyDowned=true;
this.setMod("pressed","yes").bindTo("keyup",function(){this.delMod("pressed").unbindFrom("keyup");delete this._keyDowned;
if(keyCode===32&&this.domElem.attr("href")){document.location=this.domElem.attr("href")}})}},destruct:function(){this.delMod("focused");
this.__base.apply(this,arguments)}},{live:function(){this.__base.apply(this,arguments);var eventsToMods={mouseover:{name:"hovered",val:"yes"},mouseout:{name:"hovered"},mousedown:{name:"pressed",val:"yes"},mouseup:{name:"pressed"},focusin:{name:"focused",val:"yes"},focusout:{name:"focused"}},isIE8=$.browser.msie&&$.browser.version==="8.0";
this.liveBindTo("mouseover mouseout mouseup focusin focusout",function(e){var mod=eventsToMods[e.type];
this.setMod(mod.name,mod.val||"");if(isIE8&&!this._href&&(e.type==="mouseup"||e.type==="mouseout")){this.domElem.height()
}}).liveBindTo("mousedown",function(e){var mod=eventsToMods[e.type];e.which===1&&this.setMod(mod.name,mod.val||"")
})}});BEM.DOM.decl("b-form-button",{onSetMod:{js:function(){var disabled=this.isDisabled();(this._href=this.domElem.attr("href"))&&disabled&&this.domElem.removeAttr("href");
this.elem("input").attr("disabled",disabled)},focused:{yes:function(){var _this=this;if(_this.isDisabled())return false;
_this.bindTo("keydown",this._onKeyDown).elem("input").is(":focus")||_this.elem("input").focus();_this._unloadInited||(_this._unloadInited=$(window).bind("unload",function(){_this.delMod("focused")
}))},"":function(){this.unbindFrom("keydown").elem("input").blur()}},disabled:function(modName,modVal){var disable=modVal=="yes";
this._href&&(disable?this.domElem.removeAttr("href"):this.domElem.attr("href",this._href));disable&&this.domElem.keyup();
this.afterCurrentEvent(function(){this.domElem&&this.elem("input").attr("disabled",disable)})},pressed:function(modName,modVal){this.isDisabled()||this.trigger(modVal=="yes"?"press":"release");
this.isDisabled()||this.setMod("focused","yes")},hovered:{"":function(){this.delMod("pressed")}},"*":function(modName){if(this.isDisabled()&&"hovered pressed".indexOf(modName)>-1)return false
}},isDisabled:function(){return this.hasMod("disabled","yes")},url:function(val){if(typeof val=="undefined"){return this._href
}else{this._href=val;this.isDisabled()||this.domElem.attr("href",val);return this}},_onKeyDown:function(e){var keyCode=e.keyCode;
if((keyCode==13||keyCode==32)&&!this._keyDowned){this._keyDowned=true;this.setMod("pressed","yes").bindTo("keyup",function(){this.delMod("pressed").unbindFrom("keyup");
delete this._keyDowned;if(keyCode==32&&this.domElem.attr("href")){document.location=this.domElem.attr("href")
}})}},_onClick:function(e){this.isDisabled()?e.preventDefault():this.afterCurrentEvent(function(){this.trigger("click")
})},destruct:function(){this.delMod("focused");this.__base.apply(this,arguments)}},{live:function(){var eventsToMods={mouseover:{name:"hovered",val:"yes"},mouseout:{name:"hovered"},mousedown:{name:"pressed",val:"yes"},mouseup:{name:"pressed"},focusin:{name:"focused",val:"yes"},focusout:{name:"focused"}};
this.liveBindTo("leftclick",function(e){this._onClick(e)}).liveBindTo("mouseover mouseout mouseup focusin focusout",function(e){var mod=eventsToMods[e.type];
this.setMod(mod.name,mod.val||"")}).liveBindTo("mousedown",function(e){var mod=eventsToMods[e.type];e.which==1&&this.setMod(mod.name,mod.val||"")
})}});BEM.HTML.decl("b-form-button",{onBlock:function(ctx){ctx.tag(ctx.param("url")?"a":"span").attrs({href:ctx.param("url"),target:ctx.param("target")}).mods({size:ctx.mod("size"),theme:ctx.mod("theme")}).content([{elem:"left",tag:"i"},{elem:"content",tag:"span",content:{elem:"text",tag:"span",content:ctx.content()}}],true).afterContent(ctx.param("type")?{elem:"input",attrs:{value:ctx.param("value")||"",type:ctx.param("type"),name:ctx.param("name"),disabled:ctx.mod("disabled")&&"disabled"}}:{elem:"click"}).js(true)
},onElem:{input:function(ctx){ctx.tag("input")},click:function(ctx){ctx.tag("i")}}});BEM.DOM.decl("b-form-button",{onSetMod:{js:function(){this.bindToDoc("mousedown",function(e){if(!$(e.target).is(this.buildSelector("input")))this.delMod("focused")
})}}});BEM.DOM.decl({block:"b-form-button",modName:"action",modVal:"set-as-homepage"},{_onClick:function(e){vb.setAsHomePage();
var $this=this.domElem,page=this.findBlockOutside("b-page");setTimeout(function(){$this.after(vb.getLocalizedString("settings.isHomePage")).end().remove();
page.getSettingsBlock()._pos()},0);vb.stat("settings.home")}});(function(){BEM.DOM.decl("i-menu",{onElemSetMod:{item:{state:{current:function(elem,modName,modVal,oldModVal){if(oldModVal=="disabled")return false;
var prev=this.elem("item","state","current");this.delMod(prev,"state").trigger("current",{prev:prev,current:elem})
}}}},onItemSelectorClick:function(e){var item=this._getItemByEvent(e);this.setMod(item,"state","current")
},_getItemByEvent:function(e){return e.data.domElem.closest(this.buildSelector("item"))}},{live:function(){this.liveBindTo("item-selector","leftclick",function(e){this.onItemSelectorClick(e)
})}})})();(function(){BEM.DOM.decl({name:"b-menu-horiz",baseBlock:"i-menu"})})();(function(){BEM.DOM.decl({name:"b-menu-vert",baseBlock:"i-menu"},{},{live:function(){this.__base()
}})})();blocks["blocker"]=function(){return{block:"blocker",mods:{disabled:"yes"}}};blocks["gradient"]=function(){return{block:"gradient"}
};(function(){var WIN_WIDTH_DELTA=19;var MAX_APP_WIDTH=140;var APPS_SIDE_PADDING=55;function getWidth(){return $(".b-vb-foot").width()
}blocks["apps"]=function(apps){return{block:"apps",js:{apps:apps},content:[{elem:"arrow",mods:{type:"left",state:"disabled"}},{elem:"list"},{elem:"arrow",mods:{type:"right",state:"disabled"}}]}
};BEM.DOM.decl("apps",{onSetMod:{js:function(){var arrows=this.getArrows();this.setMod("offset",0);this.domElem.width(getWidth()-WIN_WIDTH_DELTA);
this.bindToWin("resize",$.throttle(this._onWinResize,300));this.bindTo(arrows.left,"click",function(){if(this.getMod(arrows.left,"state")=="disabled")return;
this.drawApps(parseInt(this.getMod("offset"),10)-this.getAppsCount())});this.bindTo(arrows.right,"click",function(){if(this.getMod(arrows.right,"state")=="disabled")return;
this.drawApps(parseInt(this.getMod("offset"),10)+this.getAppsCount())});this.apps=this.params.apps;this.drawApps(0)
}},getArrows:function(){return{left:this.findElem("arrow","type","left"),right:this.findElem("arrow","type","right")}
},redrawApps:function(){var offset=0,_this=this;vb.apps.requestList(function(apps){_this.apps=apps;if($(".app").length>1){offset=parseInt(_this.getMod("offset"),10)
}else{_this.setMod("offset","0")}_this.drawApps(offset)})},drawApps:function(offset){var BEMHTML=require("bemhtml"),appsCount=this.getAppsCount(),apps=this.apps.slice(offset,offset+appsCount),list=this.findElem("list"),arrows=this.getArrows(),blockRightArrow=this.apps.slice(offset+appsCount,offset+appsCount+1).length===0,blockLeftArrow=offset===0,appsBlocks;
if(apps.length){appsBlocks=apps.map(function(app,i){return{block:"app",js:{id:app.id},content:[{elem:"icon",url:app.icon,alt:app.title},{elem:"title",content:app.title},{elem:"btn"}]}
})}else{appsBlocks=[{block:"app",mods:{empty:"yes"},content:[{elem:"icon"},{elem:"title",content:vb.getLocalizedString("footer.apps.missing")}]}]
}blockRightArrow&&this.setMod(arrows.right,"state","disabled")||this.delMod(arrows.right,"state");blockLeftArrow&&this.setMod(arrows.left,"state","disabled")||this.delMod(arrows.left,"state");
list.html(BEMHTML.apply(appsBlocks));BEM.DOM.init(list);this.setMod("offset",offset);this.popupa().pos()
},getAppsCount:function(){var normalWidth=getWidth(),count=1,currentAppsWidth=APPS_SIDE_PADDING*2;while(normalWidth>currentAppsWidth){currentAppsWidth+=MAX_APP_WIDTH;
count++}return count-1},popupa:function(){if(this._popupa&&this._popupa.domElem){return this._popupa}return this._popupa=this.findBlockOutside("b-popupa")
},_onWinResize:function(){this.domElem.width(getWidth()-WIN_WIDTH_DELTA);this.drawApps(this.getMod("offset"))
}})})();BEM.DOM.decl("app",{_timer:null,onSetMod:{js:function(){this.bindTo("mouseenter",function(){var _this=this;
this._timer=setTimeout(function(){_this.setMod("show-btn","yes")},400)});this.bindTo("mouseleave",function(e){this._timer&&clearTimeout(this._timer);
this.delMod("show-btn")})}}},{live:function(){this.liveBindTo("click",function(){vb.apps.launch(this.params.id)
});this.liveBindTo("btn","click",function(){var _this=this;vb.apps.uninstall(this.params.id,function(){_this.findBlockOutside("apps").redrawApps()
});return false});return false}});(function($){var bro=$.browser,isOpera=bro.opera&&bro.version<13,KEYDOWN_EVENT=bro.opera&&bro.version<12.1?"keypress":"keydown",hasOwn=Object.prototype.hasOwnProperty,BEMDOM=BEM.DOM,generateDirectionsCache,needRepaintShadow=bro.msie&&bro.version>=9&&bro.version<10,getActiveElement=function(doc){try{return doc.activeElement
}catch(e){}};BEM.DOM.decl("popup",{getDefaultParams:function(){var tailOffset={left:15,right:15,top:15,bottom:15};
return{directions:[{to:"bottom",axis:"center",tail:{axis:"center"}},{to:"top",axis:"center",tail:{axis:"center"}},{to:"right",axis:"middle",tail:{axis:"middle"}},{to:"left",axis:"middle",tail:{axis:"middle"}}],tail:{width:24.04,height:12.02,offset:tailOffset},duration:150}
},onSetMod:{js:function(){this._cache={};this._viewport=BEMDOM.win;this._scope=BEMDOM.scope;this._channel=BEM.channel("popups");
this._inContainer=false;this._isParentFixed=false;this._owner=null;this._userPosition=null;this._parent=null;
this._childs=[];this._isShown=false;this._isHiding=false;this._positions={};this._currPos={};this._visibilityFactor=null;
this._direction=false;this._directions={};var defaultParams=this.getDefaultParams(),userParams=this.params,defaults=this._repackDirParams(defaultParams.directions),directions=userParams.generateDirections?this._generateDirections:userParams.directions,user=this._repackDirParams(directions);
if(userParams.tail){this.params.tail=this._mergeParams(defaultParams.tail,userParams.tail)}this._order=user.keys.map(function(key){var userDirection=user.directions[key],defaultDirection=defaults.directions[key];
defaultDirection||(defaultDirection=defaults.directions[userDirection.to]);this._directions[key]=this._mergeParams(defaultDirection,userDirection,{tail:this._tailParamsHook});
return key},this)},visibility:{visible:function(){this._onShown()},"":function(){this._onHidden()}}},show:function(params){var owner;
if(params instanceof BEM){owner=params.domElem.eq(0)}else if(params instanceof $){owner=params}else if(!params){return
}if(owner){if(this._owner&&owner[0]!==this._owner[0]){this.delMod("visibility")}this._owner=owner;var parent=this._findParent(owner);
parent&&this.setParent(parent)}else{this._userPosition=params}return this.setMod("visibility","outside").repaint()
},hide:function(){if(this._isHiding){return this}if(this._isShown){this._isHiding=true;this._childs.forEach(function(child){child.hide()
});if(this.hasMod("animate","yes")&&!this.hasMod("fade-out","no")){var _this=this;this.beforeHide(function(){_this.domElem&&_this.delMod("visibility")
});return this}}return this.delMod("visibility")},toggle:function(owner){return this._isShown&&!this._isHiding?this.hide():this.show(owner||this._owner)
},repaint:function(){this._moveToContainer();var direction=this._pickDirection();this.setMod("to",direction.to)._show(this._positions[direction.key],this._tailPos&&this._tailPos[direction.key]);
return this},repaintShadowIfNeeded:function(){needRepaintShadow&&this._repaintShadow();return this},getCurrPos:function(){return this._currPos
},getCurrDirection:function(){return this._direction},setContent:function(content){BEMDOM.update(this.elem("content"),content);
this._resetDefault();this._isShown&&this.repaint();return this},isShown:function(){return this._isShown
},setParent:function(parent){this._parent=parent;this._isParentFixed=parent.hasMod("position","fixed");
parent.addChild(this);return this},addChild:function(child){var childs=this._childs,len=childs.length,i=0;
for(;i<len;i++){if(childs[i]._uniqId===child._uniqId){return}}child.on("hide",function(){this.removeChild(child)
},this);childs.push(child)},removeChild:function(child){var childs=this._childs,len=childs.length,i=0;
for(;i<len;i++){if(childs[i]._uniqId===child._uniqId){childs.splice(i,1);return}}},setSize:function(dimensions){if(dimensions){this._resetDefault();
this.domElem.css(dimensions);if(this._isShown&&!this._isHiding){this.repaint()}}return this},_show:function(position,tailPos){this._currPos=position;
tailPos&&this.elem("tail").removeAttr("style").css(tailPos);this.domElem.css(position);(!this._isShown||this._isHiding)&&(this.hasMod("animate","yes")&&!this.hasMod("fade-in","no"))&&this.afterShow();
this._isHiding=false;this.setMod("visibility","visible");return this},_onShown:function(){this.bindToDoc(KEYDOWN_EVENT,function(e){if(e.which===27){if(this._childs.length===0){this.hide()
}}});this._bindFocusEvents();this._attachUnder();this._isShown=true;if(this.hasMod("autoclosable","yes")){this.afterCurrentEvent(function(){this._enableAutoclosable()
})}if(this.hasMod("adaptive","yes")){this._enableAdaptive()}this._channel.on("hide",this.hide,this);this.trigger("show")
},_onHidden:function(){this._unbindFocusEvents();this.unbindFromDoc(KEYDOWN_EVENT);this._detachUnder();
if(this.hasMod("autoclosable","yes")){this._disableAutoclosable()}if(this.hasMod("adaptive","yes")){this._disableAdaptive()
}this._cache={};this._isShown=false;this._isHiding=false;this._channel.un("hide");this._returnFocus();
this.trigger("hide")},_bindFocusEvents:function(){this._lastFocused=$(getActiveElement(document)||this._scope);
var focusable=this.__self._getFocusable(this.elem("content"));this._firstFocusable=focusable.first();
this._lastFocusable=focusable.last();this._skipReturnFocus=false;if(this._firstFocusable.length===0){this._skipReturnFocus=true;
return}this.bindTo(this._lastFocused,"keydown",this._onLastFocusedKeyDown).bindTo(this._firstFocusable,"keydown",this._onFirstFocusableKeyDown).bindTo(this._lastFocusable,"keydown",this._onLastFocusableKeyDown)
},_unbindFocusEvents:function(){this.unbindFrom(this._firstFocusable,"keydown");this.unbindFrom(this._lastFocusable,"keydown");
this.unbindFrom(this._lastFocused,"keydown")},_onLastFocusedKeyDown:function(e){if(e.ctrlKey||e.altKey||e.metaKey){return
}if(e.which===9){e.preventDefault();this[e.shiftKey?"_lastFocusable":"_firstFocusable"].focus()}},_onFirstFocusableKeyDown:function(e){if(e.ctrlKey||e.altKey||e.metaKey){return
}if(e.shiftKey&&e.which===9){e.preventDefault();this._lastFocused.focus()}},_onLastFocusableKeyDown:function(e){if(e.shiftKey||e.ctrlKey||e.altKey||e.metaKey){return
}if(e.which===9){e.preventDefault();this._lastFocused.focus()}},_returnFocus:function(){var skipReturnFocus=(this._parent||{})._skipReturnFocus||this._skipReturnFocus;
if(!skipReturnFocus){this._lastFocused.focus()}},_mergeParams:function(defaultParams,userParams,hooks){var res={};
hooks||(hooks={});if(defaultParams&&typeof defaultParams==="object"){Object.keys(defaultParams).forEach(function(key){res[key]=defaultParams[key]
})}Object.keys(userParams).forEach(function(key){var hookRes=hasOwn.call(hooks,key)?hooks[key].call(this,defaultParams[key],userParams[key]):userParams[key];
if(!hookRes||typeof hookRes!=="object"||Array.isArray(hookRes)){res[key]=hookRes}else if(defaultParams[key]){res[key]=this._mergeParams(defaultParams[key],hookRes,hooks)
}else{res[key]=hookRes}},this);return res},_tailParamsHook:function(defaultParams,userParams){if(!userParams.offset){userParams.offset=this.params.tail.offset
}return typeof userParams.offset==="number"?{offset:{left:userParams.offset,top:userParams.offset}}:userParams
},_generateDirections:function(){if(generateDirectionsCache){return generateDirectionsCache}var directions=[["bottom","top"],["left","right"]],axises=[["center","left","right"],["middle","top","bottom"]],tailAxises=axises,directionsLen=directions.length,res=[];
for(var tier=0;tier<directionsLen;tier++){var directionsTier=directions[tier],tierLen=directionsTier.length;
for(var j=0;j<tierLen;j++){var axisesTier=axises[tier],axisesTierLen=axisesTier.length;for(var k=0;k<axisesTierLen;k++){var tailAxisesTier=tailAxises[tier],tailAxisesTierLen=tailAxisesTier.length;
for(var l=0;l<tailAxisesTierLen;l++){res.push({direction:directionsTier[j],axis:axisesTier[k],tail:{axis:tailAxisesTier[l]}})
}}}}generateDirectionsCache=res;return res},_repackDirParams:function(dirParams){var directions={},keys=[];
if(typeof dirParams==="string"||$.isPlainObject(dirParams)){dirParams=[dirParams]}keys=dirParams.map(function(direction){if(typeof direction==="string"){var keys=direction.split("-");
direction={to:keys[0],tail:{}};keys[1]&&(direction.axis=keys[1]);keys[2]&&(direction.tail.axis=keys[2])
}var key=direction.to;if(!directions[key]){directions[key]=direction}if(direction.axis){key+="-"+direction.axis
}direction.key=key;directions[key]=direction;return key},this);return{directions:directions,keys:keys}
},setViewport:function(viewport){this._viewport=viewport;return this},_pickDirection:function(){var order=this._order,len=this.hasMod("adaptive","yes")?order.length:1,i;
this._visibilityFactor=0;for(i=0;i<len;i++){var key=order[i],direction=this._directions[key];this._resetPos(key)._pushPos(key,this._calcPos(direction))._pushPos(key,this._calcOffsets(direction));
this._hasTail()&&this._resetTailPos(key)._pushTailPos(key,this._calcTailPos(direction))._pushTailPos(key,this._calcTailOffset(direction))._pushPos(key,this._calcOffsetByTail(direction));
this._pushPos(key,this._getParentOffset());var visibilityFactor=this._calcVisibilityFactor(direction);
if(visibilityFactor>this._visibilityFactor||!this._direction){this._visibilityFactor=visibilityFactor;
this._direction=this._directions[key];this.size=this.getPlacingSize();if(visibilityFactor===100){break
}}}return this._direction},_getParentOffset:function(){var offset=this.domElem.offsetParent().offset();
offset.left*=-1;offset.top*=-1;return offset},_calcPos:function(direction){this._calcPlacingSize(direction);
var ownerPos=this.getOwnerPos(),ownerSize=this.getOwnerSize(),popupSize=this.getPlacingSize(),axis=direction.axis,userPos=this.params.position||{},position={};
switch(direction.to){case"bottom":position={top:hasOwn.call(userPos,"top")?userPos.top:ownerPos.top+ownerSize.height,left:hasOwn.call(userPos,"left")?userPos.left:this._calcLeft(axis)};
break;case"top":position={top:hasOwn.call(userPos,"top")?userPos.top:ownerPos.top-popupSize.height,left:hasOwn.call(userPos,"left")?userPos.left:this._calcLeft(axis)};
break;case"left":position={top:hasOwn.call(userPos,"top")?userPos.top:this._calcTop(axis),left:hasOwn.call(userPos,"left")?userPos.left:ownerPos.left-popupSize.width};
break;case"right":position={top:hasOwn.call(userPos,"top")?userPos.top:this._calcTop(axis),left:hasOwn.call(userPos,"left")?userPos.left:ownerPos.left+ownerSize.width};
break}return position},_calcTop:function(axis){var top=0,popupSize=this.getPlacingSize(),ownerPos=this.getOwnerPos(),ownerSize=this.getOwnerSize();
if(axis==="top"){top+=ownerPos.top}else if(axis==="middle"){top+=ownerPos.top+ownerSize.height/2-popupSize.height/2
}else if(axis==="bottom"){top+=ownerPos.top+ownerSize.height-popupSize.height}return top},_calcLeft:function(axis){var left=0,popupSize=this.getPlacingSize(),ownerPos=this.getOwnerPos(),ownerSize=this.getOwnerSize();
if(axis==="left"){left+=ownerPos.left}else if(axis==="center"){left+=ownerPos.left+ownerSize.width/2-popupSize.width/2
}else if(axis==="right"){left+=ownerPos.left+ownerSize.width-popupSize.width}return left},getPlacingSize:function(){return this.getPopupSize()
},_calcOffsets:function(direction){var cache=this._cache.offset||(this._cache.offset={}),key=direction.key,offsetParams=direction.offset,offset;
if(cache[key]){return cache[key]}if(!offsetParams){return false}offset={left:0,top:0};if(typeof offsetParams==="number"){switch(key){case"left":offset.left+=offsetParams;
break;case"right":offset.left-=offsetParams;break;case"top":offset.top+=offsetParams;break;case"bottom":offset.top-=offsetParams;
break}}else{if(offsetParams.left){offset.left+=offsetParams.left}if(offsetParams.right){offset.left-=offsetParams.right
}if(offsetParams.top){offset.top+=offsetParams.top}if(offsetParams.bottom){offset.top-=offsetParams.bottom
}}cache[key]=offset;return offset},_hasTail:function(){return this.elem("tail").length!==0},_moveToContainer:function(container){if(container){this._inContainer=false
}else{if(this._isShown){return}container=this._parent?this._parent.domElem:this._scope}this.domElem.appendTo(container);
this._inContainer=true},_resetPos:function(key){key?this._positions[key]=null:this._positions={};return this
},_pushPosTo:function(target,key,offset){if(offset===false){return}if(typeof key==="string"){this._sum(target[key]||(target[key]={}),offset)
}else{offset=key;Object.keys(target).forEach(function(key){this._sum(target[key],offset)},this)}},_pushPos:function(key,offset){this._pushPosTo(this._positions,key,offset);
return this},_sum:function(source,adds){Object.keys(adds).forEach(function(key){source[key]=(source[key]||0)+adds[key]
})},_getSizeOf:function(domElem){return{height:domElem.outerHeight(),width:domElem.outerWidth()}},getOwnerSize:function(){return this._owner?this._cache.ownerSize||(this._cache.ownerSize=this._getSizeOf(this._owner)):{height:0,width:0}
},getPopupSize:function(){return this._getSizeOf(this.domElem)},_getPosOf:function(domElem){return domElem.offset()||{left:0,top:0}
},getOwnerPos:function(){var pos;if(this._owner){pos=this._getPosOf(this._owner);if("pageYOffset"in window){pos.top-=window.pageYOffset-(document.documentElement.scrollTop||document.body.scrollTop);
pos.left-=window.pageXOffset-(document.documentElement.scrollLeft||document.body.scrollLeft)}}return pos||this._userPosition
},_calcVisibilityFactor:function(direction){var viewport=this._viewport,viewportSize=this._getSizeOf(viewport),popupSize=this.getPopupSize(),popupPos=this._positions[direction.key],parentOffset=this._parent?this._parent.domElem.offset():{top:0,left:0},top=popupPos.top+(this._isParentFixed?parentOffset.top:-viewport.scrollTop()),left=popupPos.left+(this._isParentFixed?parentOffset.left:-viewport.scrollLeft()),right=left+popupSize.width-viewportSize.width,bottom=top+popupSize.height-viewportSize.height,visibleRect={height:popupSize.height,width:popupSize.width},popupArea,visibleArea,visibility=100;
if(bottom>0){visibleRect.height-=bottom}if(top<0){visibleRect.height+=top}if(left<0){visibleRect.width+=left
}if(right>0){visibleRect.width-=right}if(visibleRect.height<0||visibleRect.width<0){visibility=0}else{visibleArea=Math.abs(visibleRect.height*visibleRect.width);
popupArea=popupSize.height*popupSize.width;popupArea!==visibleArea&&(visibility=visibleArea/popupArea*100)
}return visibility},_repaintShadow:function(){if(typeof this._repaintShadowCounter==="undefined"){this._repaintShadowCounter=0
}this.domElem.css("zoom",++this._repaintShadowCounter&1)},_findParent:function(owner){return this.findBlockOutside(owner,"popup")
},destruct:function(){var args=arguments;this._channel.un("hide");this._childs.forEach(function(child){child.destruct.apply(child,args)
});return this.__base.apply(this,args)},_resetDefault:function(){},_calcPlacingSize:function(){}},{live:function(){this.liveBindTo("close","leftclick tap",function(){this.hide()
})},_getFocusable:function(domElem){var id=$.data(domElem,"popup-getFocusable-id");if(!id){id=$.identify();
$.data(domElem,"popup-getFocusable-id",id)}id='*[data-popup-getFocusable-id="'+id+'"]';var link=isOpera?"":"a[href], link, ";
return domElem.find(link+'*[tabindex], button, input:not([type="hidden"]), textarea, select, menuitem').filter(function(){var $this=$(this),res=true;
if(parseInt($this.prop("tabindex"),10)<0||$this.css("visibility")==="hidden"){return false}$(this).parentsUntil(id).each(function(){var $this=$(this);
if($this.css("display")==="none"){res=false;return res}});return res})}})})(jQuery);BEM.DOM.decl("popup",{onSetMod:{autoclosable:{yes:function(){this._enableAutoclosable()
},"":function(){this._disableAutoclosable()}}},_enableAutoclosable:function(){var under=this._under;if(this.hasMod(under,"type","paranja")){under.is("iframe")&&(under=$([under[0].contentWindow,under[0].contentWindow.document]));
this.bindTo(under,"leftclick tap",function(e){e.stopPropagation();this.hide()});this.bindTo(under,"mousedown",function(){this._skipReturnFocus=true
})}this.bindToDoc("leftclick tap",function(domEvent){if(this._isRelatedNode($(domEvent.target))){return
}var e=$.Event("outside-click");this.trigger(e,domEvent);if(!e.isDefaultPrevented()){this.hide()}});this.bindToDoc("mousedown",function(){this._skipReturnFocus=true
})},_disableAutoclosable:function(){if(this.hasMod(this._under,"type","paranja")){this.unbindFrom(this._under,"leftclick tap mousedown")
}this.unbindFromDoc("leftclick tap mousedown")},_isRelatedNode:function(node){var isSimpleRelation=this.containsDomElem(node);
if(!isSimpleRelation){isSimpleRelation=Boolean(this._owner)&&this.containsDomElem.call({domElem:this._owner},node)
}if(isSimpleRelation){return true}var len=this._childs.length,i;for(i=0;i<len;i++){if(this.containsDomElem.call({domElem:this._childs[i].domElem},node)){return true
}}return false}});BEM.DOM.decl({block:"popup",modName:"adaptive",modVal:"yes"},{onSetMod:{adaptive:{yes:function(){this._enableAdaptive()
},no:function(){this._disableAdaptive()}},"watch-scroll":{yes:function(){this._watchScroll()},no:function(){this._unwatchScroll()
}}},_enableAdaptive:function(){this.afterCurrentEvent(function(){this.domElem&&this.bindToWin("resize",this.onResize)
});this._watchScroll()},_disableAdaptive:function(){this.unbindFromWin("resize")._unwatchScroll()},getScrollEvents:function(){return["scroll"]
},_watchScroll:function(){if(this._owner&&!this.hasMod("watch-scroll","no")){this.bindTo(this._owner.parents().add(this._viewport),this.getScrollEvents().join(" "),this.onScroll,this)
}},_unwatchScroll:function(){this._owner&&this.unbindFromDomElem(this._owner.parents().add(this._viewport),this.getScrollEvents().join(" "))
},onResize:function(e){this._cache={};if(this._isShown&&!this._isHiding){this.repaint()}},onScroll:function(e){this._cache={};
if(this._isShown&&!this._isHiding){this.repaint()}},destruct:function(){this._disableAdaptive();this.__base.apply(this,arguments)
}});BEM.DOM.decl({block:"popup",modName:"animate",modVal:"yes"},{afterShow:function(){var direction=this.getCurrDirection();
if(!direction){return}var to=direction.to,position=this.getCurrPos(),animateOpts={opacity:1,top:position.top,left:position.left},cssOpts={opacity:0,top:position.top,left:position.left};
if(to==="bottom"){cssOpts.top+=10}else if(to==="top"){cssOpts.top-=10}else if(to==="left"){cssOpts.left-=10
}else if(to==="right"){cssOpts.left+=10}this.domElem.stop(true).css(cssOpts).animate(animateOpts,this.params.duration)
},beforeHide:function(callback){var direction=this.getCurrDirection();if(!direction){return callback()
}var to=direction.to,position=this.getCurrPos(),domElem=this.domElem,animateOpts={top:position.top,left:position.left,opacity:0};
if(to==="bottom"){animateOpts.top+=10}else if(to==="top"){animateOpts.top-=10}else if(to==="left"){animateOpts.left-=10
}else if(to==="right"){animateOpts.left+=10}return domElem.stop(true,true).animate(animateOpts,this.params.duration,function(){callback();
domElem.css("opacity","")})}});(function(){var underPool=[];BEM.DOM.decl("popup",{onSetMod:{js:function(){this.__base.call(this);
var under=this.findElem("under").first();this._underClassAttr=under.attr("class");if(this.isDivEnough()){this._under=under
}else{under.remove();this._under=null}this._underInPool=false}},isDivEnough:function(){return false},_createUnder:function(){return $('<iframe frameBorder="0" tabindex="-1" src="'+"about:blank"+'"/>')
},_getUnder:function(){if(this._under){return this._under}var fromPool=underPool.pop();fromPool&&(this._underInPool=false);
return this._under=fromPool||this._createUnder()},_attachUnder:function(){var under=this._under=this._getUnder();
under.attr("class",this._underClassAttr);this.hasMod(under,"type","paranja")?under.detach().insertBefore(this.domElem):under.prependTo(this.domElem)
},_detachUnder:function(){var under=this._under;underPool.push(under.detach());this._under=null;this._underInPool=true
},destruct:function(){this._underInPool&&underPool.pop();this._under&&this._under.remove();return this.__base.apply(this,arguments)
}})})();BEM.DOM.decl("popup",{isDivEnough:function(){return true}});BEM.DOM.decl("popup",{onSetMod:{js:function(){this.__base();
this._tailPos={}}},_calcTailPos:function(direction){var to=direction.to,currentPos=this._positions[direction.key],axis=direction.tail.axis,position={};
if(to==="top"||to==="bottom"){position.left=this._calcTailLeft(axis,currentPos)}else if(to==="left"||to==="right"){position.top=this._calcTailTop(axis,currentPos)
}return position},_calcTailTop:function(axis,popupPos){var top=0,ownerSize=this.getOwnerSize(),ownerPos=this.getOwnerPos(),tailHeight=this.params.tail.width,popupSize=this.getPopupSize(),chunk=popupSize.height,topOffset=ownerPos.top-popupPos.top,bottomOffset=popupPos.top+popupSize.height-(ownerPos.top+ownerSize.height);
if(topOffset>0){top+=topOffset;chunk-=topOffset}bottomOffset>0&&(chunk-=bottomOffset);if(axis==="middle"){chunk-=tailHeight;
top+=chunk/2}else if(axis==="bottom"){chunk-=tailHeight;top+=chunk}top<0&&(top=0);return top},_calcTailLeft:function(axis,popupPos){var left=0,ownerSize=this.getOwnerSize(),ownerPos=this.getOwnerPos(),tailWidth=this.params.tail.width,popupSize=this.getPopupSize(),leftOffset=ownerPos.left-popupPos.left,chunk=popupSize.width,rightOffset=popupPos.left+popupSize.width-(ownerPos.left+ownerSize.width);
if(leftOffset>0){left+=leftOffset;chunk-=leftOffset}rightOffset>0&&(chunk-=rightOffset);if(axis==="center"){chunk-=tailWidth;
left+=chunk/2}else if(axis==="right"){chunk-=tailWidth;left+=chunk}return left},_calcOffsetByTail:function(params){var tail=this.params.tail,height=tail.height,position={};
switch(params.to){case"top":position={top:-height};break;case"bottom":position={top:height};break;case"right":position={left:height};
break;case"left":position={left:-height};break}return position},_calcTailOffset:function(direction){var offset={},to=direction.to,tailParams=direction.tail,tailOffset=tailParams.offset,tailAxis=tailParams.axis;
if(!tailOffset){return false}if(to==="top"||to==="bottom"){offset.left=0;if(tailAxis==="left"){offset.left+=tailOffset.left
}else if(tailAxis==="center"){tailOffset.left&&(offset.left+=tailOffset.left);tailOffset.right&&(offset.left-=tailOffset.right)
}else if(tailAxis==="right"){offset.left-=tailOffset.right}}else if(to==="left"||to==="right"){offset.top=0;
if(tailAxis==="top"){offset.top+=tailOffset.top}else if(tailAxis==="middle"){tailOffset.top&&(offset.top+=tailOffset.top);
tailOffset.bottom&&(offset.top-=tailOffset.bottom)}else if(tailAxis==="bottom"){offset.top-=tailOffset.bottom
}}return offset},_resetTailPos:function(key){key?this._tailPos[key]=null:this._tailPos={};return this
},_pushTailPos:function(key,offset){this._pushPosTo(this._tailPos,key,offset);return this}});BEM.DOM.decl({block:"popup",modName:"type",modVal:"modal"},{getDefaultParams:function(){var params=this.__base();
params.top="50%";params.left="50%";return params},_isPercentVal:function(val){return typeof val==="string"&&val.indexOf("%")>0
},show:function(position){this._moveToContainer();this.setMod("visibility","outside").setMod("adaptive","no");
this.repaint(position);return this},repaint:function(position){this._moveToContainer();if(!position){position={left:this.params.left,top:this.params.top}
}var popupSize=this.getPopupSize();if(this._isPercentVal(position.left)&&!position.marginLeft){position.marginLeft=popupSize.width/(-100/parseInt(position.left,10))
}if(this._isPercentVal(position.top)&&!position.marginTop){position.marginTop=popupSize.height/(-100/parseInt(position.top,10))
}this._show(position);return this}});blocks["popup_type_modal"]=function(name,text){text=text||"";var buttonSize="normal";
var buttonsConfirm=[{block:"b-form-button",mods:{size:buttonSize,theme:"islands",name:"confirm-ok"},content:vb.getLocalizedString("dialog.yes")},{block:"b-form-button",mods:{size:buttonSize,theme:"islands",name:"confirm-cancel"},content:vb.getLocalizedString("dialog.no")}];
var buttonAlert={block:"b-form-button",mods:{size:buttonSize,theme:"islands",name:"alert-ok"},content:vb.getLocalizedString("dialog.ok")};
if(vb.osName!=="windows"){buttonsConfirm.reverse()}return{block:"popup",mods:{type:"modal",position:"fixed",modal:name},content:[{elem:"content",content:function(){if(name==="confirm"){return[{elem:"header",tag:"h3",content:text},{elem:"buttons",content:buttonsConfirm}]
}if(name==="alert"){return[{elem:"header",tag:"h3",content:text},{elem:"buttons",content:buttonAlert}]
}}()}]}};BEM.DOM.decl({block:"popup",modName:"type",modVal:"modal"},{onSetMod:{js:function(){this.__base.apply(this,arguments);
var _this=this,modName=_this.getMod("modal");this.findBlocksInside("b-form-button").forEach(function(block){block.bindTo("leftclick",function($e){$e.stopPropagation();
var name=this.getMod("name"),data=name&&name.split("-")||null;if(!data)return true;name=data[1];if(modName==="confirm"){if(name==="ok"){_this.execListener(true)
}if(name==="cancel"){_this.execListener(false)}}if(modName==="alert"){_this.execListener()}})});if(modName==="confirm"){setTimeout(function(){$(".b-form-button_name_confirm-ok").bem("b-form-button").setMod("focused","yes")
},0)}if(modName==="alert"){setTimeout(function(){$(".b-form-button_name_alert-ok").bem("b-form-button").setMod("focused","yes")
},0)}}},_enableAutoclosable:function(){},addListener:function(handler){if(!handler)return;this._handlers=this._handlers||[];
this._handlers.push(handler)},execListener:function(data){var modalName=this.getMod("modal");this._handlers&&this._handlers.forEach(function(handler){handler(data)
});if(modalName==="confirm"||modalName==="alert"){require("modals").hideModals()}},destruct:function(){this._handlers=null;
$(".b-paranja").bem("b-paranja").setMod("hide","yes");this.__base.apply(this,arguments)},hide:function(){this.__base.apply(this,arguments);
this.destruct()}});BEM.DOM.decl({block:"popup",modName:"position",modVal:"fixed"},{addChild:function(child){this.__base.apply(this,arguments);
child.setMod("watch-scroll","no")},_onFirstFocusableKeyDown:function(e){if(e.ctrlKey||e.altKey||e.metaKey){return
}if(e.shiftKey&&e.which===9){e.preventDefault();this._lastFocusable.focus()}},_onLastFocusableKeyDown:function(e){if(e.shiftKey||e.ctrlKey||e.altKey||e.metaKey){return
}if(e.which===9){e.preventDefault();this._firstFocusable.focus()}}});BEM.DOM.decl({block:"popup",modName:"position",modVal:"fixed"},{getOwnerPos:function(){var pos=this.__base.apply(this,arguments);
if(this._owner){var viewport=this._viewport;pos.top-=viewport.scrollTop();pos.left-=viewport.scrollLeft()
}return pos}});BEM.HTML.decl("b-icon",{onBlock:function(ctx){if(!ctx.param("url")){ctx.tag("div")}else{ctx.tag("img");
ctx.attr("src",ctx.param("url"))}}});blocks.auth=function(auth){if(!auth)return null;if(!auth.users||!auth.users.length){return{block:"b-link",mods:{type:"auth"},mix:[{block:"i-action",elem:"login"}],content:{elem:"inner",content:vb.getLocalizedString("auth.signin")}}
}var displayName=auth.users[0].displayName,loginMaxLength=19;displayName=displayName.length>loginMaxLength?displayName.substr(0,loginMaxLength)+"…":displayName;
return{block:"auth",js:true,mods:{login:"yes"},userpic:auth.users[0].avatarURL,username:displayName}};
channels("api").on("auth",function(auth){page().findAndDestruct("auth");page().findAndDestruct({block:"b-link",modName:"type",modVal:"auth"});
page().findAndDestruct({block:"popup",modName:"type",modVal:"auth"});cache.set("auth",auth);var bemjson=blocks.auth(auth),BEMHTML=require("bemhtml");
$(".b-content .b-auth").html(BEMHTML.apply(bemjson));BEM.DOM.init();redrawAuth()});function redrawAuth(){var authWrapper=page().findBlockInside("b-auth"),bLink=page().findBlockInside({block:"b-link",modName:"type",modVal:"auth"}),authBlock=page().findBlockInside({block:"auth",modName:"login",modVal:"yes"}),arrow=$(".b-head-search"),headSearch=$(".b-vb-head"),minMargin=40,arrowMinWidth=666,pageWidth=$(".b-content").width(),freeSpace=(pageWidth-headSearch.width())/2,searchMargin;
if(bLink){authWrapper.setMod("type","auth");var inner=bLink.findElem("inner");inner.show();if(!arrow.length)return;
searchMargin=authWrapper.domElem.width()-freeSpace+minMargin;searchMargin=searchMargin>=0?searchMargin:0;
$(".b-vb-head__search").css("margin-right",searchMargin);if(arrow.width()<arrowMinWidth){inner.hide();
$(".b-vb-head__search").css("margin-right",minMargin)}else{inner.show()}}if(authBlock){var userName=authBlock.findElem("name");
userName.show();if(!arrow.length)return;searchMargin=authBlock.domElem.width()-freeSpace+minMargin;searchMargin=searchMargin>=0?searchMargin:0;
$(".b-vb-head__search").css("margin-right",searchMargin);if(arrow.width()<arrowMinWidth){userName.hide();
$(".b-vb-head__search").css("margin-right",minMargin)}else{userName.show()}}}channels("dom").on("resize",redrawAuth);
channels("dom").on("redraw",redrawAuth);BEM.DOM.decl("auth",{_popup:null,onSetMod:{js:function(){this.bindTo("click",function(e){e.preventDefault();
var BEMHTML=require("bemhtml");if(!this._popup){this._popup=$(BEMHTML.apply(blocks["popup_type_auth"](cache.get("auth")))).bem("popup")
}page().hideSettings();page().findBlocksInside("i-popup").concat(page().findBlocksInside("popup")).forEach(function(popup){popup.hide()
});if(this._popup.isShown()){this.domElem.attr("aria-expanded","false");this._popup.hide()}else{this.domElem.attr("aria-expanded","true");
vb.stat("auth.menu.open");this._popup.show(this)}this.afterCurrentEvent(function(){this._bindPopupEvents()
});return false});this.afterCurrentEvent(function(){redrawAuth()})}},redraw:function(){redrawAuth()},_bindPopupEvents:function(){this._bindPopupEvents=function(){};
var _this=this,menu=this._popup.findBlockInside("menu");menu.bindTo(menu.findElem("item","name","passport"),"click",function(){_this._popup.hide();
vb.stat("auth.menu.passport");vb.auth.openPassport()});menu.bindTo(menu.findElem("item","name","tune"),"click",function(){_this._popup.hide();
vb.stat("auth.menu.settings");vb.auth.openTune()});menu.bindTo(menu.findElem("item","name","logout"),"click",function(){_this._popup.hide();
vb.stat("auth.menu.logout");vb.auth.logout()});menu.bindTo(menu.findElem("item","name","login"),"click",function(){_this._popup.hide();
vb.stat("auth.menu.enternewname");vb.auth.login()});menu.bindTo(menu.findElem("item","user","yes"),"click",function(e){_this._popup.hide();
var domElem=e.data.domElem,user=menu.elemParams(domElem);vb.stat("auth.menu.loginlist."+menu.getMod(domElem,"number"));
vb.auth.login(user.id)})},destruct:function(){if(this._popup){this._popup.destruct();this._popup=null
}this.__base.apply(this,arguments)}});blocks["popup_type_auth"]=function(auth){return{block:"popup",mods:{adaptive:"yes",type:"auth"},js:{directions:[{to:"bottom",axis:"right"}]},content:[{elem:"tail"},{elem:"content",content:blocks["menu_type_auth"](auth)}]}
};blocks["menu_type_auth"]=function(auth){var users=[],i=0;auth.users.forEach(function(user){var authorized=user.state!==0;
var selected=user.state===2?"yes":"";users.push({elem:"item",content:[{elem:"icon",url:user.avatarURL},{elem:"name",content:{elem:"inner",content:BEM.blocks["i-common__string"].escapeHTML(user.displayName)}},selected&&{elem:"tick"}],mods:{authorized:authorized?"yes":"",user:"yes",number:++i},js:user})
});users.push({elem:"item",content:vb.getLocalizedString("auth.addUser"),mods:{name:"login"}});var json={block:"menu",mods:{type:"auth"},content:[{elem:"hr"},{elem:"item",mods:{name:"tune"},content:vb.getLocalizedString("auth.tune")},{elem:"item",mods:{name:"passport"},content:vb.getLocalizedString("auth.passport")},{elem:"item",mods:{name:"logout"},content:vb.getLocalizedString("auth.signout"),action:"quit-auth"}]};
json.content.unshift(users);return json};BEM.DOM.decl({block:"b-form-button",modName:"name",modVal:"fix-sync"},{onSetMod:{js:function(){this.bindTo("click",function(){vb.stat("panel.syncfix");
vb.sync.openWP()})}}});blocks["sync-properties"]=function(sync){var syncBlock={block:"sync-properties",js:true,mods:{},content:""};
if(!sync)return syncBlock;if(sync.status===1&&sync.enabled===false){syncBlock.content=[{elem:"text",elemMods:{position:"left"},content:vb.getLocalizedString("app.sync")+": "},{elem:"btn",content:{block:"b-form-button",mods:{theme:"islands",size:"normal"},mix:[{block:"i-action",elem:"sync-vb"}],content:vb.getLocalizedString("sync.turnOn")}}];
syncBlock.mods.type="vb-offer"}else if(sync.status===2){syncBlock.content=[{elem:"text",content:vb.getLocalizedString("app.sync")+": "},{elem:"btn",content:{block:"b-form-button",mods:{theme:"islands",size:"normal"},mix:[{block:"i-action",elem:"open-sync-page"}],content:vb.getLocalizedString("sync.turnOn")}}];
syncBlock.mods.type="sync-offer"}else if(sync.status===1){syncBlock.content=[{elem:"sync-login",content:[{elem:"text",content:vb.getLocalizedString("sync.enabled")+": "},{elem:"login",content:sync&&sync.login||""}]},{elem:"btn",content:{block:"b-form-button",mods:{theme:"islands",size:"normal"},mix:[{block:"i-action",elem:"sync-settings-link"}],content:vb.getLocalizedString("sync.settings")}}];
syncBlock.mods.type="sync-on"}else if(sync.status===3){syncBlock.content=[{elem:"text",content:vb.getLocalizedString("app.sync")+": "+vb.getLocalizedString("sync.outdated")},{block:"b-form-button",mods:{size:"normal",theme:"islands"},mix:[{block:"i-action",elem:"open-sync-page"}],content:[vb.getLocalizedString("sync.repair")]}];
syncBlock.mods.type="sync-baddata"}return syncBlock};blocks["b-decor"]=function(data){return{block:"b-decor",mods:{theme:"white"}}
};blocks["b-bookmarks"]=function(data,width,height){if(data&&data.showBookmarks){return[{block:"b-bookmarks",js:{width:width,height:height}},{block:"b-popupa",mods:{theme:"ffffff",type:"bookmarks"},content:[{elem:"tail"},{elem:"content",content:{block:"b-spin",mods:{progress:"yes"}}}]}]
}};BEM.DOM.decl("b-bookmarks",{TITLE_MAX_LENGTH:19,BOOKMARKS_MARGIN:50,OTHERS_RESERVERD_WIDTH:150,_popupa:null,_menu:null,onSetMod:{js:function(){var BEM=require("bem").BEM;
this._popupa=this.findBlockOutside("b-page").findBlockInside({blockName:"b-popupa",modName:"type",modVal:"bookmarks"});
BEM.blocks["b-link"].on("open-folder",this._openFolder,this);BEM.blocks["b-page"].on("bookmarksStateChanged",this._onBbookmarksStateChanged,this);
if(cache.get("bookmarks")){this.setMod("state","loaded")}},state:{loaded:function(){var self=this,BEM=require("bem").BEM,BEMHTML=require("bemhtml"),items=[],bookmarks=cache.get("bookmarks");
for(var i=0,len=bookmarks.length;i<len;i++){var item=bookmarks[i];items.push(item.isFolder?self._folderItem(item):self._linkItem(item))
}items.push(self._lastOthersItem());BEM.DOM.update(self.domElem,BEMHTML.apply({block:"b-menu-horiz",mods:{layout:"normal",type:"bookmarks"},js:false,content:items}));
self.afterCurrentEvent(function(){if(self.domElem){self.setMod("state","inserted")}})},inserted:function(){var self=this,BEM=require("bem").BEM,BEMHTML=require("bemhtml"),bookmarks=cache.get("bookmarks");
self._menu=self.findBlockInside({block:"b-menu-horiz",modName:"type",modVal:"bookmarks"});var maxWidth=self.params.width-self.OTHERS_RESERVERD_WIDTH-self.BOOKMARKS_MARGIN,isNotEnough=self.domElem.outerWidth()>self.params.width,menuItems=self._menu&&self._menu.findElem("item"),items=[],item,i=bookmarks.length-1;
while(isNotEnough){$(menuItems[i]).parent().remove();item=bookmarks[i];if(item)items.push(item.isFolder?self._vertFolderItem(item):self._vertLinkItem(item));
isNotEnough=self.domElem.outerWidth()>maxWidth&&i>0;i--}if(items.length){this._othersBookmarks=self._menu.findBlockInside({block:"b-popupa",modName:"type",modVal:"others-bookmarks"});
this._othersBookmarks.setContent(BEMHTML.apply({block:"b-menu-vert",mods:{type:"bookmarks"},js:true,content:items.reverse()}));
if(self.params.width>=self.OTHERS_RESERVERD_WIDTH){self._menu.findElem("item","type","others").show()
}}self.afterCurrentEvent(function(){if(self.domElem)self.setMod("state","ready")})},ready:function(){var _this=this;
this.findBlockInside({block:"b-link",modName:"action",modVal:"open-others"}).on("click",function(){if(!_this._othersBookmarks.isShowed())vb.stat("panel.bookpanel.folder")
})}}},destruct:function(){var BEM=require("bem").BEM;BEM.blocks["b-link"].un("open-folder",this._openFolder,this);
BEM.blocks["b-page"].un("bookmarksStateChanged",this._onBbookmarksStateChanged,this);var popup=this._popupa;
if(popup){popup.destruct()}this._popupa=null;var otherBookmarks=this._othersBookmarks;if(otherBookmarks){otherBookmarks.destruct()
}this._othersBookmarks=null;this.__base.apply(this,arguments)},_onBbookmarksStateChanged:function(){this.setMod("state","loaded")
},_linkItem:function(item){var BEM=require("bem").BEM,content;if(!item.title.trim()){content={block:"b-icon",url:item.favicon}
}else{item.title=item.title.trim();content=this.getTitleWithGradient(item.title,true)}return{elem:"item",content:{block:"b-link",mix:[{block:"i-action",elem:"hide-popup"},{block:"i-action",elem:"bookmark"}],url:item.url,content:{elem:"inner",content:content},attrs:{title:item.title,draggable:false}}}
},_folderItem:function(item){var BEM=require("bem").BEM;item.title=item.title.trim();return{elem:"item",content:[{block:"b-link",mods:{pseudo:"yes",border:"none",type:"folder",action:"open-folder"},js:{id:item.id},mix:[{block:"b-bookmarks",elem:"folder",js:{id:item.id}}],url:item.url,content:[this.getTitleWithGradient(item.title,true)," ",{block:"b-dropdowna",elem:"arr",content:"&#x25BC;"}],attrs:{title:item.title}}]}
},_lastOthersItem:function(){return{elem:"item",elemMods:{type:"others"},content:[{block:"b-dropdowna",content:[{elem:"switcher",content:[{block:"b-link",mods:{pseudo:"yes",border:"none",action:"open-others"},attrs:{draggable:false},content:[vb.getLocalizedString("bookmarks.otherBookmarks")+" ",{block:"b-dropdowna",elem:"arr",content:"&#x25BC;"}]}]},{block:"b-popupa",mods:{theme:"ffffff",type:"others-bookmarks",direction:"left"},content:[{elem:"tail"},{elem:"content"}]}]}]}
},_vertFolderItem:function(item){var BEM=require("bem").BEM;item.title=item.title.trim();return{elem:"item",content:[{block:"b-link",mods:{pseudo:"yes",inner:"yes",border:"none",action:"open-folder",type:"open-sub-folder"},mix:[{block:"b-menu-vert",elem:"item-selector"}],js:{id:item.id},url:item.url,content:[{block:"b-icon",mods:{type:"folder"},mix:[{block:"b-link",elem:"icon"}]},{elem:"inner",content:this.getTitleWithGradient(item.title),attrs:{title:item.title,draggable:false}}],attrs:{}}]}
},_vertLinkItem:function(item){var BEM=require("bem").BEM;item.title=item.title.trim();return{elem:"item",content:{block:"b-link",mods:{inner:"yes"},url:item.url,mix:[{block:"i-action",elem:"hide-popup"},{block:"i-action",elem:"bookmark"}],content:[{block:"b-icon",mix:[{block:"b-link",elem:"icon"}],url:item.favicon||"",width:16,height:16,alt:item.title},{elem:"inner",content:this.getTitleWithGradient(item.title),attrs:{title:item.title}}],attrs:{draggable:false}}}
},_openFolder:function(e){var self=this,link=e.target,BEMHTML=require("bemhtml");self._popupa=this.findBlockOutside("b-page").findBlockInside({blockName:"b-popupa",modName:"type",modVal:"bookmarks"});
if(!link.hasMod("type","open-sub-folder")){if(link.domElem===self._popupa._owner){self._popupa.toggle(link.domElem)
}else{self._popupa.setContent(BEMHTML.apply({block:"b-spin",mods:{progress:"yes"}}));self._popupa.show(link.domElem)
}}vb.requestBookmarksBranch(link.params.id,function(bookmarks){function scrollUpdate(){var popup=self._popupa,otherBookmarks=self._othersBookmarks;
popup.setMod("has-scroll",popup.elem("content").hasScroll()&&vb.osName==="windows"?"yes":"");otherBookmarks&&otherBookmarks.setMod("has-scroll",otherBookmarks.elem("content").hasScroll()&&vb.osName==="windows"?"yes":"")
}var items=[],len=bookmarks.length;if(len){for(var i=0;i<len;i++){var item=bookmarks[i];if(item)items.push(item.isFolder?self._vertFolderItem(item):self._vertLinkItem(item))
}}else{items.push({elem:"item",content:{block:"b-link",attrs:{draggable:false},mods:{inner:"yes",pseudo:"yes",disabled:"yes"},content:vb.getLocalizedString("app.empty")}})
}var menu;if(link.hasMod("type","open-sub-folder")){link.toggleMod("opened","yes");if(link.hasMod("opened","yes")){var submenu=BEMHTML.apply({block:"b-menu-vert",elem:"item-content",elemMods:{visibility:"visible"},content:{elem:"submenu",content:items}});
link.domElem.after(submenu);link.setMod("loaded","yes");scrollUpdate();vb.stat("panel.bookpanel.folder")
}else{menu=link.findBlockOutside("b-menu-vert");menu.toggleMod(menu.findElem(link.domElem.parent(),"item-content"),"visibility","visible");
scrollUpdate()}}else{menu=BEMHTML.apply({block:"b-menu-vert",mods:{type:"bookmarks"},js:true,content:items});
self._popupa.setContent(menu,function(){scrollUpdate()},self._popupa)}});self.findBlockOutside("b-page").findBlocksInside("b-popupa").forEach(function(block){self.afterCurrentEvent(function(){block.pos()
})})},getTitleWithGradient:function(title,cut){var cuttedTitle=cut?title.slice(0,this.TITLE_MAX_LENGTH):title;
return title.length>this.TITLE_MAX_LENGTH?[cuttedTitle||title,{elem:"gradient"}]:title}});BEM.DOM.decl("b-spin",{onSetMod:{js:function(){this._size=this.getMod("size")||/[\d]+/.exec(this.getMod("theme"))[0];
this._bgProp="background-position";this._posPrefix="0 -";if(this.elem("icon").css("background-position-y")){this._bgProp="background-position-y";
this._posPrefix="-"}this._curFrame=0;this.hasMod("progress")&&this.channel("sys").on("tick",this._onTick,this)
},progress:{yes:function(){this.channel("sys").on("tick",this._onTick,this)},"":function(){this.channel("sys").un("tick",this._onTick,this)
}}},_onTick:function(){var y=++this._curFrame*this._size;y>=this._size*36&&(this._curFrame=y=0);this.elem("icon").css(this._bgProp,this._posPrefix+y+"px")
},destruct:function(){this.channel("sys").un("tick",this._onTick,this);this.__base.apply(this,arguments)
}});(function(){var timer,counter=0,isIdle=false,idleInterval=0,channel=BEM.channel("sys"),TICK_INTERVAL=50;
BEM.decl("i-system",{},{start:function(){$(document).bind("mousemove keydown",function(){idleInterval=0;
if(isIdle){isIdle=false;channel.trigger("wakeup")}});this._tick()},_tick:function(){var _this=this;channel.trigger("tick",{counter:counter++});
if(!isIdle&&(idleInterval+=TICK_INTERVAL)>3e3){isIdle=true;channel.trigger("idle")}timer=setTimeout(function(){_this._tick()
},TICK_INTERVAL)}}).start()})();(function(undefined){BEM.DOM.decl({block:"b-link",modName:"action",modVal:"open-folder"},{onSetMod:{js:function(){var self=this;
self.on("click",function(e){this.trigger("open-folder",e)})}}})})();(function($){BEM.DOM.decl("b-dropdowna",{onSetMod:{js:function(){this._getSwitcher().on("click",this._toggle,this)
},disabled:function(modName,modVal){this._getSwitcher().setMod(modName,modVal);modVal=="yes"&&this.getPopup().hide()
}},_getSwitcher:function(){return this._switcher||(this._switcher=this.findBlockInside("b-"+(this.getMod(this.elem("switcher"),"type")||"link")))
},_toggle:function(){this.getPopup().toggle(this.elem("switcher"))},getPopup:function(){return this._popup||(this._popup=this.findBlockInside("b-popupa")).on("outside-click",function(e,data){this._getSwitcher().containsDomElem($(data.domEvent.target))&&e.preventDefault()
},this)},destruct:function(){var popup=this._popup;popup&&popup.destruct();this.__base.apply(this,arguments)
}},{live:function(){this.liveInitOnEvent("switcher","leftclick",function(){})}})})(jQuery);BEM.HTML.decl("b-dropdowna",{onBlock:function(ctx){ctx.js(true)
}});BEM.HTML.decl("b-dropdowna",{onElem:{switcher:function(ctx){ctx.tag("span")}}});BEM.DOM.decl({name:"b-link",modName:"pseudo",modVal:"yes"},{_onClick:function(e){e.preventDefault();
this.hasMod("disabled","yes")||this.afterCurrentEvent(function(){this.trigger("click")})}},{live:function(){this.__base.apply(this,arguments);
this.liveBindTo({modName:"pseudo",modVal:"yes"},"leftclick",function(e){this._onClick(e)})}});BEM.HTML.decl({name:"b-link",modName:"pseudo",modVal:"yes"},{onBlock:function(ctx){ctx.tag(ctx.param("url")?"a":"span");
ctx.wrapContent({elem:"inner"});ctx.js(true)},onElem:{inner:function(ctx){ctx.tag("span")}}});blocks["b-vb"]=function(data,width,height){var Lib=require("lib"),blocks=require("bem").blocks;
return{block:"b-vb",js:true,content:[{elem:"head",content:[blocks["b-vb-head"](data)]},{elem:"content"}]}
};BEM.DOM.decl("b-vb",{onSetMod:{js:function(){var blocks=require("bem").blocks,BEMHTML=require("bemhtml"),thumbs=blocks["b-tumbs"](cache.get("thumbs"),cache.get("settings")),content=this.findElem("content");
content.find(this.buildSelector("td")).prepend(BEMHTML.apply(thumbs));BEM.DOM.init();page().afterInit()
}}});blocks.advert=function(advertisement,callback){if(!advertisement||!advertisement.id)return null;
function formatDate(date){var day=date.getDate(),month=date.getMonth()+1,year=date.getFullYear();day=day<10?"0"+day:day;
month=month<10?"0"+month:month;return[day,month,year].join(".")}var promises,leftBlock,textBlock,today=formatDate(new Date),openInBrowser,buttonText,translated={};
advertisement.data=advertisement.data||{};function getURL(key){var promise=$.Deferred();vb.advertisement.getLocalizedURL(key,function(val){promise.resolve([key,val])
});return promise}function getTranslate(key){var promise=$.Deferred();vb.advertisement.getLocalizedString(key,function(val){promise.resolve([key,val])
});return promise}switch(advertisement.id){case"vbadbbnewver":case"vbadbbnewverrun":promises=[getURL("logo_smallest"),getURL("name"),getURL("name-white"),getURL("name-black"),getTranslate("advertisement.yandexBrowser.updated"),advertisement.id==="vbadbbnewver"&&getTranslate("advertisement.yandexBrowser.open"),advertisement.id==="vbadbbnewver"&&getURL("open-in-yb"),advertisement.id==="vbadbbnewverrun"&&getTranslate("advertisement.yandexBrowser.download"),advertisement.id==="vbadbbnewverrun"&&getURL("yb-dl-link")];
advertisement.data.yandexBrowserInstalled=true;if(advertisement.id==="vbadbbnewverrun")advertisement.data.yandexBrowserInstalled=false;
break;case"vbadbbdoc":promises=[getURL("docs"),getTranslate("advertisement.yandexBrowser.docs")];if(advertisement.data.yandexBrowserInstalled)promises.push(getURL("open-in-yb"));
else promises.push(getURL("yb-dl-link"));if(advertisement.data.yandexBrowserInstalled)promises.push(getTranslate("advertisement.yandexBrowser.open"));
else promises.push(getTranslate("advertisement.yandexBrowser.download"));break;case"vbadsyncon":promises=[getTranslate("advertisement.yandexSyncon.on"),getURL("sync-on")];
break;case"newbackground":case"setbackground":promises=[getTranslate("text")];break;case"newyear2015":promises=[];
promises.push(getTranslate(today+".text"));promises.push(getTranslate(today+".button"));promises.push(getTranslate(today+".header"));
promises.push(getURL(today+".pic"));promises.push(getURL(today+".link"));break;default:return null}promises.forEach(function(promise){if(!promise)return;
var escapeHTML=BEM.blocks["i-common__string"].escapeHTML;promise.then(function(keyAndVal){translated[keyAndVal[0]]=escapeHTML(keyAndVal[1])
})});var color=cache.get("background").color==="000000"?"black":"white";$.when.apply($,promises).then(function(results){switch(advertisement.id){case"vbadbbnewverrun":case"vbadbbnewver":openInBrowser=advertisement.data.yandexBrowserInstalled?translated["open-in-yb"]:translated["yb-dl-link"];
leftBlock=[{block:"b-icon",url:translated["logo_smallest"],mix:[{block:"advert",elem:"logo"}]},{block:"b-icon",url:translated["name-"+color],mix:[{block:"advert",elem:"name"}]}];
textBlock=translated["advertisement.yandexBrowser.updated"];buttonText=translated[advertisement.id==="vbadbbnewver"?"advertisement.yandexBrowser.open":"advertisement.yandexBrowser.download"];
break;case"vbadbbdoc":openInBrowser=advertisement.data.yandexBrowserInstalled?translated["open-in-yb"]:translated["yb-dl-link"];
leftBlock=[{block:"b-icon",url:translated.docs,mix:[{block:"advert",elem:"docs"}]}];textBlock=translated["advertisement.yandexBrowser.docs"];
buttonText=advertisement.data.yandexBrowserInstalled?translated["advertisement.yandexBrowser.open"]:translated["advertisement.yandexBrowser.download"];
break;case"newbackground":case"setbackground":var currentId=flags.get("initedWithBackgroundId"),isNewBackgrounds=advertisement.id==="newbackground",backgrounds=isNewBackgrounds?advertisement.data.newBackgrounds:advertisement.data.backgrounds;
if(!backgrounds||backgrounds.length===0){return null}callback({block:"advert",mods:{type:"skins",hide:"yes"},js:{currentId:currentId,advertisement:advertisement},content:[{elem:"info",content:translated.text},{elem:"list",content:function(){return backgrounds.map(function(bg){return{elem:"skin",url:bg.preview,js:{id:bg.id}}
})}()},{block:"krestik",mods:{size:"big",theme:"dynamic"}},{elem:"cancel",mods:{hide:"yes"},content:{block:"b-link",mods:{pseudo:"yes"},content:vb.getLocalizedString("settings.cancel")}}]});
return;case"newyear2015":var punctuationMark=".";if(today==="30.12.2014"||today==="31.12.2014"){punctuationMark="!"
}leftBlock={block:"b-icon",url:translated[today+".pic"],mix:[{block:"advert",elem:"left-pic"}]};textBlock={elem:"ny-text",content:[translated[today+".header"],punctuationMark+" <span>"+translated[today+".text"]+"</span>"]};
buttonText=translated[today+".button"];openInBrowser=translated[today+".link"];break}callback({block:"advert",mods:{type:"text",hide:"yes"},js:{openInBrowser:openInBrowser,advertisement:advertisement},content:[leftBlock&&{elem:"block",content:leftBlock},{elem:"info",mix:[{block:"advert",elem:"block"}],content:textBlock},{elem:"btn",mix:[{block:"advert",elem:"block"}],content:[{block:"b-form-button",mods:{theme:"islands",size:"normal"},content:buttonText}]},{block:"krestik",mix:[{block:"advert",elem:"block"}],mods:{size:"big",theme:"dynamic"}}]})
})};channels("api").on("advertisement",function(advertisement){page().findAndDestruct("advert");page().delMod("advert");
cache.set("advertisement",advertisement);if(!advertisement||!advertisement.id){return}var blocks=require("bem").blocks,BEMHTML=require("bemhtml");
blocks.advert(advertisement,function(bemjson){var html=bemjson&&BEMHTML.apply(bemjson)||"";if(vb.navigator==="ie"&&vb.navigatorMajorVersion<9){$(".b-vb__content .b-vb__td").append(html)
}else{$(".b-vb-foot").prepend(html)}BEM.DOM.init();var advert=page().findBlockInside("advert");if(advert){page().setMod("advert","yes");
if(advert.getMod("type")==="skins"){page().setMod("advert_skins","yes")}}else{page().delMod("advert")
}})});BEM.DOM.decl("advert",{onSetMod:{js:function(){var images=this.domElem.find("img");if(!images.length){this.show();
return}var loaded=0,_this=this,needToLoad=images.length;images.each(function(index,img){var $this=$(this);
$this.load(onLoad)});function onLoad(){loaded++;if(needToLoad===loaded){_this.show()}}}},show:function(){this.delMod("hide")
}});BEM.DOM.decl({block:"advert",modName:"type",modVal:"text"},{onSetMod:{js:function(){this.__base();
var blocks=require("bem").blocks,_this=this;this.findBlockInside("krestik").bindTo("click",function(){var params=_this.params,advertisement=params.advertisement,param;
if(advertisement.id==="vbadbbdoc"){if(advertisement.data.yandexBrowserInstalled){param="runclose"}else{param="installclose"
}}else if(advertisement.id==="vbadbbnewver"){param="runclose"}else if(advertisement.id==="vbadbbnewverrun"){param="installclose"
}if(param)vb.advertisement.stat(param);vb.advertisement.refuse(0)});this.findBlockInside("b-form-button").on("click",function(){var params=_this.params,advertisement=params.advertisement,param;
if(advertisement.id==="vbadbbdoc"){if(advertisement.data.yandexBrowserInstalled){param="run"}else{param="install"
}}else if(advertisement.id==="vbadbbnewver"){param="run"}else if(advertisement.id==="vbadbbnewverrun"){param="install"
}if(param)vb.advertisement.stat(param);if(advertisement.data.yandexBrowserInstalled)vb.advertisement.openYandexBrowser(params.openInBrowser);
else location.href=params.openInBrowser;if(advertisement.id==="newyear2015"){vb.advertisement.hide();
return}vb.advertisement.refuse(0)});channels("api").on("backgroundChanged",this._onBackgroundChanged,this)
}},_onBackgroundChanged:function(background){var elem=this.findElem("name"),color=background.color==="ffffff"?"white":"black";
vb.advertisement.getLocalizedURL("name-"+color,function(newSrc){elem.attr("src",newSrc)})},destruct:function(){channels("api").off("backgroundChanged",this._onBackgroundChanged);
this.__base.apply(this,arguments)}});BEM.DOM.decl({block:"advert",modName:"type",modVal:"skins"},{onSetMod:{js:function(){this.__base();
var cancel=this.findElem("cancel");this.bindTo(this.findElem("skin"),"click",function(e){vb.advertisement.stat("select");
var params=this.elemParams($(e.target));vb.advertisement.refuse(1e3*60*5);this.delMod(cancel,"hide");
vb.setBackgroundImage(params.id)});this.findBlockInside("krestik").bindTo("click",function(){vb.advertisement.stat("close");
vb.advertisement.refuse(0)});this.bindTo(cancel,"click",function(){vb.advertisement.stat("rollback");
this.setMod(cancel,"hide","yes");vb.setBackgroundImage(this.params.currentId)})}}});blocks["b-vb-head"]=function(data){var blocks=require("bem").blocks;
return{block:"b-vb-head",mix:[{block:"i-clearfix"}],content:blocks["b-vb-head__content"](data)}};blocks["b-vb-head__content"]=function(data){var blocks=require("bem").blocks;
return data.searchStatus===2?[blocks["b-vb-head__logo"](data),blocks["b-vb-head__search"](data)]:blocks["b-question"]()
};blocks["b-vb-head__logo"]=function(data){if(!data||!data.branding||!data.branding.logo||!data.branding.search){return
}return{block:"b-vb-head",elem:"logo",content:[blocks["b-head-logo"](data)]}};blocks["b-vb-head__search"]=function(data){if(!data||!data.branding||!data.branding.search||!data.branding.logo){return
}return{block:"b-vb-head",elem:"search",content:[blocks["b-head-search"](data)]}};blocks["b-question"]=function(){return{block:"b-question",content:[{block:"b-icon",tag:"div",mods:{quest:"top"}},{elem:"quest-text",content:[vb.getLocalizedString("app.searchTutorial.description")+" "+vb.getLocalizedString("app.searchExampleTitle")+", ",{block:"b-link",mix:[{block:"i-action",elem:"try-tutorial"}],mods:{pseudo:"yes",omni:"yes"},js:true,url:"#",content:vb.getLocalizedString("app.searchTutorial.example")}]},{elem:"quest-close",mix:[{block:"i-action",elem:"close-search-tutorial"}],content:{block:"krestik",mods:{size:"big"}}}]}
};blocks["b-head-logo"]=function(data){return{block:"b-head-logo",js:true,mix:[{block:"i-action",elem:"head-logo"}],content:[{elem:"logo",content:{elem:"link",content:{elem:"img",url:data.branding.logo.img},attrs:{title:data.branding.logo.title},url:data.branding.logo.url}}]}
};BEM.DOM.decl("b-head-logo",{_onFocus:function(){this.setMod("hide-focus","yes");var logo=this;$(document).one("mouseup",function(){logo._onBlur()
})},_onBlur:function(){this.setMod("hide-focus","none")}},{live:function(){if(vb.navigator==="ie"&&vb.navigatorMajorVersion===9){this.liveBindTo("mousedown",function(e){e.preventDefault();
this._onFocus()})}this.liveBindTo("click",function(e){if(e.which!==3)vb.stat("panel.logo")})}});BEM.decl("i-statface",{onSetMod:{js:function(){this._data={};
this._needSend=false;this.hasMod("send","manual")||$(window).unload(this.changeThis(this.send))}},set:function(name,val){this._needSend=true;
var data=this._data;if(typeof name=="object"){$.each(name,function(key,value){data[key]=value})}else{data[name]=val
}return this},reset:function(){var _this=this;arguments[0]?$.each(arguments,function(i,key){delete _this._data[key]
}):this._data={};$.isEmptyObject(this._data)&&(this._needSend=false);return this},serialize:function(){var _this=this;
return $.map(_this.params.keys,function(val){return _this._data[val]}).join(".")+(_this.params.customKeys?$.map(_this.params.customKeys,function(key){var val=_this._data[key];
return"/"+key+"="+(val==undefined?"":val)}).join(""):"")},send:function(onComplete){if(this._needSend){var params=this.params,url=["//",params.host,"/",params.path,"/dtype=stred","/pid=",params.pid,"/cid=",params.cid,"/path=",this.serialize(),"/*data=",encodeURIComponent("url="+encodeURIComponent(params.url))].join("");
params.path=="click"?document.createElement("IMG").src=url:$.ajax({type:"GET",url:url,data:null,complete:onComplete||$.noop,dataType:"script",timeout:500});
this._needSend=false}return this},getDefaultParams:function(){return{host:"clck.yandex.ru",path:"jclck",url:location.href}
}});blocks["b-head-search"]=function(data){var url=data.branding.search.url,matches=url.match(/([\w_\-]+)\=\{searchTerms\}/),defaultAction=url.replace(matches[0],""),placeholder=data.branding.search.placeholder;
return{block:"b-head-search",mods:{theme:"islands"},content:[{block:"b-search",attrs:{action:defaultAction},js:{url:url},content:[{elem:"row",content:[{elem:"col",mix:[{elem:"input"}],content:{block:"b-form-input",mods:{theme:"grey",size:"l",type:"search",autocomplete:"yes"},mix:[{block:"b-search",elem:"input"}],js:{dataprovider:{name:"i-vb-search-suggest-dataprovider"},popupMods:{size:"l"}},name:matches[1],placeholder:placeholder,role:"search",aria:"textbox"}},{elem:"col",mix:[{elem:"button"}],content:[{block:"b-form-button",mods:{size:"big",theme:"islands"},mix:[{block:"b-search",elem:"button"},{block:"i-action",elem:"search-button"}],content:vb.getLocalizedString("app.searchButtonTitle")}]}]}]}]}
};(function(){var instances,sysChannel,update=function(){var instance,i=0;while(instance=instances[i++])instance.val(instance.elem("input").val())
},getActiveElement=function(doc){try{return doc.activeElement}catch(e){}};BEM.DOM.decl("b-form-input",{onSetMod:{js:function(){var _this=this,input=_this.elem("input"),activeElement=getActiveElement(_this.__self.doc[0]),haveToSetAutoFocus=_this.params.autoFocus&&!(activeElement&&$(activeElement).is("input, textarea"));
_this._val=input.val();_this._input0=input[0];if(activeElement===_this._input0||haveToSetAutoFocus){_this._autoFocus=true;
_this.setMod("focused","yes")._focused=true;delete _this._autoFocus}if(!sysChannel){instances=[];sysChannel=_this.channel("sys").on({tick:update,idle:function(){sysChannel.un("tick",update)
},wakeup:function(){sysChannel.on("tick",update)}})}_this._instanceIndex=instances.push(_this.bindTo(input,{focus:_this._onFocus,blur:_this._onBlur}))-1;
_this.params.shortcut&&_this.bindToDoc("keydown",function(e){if(e.ctrlKey&&e.keyCode==38&&!$(e.target).is("input, textarea")){_this.setMod("focused","yes")
}})},disabled:function(modName,modVal){this.elem("input").attr("disabled",modVal=="yes")},focused:function(modName,modVal){if(this.hasMod("disabled","yes"))return false;
var focused=modVal=="yes";focused?this._focused||this._focus():this._focused&&this._blur();this.afterCurrentEvent(function(){this.trigger(focused?"focus":"blur")
})}},onElemSetMod:{message:{visibility:function(elem,modName,modVal){var _this=this,type=_this.getMod(elem,"type");
if(type){var needSetMod=true;modVal||_this.elem("message","type",type).each(function(){this!=elem[0]&&_this.hasMod($(this),"visibility","visible")&&(needSetMod=false)
});needSetMod&&_this.toggleMod("message-"+type,"yes","",modVal==="visible")}}}},val:function(val,data){if(typeof val=="undefined")return this._val;
if(this._val!=val){var input=this.elem("input");input.val()!=val&&input.val(val);this._val=val;this.trigger("change",data)
}return this},getSelectionEnd:function(){var input=this.elem("input")[0],end=0;if(typeof input.selectionEnd=="number"){end=input.selectionEnd
}else{var range=document.selection.createRange();if(range&&range.parentElement()==input){var len=input.value.length,textInputRange=input.createTextRange();
textInputRange.moveToBookmark(range.getBookmark());var endRange=input.createTextRange();endRange.collapse(false);
end=textInputRange.compareEndPoints("EndToEnd",endRange)>-1?len:-textInputRange.moveEnd("character",-len)
}}return end},name:function(name){return this.elem("input").attr("name")},_onFocus:function(){this._focused=true;
return this.setMod("focused","yes")},_onBlur:function(e){var _this=this;if(getActiveElement(document)===_this._input0)return;
if(_this._preventBlur){setTimeout(function(){_this._focus()},0);return _this}_this._focused=false;return _this.delMod("focused")
},_focus:function(){var input=this.elem("input")[0];if(input.createTextRange&&!input.selectionStart){var range=input.createTextRange();
range.move("character",input.value.length);range.select()}else{input.focus()}},_blur:function(){this.elem("input").blur()
},destruct:function(){this.__base.apply(this,arguments);this.params.shortcut&&this.unbindFromDoc("keydown");
instances.splice(this._instanceIndex,1);var i=this._instanceIndex,instance;while(instance=instances[i++])--instance._instanceIndex
}})})();BEM.DOM.decl("b-form-input",{val:function(val,data){if(typeof val==="undefined")return this._val;
if(this._val!=val){var input=this.elem("input");input.val()!=val&&input.val(val);this._val=val;if(!data||data.noTrigger!==true)this.trigger("change",data);
if(!data||data.magicVal!==true)clearInterval(this._magicInterval)}return this},magicVal:function(text){var len=text.length,i=1,_this=this;
function iterate(){_this.val(text.substr(0,i),{noTrigger:true,magicVal:true});if(i===len){clearInterval(_this._magicInterval);
return}i++}this._magicInterval&&clearInterval(this._magicInterval);iterate();this._updateHint();this._magicInterval=setInterval(iterate,30)
},clear:function(){this.val("");this.domElem.find("input").blur();this.delMod("focused")},focus:function(){this._focus()
}});(function(){var cache={};BEM.decl("i-request",{onSetMod:{js:function(){this._preventCache=false}},get:function(request,onSuccess,onError,params){if(!$.isFunction(onError)){params=onError;
onError=this.params.onError}this._get(request,onSuccess,onError,$.extend({},this.params,params))},_get:function(request,onSuccess,onError,params){var key=this._buildCacheKey(request,params),cacheGroup=cache[params.cacheGroup];
params.cache&&cacheGroup&&key in cacheGroup.data?this.afterCurrentEvent(function(){onSuccess.call(this.params.callbackCtx,cacheGroup.data[key])
},this):this._do(request,onSuccess,onError,params)},_do:function(request,onSuccess,onError,params){},_onSuccess:function(requestKey,request,data,params){params.cache&&!this._preventCache&&this.putToCache(params,requestKey,data);
this._preventCache=false},_buildCacheKey:function(obj,params){return typeof obj=="string"?obj:$.param(obj)
},putToCache:function(params,request,data){var cacheGroup=cache[params.cacheGroup]||(cache[params.cacheGroup]={keys:[],data:{}});
if(cacheGroup.keys.length>=params.cacheSize){delete cacheGroup.data[cacheGroup.keys.shift()]}var key=this._buildCacheKey(request,params);
cacheGroup.data[key]=data;cacheGroup.keys.push(key)},dropCache:function(){delete cache[this.params.cacheGroup]
},getDefaultParams:function(){return{cache:false,cacheGroup:"default",cacheSize:100,callbackCtx:this}
}},{_cache:cache})})();BEM.decl({block:"i-request_type_ajax",baseBlock:"i-request"},{onSetMod:{js:function(){this.__base();
this._requestNumber=this._number=this._preventNumber=this._retryCount=0}},_get:function(request,onSuccess,onError,params){this._number++;
this._requestNumber++;this._retryCount=params.retryCount;this.__base.apply(this,arguments)},_do:function(request,onSuccess,onError,params){var _this=this;
if(_this._number>_this._preventNumber){var args=arguments,settings={data:params.data?$.extend({},params.data,request):request},done=_this._wrapCallback(function(respArgs,requestNumber,number){_this._onSuccess(_this._buildCacheKey(request,params),request,respArgs[0],params);
_this._allowCallback(requestNumber,number)&&onSuccess.apply(params.callbackCtx,respArgs)}),fail=_this._wrapCallback(function(respArgs,requestNumber,number){_this._allowCallback(requestNumber,number)&&(_this._retryCount-->0?setTimeout(function(){_this._do.apply(_this,args)
},params.retryInterval):onError&&onError.apply(params.callbackCtx,respArgs))});$.each(["url","dataType","timeout","type","jsonp","jsonpCallback"].concat(params.paramsToSettings||[]),function(i,name){settings[name]=params[name]
});$.ajax(settings).done(done).fail(fail)}},_wrapCallback:function(callback){var requestNumber=this._requestNumber,number=this._number;
return function(data){data!==null&&callback(arguments,requestNumber,number)}},_allowCallback:function(requestNumber,number){return number>this._preventNumber&&this._requestNumber==requestNumber
},_buildCacheKey:function(obj,params){return typeof obj=="string"?obj:this.__base(obj)+params.url},abort:function(){this._preventNumber=++this._number
},preventCallbacks:function(){this.abort()},getDefaultParams:function(){return $.extend(this.__base(),{cache:true,type:"GET",dataType:"jsonp",timeout:2e4,retryCount:0,retryInterval:2e3})
}});BEM.decl({name:"b-form-input__dataprovider",baseBlock:"i-request_type_ajax"},{get:function(request,callback){return this.__base({part:request},function(data){callback.call(this,{items:data[1],metainfo:data[2]})
})}});BEM.decl({name:"i-vb-search-suggest-dataprovider",baseBlock:"i-request_type_ajax"},{cache:{},get:function(request,callback){var self=this,input=$(".b-form-input_type_search").bem("b-form-input");
if(request){var requestCallback=function(){if(!self.cache[request])self.cache[request]=arguments;var actualVal=input.val(),suggest=self.cache[actualVal]||self.cache[request];
self._onSuccess.apply(self,Array.prototype.slice.call(suggest).concat(callback))};if(self.cache[request])requestCallback.apply(self,self.cache[request]);
else vb.search.suggest(request,requestCallback)}else{input._getPopup().hide()}},_onSuccess:function(data,callback){function hideSuggestPopup(){input.getPopup().hide()
}var lib=require("lib"),input=$(".b-form-input_type_search").bem("b-form-input"),query=input.val(),parsedData=lib.getAllSuggests(data);
if(!query||!parsedData||!parsedData.suggestions){hideSuggestPopup();return}var suggests=parsedData.suggestions,hl=lib.highlightText(query);
if(!suggests||!suggests.length){hideSuggestPopup();return}var navigateTitleUsed=false;var BEMJSON=suggests.map(function(suggest){var suggestJSON,navigateTitle=cache.get("settings").branding.search.navigateTitle;
switch(suggest.type){case"text":if(suggest.action&&suggest.action.type==="openurl"){suggestJSON=["nav",suggest.text,suggest.value,suggest.action.value,undefined,hl]
}else{suggestJSON=["text",suggest.value]}break;case"weather":suggestJSON=["weather",suggest.value,suggest.title,suggest.text,suggest.image,suggest.action.value,hl];
break;case"market":case"lingvo":case"maps":suggestJSON=[suggest.type,suggest.value,suggest.title,suggest.text,suggest.action.value,hl];
break;case"units_converter":suggestJSON=["promo",suggest.value,navigateTitleUsed?null:navigateTitle,suggest.text,hl];
navigateTitleUsed=true;break;case"traffic":suggestJSON=["traffic",suggest.value,suggest.title,suggest.text,suggest.image,suggest.action.value,hl];
break;case"fact":suggestJSON=["fact",suggest.value,suggest.text,navigateTitleUsed?null:navigateTitle,hl];
navigateTitleUsed=true;break;default:suggestJSON=suggest.value}return suggestJSON});callback.call(this,{items:BEMJSON})
}});BEM.decl({name:"i-vb-search-history-suggest-dataprovider",baseBlock:"i-request_type_ajax"},{cache:{},get:function(request,callback){var _this=this,parseURL=require("parseURL"),bSetting=$(".b-page").bem("b-page").findBlockInside("b-setting"),input=bSetting.findBlockInside({blockName:"b-form-input",modName:"type",modVal:"url"}),newURL=parseURL(input._val);
if(!bSetting.titleManuallyChanged){if(!bSetting.droppedTitle&&newURL.host!=bSetting.parsedUrl.host){bSetting.droppedTitle=true;
bSetting._inputTitle.val("")}}bSetting.suggestedUrl=false;if(!request){input.getPopup().hide();return
}if(input.getMod("block-request")==="yes"){input.delMod("block-request");return}this._freeze=true;this._requestURLsSuggest(request,callback)
},_requestURLsSuggest:function(request,callback){if(this._allAnsweredCache[request]){callback.call(this,this._allAnsweredCache[request]);
return}vb.search.suggestURLs(request,function(){var args=[].slice.call(arguments);args.push(callback);
this._handleResponse.apply(this,args)}.bind(this));clearTimeout(this._timer);this._timer=setTimeout(function(){this._freeze=false;
this._showSuggest(callback,this.getInput()._val)}.bind(this),100)},_timer:null,_handleResponse:function(val,source,data,callback){source=this._sources[source];
this._saveToCache(source,val,data);this._showSuggest(callback,val)},getPopup:function(){return this.getInput().getPopup()
},getInput:function(){var input=$(".b-form-input_type_url").bem("b-form-input");this.getInput=function(){return input
};return input},_sources:["history","bookmarks","tabs","web"],_allAnsweredCache:{},_showSuggest:function(callback,val){if(page().findBlockInside("b-setting").hasMod("hide","yes"))return;
var actualVal=this.getInput()._val,stringHelper=BEM.blocks["i-common__string"],escapeHTML=stringHelper.escapeHTML.bind(stringHelper);
if(!actualVal){this.getPopup().hide();return}var cachedData=this._getFromCache(actualVal);var usedVal=actualVal;
if(!cachedData){cachedData=this._getFromCache(val);usedVal=val}if(!cachedData){this.getPopup().hide();
return}var allAnswered=this._sources.every(function(key){return Boolean(cachedData[key])});if(allAnswered){clearTimeout(this._timer);
if(this._sources.every(function(key){return cachedData[key]&&cachedData[key].length===0})){this.getPopup().hide();
return}}else if(this._freeze){return}var all=[];this._sources.forEach(function(source){var pages=cachedData[source]||[];
pages.forEach(function(page){page.source=source});all=all.concat(pages)});all.sort(function(a,b){return b.weight-a.weight
});var usedDomains={};all=all.filter(function(page){page.domain=page.domain.replace(/^www\./,"");if(page.domain in usedDomains){return false
}usedDomains[page.domain]=true;return true});var usedUrls={};if(all.length>1){all=all.reduce(function(res,page){if(page.url in usedUrls){return res
}usedUrls[page.url]=true;res.push(page);return res},[])}var results=all.slice(0,8);if(results.length===8){var fromWeb=0;
results.forEach(function(result){if(result.source==="web"){fromWeb++}});if(fromWeb<2){var otherResults=all.slice(8,all.length),othersFromWeb=otherResults.filter(function(page){return page.source==="web"
});othersFromWeb.length=Math.min(othersFromWeb.length,2);results.length=results.length-othersFromWeb.length;
results=results.concat(othersFromWeb)}}var res={items:results.map(function(page){page.title=page.title.replace(/\u0007$/,"");
return["history",page.url,page.title,val,val]})};if(allAnswered){this._allAnsweredCache[usedVal]=res;
if(results.length){if(val.indexOf(".")!==-1){vb.requestThumbData(results[0].url)}}}callback.call(this,res)
},_saveToCache:function(source,val,data){var cachedData=cache.get("thumbsSuggest")||{},valObj=cachedData[val]=cachedData[val]||{};
var oldData=valObj[source]||[];oldData=oldData.concat(data);valObj[source]=oldData;cache.set("thumbsSuggest",cachedData)
},_getFromCache:function(val){var cachedData=cache.get("thumbsSuggest")||{};return cachedData[val]||null
},_findWebResponseForPreviousQueries:function(query){var originalQuery=query;while(query=query.slice(0,query.length-1)){var cache=this.cache[query];
if(!cache)continue;var web=cache.web;if(web&&web.url.indexOf(originalQuery)!==-1){return cache.web}}return null
}});BEM.DOM.decl({block:"b-form-input",modName:"type",modVal:"search"},{onSetMod:{js:function(){this.bindToDoc("keydown",this._onPress,this);
this.__base.apply(this,arguments)}},_onPress:function(e){if(this.hasMod("focused","yes")){if(e.keyCode==13){e.stopPropagation();
e.preventDefault();var selected=this._getPopup().findBlockInside({blockName:"b-autocomplete-item",modName:"hovered",modVal:"yes"});
var val=this.val();if(selected){selected.navigate()}else if(val){this.findBlockOutside("b-search").submitQuery("enter");
this.afterCurrentEvent(function(){this.clear()})}}}}});(function(undefined){BEM.DOM.decl("b-search",{_input:null,onSetMod:{js:function(){var _this=this;
this._input=this.findBlockInside("b-form-input");this.findBlockInside("b-form-button").bindTo("click",function(){_this.submitQuery("button");
_this._input.clear()});this.bindTo("submit",this._onSubmit,this)}},_onSubmit:function(e){return false
},destruct:function(){this._input=null;this.__base.apply(this,arguments)},submitQuery:function(statType,val){val=val||this.findBlockInside("b-form-input").val();
var queryUrl=this.params.url.replace("{searchTerms}",encodeURIComponent(val));if(!(val||"").trim())return;
if(statType==="enter")vb.stat("panel.search.enter");else if(statType==="button")vb.stat("panel.search.button");
window.location.href=queryUrl;setTimeout(function(){page().startDnD()},vb.navigator==="ie"?1e3:0)}})})();
BEM.DOM.decl("b-search__input",{onSetMod:{js:function(){Lego.block["b-search__input"].call(this.domElem,this.params)
}}});(function($,Lego){Lego.block["b-search__input"]=function(params){var _this=this;var _params=$.extend({focus:false,shortcut:false},params);
if(_params.focus||_this.data("lego:focused")){if(!_this.data("lego:focused")){var activeNode=document.activeElement;
activeNode&&"input textarea".indexOf(activeNode.tagName.toLowerCase())>-1||setTimeout(function(){_this.focus();
if(_this[0].createTextRange){var range=_this[0].createTextRange(),len=_this.val().length;range.collapse();
range.moveStart("character",len);range.moveEnd("character",len);range.select()}_this.data("lego:focused",true)
},0)}if(!!window.history.length&&!$.trim(_this.val())){_this.bind("keydown",function(e){if(e.keyCode==8){if(!$.trim(_this.val()))return window.history.back()
}_this.unbind("keydown",arguments.callee)})}_this.blur(function(){_this.data("lego:focused",false)}).focus(function(){_this.data("lego:focused",true)
})}if(_params.shortcut){$(document).keydown(function(e){if(!e.ctrlKey||$(e.target).is("input, textarea")){return
}if(e.keyCode==38){_this.focus().select()}})}}})(jQuery,window.Lego);(function($){var HTML=BEM.HTML,DOM=BEM.DOM,activeNode;
$(function(){$(window).bind("focus",function(){activeNode=document.activeElement})});DOM.decl({name:"b-form-input",modName:"autocomplete",modVal:"yes"},{onSetMod:{js:function(){var _this=this;
_this.params.foot&&(_this.foot=_this.params.foot);_this._preventRequest=true;_this._preventPopupShow=false;
_this._isPopupShown=false;_this.__base.apply(_this,arguments);_this._userVal=_this.val();var focused=_this._focused,autoFocused=_this._autoFocus;
focused&&_this.delMod("focused");_this._input0=_this.elem("input").filter("input[autocomplete]").attr("autocomplete","off")[0];
_this._preventRequest=false;_this._autoFocus=true;focused&&_this.setMod("focused","yes");autoFocused||delete _this._autoFocus;
_this._items=[];_this._curItemIndex=-1;_this._doRequest=$.debounce(_this._doRequest,_this.params.debounceDelay)
},focused:{yes:function(){this.__base();var onChangeFn=this.params.showListOnFocus&&!this._autoFocus?this._onChange():this._onChange;
this.on("change",onChangeFn)},"":function(){this.__base();this.un("change",this._onChange)._preventHide||this._getPopup().hide()
}}},onElemSetMod:{popup:{fixed:{yes:function(){this._isPopupShown&&this.afterCurrentEvent(function(){this._updatePopupPos()
})},"":function(){this._isPopupShown&&this.afterCurrentEvent(function(){this._updatePopupPos()})}}}},getDataprovider:function(){var url=this.params.dataprovider.url;
return this._dataprovider||(this._dataprovider=BEM.create(this.params.dataprovider.name||this.__self.getName()+"__dataprovider",$.extend(this.params.dataprovider,{url:url,callbackCtx:this})))
},_onChange:function(){activeNode===this._input0?activeNode=null:this._preventRequest||this._doRequest();
return this._onChange},_onKeyDown:function(e){var self=this,isArrow=e.keyCode==38||e.keyCode==40;if(isArrow&&!e.shiftKey){e.preventDefault();
if(!self._isPopupShown){self._getHiddenPopup()}else{var len=self._items.length,out=false;if(len){var direction=e.keyCode-39,index=self._curItemIndex,i=0;
do{out=(index==0&&direction==-1||index+direction>=len)&&self._onLeaveItem(self._items[index],true);index+=direction;
index=index<0?len-1:index>=len?0:index}while(!out&&self._onEnterItem(self._items[index],true)===false&&++i<len)
}}}},_onKeyPress:function(e){if(e.keyCode==13){if(this._curItemIndex>-1&&this._isCurItemEnteredByKeyboard){e.preventDefault();
this._onSelectItem(this._items[this._curItemIndex],true)}this._getPopup().hide()}},_getHiddenPopup:function(){this._preventRequest||this._focused&&!this._isPopupShown&&this._doRequest()
},_getPopup:function(){var _this=this;if(!_this._popup){var keyDownEvent=$.browser.opera&&$.browser.version<12.1?"keypress":"keydown",block=_this.__self.getName(),content=[{elem:"items",tag:"ul",mix:[{block:block,elem:"popup-items"}]},{block:"b-form-input",elem:"shadow",tag:"i"}];
_this._hasPopupFade()&&content.push({block:block,elem:"fade"});_this._popup=$(HTML.build({block:"i-popup",mix:[{block:block,elem:"popup",mods:_this.params.popupMods,js:{uniqId:_this._uniqId}}],content:content})).bem("i-popup").on({show:function(){_this.trigger("popup-shown").bindTo("keypress",_this._onKeyPress).bindToWin("resize",_this._updatePopupPos).unbindFrom("input","click")._isPopupShown=true
},"outside-click":function(e,data){_this.containsDomElem($(data.domEvent.target))&&e.preventDefault()
},hide:function(){_this.trigger("popup-hidden").unbindFrom("keypress").unbindFromWin("resize").bindTo("input","click",_this._getHiddenPopup)._curItemIndex=-1;
_this._isPopupShown=false}});_this.bindTo(keyDownEvent,_this._onKeyDown);$.each({mouseover:_this._onEnterItem,mouseout:_this._onLeaveItem,mousedown:_this._onSelectItem,mouseup:_this._onItemMouseUp},function(e,fn){BEM.blocks["b-autocomplete-item"].on(_this._popup.domElem,e,function(e){fn.call(_this,e.block)
})});DOM.init(_this._popup.domElem)}return _this._popup},getPopup:function(){return this._getPopup()},_hasPopupFade:function(){return(this.params.popupMods||{}).fade=="yes"
},_updatePopupPos:function(){var box=this.elem("box");var css;var root=$("body").bem("b-page");if(this.hasMod("type","search")){css={left:0,top:$(".b-decor").outerHeight()};
$(".b-autocomplete-item").css("paddingLeft",root.getSuggestMarginLeft());$(".alt-search").css("marginLeft",root.getSuggestMarginLeft())
}else{css=box.offset();css.top+=box.outerHeight()}this.hasMod(this.elem("popup"),"fixed")&&(css.top-=DOM.win.scrollTop());
this._hasPopupFade()&&(css.width=box.outerWidth());this._preventPopupShow||this._getPopup().show(css)
},_onEnterItem:function(item,byKeyboard){if(item.hasMod("enterable","no"))return false;var items=this._items,index=this._curItemIndex;
index>-1&&items[index].delMod("hovered");index=this._getItemIndex(item);index>-1&&items[index].setMod("hovered","yes");
this._curItemIndex=index;this._isCurItemEnteredByKeyboard=!!byKeyboard;if(byKeyboard&&this.params.updateOnEnter){this._preventRequest=true;
this.val(item.enter()!==false?item.val():this._userVal,{source:"autocomplete",itemIndex:this._curItemIndex}).del("_preventRequest")
}},_onLeaveItem:function(item,byKeyboard){var index=this._curItemIndex;if(index>-1&&index==this._getItemIndex(item)){this._items[index].delMod("hovered");
this._curItemIndex=-1}byKeyboard&&this.val(this._userVal);return true},_onSelectItem:function(item,byKeyboard){var selectResult=item.select(byKeyboard||false),needUpdate=typeof selectResult=="object"?selectResult.needUpdate:selectResult!==false,needEvent=typeof selectResult=="object"&&selectResult.needEvent;
this._preventRequest=true;this._preventBlur=!byKeyboard;needUpdate&&this.val(this._userVal=item.val(),{source:"autocomplete",itemIndex:this._curItemIndex});
if(byKeyboard){this.del("_preventRequest")}else{needUpdate||(this._preventHide=true);this.afterCurrentEvent(function(){this.setMod("focused","yes").del("_preventRequest","_preventHide")
})}(needUpdate||needEvent)&&this.trigger("select",{item:item,byKeyboard:byKeyboard})},_onItemMouseUp:function(){this.del("_preventBlur")._getPopup().hide()
},_getItemIndex:function(item){return $.inArray(item,this._items)},_doRequest:function(){var _this=this;
_this.enablePopup();_this._userVal=_this.val();_this.trigger("data-requested").getDataprovider().get(_this.val(),function(data){_this.trigger("data-received",data);
var popup=_this._getPopup(),dataItems=data.items||data;_this.foot&&dataItems.length&&$.inArray(_this.foot,dataItems)==-1&&dataItems.push(_this.foot);
if(dataItems.length&&_this._userVal){_this._curItemIndex=-1;DOM.update(popup.elem("items"),_this._buildItemsHtml(dataItems),function(){_this._updatePopupPos();
_this._items=popup.findBlocksInside("b-autocomplete-item");_this.trigger("update-items")})}else{popup.hide()
}})},_buildItemsHtml:function(data){var _this=this;return HTML.build($.map(data,function(data,i){var autocompleteItem={block:"b-autocomplete-item",data:data,mods:{type:$.isArray(data)?data[0]:"text",index:i.toString()},suggestVersion:_this.params.dataprovider.version},prefs;
$.isArray(data)&&$.isPlainObject(prefs=data.concat().pop())&&$.extend(autocompleteItem,prefs);return autocompleteItem
}))},setFoot:function(data){return this.foot=data},getDefaultParams:function(){return $.extend(this.__base(),{updateOnEnter:true,debounceDelay:50,showListOnFocus:true})
},enablePopup:function(){this._preventPopupShow=false},disablePopup:function(){this._preventPopupShow=true
}})})(jQuery);(function(undefined){var SUGGESTS_RIGHT_PADDING=28;BEM.DOM.decl({name:"b-form-input",modName:"autocomplete",modVal:"yes"},{onSetMod:{js:function(){var _this=this,type=this.getMod("type");
this.__base.apply(this,arguments);if(this.getMod("autoclosable")==="no"){this.getPopup().setMod("autoclosable","no")
}this.getPopup().setMod("type",type||"");if(this._input0.oninput===null){this.elem("input").on("input",function(){_this._doRequest()
})}BEM.blocks["b-autocomplete-item"].on("mouseover",function(e){if(e.block.hasMod("type","history")){e.block.changeEditingThumb()
}});BEM.blocks["b-autocomplete-item"].on("mouseout",function(e){if(e.block.hasMod("type","history")){e.block.resetEditingThumb()
}})}},_updatePopupPos:function(){this.__base.apply(this,arguments);if(vb.navigator==="ie"&&vb.navigatorMajorVersion<9)return;
var popupa=this._getPopup(),maxWidth=$(".b-content").width()-popupa.domElem.offset().left-SUGGESTS_RIGHT_PADDING,items=popupa.findBlocksInside("b-autocomplete-item");
items.forEach(function(item){item.domElem.css("maxWidth",maxWidth)})},_onKeyPress:function(e){if(!this.hasMod("type","search")){this._onKeyPress=this.__base.bind(this);
this.__base.apply(this,arguments)}else{this._onKeyPress=function(){}}},_onSelectItem:function(item,byKeyboard){if(this.getMod("type")!=="search"){this.__base.apply(this,arguments)
}if(this.getMod("type")==="url"){var index=parseInt(item.getMod("index"),10)+1;page().findBlockInside("b-setting").submitThumb("thumb.adddone.suggest."+index,{url:item.params.url,title:item.params.title,pinned:true})
}}})})();BEM.decl("i-common__string",{},{cleverSubstring:function(){var ellipsisChar="…";return function(str,maxLength,maxLengthRelative){return str.length>maxLength+maxLengthRelative?str.substring(0,maxLength-1)+ellipsisChar:str
}}(),escapeHTML:function(){var map={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},f=function(t){return map[t]||t
};return function(string){return String(string).replace(/&(?!\w+;)|[<>"']/g,function(s){return map[s]||s
})}}(),escapeRegExp:function(string){return string.replace(/([.?*+^$[\]\\(){}|-])/g,"\\$1")},highlight:function(text,ranges){if(!$.isArray(ranges))return text;
var emphasized=[],cursor=0,index,_ranges=ranges.sort(function(a,b){return a[0]-b[0]}),entities=[],encodeChar="?",hasEncode=~text.indexOf(encodeChar),decodeEntity=function(){var symbol,entityCode=/\&#\d+;/gi;
while(symbol=entityCode.exec(text)){entities.push(symbol[0]);text=text.replace(symbol[0],encodeChar)}},encodeEntity=function(decodeText){if(hasEncode)return decodeText;
while(~decodeText.indexOf(encodeChar)&&entities.length){decodeText=decodeText.replace(encodeChar,entities[0]);
entities.shift()}return decodeText};!hasEncode&&decodeEntity();_ranges.forEach(function(range){index=cursor>range[0]?cursor:range[0];
emphasized.push({tag:"span",elem:"span",content:encodeEntity(text.slice(cursor,index))});emphasized.push({tag:"em",elem:"em",content:encodeEntity(text.slice(index,cursor=range[1]))})
},this);emphasized.push({tag:"span",elem:"span",content:encodeEntity(text.slice(cursor))});return emphasized
}});(function(undefined){BEM.decl("i-common__string",{},{cleverSubstring:function(){var ellipsisChar="&#x2026;";
return function(str,maxLength,maxLengthRelative){return str.length>maxLength+maxLengthRelative?str.substring(0,maxLength-1)+ellipsisChar:str
}}(),escapeHTML:function(){var map={"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},f=function(t){return map[t]||t
};return function(string){return String(string).replace(/&(?!\w+;)|[<>"']/g,function(s){return map[s]||s
})}}()})})();BEM.DOM.decl("b-autocomplete-item",{val:function(){return this.params.val||this.elem("text").text()||this.domElem.text()
},enter:function(){},select:function(byKeyboard){}},{live:function(){this.liveBindTo("mouseover mouseout mousedown mouseup",function(e){if(/(down|up)/.test(e.type)&&e.which!==1)return false;
this.trigger(e.type)})}});BEM.HTML.decl("b-autocomplete-item",{onBlock:function(ctx){var data=ctx.param("data"),text=BEM.blocks["i-common__string"].escapeHTML($.isArray(data)?data[1]:data);
$.isArray(ctx.param("search_cgi"))&&ctx.js({cgi:ctx.param("search_cgi")});ctx.tag("li").mod("pers",ctx.param("pers")?"yes":false).content(BEM.blocks["i-common__string"].highlight(text,ctx.param("hl"))).js(true)
}});BEM.HTML.decl("b-autocomplete-item",{onBlock:function(ctx){var data=ctx.param("data"),hl=typeof data[2]==="function"?data[2]:function(s){return s
},text=BEM.blocks["i-common__string"].escapeHTML($.isArray(data)?data[1]:data);$.isArray(ctx.param("search_cgi"))&&ctx.js({cgi:ctx.param("search_cgi")});
ctx.tag("li").attr("style",ctx.mod("type")!=="history"?"padding-left: "+page().getSuggestMarginLeft():"").mod("pers",ctx.param("pers")?"yes":false).content(hl(text)).js(true)
}});var types=["text","fact","lingvo","maps","market","nav","promo","traffic","weather"];types.forEach(function(modVal){var declObject={onSetMod:{js:function(){this._formInput=$(".b-form-input_type_search").bem("b-form-input");
this._headSearch=this._formInput.findBlockOutside("b-head-search");this.bindTo("mousedown",function(e){page().stopDnD();
this.navigate()})}},navigate:function(){var thisUrl=this.params.url;vb.stat("panel.search.suggest");if(this.hasMod("type","nav")){vb.navigateUrlWithReferer(thisUrl,1)
}else if(thisUrl){window.location.href=thisUrl}else{this._headSearch.findBlockInside("b-search").submitQuery(null,this.val())
}this._formInput.clear();if(vb.navigator==="ie"){var headSearch=this._headSearch.domElem.parent(),blocks=require("bem").blocks,BEMHTML=require("bemhtml");
this.afterCurrentEvent(function(){BEM.DOM.update(headSearch,BEMHTML.apply(blocks["b-head-search"](cache.get("settings"))))
})}},destruct:function(){this._formInput=null;this.__base.apply(this,arguments)}};BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:modVal},declObject)
});(function(undefined){BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"history"},{select:function(byKeyboard){var self=this,parseURL=require("parseURL"),bSetting=this.findBlockOutside("b-page").findBlockInside("b-setting");
var input=bSetting.findBlockInside({block:"b-form-input",modName:"type",modVal:"url"});input.setMod("block-request","yes");
return{needUpdate:true}},val:function(){return this.params.url},enter:function(){this.__base.apply(this,arguments);
this.changeEditingThumb()},changeEditingThumb:function(){var editingThumb=cache.get("editingThumb")||{},params=this.params,cachedThumbData=(cache.get("historyThumbs")||{})[params.url];
editingThumb.data=$.extend(cachedThumbData||{},{url:params.url,title:params.title});cache.set("editingThumb",editingThumb);
if(!cachedThumbData){this.afterCurrentEvent(function(){vb.requestThumbData(params.url)})}},resetEditingThumb:function(){var editingThumb=cache.get("editingThumb")||{};
delete editingThumb.data;cache.set("editingThumb",editingThumb)}});function makeBold(str){return"<b>"+str+"</b>"
}function decodeURIComponentSafe(str){var out="",arr,x;arr=str.split(/(%(?:D0|D1)%.{2})/);for(var i=0;i<arr.length;i++){try{x=decodeURIComponent(arr[i])
}catch(e){x=arr[i]}out+=x}return out}BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"history"},{onBlock:function(ctx){var BEM=require("bem").BEM,Lib=require("lib"),data=ctx.param("data").slice(1),originalURL=data[0],url,parseURL=require("parseURL"),clearTitle=data[1],searchingStr=new RegExp(Lib.escapeRegExpSymbols(data[2]),"i");
var parsedURL=parseURL(originalURL);if(parsedURL.host){url=BEM.blocks["i-common__string"].escapeHTML(Lib.getUnicodedURL(parsedURL.host));
url+=parsedURL.path==="/"?"":decodeURIComponentSafe(parsedURL.path);url+=decodeURIComponent(parsedURL.query);
if(parsedURL.hash){url+="#"+parsedURL.hash}}else{originalURL=url="http://"+originalURL}url=url.replace(/^\w+:\/\//,""),url=BEM.blocks["i-common__string"].cleverSubstring(url.substr(0,url.length-5),Lib.getHistorySuggestMaxLength(),0)+url.substr(url.length-5);
url=url.replace(/^www\./,"").replace(searchingStr,makeBold);clearTitle=clearTitle.replace(searchingStr,makeBold);
ctx.content([{tag:"span",elem:"text",content:BEM.blocks["i-common__string"].highlight(url,ctx.param("hl"))},{tag:"span",elem:"fact",content:[" ",clearTitle]}]).js({url:originalURL,title:data[1]})
}})})();BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"nav"},{val:function(){return this.findElem("link-url").text()
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"nav"},{onBlock:function(ctx){var data=ctx.param("data"),urlData=data[3],hl=data[5],escapeHTML=BEM.blocks["i-common__string"].escapeHTML,url=(urlData.match(/^\w[\w\-]*:\/\//g)?"":"http://")+urlData;
ctx.js({url:url}).content({elem:"vb-link",title:escapeHTML(data[2]),description:hl(escapeHTML(data[1]))})
},onElem:{"vb-link":function(ctx){ctx.tag("span").content([{elem:"link-url",tag:"span",content:ctx.param("title")},{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "].concat(ctx.param("description"))}])
}}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"market"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),hl=data[4],escapeHTML=BEM.blocks["i-common__string"].escapeHTML,urlData=data[3],url=urlData&&(urlData.match(/^\w[\w\-]*:\/\//g)?"":"http://")+urlData;
url&&ctx.js({url:url});ctx.content([data[0]&&{elem:"vb-link",title:escapeHTML(data[0])},data[1]&&{tag:"span",elem:"text",content:hl(escapeHTML(data[1]))},data[2]&&{elem:"link-info",tag:"span",content:"&nbsp;&mdash; "},data[2]&&{tag:"span",elem:"description",content:escapeHTML(data[2])}])
},onElem:{"vb-link":function(ctx){ctx.tag("span").content([{elem:"link-url",tag:"span",content:ctx.param("title")},{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "].concat(ctx.param("description"))}])
}}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"lingvo"},{onBlock:function(ctx){var data=ctx.param("data")[1];
ctx.content([{tag:"span",elem:"text",content:data.text},{tag:"span",elem:"translation",content:[" — ",data.translation]}])
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"lingvo"},{onBlock:function(ctx){var escapeHTML=BEM.blocks["i-common__string"].escapeHTML,data=ctx.param("data").slice(1),urlData=data[3],hl=data[4],url=urlData&&(urlData.match(/^\w[\w\-]*:\/\//g)?"":"http://")+urlData;
url&&ctx.js({url:url});ctx.content([data[0]&&{elem:"vb-link",title:escapeHTML(data[0])},data[1]&&{tag:"span",elem:"text",content:hl(BEM.blocks["i-common__string"].escapeHTML(data[1]))},data[2]&&{tag:"span",elem:"translation",content:[" — ",data[2]]}])
},onElem:{"vb-link":function(ctx){ctx.tag("span").content([{elem:"link-url",tag:"span",content:ctx.param("title")},{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "].concat(ctx.param("description"))}])
}}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"maps"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),escapeHTML=BEM.blocks["i-common__string"].escapeHTML,hl=data[4],urlData=data[3],url=urlData&&(urlData.match(/^\w[\w\-]*:\/\//g)?"":"http://")+urlData;
url&&ctx.js({url:url});ctx.content([data[0]&&{elem:"vb-link",title:escapeHTML(data[0])},data[1]&&{tag:"span",elem:"text",content:hl(escapeHTML(data[1]))},data[2]&&{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "]},data[2]&&{tag:"span",elem:"description",content:hl(escapeHTML(data[2]))}])
},onElem:{"vb-link":function(ctx){ctx.tag("span").content([{elem:"link-url",tag:"span",content:ctx.param("title")},{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "].concat(ctx.param("description"))}])
}}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"promo"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),hl=data[3];
ctx.content([data[0]&&{tag:"span",mods:{color:"black"},elem:"text",content:hl(data[0])},!data[1]&&{tag:"span",elem:"devider",content:" "},data[2]&&{tag:"span",elem:"text",mods:{color:"gray"},content:hl(data[2])},data[1]&&{tag:"span",elem:"devider",content:" — "},data[1]&&{tag:"span",elem:"engine",content:BEM.blocks["i-common__string"].escapeHTML(data[1])}])
}});BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"promo"},{val:function(){return this.findElem("text").eq(0).text()
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"hl"},{onBlock:function(ctx){ctx.content($.map(ctx.param("data").slice(1),function(chunk){return $.isArray(chunk)?{tag:"span",elem:"highlight",content:chunk[0]}:chunk
}))}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"fact"},{onBlock:function(ctx){var data=ctx.param("data").slice(1);
ctx.content([{tag:"span",elem:"text",content:BEM.blocks["i-common__string"].highlight(data[0],ctx.param("hl"))},{tag:"span",elem:"fact",content:[" — ",BEM.blocks["i-common__string"].escapeHTML(data[1])]}])
}});BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"fact"},{val:function(){return this.findElem("text").eq(0).text()
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"fact"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),hl=data[3];
ctx.content([{tag:"span",elem:"text",content:BEM.blocks["i-common__string"].escapeHTML(data[0])},{tag:"span",elem:"fact",content:[" — ",hl(BEM.blocks["i-common__string"].escapeHTML(data[1]))]},data[2]&&{tag:"span",elem:"text",mods:{promo:"yes"},content:[" — ",BEM.blocks["i-common__string"].escapeHTML(data[2])]}])
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"nah"},{onBlock:function(ctx){ctx.content(ctx.param("data")[1])
}});BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"href"},{url:function(){return this.findBlockInside("b-link").domElem.attr("href")
},enter:function(){return false},select:function(byKeyboard){byKeyboard&&(location.href=this.url());return false
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"href"},{onBlock:function(ctx){var data=ctx.param("data").slice(1);
ctx.content({block:"b-link",content:data[0],url:data[1]})}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"weather"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),escapeHTML=BEM.blocks["i-common__string"].escapeHTML;
ctx.content([{tag:"span",elem:"text",content:escapeHTML(data[0])},{tag:"i",elem:"icon",mods:{weather:data[2].replace("-","minus-").replace("+","plus-").replace(/_/g,"-")}},{tag:"span",elem:"value",content:escapeHTML(data[1].replace("-","&ndash;"))}])
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"weather"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),escapeHTML=BEM.blocks["i-common__string"].escapeHTML,urlData=data[4],hl=data[5],url=urlData&&(urlData.match(/^\w[\w\-]*:\/\//g)?"":"http://")+urlData;
url&&ctx.js({url:url});ctx.content([{elem:"vb-link",title:escapeHTML(data[0])},{tag:"span",elem:"text",content:hl(escapeHTML(data[1]))},{tag:"i",elem:"icon",mods:{weather:data[3].replace("-","minus-").replace("+","plus-").replace(/_/g,"-")}},{tag:"span",elem:"value",content:hl(escapeHTML(data[2].replace("-","&ndash;")))}])
},onElem:{"vb-link":function(ctx){ctx.tag("span").content([{elem:"link-url",tag:"span",content:ctx.param("title")},{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "].concat(ctx.param("description"))}])
}}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"traffic"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),escapeHTML=BEM.blocks["i-common__string"].escapeHTML;
ctx.content([{tag:"span",elem:"text",content:escapeHTML(data[0])},{tag:"i",elem:"icon",mods:{traffic:data[2]}},{tag:"span",elem:"value",content:escapeHTML(data[1])}])
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"traffic"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),escapeHTML=BEM.blocks["i-common__string"].escapeHTML,urlData=data[4],hl=data[5],url=urlData&&(urlData.match(/^\w[\w\-]*:\/\//g)?"":"http://")+urlData;
ctx.js({url:url});ctx.content([{elem:"vb-link",title:escapeHTML(data[0])},{tag:"span",elem:"text",content:hl(escapeHTML(data[1]))},{tag:"i",elem:"icon",mods:{traffic:data[3]}},{tag:"span",elem:"text",content:hl(escapeHTML(data[2]))}])
},onElem:{"vb-link":function(ctx){ctx.tag("span").content([{elem:"link-url",tag:"span",content:ctx.param("title")},{elem:"link-info",tag:"span",content:["&nbsp;&mdash; "].concat(ctx.param("description"))}])
}}});BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"traffic"},{val:function(){return this.findElem("text").eq(0).text()
}});BEM.DOM.decl({block:"b-autocomplete-item",modName:"type",modVal:"foot"},{select:function(){return false
}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"foot"},{onBlock:function(ctx){ctx.mod("enterable","no").content($.map(ctx.param("data").slice(1),function(chunk){return $.isArray(chunk)?{tag:"span",elem:"foot",content:chunk[0]}:chunk
}))}});BEM.HTML.decl("b-autocomplete-item",{onElem:{nav:function(ctx){var getUrl=BEM.blocks["b-autocomplete-item"].getUrl;
ctx.tag("a").attrs({href:getUrl(ctx.param("url")),target:"_blank"}).content(ctx.content)}}});BEM.HTML.decl({block:"b-autocomplete-item",modName:"type",modVal:"icon"},{onBlock:function(ctx){var data=ctx.param("data").slice(1),text=data[0]||"",info=data[1]||{},escapeHTML=BEM.blocks["i-common__string"].escapeHTML,getUrl=BEM.blocks["b-autocomplete-item"].getUrl;
if(!info.icon)return;var icons={};if(Array.isArray(info.icon[0])){info.icon.forEach(function(icon){icons[icon[0]]=icon[1]
})}else{icons[info.icon[0]]=info.icon[1]}var svg=icons["svg"]?"background-image:none,url("+icons["svg"]+")":"",png=icons["png"]?"background-image:url("+icons["png"]+");":"";
var content=[{tag:"span",elem:"text",content:escapeHTML(text)},{tag:"i",elem:"icon",attrs:{style:png+svg}},{tag:"span",elem:"value",content:info.fact&&escapeHTML(info.fact.replace("-","&ndash;"))}];
if(info.url){ctx.mod("nav","yes").js({val:getUrl(info.url)}).content({block:"b-autocomplete-item",elem:"nav",url:info.url,content:content})
}else{ctx.content(content)}}});BEM.DOM.decl("b-form-input",{onSetMod:{js:function(){this.__base.apply(this,arguments);
(this._hasHint=!!this.elem("hint")[0])&&this.on("change",this._updateHint)._updateHint()},focused:function(){this.__base.apply(this,arguments);
this._hasHint&&this._updateHint()}},_updateHint:function(){this.toggleMod(this.elem("hint-wrap"),"visibility","visible",!(this._focused||this.val()))
}});BEM.DOM.decl("b-form-input",{onSetMod:{focused:{yes:function(){this.__base.apply(this,arguments);
var input=this.elem("input");this._focusedID=input[0].id;this.bindTo("label","mousedown",function(){var labelID=_this.elem("label")[0].htmlFor;
if(labelID==_this._focusedID)return false})},"":function(){this.__base.apply(this,arguments);this._focusedID=null;
this.unbindFrom("label","mousedown")}}}});BEM.DOM.decl("b-search__sample",{onSetMod:{js:function(){Lego.block["b-search__sample"].call(this.domElem,this.params)
}}});(function($,Lego){Lego.block["b-search__sample"]=function(params){var $this=this,form=$this.closest("form"),input=form.find("input[name='"+(params["for"]||"text")+"']"),nl;
$this.find(".b-link_pseudo_yes").click(function(e){input.focus().attr("value",params["text"]||$(e.target).text());
nl=form.find("input[name='nl']");if(params.nl&&!nl.length)nl=$('<input type="hidden" name="nl" value="1"/>').insertAfter(input);
$(document).trigger("popupsClose.lego");e.preventDefault()})}})(jQuery,window.Lego);BEM.DOM.decl("b-vb-foot",{onSetMod:{js:function(){this.bindToWin("resize",this.repaint);
this.repaint()}},repaint:function(){this.elem("content").css("maxWidth",$(".b-vb").width())}});blocks["b-vb-foot"]=function(data){var ie78=vb.navigator==="ie"&&vb.navigatorMajorVersion<9,blocks=require("bem").blocks;
if(data.hasClosedTabs===undefined)data.hasClosedTabs=true;if(data.hasApps===undefined)data.hasApps=true;
return{block:"b-vb-foot",js:true,content:[{elem:"content",content:[{block:"b-menu-horiz",mods:{layout:"normal",type:"foot",pos:"left"},js:false,content:[{block:"b-dropdowna",mods:{type:"closed-bookmarks"},content:[{elem:"switcher",content:[{block:"b-link",mods:{pseudo:"yes",open:"bookmark",disabled:data.hasClosedTabs?"":"yes"},content:vb.getLocalizedString("footer.closedTabs")}]},{block:"b-popupa",mods:{theme:"ffffff",type:"closed-bookmarks","only-direction":"up"},content:[{elem:"tail"},{elem:"content",content:[{block:"b-spin",mods:{progress:"yes"}}]}]}]},!ie78&&{elem:"item",mix:[{block:"i-action",elem:"show-downloads"},{block:"i-action",elem:"vlinksdown"}],content:{block:"b-link",mods:{pseudo:"yes"},content:vb.getLocalizedString("footer.downloads")}},{elem:"item",content:{block:"b-link",mix:[{block:"i-action",elem:"show-bookmarks"}],mods:{pseudo:"yes"},content:vb.getLocalizedString("footer.bookmarks")}},{elem:"item",mix:[{block:"i-action",elem:"show-history"}],content:{block:"b-link",mods:{pseudo:"yes",action:""},content:vb.getLocalizedString("footer.history")}},vb.navigator==="chromium"&&{elem:"item",content:{block:"b-link",mods:{pseudo:"yes",disabled:data.hasApps?"":"yes",open:"apps"},content:vb.getLocalizedString("footer.apps")}}].filter(function(item){return Boolean(item)
})}]},{elem:"links",content:[{block:"b-link",mix:[{block:"i-action",elem:"settings"}],mods:{pseudo:"yes"},content:vb.getLocalizedString("settings")}]}]}
};blocks["b-popupa_type_properties"]=function(){return{block:"b-popupa",mods:{"only-direction":"up-left",theme:"ffffff",type:"properties"},content:[{elem:"close"},{elem:"tail"},{elem:"content"}]}
};BEM.DOM.decl({block:"b-popupa",modName:"type",modVal:"properties"},{onSetMod:{js:function(){this.on("hide",function(){this.findBlockOutside("b-page").delMod("settings-shown")
});this.__base.apply(this,arguments)}},_onUnderHidden:function(){this.__base.apply(this,arguments);this.findBlockOutside("b-page").findBlockInside("blocker").setMod("disabled","yes")
}});blocks["b-properties-popup"]=function(userSettings){function formatDate(date){var day=date.getDate(),month=date.getMonth()+1,year=date.getFullYear();
day=day<10?"0"+day:day;month=month<10?"0"+month:month;return[day,month,year].join(".")}var blocks=require("bem").blocks,layouts=userSettings.layouts,scales=require("lib").generateSliderScale(layouts),reg=/(.*)\[(.+)\]\((.+)\)(.*)/i,bCopyright=userSettings.copyright+",",current=layouts.indexOf(userSettings.currentLayout);
if(flags.get("currentSliderPos")===undefined){flags.set("currentSliderPos",current)}userSettings.copyright.replace(reg,function(str,pretext,title,link,posttext){if(!pretext)return;
bCopyright=[pretext,{block:"b-link",mix:[{block:"i-action",elem:"hide-popup"}],url:link,mods:{underline:"yes"},content:title}];
if(posttext)bCopyright.push(posttext+",");else bCopyright.push(",")});return[{block:"b-properties-popup",js:true,content:[{elem:"group",elemMods:{type:"count"},content:[{elem:"title",content:vb.getLocalizedString("settings.thumbsNum")+": "},{block:"b-form-slider",mods:{theme:"grey",size:"l",orientation:"horiz",set:"thumbs-layout",input:"hidden"},js:{scale:scales},content:{elem:"info",elemMods:{preset:"inline"},content:[{block:"b-form-input",mods:{theme:"grey"},content:{elem:"input"}}]}}]},{elem:"group",elemMods:{type:"bg"},content:[{block:"b-select-theme",elem:"load",elemMods:{type:"button"},content:[{block:"b-form-button",mods:{theme:"islands",size:"normal"},mix:[{block:"i-action",elem:"upload-background-image"}],content:vb.getLocalizedString("settings.upload")}]},{elem:"title",content:vb.getLocalizedString("settings.backgroundImage")+": "},blocks["b-select-theme"](userSettings)]},{elem:"group",elemMods:{type:"option"},content:blocks["b-properties-popup__group_type_option"](userSettings,false)},{elem:"group",elemMods:{type:"licence"},content:[{elem:"line",content:[vb.getLocalizedString("app.name")," ",{elem:"version",content:userSettings.rev,attrs:{title:userSettings.build},tag:"span"},", ",vb.getLocalizedString("settings.releaseDate")," ",formatDate(new Date(userSettings.buildDate*1e3)),"."]},userSettings.softURL&&{elem:"line",mods:{align:"top"},content:[{block:"b-link",mix:[{block:"i-action",elem:"hide-popup"}],url:userSettings.softURL,mods:{underline:"yes"},content:vb.getLocalizedString("settings.otherSoft")},"."]},{elem:"line",content:[{elem:"copyright",tag:"span",content:bCopyright},{block:"b-link",mix:[{block:"i-action",elem:"hide-popup"}],mods:{underline:"yes"},url:userSettings.licenseURL,content:vb.getLocalizedString("settings.licenseAgreement.title")},"."]}]}]},{block:"dropdown-blocker",js:true}]
};blocks["b-properties-popup__group_type_option"]=function(userSettings,withCheckboxes){var syncBlock=cache.get("sync")&&cache.get("sync").status!==4?{block:"sync-properties-wrapper",content:blocks["sync-properties"](cache.get("sync"))}:null,isChromium=vb.navigator==="chromium",ie78=vb.navigator==="ie"&&vb.navigatorMajorVersion<9;
return[syncBlock,!withCheckboxes&&{block:"b-form-button",mods:{theme:"islands",size:"normal"},mix:[{block:"b-properties-popup",elem:"other-settings-params"}],content:vb.getLocalizedString("settings.collapsed")},{block:"b-vb-config",elem:"properties",content:[withCheckboxes&&{block:"b-vb-config",elem:"text",content:[{block:"b-properties-popup",elem:"select-title",content:vb.getLocalizedString("settings.showSites")},blocks["b-form-select"](userSettings.thumbStyle)]},withCheckboxes&&{block:"b-vb-config",elem:"text",elemMods:{chbox:"yes"},tag:"label",attrs:{"for":"nnn0"},content:[{block:"b-form-checkbox",mods:{type:ie78?"":"islands",first:"yes",name:"show-search",theme:"grey-m",size:"m",checked:userSettings.showSearchForm?"yes":""},checkboxAttrs:{id:"nnn0",value:"iu",name:"text"}}," "+vb.getLocalizedString("settings.showSearchForm")]},withCheckboxes&&{block:"b-vb-config",elem:"text",elemMods:{chbox:"yes"},tag:"label",attrs:{"for":"nnn"},content:[{block:"b-form-checkbox",mods:{type:ie78?"":"islands",name:"show-bookmarks",theme:"grey-m",size:"m",checked:userSettings.showBookmarks?"yes":""},checkboxAttrs:{id:"nnn",value:"iu",name:"text"}}," "+vb.getLocalizedString("settings.showBookmarksPanel")]},withCheckboxes&&{block:"b-vb-config",elem:"text",elemMods:{chbox:"yes"},tag:"label",attrs:{"for":"nnn2"},content:[{block:"b-form-checkbox",mods:{type:ie78?"":"islands",theme:"grey-m",name:"send-stat",size:"m",checked:userSettings.sendStat?"yes":""},checkboxAttrs:{id:"nnn2",value:"iu",name:"text"}}," "+vb.getLocalizedString("settings.sendstat")]},withCheckboxes&&{block:"b-vb-config",elem:"text",elemMods:{chbox:"yes"},tag:"label",attrs:{"for":"ss2"},content:[{block:"b-form-checkbox",mods:{type:ie78?"":"islands",theme:"grey-m",name:"show-advertisement",size:"m",checked:userSettings.showAdvertisement?"yes":""},checkboxAttrs:{id:"ss2",value:"iu",name:"text"}}," "+vb.getLocalizedString("settings.showAdvertisement")]},!userSettings.isHomePage&&withCheckboxes&&!isChromium&&{block:"b-homepage-wrapper",tag:"div",content:{block:"b-form-button",mods:{size:"normal",theme:"islands",action:"set-as-homepage"},content:vb.getLocalizedString("settings.setAsHomePage")}}]}]
};BEM.DOM.decl("b-properties-popup",{onSetMod:{js:function(){this.bindTo("other-settings-params","click",function(){this.showAllSettings()
})}},showAllSettings:function(){var blocks=require("bem").blocks,BEMHTML=require("bemhtml"),html=BEMHTML.apply(blocks["b-properties-popup__group_type_option"](cache.get("settings"),true));
this.afterCurrentEvent(function(){this.findElem("group","type","option").html(html);BEM.DOM.init();this.findBlockOutside("b-popupa").pos();
this.findBlocksInside("b-form-checkbox").forEach(function(checkbox,index){checkbox.on("change",function(){var name=this.getMod("name"),isChecked=this.isChecked();
if(name==="send-stat"){vb.setSendStatistics(isChecked,false)}else{page().applySettings(true)}switch(name){case"show-search":vb.stat("settings.search."+(isChecked?"show":"hide"));
break;case"show-bookmarks":vb.stat("settings.bookmarkspanel."+(isChecked?"show":"hide"));break;case"send-stat":vb.stat("settings.stat.send"+(isChecked?"on":"off"));
break;case"show-advertisement":vb.stat("settings.adv."+(isChecked?"on":"off"));break}},checkbox)});this.findBlockInside("b-form-select").on("change",function(){page().applySettings(true)
})})}});(function($,BEM,undefined){var DOM=BEM.DOM,HTML=BEM.HTML,KEYDOWN_EVENT=$.browser.opera&&$.browser.version<12.1?"keypress":"keydown",IS_MSIE=$.browser.msie&&$.browser.version<=10,BLOCK_NAME="b-form-select";
function buildOption(item,i,params){var it={};if(item.item==="option"){it={block:BLOCK_NAME,elem:"option",tag:"option",attrs:{value:item.value},content:item.content};
item.disabled&&(it.attrs.disabled="disabled");item.selected&&(it.attrs.selected="selected")}else if(item.item==="optgroup"){it={elem:"option-group",tag:"optgroup",attrs:{label:item.label}};
item.disabled&&(it.attrs.disabled="disabled");it.content=Array.isArray(item.content)?item.content.map(function(node,i){return buildOption(node,i)
}):item.content}it.block=BLOCK_NAME;if(params){for(var p in params)if(params.hasOwnProperty(p))it[k]=val
}return it}function buildItemJson(node,content,elMods){var item={block:BLOCK_NAME,elem:"item",content:{elem:"text",tag:"span",content:content||" &nbsp; "},mods:{}};
elMods&&(item.mods=elMods);return item}function buildItemsHtml(data){var block=BLOCK_NAME,separatorItem={block:block,elem:"separator",tag:"i"},items=[{block:block,elem:"fade",tag:"i"}],inGroup=false;
function iterateNodes(data,mods){var len=data.length;if(len){var i=0;do{var item=$(data[i]),isDisabled=item.attr("disabled")&&{disabled:"yes"};
if(item.is("optgroup")){inGroup=true;!item.prev().is("optgroup")&&items.push(separatorItem);items.push(buildItemJson(item,item.attr("label"),$.extend({label:"yes"},isDisabled,mods)));
iterateNodes(item.children(),$.extend({inner:"yes"},isDisabled,mods))}else{items.push(buildItemJson(item,item.text(),$.extend(isDisabled,item.is(":selected")&&{selected:"yes"},mods)))
}}while(++i<len||inGroup&&(items.push(separatorItem),inGroup=false))}}iterateNodes(data);return HTML.build(items)
}DOM.decl("b-form-select",{onSetMod:{js:function(){this._items=[];this._curItemIndex=-1;this._rowHeight=22;
this._getSelectedText()!==this._buttonText()&&this.elem("select").trigger("change");this._onChangeTimerId=0
},disabled:function(modName,modVal){var disabled=modVal==="yes";this.elem("select").attr("disabled",disabled);
this._getButton().setMod(modName,modVal);disabled&&this.delMod("opened").delMod("focused")},opened:{yes:function(){if(this.hasMod("disabled","yes"))return false;
this._focus()._drawPopup();this.bindToWin("scroll resize",this._updatePopupPos)},"":function(){this._getPopup().hide();
this.unbindFromWin("scroll resize")}}},focused:{yes:function(modName,modVal){if(this.hasMod("disabled","yes"))return false;
this._getButton().setMod(modName,modVal);this.bindTo("keypress",function(e){this._onKeyPress(e)}).bindTo(KEYDOWN_EVENT,function(e){this._onKeyDown(e)
}).trigger("focusin")},"":function(modName){this.delMod("opened")._getButton().delMod(modName);this.unbindFrom("keypress "+KEYDOWN_EVENT).trigger("focusout")
}},open:function(){return this.setMod("opened","yes")},close:function(){return this.delMod("opened")},isOpened:function(){return this.hasMod("opened","yes")
},val:function(val){if(typeof val==="undefined"){return this.elem("select").val()}var valIndex=-1,optgroup;
this.findElem("option").each(function(idx){this.value===val&&!this.disabled&&(optgroup=$(this).parent("optgroup")[0],!(optgroup&&optgroup.disabled))&&(valIndex=idx)
});valIndex>-1&&this._selectedIndex(valIndex);return this},_selectedIndex:function(index){var prevIdx=this._getSelectedIndex();
if(typeof index==="undefined"||index===prevIdx){return prevIdx}this.elem("select")[0].selectedIndex=index;
this._buttonText(this._getSelectedText());if(this._items[0]){var current=this._items.eq(index);this.delMod(this._items,"selected").setMod(current,"selected","yes")
}this.trigger("change",{index:index,prev:prevIdx});return index},setOptions:function(data){if(!data)return;
DOM.update(this.elem("select"),HTML.build($.map(data,buildOption)));return this.updateItems()},updateItems:function(){this._popup&&this._redrawList();
this.elem("select").trigger("change");return this},_focus:function(){return this.setMod("focused","yes")
},_blur:function(){return this.delMod("focused")},_buttonText:function(text){if(typeof text==="undefined"){return this._getButton().elem("text").text()
}text=text||"";text+=vb.navigator==="ie"&&vb.navigatorMajorVersion<9&&' <span class="b-form-select__arrow">▼</span>'||"";
return this._getButton().elem("text").html(text||" &nbsp; ")},_onClick:function(e){this.toggleMod("opened","yes","")
},_onFocus:function(e){this.toggleMod("focused","yes","",e.type==="focusin")},_onSelectChange:function(e){var _this=this;
_this._buttonText(_this._getSelectedText());clearTimeout(_this._onChangeTimerId);_this._onChangeTimerId=setTimeout(function(){_this.trigger("change",{index:_this._getSelectedIndex(),prev:-1})
},1)},_onKeyPress:function(e){if(e.keyCode===13){e.preventDefault();if(this.isOpened()){this._curItemIndex>-1?this._onSelectItem(this._items.eq(this._curItemIndex)):this.close()
}else{return this._getButton().delMod("pressed")}}},_onKeyDown:function(e){var keyCode=e.keyCode;if(keyCode===38||keyCode===40){e.preventDefault();
if(!this.isOpened())return this.open(e);var len=this._items.length;if(len){var direction=keyCode-39,idx=this._curItemIndex,i=0;
do{idx+=direction}while(idx>=0&&idx<len&&this._onEnterItem(this._items.eq(idx),true)===false&&++i<len)
}}else if(keyCode===32&&!this._keyPressed){this._keyPressed=true;this._onClick();this.bindTo("keyup",function(){this.unbindFrom("keyup");
this._keyPressed=false})}},_onEnterItem:function(item,byKeyboard){if(!this._isSelectableItem(item)){return false
}var items=this._items,idx=this._curItemIndex;idx>-1&&this.delMod(items.eq(idx),"hovered");idx=this._getItemIndex(item);
idx>-1&&this.setMod(items.eq(this._curItemIndex=idx),"hovered","yes");if(byKeyboard){this._selectedIndex(this._curItemIndex);
this._scrollToCurrent()}},_onLeaveItem:function(item){var idx=this._curItemIndex;if(idx>-1&&idx===this._getItemIndex(item)){this.delMod(this._items.eq(idx),"hovered")._curItemIndex=-1
}},_onSelectItem:function(item){if(this._isSelectableItem(item))this._selectedIndex(this._curItemIndex);
this.afterCurrentEvent(function(){this._getButton().setMod("focused","yes")});return this.close()},_isOutsideClicked:function(e,data){return this.containsDomElem($(data.domEvent.target))
},_getItemIndex:function(item){return $.inArray(item.get(0),this._items)},_getSelectedText:function(){return this.elem("select").find(":selected").text()
},_getSelectedIndex:function(){return this.elem("select")[0].selectedIndex},_isSelectableItem:function(item){return!(this.hasMod(item,"disabled","yes")||this.hasMod(item,"label","yes"))
},_getButton:function(){return this._button||(this._button=this.findBlockInside("b-form-button"))},_getPopup:function(){if(this._popup)return this._popup;
var _this=this,blockName=_this.__self.getName(),list={block:blockName,elem:"list"},popupMix={block:blockName,elem:"popup",mods:{}};
["size","layout","theme","width"].forEach(function(mod,i){_this.hasMod(mod)&&(popupMix.mods[mod]=_this.getMod(mod))
});var popup=$(HTML.build({block:"i-popup",underMix:[{block:"b-popupa",elem:"under"}],content:{block:"b-popupa",mods:_this.params.popupMods,mix:[{block:blockName},popupMix],content:{elem:"content",content:list}}}));
(_this._popup=_this.findBlockOn(popup,"i-popup")).on({show:function(){_this._curItemIndex=_this._getSelectedIndex();
var current=_this._items.eq(_this._curItemIndex);_this.delMod(_this._items,"selected").setMod(current,"hovered","yes").setMod(current,"selected","yes").bindToDoc("keydown",function(e){if(e.keyCode===9&&_this.isOpened()){_this._blur()
}})},"outside-click":function(e,data){_this._isOutsideClicked(e,data)?e.preventDefault():_this._blur()
},hide:function(){_this._curItemIndex=-1;_this.delMod("opened").delMod(_this._items,"hovered").delMod(_this.findElem(_this._popup.domElem,"popup"),"scrollable").unbindFromDoc("keydown")
}}).bindTo("mousedown",function(e){e.preventDefault()});BEM.DOM.append("body",_this._popup.domElem);_this._redrawList();
_this._outPopup=_this.findBlockOutside("button","b-popupa");_this._outPopup&&_this._outPopup.on("outside-click",function(e,data){_this._popup.containsDomElem($(data.domEvent.target))&&e.preventDefault()
});return this._popup},_redrawList:function(){var _this=this,popup=_this._getPopup().domElem,items;DOM.update(this.findElem(popup,"list"),buildItemsHtml(this.elem("select").children()));
items=this.findElem(popup,"item");this._curItemIndex=-1;this._items=items.filter(function(){return!_this.hasMod($(this),"label","yes")
});this.bindTo(items,{mouseup:function(e){if(e.which===1){window.selectClosing=2;this.afterCurrentEvent(function(){window.selectClosing=0
});_this._onSelectItem(e.data.domElem);e.stopPropagation()}},mouseover:function(e){_this._onEnterItem(e.data.domElem)
},mouseout:function(e){_this._onLeaveItem(e.data.domElem)}});return this},_popupPos:function(){var btn=this._getButton().domElem,css=btn.offset();
css.top+=btn.outerHeight();css.top+=10;css.left-=4;if(vb.navigator==="ie"&&vb.navigatorMajorVersion<9)css.left-=10;
return css},_updatePopupPos:function(){var css=this._popupPos();css&&this._getPopup().domElem.css(css)
},_drawPopup:function(){var css=this._popupPos(),popup=this._getPopup();popup.domElem.addClass("b-form-select__popup");
popup.domElem.addClass("b-form-select__popup_theme_grey");popup.show(css);this._calcPopupDimensions();
this._scrollToCurrent()},_getRowHeight:function(){return this.findElem(this._getPopup().domElem,"item").outerHeight()
},_calcPopupDimensions:function(){if(!this._popupContent)this._popupContent=this._getPopup().findBlockInside("b-popupa").elem("content");
var rows=parseInt(this.params.rows,10)||false;if(rows&&this.findElem(this._popupContent,"item").size()>rows){this._rowHeight=this._getRowHeight();
this._popupContent.css("height",rows*this._rowHeight);this.setMod(this.findElem(this._getPopup().domElem,"popup"),"scrollable","yes")
}},_scrollToCurrent:function(){if(!this._popupContent||this._curItemIndex<0)return;var curOffsetTop=this.findElem(this._getPopup().domElem,"item","selected","yes").get(0).offsetTop,popContent=this._popupContent,popScrollTop=popContent.scrollTop(),disp=curOffsetTop-popScrollTop,fact=this._rowHeight*2,newScrollTop;
if(disp>popContent.height()-fact){newScrollTop=curOffsetTop-fact}else if(popScrollTop&&disp<fact){newScrollTop=curOffsetTop-popContent.height()+fact
}newScrollTop&&popContent.scrollTop(newScrollTop)},destruct:function(){clearTimeout(this._onChangeTimerId);
this._outPopup&&this._outPopup.un("outside-click");var popup=this._popup;popup&&popup.destruct();this.__base.apply(this,arguments)
},getDefaultParams:function(){return{rows:13,popupMods:{direction:"down"}}}},{live:function(){this.liveBindTo("button","focusin focusout",function(e){if(IS_MSIE&&e.type=="focusout"){return
}this._onFocus(e)}).liveBindTo("button","mousedown",function(e){e.which===1&&(e.preventDefault(),this._onClick(e))
}).liveBindTo("select","change",function(e){this._onSelectChange()});return false}})})(jQuery,BEM);blocks["b-form-select"]=function(selected){function getAttrs(val){var attrs={value:val};
if(val===selected)attrs.selected="selected";return attrs}return{block:"b-form-select",mods:{size:"s",theme:"islands",action:"set-thumbs-style"},content:[{block:"b-form-button",mods:{theme:"islands",size:"normal",arrow:"down"},mix:[{block:"b-form-select",elem:"button"}]},{elem:"select",content:[{elem:"option",attrs:getAttrs(1),content:vb.getLocalizedString("settings.thumbStyle.logosAndTitles")},{elem:"option",attrs:getAttrs(2),content:vb.getLocalizedString("settings.thumbStyle.logosAndScreenshots")},{elem:"option",attrs:getAttrs(3),content:vb.getLocalizedString("settings.thumbStyle.screenshots")}]}]}
};BEM.DOM.decl({block:"b-form-select",modName:"action",modVal:"set-thumbs-style"},{onSetMod:{js:function(){this.__base.apply(this,arguments);
var skip=true;this.on("change",function(){if(skip)return skip=false;switch(parseInt(this.val(),10)){case 1:vb.stat("settings.thumbviewmode.logotitle");
break;case 2:vb.stat("settings.thumbviewmode.logoscreen");break;case 3:vb.stat("settings.thumbviewmode.screen");
break}})}}});(function(){function getBlocker(){return $(".dropdown-blocker").bem("dropdown-blocker")}function getPopup(){return $(".b-form-select__popup.i-popup").bem("i-popup")
}BEM.DOM.decl("dropdown-blocker",{visible:{"":function(){getPopup().hide()}}},{live:function(){BEM.blocks["i-popup"].on("show",function(e){if(e.block.domElem.hasClass("b-form-select__popup")){getBlocker().setMod("visible","yes")
}});BEM.blocks["i-popup"].on("hide",function(e){if(e.block.domElem.hasClass("b-form-select__popup")){getBlocker().delMod("visible")
}});this.liveBindTo("click",function(){this.delMod("visible")})}})})();(function($,BEM,undefined){var KEYDOWN_EVENT=$.browser.opera&&$.browser.version<12.1?"keypress":"keydown",RENDER_THROTTLING=.25,percentsCache=[],valsCache=[];
function dropCache(idx,val,percent,vals){if(Math.abs(percent-percentsCache[idx])<RENDER_THROTTLING)return;
var inc=percent>percentsCache[idx]?1:0,i=0,n=percentsCache.length,next;percentsCache[idx]=percent;if(n===1)return;
do{if(i===idx)continue;next=percentsCache[i];if(inc){if(i>idx){next<percent&&(percentsCache[i]=percent);
val>=vals[i]&&(valsCache[i]=vals[i])}else{percentsCache[i]=val<valsCache[i]?percent:this._calcPercentByValue(valsCache[i])
}}else{if(i<idx){next>percent&&(percentsCache[i]=percent);val<=vals[i]&&(valsCache[i]=vals[i])}else{percentsCache[i]=val>valsCache[i]?percent:this._calcPercentByValue(valsCache[i])
}}}while(++i<n)}BEM.DOM.decl("b-form-slider",{onSetMod:{js:function(){this._setScale();this._setVals();
this.on("change",this._onChange,this)},disabled:function(modName,modVal){this.setMod(this.elem("runner"),modName,modVal)
}},onElemSetMod:{runner:{disabled:function(elem,modName,modVal){var isDisabled=modVal==="yes";isDisabled&&this.delMod(elem,"focused");
elem.attr("tabindex",isDisabled?"-1":"0");this._getInputs()[this._getRunnerIdx(elem)].toggleMod(modName,"yes","",isDisabled)
},focused:{yes:function(elem,modName,value){if(this.isRunnerDisabled(elem)||this.isDisabled())return false;
this.delMod(this.elem("runner"),modName);this.bindToDoc(KEYDOWN_EVENT,function(e){switch(e.keyCode){case 40:case 37:e.preventDefault();
this.prev();break;case 38:case 39:e.preventDefault();this.next();break}});this._interval=this._getIntervalByValue(this._vals[this._getRunnerIdx(elem)]);
elem.focus()},"":function(elem,modName,value,prev){this.unbindFromDoc(KEYDOWN_EVENT);elem.eq(this._activeRunner)&&(this._activeRunner=null)
}}}},_setScale:function(){var scale=this._scale=this.params.scale;scale[0].percent=0;scale.length>1&&(scale[scale.length-1].percent=100)
},_setVals:function(){var _this=this;this._vals=this._getInputs().map(function(block){var v=parseFloat(block.val());
return isNaN(v)?_this.min():v})},_getInputs:function(){return this._inputs||(this._inputs=this.findBlocksInside("b-form-input"))
},_getInputIdx:function(input){return $.inArray(input,this._getInputs())},_getRunnerIdx:function(runner){return this.hasMod(runner,"pos")?this.getMod(runner,"pos")-1:0
},_getActiveRunner:function(){return this._activeRunner||(this._activeRunner=this.elem("runner","focused","yes"))
},_onMouseDown:function(e){e.preventDefault();if(e.type==="mousedown"&&e.which!==1||this.isDisabled()||this.isRunnerDisabled(e.data.domElem))return;
this._getOffsetPointerCoord(e);valsCache=this._vals.slice(0);percentsCache=this._calcPercentsByValue(valsCache);
this.bindToDoc("mousemove touchmove",this._onMouseMove).bindToDoc("mouseup",this._onMouseUp).setMod(e.data.domElem,"focused","yes")
},_onMouseMove:function(e){var idx=this._getRunnerIdx(this._getActiveRunner()),val=this._calcValueByEvent(e);
dropCache.call(this,idx,val,this._calcPercentByValue(this.toAllowedRange(idx,val)),this._vals);this._render(percentsCache);
this._val(idx,Math.round(val))&&this.trigger("change")},_onMouseUp:function(e){this.unbindFromDoc("mousemove touchmove mouseup touchend");
valsCache=[];percentsCache=[];this._render()},_onTrackClick:function(e){if(this.isDisabled())return;var val=this._calcValueByEvent(e),runner=this._getClosestRunnerByValue(val);
if(runner){this.vals(this._getRunnerIdx(runner),val)}},_onChange:function(){var inputs=this._getInputs();
this._vals.forEach(function(val,i){inputs[i].val(val)});return this},_onInputChange:function(e){var idx=this.elem("input").index(e.data.domElem),prev=this._vals[idx],input=this._getInputs()[idx];
this.vals(idx,input.val());prev===this._vals[idx]&&input.val(this._vals[idx])},_val:function(idx,val){val=parseFloat(val);
if(isNaN(val))return true;this._interval=this._getIntervalByValue(val);var step=this._scale[this._interval].step,mod=val%step;
mod&&(val=val-mod+(step-mod>parseFloat((step/2).toFixed())?0:step));val=this.toAllowedRange(idx,parseFloat(val.toFixed(2)));
var i=0,vals=this._vals,n=vals.length,prev=vals[idx],inc,next;if(vals[idx]===val?false:(vals[idx]=val,true)){if(n===1)return true;
inc=prev>val?0:1;do{if(i===idx)continue;next=vals[i];if(inc){i>idx?next<val&&(vals[i]=val):val<=valsCache[i]&&(vals[i]=val)
}else{i<idx?next>val&&(vals[i]=val):val>=valsCache[i]&&(vals[i]=val)}}while(++i<n);return true}return false
},toAllowedRange:function(idx,val){var scale=this._scale,min=scale[0].value,max=scale[scale.length-1].value;
val>max&&(val=max);val<min&&(val=min);return val},val:function(val,data){return this.vals(0,val,data)
},vals:function(idx,val,data){var idxType=typeof idx;if(typeof val==="undefined"){if(idxType!=="object")return idxType==="number"?this._vals[idx]:this._vals;
val=idx}var _this=this,isChanged=false;if($.isArray(val)){if(val.length<this._vals.length)return _this;
this._vals.forEach(function(v,i){_this._val(i,val[i])&&!isChanged&&(isChanged=true)})}else{isChanged=_this._val(idx,val)
}if(isChanged){this._render();this.trigger("change",data)}return this},min:function(min){var params=this.params;
if(typeof min==="undefined")return params.min?params.min:this._scale[0].value;return this.range(min,this.max())
},max:function(max){var params=this.params;if(typeof max==="undefined")return params.max?params.max:this._scale[this._scale.length-1].value;
return this.range(this.min(),max)},range:function(min,max){if(typeof min==="undefined")return[this.min(),this.max()];
min<max||(max=this._scale[this._scale.length-1].value);this.params.min=min;this.params.max=max;this._updateRange();
this._render();return this},prev:function(){var idx=this._getRunnerIdx(this._getActiveRunner());if(typeof idx==="undefined"||!this._vals[idx])return;
var val=this._vals[idx]-this._scale[this._interval].step,interval=this._getIntervalByValue(val);interval<this._interval&&(val=this._vals[idx]-this._scale[interval].step);
return this.vals(idx,val)},next:function(){var idx=this._getRunnerIdx(this._getActiveRunner());if(typeof idx==="undefined"||this._vals[idx]>=this._scale[this._scale.length-1].value)return;
var val=this._vals[idx]+this._scale[this._interval].step,interval=this._getIntervalByValue(val);interval>this._interval&&(val=this._scale[interval].value);
return this.vals(idx,val)},isRunnerDisabled:function(runner){if(typeof runner==="number")runner=this.elem("runner").eq(runner);
return this.hasMod(runner,"disabled")},isDisabled:function(){return this.hasMod("disabled")},getInterval:function(){return this._interval
},getDefaultParams:function(){return{scale:[{percent:0,value:0,step:1,label:""},{percent:100,value:100,step:1,label:""}]}
}},{live:function(){this.liveBindTo("click","leftclick",function(e){this._onTrackClick(e)}).liveBindTo("runner","focusin",function(e){this.setMod($(e.target),"focused","yes")
}).liveBindTo("focusout",function(e){this.delMod(this.elem("runner"),"focused")}).liveBindTo("runner","mousedown touchstart",function(e){this._onMouseDown(e)
}).liveBindTo("input","focusout",function(e){this._onInputChange(e)}).liveBindTo("input","keypress",function(e){e.keyCode===13&&this._onInputChange(e)
});return false}})})(jQuery,BEM);(function(){function getRunnerValue(id){var layouts=cache.get("settings").layouts;
return layouts[id]}BEM.DOM.decl("b-form-slider",{onSetMod:{js:function(){this.__base.apply(this);this._applySettings=$.throttle(this._applySettings,500,this)
}},getVal:function(){var id=flags.get("currentSliderPos");return getRunnerValue(id)},_onMouseUp:function(e){page().delMod("slider-clicked");
var popupa=this.findBlockOutside("b-popupa");if(popupa){this.afterCurrentEvent(function(){popupa.pos()
});popupa.bindToResize()}$(".b-vb-foot").width("100%");$(".b-decor").width("100%");$("html").removeClass("hide-scroll_x");
page().findBlockInside("b-content").domElem.removeAttr("style");this.__base.apply(this,arguments)},_onMouseDown:function(e){var isHorizScroll=$.isHorizontalScroll(),$doc=$(document),docWidth=$doc.width();
if(!isHorizScroll){$("html").addClass("hide-scroll_x")}else{$(".b-vb-foot").width(docWidth);$(".b-decor").width(docWidth)
}page().setMod("slider-clicked","yes");var popupa=this.findBlockOutside("b-popupa");if(popupa){popupa.unbindFromResize()
}var docHeight=$doc.height();page().findBlockInside("b-content").domElem.attr("style","height:"+docHeight+"px"+";");
this.__base.apply(this,arguments)},_onChange:function(){var runner=this.findElem("runner"),id=this._vals[0],val=getRunnerValue(id),splittedVal=val.split("x").map(function(num){return parseInt(num,10)
}),thumbsCount=splittedVal[0]*(splittedVal[1]||1);runner.text(val);flags.set("currentSliderPos",id);page().setStatisticsTimer("numberchange","settings.numberchange."+thumbsCount,5e3);
this._applySettings();this.__base.apply(this,arguments)},_applySettings:function(){page().applySettings(true)
},_setVals:function(){var pos=flags.get("currentSliderPos");this._vals=[pos]},destruct:function(){this.__base.apply(this,arguments);
this._vals=null}});BEM.HTML.decl("b-form-slider",{onElem:{runner:function(ctx){var id=flags.get("currentSliderPos"),val=getRunnerValue(id);
ctx.tag("a").attrs({hideFocus:true}).content(val)}}})})();(function(BEM){var UI_DEVIATION=.2;BEM.DOM.decl("b-form-slider",{onSetMod:{js:function(){this.__base();
this._build();this.hasMod("disabled","yes")&&this.setMod(this.elem("runner"),"disabled","yes");if(typeof this.elem("body")[0].onselectstart!=="undefined")this.elem("body")[0].onselectstart=function(){return false
};this.afterCurrentEvent(function(){this.setMod("animation","yes")})},animation:{yes:function(){return!this._activeRunner
}}},onElemSetMod:{runner:{focused:{yes:function(){if(this.__base.apply(this,arguments)===false)return false;
this.delMod("animation")},"":function(){this.__base.apply(this,arguments);this.setMod("animation","yes")
}}}},_updateOne:function(idx,percent){var st=this._scale,runner=this.elem("runner").eq(idx);st=this._vals[idx]===st[0].value?-1:this._vals[idx]===st[st.length-1].value?1:0;
runner.css(this.__POS_UNIT,percent+"%");this.toggleMod(runner,"state","start","",st<0).toggleMod(runner,"state","end","",st>0)
},_updateRanges:function(percents){var posUnit=this.__POS_UNIT,dimUnit=this.__DIM_UNIT,idx=percents.length,pos,dim=(100-percents[idx-1]-UI_DEVIATION).toFixed(1),ranges=this.elem("range");
function render(range,pos,dim){var css={};css[posUnit]=typeof pos==="undefined"?"auto":pos+"%";css[dimUnit]=(dim>0?dim:0)+"%";
range.css(css)}do{render(ranges.eq(idx--),pos,dim);pos=parseFloat((percents[idx-1]||0).toFixed(1));dim=parseFloat((percents[idx]-pos+UI_DEVIATION).toFixed(1))
}while(idx);render(ranges.eq(0),0,percents[0])},_updateRange:function(){var min=this._calcPercentByValue(this.min()),max=this.max(),css={};
css[this.__POS_UNIT]=min+"%";css[this.__DIM_UNIT]=(max?this._calcPercentByValue(max):100)-min+"%";this.elem("allowed-range").css(css)
},_render:function(percents){var _this=this;percents||(percents=this._calcPercentsByValue(this._vals));
percents.forEach(function(percent,idx){_this._updateOne(idx,percent)});this._updateRanges(percents);return percents
},_buildScale:function(block){var posUnit=this.__POS_UNIT,marks=this._scale.map(function(mark){return{block:block,elem:"mark",mods:{},attrs:{style:posUnit+":"+mark.percent+"%"},content:mark.label||""}
}),hasMarks=0,m=marks.length;while(hasMarks<m&&!marks[hasMarks++].content.length);if(hasMarks<m){marks[0].mods.position="first";
marks[this._scale.length-1].mods.position="last";return{block:block,elem:"scale",content:marks}}},_buildRunner:function(block,pos,percent){var mods={pos:pos},s=this._scale;
pos=pos-1;s=this._vals[pos]===s[0].value?-1:this._vals[pos]===s[s.length-1].value?1:0;s===0||(mods.state=s>0?"end":"start");
return{block:block,elem:"runner",mods:mods,attrs:{tabindex:0,style:this.__POS_UNIT+":"+percent+"%"}}},_buildAllowedRange:function(block){var min=this._calcPercentByValue(this.min()),max=this.max();
return{block:block,elem:"allowed-range",attrs:{style:this.__POS_UNIT+":"+min+"%;"+this.__DIM_UNIT+":"+((max?this._calcPercentByValue(max):100)-min)+"%;"}}
},_build:function(){var _this=this,blockName=this.__self.getName(),posUnit=this.__POS_UNIT,dimUnit=this.__DIM_UNIT,scale=this._buildScale(blockName),percents=this._vals.map(function(val){return _this._calcPercentByValue(val)
}),n=percents.length-1,range=[{block:blockName,elem:"range",mods:{pos:1,position:"first"},attrs:{style:posUnit+":0%;"+dimUnit+":"+percents[0]+"%"}}],runners=[],isCollapsed=false;
percents.forEach(function(percent,i){runners.push(_this._buildRunner(blockName,i+1,percent));range.push({block:blockName,elem:"range",mods:{pos:i+2},attrs:{style:posUnit+":"+(i<n?percent+"%;":"auto;")+dimUnit+":"+((i<n?percents[i+1]+UI_DEVIATION:100)-percent).toFixed(1)+"%"}});
isCollapsed||i&&percent===percents[i-1]&&(isCollapsed=true)});range[range.length-1].mods.position="last";
if(runners.length>1){runners[0].mods.position="first";runners[runners.length-1].mods.position="last"}else{runners[0].mods.pos=null;
delete runners[0].mods.pos}range.push(this._buildAllowedRange(blockName));isCollapsed&&this.setMod("collapsed","yes");
this.domElem.append(BEM.HTML.build(scale));this.elem("body").append(BEM.HTML.build(range.concat(runners)))
}});BEM.HTML.decl("b-form-slider",{onElem:{runner:function(ctx){ctx.tag("a").attrs({hideFocus:true})}}})
})(BEM);(function(BEM,undefined){function calcPercentForInterval(a,b,val){return(b.percent-a.percent)*(val-a.value)/(b.value-a.value)+a.percent
}function calcValueForInterval(a,b,percent){return(b.value-a.value)*(percent-a.percent)/(b.percent-a.percent)+a.value
}BEM.DOM.decl("b-form-slider",{getPointerDirrection:function(){return this._dirrection},getOrientation:function(){return this.__ORIGIN==="Y"?"vert":"hor"
},_getCoordFromEvent:function(e){throw"NOT_IMPLEMENTED"},_getOffsetPointerCoord:function(e){throw"NOT_IMPLEMENTED"
},_getDirrectionFromCoord:function(coord){this._dirrection=coord>(this._dirrectionCoord||0)?1:-1;this._dirrectionCoord=coord;
return this._dirrection},_calcPercentByValue:function(val){var scale=this._scale,it=scale.length>2?this._getIntervalByValue(val):0;
return parseFloat(calcPercentForInterval(scale[it],scale[it+1],val).toFixed(1))},_calcPercentsByValue:function(vals){var t=this;
return vals.map(function(val){return t._calcPercentByValue(val)})},_calcPercentByCoord:function(coord){return parseFloat((coord*100/this.elem("body")[this.__DIM_UNIT]()).toFixed(1))
},_calcValueByPercent:function(percent){var scale=this._scale,it=scale.length>2?this._getIntervalByPercent(percent):0;
return calcValueForInterval(scale[it],scale[it+1],percent)},_calcPercentByEvent:function(e){throw"NOT_IMPLEMENTED"
},_calcValueByEvent:function(e){return this._calcValueByPercent(this._calcPercentByEvent(e))},_getIntervalByValue:function(val){var scale=this._scale,n=scale.length,i=1;
if(val<=scale[0].value)return 0;else if(val>=scale[n-1].value)return n-2;for(i=1;i<n;i++){if(val<scale[i].value)return i-1
}return n-2},_getIntervalByPercent:function(percent){if(percent<=0)return 0;else if(percent>=100)return this._scale.length-2;
var scale=this._scale,n=scale.length,i;for(i=0;i<n;i++){if(percent>=scale[i].percent&&percent<(scale[i+1]?scale[i+1].percent:100))return i
}return n-2},_getClosestRunnerByValue:function(val){var sc=this._scale,distance=sc[sc.length-1].value-sc[0].value,runner;
this._vals.forEach(function(value,i){var valDistance=value-val,absDistance=Math.abs(valDistance),cRunner;
if(absDistance<=distance){if(runner&&absDistance===distance&&valDistance>0)return;distance=absDistance;
cRunner=this.elem("runner").eq(i);this.isRunnerDisabled(cRunner)||(runner=cRunner)}},this);return runner
}})})(BEM);BEM.DOM.decl({block:"b-form-slider",modName:"orientation",modVal:"horiz"},{onSetMod:{js:function(){this.__POS_UNIT="left";
this.__DIM_UNIT="width";this.__ORIGIN="X";this.__base.apply(this,arguments)}},_getCoordFromEvent:function(e){return typeof e.clientX==="number"?e.clientX:e.originalEvent.touches[0].clientX
},_getOffsetPointerCoord:function(e){var runner=e.data.domElem;return this._offsetPointer=this._dirrectionCoord=(this._getCoordFromEvent(e)-runner.offset().left+parseInt(runner.css("margin-left"),10)).toFixed(2)
},_calcPercentByEvent:function(e){var t=this,coord=t._getCoordFromEvent(e);t._getDirrectionFromCoord(coord);
return t._calcPercentByCoord(coord-t.elem("body").offset().left-(t._offsetPointer||0))}});blocks["b-select-theme"]=function(settings){var blocks=require("bem").blocks;
return{block:"b-select-theme",js:true,content:[function(){var bemjson=[],bgImages=settings.bgImages.slice(),sortedBgImages=[];
if(bgImages.length>5){bgImages.forEach(function(image,i){if(i%2===0)sortedBgImages.push(image)});bgImages.forEach(function(image,i){if(i%2===1)sortedBgImages.push(image)
})}else{sortedBgImages=bgImages}sortedBgImages.forEach(function(imageObj,i){var isCurrent=imageObj.id===settings.selectedBgImage,isUser=imageObj.isUser||false;
bemjson.push(blocks["b-select-theme__item"](imageObj.id,imageObj.preview,isCurrent,i+1,isUser))});return bemjson
}()]}};blocks["b-select-theme__item"]=function(url,iconURL,isCurrent,index,isUser){var item={block:"b-select-theme",elem:"item",js:{id:isUser?"user":url},elemMods:{type:"img",index:index,user:isUser?"yes":"no"},attrs:{tabindex:index},content:[{block:"b-select-theme",elem:"select"},{block:"b-select-theme",elem:"glow"},{elem:"loader",mods:{hide:"yes"},content:{block:"b-spin",mods:{progress:"yes",theme:"light",size:"30"}}},iconURL&&{block:"b-icon",mods:{img:"yes"},url:iconURL,width:60,height:60}]};
if(isCurrent){item.elemMods.state="current"}return item};BEM.DOM.decl("b-select-theme",{_step:120,_animationTime:200,_itemWidth:60,_itemHeight:60,_maxCount:5,onSetMod:{js:function(){var _this=this,aleft=this.findElem("arrow","type","left"),aright=this.findElem("arrow","type","right"),box=this.findElem("box"),slider=this.findElem("slider");
aleft.hide();this.bindTo(aright,"click",function(){if(this.hasMod("ignore-arrows"))return;this.setMod("ignore-arrows","yes");
var diff=this._lengthDifference("right"),step=diff===-1?this._step:diff;box.animate({left:"-="+step},_this._animationTime,function(){_this.delMod("ignore-arrows");
_this._checkArrows()})});this.bindTo(aleft,"click",function(){if(this.hasMod("ignore-arrows"))return;
this.setMod("ignore-arrows","yes");var diff=this._lengthDifference("left"),step=diff===-1?this._step:diff;
box.animate({left:"+="+step},_this._animationTime,function(){_this.delMod("ignore-arrows");_this._checkArrows()
})});this._checkPics();this._redraw();this.afterCurrentEvent(function(){this._checkArrows()})}},onElemSetMod:{item:{state:{current:function(elem,modName,modVal,oldVal){this.delMod(this.findElem("item",modName,modVal),modName);
this.setMod(this.findElem("loader"),"hide","yes")},loading:function(elem,modName,modVal,oldVal){this.delMod(this.findElem("item",modName,modVal),modName);
this.setMod(this.findElem("loader"),"hide","yes");this.delMod(elem.find(this.buildSelector("loader")),"hide");
this.afterCurrentEvent(function(){vb.setBackgroundImage(this.elemParams(elem).id)});var id=this.elemParams(elem).id;
vb.stat("settings.bgchange."+(id==="user"?"userown":id))}}}},_calcHorizontalIndexFromStaticIndex:function(staticIndex){var horizontalIndex,count=this.getItemsCount(),maxInRowCount=this._maxCount;
if(count<=maxInRowCount){horizontalIndex=staticIndex}else{var countInFirstRow=Math.round(count/2);if(staticIndex>countInFirstRow){horizontalIndex=staticIndex-countInFirstRow
}else if(staticIndex<=countInFirstRow){horizontalIndex=staticIndex}}return horizontalIndex},_redraw:function(){this._recalcWidth();
this._recalcHeight()},_checkPics:function(){var _this=this;this.findElem("item").each(function(i,item){var $item=$(item);
$item.find(".b-icon_img_yes").error(function(){$item.remove();$item=null;_this._redraw();var $current=_this.findElem("item","state","current"),$first=_this.findElem("item").eq(0),$elemToScroll=$current.length?$current:$first;
_this.afterCurrentEvent(function(){this._checkArrows()})})})},_lengthDifference:function(direction){var box=this.findElem("box");
var slider=this.findElem("slider");var boxPos={left:box.offset().left,right:box.offset().left+box.width()};
var sliderPos={left:slider.offset().left,right:slider.offset().left+slider.width()};if(direction==="right"){if(boxPos[direction]-this._step>sliderPos[direction])return-1;
else return boxPos[direction]-sliderPos[direction]}else{if(boxPos[direction]+this._step<sliderPos[direction])return-1;
else return sliderPos[direction]-boxPos[direction]}},_checkArrows:function(){var aleft=this.findElem("arrow","type","left"),aright=this.findElem("arrow","type","right"),offset=this._calcRelativePos();
if(offset.left<=0)aleft.hide();else aleft.show();if(offset.right>=0)aright.hide();else aright.show()},_calcRelativePos:function(){var box=this.findElem("box");
var slider=this.findElem("slider");var boxPos={left:box.offset().left,right:box.offset().left+box.width()};
var sliderPos={left:slider.offset().left,right:slider.offset().left+slider.width()};return{left:Math.round(sliderPos.left-boxPos.left),right:Math.round(sliderPos.right-boxPos.right)}
},_recalcWidth:function(){var imagesCount=this.getItemsCount(),newWidth;if(imagesCount<=this._maxCount){newWidth=imagesCount*this._itemWidth
}else{newWidth=Math.round(imagesCount/2)*this._itemWidth}this.findElem("box").css("width",newWidth)},_recalcHeight:function(){var imagesCount=this.getItemsCount(),newHeight;
if(imagesCount>this._maxCount)newHeight=this._itemHeight*2;else newHeight=this._itemHeight;this.findElem("slider").css("height",newHeight)
},getItemsCount:function(){return $(this.buildSelector("item")).length},uploadUserBackground:function(){var BEMHTML=require("bemhtml"),_this=this,blocks=require("bem").blocks;
vb.stat("settings.bgupload");vb.uploadUserBackground(function(newImage){if(!newImage)return;vb.setBackgroundImage("user");
vb.stat("settings.bgchange.userown");_this.findElem("item","user","yes").remove();vb.requestSettings(function(settings){var userIndex=0;
page().saveSettings(settings,true);settings.bgImages.some(function(preview,index){if(preview.isUser){userIndex=index;
return true}return false});var html=BEMHTML.apply(blocks["b-select-theme__item"](newImage,newImage,true,userIndex,true));
_this.delMod(_this.findElem("item","state","current"),"state");_this.findElem("item").eq(userIndex-2).after(html);
_this._redraw();_this._scrollToElem(_this.findElem("item","state","current"));_this._checkArrows()})})
},_scrollToElem:function($elem){var index=parseInt(this.getMod($elem,"index"),10),box=this.findElem("box"),horizontalIndex=this._calcHorizontalIndexFromStaticIndex(index),horizontalMax=box.width()/this._itemWidth,scrollToIndex;
if(horizontalIndex<=3){scrollToIndex=1}else if(horizontalIndex+2<=horizontalMax&&horizontalMax-2>0){scrollToIndex=horizontalIndex-2
}else{scrollToIndex=horizontalMax-4}box.css("left",-1*(scrollToIndex-1)*this._itemWidth)},rejectBackground:function(){this.delMod(this.findElem("item","state","loading"),"state");
this.setMod(this.findElem("loader"),"hide","yes")},selectBackground:function(){this.setMod(this.findElem("item","state","loading"),"state","current")
}},{live:function(){this.liveBindTo({elem:"item",modName:"type",modVal:"img"},"focusin click",function(e){var domElem=e.data.domElem,state=this.getMod(domElem,"state"),changed=state!=="current"&&state!=="loading";
changed&&this.setMod(domElem,"state","loading")});return false}});BEM.HTML.decl({name:"b-form-button",modName:"type",modVal:"simple"},{onBlock:function(ctx){ctx.tag(ctx.param("url")?"a":"span").attrs({href:ctx.param("url"),target:ctx.param("target")}).mods({size:ctx.mod("size")||"s",theme:ctx.mod("theme")||ctx.mod("type")+"-grey"}).content({tag:"span",elem:"simple",content:ctx.content()},true).afterContent(ctx.param("type")?{elem:"input",attrs:{value:ctx.param("value")||"",type:ctx.param("type"),name:ctx.param("name"),disabled:ctx.mod("disabled")&&"disabled"}}:{elem:"click"}).js(true).stop()
}});BEM.DOM.decl("b-form-checkbox",{onSetMod:{js:function(){var _this=this,checkboxElem=_this.elem("checkbox");
try{var activeNode=_this.__self.doc[0].activeElement}catch(e){}_this.setMod("checked",checkboxElem.attr("checked")?"yes":"");
activeNode===checkboxElem[0]&&_this.setMod("focused","yes")},focused:{yes:function(){if(this.isDisabled())return false;
this.elem("checkbox").focus()},"":function(){this.elem("checkbox").blur()}},checked:function(modName,modVal){this.elem("checkbox").attr("checked",modVal=="yes");
this.elem("tick").attr("alt",modVal=="yes"?" v":"");this.afterCurrentEvent(function(){this.trigger("change")
})},disabled:function(modName,modVal){this.elem("checkbox").attr("disabled",modVal=="yes")}},isDisabled:function(){return this.hasMod("disabled","yes")
},isChecked:function(){return this.hasMod("checked","yes")},toggle:function(){this.toggleMod("checked","yes","")
},val:function(val){var checkbox=this.elem("checkbox");return val==undefined?checkbox.val():checkbox.val(val)
},_onClick:function(e){if(e.button)return;this.isDisabled()||this.setMod("focused","yes")},_onChange:function(e){e.target.checked?this.setMod("checked","yes"):this.delMod("checked")
}},{live:function(){this.liveBindTo("checkbox","click",function(e){this._onClick(e)}).liveBindTo("checkbox","change",function(e){this._onChange(e)
}).liveBindTo("checkbox","focusin focusout",function(e){this.setMod("focused",e.type=="focusin"?"yes":"")
});return false}});BEM.HTML.decl("b-form-checkbox",{onBlock:function(ctx){var checkboxAttrs=ctx.param("checkboxAttrs")||{};
ctx.js(true).mix(!ctx.mod("size")?[{block:"b-form-checkbox",mods:{size:"m"}}]:"").tag("span").tParam("checkboxAttrs",$.extend(checkboxAttrs||{},{id:ctx.param("id")||checkboxAttrs.id||$.identify(),checked:ctx.mod("checked")?"checked":undefined,disabled:ctx.mod("disabled")?"disabled":undefined})).beforeContent({elem:"inner",content:[{elem:"checkbox",attrs:ctx.tParam("checkboxAttrs")},{elem:"bg"}]})
},onElem:{label:function(ctx){ctx.tag("label").attr("for",ctx.tParam("checkboxAttrs").id)},checkbox:function(ctx){ctx.tag("input").attrs($.extend(ctx.attrs(),{type:"checkbox"}))
},bg:function(ctx){ctx.tag("i").content({elem:"tick"})},tick:function(ctx){ctx.tag("i")},inner:function(ctx){ctx.tag("span")
}}});BEM.DOM.decl({block:"b-form-checkbox",modName:"type",modVal:"islands"},{onSetMod:{js:function(){this.bindTo("leftclick",function(e){this._onClick(e)
}).bindTo("control","change",function(e){this._onChange(e)}).bindTo("control","focusin focusout",function(e){this._onFocusInFocusOut(e)
}).bindTo("mouseover mouseout",function(e){this._onMouseOverMouseOut(e)});this.setMod("checked",this.elem("control").prop("checked")?"yes":"");
this._isControlFocused()&&this.setMod("focused","yes")},focused:{yes:function(){if(this.isDisabled())return false;
this._isControlFocused()||this.elem("control").focus();this.setMod(this.elem("box"),"focused","yes");
this.afterCurrentEvent(function(){this.trigger("focus")})},"":function(){this._isControlFocused()&&this.elem("control").blur();
this.delMod(this.elem("box"),"focused");this.afterCurrentEvent(function(){this.trigger("blur")})}},checked:function(modName,modVal){this.elem("control").prop("checked",modVal==="yes");
this.afterCurrentEvent(function(){this.trigger("change")});this.setMod(this.elem("box"),"checked",modVal)
},disabled:function(modName,modVal){this.elem("control").prop("disabled",modVal==="yes")}},isDisabled:function(){return this.hasMod("disabled","yes")
},isChecked:function(){return this.hasMod("checked","yes")},toggle:function(){this.toggleMod("checked","yes","")
},val:function(val){var checkbox=this.elem("control");if(typeof val==="undefined")return checkbox.val();
checkbox.val(val);return this},_onClick:function(e){if(this.isDisabled())return;if(e.target!==this.elem("control")[0]){e.preventDefault();
this.toggle()}this.setMod("focused","yes")},_onChange:function(e){e.target.checked?this.setMod("checked","yes"):this.delMod("checked")
},_onFocusInFocusOut:function(e){this.setMod("focused",e.type==="focusin"?"yes":"")},_onMouseOverMouseOut:function(e){this.isDisabled()||this.setMod("hovered",e.type==="mouseover"?"yes":"")
},_isControlFocused:function(){try{return this.containsDomElem($(this.__self.doc[0].activeElement))}catch(e){return false
}}});BEM.DOM.decl({block:"b-link",modName:"open",modVal:"apps"},{onSetMod:{js:function(){this.on("click",this._openApps,this)
}},destruct:function(){this.un("click",this._openApps,this);this.__base.apply(this,arguments)},_openApps:function(){vb.stat("panel.apps");
var link=this.domElem;page().findAndDestruct({block:"b-popupa",modName:"type",modVal:"apps"});vb.apps.requestList(function(apps){var blocks=require("bem").blocks,BEMHTML=require("bemhtml"),appsBlock,json=blocks["b-popupa_type_apps"](apps);
BEM.DOM.append(page().domElem,BEMHTML.apply(json));appsBlock=page().findBlockInside({block:"b-popupa",modName:"type",modVal:"apps"});
appsBlock.show(link)});this.un("click",this._openApps,this)},bindClick:function(){this.on("click",this._openApps,this)
}});blocks["b-paranja"]=function(){return{block:"b-paranja",js:true,mods:{hide:cache.get("editingThumb")?"no":"yes"}}
};BEM.DOM.decl("b-paranja",{},{live:function(){this.liveBindTo("click",function(){if(this.hasMod("hide","yes"))return;
var page=this.findBlockOutside("b-page"),setting=page.findBlockInside("b-setting"),modal=page.findBlockInside({block:"popup",modName:"type",modVal:"modal"}),statPopup=page.findBlockInside("stat-popup");
if(statPopup&&statPopup.hasMod("visibility","visible"))return;if(modal)return;setting&&setting.setMod("hide","yes");
this.setMod("hide","yes");channels("dom").emit("paranjaIsHidden")})}});blocks["b-setting"]=function(){var blocks=require("bem").blocks;
return{block:"b-setting",mods:{hide:"yes",arrow:"yes"},js:true,content:[{elem:"tail"},{elem:"wrapper",content:[{elem:"close"},{elem:"content",content:[{block:"b-form-input",mods:{theme:"grey",size:"l",type:"url",autocomplete:"yes","block-request":"yes",autoclosable:"no"},aria:"url",js:{dataprovider:{name:"i-vb-search-history-suggest-dataprovider"},popupMods:{size:"l"}},placeholder:vb.getLocalizedString("settings.urlInput.placeholder"),content:[{elem:"input"}]},{block:"b-form-input",mods:{theme:"grey",size:"l",type:"title"},role:"textbox",aria:"title",placeholder:vb.getLocalizedString("settings.titleInput.placeholder"),content:[{elem:"input"}]},{block:"b-form-button",mods:{theme:"islands",size:"normal",name:"change-thumb-title"},content:vb.getLocalizedString("settings.editTitle")},{block:"radio-button",js:{id:"show_to"},mods:{size:"m",theme:"normal",name:"thumb-suggest-source"},name:"show_to",value:"top-sites",content:[{elem:"radio",controlAttrs:{value:"top-sites",id:"uniq100"},content:vb.getLocalizedString("settings.popularSites")},{elem:"radio",controlAttrs:{value:"last-visited",id:"uniq101"},content:vb.getLocalizedString("settings.lastVisited")}]},blocks["b-tumbs-lib"]()]}]}]}
};BEM.DOM.decl("b-setting",{_paranja:null,_inputUrl:null,_inputTitle:null,parsedUrl:null,_url:null,droppedTitle:false,titleManuallyChanged:false,onSetMod:{js:function(){this._inputUrl=this.findBlockInside({block:"b-form-input",modName:"type",modVal:"url"});
this._inputTitle=this.findBlockInside({block:"b-form-input",modName:"type",modVal:"title"});this.findParanja();
this.bindTo("close","click",function(){this.setMod("hide","yes")});this.parsedUrl="";this._inputTitle.setMod("hide","yes");
this.bindToDoc("keyup",function(e){if(e.keyCode==27){var popup=this._inputUrl.getPopup();if(popup.hasMod("visibility","visible")){popup.hide()
}else{this.setMod("hide","yes")}}});this.findBlockOutside("b-page").findBlockInside({block:"b-popupa",modName:"type",modVal:"properties"}).hide();
channels("api").on("action",this._onAction,this);this._inputUrl.on("change",this._onInputUrlChange,this)
},hide:{"":function(){var _this=this,bFormInput=this.findBlockInside({blockName:"b-form-input",modName:"type",modVal:"url"}),bFormInputTitle=this.findBlockInside({blockName:"b-form-input",modName:"type",modVal:"title"});
page().setMod("width","big");var changeTitleButton=this.findBlockInside({block:"b-form-button",modName:"name",modVal:"change-thumb-title"});
changeTitleButton.domElem.show();bFormInputTitle.setMod("hide","yes");changeTitleButton.bindTo("click",function(){bFormInputTitle.delMod("hide");
changeTitleButton.domElem.hide()});this.bindToDoc("keydown",function(e){if(e.keyCode==27)e.preventDefault();
if(e.keyCode==13){if(this.getMod("action")==="add"){var hoveredSuggestItem=bFormInput._getPopup().findBlockInside({blockName:"b-autocomplete-item",modName:"hovered",modVal:"yes"});
if(hoveredSuggestItem){var index=parseInt(hoveredSuggestItem.getMod("index"),10)+1;this._submit("thumb.adddone.suggest."+index)
}else{this._submit("thumb.adddone.text")}}else{this._submit()}}});this._url=this._inputUrl&&this._inputUrl.val()||"";
this.droppedTitle=false;this.titleManuallyChanged=false;this.parsedUrl=require("parseURL")(this._url);
this._inputUrl.setMod("block-request","yes");this.afterCurrentEvent(function(){var bPage=_this.findBlockOutside("b-page");
$(bFormInput.domElem).find("input").select();$("html, body").scrollTop(_this.domElem.offset().top-80);
_this._paranja.delMod("hide")});this.positionTail();page().findBlockInside("b-tumb").__self.getEmptyThumbs().forEach(function(thumb){thumb.setMod("show-border","yes")
});channels("dom").emit("thumbSettingsShown")},yes:function(){var bPage=page(),thumbs=bPage.findBlockInside("b-tumbs");
if(cache.get("settings").x<5){page().delMod("width")}bPage.findBlocksInside("b-tumb").forEach(function(thumb){thumb.delMod("state")
});thumbs.delMod(thumbs.findElem("item","editing","yes"),"editing");thumbs.findBlockInside({block:"b-tumb",modName:"editing",modVal:"yes"}).delMod("editing");
this._inputUrl.domElem.find("input").blur();if(vb.navigator==="ie"){this._inputTitle.domElem.find("input").blur()
}this._paranja.setMod("hide","yes");this.unbindFromDoc("keydown");this._inputUrl.getPopup().hide();var editingThumb=cache.get("editingThumb");
delete editingThumb.data;cache.set("editingThumb",editingThumb);cache.reset("editingThumb");page().findBlockInside("b-tumb").startDnD().__self.getEmptyThumbs().forEach(function(thumb){thumb.delMod("show-border")
});this.findBlockInside("radio-button").val("top-sites");channels("dom").emit("thumbSettingsHidden");
this.findBlockInside("b-tumbs-lib").drawThumbsByData(0,null,new Array(10))}}},destruct:function(){this._inputUrl.un("change",this._onInputUrlChange,this);
this._paranja=null;this._inputUrl=null;this._inputTitle=null;this.parsedUrl=null;this._url=null;channels("api").off("action",this._onAction);
this.__base.apply(this,arguments)},findParanja:function(){this._paranja=this.findBlockOutside("b-page").findBlockInside("b-paranja")
},positionTail:function(){var tail=this.findElem("tail"),editingThumb=this.findBlockOutside("b-page").findBlockInside({block:"b-tumb",modName:"editing",modVal:"yes"});
if(!editingThumb||!editingThumb.domElem)return;var $editingThumb=editingThumb.domElem,position=$editingThumb.offset(),height=parseInt($editingThumb.height(),10),width=parseInt($editingThumb.width(),10);
this.domElem.css("top",Math.round(position.top+height)+"px");tail.css("left",Math.round(position.left-14+width/2)+"px")
},_onAction:function(e){if(e.type==="openSettings"||e.type==="removeThumb")this.setMod("hide","yes")},_onInputUrlChange:function(e){var url=this._inputUrl&&this._inputUrl.val()||"";
if(!url.trim()){this._inputTitle.val("")}},_submit:function(statparam){var url=this.findBlockInside({block:"b-form-input",modName:"type",modVal:"url"}).val().trim(),title=this.findBlockInside({block:"b-form-input",modName:"type",modVal:"title"}).val(),newItem={pinned:true,url:url,title:title||""};
this.submitThumb(statparam,newItem)},submitThumb:function(statparam,newItem){var BEM=require("bem").BEM,BEMHTML=require("bemhtml"),blocks=require("bem").blocks,bPage=page(),thumbs=cache.get("thumbs"),bThumb=bPage.findBlockInside({block:"b-tumb",modName:"editing",modVal:"yes"}),index=parseInt(bThumb.getMod("index"),10);
var invalidURL=/^:|\s/.test(newItem.url);if(invalidURL||!newItem.url){this.setMod("hide","yes");return
}if(this._url===newItem.url){newItem=$.extend({},bThumb.params.item,{pinned:true,title:newItem.title||"",url:newItem.url})
}BEM.DOM.update(bThumb.domElem.parent(),BEMHTML.apply(blocks["b-tumb"](newItem,index,bThumb.domElem.width())));
thumbs[index]=$.extend({},newItem);this.setMod("hide","yes");vb.saveThumb(index,{title:thumbs[index].title,url:thumbs[index].url});
if(this.getMod("action")==="add"){vb.stat(statparam)}else{if(bThumb.params.item.url!==newItem.url||bThumb.params.item.title!==newItem.title)vb.stat("thumb.setdone")
}cache.set("thumbs",thumbs)}});blocks["b-tumbs-lib"]=function(){var rows=[],Lib=require("lib"),size=200,blocks=require("bem").blocks,z=0;
for(var i=0;i<2;i++){var items=[];for(var j=0;j<5;j++){items.push({elem:"item",content:blocks["b-tumb"](null,z,size,true)});
z++}rows.push({elem:"row",content:items})}return{block:"b-tumbs-lib",js:true,content:[{elem:"arrow",elemMods:{type:"left",state:"disabled"},mix:[{block:"i-action",elem:"more-tumbs-left"}]},{elem:"arrow",elemMods:{type:"right"},mix:[{block:"i-action",elem:"more-tumbs-right"}]},{elem:"wrap",content:{elem:"content",content:rows}}]}
};BEM.DOM.decl("b-tumbs-lib",{_defaultSuggestMode:"top-sites",onSetMod:{js:function(){var self=this,radio=this._radio=this.findBlockOutside("b-setting").findBlockInside("radio-button");
radio.on("change",function(e,data){self._mode=radio.val();self.drawThumbsByOffset(0,self._mode)});channels("api").on("historyThumbChanged",this._onHistoryThumbChanged,this);
channels("dom").on("thumbSettingsShown",this._onSettingsShown,this);channels("dom").on("thumbSettingsHidden",this._onSettingHidden,this)
}},destruct:function(){var BEM=require("bem").BEM;channels("api").off("historyThumbChanged",this._onHistoryThumbChanged);
channels("dom").off("thumbSettingsShown",this._onSettingsShown);channels("dom").off("thumbSettingsHidden",this._onSettingHidden);
this.__base.apply(this,arguments)},_onSettingHidden:function(){this._radio.val(this._defaultSuggestMode);
this._mode=this._defaultSuggestMode},_onSettingsShown:function(){this._radio.val(this._defaultSuggestMode);
this._mode=this._defaultSuggestMode;this.drawThumbsByOffset(0)},drawThumbsByOffset:function(offset,newMode){newMode=newMode||this._mode;
var _this=this;vb[this._mode==="top-sites"?"requestPopularSites":"requestLastVisited"](offset,function(items){_this.drawThumbsByData(offset,newMode,items)
})},drawThumbsByData:function(offset,newMode,items){newMode=newMode||this._mode;var Lib=require("lib"),BEM=require("bem").BEM,blocks=require("bem").blocks,BEMHTML=require("bemhtml"),elems=this.findElem("item"),blockRightArrow=items.length<11,z=0,rows=[];
for(var i=0;i<2;i++){var thumbs=[];for(var j=0;j<5;j++){if(!items[z]||!items[z].url){items[z]=null;blockRightArrow=true
}thumbs.push({elem:"item",content:blocks["b-tumb"](items[z],i,200,true)});z++}rows.push({elem:"row",content:thumbs})
}var html=BEMHTML.apply({block:"b-tumbs-lib",elem:"content",content:rows});var prevOffset=this.getMod("offset");
this._prevMode=this._prevMode||this._defaultSuggestMode;var animatedTransition=false;prevOffset=prevOffset||0;
if(newMode===this._prevMode&&prevOffset!==offset){prevOffset=parseInt(prevOffset,10);animatedTransition=true
}this._prevMode=newMode;var leftArrow=this.findElem("arrow","type","left"),rightArrow=this.findElem("arrow","type","right");
this.setMod(leftArrow,"state","disabled");this.setMod(rightArrow,"state","disabled");this._appendContainerHTML(html,animatedTransition,prevOffset<offset?"left":"right",function(){this.setMod("offset",offset);
if(offset>0){this.delMod(leftArrow,"state")}else{this.setMod(leftArrow,"state","disabled")}if(blockRightArrow){this.setMod(rightArrow,"state","disabled")
}else{this.delMod(rightArrow,"state")}setTimeout(function(){BEM.DOM.init()},0)}.bind(this))},_appendContainerHTML:function(html,animatedTransition,direction,callback){var content=this.findElem("content");
if(!animatedTransition){content.replaceWith(html);callback()}else{var BEMHTML=require("bemhtml"),animationContainer=$(BEMHTML.apply({block:"b-tumbs-lib",elem:"animation-container"})),wrap=this.elem("wrap"),THUMBS_MARGIN=20,contentWidth=content.width()+THUMBS_MARGIN,$html=$(html);
animationContainer.appendTo(wrap);animationContainer.css({position:"absolute",left:direction==="left"?0:-contentWidth});
content.appendTo(animationContainer);$html.css({left:direction==="left"?contentWidth:0});content.css({left:direction==="left"?0:contentWidth});
$html.appendTo(animationContainer);animationContainer.animate({left:direction==="left"?-contentWidth:0},500,function(){$html.appendTo(wrap);
$html.css("left",0);BEM.DOM.destruct(animationContainer);callback()})}},_onHistoryThumbChanged:function(item){var self=this,thumbs=this.findBlocksInside("b-tumb").filter(function(thumb){if(thumb.params.item.url===item.url)return true
});if(!thumbs.length)return;var blocks=require("bem").blocks,BEM=require("bem").BEM,BEMHTML=require("bemhtml"),Lib=require("lib"),size=Lib.getSuggestedThumbSize(),thumb=thumbs[0],BEMJSON=blocks["b-tumb"](item,thumb.getMod("index"),size,true);
BEM.DOM.update(thumb.domElem.parent(),BEMHTML.apply(BEMJSON))}});(function(BEM,undefined){BEM.DOM.decl("radiobox",{onSetMod:{js:function(){var _this=this;
_this._val=_this.findElem(_this.elem("radio","checked","yes"),"control").val();_this.elem("control").each(function(i,control){var mods=[];
if(_this._isControlFocused($(control))){mods.push("focused")}if(control.checked){mods.push("checked")
}if(mods[0]){var radio=_this.__self._getRadioByElem($(control));mods.forEach(function(modName){_this.setMod(radio,modName,"yes")
})}})},disabled:{yes:function(){this.setMod(this.elem("radio"),"disabled","yes")},"":function(){this.delMod(this.elem("radio"),"disabled")
}}},onElemSetMod:{radio:{focused:{yes:function(elem){this.delMod(this.elem("radio","focused","yes"),"focused");
var control=this.findElem(elem,"control");this._isControlFocused(control)||control.focus();this.afterCurrentEvent(function(){this.trigger("focus",{current:elem})
})},"":function(elem){this.afterCurrentEvent(function(){this.trigger("blur",{prev:elem})})}},checked:{yes:function(elem){this._val=this.findElem(elem,"control").prop("checked",true).val();
var prev=this.elem("radio","checked","yes");this.delMod(prev,"checked");this.trigger("change",{current:elem,prev:prev})
}},hovered:function(elem){return!this.isDisabled(elem)},disabled:function(elem,modName,modVal){elem.find(this.buildSelector("control")).prop("disabled",modVal==="yes")
}}},_isControlFocused:function(control){try{return control[0]===this.__self.doc[0].activeElement}catch(e){return false
}},isDisabled:function(radio){return this.hasMod(radio,"disabled","yes")},val:function(val){if(typeof val==="undefined"){return this._val
}var _this=this;this.elem("control").each(function(i,control){if(control.value===val){_this.setMod(_this.__self._getRadioByElem($(control)),"checked","yes");
return false}});return _this},name:function(val){var control=this.elem("control");if(!arguments.length){return control.attr("name")
}control.attr("name",val);return this},getCurrent:function(){return this.findElem("radio","checked","yes")
},uncheckAll:function(){var prevRadio=this.elem("radio","checked","yes");this.delMod(prevRadio,"checked").findElem(prevRadio,"control").prop("checked",false);
this._val=undefined;this.trigger("change",{current:undefined,prev:prevRadio});return this},_onLeftClick:function(e){this.isDisabled(e.data.domElem)||this.setMod(e.data.domElem,"focused","yes")
},_onChange:function(e){this.setMod(this.__self._getRadioByElem(e.data.domElem),"checked","yes")}},{live:function(){this.liveBindTo("radio","leftclick tap",function(e){this._onLeftClick(e)
}).liveBindTo("control","change",function(e){this._onChange(e)}).liveBindTo("radio","mouseover mouseout",function(e){this.setMod(e.data.domElem,"hovered",e.type==="mouseover"?"yes":"")
}).liveBindTo("control","focusin focusout",function(e){this.setMod(this.__self._getRadioByElem(e.data.domElem),"focused",e.type==="focusin"?"yes":"")
});return false},_getRadioByElem:function(elem){return elem.closest(this.buildSelector("radio"))}})})(BEM);
(function(BEM,undefined){BEM.DOM.decl({block:"radio-button",baseBlock:"radiobox"},{onElemSetMod:{radio:{checked:function(elem,modName,modVal){this.__base.apply(this,arguments);
this.setMod(elem,"pressed",modVal)},"next-for-pressed":{yes:function(){this.delMod(this.elem("radio","next-for-pressed","yes"),"next-for-pressed")
}},pressed:{yes:function(elem){this.delMod(this.elem("radio"),"pressed").setMod(elem.next(),"next-for-pressed","yes")
},"":function(elem){this.delMod(elem.next(),"next-for-pressed")}}}},_onMouseDown:function(e){var radio=e.data.domElem;
if(this.isDisabled(radio)||this.hasMod(radio,"checked","yes")){return}this.setMod(radio,"pressed","yes");
this.bindToDoc("mouseup touchend",function(e){this.afterCurrentEvent(function(){var control=this.findElem(radio,"control");
if(!control.prop("checked")){if(radio.find(e.target).add(radio).length){control.trigger("change").focus()
}else{this.delMod(radio,"pressed").setMod(this.elem("radio","checked","yes"),"pressed","yes")}}});this.unbindFromDoc("mouseup touchend")
})}},{live:function(){this.__base.apply(this,arguments);this.liveBindTo("radio","mousedown",function(e){this._onMouseDown(e)
});return false}})})(BEM);(function(undefined){BEM.DOM.decl({block:"b-form-input",modName:"type",modVal:"url"},{onSetMod:{js:function(){this.on("select",this._onAutocompleteSelect,this);
this.__base.apply(this,arguments)}},destruct:function(){this.un("select",this._onAutocompleteSelect,this);
this.__base.apply(this,arguments)},_onAutocompleteSelect:function(e,data){var block=e.block,bSetting=block.findBlockOutside("b-setting"),bTitle=bSetting.findBlockInside({block:"b-form-input",modName:"type",modVal:"title"});
block.val(data.item.params.url);if(bTitle){bTitle.val(data.item.params.title)}return true}})})();(function(undefined){BEM.DOM.decl({block:"b-form-input",modName:"type",modVal:"title"},{onSetMod:{js:function(){this.on("change",this._onChange,this);
this.__base.apply(this,arguments)},focused:function(){this.findBlockOutside("b-setting").findBlockInside({block:"b-form-input",modName:"type",modVal:"url"}).delMod("focused");
this.__base.apply(this,arguments)}},_onChange:function(){var self=this,bSetting=self.findBlockOutside("b-setting");
bSetting.titleManuallyChanged=true}})})();return{BEM:BEM,blocks:blocks}},parseURL:function(require){var cache={};
function parseURL(url){if(cache[url])return cache[url];var a=document.createElement("a");a.href=url;var res;
try{res={source:url,protocol:a.protocol.replace(":",""),host:a.hostname,port:a.port,query:a.search,params:function(){var ret={},seg=a.search.replace(/^\?/,"").split("&"),len=seg.length,i=0,s;
for(;i<len;i++){if(!seg[i]){continue}s=seg[i].split("=");ret[s[0]]=s[1]}return ret}(),file:(a.pathname.match(/\/([^\/?#]+)$/i)||[,""])[1],hash:a.hash.replace("#",""),path:a.pathname.replace(/^([^\/])/,"/$1"),relative:(a.href.match(/tp:\/\/[^\/]+(.+)/)||[,""])[1],segments:a.pathname.replace(/^\//,"").split("/")}
}catch(e){res=url}cache[url]=res;return res}return parseURL},scroll:function(require,exports,module){$.fn.hasScroll=function(){return this.get(0)?this.get(0).scrollHeight>this.innerHeight():false
};$.pageHasVerticalScroll=function(){return $(document).height()>$(window).height()};$.isHorizontalScroll=function(){var $doc=$(document),scrollLeft=$doc.scrollLeft();
if(scrollLeft>0)return true;$doc.scrollLeft(1);if($doc.scrollLeft()>0)return true;$doc.scrollLeft(0);
return false}},modals:function(require){function removeTabIndexes(){$("*").each(function(i,elem){var $elem=$(elem),attr=$elem.attr("tabIndex");
if(attr){$elem.attr("tabIndex","-1").data("oldIndex",attr)}else{$elem.attr("tabIndex","-1")}})}function recoverTabIndexes(){$("[tabIndex]").removeAttr("tabIndex");
$("[oldIndex]").each(function(i,elem){var $elem=$(elem);$elem.attr("tabIndex",$elem.attr("oldIndex"))
})}var modals={showModal:function(name,text,handler){removeTabIndexes();this.hideModals();var blocks=require("bem").blocks,BEMHTML=require("bemhtml"),bemjson=blocks["popup_type_modal"](name,text),html=BEMHTML.apply(bemjson);
BEM.DOM.append($(".b-content"),html);var popup=$(".popup_type_modal").bem("popup");popup.show();$(".b-paranja").bem("b-paranja").delMod("hide");
popup.addListener(handler)},confirm:function(text,handler){this.showModal("confirm",text||null,function(res){recoverTabIndexes();
handler&&handler(res)})},alert:function(text,handler){this.showModal("alert",text||null,function(){recoverTabIndexes();
handler&&handler()})},hideModals:function(){BEM.DOM.destruct($(".popup_type_modal"));$(".b-paranja").bem("b-paranja").setMod("hide","yes")
}};return modals},preloader:function(require){var preloader={load:function(){load([].slice.call(arguments))
}};var container;function load(bemjson){var html=require("bemhtml").apply(bemjson);container=container||$("<div>").css({position:"absolute",left:"-9999px",top:"-9999px",opacity:"0"}).html(html).appendTo($(document.body));
var imagesToLoad=[];container.find("*").each(function(i,elem){var $elem=$(elem),rule=$elem.css("backgroundImage");
$elem.show();if(rule&&rule!=="none"&&/url/.test(rule)){var url=/url\("?'?([^"\s]+)"?'?\)/.exec(rule)[1];
if(url)imagesToLoad.push(url)}});var imagesCount=imagesToLoad.length;imagesToLoad.forEach(function(url){$("<img>").attr("src",url).appendTo(container).load(function(){imagesCount--;
if(imagesCount<=0){container.remove();container=null}})})}return preloader},cache:function(require,exports,module){function Cache(){this._storage={}
}Cache.prototype={set:function(key,value){channels("cache").emit(key,[value,this._storage[key]],true);
this._storage[key]=value},get:function(key){return this._storage[key]},reset:function(key,dontEmit){var prevVal=this._storage[key];
delete this._storage[key];if(!dontEmit){channels("cache").emit(key,[undefined,prevVal],true)}}};exports.Cache=Cache
},channels:function(require,exports,module){(function(){var listeners={};function Channel(name){this.name=name
}Channel.prototype={constructor:Channel,emit:function(eventName,data,applyData){var handlers=listeners[this.name];
if(handlers&&handlers[eventName]){handlers[eventName].forEach(function(handlerData){handlerData.callback[applyData?"apply":"call"](handlerData.ctx,data)
})}},on:function(eventName,callback,ctx){listeners[this.name]=listeners[this.name]||{};listeners[this.name][eventName]=listeners[this.name][eventName]||[];
listeners[this.name][eventName].push({callback:callback,ctx:ctx||{}})},off:function(eventName,callback){listeners[this.name]=listeners[this.name]||{};
var eventListeners=listeners[this.name][eventName]=listeners[this.name][eventName]||[];var indexes=[];
eventListeners.forEach(function(listenerData,i){if(listenerData.callback===callback){indexes.push(i)}});
var removedCount=0;indexes.forEach(function(index){index-=removedCount;eventListeners.splice(index,1);
removedCount++},this)}};window.channels=function(name){if(!name)throw new Error("Name of channel should be provided");
return new Channel(name)}})()},utils:function(require,exports,module){function isSameObjects(obj1,obj2){if(typeof obj1==="object"&&typeof obj2==="object"){if(obj1===null||obj2===null){return obj1===obj2
}for(var key in obj1){if(typeof obj1[key]==="object"&&typeof obj2[key]==="object"){if(!isSameObjects(obj1[key],obj2[key]))return false
}else{if(obj1[key]!==obj2[key])return false}}return Object.keys(obj1).length===Object.keys(obj2).length
}else{return obj1===obj2}}exports.isSameObjects=isSameObjects}},{},{});