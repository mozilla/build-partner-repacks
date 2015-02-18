let EXPORTED_SYMBOLS = ["STORAGE_QUERIES"];
let STORAGE_QUERIES = {
    INIT_ENGINE_TABLE: [
        "CREATE TABLE IF NOT EXISTS Nigori (",
        "id_string TEXT, ",
        "parent_id_string TEXT, ",
        "originator_cache_guid VARCHAR, ",
        "version INTEGER, ",
        "ctime DATETIME, ",
        "folder BOOLEAN, ",
        "key_name TEXT PRIMARY KEY, ",
        "user_key TEXT, ",
        "encryption_key TEXT, ",
        "mac_key TEXT ",
        ");"
    ].join(""),
    INSERT_DATA: [
        "INSERT OR REPLACE INTO Nigori (",
        "id_string, ",
        "parent_id_string, ",
        "originator_cache_guid, ",
        "version, ",
        "ctime, ",
        "folder, ",
        "key_name, ",
        "user_key, ",
        "encryption_key, ",
        "mac_key ",
        ") VALUES ( ",
        ":id_string, ",
        ":parent_id_string, ",
        ":originator_cache_guid, ",
        ":version, ",
        ":ctime, ",
        ":folder, ",
        ":key_name, ",
        ":user_key, ",
        ":encryption_key, ",
        ":mac_key ",
        ");"
    ].join(""),
    DROP_ENGINE_TABLE: "DROP TABLE IF EXISTS Nigori;"
};
