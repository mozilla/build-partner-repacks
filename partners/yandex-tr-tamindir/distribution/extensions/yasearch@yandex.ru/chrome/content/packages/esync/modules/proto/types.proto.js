"use strict";
var ipc_invalidation;
if (typeof ipc_invalidation == "undefined") {
    ipc_invalidation = {};
}
ipc_invalidation.ClientType = PROTO.Message("ipc_invalidation.ClientType", {
    Type: PROTO.Enum("ipc_invalidation.ClientType.Type", {
        INTERNAL: 1,
        TEST: 2,
        DEMO: 4,
        CHROME_SYNC: 1004,
        CHROME_SYNC_ANDROID: 1018
    }),
    type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ClientType.Type;
        },
        id: 1
    }
});
ipc_invalidation.ObjectSource = PROTO.Message("ipc_invalidation.ObjectSource", {
    Type: PROTO.Enum("ipc_invalidation.ObjectSource.Type", {
        INTERNAL: 1,
        TEST: 2,
        DEMO: 4,
        CHROME_SYNC: 1004,
        COSMO_CHANGELOG: 1014,
        CHROME_COMPONENTS: 1025,
        CHROME_PUSH_MESSAGING: 1030
    }),
    type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ObjectSource.Type;
        },
        id: 1
    }
});
ipc_invalidation.Constants = PROTO.Message("ipc_invalidation.Constants", { ObjectVersion: PROTO.Enum("ipc_invalidation.Constants.ObjectVersion", { UNKNOWN: 0 }) });
