"use strict";
function init() {
    document.removeEventListener("DOMContentLoaded", init, false);
    var linkArr = getElementsByClassName("b-suggest-menu__link");
    var removeElem = "";
    for (var i = 0; i < linkArr.length; i++) {
        linkArr[i].onclick = function () {
            removeElem = getElementsByClassName("b-suggest-menu__item_selected")[0];
            for (var j = 0; j < linkArr.length; j++) {
                removeClass(removeElem, "b-suggest-menu__item_selected");
            }
            addClass(this.parentNode, "b-suggest-menu__item_selected");
            var rel = this.getAttribute("rel");
            var imgClass = "b-suggest__img b-suggest__img_" + rel;
            document.getElementById("j-b-suggest-img").className = imgClass;
        };
    }
}
document.addEventListener("DOMContentLoaded", init, false);
function getElementsByClassName(classname, node) {
    if (!node) {
        node = document.getElementsByTagName("body")[0];
    }
    var a = [];
    var re = new RegExp(classname);
    var els = node.getElementsByTagName("*");
    for (var i = 0, j = els.length; i < j; i++) {
        if (re.test(els[i].className)) {
            a.push(els[i]);
        }
    }
    return a;
}
function hasClass(ele, cls) {
    return ele.className.match(new RegExp(/\bb-suggest-menu__item_selected\b/));
}
function addClass(ele, cls) {
    if (!this.hasClass(ele, cls)) {
        ele.className += " " + cls;
    }
}
function removeClass(ele, cls) {
    if (hasClass(ele, cls)) {
        var reg = new RegExp(/\bb-suggest-menu__item_selected\b/);
        ele.className = ele.className.replace(reg, "");
    }
}
