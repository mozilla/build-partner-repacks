'use strict';
UI.Behaviour.Text = UI.Behaviour.extend({
    name: 'text',
    nodeName: 'label',
    constructor: function XBUI_Text_constructor() {
        this.base.apply(this, arguments);
        var text = this.element.nodeValue;
        text = strutils.normalizeString(text);
        this.value = text;
    },
    create: function XBUI_Text_create() {
        this.base();
        this.node.setAttribute('value', this.value);
    },
    text: function XBUI_Text_text() {
        return this.value;
    },
    readAttributes: function XBUI_Text_readAttributes() {
    },
    build: function XBUI_Text_build() {
        this._built = true;
    }
});
