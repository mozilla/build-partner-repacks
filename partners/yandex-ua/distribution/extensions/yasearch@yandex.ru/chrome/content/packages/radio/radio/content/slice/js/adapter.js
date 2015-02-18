window.YBRadio = window.YBRadio || {};
YBRadio.adapter = function () {
    function getExternal() {
        return window.widgetAdapter;
    }
    var handlers = {};
    return {
        init: function (cb) {
            handlers = cb;
            var extr = getExternal();
            extr.on(handlers);
        },
        fireEvent: function (topic) {
            handlers[topic]();
        },
        getString: function (key) {
            return getExternal().getLocalizedString(key);
        },
        getPlayState: function () {
            return getExternal().getPlayState();
        },
        getAll: function () {
            return getExternal().getAll();
        },
        startCommand: function () {
            return getExternal().startCommand;
        },
        play: function (id, state) {
            getExternal().play(id, state);
        },
        add: function (data) {
            return getExternal().add(data);
        },
        edit: function (id, data) {
            return getExternal().edit(id, data);
        },
        remove: function (id) {
            getExternal().remove(id);
        },
        newName: function () {
            return getExternal().newName();
        },
        getChBoxPlay: function () {
            return getExternal().getChBoxPlay();
        },
        saveChBoxPlay: function (value) {
            return getExternal().saveChBoxPlay(value);
        }
    };
}();
