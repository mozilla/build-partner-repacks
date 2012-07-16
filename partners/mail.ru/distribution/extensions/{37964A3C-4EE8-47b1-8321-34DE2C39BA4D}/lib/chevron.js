function MRChevron(elChevron) {
    this.debugZone = "MRChevron";
    this.chevron_toolbar = '';
    this.chevron_btn = '';
    this.informers = [];
    this.updateTimer = null;
    this.chevronControl = elChevron;
    this.toolbarObject = this.chevronControl.toolbarObject;
    this.win = this.toolbarObject.win;
    this.doc = this.win.document;
};
MRChevron.prototype.get_first_item = function() {
    var elCur = this.chevronControl.firstChild;
    while(elCur.nodeName == "hbox" && elCur.firstChild)
    {
        elCur = elCur.firstChild;
    }
    return elCur;
};

MRChevron.prototype.get_next_item = function(elCur) {
    if (elCur == null) {
        return null;
    }
    if (elCur.nextSibling != null) {
        elCur = elCur.nextSibling;
        if (elCur.nodeName == 'hbox' && elCur.childNodes.length > 0) {
            return elCur.firstChild;
        }
        return elCur;
    }
    else if (elCur.parentNode.nodeName == 'hbox') {
        if(elCur.parentNode == this.chevronControl)
        {
            return null;
        }
        return this.get_next_item(elCur.parentNode);
    }
    return null;
};
MRChevron.prototype.clear_chevron = function() {
    while (this.chevronControl.mMenu.firstChild != null) {
        this.chevronControl.mMenu.removeChild(this.chevronControl.mMenu.firstChild)
    }
};

MRChevron.prototype.rebuild_chevron = function() {
    this.clear_chevron();
    for(var i = this.get_first_item(); i != null; i = this.get_next_item(i)) {
        if( i == this.chevronControl.mSpring )
        {
            return;
        }
        switch (i.nodeName) {
            case 'toolbarspring':
                {
                }
                break;
            case 'toolbarspacer':
                {
                    var elSeparator = this.doc.createElement('menuseparator');
                    elSeparator.setAttribute('style', 'display: none');
                    this.chevronControl.mMenu.appendChild(b);
                }
                break;
            case 'toolbarseparator':
                {
                    this.chevronControl.mMenu.appendChild(this.doc.createElement('menuseparator'));
                }
                break;
            default:
                {
                    var element = this.createMenuElement(i);
                    if (element) {
                        this.chevronControl.mMenu.appendChild(element);
                    }
                }
                break;
        }
    }
};

MRChevron.prototype.element_width = function(elment) {
    if (elment.nodeName != 'toolbarspring') {
        var elementStyle = this.doc.defaultView.getComputedStyle(elment, '');
        var marginLeft = elementStyle.getPropertyValue('margin-left');
        marginLeft = marginLeft ? Math.round(parseFloat(marginLeft)) : 0;
        var marginRight = elementStyle.getPropertyValue('margin-right');
        marginRight = marginRight ? Math.round(parseFloat(marginRight)) : 0;
        return elment.boxObject.width + marginLeft + marginRight
    }
    return 0
};

MRChevron.prototype.search_width = function() {
    return this.element_width(this.toolbarObject.mSearchCtrl.parentNode)
        - this.element_width(this.toolbarObject.mSearchCtrl)
        + parseInt(this.toolbarObject.mSearchCtrl.getAttribute("minwidth"));
    
    
};

MRChevron.prototype.update = function(bLimitSearchBox) {
    try {
        G_Debug(this, "update");
        var nWidth = this.win.innerWidth;

        this.updateInformers();
        if (nWidth < 200)
            return;
        nWidth -= this.getUnChevronWidth();
        var nTotalDiff = 0;
        var nUsedWidth = 0;
        for (var nIndex = 0; nIndex < this.informers.length; ++nIndex) {
            var nDiff = this.informers[nIndex].fullWidth - this.informers[nIndex].shortWidth;
            nTotalDiff += nDiff;
            try {

                if (nTotalDiff < nWidth) {
                    this.informers[nIndex].shortMode(false);
                    nUsedWidth += nDiff;
                }
                else {
                    this.informers[nIndex].shortMode(true);
                }
            }
            catch (err) {
            }

        }
        nWidth -= nUsedWidth;
        nTotalDiff = 0;
        var bHideChevron = true;
        for (var i = this.get_first_item(); i != null; i = this.get_next_item(i)) {
            if (i == this.chevronControl.mSpring) {
                break;
            }
            i.collapsed = false;
            nTotalDiff += this.element_width(i);
            i.collapsed = (nTotalDiff >= nWidth);
            if (i.collapsed) {
                bHideChevron = false;
            }
        }
        if (
            this.toolbarObject.mPrefs.getBoolPrefOrDefault("shortmode", false) 
            || (bLimitSearchBox && nWidth<0)
        ) {
            var nTextWidth = nWidth + this.search_width() - 5;
            this.toolbarObject.mSearchCtrl.parentNode.setAttribute('width', nTextWidth);
        }

        this.chevronControl.mChevronButton.collapsed = bHideChevron;
    } catch (err) { G_Debug(this, "exception: " + err + ", stack: " + err.stack + "\n"); }
};

MRChevron.prototype.onMenuShow = function() {
    var elChevronToolbar = this.doc.getElementById(this.chevron_toolbar);
    var elCurToolbarItem = this.get_first_item();
    for (var i = 0; i < this.chevronControl.mMenu.childNodes.length; i++) {
        G_Debug("onMenuShow", elCurToolbarItem.collapsed);
        if (elCurToolbarItem.collapsed == false) {
            this.chevronControl.mMenu.childNodes[i].hidden = true;
        }
        else {
            this.chevronControl.mMenu.childNodes[i].hidden = false;
            if (this.chevronControl.mMenu.childNodes[i].nodeName == 'menuitem') {

                if (elCurToolbarItem.hasAttribute('label')) {
                    this.chevronControl.mMenu.childNodes[i].label = elCurToolbarItem.getAttribute('label');
                }
                if (elCurToolbarItem.hasAttribute('disabled')) {
                    this.chevronControl.mMenu.childNodes[i].setAttribute(
						'disabled',
						elCurToolbarItem.getAttribute('disabled')
					);
                }
                if (elCurToolbarItem.hasAttribute('checked')) {
                    this.chevronControl.mMenu.childNodes[i].setAttribute(
						'checked',
						elCurToolbarItem.getAttribute('checked')
					);
                }
                var c = this.doc.defaultView.getComputedStyle(elCurToolbarItem, '');
                this.chevronControl.mMenu.childNodes[i].style.listStyleImage = c['listStyleImage'];
                this.chevronControl.mMenu.childNodes[i].style.MozImageRegion = c['MozImageRegion']

            }
        }
        elCurToolbarItem = this.get_next_item(elCurToolbarItem);

    }
};

MRChevron.prototype.createMenuElement = function(elCur) {
    var elementNew = null;
    var elPopup = elCur.getElementsByTagName('menupopup')[0];
    if ((elPopup != null) && (elPopup.hasChildNodes)) {
        elementNew = this.doc.createElement('menu');
        elementNew.appendChild(elPopup.cloneNode(true));
        elementNew.setAttribute('class', 'menu-iconic');
        if (elCur.hasAttribute('oncommand')) {
            elementNew.setAttribute(
                'onclick',
                'if (event.button == 0){'
                + elCur.getAttribute('oncommand')
                + ' this.parentNode.hidePopup();}'
            );
        }
    }
    else {
        elementNew = this.doc.createElement('menuitem');
        elementNew.setAttribute('class', 'menuitem-iconic')
    }
    var aAttributes = elCur.attributes;
    for (j = 0; j < aAttributes.length; j++) {
        if (
            (aAttributes[j].name != 'class')
            && (aAttributes[j].name != 'style')
            && (aAttributes[j].name != 'collapsed')
        ) 
        {
            switch (aAttributes[j].name) {
                case 'id':
                    {
                        elementNew.setAttribute('id', aAttributes[j].value + '_chevron');
                        continue;
                    }
                case 'command':
                    {
                        if (elementNew.nodeName == 'menu') {
                            continue;
                        }
                        break
                    }
                default:
                    {
                        break
                    }

            }
            elementNew.setAttribute(aAttributes[j].name, aAttributes[j].value)
        }

    }
    if (elementNew.hasAttribute('image') == false) {
        var f = this.doc.defaultView.getComputedStyle(elCur, '');
        elementNew.style.listStyleImage = f['listStyleImage'];
        elementNew.style.MozImageRegion = f['MozImageRegion']
    }
    return elementNew;
}

MRChevron.prototype.updateInformers = function() {
    var informers = [];
    for (var i = this.toolbarObject.elToolbar.firstChild; i != null; i = this.get_next_item(i)) {
        if (i.getAttribute('class') == 'informer_button' && !i.hidden) {
            informers.push(i);
        }
    }
    for (var i = this.get_next_item(this.chevronControl); i != null; i = this.get_next_item(i)) {
        if (i.getAttribute('class') == 'informer_button' && !i.hidden) {
            informers.push(i);
        }
    }
    this.informers = informers;

}

MRChevron.prototype.getUnChevronWidth = function() {
    for (var nIndex = 0; nIndex < this.informers.length; ++nIndex) {
        try {
            this.informers[nIndex].shortMode(true);
        }
        catch (err) {
        }
    }
    var width = 0;
    for (var i = this.toolbarObject.elToolbar.firstChild; i != null; i = i.nextSibling) {
        if (i == this.chevronControl) {
            width += this.element_width(this.chevronControl.mChevronButton);
        }
        else if (
            i == this.toolbarObject.mSearchCtrl.parentNode
            && this.toolbarObject.mPrefs.getBoolPrefOrDefault("shortmode", false)
        ) 
        {
//            width += parseInt(this.toolbarObject.mSearchCtrl.getAttribute('minwidth'));
            width += this.search_width();
        }
        else {
            width += this.element_width(i);
        }
    }
    for (var nIndex = 0; nIndex < this.informers.length; ++nIndex) {
        width -= this.element_width(this.informers[nIndex]) - this.informers[nIndex].shortWidth;
    }
    return width;
}

MRChevron.prototype.updateDelayed = function() {
    if(!this.toolbarObject.elToolbar)
    {
        return;
    }
    if (this.updateTimer) {
        this.win.clearTimeout(this.updateTimer);
    }
    var localObject = this;
    var eventUpdate = function handlerUpdate(evt) { localObject.update(); }
    this.updateTimer = this.win.setTimeout(eventUpdate, 500);
}
