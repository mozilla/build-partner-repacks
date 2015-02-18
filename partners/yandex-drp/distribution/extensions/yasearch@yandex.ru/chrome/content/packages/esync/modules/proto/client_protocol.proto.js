"use strict";
var ipc_invalidation;
if (typeof ipc_invalidation == "undefined") {
    ipc_invalidation = {};
}
ipc_invalidation.Version = PROTO.Message("ipc_invalidation.Version", {
    major_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    minor_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    }
});
ipc_invalidation.ProtocolVersion = PROTO.Message("ipc_invalidation.ProtocolVersion", {
    version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.Version;
        },
        id: 1
    }
});
ipc_invalidation.ClientVersion = PROTO.Message("ipc_invalidation.ClientVersion", {
    version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.Version;
        },
        id: 1
    },
    platform: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    language: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    application_info: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    }
});
ipc_invalidation.StatusP = PROTO.Message("ipc_invalidation.StatusP", {
    Code: PROTO.Enum("ipc_invalidation.StatusP.Code", {
        SUCCESS: 1,
        TRANSIENT_FAILURE: 2,
        PERMANENT_FAILURE: 3
    }),
    code: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.StatusP.Code;
        },
        id: 1
    },
    description: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    }
});
ipc_invalidation.ObjectIdP = PROTO.Message("ipc_invalidation.ObjectIdP", {
    source: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    }
});
ipc_invalidation.ApplicationClientIdP = PROTO.Message("ipc_invalidation.ApplicationClientIdP", {
    client_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    client_name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    }
});
ipc_invalidation.InvalidationP = PROTO.Message("ipc_invalidation.InvalidationP", {
    object_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ObjectIdP;
        },
        id: 1
    },
    is_known_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    },
    version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 3
    },
    is_trickle_restart: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 6
    },
    payload: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 4
    },
    bridge_arrival_time_ms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 5
    }
});
ipc_invalidation.RegistrationP = PROTO.Message("ipc_invalidation.RegistrationP", {
    OpType: PROTO.Enum("ipc_invalidation.RegistrationP.OpType", {
        REGISTER: 1,
        UNREGISTER: 2
    }),
    object_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ObjectIdP;
        },
        id: 1
    },
    op_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationP.OpType;
        },
        id: 2
    }
});
ipc_invalidation.RegistrationSummary = PROTO.Message("ipc_invalidation.RegistrationSummary", {
    num_registrations: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    registration_digest: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    }
});
ipc_invalidation.ClientHeader = PROTO.Message("ipc_invalidation.ClientHeader", {
    protocol_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ProtocolVersion;
        },
        id: 1
    },
    client_token: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    registration_summary: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationSummary;
        },
        id: 3
    },
    client_time_ms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    max_known_server_time_ms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 5
    },
    message_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 6
    }
});
ipc_invalidation.ClientToServerMessage = PROTO.Message("ipc_invalidation.ClientToServerMessage", {
    header: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ClientHeader;
        },
        id: 1
    },
    initialize_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InitializeMessage;
        },
        id: 2
    },
    registration_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationMessage;
        },
        id: 3
    },
    registration_sync_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationSyncMessage;
        },
        id: 4
    },
    invalidation_ack_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InvalidationMessage;
        },
        id: 5
    },
    info_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InfoMessage;
        },
        id: 6
    }
});
ipc_invalidation.InitializeMessage = PROTO.Message("ipc_invalidation.InitializeMessage", {
    DigestSerializationType: PROTO.Enum("ipc_invalidation.InitializeMessage.DigestSerializationType", {
        BYTE_BASED: 1,
        NUMBER_BASED: 2
    }),
    client_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    nonce: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    application_client_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ApplicationClientIdP;
        },
        id: 3
    },
    digest_serialization_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InitializeMessage.DigestSerializationType;
        },
        id: 4
    }
});
ipc_invalidation.RegistrationMessage = PROTO.Message("ipc_invalidation.RegistrationMessage", {
    registration: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.RegistrationP;
        },
        id: 1
    }
});
ipc_invalidation.RegistrationSyncMessage = PROTO.Message("ipc_invalidation.RegistrationSyncMessage", {
    subtree: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.RegistrationSubtree;
        },
        id: 1
    }
});
ipc_invalidation.RegistrationSubtree = PROTO.Message("ipc_invalidation.RegistrationSubtree", {
    registered_object: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.ObjectIdP;
        },
        id: 1
    }
});
ipc_invalidation.InfoMessage = PROTO.Message("ipc_invalidation.InfoMessage", {
    client_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ClientVersion;
        },
        id: 1
    },
    config_parameter: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.PropertyRecord;
        },
        id: 2
    },
    performance_counter: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.PropertyRecord;
        },
        id: 3
    },
    server_registration_summary_requested: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 4
    },
    client_config: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ClientConfigP;
        },
        id: 5
    }
});
ipc_invalidation.PropertyRecord = PROTO.Message("ipc_invalidation.PropertyRecord", {
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
            return PROTO.int32;
        },
        id: 2
    }
});
ipc_invalidation.ServerHeader = PROTO.Message("ipc_invalidation.ServerHeader", {
    protocol_version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ProtocolVersion;
        },
        id: 1
    },
    client_token: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    registration_summary: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationSummary;
        },
        id: 3
    },
    server_time_ms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 4
    },
    message_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    }
});
ipc_invalidation.ServerToClientMessage = PROTO.Message("ipc_invalidation.ServerToClientMessage", {
    header: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ServerHeader;
        },
        id: 1
    },
    token_control_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.TokenControlMessage;
        },
        id: 2
    },
    invalidation_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InvalidationMessage;
        },
        id: 3
    },
    registration_status_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationStatusMessage;
        },
        id: 4
    },
    registration_sync_request_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationSyncRequestMessage;
        },
        id: 5
    },
    config_change_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ConfigChangeMessage;
        },
        id: 6
    },
    info_request_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.InfoRequestMessage;
        },
        id: 7
    },
    error_message: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ErrorMessage;
        },
        id: 8
    }
});
ipc_invalidation.TokenControlMessage = PROTO.Message("ipc_invalidation.TokenControlMessage", {
    new_token: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 1
    }
});
ipc_invalidation.RegistrationStatus = PROTO.Message("ipc_invalidation.RegistrationStatus", {
    registration: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.RegistrationP;
        },
        id: 1
    },
    status: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.StatusP;
        },
        id: 2
    }
});
ipc_invalidation.RegistrationStatusMessage = PROTO.Message("ipc_invalidation.RegistrationStatusMessage", {
    registration_status: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.RegistrationStatus;
        },
        id: 1
    }
});
ipc_invalidation.RegistrationSyncRequestMessage = PROTO.Message("ipc_invalidation.RegistrationSyncRequestMessage", {});
ipc_invalidation.InvalidationMessage = PROTO.Message("ipc_invalidation.InvalidationMessage", {
    invalidation: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.InvalidationP;
        },
        id: 1
    }
});
ipc_invalidation.InfoRequestMessage = PROTO.Message("ipc_invalidation.InfoRequestMessage", {
    InfoType: PROTO.Enum("ipc_invalidation.InfoRequestMessage.InfoType", { GET_PERFORMANCE_COUNTERS: 1 }),
    info_type: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.InfoRequestMessage.InfoType;
        },
        id: 1
    }
});
ipc_invalidation.RateLimitP = PROTO.Message("ipc_invalidation.RateLimitP", {
    window_ms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    count: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    }
});
ipc_invalidation.ProtocolHandlerConfigP = PROTO.Message("ipc_invalidation.ProtocolHandlerConfigP", {
    batching_delay_ms: {
        options: {
            get default_value() {
                return 500;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    rate_limit: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return ipc_invalidation.RateLimitP;
        },
        id: 2
    }
});
ipc_invalidation.ClientConfigP = PROTO.Message("ipc_invalidation.ClientConfigP", {
    version: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.Version;
        },
        id: 1
    },
    network_timeout_delay_ms: {
        options: {
            get default_value() {
                return 60000;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    write_retry_delay_ms: {
        options: {
            get default_value() {
                return 10000;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 3
    },
    heartbeat_interval_ms: {
        options: {
            get default_value() {
                return 1200000;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    },
    perf_counter_delay_ms: {
        options: {
            get default_value() {
                return 21600000;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 5
    },
    max_exponential_backoff_factor: {
        options: {
            get default_value() {
                return 500;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 6
    },
    smear_percent: {
        options: {
            get default_value() {
                return 20;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 7
    },
    is_transient: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 8
    },
    initial_persistent_heartbeat_delay_ms: {
        options: {
            get default_value() {
                return 2000;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 9
    },
    protocol_handler_config: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ProtocolHandlerConfigP;
        },
        id: 10
    },
    channel_supports_offline_delivery: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 11
    },
    offline_heartbeat_threshold_ms: {
        options: {
            get default_value() {
                return 60000;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 12
    }
});
ipc_invalidation.ConfigChangeMessage = PROTO.Message("ipc_invalidation.ConfigChangeMessage", {
    next_message_delay_ms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 1
    }
});
ipc_invalidation.ErrorMessage = PROTO.Message("ipc_invalidation.ErrorMessage", {
    Code: PROTO.Enum("ipc_invalidation.ErrorMessage.Code", {
        AUTH_FAILURE: 1,
        UNKNOWN_FAILURE: 10000
    }),
    code: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return ipc_invalidation.ErrorMessage.Code;
        },
        id: 1
    },
    description: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    }
});
