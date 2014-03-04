'use strict';
UI.Behaviour.Menu = UI.Behaviour.WithAction.extend({
    name: 'menu',
    nodeName: 'menupopup',
    jealous: true,
    create: function XBUI_Menu_create() {
        this.base.apply(this, arguments);
        this.on(this.node, 'popupshowing', this.onShowing, false, this);
    },
    onShowing: function XBUI_Menu_onShowing(event) {
        event.stopPropagation();
        if (!this._built)
            this.build();
        this.runActions(event);
    }
});
UI.Behaviour.MenuItem = UI.Behaviour.WithAction.extend({
    $name: 'XB_UI_MenuItem',
    name: 'menu-item',
    nodeName: 'menuitem',
    create: function XBUI_MenuItem_create() {
        this.base.apply(this, arguments);
        var node = this.node;
        this.on(node, 'command', this.onAction, false, this);
        this.on(node, 'click', this.onAction, false, this);
    },
    onAction: function XBUI_MenuItem_onAction(event) {
        if (event.type == 'click' && event.button != 1)
            return;
        event.stopPropagation();
        event.preventDefault();
        this.runActions(event);
    },
    attach: function XBUI_MenuItem_attach(child) {
        if (child.name == 'menu-item')
            this.base.apply(this, arguments);
        if (child.name == 'menu') {
            if (this.nodeName == 'menuitem')
                this.transform('menu');
            this.base.apply(this, arguments);
        }
    },
    detach: function XBUI_MenuItem_detach(child) {
        this.base.apply(this, arguments);
        if (child.name == 'menu' && this.nodeName == 'menu') {
            let children = this.childrenEx('menu');
            if (children.length == 0)
                this.transform('menuitem');
        }
    },
    change: function XBUI_MenuItem_change() {
        var children = this.childrenEx(/^(style|image|enabled|checked|extra\-text)$/), label = '', image = '', extraText = '', enabled = true, checked = false;
        let (i = children.length) {
            for (; i-- > 0;) {
                let child = children[i];
                switch (child.name) {
                case 'style':
                    label += child.text();
                    break;
                case 'extra-text':
                    extraText += child.text();
                    break;
                case 'image':
                    image = child.url();
                    break;
                case 'enabled':
                    enabled = child.enabled();
                    break;
                case 'checked':
                    checked = child.checked();
                    break;
                }
            }
        }
        this.node.setAttribute('label', label);
        if (extraText) {
            if (extraText != this.node.getAttribute('acceltext')) {
                let parent = this.node.parentNode;
                let next = this.node.nextSibling;
                if (parent)
                    parent.removeChild(this.node);
                this.node.setAttribute('acceltext', extraText);
                if (parent) {
                    if (next)
                        parent.insertBefore(this.node, next);
                    else
                        parent.appendChild(this.node);
                }
            }
        } else
            this.node.removeAttribute('acceltext');
        if (image) {
            this.node.setAttribute('class', 'menuitem-iconic menuitem-with-favicon');
            this.node.setAttribute('image', image);
        } else {
            this.node.removeAttribute('class');
            this.node.removeAttribute('image');
        }
        if (checked) {
            this.node.setAttribute('type', 'checkbox');
            this.node.setAttribute('autocheck', 'false');
            this.node.setAttribute('checked', 'true');
        } else {
            this.node.removeAttribute('type');
            this.node.removeAttribute('autocheck');
            this.node.removeAttribute('checked');
        }
        if (enabled)
            this.node.removeAttribute('disabled');
        else
            this.node.setAttribute('disabled', 'true');
    }
});
UI.Behaviour.MenuSeparator = UI.Behaviour.extend({
    nodeName: 'menuseparator',
    build: function XBUI_MenuSeparator_build() {
        this._built = true;
    }
});
