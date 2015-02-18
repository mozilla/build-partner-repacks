var Locale = function (url) {
    this.entities = this.getDTD(url);
};
Locale.prototype = {
    getDTD: function (url) {
        var request = new XMLHttpRequest();
        request.open("get", url, false);
        request.overrideMimeType("text/plain");
        request.send();
        var text = request.responseText;
        return this.parseDTD(text);
    },
    parseDTD: function (str) {
        var entityRx = /<!ENTITY.*?>/g, keyValueRx = /<!ENTITY\s+(\S+)\s+("|')(.*?)\2/, res, tres, key, value, entities = {};
        while (res = entityRx.exec(str)) {
            tres = keyValueRx.exec(res);
            key = tres[1];
            value = tres[3];
            if (key) {
                entities[key] = value || "";
            }
        }
        return entities;
    },
    getEntity: function (key) {
        return this.entities[key];
    },
    localizeTree: function (aElement) {
        var element = aElement || document.documentElement;
        var elements = element.getElementsByTagName("*");
        for (var element, i = 0, l = elements.length; i < l; ++i) {
            element = elements[i];
            if (element.hasAttribute("locale-content")) {
                var localizedValue = this.getEntity(element.getAttribute("locale-content"));
                if (typeof localizedValue == "undefined") {
                    localizedValue = element.getAttribute("locale-content");
                }
                switch (String(element.tagName).toLowerCase()) {
                case "input":
                case "textarea":
                    element.value = localizedValue;
                    break;
                default:
                    element.innerHTML = localizedValue;
                }
            }
            if (element.hasAttribute("locale-content-title")) {
                element.setAttribute("title", this.getEntity(element.getAttribute("locale-content-title")));
            }
        }
    }
};
