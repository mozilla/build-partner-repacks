'use strict';
UI.Behaviour.Checked = UI.Behaviour.extend({
    $name: 'XB_UI_Checked',
    name: 'checked',
    attach: function XBUI_Checked_attach() {
    },
    create: function XBUI_Checked_create() {
    },
    checked: function XBUI_Checked_checked() {
        return this.textAsBool();
    }
});
