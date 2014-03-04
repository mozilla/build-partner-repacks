'use strict';
UI.Behaviour.Url = UI.Behaviour.extend({
    $name: 'XB_UI_Url',
    name: 'url',
    append: function XBUI_Url_append() {
    },
    activate: function XBUI_Url_activate(eventInfo) {
        var url = this.text();
        var widgetProto = this.root.widgetPrototype;
        if (!widgetProto.unit.unitPackage.permissions.allowNavigateToURL(url))
            throw new CustomErrors.ESecurityViolation('XB:URL', url);
        var navData = {
                sourceWindow: this.document.defaultView,
                unsafeURL: url,
                target: this.attribute.target,
                eventInfo: eventInfo
            };
        var statID = this.attribute.action;
        this.builder.widgetHost.navigate(navData, statID, this.root.widgetInstance);
    }
});
