"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.PasswordSpecificsData = PROTO.Message("sync_pb.PasswordSpecificsData", {
    scheme: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    signon_realm: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    origin: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    action: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    },
    username_element: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    },
    username_value: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 6
    },
    password_element: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 7
    },
    password_value: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 8
    },
    ssl_valid: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 9
    },
    preferred: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 10
    },
    date_created: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 11
    },
    blacklisted: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 12
    }
});
sync_pb.PasswordSpecifics = PROTO.Message("sync_pb.PasswordSpecifics", {
    encrypted: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.EncryptedData;
        },
        id: 1
    }
});
