(function () {
    var MAX_COUNT = 20;
    var OB_RENDER = "render:";
    var OB_GET_MORE = ":get-more:";
    var CMD_GET_MORE = "twitter:get-more:";
    var CMD_GMB_STATE = ":get-more:state:";
    var OB_RENDER_COUNT = "render:counter:";
    var OS = Y.ObserverService.getInstance();
    var makeTwit = function (text, entities) {
        text = text || "";
        if (!entities || !text) {
            return text;
        }
        var i, e;
        var arr = [];
        function add(ent, text) {
            arr.push({
                text: text,
                start: ent.indices[0],
                end: ent.indices[1]
            });
        }
        if (entities.hashtags) {
            for (i = 0; i < entities.hashtags.length; ++i) {
                e = entities.hashtags[i];
                add(e, "<a href=\"javascript:twitlink.search('#" + e.text + "')\">#" + e.text + "</a>");
            }
        }
        if (entities.user_mentions) {
            for (i = 0; i < entities.user_mentions.length; ++i) {
                e = entities.user_mentions[i];
                add(e, "<a href=\"javascript:twitlink.info('" + e.id_str + "')\">@" + e.screen_name + "</a>");
            }
        }
        if (entities.urls) {
            for (i = 0; i < entities.urls.length; ++i) {
                e = entities.urls[i];
                add(e, "<a href=\"javascript:twitlink.open('" + e.url + "')\" title=\"" + e.expanded_url.toHTML() + "\">" + e.display_url.toHTML() + "</a>");
            }
        }
        if (entities.media) {
            for (i = 0; i < entities.media.length; ++i) {
                e = entities.media[i];
                if (e.url && e.display_url) {
                    add(e, "<a href=\"javascript:twitlink.open('" + e.url + "')\">" + e.display_url + "</a>");
                }
            }
        }
        if (!arr.length) {
            return text;
        }
        arr.sort(function (a, b) {
            return a.start - b.start;
        });
        var ret = [];
        var begin = 0;
        for (i = 0; i < arr.length; ++i) {
            if (arr[i].start > begin) {
                ret.push(text.substring(begin, arr[i].start));
            }
            ret.push(arr[i].text);
            begin = arr[i].end;
        }
        if (text.length > begin) {
            ret.push(text.substring(begin));
        }
        return ret.join("");
    };
    function getFoto(entities) {
        if (entities && entities.media && entities.media.length) {
            for (var i = 0; i < entities.media.length; ++i) {
                e = entities.media[i];
                if (e.type == "photo" && e.media_url) {
                    return e.media_url;
                }
            }
        }
        return "";
    }
    Y.UI.Renderer = function (container, mode, jstemplate) {
        if (makeTwit) {
            Y.XTools.xjsont.addFunction("makeTwit", makeTwit);
            Y.XTools.xjsont.addFunction("getFoto", getFoto);
            makeTwit = null;
        }
        this._container = container;
        this._jstemplate = jstemplate;
        this._observeTopic = OB_RENDER + mode;
        this._observeGMCmdTopic = OB_GET_MORE + mode;
        this._cmdGMTopic = CMD_GET_MORE + mode;
        this._cmdGMBState = CMD_GMB_STATE + mode;
        this._xslParams = { mode: mode };
        this._mode = mode;
        this._init();
    };
    Y.UI.Renderer.prototype = {
        constructor: Y.UI.Renderer,
        _init: function () {
            var _this = this;
            var renderObserver = function (t, data) {
                _this.render(data);
            };
            var gmcObserver = function (t) {
                var maxId = void 0;
                var items = Y.DOM.getElementsByClassName(_this._innerBlock, "message");
                if (items.length) {
                    maxId = items[items.length - 1].id.substring(4);
                    maxId = new BigInt(maxId).add(-1).toString();
                }
                OS.notifyObservers(_this._cmdGMBState, "loading");
                Y.sendMessage(_this._cmdGMTopic, maxId);
            };
            OS.attachObserver(this._observeTopic, renderObserver);
            OS.attachObserver(this._observeGMCmdTopic, gmcObserver);
            this._innerBlock = Y.DOM.createNode("div");
            this._container.insertBefore(this._innerBlock, this._container.firstChild);
        },
        render: function (data) {
            if (!data.more) {
                Y.XTools.destroyChilds(this._innerBlock);
                Y.DOM.empty(this._innerBlock);
            }
            if (data.render) {
                var html = Y.XTools.transformJSON(data.data, this._jstemplate, this._xslParams);
                var msgblock = Y.DOM.createNode("div", "", "msgblock", html);
                this._innerBlock.appendChild(msgblock);
                Y.UI.buildUI(msgblock);
            }
            OS.notifyObservers(this._cmdGMBState, data.moreButtonState);
        }
    };
    Y.UI.HomeRenderer = function (container) {
        return new Y.UI.Renderer(container, "home", "twitter_messages");
    };
    Y.UI.MentionsRenderer = function (container) {
        return new Y.UI.Renderer(container, "mentions", "twitter_messages");
    };
    Y.UI.DMRenderer = function (container) {
        return new Y.UI.Renderer(container, "dms", "twitter_messages");
    };
    Y.UI.SearchRenderer = function (container) {
        return new Y.UI.Renderer(container, "search", "twitter_messages");
    };
    Y.UI.UnreadCounter = function (container, mode) {
        this._container = container;
        var _this = this;
        OS.attachObserver(OB_RENDER_COUNT + mode, function (topic, data) {
            _this.render(data);
        });
    };
    Y.UI.UnreadCounter.prototype = {
        constructor: Y.UI.UnreadCounter,
        render: function (data) {
            var counter = data || 0;
            if (counter) {
                if (counter >= MAX_COUNT) {
                    counter = MAX_COUNT + "+";
                }
                this._container.innerHTML = "(" + counter + ")";
            } else {
                this._container.innerHTML = "";
            }
        }
    };
    Y.UI.HomeCounter = function (container) {
        return new Y.UI.UnreadCounter(container, "home");
    };
    Y.UI.DMSCounter = function (container) {
        return new Y.UI.UnreadCounter(container, "dms");
    };
    Y.UI.MentionsCounter = function (container) {
        return new Y.UI.UnreadCounter(container, "mentions");
    };
}());
