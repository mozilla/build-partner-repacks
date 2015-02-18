"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.UnknownFieldsTestA = PROTO.Message("sync_pb.UnknownFieldsTestA", {
    foo: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    }
});
sync_pb.UnknownFieldsTestB = PROTO.Message("sync_pb.UnknownFieldsTestB", {
    foo: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    },
    bar: {
        options: {},
        multiplicity: PROTO.required,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    }
});
