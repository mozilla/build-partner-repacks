Y.UI.Translate = function (container) {
    var message = container.getAttribute("message");
    if (message) {
        var translate = tr("&" + message + ";");
        container.innerHTML = translate;
    }
};
Y.UI.TranslateTitle = function (container) {
    var message = container.getAttribute("title-message");
    if (message) {
        var translate = tr("&" + message + ";");
        container.setAttribute("title", translate);
    }
};
