"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.BookmarkSpecifics = PROTO.Message("sync_pb.BookmarkSpecifics", {
    url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    favicon: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    title: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    creation_time_us: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    icon_url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    },
    yandex_client_tag: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 176291
    }
});
