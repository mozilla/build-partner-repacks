'use strict';
UI.Behaviour.Image = UI.Behaviour.extend({
    $name: 'XB_UI_Image',
    name: 'image',
    nodeName: 'image',
    attach: function XBUI_Image_attach() {
    },
    change: function XBUI_Image_change() {
        if (this.parent && this.parent.name == 'menu-item')
            this.base();
        var url = this.url().replace(/(['\\])/g, '\\$1');
        this.node.style.setProperty('list-style-image', 'url(\'' + url + '\')', 'important');
    },
    url: function XBUI_Image_url() {
        return this._resolveURI(this.text());
    },
    _resolveURI: function XBUI_Image__resolveURI(spec) {
        if (!spec)
            return '';
        if (/^http(s)?:\/\//i.test(spec)) {
            let widgetProto = this.root.widgetPrototype;
            if (!widgetProto.unit.unitPackage.permissions.allowRequestToURL(spec)) {
                this.logger.warn('Widget \'' + widgetProto.id + '\' can\'t access url \'' + spec + '\' due to its security manifest');
                return '';
            }
        } else if (spec.indexOf('data:image/') == 0)
            return spec;
        else
            spec = this.root.widgetPrototype.unit.unitPackage.resolvePath(spec);
        var uri = misc.tryCreateFixupURI(spec);
        return uri ? uri.spec : '';
    }
});
