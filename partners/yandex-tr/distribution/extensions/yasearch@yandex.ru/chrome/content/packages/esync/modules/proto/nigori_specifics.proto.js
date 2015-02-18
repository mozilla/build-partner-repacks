"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.NigoriKey = PROTO.Message("sync_pb.NigoriKey", {
    name: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    user_key: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 2
    },
    encryption_key: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 3
    },
    mac_key: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 4
    }
});
sync_pb.NigoriKeyBag = PROTO.Message("sync_pb.NigoriKeyBag", {
    key: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.NigoriKey;
        },
        id: 2
    }
});
sync_pb.NigoriSpecifics = PROTO.Message("sync_pb.NigoriSpecifics", {
    encryption_keybag: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.EncryptedData;
        },
        id: 1
    },
    keybag_is_frozen: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 2
    },
    encrypt_bookmarks: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 13
    },
    encrypt_preferences: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 14
    },
    encrypt_autofill_profile: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 15
    },
    encrypt_autofill: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 16
    },
    encrypt_themes: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 17
    },
    encrypt_typed_urls: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 18
    },
    encrypt_extensions: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 19
    },
    encrypt_sessions: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 20
    },
    encrypt_apps: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 21
    },
    encrypt_search_engines: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 22
    },
    encrypt_everything: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 24
    },
    encrypt_extension_settings: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 25
    },
    encrypt_app_notifications: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 26
    },
    encrypt_app_settings: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 27
    },
    sync_tab_favicons: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 29
    },
    PassphraseType: PROTO.Enum("sync_pb.NigoriSpecifics.PassphraseType", {
        IMPLICIT_PASSPHRASE: 1,
        KEYSTORE_PASSPHRASE: 2,
        FROZEN_IMPLICIT_PASSPHRASE: 3,
        CUSTOM_PASSPHRASE: 4
    }),
    passphrase_type: {
        options: {
            get default_value() {
                return sync_pb.NigoriSpecifics.PassphraseType.IMPLICIT_PASSPHRASE;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.NigoriSpecifics.PassphraseType;
        },
        id: 30
    },
    keystore_decryptor_token: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.EncryptedData;
        },
        id: 31
    },
    keystore_migration_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 32
    },
    custom_passphrase_time: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 33
    },
    encrypt_dictionary: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 34
    }
});
