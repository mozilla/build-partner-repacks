"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.ExtensionSpecifics = PROTO.Message("sync_pb.ExtensionSpecifics", {
    id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    update_url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 4
    },
    incognito_enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 5
    },
    name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 6
    }
});
