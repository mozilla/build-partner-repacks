"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.KeystoreEncryptionFlags = PROTO.Message("sync_pb.KeystoreEncryptionFlags", {
    enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    }
});
sync_pb.HistoryDeleteDirectives = PROTO.Message("sync_pb.HistoryDeleteDirectives", {
    enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    }
});
sync_pb.AutofillCullingFlags = PROTO.Message("sync_pb.AutofillCullingFlags", {
    enabled: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    }
});
sync_pb.ExperimentsSpecifics = PROTO.Message("sync_pb.ExperimentsSpecifics", {
    keystore_encryption: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.KeystoreEncryptionFlags;
        },
        id: 1
    },
    history_delete_directives: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.HistoryDeleteDirectives;
        },
        id: 2
    },
    autofill_culling: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.AutofillCullingFlags;
        },
        id: 3
    }
});
