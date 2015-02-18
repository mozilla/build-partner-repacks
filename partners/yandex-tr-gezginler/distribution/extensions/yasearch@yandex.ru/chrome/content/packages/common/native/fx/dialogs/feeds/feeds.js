"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
var YaFeeds = {
    get utils() {
        let scope = {};
        Cu.import(this.api.Package.resolvePath("/native/fx/modules/common-auth/utils.jsm"), scope);
        delete this.utils;
        this.__defineGetter__("utils", function utils() {
            return scope.utils;
        });
        return scope.utils;
    },
    get params() {
        return window.yaWinArguments;
    },
    get api() {
        return this.params.api;
    },
    onDialogLoad: function YaFeeds_onDialogLoad() {
        this.stringBundleSet = document.getElementById("string-bundle-feeds");
        this.stringBundleSet.src = this.api.Package.resolvePath(this.stringBundleSet.src);
        this.enableAcceptButton();
        this.params.services.requireFeedsGroupsList(this);
        let menuList = this.params.services.getFeedsMenuList();
        let deckFeeds = document.getElementById("deck-feeds");
        if (deckFeeds.firstChild) {
            deckFeeds.removeChild(deckFeeds.firstChild);
        }
        deckFeeds.appendChild(menuList);
        document.getElementById("feed-label-page").value = window.opener.gBrowser.mCurrentBrowser.contentTitle;
        document.getElementById("feeds-add-group").onclose = function (event) {
            this.parentNode.selectedIndex = 0;
            document.getElementById("feeds-select-group").selectedIndex = 0;
            document.getElementById("feeds-select-group").focus();
            event.preventDefault();
        };
    },
    onDialogUnLoad: function YaFeeds_onDialogUnLoad() {
        this.params.services.ignoreFeedsGroupsService(this);
    },
    observe: function YaFeeds_observe(subj, topic, data) {
        switch (topic) {
        case "feedsGroups":
            this.refreshFeedsGroups(data);
            break;
        }
    },
    enableAcceptButton: function YaFeeds_enableAcceptButton() {
        this.isNewGroup = !this.newGroupTitle;
        document.documentElement.getButton("accept").disabled = this.isNewGroup;
        return true;
    },
    getFeedUrl: function YaFeeds_getFeedUrl() {
        let list = document.getElementsByTagName("menulist")[0];
        return list.selectedItem.getAttribute("tooltiptext");
    },
    getFeedGroupId: function YaFeeds_getFeedGroupId() {
        return document.getElementById("feeds-select-group").selectedItem.getAttribute("group-id");
    },
    get isNewGroup() {
        return Boolean(document.getElementById("feeds-select-group").selectedItem.getAttribute("new-group"));
    },
    get newGroupTitle() {
        return document.getElementById("feeds-add-group").value.trim();
    },
    getString: function YaFeeds_getString(aStringName) {
        return this.stringBundleSet.getString(aStringName);
    },
    insertFeedCallback: function YaFeeds_insertFeedCallback(error) {
        switch (error) {
        case "errorNewGroup1":
            this.utils.showPrompt(window, this.getString("ErrorAddGroupTitle"), this.getString("ErrorAddGroup") + " " + this.getString("ErrorAddFeedNoConnection"));
            break;
        case "errorNewGroup2":
            this.utils.showPrompt(window, this.getString("ErrorAddGroupTitle"), this.getString("ErrorAddGroup"));
            break;
        case "errorNewItem1":
            this.utils.showPrompt(window, this.getString("ErrorAddFeedTitle"), this.getString("ErrorAddFeed") + " " + this.getString("ErrorAddFeedNoConnection"));
            break;
        case "errorNewItem2":
            this.utils.showPrompt(window, this.getString("ErrorAddFeedTitle"), this.getString("ErrorAddFeed"));
            break;
        }
        setTimeout(function () {
            document.documentElement.cancelDialog();
        }, 2);
    },
    onDialogAccept: function YaFeeds_onDialogAccept() {
        document.documentElement.getButton("accept").disabled = true;
        if (this.isNewGroup) {
            this.params.services.insertNewGroup({
                url: this.getFeedUrl(),
                callback: this.insertFeedCallback.bind(this),
                groupId: this.getFeedGroupId(),
                groupTitle: this.newGroupTitle
            });
        } else {
            this.params.services.insertNewFeed({
                url: this.getFeedUrl(),
                callback: this.insertFeedCallback.bind(this),
                groupId: this.getFeedGroupId(),
                groupTitle: this.newGroupTitle
            });
        }
        return false;
    },
    refreshFeedsGroups: function YaFeeds_refreshFeedsGroups(data) {
        let menuList = document.getElementById("feeds-select-group");
        let parentNode = menuList.parentNode;
        parentNode.removeChild(menuList);
        parentNode.appendChild(data);
        this.enableAcceptButton();
        document.getElementById("feeds-add-group").disabled = false;
        return true;
    },
    toggleNewGroupInput: function YaFeeds_toggleNewGroupInput() {
        document.getElementById("feeds-newfolder-deck").selectedIndex = this.isNewGroup ? 1 : 0;
        if (this.isNewGroup) {
            document.getElementById("feeds-add-group").focus();
        } else {
            document.getElementById("feeds-select-group").focus();
        }
        this.enableAcceptButton();
        return true;
    }
};
