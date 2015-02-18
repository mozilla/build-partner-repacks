"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.AutofillProfileSpecifics = PROTO.Message("sync_pb.AutofillProfileSpecifics", {
    label: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    guid: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 15
    },
    name_first: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    name_middle: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    name_last: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.string;
        },
        id: 4
    },
    email_address: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.string;
        },
        id: 5
    },
    company_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 6
    },
    address_home_line1: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 7
    },
    address_home_line2: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 8
    },
    address_home_city: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 9
    },
    address_home_state: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 10
    },
    address_home_zip: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 11
    },
    address_home_country: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 12
    },
    phone_home_whole_number: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.string;
        },
        id: 13
    },
    phone_fax_whole_number: {
        options: { deprecated: true },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 14
    }
});
sync_pb.AutofillSpecifics = PROTO.Message("sync_pb.AutofillSpecifics", {
    name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    value: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    usage_timestamp: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int64;
        },
        id: 3
    },
    profile: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AutofillProfileSpecifics;
        },
        id: 4
    }
});
