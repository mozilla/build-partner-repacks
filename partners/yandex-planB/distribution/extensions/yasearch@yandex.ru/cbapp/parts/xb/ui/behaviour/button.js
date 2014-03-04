'use strict';
UI.Behaviour.Button = UI.Behaviour.WithAction.extend({
    name: 'button',
    nodeName: 'toolbarbutton',
    constructor: function XBUI_Button() {
        this.base.apply(this, arguments);
        this._menu = null;
        this._hasActionOrUrl = false;
    },
    create: function XBUI_Button_create() {
        this.base.apply(this, arguments);
        var node = this.node;
        this.on(node, 'command', this.onAction, false, this);
        this.on(node, 'click', this.onAction, false, this);
    },
    onAction: function XBUI_Button_onAction(event) {
        if (event.type == 'click' && event.button != 1)
            return;
        event.stopPropagation();
        event.preventDefault();
        if (!this._hasActionOrUrl && this._menu) {
            let box = this.node.boxObject, xulMenuElement = this._menu.node;
            if (box)
                xulMenuElement.openPopup(null, '', box.x, box.y + box.height, false, false);
            else
                xulMenuElement.openPopup(this.node, 'after_start', 0, 0, false, false);
        } else {
            this.runActions(event);
        }
    },
    change: function XBUI_Button_change() {
        this._menu = null;
        var menuChildren = this.childrenEx('menu');
        for (let [
                    ,
                    menuChild
                ] in Iterator(menuChildren))
            if (menuChild.appended) {
                this._menu = menuChild;
                break;
            }
        this._hasActionOrUrl = this.childrenEx(/^(action|url)$/).length > 0;
        if (this._hasActionOrUrl && this._menu)
            this.node.setAttribute('type', 'menu-button');
        else
            this.node.removeAttribute('type');
        this.base();
    }
});
