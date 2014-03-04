'use strict';
var pattern = /^(padding(-(left|right|top|bottom))?)|(border(-(left|right|top|bottom))?(-(color|width|style)))?$/;
var gridInheritAttributes = {
        __proto__: null,
        'width': 1,
        'min-width': 1,
        'max-width': 1,
        'height': 1,
        'min-height': 1,
        'max-height': 1,
        'padding': 1,
        'padding-top': 1,
        'padding-right': 1,
        'padding-bottom': 1,
        'padding-left': 1,
        'border': 1,
        'border-width': 1,
        'border-style': 1,
        'border-color': 1,
        'border-top': 1,
        'border-right': 1,
        'border-bottom': 1,
        'border-left': 1,
        'border-top-width': 1,
        'border-right-width': 1,
        'border-bottom-width': 1,
        'border-left-width': 1,
        'border-top-style': 1,
        'border-right-style': 1,
        'border-bottom-style': 1,
        'border-left-style': 1,
        'border-top-color': 1,
        'border-right-color': 1,
        'border-bottom-color': 1,
        'border-left-color': 1,
        'v-align': 1,
        'h-align': 1
    };
UI.Behaviour.Grid = UI.Behaviour.extend({
    $name: 'XB_UI_Grid',
    name: 'grid',
    nodeName: 'table',
    namespaceURI: UI._consts.STR_HTML_NS,
    onAttribute: function XBUI_Grid_onAttribute(event) {
        var name = event.name, value = event.value || '';
        this.node.setAttribute('xb-ui-' + name, value);
        if (name in gridInheritAttributes) {
            if (!isNaN(parseInt(value, 10)))
                value = parseInt(value, 10) + 'px';
            this.node.style[strutils.camelize(name)] = value;
        }
    },
    inheritanceAttributesEx: function XBUI_Grid_inheritanceAttributesEx(heir, attributes) {
        if (heir.name == 'cell') {
            let index = heir.indexEx();
            let column = this.childrenEx('column')[index];
            if (column)
                attributes = column.inheritanceAttributesEx(heir, attributes);
        }
        this.base(heir, attributes);
    },
    change: function XBUI_Grid_change() {
        var matrix = [], rows = this.childrenEx(/^row$/);
        let (i = 0) {
            for (; i < rows.length; i++)
                matrix[i] = rows[i].childrenEx(/^cell$/);
        }
        let (i = matrix.length) {
            for (; i--;)
                let (j = matrix[i].length) {
                    for (; j--;)
                        matrix[i][j].reset();
                }
        }
        let (i = matrix.length) {
            for (; i--;)
                let (j = matrix[i].length) {
                    for (; j--;) {
                        if (matrix[i][j].isMerge('up'))
                            matrix[i - 1][j].span.up = matrix[i][j].span.up + 1;
                        if (matrix[i][j].isMerge('left'))
                            matrix[i][j - 1].span.left = matrix[i][j].span.left + 1;
                    }
                }
        }
        let (i = matrix.length) {
            for (; i--;)
                let (j = matrix[i].length) {
                    for (; j--;)
                        matrix[i][j].apply();
                }
        }
    }
});
UI.Behaviour.Column = UI.Behaviour.extend({
    name: 'column',
    nodeName: 'col',
    namespaceURI: UI._consts.STR_HTML_NS,
    inheritAttributes: gridInheritAttributes,
    inheritanceAttributesEx: function XBUI_Column_inheritanceAttributesEx(heir, attributes) {
        var parent = this.parent;
        this._parent = null;
        attributes = this.base(heir, attributes);
        this._parent = parent;
        return attributes;
    },
    heirs: function XBUI_Column_heirs() {
        var heirs = [], index = this.index(), rows = this.parent.childrenEx(/^row$/);
        for (let [
                    ,
                    row
                ] in Iterator(rows)) {
            let cells = row.childrenEx(/^cell$/);
            if (cells[index])
                heirs.push(cells[index]);
        }
        return heirs;
    }
});
UI.Behaviour.Row = UI.Behaviour.extend({
    name: 'row',
    nodeName: 'tr',
    namespaceURI: UI._consts.STR_HTML_NS,
    inheritAttributes: gridInheritAttributes
});
UI.Behaviour.Cell = UI.Behaviour.extend({
    name: 'cell',
    nodeName: 'td',
    namespaceURI: UI._consts.STR_HTML_NS,
    succeedAttributes: gridInheritAttributes,
    constructor: function XBUI_Ceil() {
        this.base.apply(this, arguments);
    },
    reset: function XBUI_Ceil_reset() {
        this.span = {
            'left': 0,
            'up': 0
        };
    },
    apply: function XBUI_Ceil_apply() {
        if (!this.node)
            return;
        if (!!this.isMerge() == !!this.node.parentNode) {
            if (this.isMerge())
                this.parent.detach(this);
            else
                this.parent.attach(this);
        }
        var map = {
                'up': 'rowspan',
                'left': 'colspan'
            };
        for (let i in map)
            if (this.span[i] > 0)
                this.node.setAttribute(map[i], this.span[i] + 1);
            else
                this.node.removeAttribute(map[i]);
    },
    onAttribute: function XBUI_Ceil_onAttribute(event) {
        if (!this.node)
            return;
        var name = event.name;
        if (!(name in gridInheritAttributes))
            return;
        var value = event.value || '';
        switch (name) {
        case 'h-align':
            this.node.setAttribute('align', value);
            break;
        case 'v-align':
            this.node.setAttribute('valign', value);
            break;
        default: {
                let fragments = value.match(/^\s*(\d+)\s*(px|%)?\s*$/);
                if (fragments) {
                    let [
                            ,
                            number,
                            unit
                        ] = fragments;
                    value = number + (unit || 'px');
                }
                this.node.style[strutils.camelize(name)] = value;
            }
        }
    },
    isMerge: function XBUI_Ceil_isMerge(direction) {
        if (!direction)
            return this.isMerge('left') || this.isMerge('up');
        var value;
        return (value = this.attribute['merge-' + direction]) && XB.types.xToBool(value);
    }
});
