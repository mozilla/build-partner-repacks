"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.EncryptedData = PROTO.Message("sync_pb.EncryptedData", {
    key_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    blob: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    }
});
