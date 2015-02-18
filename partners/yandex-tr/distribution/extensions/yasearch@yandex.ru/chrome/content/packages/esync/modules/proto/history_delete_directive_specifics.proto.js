"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.HistoryDeleteDirectiveSpecifics = PROTO.Message("sync_pb.HistoryDeleteDirectiveSpecifics", {
    global_id_directive: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.GlobalIdDirective;
        },
        id: 1
    },
    time_range_directive: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.TimeRangeDirective;
        },
        id: 2
    }
});
sync_pb.GlobalIdDirective = PROTO.Message("sync_pb.GlobalIdDirective", {
    global_id: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int64;
        },
        id: 1
    }
});
sync_pb.TimeRangeDirective = PROTO.Message("sync_pb.TimeRangeDirective", {
    start_time_usec: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 1
    },
    end_time_usec: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 2
    }
});
