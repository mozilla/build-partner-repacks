"use strict";
var ipc_invalidation;
if (typeof ipc_invalidation == "undefined") {
    ipc_invalidation = {};
}
ipc_invalidation.ClientGatewayMessage = PROTO.Message("ipc_invalidation.ClientGatewayMessage", {
    is_client_to_server: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 1
    },
    service_context: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    rpc_scheduling_hash: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 3
    },
    network_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 4
    }
});
