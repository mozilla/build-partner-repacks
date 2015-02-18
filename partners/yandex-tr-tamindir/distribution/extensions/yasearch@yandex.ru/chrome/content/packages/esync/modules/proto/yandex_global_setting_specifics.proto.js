"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.YandexGlobalSettingSpecifics = PROTO.Message("sync_pb.YandexGlobalSettingSpecifics", {
    SubsystemIds: PROTO.Enum("sync_pb.YandexGlobalSettingSpecifics.SubsystemIds", {
        TABLO_PINNED: 1,
        TABLO_PINNED_PHONE: 2
    }),
    subsystem_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.YandexGlobalSettingSpecifics.SubsystemIds;
        },
        id: 1
    },
    key: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    value: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    device_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncEnums.DeviceType;
        },
        id: 4
    }
});
