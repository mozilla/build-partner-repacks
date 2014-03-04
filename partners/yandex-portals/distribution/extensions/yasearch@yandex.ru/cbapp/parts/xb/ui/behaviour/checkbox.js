'use strict';
UI.Behaviour.Checkbox = UI.Behaviour.extend({
    $name: 'XB_UI_Checkbox',
    name: 'checkbox',
    nodeName: 'checkbox',
    onAttribute: function XBUI_Checkbox_onAttribute(event) {
        switch (event.name) {
        case 'checked':
            if (this.getAttributeAsBool('checked'))
                this.node.setAttribute('checked', 'true');
            else
                this.node.removeAttribute('checked');
            break;
        case 'label':
            this.node.setAttribute('label', this.getAttributeAsString('label'));
            break;
        }
    }
});
