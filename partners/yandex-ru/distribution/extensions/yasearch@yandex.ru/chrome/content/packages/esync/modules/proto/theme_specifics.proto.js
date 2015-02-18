"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.ThemeSpecifics = PROTO.Message("sync_pb.ThemeSpecifics", {
    use_custom_theme: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    },
    use_system_theme_by_default: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    },
    custom_theme_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    custom_theme_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    },
    custom_theme_update_url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    }
});
