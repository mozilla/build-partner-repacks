'use strict';
UI.Behaviour.XML = UI.Behaviour.extend({
    name: 'xml',
    constructor: function XBUI_XML_constructor() {
        this.base.apply(this, arguments);
        this.value = this.element.textContent;
    },
    create: function XBUI_XML_create() {
        this.node = this.document.createTextNode(this.value);
    },
    text: function XBUI_XML_text() {
        return this.value;
    },
    readAttributes: function XBUI_XML_readAttributes() {
    },
    build: function XBUI_XML_build() {
        this._built = true;
    }
});
