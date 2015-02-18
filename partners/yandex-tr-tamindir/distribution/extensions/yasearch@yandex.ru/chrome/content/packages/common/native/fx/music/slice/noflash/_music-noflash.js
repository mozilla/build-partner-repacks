;
(function () {
    window.addEventListener("load", function () {
        if (!window.platform) {
            window.platform = window.external;
        }
        var L10N = {
            title: window.platform.getLocalizedString("music.name"),
            text: window.platform.getLocalizedString("music.noflash"),
            link: window.platform.getLocalizedString("music.noflash.link")
        };
        var musicWidget = document.getElementsByClassName("b-music-widget")[0];
        var musicNoFlash = musicWidget.getElementsByClassName("b-music-noflash")[0];
        if (!musicNoFlash) {
            return;
        }
        var block = musicNoFlash.getElementsByClassName("b-music-noflash__text")[0];
        block.innerHTML = L10N.text;
        block = musicNoFlash.getElementsByClassName("b-music-noflash__text")[1];
        var match = /([\s\S]*?)\[a\]([\s\S]*?)\[\/a\]([\s\S]*)/.exec(L10N.link);
        window.platform.logger.debug(match, match[1], match[2], match[3]);
        if (match) {
            var prefixTextNode = document.createTextNode(match[1]);
            var linkText = match[2];
            var postfixTextNode = document.createTextNode(match[3]);
            var link = block.getElementsByClassName("b-link")[0];
            link.innerHTML = linkText;
            block.insertBefore(prefixTextNode, block.firstChild);
            block.appendChild(postfixTextNode);
        }
        ;
        var cmpStyle = window.getComputedStyle(musicWidget);
        var width = musicWidget.offsetWidth + parseInt(cmpStyle.marginLeft, 10) + parseInt(cmpStyle.marginRight, 10);
        var height = musicWidget.offsetHeight + parseInt(cmpStyle.marginTop, 10) + parseInt(cmpStyle.marginBottom, 10);
        window.platform.resizeWindowTo(width, height);
        window.platform.logger.debug("resize", width, height);
        var links = document.getElementsByTagName("a");
        for (var i = 0, length = links.length; i < length; i++) {
            links[i].addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var url = this.getAttribute("href");
                if (url) {
                    window.platform.navigate(url);
                    window.close();
                }
            });
        }
        ;
    }, false);
}());
