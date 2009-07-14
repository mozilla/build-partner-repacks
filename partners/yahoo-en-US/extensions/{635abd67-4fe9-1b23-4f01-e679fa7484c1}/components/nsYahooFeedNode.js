/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
/*
   Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
*/
/**
* Represents a single node in the Yahoo! toolbar feed.
* @class
*/
function YahooFeedNode(){
    /*
    REVIEW NOTE:  PUT EVERYTHING IN PROTOTYPE
    */
    this.ICON_URL = "http:\/\/us.i1.yimg.com/us.yimg.com/i/tb/iconsgif/";
    this.SKIN_URL = "chrome:\/\/ytoolbar/skin/";
    this.BUTTON_TYPE = 0x02;
    this.BUTTONMENU_TYPE = 0x04;
    this.DIALOG_TYPE = 0x08;
    this.EDITBOX_TYPE = 0x07;
    this.MENU_TYPE = 0x03;
    this.MENUITEM_TYPE = 0x16;
    this.SEPARATOR_TYPE = 0x17;
    this.PARAM_TYPE = 0x06;
    this.VALUE_TYPE = 0x09;
    this.id = null;
    this.name = null;
    this.value = null;
    this.type = 0;
    this.func = null;
    this.funcNum = -1;
    this.funcUrl = "";
    this.funcTracking = -1;
    this.hash = "";
    this.icon = null;
    this.styles = "";
    this.childSize = 0;
    this.childNodes = null;
    this.parentNode = null;
    this.domToolbar = null;
    this.domMenubar = null;
    this.mIdFull = null;
    this.iconPath = null;
    /**
    * Add child node
    * @param {nsIYahooFeedNode} node Node to add to child list
    */
    this.addChild = function (node){
        node.parentNode = this;
        if(this.childSize === 0){
            this.childNodes = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
        }
        this.childNodes.appendElement(node, false);
        this.childSize++;
    };
    /**
    * Get a child node
    * @param {int} index The index of the child node to get
    * @return {nsIYahooFeedNode}
    */
    this.getChild = function(index){
        return (index < this.childSize) ? this.childNodes.queryElementAt(index, Components.interfaces.nsIYahooFeedNode) : null;
    };  
    /**
    * Returns the child with the specified id.
    * This method will recusively search through all of it's children.
    * @param {String} id The id to search for
    * @return {nsIYahooFeedNode} The node with that id or null
    */
    this.getNodeById = function(id){
        if(this.id == id){
            return this;
        }
        if(this.childSize > 0){
            var node;
            for(var i = 0; i < this.childSize; i++){
                if ((node = this.getChild(i).getNodeById(id))) {
                    return node;
                }
            }
        }
        return null;
    };
    /**
    * Destroy this node and all of it's children
    */
    this.destroy = function(){
        // REVIEW NOTE: try a build without dowing this
        if (this.childNodes) {
            for(var i = 0; i < this.childSize; i++){
                this.getChild(i).destroy();
            }
            this.childSize = 0;
            this.childNodes.clear();
        }
        this.domMenubar = null;
        this.domToolbar = null;
        this.parentNode = null;
        this.childNodes = null;
        this.hash = null;
    };
    /**
    * Split up the function string into the function properties ({@link #funcNum}, {@link #funcUrl}, {@link #funcTracking}).
    * This <b>MUST</b> be called before you can access those properties.
    * @deprecated This logic is now handled up front
    */
    this.formatFunction = function(){
    };
}
YahooFeedNode.prototype = {
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(Components.interfaces.nsIYahooFeedNode) && !iid.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }        
        return this;
    }
};
/* DO NOT CHANGE ANYTHING BELOW */
function NSGetModule(compMgr, fileSpec) {
    return {
        myCID       : Components.ID("{AFF842C7-8EDB-404f-9443-5DE5C96F1B25}"),
        myProgID    : "@yahoo.com/feed/node;1",
        firstTime   : true,
        registerSelf : function (compMgr, fileSpec, location, type) {
            if (this.firstTime) {
                this.firstTime = false;
                throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
            }
            compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
            compMgr.registerFactoryLocation(this.myCID, "Yahoo! Feed Node", this.myProgID, fileSpec, location, type);
        },
        getClassObject : function (compMgr, cid, iid) {
            if (!cid.equals(this.myCID)) {
                throw Components.results.NS_ERROR_NO_INTERFACE;
            }
            if (!iid.equals(Components.interfaces.nsIFactory)) {
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
            }
            return this.myFactory;
        },
        myFactory : {
            createInstance : function (outer, iid) {
                if (outer !== null) {
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                }
                return new YahooFeedNode().QueryInterface(iid);
            }
        },
        canUnload : function(compMgr) { return true; }
    };
}
