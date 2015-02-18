"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.GetUpdatesCallerInfo = PROTO.Message("sync_pb.GetUpdatesCallerInfo", {
    GetUpdatesSource: PROTO.Enum("sync_pb.GetUpdatesCallerInfo.GetUpdatesSource", {
        UNKNOWN: 0,
        FIRST_UPDATE: 1,
        LOCAL: 2,
        NOTIFICATION: 3,
        PERIODIC: 4,
        SYNC_CYCLE_CONTINUATION: 5,
        NEWLY_SUPPORTED_DATATYPE: 7,
        MIGRATION: 8,
        NEW_CLIENT: 9,
        RECONFIGURATION: 10,
        DATATYPE_REFRESH: 11
    }),
    source: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return sync_pb.GetUpdatesCallerInfo.GetUpdatesSource;
        },
        id: 1
    },
    notifications_enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    }
});
