"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.AppNotificationSettings = PROTO.Message("sync_pb.AppNotificationSettings", {
    initial_setup_done: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    },
    disabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    },
    oauth_client_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    }
});
sync_pb.AppSpecifics = PROTO.Message("sync_pb.AppSpecifics", {
    extension: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ExtensionSpecifics;
        },
        id: 1
    },
    notification_settings: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AppNotificationSettings;
        },
        id: 2
    },
    app_launch_ordinal: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    page_ordinal: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    }
});
