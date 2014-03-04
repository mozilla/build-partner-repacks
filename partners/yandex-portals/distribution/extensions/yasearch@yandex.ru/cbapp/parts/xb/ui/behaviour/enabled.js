'use strict';
UI.Behaviour.Enabled = UI.Behaviour.extend({
    $name: 'XB_UI_Enabled',
    name: 'enabled',
    attach: function XBUI_Enabled_attach() {
    },
    create: function XBUI_Enabled_create() {
    },
    enabled: function XBUI_Enabled_enabled() {
        return this.textAsBool();
    }
});
