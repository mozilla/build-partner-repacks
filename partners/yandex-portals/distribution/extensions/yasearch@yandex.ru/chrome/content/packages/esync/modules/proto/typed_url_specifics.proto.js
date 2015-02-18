"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.TypedUrlSpecifics = PROTO.Message("sync_pb.TypedUrlSpecifics", {
    url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    title: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    hidden: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 4
    },
    visits: {
        options: { packed: true },
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int64;
        },
        id: 7
    },
    visit_transitions: {
        options: { packed: true },
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int32;
        },
        id: 8
    }
});
