"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.UniquePosition = PROTO.Message("sync_pb.UniquePosition", {
    value: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 1
    },
    compressed_value: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    uncompressed_length: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.uint64;
        },
        id: 3
    },
    custom_compressed_v1: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 4
    }
});
