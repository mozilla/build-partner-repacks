var appContext = Components.classes["@mail.ru/toolbar/application;1"].getService().wrappedJSObject;
window.G_Assert = appContext.G_Assert;
window.G_Debug = appContext.G_Debug;

var MAIL_Settings = {
    services_array: null,
    city_xml: null,
    search_words_regexp: null,
    main_cites: null,
    init: function() {
        var a = new XMLHttpRequest();
        a.open('GET',
				'chrome://mail.ru.toolbar/locale/mail.ru.weather_city.xml',
				false);
        a.send(null);
        MAIL_Settings.city_xml = a.responseXML;
        var b = document
				.getElementById('mailru_settings_weather_cities_radios');
        var c = MAIL_Settings.city_xml.getElementsByTagName('maincities')[0];
        var d = 0;
        var e = null;

        MAIL_Settings.main_cites = new Array();
        for (var i = c.firstChild; i != null; i = i.nextSibling) {
            if (i.nodeType != i.ELEMENT_NODE)
                continue;
            if (i.nodeName.toLowerCase() == 'city') {
                MAIL_Settings.main_cites.push(i.getAttribute('id'));
                var f = document.createElement('radio');
                if (f) {
                    f.setAttribute('label', i.textContent.replace(/, .*$/, ''));
                    f.setAttribute('value', i.getAttribute('id'));
                    if (d == 0) {
                        e = document.createElement('vbox');
                        b.appendChild(e)
                    }
                    e.appendChild(f);
                    d++;
                    if (d > 3)
                        d = 0
                }

            }

        }

        if (!d) {
            e = document.createElement('vbox');
            b.appendChild(e)
        }
        var g = document.createElement('radio');
        if (g) {
            var h = 'Other';
            var k = document.getElementById('mailru_bundle');
            if (k)
                h = k.getString('overlay.toolbar.weather.city.other');
            g.setAttribute('label', h);
            g.setAttribute('value', 'cities_radios_other');
            //g.setAttribute('selected', 'true');
            e.appendChild(g)
        }
        var l = document.getElementById('mailru_settings_weather_cities_radios');
        //var m = read_reg_string('mail.ru.toolbar.weather.user_city_id', '0');
        var m = read_reg_string('mail.ru.toolbar.city.user_id', '0');
        if (m != '0') {
            var n = l.getElementsByTagName('radio');
            var i;
            for (i = 0; i < n.length; i++) {
                if (n[i].value == m) {
                    l.value = m;
                    break
                }

            }
            if (i == n.length)
                l.value = 'cities_radios_other'
        } else {
            l.value = 'cities_radios_other'
        }
        MAIL_Settings.fill_cities_list();
        MAIL_Settings.city_radio_select(null);
        var o = document.getElementById('mailru_settings_weather_search_select');
        var n = o.getElementsByTagName('listitem');
        for (var i = 0; i < n.length; i++) {
            if (n[i].getAttribute('value') == m) {
                o.scrollToIndex(i);
                o.selectItem(o.getItemAtIndex(i));
                break
            }

        }
        var p = read_reg_string('mail.ru.toolbar.currency.display', 'usd');
        var q = p.split(', ');
        var r = new XMLHttpRequest();
        r.open('GET', 'chrome://mail.ru.toolbar/locale/sputnik/mail.ru.cyrrencies.xml',false);
        r.send(null);
        var s = document.getElementById('mailru_settings_currency_tree_children');
        var t = r.responseXML.getElementsByTagName('currencies')[0];
        for (var i = t.firstChild; i != null; i = i.nextSibling) {
            if (i.nodeType != i.ELEMENT_NODE)
                continue;
            if (i.nodeName.toLowerCase() == 'currency') {
                var u = document.createElement('treeitem');
                var v = document.createElement('treerow');
                var w = document.createElement('treecell');
                var x = document.createElement('treecell');
                var y = document.createElement('treecell');
                var z = i.getAttribute('name');
                var A = false;
                for (var j = 0; j < q.length; j++) {
                    if (z == trim(q[j])) {
                        A = true;
                        break
                    }

                }
                w.setAttribute('value', A);
                x.setAttribute('label', i.getAttribute('name').toUpperCase());
                x.setAttribute('align', 'center');
                y.setAttribute('label', i.textContent);
                v.appendChild(w);
                v.appendChild(x);
                v.appendChild(y);
                u.appendChild(v);
                s.appendChild(u)
            }

        }
        var B = new XMLHttpRequest();
        B.open('GET', 'chrome://mail.ru.toolbar/locale/sputnik/mail.ru.fast-services.xml',
				false);
        B.send(null);
        MAIL_Settings.services_array = new Array();
        var sVisButtons = read_reg_string('mail.ru.toolbar.services.display');
        var aVisButtons = sVisButtons.split(',');
        for (var i = 0; i < aVisButtons.length; i++) {
            MAIL_Settings.services_array.push(trim(aVisButtons[i]))
        }
        MAIL_Settings.fill_services_tree(
			B.responseXML.childNodes.item(0),
			document.getElementById('mailru_settings_services_children')
		);
        document.getElementById('mailru_settings_display_services_labels').checked = read_reg_bool('mail.ru.toolbar.services.display.labels', true);

        sVisButtons = read_reg_string('mail.ru.toolbar.buttons.display');
        aVisButtons = sVisButtons.split(',');
        for (var i = 0; i < aVisButtons.length; ++i) {
            if (aVisButtons[i] == 'mailru_zoom_btn') {
                document.getElementById(
					'mailru_settings_display_zoom_btn_check'
				).checked = true;
            }
            else if (aVisButtons[i] == 'mailru_hilight_btn') {
                document.getElementById(
					'mailru_settings_display_hilight_btn_check'
				).checked = true;
            }
            else if (aVisButtons[i] == 'mailru_entry_btn') {
                document.getElementById(
					'mailru_settings_display_search_btn_check'
				).checked = true;

            }
        }
        document.getElementById('mailru_settings_url_search_btn_check').checked = read_reg_bool('mailru_settings_url_search_btn_check');
        document.getElementById('mailru_settings_hook_mailto_check').checked = read_reg_bool('mail.ru.toolbar.hook_mailto', true);
        document.getElementById('mailru_settings_show_weather').checked = read_reg_bool('mailru_settings_weather_show', true);
        document.getElementById('mailru_settings_show_maps').checked = read_reg_bool('mailru_settings_maps_show', true);
        document.getElementById('mailru_settings_show_mail').checked = read_reg_bool('mailru_settings_mail_show', true);
        document.getElementById('mailru_settings_show_odkl').checked = read_reg_bool('mailru_settings_odkl_show', true);
        document.getElementById('mailru_settings_show_my').checked = read_reg_bool('mailru_settings_my_show', true);
        document.getElementById('mailru_settings_music_btn_check').checked = read_reg_bool('mailru_settings_music_show', true);
        document.getElementById('mailru_settings_shortmode_check').checked = read_reg_bool('mail.ru.toolbar.shortmode', false);
        document.getElementById('mailru_settings_visualbookmarks_check').checked = read_reg_bool('mail.ru.toolbar.visualbookmarks', true);
        document.getElementById('mailru_settings_html_block_btn_check').checked = read_reg_bool('mail.ru.toolbar.error_url_form', true);
        document.getElementById('mailru_settings_currency_acc').checked = read_reg_bool('mail.ru.toolbar.currency.accurancy', true);
        document.getElementById('mailru_settings_show_vote').checked = read_reg_bool('mailru_settings_vote_show', true);
        document.getElementById('mailru_settings_show_money').checked = read_reg_bool('mailru_settings_money_show', true);

        var sel_tab = read_reg_string("settings_selected_tab", "");
        document.getElementById("settings_tabbox").selectedTab = document.getElementById(sel_tab);
        write_reg_string("settings_selected_tab", '');


    },
    accept: function() {
        G_Debug("Settings", "accept");
        var prefs = new appContext.G_Preferences("", false, false);
        G_Debug("Settings", "accept prefs:" + prefs);
        if (document.getElementById('mailru_settings_weather_cities_radios').value == 'cities_radios_other') {
            write_reg_string('mail.ru.toolbar.city.user_id',document.getElementById('mailru_settings_weather_search_select').value);
        } else {
            write_reg_string('mail.ru.toolbar.city.user_id',document.getElementById('mailru_settings_weather_cities_radios').value);
        }
        write_reg_string('mail.ru.toolbar.city.server_id', '0');
        write_reg_string('mail.ru.toolbar.weather.temperature.format', document.getElementById('mailru_weather_temperature_mode_list').value);
        var currencies = '';
        var currencyTree = document.getElementById('mailru_settings_currency_tree_children');
        var currencyRows = currencyTree.getElementsByTagName('treerow');
        for (var i = 0; i < currencyRows.length; i++) {
            var currencyCell = currencyRows[i].getElementsByTagName('treecell');
            if (currencyCell[0].getAttribute('value') == 'true') {
                if (currencies != '')
                    currencies += ', ';
                currencies += currencyCell[1].getAttribute('label').toLowerCase()
            }

        }
        write_reg_string('mail.ru.toolbar.currency.display', currencies);
        MAIL_Settings.services_array = new Array();
        var xmlServicesList = document.getElementById('mailru_settings_services_children');
        MAIL_Settings.build_services_list(xmlServicesList);

        if (xmlServicesList) {
            write_reg_string(
				'mail.ru.toolbar.services.display',
				MAIL_Settings.services_array.toString()
			);
            prefs.setBoolPref(
					'mail.ru.toolbar.services.display.labels',
					document.getElementById('mailru_settings_display_services_labels').checked
			);
        }
        var aVisButtons = new Array();
        if (document.getElementById('mailru_settings_display_zoom_btn_check').checked) {
            aVisButtons.push('mailru_zoom_btn');
        }
        if (document.getElementById('mailru_settings_display_hilight_btn_check').checked) {
            aVisButtons.push('mailru_hilight_btn');
        }
        if (document.getElementById('mailru_settings_display_search_btn_check').checked) {
            aVisButtons.push('mailru_entry_btn');
        }
        prefs.setBoolPref('mailru_settings_url_search_btn_check', document.getElementById('mailru_settings_url_search_btn_check').checked);
        write_reg_string('mail.ru.toolbar.buttons.display', aVisButtons.toString());
        prefs.setBoolPref('mailru_settings_weather_show', document.getElementById('mailru_settings_show_weather').checked);
        prefs.setBoolPref('mailru_settings_maps_show', document.getElementById('mailru_settings_show_maps').checked);
        prefs.setBoolPref('mailru_settings_mail_show', document.getElementById('mailru_settings_show_mail').checked);
        prefs.setBoolPref('mailru_settings_odkl_show', document.getElementById('mailru_settings_show_odkl').checked);
        prefs.setBoolPref('mailru_settings_my_show', document.getElementById('mailru_settings_show_my').checked);
        prefs.setBoolPref('mail.ru.toolbar.currency.accurancy', document.getElementById('mailru_settings_currency_acc').checked);
        prefs.setBoolPref('mailru_settings_music_show', document.getElementById('mailru_settings_music_btn_check').checked);
        prefs.setBoolPref('mail.ru.toolbar.shortmode', document.getElementById('mailru_settings_shortmode_check').checked);
        prefs.setBoolPref('mail.ru.toolbar.error_url_form', document.getElementById('mailru_settings_html_block_btn_check').checked);
        prefs.setBoolPref('mail.ru.toolbar.visualbookmarks', document.getElementById('mailru_settings_visualbookmarks_check').checked);
        prefs.setBoolPref('mailru_settings_vote_show', document.getElementById('mailru_settings_show_vote').checked);
        prefs.setBoolPref('mailru_settings_money_show', document.getElementById('mailru_settings_show_money').checked);
        window.opener.returnValue = true;
        
    },
    restruct_window_buttons: function(a, sButtonId, bChecked) {
        if (bChecked) {
            var nodeToolbar = a.document.getElementById('mailru_main_toolbar');
            if (nodeToolbar) {
                if (a.document.getElementById(sButtonId) == null) {
                    var sInsertAfterNode = '';
                    var nodeSearchItem = a.document.getElementById('mailru_search_item');
                    if (nodeSearchItem) {
                        sInsertAfterNode = 'mailru_search_item';
                        nodeToolbar.insertItem(sButtonId, nodeSearchItem.nextSibling, null, false)
                    }
                    else {
                        nodeToolbar.insertItem(sButtonId, nodeToolbar.firstChild, null, false)
                    }
                    var g = nodeToolbar.getAttribute('currentset').split(',');
                    var h = new Array();
                    for (var i = 0; i < g.length; i++) {
                        h.push(g[i]);
                        if (g[i] == sInsertAfterNode) {
                            h.push(sButtonId);
                        }
                    }
                    nodeToolbar.setAttribute('currentset', h.toString());
                    a.document.persist(nodeToolbar.id, 'currentset')
                }

            }

        }
        else {
            var j = a.document.getElementById(sButtonId);
            if (j) {
                var d = j.parentNode;
                d.removeChild(j);
                var g = d.getAttribute('currentset').split(',');
                for (var i = 0; i < g.length; i++) {
                    if (g[i] == sButtonId) {
                        delete g[i];
                        d.setAttribute('currentset', g.toString());
                        a.document.persist(d.id, 'currentset');
                        break
                    }

                }

            }

        }

    },
    currency_tree_keyboard_select: function(a) {
        if (a.keyCode == KeyEvent.DOM_VK_SPACE) {
            var b = document.getElementById('mailru_settings_currency_tree');
            var c = b.contentView.getItemAtIndex(b.currentIndex);
            if (c != null) {
                var d = c.getElementsByTagName('treecell')[0];
                var e = d.getAttribute('value');
                e = ((e == 'true') ? 'false' : 'true');
                d.setAttribute('value', e)
            }

        }

    },
    services_tree_keyboard_select: function(a) {
        if (a.keyCode == KeyEvent.DOM_VK_SPACE) {
            var b = document.getElementById('mailru_settings_services_tree');
            var c = b.contentView.getItemAtIndex(b.currentIndex);
            if (c != null) {
                var d = c.getElementsByTagName('treecell')[0];
                var e = d.getAttribute('value');
                e = ((e == 'true') ? 'false' : 'true');
                d.setAttribute('value', e)
            }

        }

    },
    hook_mailto_check: function() {
        write_reg_bool(
				'mail.ru.toolbar.hook_mailto',
				document.getElementById('mailru_settings_hook_mailto_check').checked);
    },
    shortmode: function() {
        if (document.getElementById('mailru_settings_shortmode_check').checked) {
            MAIL_Settings.set_services_list(document.getElementById('mailru_settings_services_children'), []);
            MAIL_Settings.set_currencies_list([]);
            document.getElementById('mailru_settings_show_vote').checked = false;
            document.getElementById('mailru_settings_show_money').checked = false;
            document.getElementById('mailru_settings_show_maps').checked = false;
            document.getElementById('mailru_settings_show_my').checked = false;
        }
        else {
            MAIL_Settings.set_services_list(
                document.getElementById('mailru_settings_services_children'),
                ["my_world", "games", "foto", "video", "answers"]
            );
            MAIL_Settings.set_currencies_list(["usd", "eur"]);
            document.getElementById('mailru_settings_show_vote').checked = true;
            document.getElementById('mailru_settings_show_money').checked = true;
            document.getElementById('mailru_settings_show_maps').checked = true;
            document.getElementById('mailru_settings_show_my').checked = true;
        }

    },
    
    set_currencies_list: function(aCurrencies) {
        var currencyTree = document.getElementById('mailru_settings_currency_tree_children');
        var currencyRows = currencyTree.getElementsByTagName('treerow');
        for (var i = 0; i < currencyRows.length; i++) {
            var currencyCell = currencyRows[i].getElementsByTagName('treecell');
            var bCheck = false;
            for (var nCurrency = 0; nCurrency < aCurrencies.length; ++nCurrency) {
                if (aCurrencies[nCurrency] == currencyCell[1].getAttribute('label').toLowerCase()) {
                    bCheck = true;
                    break;
                }
            }
            currencyCell[0].setAttribute('value', bCheck);
        }

    },
    build_services_list: function(a) {
        for (var i = a.firstChild; i != null; i = i.nextSibling) {
            if (i.nodeType != i.ELEMENT_NODE)
                continue;
            if (i.nodeName.toLowerCase() == 'treeitem') {
                if (i.hasAttribute('service_id')) {
                    var b = i.firstChild;
                    var c = b.firstChild;
                    if (c.getAttribute('value') == 'true') {
                        MAIL_Settings.services_array.push(i.getAttribute('service_id'));
                    }
                }
                var d = i.lastChild;
                if (d.hasChildNodes)
                    MAIL_Settings.build_services_list(d)
            }

        }

    },
    set_services_list: function(a, aServices) {
        for (var i = a.firstChild; i != null; i = i.nextSibling) {
            if (i.nodeType != i.ELEMENT_NODE)
                continue;
            if (i.nodeName.toLowerCase() == 'treeitem') {
                if (i.hasAttribute('service_id')) {
                    var checkbox = i.firstChild.firstChild;
                    var bCheck = false;
                    for (var nService = 0; nService < aServices.length; ++nService) {
                        if (aServices[nService] == i.getAttribute('service_id')) {
                            bCheck = true;
                            break;
                        }
                    }
                    checkbox.setAttribute('value', bCheck);
                }
                var d = i.lastChild;
                if (d.hasChildNodes)
                    MAIL_Settings.build_services_list(d, aServices)
            }

        }

    },
    fill_services_tree: function(a, b) {
        for (var i = a.firstChild; i != null; i = i.nextSibling) {
            if (i.nodeType != i.ELEMENT_NODE)
                continue;
            if ((i.nodeName.toLowerCase() == 'services') 
                || (i.nodeName.toLowerCase() == 'service')
                ) {
                var c = (i.nodeName.toLowerCase() == 'services');
                var d = document.createElement('treechildren');
                var e = document.createElement('treeitem');
                var f = document.createElement('treerow');
                var nodeCheck = document.createElement('treecell');
                var nodeImg = document.createElement('treecell');
                var nodeLabel = document.createElement('treecell');
                if (c) {
                    nodeCheck.setAttribute('properties', 'cat_node_check');
                    nodeImg.setAttribute('properties', 'cat_node_title')
                }
                else {

                    for (var j = 0; j < MAIL_Settings.services_array.length; j++) {
                        if (MAIL_Settings.services_array[j] == i.getAttribute('id')) {
                            nodeCheck.setAttribute('value', true);
                            break
                        }

                    }
                    nodeImg.setAttribute('properties', 'child_node_title')
                }
                nodeImg.setAttribute(
					'label',
					(c ? i.getAttribute('title') : i.textContent)
				);
                nodeImg.setAttribute('src', i.getAttribute('img'));
                nodeLabel.setAttribute('label', i.getAttribute('hint'));
                f.appendChild(nodeCheck);
                f.appendChild(nodeImg);
                f.appendChild(nodeLabel);
                e.setAttribute('service_id', i.getAttribute('id'));
                e.appendChild(f);
                e.appendChild(d);
                if (c && i.hasChildNodes) {
                    e.setAttribute('container', 'true');
                    e.setAttribute('open', 'true');
                    MAIL_Settings.fill_services_tree(i, d)
                }
                b.appendChild(e);
                if (c) {
                    b.appendChild(document.createElement('treeseparator'))
                }
            }
        }
    },
    fill_cities_list: function() {
        //var b = read_reg_string('mail.ru.toolbar.weather.user_city_id', '');
		var b = read_reg_string('mail.ru.toolbar.city.user_id', '0');
        var c = false;
        var d = document.getElementById('mailru_settings_weather_search_select');
        while (d.childNodes.length > 1) {
            d.removeChild(d.childNodes[1])
        }
        var e = document.getElementById('mailru_settings_weather_search_city').value;
        var f = e.split(' ');
        var g = '';
        for (var i = 0; i < f.length; i++) {
            if (g != '')
                g = g + '.*?';
            g = g + f[i]
        }
        var h = MAIL_Settings.city_xml.getElementsByTagName('cities')[0];
        MAIL_Settings.search_words_regexp = new RegExp(g, 'ig');
        var j = MAIL_Settings.city_xml.createTreeWalker(h,
				NodeFilter.SHOW_ELEMENT, {
				    acceptNode: function(a) {
				        if (a.textContent
								.match(MAIL_Settings.search_words_regexp) != null) {
				            return NodeFilter.FILTER_ACCEPT
				        } else {
				            return NodeFilter.FILTER_SKIP
				        }

				    }

				}, false);
        var k = 0;
        if (j.firstChild()) {
            do {
//                if (k < 100) {
                    if (j.currentNode.getAttribute('id') == b)
                        c = true;
                    var l = document.createElement('listitem');
                    l.setAttribute('value', j.currentNode.getAttribute('id'));
                    l.setAttribute('label', j.currentNode.textContent);
                    d.appendChild(l);
                    k++
//                } else {
//                    if (c)
//                        break;
//                    if (b == j.currentNode.getAttribute('id')) {
//                        var l = document.createElement('listitem');
//                        l.setAttribute('value', j.currentNode.getAttribute('id'));
//                        l.setAttribute('label', j.currentNode.textContent);
//                        d.appendChild(l);
//                        c = true;
//                        break
//                    }
//
//                }

            } while (j.nextSibling())
        }

    },
    city_text_enter: function(a) {
        setTimeout(MAIL_Settings.fill_cities_list, 500)
    },
    city_radio_select: function(a) {
        var b = document.getElementById('mailru_settings_weather_search_city');
        var c = document.getElementById('mailru_settings_weather_search_select');
        var d = document.getElementById('mailru_settings_weather_cities_radios');
        if (d.value != 'cities_radios_other') {
            if (b.value != '') {
                b.value = '';
                MAIL_Settings.fill_cities_list()
            }
        } else {
            var e = c.getElementsByTagName('listitem');
            for (var i = 0; i < e.length; i++) {
                if (e[i].getAttribute('value') == d.value) {
                    c.scrollToIndex(i);
                    c.selectItem(c.getItemAtIndex(i));
                    break;
                }
            }
//            c.scrollToIndex(0);
//            c.selectedIndex = 0
        }
        b.disabled = (d.value != 'cities_radios_other');
        c.disabled = (d.value != 'cities_radios_other')
    },
    visit_home_site: function(a) {
        var b = 'http://mail.ru/';
        var c = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
				.getService(Components.interfaces.nsIExternalProtocolService);
        var d = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService);
        var e = d.newURI(b, null, null);
        if (c.isExposedProtocol(e.scheme)) {
            var f = window.top;
            if (f instanceof Components.interfaces.nsIDOMChromeWindow) {
                while (f.opener && !f.opener.closed)
                    f = f.opener
            }
            f.open(e.spec)
        } else
            c.loadUrl(e)
    }
}
