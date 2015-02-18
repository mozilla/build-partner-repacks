window.__debug_Tools_ = function () {
    var ws = Y.windowSize;
    var addH = 980 - ws[1];
    ws[1] = 980;
    ws[0] = ws[0] + 50;
    var copy = function (src, dest) {
        dest = dest || {};
        if (src) {
            for (var i in src) {
                if (src.hasOwnProperty(i)) {
                    dest[i] = src[i];
                }
            }
        }
        return dest;
    };
    var cons = document.createElement("div");
    copy({
        padding: "5px 0 0 0",
        margin: "0",
        height: addH - 40 + "px",
        overflow: "auto"
    }, cons.style);
    function num(n) {
        return (n < 10 ? "0" : "") + n;
    }
    var clrs = [
            "#ffffff",
            "#e9e9e9"
        ], ci = 0;
    var colors = {
        r: "#880000",
        g: "#008800",
        b: "#000088"
    };
    var htmlconsole = function (str, color) {
        str = str || "***** empty str *****";
        var date = new Date();
        var css = {
            padding: "0",
            margin: "0",
            backgroundColor: clrs[ci = 1 - ci]
        };
        if (color) {
            css.color = colors[color] || color;
        }
        var txt = "[" + num(date.getHours()) + ":" + num(date.getMinutes()) + ":" + num(date.getSeconds()) + "] - " + str;
        var item = document.createElement("div");
        copy(css, item.style);
        item.appendChild(document.createTextNode(txt));
        cons.appendChild(item);
    };
    var aclear = document.createElement("a");
    aclear.innerHTML = "CLEAR";
    aclear.onclick = function () {
        cons.innerHTML = "";
        return false;
    };
    document.body.appendChild(aclear);
    document.body.appendChild(cons);
    Y.log = htmlconsole;
};
