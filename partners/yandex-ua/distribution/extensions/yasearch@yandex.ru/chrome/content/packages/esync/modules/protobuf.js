"use strict";
let EXPORTED_SYMBOLS = ["Protobuf"];
let CONFIG = {
    PINNED_ID: "emghafiiokbjdgphaofindndbcicinae",
    TOPHISTORY_ID: "TopHistory"
};
let AUTOFILL_KEY_PREFIX = [
    138,
    191,
    15,
    0
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
let PINNED_KEY_PREFIX = [
    194,
    190,
    95,
    0
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
let PASSWORD_KEY_PREFIX = [
    138,
    179,
    22,
    0
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
let TOPHISTORY_KEY_PREFIX = [
    218,
    148,
    95,
    0
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
let TYPEDURLS_KEY_PREFIX = [
    234,
    244,
    19,
    0
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
let DEVICEINFO_KEY_PREFIX = [
    210,
    185,
    75,
    0
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
let {Auth} = require("auth");
let {Utils} = require("utils");
XPCOMUtils.defineLazyGetter(this, "UNICODE_CONVERTER_UTF8", function () {
    const converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "utf-8";
    return converter;
});
XPCOMUtils.defineLazyGetter(this, "SCRIPT_LOADER", function () {
    return Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
});
let Protobuf = {
    init: function Protobuf_init() {
        onShutdown.add(this.finalize.bind(this));
        NativeAPI.logger.debug("init Protobuf");
        this._PROTO = require("libs/protobuf").PROTO;
        this._PROTO.log = function () {
        };
        NativeAPI.logger.debug("load SyncPb");
        this._loadSyncPb();
        this._loadIpc();
    },
    finalize: function Protobuf_finalize() {
        this._PROTO = null;
        this._sync_pb = null;
    },
    parseBlob: function Protobuf_parseBlob(blob) {
        let message = new this._sync_pb.ClientToServerResponse();
        let stream = new this.PROTO.ArrayBufferStream(blob, blob.byteLength);
        message.ParseFromStream(stream);
        return message;
    },
    serializeToBlob: function Protobuf_serializeToBlob(data) {
        let stream = new this.PROTO.ArrayBufferStream();
        data.SerializeToStream(stream);
        return new Uint8Array(stream.getUint8Array()).buffer;
    },
    parseClientGatewayMessage: function Protobuf_parseClientGatewayMessage(base64) {
        if (!base64) {
            return null;
        }
        NativeAPI.logger.debug(base64);
        let message = new this._ipc.ClientGatewayMessage();
        let stream = new this.PROTO.Base64Stream(base64);
        message.ParseFromStream(stream);
        return message;
    },
    parseServerToClientMessage: function Protobuf_parseServerToClientMessage(arr) {
        let stream = new this.PROTO.ByteArrayStream(arr);
        let message = new this._ipc.ServerToClientMessage();
        message.ParseFromStream(stream);
        return message;
    },
    convertToJSON: function Protobuf_convertToJSON(PROTO) {
        let json = {};
        for (let k in PROTO._values) {
            let value = PROTO._values[k];
            if (typeof value === "object" && value.isType) {
                json[k] = this.convertToJSON(value);
            } else {
                json[k] = value;
            }
        }
        return json;
    },
    getCommitMessage: function Protobuf_getCommitMessage(entities) {
        if (!Array.isArray(entities) || !entities.length) {
            NativeAPI.logger.debug("[getCommitMessage] Should point entities");
            return null;
        }
        let message = new this._sync_pb.ClientToServerMessage();
        message.share = Auth.token.username;
        message.message_contents = this._sync_pb.ClientToServerMessage.Contents.COMMIT;
        message.commit = new this._sync_pb.CommitMessage();
        message.commit.cache_guid = Auth.token.guid;
        message.commit.entries = this._getEntries(entities);
        if (Auth.storeBirthday) {
            message.store_birthday = Auth.storeBirthday;
        }
        NativeAPI.logger.debug("commit", message);
        return this.serializeToBlob(message);
    },
    getUpdatesMessage: function Protobuf_getUpdatesMessage(listEngines, opts) {
        if (!Array.isArray(listEngines) || !listEngines.length) {
            NativeAPI.logger.debug("[getUpdatesMessage] Should point list engines");
            return null;
        }
        let message = new this._sync_pb.ClientToServerMessage();
        message.share = Auth.token.username;
        message.message_contents = this._sync_pb.ClientToServerMessage.Contents.GET_UPDATES;
        message.get_updates = new this._sync_pb.GetUpdatesMessage();
        message.get_updates.from_progress_marker = this._getProgressMarkers(listEngines, opts);
        if (opts && opts.createMobileFolder) {
            message.get_updates.create_mobile_bookmarks_folder = true;
        }
        if (opts && opts.createTabletFolder) {
            message.get_updates.create_tablet_bookmarks_folder = true;
        }
        if (Auth.storeBirthday) {
            message.store_birthday = Auth.storeBirthday;
        }
        NativeAPI.logger.debug("message", message);
        return this.serializeToBlob(message);
    },
    parseProtobufEntry: function Protobuf_parseProtobufEntry(entry, additionalFields) {
        let response = {
            engineName: null,
            data: null
        };
        if (!entry) {
            return response;
        }
        let data = null;
        let engineName = null;
        let specifics = entry.specifics;
        if (!specifics) {
            engineName = additionalFields && additionalFields.engine;
        } else {
            if (specifics.password) {
                engineName = "Passwords";
            } else if (specifics.autofill) {
                engineName = "Autofill";
            } else if (specifics.bookmark) {
                engineName = "Bookmarks";
            } else if (specifics.nigori) {
                engineName = "Nigori";
            } else if (specifics.yandex_global_setting) {
                engineName = "Pinned";
            } else if (specifics.yandex_elements) {
                engineName = "Tophistory";
            } else if (specifics.typed_url) {
                engineName = "Typedurls";
            } else if (specifics.device_info) {
                engineName = "Deviceinfo";
            }
        }
        if (!engineName) {
            return response;
        }
        response.engineName = engineName;
        if (typeof this._converters[engineName] !== "function") {
            return response;
        }
        response.data = this._converters[engineName](entry);
        if (!response.data) {
            return response;
        }
        if (additionalFields) {
            for (let [
                        key,
                        value
                    ] in Iterator(additionalFields)) {
                response.data[key] = response.data[key] || value;
            }
        }
        return response;
    },
    getEngineNameById: function Protobuf_getEngineNameById(id) {
        let engineMap = {
            31729: "Autofill",
            32904: "Bookmarks",
            47745: "Nigori",
            195560: "Pinned",
            45873: "Passwords",
            194891: "Tophistory",
            40781: "Typedurls",
            154522: "Deviceinfo"
        };
        return engineMap[id] || null;
    },
    getGatewayMessage: function Protobuf_getGatewayMessage(token, isSubscribe) {
        let message = new this._ipc.ClientGatewayMessage();
        message.is_client_to_server = true;
        message.network_message = this._getClientToServerMessage(token, isSubscribe);
        NativeAPI.logger.debug(message);
        let base64stream = new this._PROTO.Base64Stream();
        message.SerializeToStream(base64stream);
        return base64stream.getString();
    },
    _getClientToServerMessage: function Protobuf__getClientToServerMessage(token, isSubscribe) {
        let message = new this._ipc.ClientToServerMessage();
        let header = message.header = new this._ipc.ClientHeader();
        header.protocol_version = new this._ipc.ProtocolVersion();
        let version = header.protocol_version.version = new this._ipc.Version();
        version.major_version = this._PROTO.I64.fromNumber(3);
        version.minor_version = this._PROTO.I64.fromNumber(2);
        header.client_time_ms = this._PROTO.I64.fromNumber(Date.now());
        let id = isSubscribe ? 3 : 1;
        header.message_id = id;
        if (isSubscribe) {
            let num_regs = require("service").Service.engineManager.getAll().length;
            header.client_token = token;
            header.registration_summary = new this._ipc.RegistrationSummary();
            header.registration_summary.num_registrations = this._PROTO.I64.fromNumber(num_regs);
            message.registration_message = this._getRegistrationMessage();
        } else {
            message.initialize_message = this._getInitializeMessage();
        }
        return message;
    },
    _getInitializeMessage: function Protobuf__getInitializeMessage() {
        let message = new this._ipc.InitializeMessage();
        message.client_type = this._ipc.ClientType.Type.CHROME_SYNC;
        message.digest_serialization_type = this._ipc.InitializeMessage.DigestSerializationType.BYTE_BASED;
        let client = new this._ipc.ApplicationClientIdP();
        client.client_type = this._ipc.ClientType.Type.CHROME_SYNC;
        let guid = Auth.token.guid;
        client.client_name = UNICODE_CONVERTER_UTF8.convertToByteArray(guid);
        message.application_client_id = client;
        return message;
    },
    _getRegistrationMessage: function Protobuf__getRegistartionMessage() {
        let message = new this._ipc.RegistrationMessage();
        let engines = require("service").Service.engineManager.getAll();
        let regs = [];
        engines.forEach(function (engine) {
            let name = require("xmpp").XMPP.getXmppEngineName(engine.name);
            if (!name) {
                return;
            }
            let registration = new this._ipc.RegistrationP();
            registration.object_id = new this._ipc.ObjectIdP();
            registration.object_id.source = this._ipc.ClientType.Type.CHROME_SYNC;
            registration.object_id.name = UNICODE_CONVERTER_UTF8.convertToByteArray(name);
            registration.op_type = this._ipc.RegistrationP.OpType.REGISTER;
            regs.push(registration);
        }, this);
        message.registration = regs;
        return message;
    },
    _getInfoMessage: function Protobuf__getInfoMessage() {
        let message = new this._ipc.InfoMessage();
        let version = message.client_version = new this._ipc.ClientVersion();
        version.major_version = this._PROTO.I64.fromNumber(3);
        version.minor_version = this._PROTO.I64.fromNumber(2);
        return message;
    },
    _getEntries: function Protobuf__getEntries(list) {
        let entries = [];
        list.forEach(function (entity) {
            try {
                let engine = entity.engine;
                let data = JSON.parse(entity.data);
                let entry = this._constructors[engine](data, entity.on_delete);
                entries.push(entry);
            } catch (e) {
                NativeAPI.logger.error("Error parse entity: " + e);
                NativeAPI.logger.error(e.stack);
            }
        }, this);
        return entries;
    },
    _getProgressMarkers: function Protobuf__getProgressMarkers(listEngines, opts) {
        let {Service} = require("service");
        let markers = [];
        listEngines.forEach(function (engineName) {
            let engine = Service.engineManager.get(engineName);
            if (!engine) {
                return;
            }
            try {
                let progressMarker = new this._sync_pb.DataTypeProgressMarker();
                progressMarker.data_type_id = engine.PROTO_ID;
                let token = [];
                let engineToken = engine.token;
                for (let i = 0, length = engineToken.length; i < length; i++) {
                    token.push(engineToken[i] + engineToken[++i]);
                }
                progressMarker.token = token;
                if (engine.name === "Bookmarks" && opts && (opts.createTabletFolder || opts.createMobileFolder)) {
                    progressMarker.token = [];
                }
                markers.push(progressMarker);
            } catch (e) {
                NativeAPI.logger.debug("Error get progress_marker for " + engineName + " engine.\n" + e);
            }
        }, this);
        return markers;
    },
    _loadSyncPb: function Protobuf__loadSyncPb() {
        this._sync_pb = {};
        this._LIST_SYNC_PB.forEach(function (module) {
            let scope = {
                PROTO: this._PROTO,
                sync_pb: this._sync_pb
            };
            NativeAPI.logger.trace("Loading sync_pb." + module);
            this._loadFile(module, scope);
        }, this);
    },
    _loadIpc: function Protobuf__loadIpc() {
        this._ipc = {};
        this._LIST_IPC.forEach(function (module) {
            let scope = {
                PROTO: this._PROTO,
                ipc_invalidation: this._ipc
            };
            NativeAPI.logger.trace("Loading ipc_invalidation." + module);
            this._loadFile(module, scope);
        }, this);
    },
    _loadFile: function Protobuf__loadFile(module, scope) {
        const EXT = "proto.js";
        const relativePrePath = NativeAPI.Package.resolvePath("modules/proto/");
        let url = relativePrePath + module + "." + EXT;
        SCRIPT_LOADER.loadSubScript(url, scope);
        NativeAPI.logger.trace("Loaded by url " + url);
    },
    get PROTO() {
        return this._PROTO;
    },
    get sync_pb() {
        return this._sync_pb;
    },
    _PROTO: null,
    _sync_pb: null,
    _ipc: null,
    _LIST_SYNC_PB: [
        "app_notification_specifics",
        "app_setting_specifics",
        "app_specifics",
        "autofill_specifics",
        "bookmark_specifics",
        "device_info_specifics",
        "dictionary_specifics",
        "experiments_specifics",
        "extension_setting_specifics",
        "extension_specifics",
        "history_delete_directive_specifics",
        "nigori_specifics",
        "password_specifics",
        "preference_specifics",
        "priority_preference_specifics",
        "search_engine_specifics",
        "session_specifics",
        "synced_notification_specifics",
        "theme_specifics",
        "typed_url_specifics",
        "yandex_elements_specifics",
        "yandex_global_setting_specifics",
        "client_commands",
        "client_debug_info",
        "encryption",
        "get_updates_caller_info",
        "sync",
        "sync_enums",
        "test",
        "unique_position"
    ],
    _LIST_IPC: [
        "client",
        "client_gateway",
        "client_protocol",
        "types"
    ],
    _constructors: {
        Autofill: function PB_constructors_autofill(data, onDelete) {
            if (!data.name) {
                throw new Error("Autofill: Should point name\n");
            }
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.id_string = data.id_string;
            entity.parent_id_string = data.parent_id_string;
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.mtime = Protobuf.PROTO.I64.fromNumber(data.mtime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.name = [
                "autofill_entry",
                data.name,
                data.value
            ].map(function (s) {
                return Utils.escapeTag(s || "");
            }).join("|");
            entity.non_unique_name = " ";
            entity.client_defined_unique_tag = Protobuf._generateEntityKey(entity.name, AUTOFILL_KEY_PREFIX);
            entity.folder = Boolean(data.folder);
            entity.deleted = Boolean(onDelete);
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.autofill = new Protobuf.sync_pb.AutofillSpecifics();
            obj.autofill.name = data.name;
            obj.autofill.value = data.value;
            let timestamp = Array.isArray(data.usage_timestamp) ? data.usage_timestamp : JSON.parse(data.usage_timestamp || "[]");
            obj.autofill.usage_timestamp = timestamp.map(function (time) {
                return Protobuf.PROTO.I64.fromNumber(time);
            });
            return entity;
        },
        Bookmarks: function PB_constructor_bookmarks(data, onDelete) {
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.id_string = data.id_string;
            entity.parent_id_string = data.parent_id_string;
            entity.name = data.title || " ";
            entity.position_in_parent = Protobuf.PROTO.I64.fromNumber(data.position_in_parent || 0);
            entity.client_defined_unique_tag = data.client_defined_unique_tag;
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.mtime = Protobuf.PROTO.I64.fromNumber(data.mtime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            if (data.creation_time_us) {
                entity.creation_time_us = Protobuf.PROTO.I64.fromNumber(data.creation_time_us);
            }
            entity.folder = Boolean(data.folder);
            entity.deleted = Boolean(onDelete);
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.bookmark = new Protobuf.sync_pb.BookmarkSpecifics();
            if (data.url) {
                obj.bookmark.url = Utils.url2ascii(data.url);
            }
            if (data.yandex_client_tag) {
                obj.bookmark.yandex_client_tag = data.yandex_client_tag;
            }
            obj.bookmark.title = data.title || " ";
            return entity;
        },
        Nigori: function PB_constructors_nigori(data, onDelete) {
            [
                "key_name",
                "blob"
            ].forEach(function (field) {
                if (!(field in data)) {
                    throw new Error("Nigori: Should point " + field + "\n");
                }
            });
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.id_string = data.id_string || "0";
            entity.parent_id_string = data.parent_id_string || "0";
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.mtime = Protobuf.PROTO.I64.fromNumber(data.mtime || Date.now());
            entity.server_defined_unique_tag = data.server_defined_unique_tag;
            entity.folder = Boolean(data.folder);
            entity.name = "nigori";
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.nigori = new Protobuf.sync_pb.NigoriSpecifics();
            obj.nigori.encryption_keybag = new Protobuf.sync_pb.EncryptedData();
            obj.nigori.encryption_keybag.key_name = data.key_name;
            obj.nigori.encryption_keybag.blob = data.blob;
            return entity;
        },
        Passwords: function PB_constructors_passwords(data, onDelete) {
            [
                "origin",
                "action",
                "username_element",
                "username_value",
                "password_element",
                "password_value",
                "key_name",
                "blob"
            ].forEach(function (field) {
                if (!(field in data)) {
                    throw new Error("Passwords: Should point " + field + "\n");
                }
            });
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.id_string = data.id_string || "0";
            entity.parent_id_string = data.parent_id_string || "0";
            let name = [
                data.origin,
                data.username_element,
                data.username_value,
                data.password_element,
                data.signon_realm
            ].map(function (s) {
                return Utils.escapeTag(s || "");
            }).join("|");
            entity.client_defined_unique_tag = Protobuf._generateEntityKey(name, PASSWORD_KEY_PREFIX);
            entity.name = " ";
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.folder = Boolean(data.folder);
            entity.deleted = Boolean(onDelete);
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.password = new Protobuf.sync_pb.PasswordSpecifics();
            obj.password.encrypted = new Protobuf.sync_pb.EncryptedData();
            obj.password.encrypted.key_name = data.key_name;
            obj.password.encrypted.blob = data.blob;
            return entity;
        },
        Pinned: function PB_constructors_pinned(data, onDelete) {
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.id_string = data.id_string || "0";
            entity.parent_id_string = data.parent_id_string;
            entity.client_defined_unique_tag = Protobuf._generateEntityKey(CONFIG.PINNED_ID + "/" + data.key, PINNED_KEY_PREFIX);
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.mtime = Protobuf.PROTO.I64.fromNumber(data.mtime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.name = data.key;
            entity.folder = Boolean(data.folder);
            entity.deleted = Boolean(onDelete);
            entity.non_unique_name = " ";
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.yandex_global_setting = new Protobuf.sync_pb.YandexGlobalSettingSpecifics();
            obj.yandex_global_setting.subsystem_id = Protobuf.sync_pb.YandexGlobalSettingSpecifics.SubsystemIds.TABLO_PINNED;
            obj.yandex_global_setting.key = data.key;
            obj.yandex_global_setting.value = data.value;
            obj.yandex_global_setting.device_type = Protobuf.sync_pb.SyncEnums.DeviceType.TYPE_TABLET;
            return entity;
        },
        Tophistory: function PB_constructors_tophistory(data, onDelete) {
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.id_string = data.id_string || "0";
            entity.parent_id_string = data.parent_id_string || "0";
            entity.client_defined_unique_tag = Protobuf._generateEntityKey(CONFIG.TOPHISTORY_ID + "/" + data.key, TOPHISTORY_KEY_PREFIX);
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.name = data.key;
            entity.folder = Boolean(data.folder);
            entity.deleted = Boolean(onDelete);
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.yandex_elements = new Protobuf.sync_pb.YandexElementsSpecifics();
            obj.yandex_elements.id = CONFIG.TOPHISTORY_ID;
            obj.yandex_elements.key = data.key;
            obj.yandex_elements.value = data.value;
            return entity;
        },
        Typedurls: function PB_constructors_typedurls(data, onDelete) {
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.deleted = Boolean(onDelete);
            [
                "url",
                "title",
                "hidden",
                "visits",
                "visit_transitions"
            ].forEach(function (field) {
                if (!(field in data)) {
                    throw new Error("Typedurls: Should point " + field + "\n");
                }
            });
            let asciiURL = Utils.url2ascii(data.url);
            entity.id_string = data.id_string;
            entity.parent_id_string = data.parent_id_string;
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.mtime = Protobuf.PROTO.I64.fromNumber(data.mtime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.name = asciiURL;
            entity.client_defined_unique_tag = Protobuf._generateEntityKey(entity.name, TYPEDURLS_KEY_PREFIX);
            entity.folder = Boolean(data.folder);
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.typed_url = new Protobuf.sync_pb.TypedUrlSpecifics();
            obj.typed_url.url = asciiURL;
            obj.typed_url.title = data.title;
            obj.typed_url.hidden = Boolean(data.hidden);
            let visits = Array.isArray(data.visits) ? data.visits : JSON.parse(data.visits || "[]");
            obj.typed_url.visits = visits.map(function (visit) {
                return Protobuf.PROTO.I64.fromNumber(visit);
            });
            let visit_transitions = Array.isArray(data.visit_transitions) ? data.visit_transitions : JSON.parse(data.visit_transitions || "[]");
            obj.typed_url.visit_transitions = visit_transitions;
            return entity;
        },
        Deviceinfo: function PB_constructors_deviceinfo(data, onDelete) {
            let entity = new Protobuf.sync_pb.SyncEntity();
            entity.deleted = Boolean(onDelete);
            [
                "cache_guid",
                "client_name",
                "sync_user_agent",
                "chrome_version"
            ].forEach(function (field) {
                if (!(field in data)) {
                    throw new Error("Deviceinfo: Should point " + field + "\n");
                }
            });
            let cache_guid = data.cache_guid || Auth.token.guid;
            entity.id_string = data.id_string || "0";
            entity.parent_id_string = data.parent_id_string;
            entity.ctime = Protobuf.PROTO.I64.fromNumber(data.ctime || Date.now());
            entity.mtime = Protobuf.PROTO.I64.fromNumber(data.mtime || Date.now());
            entity.version = Protobuf.PROTO.I64.fromNumber(data.version || "0");
            entity.name = Utils.escapeTag(data.client_name || "");
            entity.client_defined_unique_tag = Protobuf._generateEntityKey("DeviceInfo_" + cache_guid, DEVICEINFO_KEY_PREFIX);
            entity.folder = Boolean(data.folder);
            let obj = new Protobuf.sync_pb.EntitySpecifics();
            entity.specifics = obj;
            obj.device_info = new Protobuf.sync_pb.DeviceInfoSpecifics();
            obj.device_info.cache_guid = cache_guid;
            obj.device_info.client_name = data.client_name;
            obj.device_info.device_type = data.device_type || Protobuf.sync_pb.SyncEnums.DeviceType.TYPE_OTHER;
            obj.device_info.sync_user_agent = data.sync_user_agent;
            obj.device_info.chrome_version = data.chrome_version;
            return entity;
        }
    },
    _converters: {
        Autofill: function PB_converters_autofill(entry) {
            let autofill = entry.specifics && entry.specifics.autofill || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                name: autofill.name || "",
                value: autofill.value || "",
                usage_timestamp: Array.map(autofill.usage_timestamp || [], function (time) {
                    return time.toNumber();
                }),
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Bookmarks: function PB_converters_bookmarks(entry) {
            let bookmark = entry.specifics && entry.specifics.bookmark || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                ctime: entry.ctime && entry.ctime.toNumber(),
                mtime: entry.mtime && entry.mtime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                server_defined_unique_tag: entry.server_defined_unique_tag,
                client_defined_unique_tag: entry.client_defined_unique_tag,
                position_in_parent: entry.position_in_parent && entry.position_in_parent.toNumber() || 0,
                title: bookmark.title || "",
                url: Utils.ascii2url(bookmark.url) || "",
                favicon: String(bookmark.favicon || ""),
                creation_time_us: bookmark.creation_time_us && bookmark.creation_time_us.toNumber(),
                icon_url: bookmark.icon_url || "",
                yandex_client_tag: bookmark.yandex_client_tag,
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Nigori: function PB_converters_nigori(entry) {
            let nigori = entry.specifics && entry.specifics.nigori || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                server_defined_unique_tag: entry.server_defined_unique_tag,
                key_name: nigori.encryption_keybag && nigori.encryption_keybag.key_name || null,
                blob: nigori.encryption_keybag && nigori.encryption_keybag.blob || null,
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Passwords: function PB_converters_passwords(entry) {
            let password = entry.specifics && entry.specifics.password || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                server_defined_unique_tag: entry.server_defined_unique_tag,
                key_name: password.encrypted && password.encrypted.key_name || null,
                blob: password.encrypted && password.encrypted.blob || null,
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Pinned: function PB_converters_pinned(entry) {
            let pinned = entry.specifics && entry.specifics.yandex_global_setting || {};
            if (pinned.device_type === Protobuf.sync_pb.SyncEnums.DeviceType.TYPE_PHONE) {
                return null;
            }
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                key: pinned.key || null,
                value: pinned.value || null,
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Tophistory: function PB_converters_tophistory(entry) {
            let tophistory = entry.specifics && entry.specifics.yandex_elements || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                key: tophistory.key,
                value: tophistory.value,
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Typedurls: function PB_converters_Typedurls(entry) {
            let typed_url = entry.specifics && entry.specifics.typed_url || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                mtime: entry.mtime && entry.mtime.toNumber(),
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                url: Utils.ascii2url(typed_url.url) || "",
                title: typed_url.title || "",
                hidden: typed_url.hidden || false,
                visits: Array.map(typed_url.visits || [], function (visit) {
                    return visit.toNumber();
                }),
                visit_transitions: Array.map(typed_url.visit_transitions || [], function (visit_transition) {
                    return visit_transition;
                }),
                folder: entry.folder,
                deleted: entry.deleted
            };
        },
        Deviceinfo: function PB_converters_Deviceinfo(entry) {
            let device_info = entry.specifics && entry.specifics.device_info || {};
            return {
                id_string: entry.id_string,
                parent_id_string: entry.parent_id_string,
                version: entry.version && entry.version.toNumber() || 0,
                mtime: entry.mtime && entry.mtime.toNumber(),
                ctime: entry.ctime && entry.ctime.toNumber(),
                originator_cache_guid: entry.originator_cache_guid,
                cache_guid: device_info.cache_guid,
                client_name: device_info.client_name,
                device_type: device_info.device_type,
                sync_user_agent: device_info.sync_user_agent,
                chrome_version: device_info.chrome_version,
                folder: entry.folder,
                deleted: entry.deleted
            };
        }
    },
    _generateEntityKey: function Protobuf__generateEntityKey(keyPostfix, keyPrefix) {
        let message = keyPrefix + keyPostfix;
        message = message.split("").map(function (ch) {
            return ch.charCodeAt(0);
        });
        let hasher = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
        hasher.init(hasher.SHA1);
        hasher.update(message, message.length);
        return hasher.finish(true);
    },
    get DEVICE_TYPE() {
        delete this.DEVICE_TYPE;
        let osType;
        switch (NativeAPI.Environment.os.name) {
        case "mac":
            osType = "TYPE_MAC";
            break;
        case "linux":
            osType = "TYPE_LINUX";
            break;
        default:
            osType = "TYPE_WIN";
            break;
        }
        return this.DEVICE_TYPE = Protobuf.sync_pb.SyncEnums.DeviceType[osType];
    }
};
Protobuf.init();
