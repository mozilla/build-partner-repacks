function Storage() {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
    file.append("MRSputnikData"); 
    if( !file.exists() || !file.isDirectory() ) {
       file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
    }
    file.append("MailRuSputnik.sqlite");
    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                   .getService(Components.interfaces.mozIStorageService);
    this.mDBConn = storageService.openDatabase(file);
    
}
Storage.prototype.onCreate = function() {
    this.mDBConn.createTable("search_url", "id integer primary key autoincrement, url text, date_insert TIMESTAMP");
}

Storage.prototype.insert = function(url, date_insert) {
    if(!this.mDBConn.tableExists("search_url")){
        this.onCreate();
    }
    this.mDBConn.executeSimpleSQL("INSERT INTO search_url (url, date_insert) VALUES('" + md5(url) + "', '"+date_insert+"')");
}

Storage.prototype.getRow = function(url) {
    var result = "";
    if(!this.mDBConn.tableExists("search_url")){
        this.onCreate();
    }
    var statement = this.mDBConn.createStatement("SELECT * FROM search_url where url = '" + md5(url) + "'");
    if(statement.step()) {
        result = {
            'id': statement.row["id"], 
            'url': statement.row["url"], 
            'date_insert': statement.row["date_insert"]
        };
    }
    return result;
}

Storage.prototype.rowDelete = function(id) {
    if(!this.mDBConn.tableExists("search_url")){
        this.onCreate();
    }
    this.mDBConn.executeSimpleSQL("DELETE FROM search_url WHERE id = " + id + "");
}


