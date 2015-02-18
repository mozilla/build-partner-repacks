"use strict";
function listener(message) {
    switch (message.topic) {
    case "set-image":
        setImage(message.data);
        break;
    }
}
function setImage(src) {
    document.getElementById("preview").setAttribute("src", src);
    document.getElementById("throbber").setAttribute("hidden", !!src);
}
var notunloaded = true;
function unload() {
    if (!notunloaded)
        return;
    window.platform.onMessage.removeListener(listener);
    notunloaded = false;
}
window.onunload = unload;
window.onbeforeunload = unload;
window.platform.onMessage.addListener(listener);
window.onclick = function () {
    window.platform.sendMessage({ topic: "close" });
};
