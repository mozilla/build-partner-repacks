'use strict';
UI.Behaviour.Tooltip = UI.Behaviour.extend({
    $name: 'XB_UI_Tooltip',
    name: 'tooltip',
    nodeName: 'tooltip',
    create: function XBUI_Tooltip_create() {
        this.base();
        this.node.appendChild(this.node.ownerDocument.createElementNS(UI._consts.STR_XUL_NS, 'box'));
        this.on(this.node, 'popupshowing', this.onShowing, false, this);
    },
    onShowing: function XBUI_Tooltip_onShowing() {
        if (!this._built)
            this.build();
    },
    append: function XBUI_Tooltip_append() {
        var owners = [
                'widget',
                'button',
                'image',
                'menu-item'
            ], owner = this.parent;
        while (owner && owners.indexOf(owner.name) == -1)
            owner = owner.parent;
        if (owner) {
            this.tooltipId = 'xb-tooltip-' + Math.floor(Math.random() * 10000);
            this.node.setAttribute('id', this.tooltipId);
            owner.node.setAttribute('tooltip', this.tooltipId);
        }
        this.root.attach(this);
    },
    innerNode: function XBUI_Tooltip_innerNode() {
        return this.node.firstChild;
    }
});
