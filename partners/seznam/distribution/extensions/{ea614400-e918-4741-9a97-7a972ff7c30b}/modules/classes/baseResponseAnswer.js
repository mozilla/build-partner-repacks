var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.BaseResponseAnswer = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : 'FoxcubService.BaseResponseAnswer',
	VERSION : '0.1',
	CLASS : 'class'
});

FoxcubService.BaseResponseAnswer.prototype.$constructor = function(data,node){
	this.setData(data,node);
};

FoxcubService.BaseResponseAnswer.prototype.setData = function(data,node){
	this._data = data;
	if(node){
		this._node = node;
	} else {
		this._node = data;
	}
};

FoxcubService.BaseResponseAnswer.prototype.parse = function(path){
	var out = [];
	var resolver = this._data.createNSResolver(this._node.ownerDocument == null ? this._node.documentElement : this._node.ownerDocument.documentElement);
	var mrk = this._data.evaluate(path,this._node,resolver,0, null);
	var x;
	while(x = mrk.iterateNext()){
		out.push(x);
	}
	return out;
}

