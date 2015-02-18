"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.ClientCommand = PROTO.Message("sync_pb.ClientCommand", {
    set_sync_poll_interval: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    set_sync_long_poll_interval: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    max_commit_batch_size: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 3
    },
    sessions_commit_delay_seconds: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    },
    throttle_delay_seconds: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 5
    }
});
