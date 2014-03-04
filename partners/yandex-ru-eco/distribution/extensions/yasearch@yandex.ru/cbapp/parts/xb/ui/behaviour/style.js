'use strict';
UI.Behaviour.Style = UI.Behaviour.extend({
    $name: 'XB_UI_Style',
    name: 'style',
    nodeName: 'hbox',
    map: {
        __proto__: null,
        'color': 'color',
        'font-weight': 'fontWeight'
    },
    onAttribute: function XBUI_Style_onAttribute(event) {
        var property = this.map[event.name];
        if (property)
            this.node.style[property] = event.value;
    }
});
