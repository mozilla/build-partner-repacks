"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.ProfilingData = PROTO.Message("sync_pb.ProfilingData", {
    meta_data_write_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 1
    },
    file_data_write_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 2
    },
    user_lookup_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 3
    },
    meta_data_read_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    file_data_read_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 5
    },
    total_request_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 6
    }
});
sync_pb.EntitySpecifics = PROTO.Message("sync_pb.EntitySpecifics", {
    encrypted: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.EncryptedData;
        },
        id: 1
    },
    autofill: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AutofillSpecifics;
        },
        id: 31729
    },
    bookmark: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.BookmarkSpecifics;
        },
        id: 32904
    },
    preference: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.PreferenceSpecifics;
        },
        id: 37702
    },
    typed_url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.TypedUrlSpecifics;
        },
        id: 40781
    },
    theme: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ThemeSpecifics;
        },
        id: 41210
    },
    app_notification: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AppNotification;
        },
        id: 45184
    },
    password: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.PasswordSpecifics;
        },
        id: 45873
    },
    nigori: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.NigoriSpecifics;
        },
        id: 47745
    },
    extension: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ExtensionSpecifics;
        },
        id: 48119
    },
    app: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AppSpecifics;
        },
        id: 48364
    },
    session: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SessionSpecifics;
        },
        id: 50119
    },
    autofill_profile: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AutofillProfileSpecifics;
        },
        id: 63951
    },
    search_engine: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SearchEngineSpecifics;
        },
        id: 88610
    },
    extension_setting: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ExtensionSettingSpecifics;
        },
        id: 96159
    },
    app_setting: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AppSettingSpecifics;
        },
        id: 103656
    },
    history_delete_directive: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.HistoryDeleteDirectiveSpecifics;
        },
        id: 150251
    },
    device_info: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.DeviceInfoSpecifics;
        },
        id: 154522
    },
    experiments: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ExperimentsSpecifics;
        },
        id: 161496
    },
    history_segment: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.HistorySegmentSpecifics;
        },
        id: 161497
    },
    yandex_elements: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.YandexElementsSpecifics;
        },
        id: 194891
    },
    yandex_global_setting: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.YandexGlobalSettingSpecifics;
        },
        id: 195560
    }
});
sync_pb.SyncEntity = PROTO.Message("sync_pb.SyncEntity", {
    id_string: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    parent_id_string: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    old_parent_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    version: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    mtime: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 5
    },
    ctime: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 6
    },
    name: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.string;
        },
        id: 7
    },
    non_unique_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 8
    },
    sync_timestamp: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 9
    },
    server_defined_unique_tag: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 10
    },
    BookmarkData: PROTO.Group("sync_pb.SyncEntity.BookmarkData", 11, PROTO.optional, {
        bookmark_folder: {
            options: {},
            multiplicity: PROTO.required,
            type: function () {
                return PROTO.bool;
            },
            id: 12
        },
        bookmark_url: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 13
        },
        bookmark_favicon: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.bytes;
            },
            id: 14
        }
    }),
    position_in_parent: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 15
    },
    insert_after_item_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 16
    },
    deleted: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 18
    },
    originator_cache_guid: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 19
    },
    originator_client_item_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 20
    },
    specifics: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.EntitySpecifics;
        },
        id: 21
    },
    folder: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 22
    },
    client_defined_unique_tag: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 23
    },
    ordinal_in_parent: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 24
    },
    unique_position: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.UniquePosition;
        },
        id: 25
    }
});
sync_pb.ChromiumExtensionsActivity = PROTO.Message("sync_pb.ChromiumExtensionsActivity", {
    extension_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    bookmark_writes_since_last_commit: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.uint32;
        },
        id: 2
    }
});
sync_pb.ClientConfigParams = PROTO.Message("sync_pb.ClientConfigParams", {
    enabled_type_ids: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    tabs_datatype_enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    }
});
sync_pb.CommitMessage = PROTO.Message("sync_pb.CommitMessage", {
    entries: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.SyncEntity;
        },
        id: 1
    },
    cache_guid: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    extensions_activity: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.ChromiumExtensionsActivity;
        },
        id: 3
    },
    config_params: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ClientConfigParams;
        },
        id: 4
    }
});
sync_pb.GetUpdateTriggers = PROTO.Message("sync_pb.GetUpdateTriggers", {
    notification_hint: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    client_dropped_hints: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    },
    invalidations_out_of_sync: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 3
    },
    local_modification_nudges: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    datatype_refresh_nudges: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 5
    }
});
sync_pb.DataTypeProgressMarker = PROTO.Message("sync_pb.DataTypeProgressMarker", {
    data_type_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    token: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    timestamp_token_for_migration: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 3
    },
    notification_hint: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    },
    get_update_triggers: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdateTriggers;
        },
        id: 5
    }
});
sync_pb.GetUpdatesMessage = PROTO.Message("sync_pb.GetUpdatesMessage", {
    from_timestamp: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 1
    },
    caller_info: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesCallerInfo;
        },
        id: 2
    },
    fetch_folders: {
        options: {
            get default_value() {
                return true;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 3
    },
    requested_types: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.EntitySpecifics;
        },
        id: 4
    },
    batch_size: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 5
    },
    from_progress_marker: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.DataTypeProgressMarker;
        },
        id: 6
    },
    streaming: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 7
    },
    need_encryption_key: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 8
    },
    create_mobile_bookmarks_folder: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1000
    },
    create_tablet_bookmarks_folder: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1001
    },
    get_updates_origin: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncEnums.GetUpdatesOrigin;
        },
        id: 9
    }
});
sync_pb.AuthenticateMessage = PROTO.Message("sync_pb.AuthenticateMessage", {
    auth_token: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.string;
        },
        id: 1
    }
});
sync_pb.ChipBag = PROTO.Message("sync_pb.ChipBag", {
    server_chips: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 1
    }
});
sync_pb.ClientStatus = PROTO.Message("sync_pb.ClientStatus", {
    hierarchy_conflict_detected: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    }
});
sync_pb.ClientToServerMessage = PROTO.Message("sync_pb.ClientToServerMessage", {
    share: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    protocol_version: {
        options: {
            get default_value() {
                return 31;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    Contents: PROTO.Enum("sync_pb.ClientToServerMessage.Contents", {
        COMMIT: 1,
        GET_UPDATES: 2,
        AUTHENTICATE: 3,
        CLEAR_DATA: 4
    }),
    message_contents: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return sync_pb.ClientToServerMessage.Contents;
        },
        id: 3
    },
    commit: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.CommitMessage;
        },
        id: 4
    },
    get_updates: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesMessage;
        },
        id: 5
    },
    authenticate: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AuthenticateMessage;
        },
        id: 6
    },
    store_birthday: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 7
    },
    sync_problem_detected: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 8
    },
    debug_info: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.DebugInfo;
        },
        id: 10
    },
    bag_of_chips: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ChipBag;
        },
        id: 11
    },
    api_key: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 12
    },
    client_status: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ClientStatus;
        },
        id: 13
    },
    invalidator_client_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 14
    }
});
sync_pb.CommitResponse = PROTO.Message("sync_pb.CommitResponse", {
    ResponseType: PROTO.Enum("sync_pb.CommitResponse.ResponseType", {
        SUCCESS: 1,
        CONFLICT: 2,
        RETRY: 3,
        INVALID_MESSAGE: 4,
        OVER_QUOTA: 5,
        TRANSIENT_ERROR: 6
    }),
    EntryResponse: PROTO.Group("sync_pb.CommitResponse.EntryResponse", 1, PROTO.repeated, {
        response_type: {
            options: {},
            multiplicity: PROTO.required,
            type: function () {
                return sync_pb.CommitResponse.ResponseType;
            },
            id: 2
        },
        id_string: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 3
        },
        parent_id_string: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 4
        },
        position_in_parent: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.int64;
            },
            id: 5
        },
        version: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.int64;
            },
            id: 6
        },
        name: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 7
        },
        non_unique_name: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 8
        },
        error_message: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 9
        },
        mtime: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.int64;
            },
            id: 10
        }
    })
});
sync_pb.GetUpdatesResponse = PROTO.Message("sync_pb.GetUpdatesResponse", {
    entries: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.SyncEntity;
        },
        id: 1
    },
    new_timestamp: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 2
    },
    deprecated_newest_timestamp: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 3
    },
    changes_remaining: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    new_progress_marker: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.DataTypeProgressMarker;
        },
        id: 5
    },
    encryption_keys: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.bytes;
        },
        id: 6
    }
});
sync_pb.GetUpdatesMetadataResponse = PROTO.Message("sync_pb.GetUpdatesMetadataResponse", {
    changes_remaining: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 1
    },
    new_progress_marker: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.DataTypeProgressMarker;
        },
        id: 2
    }
});
sync_pb.GetUpdatesStreamingResponse = PROTO.Message("sync_pb.GetUpdatesStreamingResponse", {
    entries: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.SyncEntity;
        },
        id: 1
    }
});
sync_pb.UserIdentification = PROTO.Message("sync_pb.UserIdentification", {
    email: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    display_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    obfuscated_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    }
});
sync_pb.AuthenticateResponse = PROTO.Message("sync_pb.AuthenticateResponse", {
    user: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.UserIdentification;
        },
        id: 1
    }
});
sync_pb.ThrottleParameters = PROTO.Message("sync_pb.ThrottleParameters", {
    min_measure_payload_size: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    target_utilization: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.Double;
        },
        id: 2
    },
    measure_interval_max: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.Double;
        },
        id: 3
    },
    measure_interval_min: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.Double;
        },
        id: 4
    },
    observation_window: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.Double;
        },
        id: 5
    }
});
sync_pb.ClientToServerResponse = PROTO.Message("sync_pb.ClientToServerResponse", {
    commit: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.CommitResponse;
        },
        id: 1
    },
    get_updates: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesResponse;
        },
        id: 2
    },
    authenticate: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AuthenticateResponse;
        },
        id: 3
    },
    error_code: {
        options: {
            get default_value() {
                return sync_pb.SyncEnums.ErrorType.UNKNOWN;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncEnums.ErrorType;
        },
        id: 4
    },
    error_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    },
    store_birthday: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 6
    },
    client_command: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ClientCommand;
        },
        id: 7
    },
    profiling_data: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ProfilingData;
        },
        id: 8
    },
    stream_metadata: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesMetadataResponse;
        },
        id: 10
    },
    stream_data: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesStreamingResponse;
        },
        id: 11
    },
    migrated_data_type_id: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int32;
        },
        id: 12
    },
    Error: PROTO.Message("sync_pb.ClientToServerResponse.Error", {
        error_type: {
            options: {
                get default_value() {
                    return sync_pb.SyncEnums.ErrorType.UNKNOWN;
                }
            },
            multiplicity: PROTO.optional,
            type: function () {
                return sync_pb.SyncEnums.ErrorType;
            },
            id: 1
        },
        error_description: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 2
        },
        url: {
            options: {},
            multiplicity: PROTO.optional,
            type: function () {
                return PROTO.string;
            },
            id: 3
        },
        action: {
            options: {
                get default_value() {
                    return sync_pb.SyncEnums.Action.UNKNOWN_ACTION;
                }
            },
            multiplicity: PROTO.optional,
            type: function () {
                return sync_pb.SyncEnums.Action;
            },
            id: 4
        },
        error_data_type_ids: {
            options: {},
            multiplicity: PROTO.repeated,
            type: function () {
                return PROTO.int32;
            },
            id: 5
        }
    }),
    error: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ClientToServerResponse.Error;
        },
        id: 13
    },
    new_bag_of_chips: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ChipBag;
        },
        id: 14
    }
});
