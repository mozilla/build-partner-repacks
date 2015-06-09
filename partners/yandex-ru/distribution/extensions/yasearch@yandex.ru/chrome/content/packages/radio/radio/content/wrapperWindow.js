(function () {
    var cs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    var log = function (text) {
        return cs.logStringMessage("#####: " + text);
    };
    var box = document.getElementById("id_box1");
    var au = new Audio();
    if (au.canPlayType("audio/mp3")) {
        log("xul init html5");
        box.appendChild(au);
        var timer = null;
        function DispatchEvent(topic, time) {
            if (timer) {
                timer.cancel();
                timer = null;
            }
            if (time) {
                timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
                timer.init(function () {
                    timer = null;
                    DispatchEvent(topic);
                }, time, timer.TYPE_ONE_SHOT);
            } else {
                if (topic) {
                    var event = document.createEvent("Event");
                    event.initEvent(topic, true, true);
                    document.dispatchEvent(event);
                }
            }
        }
        au.addEventListener("waiting", function (e) {
            log("event " + e.type);
            DispatchEvent("ShowThrobber");
            DispatchEvent("SoundFail", 10000);
        }, false);
        au.addEventListener("playing", function (e) {
            log("event " + e.type);
            DispatchEvent("HideThrobber");
        }, false);
        au.addEventListener("error", function (e) {
            log("event " + e.type);
            DispatchEvent("SoundFail");
        }, false);
        au.addEventListener("progress", function (e) {
        }, false);
        window.outerInfo = {
            doc: document,
            flash: {
                SetStation: function (src) {
                    DispatchEvent();
                    au.src = src || "";
                },
                PlayStream: function () {
                    DispatchEvent();
                    au.play();
                },
                StopStream: function () {
                    DispatchEvent();
                    au.pause();
                }
            }
        };
    } else {
        log("xul init flash");
        var bro = document.createElement("browser");
        bro.setAttribute("type", "chrome");
        bro.setAttribute("flex", "1");
        bro.setAttribute("disablehistory", "true");
        box.appendChild(bro);
        bro.setAttribute("src", "http://yastatic.net/bar/1.46/swf/player.html");
        bro.addEventListener("DOMContentLoaded", function () {
            window.outerInfo = {
                doc: bro.contentDocument,
                flash: bro.contentDocument.getElementById("player")
            };
        }, true, true);
    }
}());
