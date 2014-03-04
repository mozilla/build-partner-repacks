'use strict';
let (UIBehaviour = UI.Behaviour) {
    UI.Elements = {
        __proto__: null,
        'action': UIBehaviour.Action,
        'url': UIBehaviour.Url,
        'attribute': UIBehaviour.Attribute,
        'button': UIBehaviour.Button,
        'checkbox': UIBehaviour.Checkbox,
        'checked': UIBehaviour.Checked,
        'enabled': UIBehaviour.Enabled,
        'tooltip': UIBehaviour.Tooltip,
        'style': UIBehaviour.Style,
        'image': UIBehaviour.Image,
        'extra-text': UIBehaviour.ExtraText,
        'menu': UIBehaviour.Menu,
        'menu-item': UIBehaviour.MenuItem,
        'menu-separator': UIBehaviour.MenuSeparator,
        'grid': UIBehaviour.Grid,
        'column': UIBehaviour.Column,
        'row': UIBehaviour.Row,
        'cell': UIBehaviour.Cell,
        'xml': UIBehaviour.XML
    };
    UI.Elements[XB._base.consts.STR_VAL_REF_ELEM_NAME] = UIBehaviour.Computed;
}
;
let (UIElements = UI.Elements) {
    UIElements['menuitem'] = UIElements['menu-item'];
    UIElements['separator'] = UIElements['menu-separator'];
    UIElements['text'] = UIElements['style'];
    UIElements['icon'] = UIElements['image'];
}
;
