"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.AppSettingSpecifics = PROTO.Message("sync_pb.AppSettingSpecifics", {
    extension_setting: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.ExtensionSettingSpecifics;
        },
        id: 1
    }
});
