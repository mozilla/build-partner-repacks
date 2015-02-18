"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.DeviceInfoSpecifics = PROTO.Message("sync_pb.DeviceInfoSpecifics", {
    cache_guid: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    client_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    device_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncEnums.DeviceType;
        },
        id: 3
    },
    sync_user_agent: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    },
    chrome_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    }
});
