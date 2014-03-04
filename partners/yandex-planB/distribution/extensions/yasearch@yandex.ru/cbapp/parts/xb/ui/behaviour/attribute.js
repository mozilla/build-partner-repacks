'use strict';
UI.Behaviour.Attribute = UI.Behaviour.extend({
    $name: 'XB_UI_Attribute',
    name: 'attribute',
    append: function XBUI_Attribute_append() {
        var parent = this.parentEx();
        if (parent)
            parent.setAttribute(this.element.name, this.element.value);
    },
    destroy: function XBUI_Attribute_destroy() {
        var parent = this.parentEx();
        if (parent)
            parent.setAttribute(this.element.name, null);
        this.base();
    },
    readAttributes: function XBUI_Attribute_readAttributes() {
    },
    applyAttributes: function XBUI_Attribute_applyAttributes() {
    },
    build: function XBUI_Attribute_build() {
        this._built = true;
    }
});
