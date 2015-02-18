(function () {
    var OS = Y.ObserverService.getInstance();
    var MSG_TAB_CLICK = "tab:set-active-tab";
    var MSG_ACTIVE_TAB = "twitter:active-tab";
    var tabStatNamesMap = {
        "home": "main",
        "mentions": "connect",
        "dms": "message",
        "search": "searche"
    };
    function Tab(tab) {
        this.name = tab.id.substring(4);
        this._tab = tab;
        this._content = document.getElementById("tab:" + this.name + ":content");
        this._tab.onclick = function () {
            var id = this.id.substring(4);
            var statName = tabStatNamesMap[id];
            if (statName) {
                Twitter.platform.statLogWidget(statName);
            }
            OS.notifyObservers(MSG_TAB_CLICK, id);
        };
        this.selected = Y.DOM.hasClass(this._tab, this._activeTabClassName);
    }
    Tab.prototype = {
        constructor: Tab,
        _activeTabClassName: "tab-selected",
        select: function () {
            if (!this.selected) {
                this.selected = true;
                Y.DOM.addClass(this._tab, this._activeTabClassName);
            }
        },
        unselect: function () {
            if (this.selected) {
                this.selected = false;
                Y.DOM.removeClass(this._tab, this._activeTabClassName);
            }
        }
    };
    Y.UI.TabController = function (container) {
        this._container = container;
        this._tabsMap = {};
        this._activeTab = "";
        var nodes = container.children;
        for (var i = 0, l = nodes.length; i < l; ++i) {
            var node = nodes[i];
            if (Y.DOM.hasClass(node, "tab")) {
                var tab = new Tab(node);
                this._tabsMap[tab.name] = tab;
                if (tab.selected) {
                    this._activeTab = tab.name;
                }
            }
        }
        if (this._activeTab) {
            OS.notifyObservers(MSG_ACTIVE_TAB, this._activeTab);
        }
        var me = this;
        OS.attachObserver(MSG_TAB_CLICK, function (t, tab) {
            me.setActiveTab(tab);
        });
    };
    Y.UI.TabController.prototype = {
        constructor: Y.UI.TabController,
        setActiveTab: function (name) {
            name = name || "";
            if (name != this._activeTab) {
                if (this._activeTab) {
                    this._tabsMap[this._activeTab].unselect();
                }
                this._activeTab = name;
                if (name) {
                    this._tabsMap[name].select();
                }
                OS.notifyObservers(MSG_ACTIVE_TAB, name);
            }
        }
    };
}());
