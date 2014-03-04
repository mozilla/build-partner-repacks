'use strict';
UI.Behaviour.Widget = UI.XULProducer.extend({
    name: 'widget',
    constructor: function XBUI_Widget(widgetInstance, toolbarElement, builder) {
        this.base(null);
        this.logger = UI.getLogger('Behaviour');
        this._widgetInstance = widgetInstance;
        this.builder = builder;
        this.node = toolbarElement;
        this.document = this.node.ownerDocument;
        this.node.setAttribute('xb-widget', 'true');
        this._animateChildren(this._translateElements(this.widgetPrototype.contentNodes));
        this._built = true;
    },
    destroy: function XBUI_Widget_destroy() {
        var children = this.children();
        let (i = children.length) {
            for (; i--;)
                children[i].destroy();
        }
        this.builder.cleanNode(this.node);
        delete this.element;
        delete this.node;
        delete this.builder;
        delete this.document;
        delete this.logger;
    },
    change: function XBUI_Widget_change() {
    },
    get widgetInstance() {
        return this._widgetInstance;
    },
    get widgetPrototype() {
        return this.widgetInstance.prototype;
    }
});
