let EXPORTED_SYMBOLS = ["STORAGE_QUERIES"];
let STORAGE_QUERIES = {
    INIT_ENGINE_TABLE: [
        "CREATE TABLE IF NOT EXISTS Passwords ( ",
        "id_string VARCHAR PRIMARY KEY, ",
        "parent_id_string VARCHAR, ",
        "originator_cache_guid VARCHAR, ",
        "version INTEGER, ",
        "ctime DATETIME, ",
        "folder BOOLEAN, ",
        "key_name TEXT, ",
        "blob BLOB, ",
        "browser_id TEXT ",
        ");"
    ].join(""),
    INSERT_DATA: [
        "INSERT OR REPLACE INTO Passwords (",
        "id_string, ",
        "parent_id_string, ",
        "originator_cache_guid, ",
        "version, ",
        "ctime, ",
        "folder, ",
        "key_name, ",
        "blob, ",
        "browser_id ",
        ") VALUES (",
        ":id_string, ",
        ":parent_id_string, ",
        ":originator_cache_guid, ",
        ":version, ",
        ":ctime, ",
        ":folder, ",
        ":key_name, ",
        ":blob, ",
        ":browser_id ",
        ");"
    ].join("")
};
