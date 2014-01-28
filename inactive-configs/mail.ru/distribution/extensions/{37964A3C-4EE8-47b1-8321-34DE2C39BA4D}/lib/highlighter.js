function MRHighlighter(toolbarObject, idButton, className) {
    this.debugZone = "MRHighlighter";
    this.toolbarObject = toolbarObject;
    this.idButton = idButton;
    this.sSelectedText = "";
    this.sClassName = className;
};

MRHighlighter.prototype.highlight = function(frame) {
    if(!frame)
    {
        return;
    }
    var i=0;
    for(i=0; frame.frames&&i<frame.frames.length; i++)
    {
	    this.highlight(frame.frames[i])
    }
    var doc = frame.document;
    if(!doc)
    {
        return;
    }
    var elBody=doc.body;
    if(!elBody)
    {
        return;
    }
	if(!this.sSelectedText.length)
	{
	    return;
	}
	var aTextWords = this.split_string(this.sSelectedText);
    for(i=0; i<aTextWords.length; i++)
    {
        this.selectWord(aTextWords[i], elBody);
    }
    
}

MRHighlighter.prototype.selectRange = function(range, spanSrc) {
    var elSpanCopy = spanSrc.cloneNode(true);
    elSpanCopy.appendChild(range.extractContents());
    var elText = range.startContainer.splitText(range.startOffset);
    return elText.parentNode.insertBefore(elSpanCopy, elText);

}

MRHighlighter.prototype.selectWord = function(word, elBody) {
    G_Debug(this, "selectWord:" + word);
    var doc = elBody.ownerDocument;
    var nNodesCount = elBody.childNodes.length;
    var elSpan = doc.createElement('span');
    elSpan.setAttribute('style', 'background: #FF0;color: #000;');
    elSpan.setAttribute('class', this.sClassName);
    var rangeSearch = doc.createRange();
    rangeSearch.setStart(elBody, 0);
    rangeSearch.setEnd(elBody, nNodesCount);
    var rangeStart = doc.createRange();
    rangeStart.setStart(elBody, 0);
    rangeStart.setEnd(elBody, 0);
    var rangeEnd = doc.createRange();
    rangeEnd.setStart(elBody, nNodesCount);
    rangeEnd.setEnd(elBody, nNodesCount);

    var rangeResult = null;
    var objFind = Components.classes['@mozilla.org/embedcomp/rangefind;1'].createInstance().QueryInterface(Components.interfaces.nsIFind);
    while ((rangeResult = objFind.Find(word, rangeSearch, rangeStart, rangeEnd))) {

        var elSpanSelection = this.selectRange(rangeResult, elSpan);
        rangeStart.setStart(elSpanSelection, elSpanSelection.childNodes.length);
        rangeStart.setEnd(elSpanSelection, elSpanSelection.childNodes.length)
    }
}

MRHighlighter.prototype.clean = function(frame) {
    if (!frame) {
        return;
    }
    for (var i = 0; frame.frames && i < frame.frames.length; i++) {
        this.clean(frame.frames[i])
    }
    var doc = frame.document;
    if (!doc) {
        return;
    }
    var elBody = doc.body;
    if (!elBody) {
        return;
    }
    if (!this.sSelectedText.length) {
        return;
    }
    var aWords = this.split_string(this.sSelectedText);
    for (var i = 0; i < aWords.length; i++) {
        this.cleanWord(aWords[i], elBody);
    }
}

MRHighlighter.prototype.cleanSelection = function(elSelection) {
    elClean=elSelection.ownerDocument.createDocumentFragment();
    while(elSelection.firstChild)
    {
	    elClean.appendChild(elSelection.firstChild);
    }
    elSelection.parentNode.insertBefore(elClean,elSelection.nextSibling);
    elSelection.parentNode.removeChild(elSelection);
}

MRHighlighter.prototype.cleanWord = function(word, elBody) {
    var doc = elBody.ownerDocument;
    var nNodesCount = elBody.childNodes.length;
    var rangeSearch = doc.createRange();
    rangeSearch.setStart(elBody, 0);
    rangeSearch.setEnd(elBody, nNodesCount);
    var rangeStart = doc.createRange();
    rangeStart.setStart(elBody, 0);
    rangeStart.setEnd(elBody, 0);
    var rangeEnd = doc.createRange();
    rangeEnd.setStart(elBody, nNodesCount);
    rangeEnd.setEnd(elBody, nNodesCount);

    var rangeResult = null;
    var objFind = Components.classes['@mozilla.org/embedcomp/rangefind;1'].createInstance().QueryInterface(Components.interfaces.nsIFind);
    while ((rangeResult = objFind.Find(word, rangeSearch, rangeStart, rangeEnd))) {
        var elSelection = rangeResult.startContainer;
        while (elSelection) {
            if (elSelection.getAttribute && elSelection.getAttribute('class') == this.sClassName) {
                this.cleanSelection(elSelection);
                break
            }
            elSelection = elSelection.parentNode;

        }
        rangeStart.setStart(rangeResult.endContainer, rangeResult.endOffset)
        rangeStart.collapse(true)
    }
}

MRHighlighter.prototype.toggle = function(bEnable) {
    var button = this.toolbarObject.win.document.getElementById(this.idButton);
    if(bEnable == null)
    {
        button.checked = !button.checked;
    }
    else
    {
        button.checked = bEnable;
    }
    G_Debug(this, "toggle:" + bEnable);
    if (!button.checked) {
        this.clean(this.toolbarObject.win._content);
        this.sSelectedText = "";
    }
    else {
        this.sSelectedText = this.trim(this.toolbarObject.mSearchCtrl.mSearchBox.getSearchText_());
        this.highlight(this.toolbarObject.win._content);
        var curPage = this.toolbarObject.httpMetrics.getCurPage();
        if(curPage)
        {
            curPage.highlightText = this.sSelectedText;
        }
    }

}
MRHighlighter.prototype.trim = function(str) {
    if (!str) return '';
    str = str.replace(/^\s+/, '');
    str = str.replace(/\s+$/, '');
    str = str.replace(/\s+/g, ' ');
    return str
}

MRHighlighter.prototype.split_string = function(str) {
    var b = this.trim(str);
    var d = '';
    var e = false;
    var f = false;
    var g = new Array();
    for (var i = 0; i < b.length; i++) {
        var c = b.charAt(i);
        switch (c) {
            case ' ':
                {
                    if (e == false) {
                        g.push(d);
                        d = '';
                        if (f == true) f = false
                    }
                    else d += c;
                    break
                }
            case '"':
                {
                    if (e == false) {
                        e = true;
                        f = true
                    }
                    else {
                        e = false;
                        f = false
                    }
                    break
                }
            case ',':
                {
                    break
                }
            case '+':
            case '~':
                {
                    if (f == false) break
                }
            default:
                {
                    if (f == false) f = true;
                    d += c
                }

        }

    }
    if (d != '') g.push(d);
    return g
}

MRHighlighter.prototype.updateState = function()
{
    var curPage = this.toolbarObject.httpMetrics.getCurPage();
    var button = this.toolbarObject.win.document.getElementById(this.idButton);
    if(curPage && curPage.highlightText && curPage.highlightText.length)
    {
        button.checked = true;
        this.sSelectedText = curPage.highlightText;
    }
    else
    {
        button.checked = false;
        this.sSelectedText = "";
    }

}