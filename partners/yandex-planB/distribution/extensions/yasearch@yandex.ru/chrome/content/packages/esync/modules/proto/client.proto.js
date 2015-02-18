"use strict";
var ipc_invalidation;
if (typeof ipc_invalidation == "undefined") {
    ipc_invalidation = {};
}
ipc_invalidation.AckHandleP = PROTO.Message("ipc_invalidation.AckHandleP", {
    invalidation: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InvalidationP;
        },
        id: 1
    }
});
ipc_invalidation.PersistentTiclState = PROTO.Message("ipc_invalidation.PersistentTiclState", {
    client_token: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 1
    },
    last_message_send_time_ms: {
        options: {
            get default_value() {
                return 0;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 2
    }
});
ipc_invalidation.PersistentStateBlob = PROTO.Message("ipc_invalidation.PersistentStateBlob", {
    ticl_state: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.PersistentTiclState;
        },
        id: 1
    },
    authentication_code: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    }
});
ipc_invalidation.RunStateP = PROTO.Message("ipc_invalidation.RunStateP", {
    State: PROTO.Enum("ipc_invalidation.RunStateP.State", {
        NOT_STARTED: 1,
        STARTED: 2,
        STOPPED: 3
    }),
    state: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RunStateP.State;
        },
        id: 1
    }
});
