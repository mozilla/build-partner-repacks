"use strict";
var sync_pb;
if (typeof sync_pb == "undefined") {
    sync_pb = {};
}
sync_pb.SessionSpecifics = PROTO.Message("sync_pb.SessionSpecifics", {
    session_tag: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 1
    },
    header: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SessionHeader;
        },
        id: 2
    },
    tab: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SessionTab;
        },
        id: 3
    },
    tab_node_id: {
        options: {
            get default_value() {
                return -1;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    }
});
sync_pb.SessionHeader = PROTO.Message("sync_pb.SessionHeader", {
    window: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.SessionWindow;
        },
        id: 2
    },
    client_name: {
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
sync_pb.SessionWindow = PROTO.Message("sync_pb.SessionWindow", {
    window_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    selected_tab_index: {
        options: {
            get default_value() {
                return -1;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    BrowserType: PROTO.Enum("sync_pb.SessionWindow.BrowserType", {
        TYPE_TABBED: 1,
        TYPE_POPUP: 2
    }),
    browser_type: {
        options: {
            get default_value() {
                return sync_pb.SessionWindow.BrowserType.TYPE_TABBED;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SessionWindow.BrowserType;
        },
        id: 3
    },
    tab: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    }
});
sync_pb.SessionTab = PROTO.Message("sync_pb.SessionTab", {
    tab_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 1
    },
    window_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 2
    },
    tab_visual_index: {
        options: {
            get default_value() {
                return -1;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 3
    },
    current_navigation_index: {
        options: {
            get default_value() {
                return -1;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 4
    },
    pinned: {
        options: {
            get default_value() {
                return false;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 5
    },
    extension_app_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 6
    },
    navigation: {
        options: {},
        multiplicity: PROTO.repeated,
        type: function () {
            return sync_pb.TabNavigation;
        },
        id: 7
    },
    favicon: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bytes;
        },
        id: 8
    },
    FaviconType: PROTO.Enum("sync_pb.SessionTab.FaviconType", { TYPE_WEB_FAVICON: 1 }),
    favicon_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SessionTab.FaviconType;
        },
        id: 9
    },
    favicon_source: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 11
    }
});
sync_pb.TabNavigation = PROTO.Message("sync_pb.TabNavigation", {
    virtual_url: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 2
    },
    referrer: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 3
    },
    title: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 4
    },
    state: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 5
    },
    page_transition: {
        options: {
            get default_value() {
                return sync_pb.SyncEnums.PageTransition.TYPED;
            }
        },
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncEnums.PageTransition;
        },
        id: 6
    },
    redirect_type: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return sync_pb.SyncEnums.PageTransitionRedirectType;
        },
        id: 7
    },
    unique_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int32;
        },
        id: 8
    },
    timestamp: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 9
    },
    navigation_forward_back: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 10
    },
    navigation_from_address_bar: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 11
    },
    navigation_home_page: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 12
    },
    navigation_chain_start: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 13
    },
    navigation_chain_end: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.bool;
        },
        id: 14
    },
    global_id: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.int64;
        },
        id: 15
    },
    search_terms: {
        options: {},
        multiplicity: PROTO.optional,
        type: function () {
            return PROTO.string;
        },
        id: 16
    }
});
