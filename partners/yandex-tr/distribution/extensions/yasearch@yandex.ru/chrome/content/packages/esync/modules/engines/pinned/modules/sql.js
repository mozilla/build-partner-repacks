let EXPORTED_SYMBOLS = ["STORAGE_QUERIES"];
let STORAGE_QUERIES = {
    INIT_ENGINE_TABLE: [
        "CREATE TABLE IF NOT EXISTS Pinned ( ",
        "id_string VARCHAR PRIMARY KEY, ",
        "parent_id_string VARCHAR, ",
        "originator_cache_guid VARCHAR, ",
        "version INTEGER, ",
        "key VARCHAR, ",
        "value TEXT, ",
        "folder INTEGER ",
        ");"
    ].join(""),
    INSERT_DATA: [
        "INSERT OR REPLACE INTO Pinned (",
        "id_string, ",
        "parent_id_string, ",
        "originator_cache_guid, ",
        "version, ",
        "key, ",
        "value, ",
        "folder ",
        ") VALUES (",
        ":id_string, ",
        ":parent_id_string, ",
        ":originator_cache_guid, ",
        ":version, ",
        ":key, ",
        ":value, ",
        ":folder ",
        ");"
    ].join("")
};
