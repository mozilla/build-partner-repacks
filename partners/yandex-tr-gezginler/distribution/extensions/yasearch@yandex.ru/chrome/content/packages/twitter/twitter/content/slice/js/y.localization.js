Y.l8n = {
    entities: {},
    localize: function (str) {
        return str.replace(/&\S+;/, function (x) {
            var key = x.slice(1, -1);
            var entities = Y.l8n.entities;
            var value = Y.l8n.entities[key];
            var res = x;
            if (key in entities) {
                res = entities[key];
            } else {
                res = null;
            }
            if (!res) {
                res = "";
            }
            return res;
        });
    }
};
window.tr = function (str) {
    return Y.l8n.localize(str);
};
