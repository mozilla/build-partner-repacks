Y.UI = {};
Y.UI.buildUI = function (containerElement, childOnly) {
    var elementsCollection = containerElement.getElementsByTagName("*");
    var elements = childOnly ? [] : [containerElement];
    for (var i = 0, l = elementsCollection.length; i < l; ++i) {
        elements.push(elementsCollection[i]);
    }
    var inits = [];
    var testRx = /\-ui\-(\w+)/g;
    var test = null;
    for (var element, className, i = 0, l = elements.length; i < l; ++i) {
        element = elements[i];
        className = element.className;
        while (test = testRx.exec(className)) {
            if (test && test.length > 1) {
                var constructorname = test[1];
                var constructor = Y.UI[constructorname];
                if (constructor) {
                    inits.push({
                        constructor: constructor,
                        element: element
                    });
                }
            }
        }
    }
    function runInits() {
        for (var i = 0, l = inits.length; i < l; ++i) {
            try {
                new inits[i].constructor(inits[i].element);
            } catch (e) {
                Y.sendMessage("y.ui.js error", e);
                Components.reportError(e);
            }
        }
    }
    runInits();
};
Y.UI.CSSFixer = function (container) {
    var className = "";
    switch (true) {
    case Y.browser.ie:
        className = "browser-ie";
        break;
    case Y.browser.ff:
        className = "browser-ff";
        break;
    }
    Y.DOM.addClass(container, className);
};
