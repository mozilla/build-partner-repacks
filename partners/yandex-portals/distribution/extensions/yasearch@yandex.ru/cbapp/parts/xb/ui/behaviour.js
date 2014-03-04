'use strict';
UI.TreeItem = Base.extend({
    name: 'treeitem',
    namespaceURI: UI._consts.STR_XUL_NS,
    lazy: false,
    constructor: function XBUI_TreeItem(parent) {
        this._parent = parent;
        this._children = [];
        this._events = [];
    },
    get parent() {
        return this._parent;
    },
    get root() {
        var item = this;
        while (item.parent)
            item = item.parent;
        return item;
    },
    addChild: function XBUI_TreeItem_addChild(behaviour) {
        if (this._children.indexOf(behaviour) == -1) {
            this._children.push(behaviour);
            return true;
        }
        return false;
    },
    removeChild: function XBUI_TreeItem_removeChild(behaviour) {
        var index = this._children.indexOf(behaviour);
        if (index >= 0) {
            this._children.splice(index, 1);
            return true;
        }
        return false;
    },
    parentEx: function XBUI_TreeItem_parentEx() {
        var parent = this.parent;
        return parent ? parent.name == 'computed' ? parent.parent || null : parent : null;
    },
    children: function XBUI_TreeItem_children(name) {
        if (name)
            return this._children.filter(function (behaviour) behaviour.name == name);
        return this._children.slice();
    },
    childrenEx: function XBUI_TreeItem_childrenEx(name) {
        return this.descendants(name, 'computed');
    },
    descendants: function XBUI_TreeItem_descendants(goal, path) {
        var result = [];
        let (i = 0, len = this._children.length) {
            for (; i < len; i++) {
                let child = this._children[i];
                if (!goal || goal == child.name || goal.test && goal.test(child.name))
                    result.push(child);
                if (!path || path == child.name || path.test && path.test(child.name))
                    result = result.concat(child.descendants(goal, path));
            }
        }
        return result;
    },
    siblings: function XBUI_TreeItem_siblings(name) {
        return this.parent.children(name);
    },
    siblingsEx: function XBUI_TreeItem_siblingsEx(name) {
        return this.parentEx().childrenEx(name);
    },
    nextSibling: function XBUI_TreeItem_nextSibling(name) {
        var siblings = this.siblings(name);
        var index = siblings.indexOf(this);
        if (index == -1)
            return null;
        return siblings[index + 1] || null;
    },
    previousSibling: function XBUI_TreeItem_previousSibling(name) {
        var siblings = this.siblings(name);
        var index = siblings.indexOf(this);
        if (index < 1)
            return null;
        return siblings[index - 1] || null;
    },
    index: function XBUI_TreeItem_index() {
        return this.parent.children().indexOf(this);
    },
    indexEx: function XBUI_TreeItem_indexEx() {
        return this.parent.childrenEx(this.name).indexOf(this);
    }
});
UI.XULProducer = UI.TreeItem.extend({
    nodeName: 'box',
    jealous: false,
    innerNode: function XBUI_XULProducer_innerNode() {
        return this.node || null;
    },
    outerNode: function XBUI_XULProducer_outerNode() {
        return this.node || null;
    },
    attach: function XBUI_XULProducer_attach(child, base) {
        if (this.contains && child.name != 'computed' && this.contains.indexOf(child.name) == -1)
            return;
        base = base || child;
        do {
            base = base.nextSibling();
        } while (base && !(base.outerNode() && base.outerNode().parentNode && base.outerNode().parentNode == this.innerNode()));
        if (base)
            this.innerNode().insertBefore(child.outerNode(), base.outerNode());
        else
            this.innerNode().appendChild(child.outerNode());
    },
    detach: function XBUI_XULProducer_detach(child) {
        var childOuterNode = child.outerNode();
        if (childOuterNode && childOuterNode.parentNode)
            childOuterNode.parentNode.removeChild(childOuterNode);
    },
    _animateChildren: function XBUI_XULProducer__animateChildren(children) {
        let (i = 0, len = children.length) {
            for (; i < len; i++)
                if (children[i] instanceof UI.Behaviour)
                    children[i].birth();
        }
    },
    _translateElements: function XBUI_XULProducer__translateElements(uiArray) {
        var children = [];
        let (i = 0, len = uiArray.length) {
            for (; i < len; i++) {
                let element = uiArray[i];
                switch (element.nodeType) {
                case element.TEXT_NODE: {
                        let child = new UI.Behaviour.Text(this, element);
                        if (child.value)
                            children.push(child);
                        break;
                    }
                case element.ATTRIBUTE_NODE: {
                        let child = new UI.Behaviour.Attribute(this, element);
                        children.push(child);
                        break;
                    }
                case element.ELEMENT_NODE: {
                        if (element.namespaceURI == XB._base.consts.STR_UI_NS) {
                            let role = element.localName, Behaviour = UI.Elements[role];
                            if (Behaviour) {
                                let child = new Behaviour(this, element);
                                children.push(child);
                            } else
                                this.logger.warn('Unknown UI element: ' + role);
                        } else {
                            let child = new UI.Behaviour.XML(this, element);
                            children.push(child);
                        }
                        break;
                    }
                case element.COMMENT_NODE:
                    break;
                default:
                    this.logger.warn('Unknown UI node type: ' + element.nodeType);
                }
            }
        }
        return children;
    }
});
UI.Behaviour = UI.XULProducer.extend({
    name: 'generic',
    constructor: function XBUI_Behaviour(parent, element) {
        if (!(parent instanceof UI.TreeItem))
            throw new CustomErrors.EArgType('parent', 'TreeItem', parent);
        if (!(element instanceof Ci.nsIDOMNode))
            throw new CustomErrors.EArgType('element', 'nsIDOMNode', element);
        this.base(parent);
        this.attribute = Object.create(null);
        this.builder = this.parent.builder;
        this.document = this.parent.document;
        this.logger = this.parent.logger;
        this.parent.addChild(this);
        this.element = element;
    },
    heirs: function XBUI_Behaviour_heirs() {
        return this.children();
    },
    applyAttributes: function XBUI_Behaviour_applyAttributes() {
        var attribute = this.attribute;
        for (let name in attribute) {
            this.onAttribute({
                name: name,
                value: attribute[name]
            });
        }
    },
    setAttribute: function XBUI_Behaviour_setAttribute(name, value, inherited) {
        inherited = inherited || false;
        if (inherited) {
            if (this.attribute[name] !== undefined)
                return;
        } else {
            this.attribute[name] = value;
            if (this.node)
                this.node.setAttribute('xb-ui-' + name, value);
        }
        if (this.inheritAttributes && this.inheritAttributes[name])
            this.inheritAttribute(name, value);
        else if (!inherited || this.attribute[name] === undefined)
            this.onAttribute({
                name: name,
                value: value,
                inherited: inherited
            });
    },
    getAttribute: function XBUI_Behaviour_getAttribute(name) {
        return this.attribute[name];
    },
    getAttributeAsBool: function XBUI_Behaviour_getAttributeAsBool(name) {
        return ('' + this.getAttribute(name)).toLowerCase() == 'true';
    },
    getAttributeAsNumber: function XBUI_Behaviour_getAttributeAsNumber(name) {
        return parseInt(this.getAttribute(name), 10) || 0;
    },
    getAttributeAsString: function XBUI_Behaviour_getAttributeAsString(name) {
        return '' + (this.getAttribute(name) || '');
    },
    inheritanceAttributesEx: function XBUI_Behaviour_inheritanceAttributesEx(heir, attributes) {
        if (!this.inheritAttributes)
            return attributes;
        function intersect(a, b) {
            var result = {};
            for (let i in a)
                if (b[i])
                    result[i] = 1;
            return result;
        }
        attributes = intersect(attributes, this.inheritAttributes);
        if (sysutils.isEmptyObject(attributes))
            return;
        for (let name in attributes) {
            if (this.attribute[name] != undefined) {
                heir.setAttribute(name, this.attribute[name], true);
                delete attributes[name];
            }
        }
        var parent = this.parentEx();
        if (parent)
            attributes = parent.inheritanceAttributesEx(heir, attributes);
        return attributes;
    },
    inheritanceAttributes: function XBUI_Behaviour_inheritanceAttributes() {
        try {
            if (this.succeedAttributes && this.parent)
                this.parent.inheritanceAttributesEx(this, this.succeedAttributes);
        } catch (e) {
            this.logger.error('Failed in XBUI_Behaviour_inheritanceAttributes. ' + strutils.formatError(e));
            this.logger.debug(e.stack);
        }
    },
    inheritAttribute: function XBUI_Behaviour_inheritAttribute(name, value) {
        var heirs = this.heirs();
        for (let [
                    ,
                    heir
                ] in Iterator(heirs))
            if (heir.succeedAttributes && heir.succeedAttributes[name] || heir.inheritAttributes && heir.inheritAttributes[name])
                heir.setAttribute(name, value, true);
    },
    onAttribute: function XBUI_Behaviour_onAttribute(event) {
        switch (event.name) {
        case 'lazy':
            this.lazy = this.getAttributeAsBool(event.name);
            break;
        }
    },
    change: function XBUI_Behaviour_change(event) {
        if (this.parent)
            this.parent.change(event);
    },
    text: function XBUI_Behaviour_text() {
        var children = this.children(), result = '';
        var textNodeNames = [
                'computed',
                'text',
                'xml'
            ];
        let (i = 0, len = children.length) {
            for (; i < len; i++) {
                if (textNodeNames.indexOf(children[i].name) != -1)
                    result += children[i].text();
            }
        }
        return result;
    },
    textAsBool: function XBUI_Behaviour_textAsBool() {
        return this.text().toLowerCase() == 'true';
    },
    birth: function XBUI_Behaviour_birth() {
        this.readAttributes();
        this.create();
        this.append();
        this.applyAttributes();
        this.inheritanceAttributes();
        if (!this.lazy)
            this.build();
    },
    readAttributes: function XBUI_Behaviour_readAttributes() {
        var attributes = this.element.attributes;
        let (i = attributes.length) {
            for (; i--;) {
                let attribute = attributes[i];
                this.attribute[attribute.name] = attribute.value;
            }
        }
    },
    create: function XBUI_Behaviour_create() {
        this.node = this.document.createElementNS(this.namespaceURI, this.nodeName);
        this.node.setAttribute('xb-name', this.name);
    },
    get appended() {
        return !!this.node && !!this.node.parentNode;
    },
    append: function XBUI_Behaviour_append() {
        if (this.jealous) {
            let siblings = this.siblingsEx(this.name);
            for (let [
                        ,
                        sibling
                    ] in Iterator(siblings))
                if (sibling != this) {
                    sibling.parent.detach(sibling);
                }
        }
        this.parent.attach(this);
    },
    remove: function XBUI_Behaviour_remove() {
        if (!this.appended)
            return;
        this.parent.detach(this);
        if (this.jealous) {
            let siblings = this.siblingsEx(this.name);
            for (let [
                        ,
                        sibling
                    ] in Iterator(siblings))
                if (sibling != this) {
                    sibling.parent.attach(sibling);
                    break;
                }
        }
    },
    build: function XBUI_Behaviour_build() {
        var uiArray = Array.prototype.slice.apply(this.element.childNodes);
        uiArray = uiArray.concat(Array.prototype.slice.apply(this.element.attributes));
        this._animateChildren(this._translateElements(uiArray));
        this.change();
        this._built = true;
    },
    destroy: function XBUI_Behaviour_destroy() {
        this.remove();
        if (this.parent)
            this.parent.removeChild(this);
        this.removeEventListeners();
        var children = this.children();
        let (i = 0, len = children.length) {
            for (; i < len; i++)
                children[i].destroy();
        }
        this.builder.cleanNode(this.node);
        this.builder.removeNode(this.node);
        delete this.element;
        delete this.node;
        delete this.builder;
        delete this.document;
        delete this.logger;
    },
    transform: function XBUI_Behaviour_transform(nodeName) {
        this.nodeName = nodeName;
        var oldNode = this.node;
        this.create(nodeName);
        if (oldNode.parentNode)
            oldNode.parentNode.replaceChild(this.node, oldNode);
        while (oldNode.firstChild)
            this.node.appendChild(oldNode.firstChild);
    },
    removeEventListeners: function XBUI_Behaviour_removeEventListeners() {
        let (i = this._events.length) {
            for (; i--;)
                this._events[i].disable();
        }
        this._events = [];
    },
    on: function XBUI_Behaviour_on(node, type, listener, capture, context) {
        if (!node)
            return;
        this._events.push(new UI.EventListener(node, type, listener, capture, context));
    },
    _built: false
});
