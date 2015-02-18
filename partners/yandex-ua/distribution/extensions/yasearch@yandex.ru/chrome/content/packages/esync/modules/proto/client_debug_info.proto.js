"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.TypeHint = PROTO.Message("sync_pb.TypeHint", {
    data_type_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    has_valid_hint: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    }
});
sync_pb.SourceInfo = PROTO.Message("sync_pb.SourceInfo", {
    source: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesCallerInfo.GetUpdatesSource;
        },
        id: 1
    },
    type_hint: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.TypeHint;
        },
        id: 2
    }
});
sync_pb.SyncCycleCompletedEventInfo = PROTO.Message("sync_pb.SyncCycleCompletedEventInfo", {
    num_blocking_conflicts: {
        options: { deprecated: true },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    num_non_blocking_conflicts: {
        options: { deprecated: true },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 3
    },
    num_encryption_conflicts: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    },
    num_hierarchy_conflicts: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 5
    },
    num_simple_conflicts: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 6
    },
    num_server_conflicts: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 7
    },
    num_updates_downloaded: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 8
    },
    num_reflected_updates_downloaded: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 9
    },
    caller_info: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GetUpdatesCallerInfo;
        },
        id: 10
    },
    source_info: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.SourceInfo;
        },
        id: 11
    }
});
sync_pb.DatatypeAssociationStats = PROTO.Message("sync_pb.DatatypeAssociationStats", {
    data_type_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    num_local_items_before_association: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    num_sync_items_before_association: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 3
    },
    num_local_items_after_association: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    },
    num_sync_items_after_association: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 5
    },
    num_local_items_added: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 6
    },
    num_local_items_deleted: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 7
    },
    num_local_items_modified: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 8
    },
    num_sync_items_added: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 9
    },
    num_sync_items_deleted: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 10
    },
    num_sync_items_modified: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 11
    },
    had_error: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 12
    }
});
sync_pb.DebugEventInfo = PROTO.Message("sync_pb.DebugEventInfo", {
    SingletonEventType: PROTO.Enum("sync_pb.DebugEventInfo.SingletonEventType", {
        CONNECTION_STATUS_CHANGE: 1,
        UPDATED_TOKEN: 2,
        PASSPHRASE_REQUIRED: 3,
        PASSPHRASE_ACCEPTED: 4,
        INITIALIZATION_COMPLETE: 5,
        STOP_SYNCING_PERMANENTLY: 6,
        ENCRYPTION_COMPLETE: 7,
        ACTIONABLE_ERROR: 8,
        ENCRYPTED_TYPES_CHANGED: 9,
        PASSPHRASE_TYPE_CHANGED: 10,
        KEYSTORE_TOKEN_UPDATED: 11,
        CONFIGURE_COMPLETE: 12,
        BOOTSTRAP_TOKEN_UPDATED: 13
    }),
    singleton_event: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.DebugEventInfo.SingletonEventType;
        },
        id: 1
    },
    sync_cycle_completed_event_info: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncCycleCompletedEventInfo;
        },
        id: 2
    },
    nudging_datatype: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 3
    },
    datatypes_notified_from_server: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    },
    datatype_association_stats: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.DatatypeAssociationStats;
        },
        id: 5
    }
});
sync_pb.DebugInfo = PROTO.Message("sync_pb.DebugInfo", {
    events: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.DebugEventInfo;
        },
        id: 1
    },
    cryptographer_ready: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    },
    cryptographer_has_pending_keys: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 3
    },
    events_dropped: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 4
    }
});
