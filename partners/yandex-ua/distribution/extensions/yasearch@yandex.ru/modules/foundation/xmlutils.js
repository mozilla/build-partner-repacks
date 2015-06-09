"use strict";
EXPORTED_SYMBOLS.push("xmlutils");
const xmlutils = {
    get xmlSerializer() {
        delete this.XMLSerializer;
        return this.XMLSerializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].getService(Ci.nsIDOMSerializer);
    },
    get xsltProcessor() {
        delete this.xsltProcessor;
        return this.xsltProcessor = Cc["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Ci.nsIXSLTProcessor);
    },
    queryXMLDoc: function xmlutils_queryXMLDoc(expr, contextNode, extNSResolver) {
        if (!(contextNode instanceof Ci.nsIDOMNode)) {
            throw new CustomErrors.EArgType("contextNode", "nsIDOMNode", contextNode);
        }
        let doc = contextNode instanceof Ci.nsIDOMDocument ? contextNode : contextNode.ownerDocument;
        let NSResolver = extNSResolver || doc.createNSResolver(doc.documentElement);
        let rawResult = doc.evaluate(expr, contextNode, NSResolver, 0, null);
        let result;
        switch (rawResult.resultType) {
        case rawResult.NUMBER_TYPE:
            result = rawResult.numberValue;
            break;
        case rawResult.STRING_TYPE:
            result = rawResult.stringValue;
            break;
        case rawResult.BOOLEAN_TYPE:
            result = rawResult.booleanValue;
            break;
        case rawResult.UNORDERED_NODE_ITERATOR_TYPE:
            let nodesArray = [];
            let node;
            while (node = rawResult.iterateNext()) {
                nodesArray.push(node);
            }
            result = nodesArray;
            break;
        default:
            break;
        }
        return result;
    },
    serializeXML: function xmlutils_serializeXML(node) {
        return this.xmlSerializer.serializeToString(node);
    },
    transformXMLToFragment: function xmlutils_transformXMLToFragment(sourceNode, stylesheet, destDoc, oParams) {
        let processor = this.xsltProcessor;
        processor.reset();
        processor.importStylesheet(stylesheet);
        if (oParams) {
            for (let [
                        paramName,
                        paramValue
                    ] in Iterator(oParams)) {
                processor.setParameter(null, paramName, paramValue);
            }
        }
        return processor.transformToFragment(sourceNode, destDoc);
    },
    recreateXML: function xmlutils_recreateXML(srcNode, toDocument, deep) {
        if (!(srcNode instanceof Ci.nsIDOMNode)) {
            throw new CustomErrors.EArgType("scrNode", "nsIDOMNode", srcNode);
        }
        if (!(toDocument instanceof Ci.nsIDOMDocument)) {
            throw new CustomErrors.EArgType("toDocument", "nsIDOMDocument", toDocument);
        }
        let clone = null;
        switch (srcNode.nodeType) {
        case srcNode.DOCUMENT_NODE:
            clone = this.recreateXML(srcNode.documentElement, toDocument, deep);
            break;
        case srcNode.ELEMENT_NODE:
            clone = toDocument.createElementNS(srcNode.namespaceURI, srcNode.nodeName);
            let attributes = srcNode.attributes;
            for (let i = 0, len = attributes.length; i < len; i++) {
                let source = attributes[i];
                clone.setAttributeNS(source.namespaceURI, source.localName, source.value);
            }
            if (deep) {
                let child = srcNode.firstChild;
                while (child) {
                    clone.appendChild(this.recreateXML(child, toDocument, deep));
                    child = child.nextSibling;
                }
            }
            break;
        case srcNode.TEXT_NODE:
            clone = toDocument.createTextNode(srcNode.nodeValue);
            break;
        case srcNode.CDATA_SECTION_NODE:
            clone = toDocument.createCDATASection(srcNode.nodeValue);
            break;
        case srcNode.COMMENT_NODE:
            clone = toDocument.createComment(srcNode.nodeValue);
            break;
        }
        return clone;
    },
    getDOMParser: function xmlutils_getDOMParser(docURI, baseURI, withSystemPrincipal) {
        let domParser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
        if (docURI || baseURI) {
            let systemPrincipal = withSystemPrincipal ? Services.scriptSecurityManager.getSystemPrincipal() : null;
            domParser.init(systemPrincipal, docURI, baseURI);
        } else {
            domParser.init();
        }
        return domParser;
    },
    domElement2jsObj: function xmlutils_domElement2jsObj(element, walker) {
        if (!(element instanceof Ci.nsIDOMElement)) {
            throw new CustomErrors.EArgType("element", "nsIDOMElement", element);
        }
        let result = {
            toString: function () {
                return "";
            },
            childElements: []
        };
        let treeWalker = walker || element.ownerDocument.createTreeWalker(element, Ci.nsIDOMNodeFilter.SHOW_ALL, this._nodeFilter, true);
        let prevNode = treeWalker.currentNode;
        treeWalker.currentNode = element;
        let attrNodes = element.attributes;
        for (let i = 0, len = attrNodes.length; i < len; i++) {
            let attrNode = attrNodes[i];
            result[attrNode.name] = attrNode.value;
        }
        if (treeWalker.firstChild()) {
            do {
                let subNode = treeWalker.currentNode;
                switch (subNode.nodeType) {
                case subNode.TEXT_NODE:
                    let newText = result + subNode.nodeValue;
                    result.toString = function () {
                        return newText;
                    };
                    break;
                case subNode.ELEMENT_NODE:
                    let propName = subNode.nodeName;
                    let propValue = this.domElement2jsObj(subNode, treeWalker);
                    result.childElements.push(propValue);
                    if (!(propName in result)) {
                        result[propName] = propValue;
                    }
                    break;
                }
            } while (treeWalker.nextSibling());
        }
        treeWalker.currentNode = prevNode;
        return result;
    },
    dom2jsObj: function xmlutils_dom2jsObj(domObject) {
        if (domObject instanceof Ci.nsIDOMElement) {
            return this.domElement2jsObj(domObject);
        }
        if (domObject instanceof Ci.nsIDOMDocument) {
            return this.domElement2jsObj(domObject.documentElement);
        }
        throw new CustomErrors.EArgType("domObject", "nsIDOMElement | nsIDOMDocument", domObject);
    },
    getSimpleXPathForElement: function xmlutils_getXPathForElement(el) {
        let xpath = [];
        let root = el.ownerDocument.documentElement;
        do {
            let brothers = [];
            let sibling = el.parentNode.firstChild;
            do {
                if (sibling.nodeName !== el.nodeName) {
                    continue;
                }
                brothers.push(sibling);
            } while (sibling = sibling.nextSibling);
            let selector = el.nodeName;
            let pos = brothers.indexOf(el) + 1;
            if (brothers.length > 1) {
                selector += "[" + pos + "]";
            }
            xpath.unshift(selector);
            if (el === root) {
                break;
            }
        } while (el = el.parentNode);
        return "/" + xpath.join("/");
    },
    _nodeFilter: {
        acceptNode: function XBWidgetParser__acceptNode(node) {
            if (node.nodeType == node.COMMENT_NODE || node.nodeType == node.TEXT_NODE && !this._emptyTextRE.test(node.nodeValue)) {
                return Ci.nsIDOMNodeFilter.FILTER_REJECT;
            }
            return Ci.nsIDOMNodeFilter.FILTER_ACCEPT;
        },
        _emptyTextRE: /[^\t\n\r ]/
    }
};
