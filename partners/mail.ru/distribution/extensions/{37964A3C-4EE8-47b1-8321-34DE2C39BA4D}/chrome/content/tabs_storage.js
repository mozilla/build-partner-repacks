function TabsStorage() {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
    file.append("MRSputnikData"); 
    if( !file.exists() || !file.isDirectory() ) {
       file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
    }
    file.append("MailRuTabs.sqlite");
    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                   .getService(Components.interfaces.mozIStorageService);
    this.mDBConn = storageService.openDatabase(file);
    
}
TabsStorage.prototype.onCreate = function() {
    this.mDBConn.createTable("tabs", "id integer primary key autoincrement, url TEXT, title TEXT, scrin TEXT, ico TEXT, public integer, position integer, date_upd TIMESTAMP");
    this.defaultValue();
}

TabsStorage.prototype.insert = function(url, title, scrin, ico, view, position) {
    if(!this.mDBConn.tableExists("tabs")){
        this.onCreate();
    }
    try {
        this.mDBConn.executeSimpleSQL("UPDATE tabs SET public=0 WHERE position="+position+"");
    } catch(e) {}
    //Поиск похожую урл и ставим посишен текущий
    //Если статус публик тогда копируем 
    var insertDate = new Date();
    this.mDBConn.executeSimpleSQL("INSERT INTO tabs (url, title, scrin, ico, public, position, date_upd) VALUES ('"+url+"', '"+title+"', '"+scrin+"', '"+ico+"',"+view+","+position+", '"+insertDate.getTime()+"')");
}

TabsStorage.prototype.update = function(jsonValue, jsonWhere) {
    if(!this.mDBConn.tableExists("tabs")){
        this.onCreate();
    }
    var insertDate = new Date();
    var strQ = "UPDATE tabs SET ";
    for(var key in jsonValue) {
        strQ += key+"="+jsonValue[key]+", ";
    }
    strQ += "date_upd='"+insertDate.getTime()+"' ";
    
    if(jsonWhere != null){
        strQ += " WHERE ";
        for(var key in jsonWhere) {
            strQ += key+"="+jsonWhere[key];
        }
    }
    
    this.mDBConn.executeSimpleSQL(strQ);
}

TabsStorage.prototype.defaultValue = function () {
    for(var i = 0; i < 3; i++){
        this.insert(defaultValue[i].url, defaultValue[i].title, defaultValue[i].scrin, defaultValue[i].ico, 1, i);
    }
}



TabsStorage.prototype.getTabs = function() {
    var result = new Array();
    if(!this.mDBConn.tableExists("tabs")){
        this.onCreate();
    }
    var statement = this.mDBConn.createStatement("SELECT * FROM tabs where public = 1 ORDER BY position");
    while (statement.step()) {
        result[statement.row["position"]] = {
            'id' : statement.row["id"], 
            'url' : statement.row["url"], 
            'title' : statement.row["title"], 
            'scrin' : statement.row["scrin"], 
            'ico' : statement.row["ico"], 
            'date_upd' : statement.row["date_upd"]
        };
    }
    return result;
}

TabsStorage.prototype.searchUrl = function(url) {
    var result = "";
    if(!this.mDBConn.tableExists("tabs")){
        this.onCreate();
    }
    var insertDate = new Date();
    insertDate = insertDate.getTime() - 1000*60*60*24*7;
    var statement = this.mDBConn.createStatement("SELECT * FROM tabs where url = '"+url+"' and date_upd > '"+insertDate+"' limit 1");
    while (statement.step()) {
        result = {
            'id': statement.row["id"], 
            'url': statement.row["url"], 
            'title': statement.row["title"], 
            'scrin': statement.row["scrin"], 
            'ico': statement.row["ico"], 
            'public': statement.row["public"]
        };
    }
    return result;
}

TabsStorage.prototype.rowUnpublic = function(position) {
    if(!this.mDBConn.tableExists("tabs")){
        this.onCreate();
    }
    this.mDBConn.executeSimpleSQL("UPDATE tabs SET public=0 WHERE position="+position+"");
}

