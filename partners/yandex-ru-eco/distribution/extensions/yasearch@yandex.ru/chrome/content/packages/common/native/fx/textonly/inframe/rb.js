var dbg = function () {
};
var readability = {
    version: "1.7.1",
    emailSrc: "http://lab.arc90.com/experiments/readability/email.php",
    iframeLoads: 0,
    convertLinksToFootnotes: false,
    reversePageScroll: false,
    frameHack: false,
    biggestFrame: false,
    bodyCache: null,
    flags: 1 | 2 | 4,
    FLAG_STRIP_UNLIKELYS: 1,
    FLAG_WEIGHT_CLASSES: 2,
    FLAG_CLEAN_CONDITIONALLY: 4,
    maxPages: 30,
    parsedPages: {},
    pageETags: {},
    regexps: {
        unlikelyCandidates: /combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup/i,
        okMaybeItsACandidate: /and|article|body|column|main|shadow/i,
        positive: /article|body|content|entry|hentry|main|page|pagination|post|text|blog|story/i,
        negative: /combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget/i,
        extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single/i,
        divToPElements: /<(a|blockquote|dl|div|img|ol|p|pre|table|ul)/i,
        replaceBrs: /(<br[^>]*>[ \n\r\t]*){2,}/gi,
        replaceFonts: /<(\/?)font[^>]*>/gi,
        trim: /^\s+|\s+$/g,
        normalize: /\s{2,}/g,
        killBreaks: /(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,
        videos: /http:\/\/(www\.)?(youtube|vimeo)\.com/i,
        skipFootnoteLink: /^\s*(\[?[a-z0-9]{1,2}\]?|^|edit|citation needed)\s*$/i,
        nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
        prevLink: /(prev|earl|old|new|<|«)/i
    },
    init: function () {
        window.onload = window.onunload = function () {
        };
        readability.removeScripts(document);
        if (document.body && !readability.bodyCache) {
            readability.bodyCache = document.body.innerHTML;
        }
        readability.parsedPages[winLocation.href.replace(/\/$/, "")] = true;
        var nextPageLink = readability.findNextPageLink(document.body);
        readability.prepDocument();
        var overlay = document.createElement("DIV");
        var innerDiv = document.createElement("DIV");
        var articleTools = readability.getArticleTools();
        var articleTitle = readability.getArticleTitle();
        var articleContent = readability.grabArticle();
        if (!articleContent) {
            articleContent = document.createElement("DIV");
            articleContent.id = "readability-content";
            articleContent.innerHTML = [
                readability.getString("error-part1", [
                    "<a href='mailto:support@element.yandex.ru'>",
                    "</a>"
                ]),
                readability.frameHack ? readability.getString("error-part2", ["<a href='" + readability.biggestFrame.src + "'>" + readability.biggestFrame.src + "</a>"]) : "",
                readability.getString("error-part3")
            ].join("");
            nextPageLink = null;
        }
        overlay.id = "readOverlay";
        innerDiv.id = "readInner";
        if (document.documentElement) {
            document.documentElement.className = readStyle;
        }
        document.body.className = readStyle;
        if (readStyle == "style-athelas" || readStyle == "style-apertura") {
            overlay.className = readStyle + " rdbTypekit";
        } else {
            overlay.className = readStyle;
        }
        innerDiv.className = readMargin + " " + readSize;
        if (typeof readConvertLinksToFootnotes !== "undefined" && readConvertLinksToFootnotes === true) {
            readability.convertLinksToFootnotes = true;
        }
        innerDiv.appendChild(articleTitle);
        innerDiv.appendChild(articleContent);
        overlay.appendChild(articleTools);
        overlay.appendChild(innerDiv);
        document.body.innerHTML = "";
        document.body.insertBefore(overlay, document.body.firstChild);
        document.body.removeAttribute("style");
        if (readability.frameHack) {
            var readOverlay = document.getElementById("readOverlay");
            readOverlay.style.height = "100%";
            readOverlay.style.overflow = "auto";
        }
        if (winLocation.protocol + "//" + winLocation.host + "/" == winLocation.href) {
            articleContent.style.display = "none";
            var rootWarning = document.createElement("p");
            rootWarning.id = "readability-warning";
            rootWarning.innerHTML = readability.getString("homepage-warning", [
                "<a onClick='javascript:document.getElementById(\"readability-warning\").style.display=\"none\";document.getElementById(\"readability-content\").style.display=\"block\";'>",
                "</a>"
            ]);
            innerDiv.insertBefore(rootWarning, articleContent);
        }
        readability.postProcessContent(articleContent);
        window.scrollTo(0, 0);
        if (readStyle == "style-athelas" || readStyle == "style-apertura") {
            readability.useRdbTypekit();
        }
        if (nextPageLink) {
            window.setTimeout(function () {
                readability.appendNextPage(nextPageLink);
            }, 500);
        }
        document.onkeydown = function (e) {
            var evt = e || window.event;
            var code = evt.keyCode;
            if (code === 16) {
                readability.reversePageScroll = true;
                return true;
            }
            if (code === 32 && !(evt.altKey || evt.shiftKey || evt.metaKey || evt.ctrlKey)) {
                readability.curScrollStep = 0;
                var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight;
                if (readability.reversePageScroll) {
                    readability.scrollTo(readability.scrollTop(), readability.scrollTop() - (windowHeight - 50), 20, 10);
                } else {
                    readability.scrollTo(readability.scrollTop(), readability.scrollTop() + (windowHeight - 50), 20, 10);
                }
                return false;
            }
            return true;
        };
        document.onkeyup = function (e) {
            var code = (e || window.event).keyCode;
            if (code === 16) {
                readability.reversePageScroll = false;
                return;
            }
        };
    },
    postProcessContent: function (articleContent) {
        if (readability.convertLinksToFootnotes && !winLocation.href.match(/wikipedia\.org/g)) {
            readability.addFootnotes(articleContent);
        }
        readability.fixImageFloats(articleContent);
    },
    fixImageFloats: function (articleContent) {
        var imageWidthThreshold = Math.min(articleContent.offsetWidth, 800) * 0.55, images = articleContent.getElementsByTagName("img");
        for (var i = 0, il = images.length; i < il; i++) {
            var image = images[i];
            if (image.offsetWidth > imageWidthThreshold) {
                image.className += " blockImage";
            }
        }
    },
    getArticleTools: function () {
        var articleTools = document.createElement("DIV");
        articleTools.id = "readTools";
        if (document.compatMode && document.compatMode == "BackCompat") {
            articleTools.className = "fixedFixed";
        }
        articleTools.innerHTML = (window.FX_MODE ? "" : "<a href='#' onclick='return window.location.reload()' title='" + readability.getString("reload-page") + "' id='reload-page'>&#160;</a>") + "<a href='#' onclick='(window.__ybStatLogFunction||window.top.__ybStatLogFunction||window.parent.__ybStatLogFunction||function(){})();window.print();return false;' title='" + readability.getString("print-page") + "' id='print-page'>&#160;</a>";
        return articleTools;
    },
    getArticleTitle: function () {
        var curTitle = "", origTitle = "";
        try {
            curTitle = origTitle = document.title;
            if (typeof curTitle != "string") {
                curTitle = origTitle = readability.getInnerText(document.getElementsByTagName("title")[0]);
            }
        } catch (e) {
        }
        if (curTitle.match(/ [\|\-] /)) {
            curTitle = origTitle.replace(/(.*)[\|\-] .*/gi, "$1");
            if (curTitle.split(" ").length < 3) {
                curTitle = origTitle.replace(/[^\|\-]*[\|\-](.*)/gi, "$1");
            }
        } else if (curTitle.indexOf(": ") !== -1) {
            curTitle = origTitle.replace(/.*:(.*)/gi, "$1");
            if (curTitle.split(" ").length < 3) {
                curTitle = origTitle.replace(/[^:]*[:](.*)/gi, "$1");
            }
        } else if (curTitle.length > 150 || curTitle.length < 15) {
            var hOnes = document.getElementsByTagName("h1");
            if (hOnes.length == 1) {
                curTitle = readability.getInnerText(hOnes[0]);
            }
        }
        curTitle = curTitle.replace(readability.regexps.trim, "");
        if (curTitle.split(" ").length <= 4) {
            curTitle = origTitle;
        }
        var articleTitle = document.createElement("H1");
        articleTitle.innerHTML = curTitle;
        return articleTitle;
    },
    getArticleFooter: function () {
        var articleFooter = document.createElement("DIV");
        articleFooter.id = "readFooter";
        articleFooter.innerHTML = [
            "<div id='rdb-footer-print'>Excerpted from <cite>" + document.title + "</cite><br />" + winLocation.href + "</div>",
            "<div id='rdb-footer-wrapper'>",
            "<div id='rdb-footer-left'>",
            "<a href='http://lab.arc90.com/experiments/readability' id='readability-logo'>Readability &mdash;&nbsp;</a>",
            "<a href='http://www.arc90.com/' id='arc90-logo'> An Arc90 Laboratory Experiment&nbsp;</a>",
            " <span id='readability-url'> http://lab.arc90.com/experiments/readability</span>",
            "</div>",
            "<div id='rdb-footer-right'>",
            "<a href='http://www.twitter.com/arc90' class='footer-twitterLink'>Follow us on Twitter &raquo;</a>",
            "<span class='version'>Readability version " + readability.version + "</span>",
            "</div>",
            "</div>"
        ].join("");
        return articleFooter;
    },
    prepDocument: function () {
        if (document.body === null) {
            var body = document.createElement("body");
            try {
                document.body = body;
            } catch (e) {
                document.documentElement.appendChild(body);
                dbg(e);
            }
        }
        document.body.id = "readabilityBody";
        var frames = document.getElementsByTagName("frame");
        if (frames.length > 0) {
            var bestFrame = null;
            var bestFrameSize = 0;
            var biggestFrameSize = 0;
            for (var frameIndex = 0; frameIndex < frames.length; frameIndex++) {
                var frameSize = frames[frameIndex].offsetWidth + frames[frameIndex].offsetHeight;
                var canAccessFrame = false;
                try {
                    frames[frameIndex].contentWindow.document.body;
                    canAccessFrame = true;
                } catch (eFrames) {
                    dbg(eFrames);
                }
                if (frameSize > biggestFrameSize) {
                    biggestFrameSize = frameSize;
                    readability.biggestFrame = frames[frameIndex];
                }
                if (canAccessFrame && frameSize > bestFrameSize) {
                    readability.frameHack = true;
                    bestFrame = frames[frameIndex];
                    bestFrameSize = frameSize;
                }
            }
            if (bestFrame) {
                var newBody = document.createElement("body");
                newBody.innerHTML = bestFrame.contentWindow.document.body.innerHTML;
                newBody.style.overflow = "scroll";
                document.body = newBody;
                var frameset = document.getElementsByTagName("frameset")[0];
                if (frameset) {
                    frameset.parentNode.removeChild(frameset);
                }
            }
        }
        for (var k = 0; k < document.styleSheets.length; k++) {
            if (document.styleSheets[k].href !== null && document.styleSheets[k].href.lastIndexOf("readability") == -1) {
                document.styleSheets[k].disabled = true;
            }
        }
        var styleTags = document.getElementsByTagName("style");
        for (var st = 0; st < styleTags.length; st++) {
            styleTags[st].textContent = "";
        }
        document.body.innerHTML = document.body.innerHTML.replace(readability.regexps.replaceBrs, "</p><p>").replace(readability.regexps.replaceFonts, "<$1span>");
    },
    addFootnotes: function (articleContent) {
        var footnotesWrapper = document.getElementById("readability-footnotes"), articleFootnotes = document.getElementById("readability-footnotes-list");
        if (!footnotesWrapper) {
            footnotesWrapper = document.createElement("DIV");
            footnotesWrapper.id = "readability-footnotes";
            footnotesWrapper.innerHTML = "<h3>" + readability.getString("references") + "</h3>";
            footnotesWrapper.style.display = "none";
            articleFootnotes = document.createElement("ol");
            articleFootnotes.id = "readability-footnotes-list";
            footnotesWrapper.appendChild(articleFootnotes);
            var readFooter = document.getElementById("readFooter");
            if (readFooter) {
                readFooter.parentNode.insertBefore(footnotesWrapper, readFooter);
            }
        }
        var articleLinks = articleContent.getElementsByTagName("a");
        var linkCount = articleFootnotes.getElementsByTagName("li").length;
        for (var i = 0; i < articleLinks.length; i++) {
            var articleLink = articleLinks[i], footnoteLink = articleLink.cloneNode(true), refLink = document.createElement("a"), footnote = document.createElement("li"), linkDomain = footnoteLink.host ? footnoteLink.host : document.location.host, linkText = readability.getInnerText(articleLink);
            if (articleLink.className && articleLink.className.indexOf("readability-DoNotFootnote") !== -1 || linkText.match(readability.regexps.skipFootnoteLink)) {
                continue;
            }
            linkCount++;
            refLink.href = "#readabilityFootnoteLink-" + linkCount;
            refLink.innerHTML = "<small><sup>[" + linkCount + "]</sup></small>";
            refLink.className = "readability-DoNotFootnote";
            try {
                refLink.style.color = "inherit";
            } catch (e) {
            }
            if (articleLink.parentNode.lastChild == articleLink) {
                articleLink.parentNode.appendChild(refLink);
            } else {
                articleLink.parentNode.insertBefore(refLink, articleLink.nextSibling);
            }
            articleLink.name = "readabilityLink-" + linkCount;
            try {
                articleLink.style.color = "inherit";
            } catch (e) {
            }
            footnote.innerHTML = "<small><sup><a href='#readabilityLink-" + linkCount + "' title='" + readability.getString("jump-to-link") + "'>^</a></sup></small> ";
            footnoteLink.innerHTML = footnoteLink.title ? footnoteLink.title : linkText;
            footnoteLink.name = "readabilityFootnoteLink-" + linkCount;
            footnote.appendChild(footnoteLink);
            footnote.innerHTML = footnote.innerHTML + "<small> (" + linkDomain + ")</small>";
            articleFootnotes.appendChild(footnote);
        }
        if (linkCount > 0) {
            footnotesWrapper.style.display = "block";
        }
    },
    useRdbTypekit: function () {
        var rdbHead = document.getElementsByTagName("head")[0];
        var rdbTKScript = document.createElement("script");
        var rdbTKCode = null;
        var rdbTKLink = document.createElement("a");
        rdbTKLink.setAttribute("class", "rdbTK-powered");
        rdbTKLink.setAttribute("title", readability.getString("fonts"));
        rdbTKLink.innerHTML = readability.getString("fonts", [
            "<span class='rdbTK'>",
            "</span>"
        ]);
        if (readStyle == "style-athelas") {
            rdbTKCode = "sxt6vzy";
            dbg("Using Athelas Theme");
            rdbTKLink.setAttribute("href", "http://typekit.com/?utm_source=readability&utm_medium=affiliate&utm_campaign=athelas");
            rdbTKLink.setAttribute("id", "rdb-athelas");
            document.getElementById("rdb-footer-right").appendChild(rdbTKLink);
        }
        if (readStyle == "style-apertura") {
            rdbTKCode = "bae8ybu";
            dbg("Using Inverse Theme");
            rdbTKLink.setAttribute("href", "http://typekit.com/?utm_source=readability&utm_medium=affiliate&utm_campaign=inverse");
            rdbTKLink.setAttribute("id", "rdb-inverse");
            document.getElementById("rdb-footer-right").appendChild(rdbTKLink);
        }
        rdbTKScript.setAttribute("type", "text/javascript");
        rdbTKScript.setAttribute("src", "http://use.typekit.com/" + rdbTKCode + ".js");
        rdbTKScript.setAttribute("charset", "UTF-8");
        rdbHead.appendChild(rdbTKScript);
        var typekitLoader = function () {
            dbg("Looking for Typekit.");
            if (typeof Typekit != "undefined") {
                try {
                    dbg("Caught typekit");
                    Typekit.load();
                    clearInterval(window.typekitInterval);
                } catch (e) {
                    dbg("Typekit error: " + e);
                }
            }
        };
        window.typekitInterval = window.setInterval(typekitLoader, 100);
    },
    prepArticle: function (articleContent) {
        readability.cleanStyles(articleContent);
        readability.killBreaks(articleContent);
        readability.cleanConditionally(articleContent, "form");
        readability.clean(articleContent, "object");
        readability.clean(articleContent, "h1");
        if (articleContent.getElementsByTagName("h2").length == 1) {
            readability.clean(articleContent, "h2");
        }
        readability.clean(articleContent, "iframe");
        readability.cleanHeaders(articleContent);
        readability.cleanConditionally(articleContent, "table");
        readability.cleanConditionally(articleContent, "ul");
        readability.cleanConditionally(articleContent, "div");
        var articleParagraphs = articleContent.getElementsByTagName("p");
        for (var i = articleParagraphs.length - 1; i >= 0; i--) {
            var imgCount = articleParagraphs[i].getElementsByTagName("img").length;
            var embedCount = articleParagraphs[i].getElementsByTagName("embed").length;
            var objectCount = articleParagraphs[i].getElementsByTagName("object").length;
            if (imgCount === 0 && embedCount === 0 && objectCount === 0 && readability.getInnerText(articleParagraphs[i], false) == "") {
                articleParagraphs[i].parentNode.removeChild(articleParagraphs[i]);
            }
        }
        try {
            articleContent.innerHTML = articleContent.innerHTML.replace(/<br[^>]*>\s*<p/gi, "<p");
        } catch (e) {
            dbg("Cleaning innerHTML of breaks failed. This is an IE strict-block-elements bug. Ignoring.: " + e);
        }
    },
    initializeNode: function (node) {
        node.readability = { "contentScore": 0 };
        switch (node.tagName) {
        case "DIV":
            node.readability.contentScore += 5;
            break;
        case "PRE":
        case "TD":
        case "BLOCKQUOTE":
            node.readability.contentScore += 3;
            break;
        case "ADDRESS":
        case "OL":
        case "UL":
        case "DL":
        case "DD":
        case "DT":
        case "LI":
        case "FORM":
            node.readability.contentScore -= 3;
            break;
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
        case "TH":
            node.readability.contentScore -= 5;
            break;
        }
        node.readability.contentScore += readability.getClassWeight(node);
    },
    grabArticle: function (page) {
        var stripUnlikelyCandidates = readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS), isPaging = page !== null ? true : false;
        page = page ? page : document.body;
        var pageCacheHtml = page.innerHTML;
        var allElements = page.getElementsByTagName("*");
        var node = null;
        var nodesToScore = [];
        for (var nodeIndex = 0; node = allElements[nodeIndex]; nodeIndex++) {
            if (stripUnlikelyCandidates) {
                var unlikelyMatchString = node.className + node.id;
                if (unlikelyMatchString.search(readability.regexps.unlikelyCandidates) !== -1 && unlikelyMatchString.search(readability.regexps.okMaybeItsACandidate) == -1 && node.tagName !== "BODY") {
                    dbg("Removing unlikely candidate - " + unlikelyMatchString);
                    node.parentNode.removeChild(node);
                    nodeIndex--;
                    continue;
                }
            }
            if (node.tagName === "P" || node.tagName === "TD" || node.tagName === "PRE") {
                nodesToScore[nodesToScore.length] = node;
            }
            if (node.tagName === "DIV") {
                if (node.innerHTML.search(readability.regexps.divToPElements) === -1) {
                    var newNode = document.createElement("p");
                    try {
                        newNode.innerHTML = node.innerHTML;
                        node.parentNode.replaceChild(newNode, node);
                        nodeIndex--;
                        nodesToScore[nodesToScore.length] = node;
                    } catch (e) {
                        dbg("Could not alter div to p, probably an IE restriction, reverting back to div.: " + e);
                    }
                } else {
                    for (var i = 0, il = node.childNodes.length; i < il; i++) {
                        var childNode = node.childNodes[i];
                        if (childNode.nodeType == 3) {
                            var p = document.createElement("p");
                            p.innerHTML = childNode.nodeValue;
                            p.style.display = "inline";
                            p.className = "readability-styled";
                            childNode.parentNode.replaceChild(p, childNode);
                        }
                    }
                }
            }
        }
        var candidates = [];
        for (var pt = 0; pt < nodesToScore.length; pt++) {
            var parentNode = nodesToScore[pt].parentNode;
            var grandParentNode = parentNode ? parentNode.parentNode : null;
            var innerText = readability.getInnerText(nodesToScore[pt]);
            if (!parentNode || typeof parentNode.tagName == "undefined") {
                continue;
            }
            if (innerText.length < 25) {
                continue;
            }
            if (typeof parentNode.readability == "undefined") {
                readability.initializeNode(parentNode);
                candidates.push(parentNode);
            }
            if (grandParentNode && typeof grandParentNode.readability == "undefined" && typeof grandParentNode.tagName != "undefined") {
                readability.initializeNode(grandParentNode);
                candidates.push(grandParentNode);
            }
            var contentScore = 0;
            contentScore++;
            contentScore += innerText.split(",").length;
            contentScore += Math.min(Math.floor(innerText.length / 100), 3);
            parentNode.readability.contentScore += contentScore;
            if (grandParentNode) {
                grandParentNode.readability.contentScore += contentScore / 2;
            }
        }
        var topCandidate = null;
        for (var c = 0, cl = candidates.length; c < cl; c++) {
            candidates[c].readability.contentScore = candidates[c].readability.contentScore * (1 - readability.getLinkDensity(candidates[c]));
            dbg("Candidate: " + candidates[c] + " (" + candidates[c].className + ":" + candidates[c].id + ") with score " + candidates[c].readability.contentScore);
            if (!topCandidate || candidates[c].readability.contentScore > topCandidate.readability.contentScore) {
                topCandidate = candidates[c];
            }
        }
        if (topCandidate === null || topCandidate.tagName == "BODY") {
            {
                topCandidate = document.createElement("DIV");
            }
            topCandidate.innerHTML = page.innerHTML;
            page.innerHTML = "";
            page.appendChild(topCandidate);
            readability.initializeNode(topCandidate);
        }
        var articleContent = document.createElement("DIV");
        if (isPaging) {
            articleContent.id = "readability-content";
        }
        var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
        var siblingNodes = topCandidate.parentNode.childNodes;
        for (var s = 0, sl = siblingNodes.length; s < sl; s++) {
            var siblingNode = siblingNodes[s];
            var append = false;
            if (!siblingNode) {
                continue;
            }
            dbg("Looking at sibling node: " + siblingNode + " (" + siblingNode.className + ":" + siblingNode.id + ")" + (typeof siblingNode.readability != "undefined" ? " with score " + siblingNode.readability.contentScore : ""));
            dbg("Sibling has score " + (siblingNode.readability ? siblingNode.readability.contentScore : "Unknown"));
            if (siblingNode === topCandidate) {
                append = true;
            }
            var contentBonus = 0;
            if (siblingNode.className == topCandidate.className && topCandidate.className != "") {
                contentBonus += topCandidate.readability.contentScore * 0.2;
            }
            if (typeof siblingNode.readability != "undefined" && siblingNode.readability.contentScore + contentBonus >= siblingScoreThreshold) {
                append = true;
            }
            if (siblingNode.nodeName == "P") {
                var linkDensity = readability.getLinkDensity(siblingNode);
                var nodeContent = readability.getInnerText(siblingNode);
                var nodeLength = nodeContent.length;
                if (nodeLength > 80 && linkDensity < 0.25) {
                    append = true;
                } else if (nodeLength < 80 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                    append = true;
                }
            }
            if (append) {
                dbg("Appending node: " + siblingNode);
                var nodeToAppend = null;
                if (siblingNode.nodeName != "DIV" && siblingNode.nodeName != "P") {
                    dbg("Altering siblingNode of " + siblingNode.nodeName + " to div.");
                    nodeToAppend = document.createElement("DIV");
                    try {
                        nodeToAppend.id = siblingNode.id;
                        nodeToAppend.innerHTML = siblingNode.innerHTML;
                    } catch (er) {
                        dbg("Could not alter siblingNode to div, probably an IE restriction, reverting back to original.");
                        nodeToAppend = siblingNode;
                        s--;
                        sl--;
                    }
                } else {
                    nodeToAppend = siblingNode;
                    s--;
                    sl--;
                }
                nodeToAppend.className = "";
                articleContent.appendChild(nodeToAppend);
            }
        }
        readability.prepArticle(articleContent);
        if (readability.curPageNum === 1) {
            articleContent.innerHTML = "<div id=\"readability-page-1\" class=\"page\">" + articleContent.innerHTML + "</div>";
        }
        if (readability.getInnerText(articleContent, false).length < 250) {
            page.innerHTML = pageCacheHtml;
            if (readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS)) {
                readability.removeFlag(readability.FLAG_STRIP_UNLIKELYS);
                return readability.grabArticle(page);
            } else if (readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
                readability.removeFlag(readability.FLAG_WEIGHT_CLASSES);
                return readability.grabArticle(page);
            } else if (readability.flagIsActive(readability.FLAG_CLEAN_CONDITIONALLY)) {
                readability.removeFlag(readability.FLAG_CLEAN_CONDITIONALLY);
                return readability.grabArticle(page);
            } else {
                return null;
            }
        }
        return articleContent;
    },
    removeScripts: function (doc) {
        var scripts = doc.getElementsByTagName("script");
        for (var i = scripts.length - 1; i >= 0; i--) {
            if (typeof scripts[i].src == "undefined" || scripts[i].src.indexOf("readability") == -1 && scripts[i].src.indexOf("typekit") == -1) {
                scripts[i].nodeValue = "";
                scripts[i].removeAttribute("src");
                if (scripts[i].parentNode) {
                    scripts[i].parentNode.removeChild(scripts[i]);
                }
            }
        }
    },
    getInnerText: function (e, normalizeSpaces) {
        var textContent = "";
        if (typeof e.textContent == "undefined" && typeof e.innerText == "undefined") {
            return "";
        }
        normalizeSpaces = typeof normalizeSpaces == "undefined" ? true : normalizeSpaces;
        if (navigator.appName == "Microsoft Internet Explorer") {
            textContent = e.innerText.replace(readability.regexps.trim, "");
        } else {
            textContent = e.textContent.replace(readability.regexps.trim, "");
        }
        if (normalizeSpaces) {
            return textContent.replace(readability.regexps.normalize, " ");
        } else {
            return textContent;
        }
    },
    getCharCount: function (e, s) {
        s = s || ",";
        return readability.getInnerText(e).split(s).length - 1;
    },
    cleanStyles: function (e) {
        e = e || document;
        var cur = e.firstChild;
        if (!e) {
            return;
        }
        if (typeof e.removeAttribute == "function" && e.className != "readability-styled") {
            e.removeAttribute("style");
        }
        while (cur !== null) {
            if (cur.nodeType == 1) {
                if (cur.className != "readability-styled") {
                    cur.removeAttribute("style");
                }
                readability.cleanStyles(cur);
            }
            cur = cur.nextSibling;
        }
    },
    getLinkDensity: function (e) {
        var links = e.getElementsByTagName("a");
        var textLength = readability.getInnerText(e).length;
        var linkLength = 0;
        for (var i = 0, il = links.length; i < il; i++) {
            linkLength += readability.getInnerText(links[i]).length;
        }
        return linkLength / textLength;
    },
    findBaseUrl: function () {
        var noUrlParams = winLocation.pathname.split("?")[0], urlSlashes = noUrlParams.split("/").reverse(), cleanedSegments = [], possibleType = "";
        for (var i = 0, slashLen = urlSlashes.length; i < slashLen; i++) {
            var segment = urlSlashes[i];
            if (segment.indexOf(".") !== -1) {
                possibleType = segment.split(".")[1];
                if (!possibleType.match(/[^a-zA-Z]/)) {
                    segment = segment.split(".")[0];
                }
            }
            if (segment.indexOf(",00") !== -1) {
                segment = segment.replace(",00", "");
            }
            if (segment.match(/((_|-)?p[a-z]*|(_|-))[0-9]{1,2}$/i) && (i === 1 || i === 0)) {
                segment = segment.replace(/((_|-)?p[a-z]*|(_|-))[0-9]{1,2}$/i, "");
            }
            var del = false;
            if (i < 2 && segment.match(/^\d{1,2}$/)) {
                del = true;
            }
            if (i === 0 && segment.toLowerCase() == "index")
                del = true;
            if (i < 2 && segment.length < 3 && !urlSlashes[0].match(/[a-z]/i))
                del = true;
            if (!del) {
                cleanedSegments.push(segment);
            }
        }
        return winLocation.protocol + "//" + winLocation.host + cleanedSegments.reverse().join("/");
    },
    findNextPageLink: function (elem) {
        var possiblePages = {}, allLinks = elem.getElementsByTagName("a"), articleBaseUrl = readability.findBaseUrl();
        for (var i = 0, il = allLinks.length; i < il; i++) {
            var link = allLinks[i], linkHref = allLinks[i].href.replace(/#.*$/, "").replace(/\/$/, "");
            if (linkHref == "" || linkHref == articleBaseUrl || linkHref == winLocation.href || linkHref in readability.parsedPages) {
                continue;
            }
            if (winLocation.host != linkHref.split(/\/+/g)[1]) {
                continue;
            }
            var linkText = readability.getInnerText(link);
            if (linkText.match(readability.regexps.extraneous) || linkText.length > 25) {
                continue;
            }
            var linkHrefLeftover = linkHref.replace(articleBaseUrl, "");
            if (!linkHrefLeftover.match(/\d/)) {
                continue;
            }
            if (!(linkHref in possiblePages)) {
                possiblePages[linkHref] = {
                    "score": 0,
                    "linkText": linkText,
                    "href": linkHref
                };
            } else {
                possiblePages[linkHref].linkText += " | " + linkText;
            }
            var linkObj = possiblePages[linkHref];
            if (linkHref.indexOf(articleBaseUrl) !== 0) {
                linkObj.score -= 25;
            }
            var linkData = linkText + " " + link.className + " " + link.id;
            if (linkData.match(readability.regexps.nextLink)) {
                linkObj.score += 50;
            }
            if (linkData.match(/pag(e|ing|inat)/i)) {
                linkObj.score += 25;
            }
            if (linkData.match(/(first|last)/i)) {
                if (!linkObj.linkText.match(readability.regexps.nextLink))
                    linkObj.score -= 65;
            }
            if (linkData.match(readability.regexps.negative) || linkData.match(readability.regexps.extraneous)) {
                linkObj.score -= 50;
            }
            if (linkData.match(readability.regexps.prevLink)) {
                linkObj.score -= 200;
            }
            var parentNode = link.parentNode, positiveNodeMatch = false, negativeNodeMatch = false;
            while (parentNode) {
                var parentNodeClassAndId = parentNode.className + " " + parentNode.id;
                if (!positiveNodeMatch && parentNodeClassAndId && parentNodeClassAndId.match(/pag(e|ing|inat)/i)) {
                    positiveNodeMatch = true;
                    linkObj.score += 25;
                }
                if (!negativeNodeMatch && parentNodeClassAndId && parentNodeClassAndId.match(readability.regexps.negative)) {
                    if (!parentNodeClassAndId.match(readability.regexps.positive)) {
                        linkObj.score -= 25;
                        negativeNodeMatch = true;
                    }
                }
                parentNode = parentNode.parentNode;
            }
            if (linkHref.match(/p(a|g|ag)?(e|ing|ination)?(=|\/)[0-9]{1,2}/i) || linkHref.match(/(page|paging)/i)) {
                linkObj.score += 25;
            }
            if (linkHref.match(readability.regexps.extraneous)) {
                linkObj.score -= 15;
            }
            var linkTextAsNumber = parseInt(linkText, 10);
            if (linkTextAsNumber) {
                if (linkTextAsNumber === 1) {
                    linkObj.score -= 10;
                } else {
                    linkObj.score += Math.max(0, 10 - linkTextAsNumber);
                }
            }
        }
        var topPage = null;
        for (var page in possiblePages) {
            if (possiblePages.hasOwnProperty(page)) {
                if (possiblePages[page].score >= 50 && (!topPage || topPage.score < possiblePages[page].score)) {
                    topPage = possiblePages[page];
                }
            }
        }
        if (topPage) {
            var nextHref = topPage.href.replace(/\/$/, "");
            dbg("NEXT PAGE IS " + nextHref);
            readability.parsedPages[nextHref] = true;
            return nextHref;
        } else {
            return null;
        }
    },
    xhr: function () {
        if (typeof XMLHttpRequest !== "undefined" && (winLocation.protocol !== "file:" || !window.ActiveXObject)) {
            return new XMLHttpRequest();
        } else {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.6.0");
            } catch (sixerr) {
            }
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
            } catch (threrr) {
            }
            try {
                return new ActiveXObject("Msxml2.XMLHTTP");
            } catch (err) {
            }
        }
        return false;
    },
    successfulRequest: function (request) {
        return request.status >= 200 && request.status < 300 || request.status == 304 || request.status === 0 && request.responseText;
    },
    switchAjaxThrobber: function (show) {
        var readOverlay = document.getElementById("readOverlay");
        if (!readOverlay) {
            return;
        }
        var readOverlayStyle = readOverlay.runtimeStyle || readOverlay.style;
        if (show) {
            if (this._ajaxThrobberTimeout) {
                window.clearTimeout(this._ajaxThrobberTimeout);
            }
            readOverlayStyle.backgroundImage = "url('" + (window.readThrobberURL || "bar:throbber.gif") + "')";
        } else {
            this._ajaxThrobberTimeout = window.setTimeout(function () {
                readOverlayStyle.backgroundImage = "";
            }, 700);
        }
    },
    ajax: function (url, options) {
        readability.switchAjaxThrobber(true);
        var request = readability.xhr();
        function respondToReadyState(readyState) {
            if (request.readyState == 4) {
                readability.switchAjaxThrobber(false);
                if (readability.successfulRequest(request)) {
                    if (options.success) {
                        options.success(request);
                    }
                } else {
                    if (options.error) {
                        options.error(request);
                    }
                }
            }
        }
        if (typeof options === "undefined") {
            options = {};
        }
        request.onreadystatechange = respondToReadyState;
        request.open("get", url, true);
        request.setRequestHeader("Accept", "text/html");
        try {
            if (window.FX_MODE && request.overrideMimeType) {
                var docCharset = window.top.document.characterSet;
                if (docCharset)
                    request.overrideMimeType("text/html; charset=" + docCharset);
            }
        } catch (e) {
        }
        try {
            request.send(options.postBody);
        } catch (e) {
            readability.switchAjaxThrobber(false);
            if (options.error) {
                options.error();
            }
        }
        return request;
    },
    curPageNum: 1,
    appendNextPage: function (nextPageLink) {
        readability.curPageNum++;
        var articlePage = document.createElement("DIV");
        articlePage.id = "readability-page-" + readability.curPageNum;
        articlePage.className = "page";
        articlePage.innerHTML = "<p class=\"page-separator\" title=\"" + readability.getString("page") + " " + readability.curPageNum + "\">&sect;</p>";
        document.getElementById("readability-content").appendChild(articlePage);
        if (readability.curPageNum > readability.maxPages) {
            nextPageLink = "<div style='text-align: center'><a href='" + nextPageLink + "'>" + readability.getString("nextpage") + "</a></div>";
            articlePage.innerHTML = articlePage.innerHTML + nextPageLink;
            return;
        }
        with ({
                pageUrl: nextPageLink,
                thisPage: articlePage
            }) {
            readability.ajax(pageUrl, {
                success: function (r) {
                    var eTag = r.getResponseHeader("ETag");
                    if (eTag) {
                        if (eTag in readability.pageETags) {
                            dbg("Exact duplicate page found via ETag. Aborting.");
                            articlePage.style.display = "none";
                            return;
                        } else {
                            readability.pageETags[eTag] = 1;
                        }
                    }
                    var page = document.createElement("DIV");
                    var responseHtml = r.responseText.replace(/\n/g, "￿").replace(/<script.*?>.*?<\/script>/gi, "").replace(/\uffff/g, "\n").replace(/<(\/?)noscript/gi, "<$1div").replace(readability.regexps.replaceBrs, "</p><p>").replace(readability.regexps.replaceFonts, "<$1span>");
                    page.innerHTML = responseHtml;
                    readability.flags = 1 | 2 | 4;
                    var nextPageLink = readability.findNextPageLink(page), content = readability.grabArticle(page);
                    if (!content) {
                        dbg("No content found in page to append. Aborting.");
                        return;
                    }
                    firstP = content.getElementsByTagName("P").length ? content.getElementsByTagName("P")[0] : null;
                    if (firstP && firstP.innerHTML.length > 100) {
                        for (var i = 1; i <= readability.curPageNum; i++) {
                            var rPage = document.getElementById("readability-page-" + i);
                            if (rPage && rPage.innerHTML.indexOf(firstP.innerHTML) !== -1) {
                                dbg("Duplicate of page " + i + " - skipping.");
                                articlePage.style.display = "none";
                                readability.parsedPages[pageUrl] = true;
                                return;
                            }
                        }
                    }
                    readability.removeScripts(content);
                    thisPage.innerHTML = thisPage.innerHTML + content.innerHTML;
                    window.setTimeout(function () {
                        readability.postProcessContent(thisPage);
                    }, 500);
                    if (nextPageLink) {
                        readability.appendNextPage(nextPageLink);
                    }
                }
            });
        }
    },
    getClassWeight: function (e) {
        if (!readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
            return 0;
        }
        var weight = 0;
        if (typeof e.className === "string" && e.className != "") {
            if (e.className.search(readability.regexps.negative) !== -1) {
                weight -= 25;
            }
            if (e.className.search(readability.regexps.positive) !== -1) {
                weight += 25;
            }
        }
        if (typeof e.id === "string" && e.id != "") {
            if (e.id.search(readability.regexps.negative) !== -1) {
                weight -= 25;
            }
            if (e.id.search(readability.regexps.positive) !== -1) {
                weight += 25;
            }
        }
        return weight;
    },
    nodeIsVisible: function (node) {
        return (node.offsetWidth !== 0 || node.offsetHeight !== 0) && node.style.display.toLowerCase() !== "none";
    },
    killBreaks: function (e) {
        try {
            e.innerHTML = e.innerHTML.replace(readability.regexps.killBreaks, "<br />");
        } catch (eBreaks) {
            dbg("KillBreaks failed - this is an IE bug. Ignoring.: " + eBreaks);
        }
    },
    clean: function (e, tag) {
        var targetList = e.getElementsByTagName(tag);
        var isEmbed = tag == "object" || tag == "embed";
        for (var y = targetList.length - 1; y >= 0; y--) {
            if (isEmbed) {
                var attributeValues = "";
                for (var i = 0, il = targetList[y].attributes.length; i < il; i++) {
                    attributeValues += targetList[y].attributes[i].value + "|";
                }
                if (attributeValues.search(readability.regexps.videos) !== -1) {
                    continue;
                }
                if (targetList[y].innerHTML.search(readability.regexps.videos) !== -1) {
                    continue;
                }
            }
            targetList[y].parentNode.removeChild(targetList[y]);
        }
    },
    cleanConditionally: function (e, tag) {
        if (!readability.flagIsActive(readability.FLAG_CLEAN_CONDITIONALLY)) {
            return;
        }
        var tagsList = e.getElementsByTagName(tag);
        var curTagsLength = tagsList.length;
        for (var i = curTagsLength - 1; i >= 0; i--) {
            var tagNode = tagsList[i];
            var weight = readability.getClassWeight(tagNode);
            var contentScore = typeof tagNode.readability != "undefined" ? tagNode.readability.contentScore : 0;
            if (weight + contentScore < 0) {
                tagNode.parentNode.removeChild(tagNode);
            } else if (readability.getCharCount(tagNode, ",") < 10) {
                var p = tagNode.getElementsByTagName("p").length;
                var img = tagNode.getElementsByTagName("img").length;
                var li = tagNode.getElementsByTagName("li").length - 100;
                var input = tagNode.getElementsByTagName("input").length;
                var embedCount = 0;
                var embeds = tagNode.getElementsByTagName("embed");
                for (var ei = 0, il = embeds.length; ei < il; ei++) {
                    if (embeds[ei].src.search(readability.regexps.videos) == -1) {
                        embedCount++;
                    }
                }
                var linkDensity = readability.getLinkDensity(tagNode);
                var contentLength = readability.getInnerText(tagNode).length;
                var toRemove = false;
                if (img > p) {
                    toRemove = true;
                } else if (li > p && tag != "ul" && tag != "ol") {
                    toRemove = true;
                } else if (input > Math.floor(p / 3)) {
                    toRemove = true;
                } else if (contentLength < 25 && (img === 0 || img > 2)) {
                    toRemove = true;
                } else if (weight < 25 && linkDensity > 0.2) {
                    toRemove = true;
                } else if (weight >= 25 && linkDensity > 0.5) {
                    toRemove = true;
                } else if (embedCount == 1 && contentLength < 75 || embedCount > 1) {
                    toRemove = true;
                }
                if (toRemove) {
                    tagNode.parentNode.removeChild(tagNode);
                }
            }
        }
    },
    cleanHeaders: function (e) {
        for (var headerIndex = 1; headerIndex < 3; headerIndex++) {
            var headers = e.getElementsByTagName("h" + headerIndex);
            for (var i = headers.length - 1; i >= 0; i--) {
                if (readability.getClassWeight(headers[i]) < 0 || readability.getLinkDensity(headers[i]) > 0.33) {
                    headers[i].parentNode.removeChild(headers[i]);
                }
            }
        }
    },
    easeInOut: function (start, end, totalSteps, actualStep) {
        var delta = end - start;
        if ((actualStep /= totalSteps / 2) < 1) {
            return delta / 2 * actualStep * actualStep + start;
        }
        return -delta / 2 * (--actualStep * (actualStep - 2) - 1) + start;
    },
    scrollTop: function (scroll) {
        var setScroll = typeof scroll != "undefined";
        if (setScroll) {
            return window.scrollTo(0, scroll);
        }
        if (typeof window.pageYOffset != "undefined") {
            return window.pageYOffset;
        } else if (document.documentElement.clientHeight) {
            return document.documentElement.scrollTop;
        } else {
            return document.body.scrollTop;
        }
    },
    curScrollStep: 0,
    scrollTo: function (scrollStart, scrollEnd, steps, interval) {
        if (scrollStart < scrollEnd && readability.scrollTop() < scrollEnd || scrollStart > scrollEnd && readability.scrollTop() > scrollEnd) {
            readability.curScrollStep++;
            if (readability.curScrollStep > steps) {
                return;
            }
            var oldScrollTop = readability.scrollTop();
            readability.scrollTop(readability.easeInOut(scrollStart, scrollEnd, steps, readability.curScrollStep));
            if (oldScrollTop == readability.scrollTop()) {
                return;
            }
            window.setTimeout(function () {
                readability.scrollTo(scrollStart, scrollEnd, steps, interval);
            }, interval);
        }
    },
    emailBox: function () {
        var emailContainerExists = document.getElementById("email-container");
        if (null !== emailContainerExists) {
            return;
        }
        var emailContainer = document.createElement("DIV");
        emailContainer.setAttribute("id", "email-container");
        emailContainer.innerHTML = "<iframe src=\"" + readability.emailSrc + "?pageUrl=" + escape(winLocation.href) + "&pageTitle=" + escape(document.title) + "\" scrolling=\"no\" onload=\"readability.removeFrame()\" style=\"width:500px; height: 490px; border: 0;\"></iframe>";
        document.body.appendChild(emailContainer);
    },
    removeFrame: function () {
        readability.iframeLoads++;
        if (readability.iframeLoads > 3) {
            {
                var emailContainer = document.getElementById("email-container");
            }
            if (null !== emailContainer) {
                emailContainer.parentNode.removeChild(emailContainer);
            }
            readability.iframeLoads = 0;
        }
    },
    htmlspecialchars: function (s) {
        if (typeof s == "string") {
            return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        return s;
    },
    flagIsActive: function (flag) {
        return (readability.flags & flag) > 0;
    },
    addFlag: function (flag) {
        readability.flags = readability.flags | flag;
    },
    removeFlag: function (flag) {
        readability.flags = readability.flags & ~flag;
    }
};
window.onerror = function errorHandler(aMessage) {
    dbg(aMessage);
    return true;
};
var winLocation = window.location;
if (winLocation == "about:blank" && window.parent !== window) {
    winLocation = window.parent.location;
}
window.STRINGS = {
    "be": {
        "error-part1": "<p>Функцыя \"Толькі тэкст\" не здолела прааналізаваць змесціва старонкі. Калі вы лічыце, што гэтая старонка магла быць прадстаўлена ў зручным для чытання выглядзе, калі ласка, %1адпраўце нам апісанне праблемы%2.</p>",
        "error-part2": "<p><strong>Верагодна, гэтая старонка ўтрымлівае фрэймы.</strong> На жаль, асаблівасці бяспекі браузера нярэдка выклікаюць памылку функцыі \"Толькі тэкст\" на старонках, якія ўтрымліваюць фрэймы. Запусціць функцыю \"Толькі тэкст\" можна на зыходнай старонцы: %1</p>",
        "error-part3": "<p>Гэтаксама функцыя \"Толькі тэкст\" можа не спрацоўваць на тытульных старонках. Функцыя \"Толькі тэкст\" прызначана для прадстаўлення артыкулаў, якія ўтрымліваюць тэкст значнага памеру, у зручным для чытання выглядзе.</p>",
        "homepage-warning": "Функцыя \"Толькі тэкст\" прызначана для працы з асобнымі артыкуламі, а не з хатнімі старонкамі. Калі вы ўсё ж хочаце змяніць прадстаўленне гэтай старонкі, %1пстрыкніце тут%2.",
        "reload-page": "Паказаць зыходную старонку",
        "print-page": "Друкаваць старонку",
        "email-page": "Адправіць старонку па электроннай пошце",
        "references": "Зноскі",
        "jump-to-link": "Перайсці да зноскі ў артыкуле",
        "fonts": "Шрыфты прадастаўлены %1Typekit%2",
        "page": "Старонка",
        "nextpage": "Прагледзець наступную старонку"
    },
    "cs": {
        "error-part1": "<p>Na dané stránce není k dispozici náhled ve formátu vhodném pro čtení.</p>",
        "error-part2": "<p><strong>Tato stránka pravděpodobně obsahuje rámečky.</strong> Bohužel, bezpečnostní nastavení vyhledávače často znemožňuje používání funkce „Pouze text\" na stránkách obsahujících rámečky. Funkci „Pouze text\" lze spustit na zdrojové stránce: %1</p>",
        "error-part3": "<p>Takže funkce „Pouze text\" není dostupná na stránkách s malým objemem textu, například na domovských stránkách.</p>",
        "homepage-warning": "Funkce „Pouze text\" je určena pro jednotlivé články, nikoli pro domovské stránky. Pokud i přesto chcete změnit zobrazení této stránky, %1klikněte sem%2.",
        "reload-page": "Zobrazit zdrojovou stránku",
        "print-page": "Vytisknout stránku",
        "email-page": "Odeslat stránku e-mailem",
        "references": "Odkazy",
        "jump-to-link": "Přejít k odkazu v článku",
        "fonts": "Fonty nastaveny na %1Typekit%2",
        "page": "Stránka",
        "nextpage": "Zobrazit následující stránku"
    },
    "en": {
        "error-part1": "<p>Sorry, \"Text only\" was unable to parse this page for content. If you feel like it should have been able to, please %1let us know by submitting an issue%2.</p>",
        "error-part2": "<p><strong>It appears this page uses frames.</strong> Unfortunately, browser security properties often cause \"Text only\" to fail on pages that include frames. You may want to try running \"Text only\" itself on this source page: %1</p>",
        "error-part3": "<p>Also, please note that \"Text only\" does not play very nicely with front pages. \"Text only\" is intended to work on articles with a sizable chunk of text that you'd like to read comfortably.</p>",
        "homepage-warning": "\"Text only\" was intended for use on individual articles and not home pages. If you'd like to try rendering this page anyway, %1click here%2 to continue.",
        "reload-page": "Reload original page",
        "print-page": "Print page",
        "email-page": "Email page",
        "references": "References",
        "jump-to-link": "Jump to Link in Article",
        "fonts": "Fonts by %1Typekit%2",
        "page": "Page",
        "nextpage": "View Next Page"
    },
    "kk": {
        "error-part1": "<p>\"Тек мәтін ғана\" функциясына беттің мазмұнын талдау мүмкін емес. Бұл бетті оқуға ыңғайлы пішімде көрсетуге болады деп санасаңыз, %1бізге мәселенің сипаттамасын жіберуіңізді сұраймыз%2.</p>",
        "error-part2": "<p><strong>Бұл беттің құрамында фрейм болуы мүмкін.</strong> Өкінішке орай, браузердің қауіпсіздік қызметі фреймдерден тұратын беттерде \"Тек мәтін ғана\" функциясының қатесіне әкеледі. \"Тек мәтін ғана\" функциясын бастапқы бетте іске қосуға болады: %1</p>",
        "error-part3": "<p>\"Тек мәтін ғана\" функциясының титулдық беттермен жұмысы жеткіліксіз болуы мүмкін. \"Тек мәтін ғана\" функциясы көлемді мақалаларды оқуға ыңғайлы пішімде көрсетуге арналған.</p>",
        "homepage-warning": "\"Тек мәтін ғана\" функциясы үй парақтары емес, дербес мақалалармен пайдалануға арналған. Егер сіз бұл беттің көрсетілімін өзгерткіңіз келсе, %1мынаны басыңыз%2.",
        "reload-page": "Бастапқы бетті көрсету",
        "print-page": "Бетті басып шығару",
        "email-page": "Бетті электрондық пошта арқылы жіберу",
        "references": "Түсіндірмелер",
        "jump-to-link": "Мақаладағы түсіндірмеге өту",
        "fonts": "Қаріптерді берген %1Typekit%2",
        "page": "Бет",
        "nextpage": "Келесі бетті көру"
    },
    "ru": {
        "error-part1": "<p>Функции \"Только текст\" не удалось проанализировать содержимое страницы. Если&#160;вы считаете, что эта страница могла&#160;бы быть представлена в&#160;виде, удобном для чтения, пожалуйста, %1отправьте нам описание проблемы%2.</p>",
        "error-part2": "<p><strong>Похоже, эта страница содержит фреймы.</strong> К&#160;сожалению, свойства безопасности браузера часто вызывают ошибку функции \"Только текст\" на&#160;страницах, содержащих фреймы. Запустить функцию \"Только текст\" можно на исходной странице: %1</p>",
        "error-part3": "<p>Также функция \"Только текст\" может не&#160;работать с титульными страницами. Функция \"Только текст\" предназначена для представления в&#160;удобном для чтения виде статей, содержащих текст значительного размера.</p>",
        "homepage-warning": "Функция \"Только текст\" предназначена для использования с отдельными статьями, а&#160;не&#160;с&#160;домашними страницами. Если&#160;вы всё&#160;же хотите изменить представление этой страницы, %1щёлкните здесь%2.",
        "reload-page": "Показать исходную страницу",
        "print-page": "Печатать страницу",
        "email-page": "Отправить страницу по электронной почте",
        "references": "Сноски",
        "jump-to-link": "Перейти к сноске в статье",
        "fonts": "Шрифты предоставлены %1Typekit%2",
        "page": "Страница",
        "nextpage": "Просмотреть следующую страницу"
    },
    "tr": {
        "error-part1": "<p>Geçerli sayfa rahat okunur olarak görüntülenemiyor.</p>",
        "error-part2": "<p><strong>Bu sayfa çerçeve kullanılarak tasarlanmış olabilir.</strong> К Maalesef, tarayıcının güvenlik ayarları çerçeve kullanılan sayfalarda genellikle \"Sadece metin\" işlevini engellemektedir. \"Sadece metin\" işlevini şu sayfalarda çalıştır: %1</p>",
        "error-part3": "<p>Ayrıca \"Sadece metin\" işlevi ana sayfalar gibi az sayıda metne sahip sayfalarda kullanılamaz.</p>",
        "homepage-warning": "\"Sadece metin\" işlevi sitenin öğelerinde kullanılmak için tasarlanmıştır. Ana sayfalar uygun değildir. Yine de sayfanın görünümünü değiştirmek istiyorsanız, %1buraya tıklayın%2.",
        "reload-page": "Girilen sayfayı göster",
        "print-page": "Sayfayı yazdır",
        "email-page": "Sayfayı e-posta ile gönder",
        "references": "Dipnotlar",
        "jump-to-link": "Öğedeki dipnota git",
        "fonts": "Yazı tipi %1Typekit%2 olarak görünüyor",
        "page": "Sayfa",
        "nextpage": "Sonraki sayfaya bak"
    },
    "uk": {
        "error-part1": "<p>Функції \"Лише текст\" не вдалося проаналізувати вміст сторінки. Якщо ви вважаєте, що ця сторінка могла б бути подана у вигляді, зручному для читання, будь ласка, %1надішліть нам опис проблеми%2.</p>",
        "error-part2": "<p><strong>Схоже, ця сторінка містить фрейми.</strong> На жаль, властивості безпеки браузера часто викликають помилку функції \"Лише текст\" на сторінках, що містять фрейми. Запустити функцію \"Лише текст\" можна на вихідній сторінці: %1</p>",
        "error-part3": "<p>Також функція \"Лише текст\" може не&#160;працювати з&#160;титульними сторінками. Функція \"Лише текст\" призначена для подання у&#160;зручному для читання вигляді статей, що&#160;містять текст значного розміру.</p>",
        "homepage-warning": "Функція \"Лише текст\" призначена для використання з&#160;окремими статтями, а&#160;не&#160;з&#160;домашніми сторінками. Якщо ви все&#160;ж хочете змінити подання цієї сторінки, %1клікніть&#160;тут%2.",
        "reload-page": "Показати вихідну сторінку",
        "print-page": "Друкувати сторінку",
        "email-page": "Надіслати сторінку електронною поштою",
        "references": "Посилання",
        "jump-to-link": "Перейти до виноски у статті",
        "fonts": "Шрифти подано %1Typekit%2",
        "page": "Сторінка",
        "nextpage": "Переглянути наступну сторінку"
    }
};
readability.getString = function (aStringId, aReplace) {
    var readLocale = window.readLocale || "ru";
    var strLocale = window.STRINGS[readLocale] || window.STRINGS["en"];
    var str = strLocale[aStringId];
    if (typeof str != "string")
        str = window.STRINGS["en"][aStringId] || "";
    if (aReplace) {
        for (var i = aReplace.length; i--;)
            str = str.replace("%" + (i + 1), aReplace[i]);
    }
    return str;
};
if (window.FX_MODE) {
    readability._init = readability.init;
    readability.init = function () {
        window.addEventListener("click", function (aEvent) {
            if (aEvent.button !== 0 || aEvent.shiftKey || aEvent.metaKey || aEvent.ctrlKey) {
                return;
            }
            var link = aEvent.target;
            while (link && !(link.localName && link.localName.toUpperCase() == "A" && link.href))
                link = link.parentNode;
            if (!link) {
                return;
            }
            if ([
                    "print-page",
                    "email-page"
                ].indexOf(link.getAttribute("id")) == -1) {
                aEvent.preventDefault();
                winLocation.href = link.href;
                window.close();
            }
        }, false);
        var throbberHolder;
        var docElement = document.documentElement;
        if (docElement && document.body) {
            docElement.style.overflow = "hidden";
            throbberHolder = document.getElementById("throbber-holder");
        }
        var readabilityInitStartTime = Date.now();
        try {
            readability._init();
        } catch (e) {
        }
        if (throbberHolder) {
            var contentStyle = document.getElementById("readability-content").style;
            contentStyle.opacity = 0;
            var opacitySteps = [
                0,
                0.15,
                0.35,
                0.57,
                0.72,
                0.82,
                0.9,
                0.96,
                1
            ];
            function animate() {
                this.step = (this.step || 0) + 1;
                this.opacity = opacitySteps[this.step];
                if (this.opacity < 1) {
                    contentStyle.opacity = this.opacity;
                } else {
                    window.clearInterval(animationInterval);
                    contentStyle.opacity = 1;
                }
            }
            var animationInterval;
            setTimeout(function () {
                throbberHolder.style.display = "none";
                docElement.style.overflow = "";
                animationInterval = window.setInterval(animate, 40);
            }, Math.max(0, 700 - (Date.now() - readabilityInitStartTime)));
        }
    };
}
readability.init();
