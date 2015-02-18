"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.SyncEnums = PROTO.Message("sync_pb.SyncEnums", {
    EventType: PROTO.Enum("sync_pb.SyncEnums.EventType", {
        AUTH_ERROR: 1,
        UPDATED_TOKEN: 2,
        PASSPHRASE_REQUIRED: 3,
        PASSPHRASE_ACCEPTED: 4,
        INITIALIZATION_COMPLETE: 5,
        STOP_SYNCING_PERMANENTLY: 6,
        ENCRYPTED_TYPES_CHANGED: 9,
        ENCRYPTION_COMPLETE: 7,
        ACTIONABLE_ERROR: 8
    }),
    PageTransition: PROTO.Enum("sync_pb.SyncEnums.PageTransition", {
        LINK: 0,
        TYPED: 1,
        AUTO_BOOKMARK: 2,
        AUTO_SUBFRAME: 3,
        MANUAL_SUBFRAME: 4,
        GENERATED: 5,
        AUTO_TOPLEVEL: 6,
        FORM_SUBMIT: 7,
        RELOAD: 8,
        KEYWORD: 9,
        KEYWORD_GENERATED: 10
    }),
    PageTransitionRedirectType: PROTO.Enum("sync_pb.SyncEnums.PageTransitionRedirectType", {
        CLIENT_REDIRECT: 1,
        SERVER_REDIRECT: 2
    }),
    ErrorType: PROTO.Enum("sync_pb.SyncEnums.ErrorType", {
        SUCCESS: 0,
        ACCESS_DENIED: 1,
        NOT_MY_BIRTHDAY: 2,
        THROTTLED: 3,
        AUTH_EXPIRED: 4,
        USER_NOT_ACTIVATED: 5,
        AUTH_INVALID: 6,
        CLEAR_PENDING: 7,
        TRANSIENT_ERROR: 8,
        MIGRATION_DONE: 9,
        UNKNOWN: 100
    }),
    Action: PROTO.Enum("sync_pb.SyncEnums.Action", {
        UPGRADE_CLIENT: 0,
        CLEAR_USER_DATA_AND_RESYNC: 1,
        ENABLE_SYNC_ON_ACCOUNT: 2,
        STOP_AND_RESTART_SYNC: 3,
        DISABLE_SYNC_ON_CLIENT: 4,
        UNKNOWN_ACTION: 5
    }),
    DeviceType: PROTO.Enum("sync_pb.SyncEnums.DeviceType", {
        TYPE_WIN: 1,
        TYPE_MAC: 2,
        TYPE_LINUX: 3,
        TYPE_CROS: 4,
        TYPE_OTHER: 5,
        TYPE_PHONE: 6,
        TYPE_TABLET: 7
    })
});
