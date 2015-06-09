"use strict";
var MAX_HISTORY_RESULTS = 100;
var MAX_PICKUP_LENGTH = 49 + 24 + 3;
importScripts("./pickupAdapter.js");
var fromParam;
var clckrUrlToHost;
var domainGroups;
var hostToGroup = Object.create(null);
var messagesToDump;
function copyObj(src, deep) {
    if (typeof src != "object" || !src) {
        return src;
    }
    if (Array.isArray(src)) {
        return src.map(function (el) {
            return deep ? copyObj(el, deep) : el;
        }, this);
    }
    var result = {};
    for (var [
                name,
                value
            ] in Iterator(src)) {
        result[name] = deep ? copyObj(value, deep) : value;
    }
    return result;
}
function log(name, data) {
    if (arguments.length === 1) {
        data = "";
    }
    var MAX_DATA_LENGTH = 6000;
    if (typeof data === "object") {
        data = JSON.stringify(data);
    }
    messagesToDump.push(name + (arguments.length === 1 ? " " : ": ") + data);
}
function filterBrandedByPinned(branded, pinnedDomains) {
    var filtered = [];
    branded.forEach(page => {
        if (!(getHost(page.url) in pinnedDomains)) {
            filtered.push(page);
        }
    });
    return filtered;
}
function getAliases(host) {
    host = host.replace(/^www\./, "");
    var group = hostToGroup[host];
    if (!group) {
        return [];
    }
    return domainGroups[group];
}
function mergeHistory(topHistory, localHistory, unsafe, branded) {
    var mergedTopHistory = [];
    var queueDomains = Object.create(null);
    var historyEntries = branded.map(entry => prepareURLForServer(entry.url));
    var topHistoryHash = {};
    topHistory.forEach(elem => {
        topHistoryHash[elem.url] = elem.id;
    });
    var placesCounter = 0;
    var topHistoryCounter = 0;
    while (mergedTopHistory.length < MAX_HISTORY_RESULTS) {
        var historyNode = localHistory[placesCounter];
        var topHistoryElem = topHistory[topHistoryCounter];
        var host;
        if (!historyNode && !topHistoryElem) {
            break;
        }
        if (!topHistoryElem || historyNode && historyNode.visits >= topHistoryElem.visits) {
            placesCounter += 1;
            host = getHost(historyNode.url);
            if (host && (queueDomains[host] || unsafe.indexOf(host) !== -1)) {
                continue;
            }
            mergedTopHistory.push({
                id: topHistoryHash[historyNode.uri] || null,
                url: historyNode.url,
                title: historyNode.title,
                visits: historyNode.visits,
                isLocal: true
            });
            if (host) {
                queueDomains[host] = 1;
            }
            historyEntries.push(historyNode.url);
        } else {
            topHistoryCounter += 1;
            host = getHost(topHistoryElem.url);
            if (host && (queueDomains[host] || unsafe.indexOf(host) !== -1)) {
                continue;
            }
            mergedTopHistory.push(topHistoryElem);
            if (host) {
                queueDomains[host] = 1;
            }
        }
    }
    var mergedLocalHistory = mergedTopHistory.map(entry => {
        entry = copyObj(entry);
        entry.statParam = "autothumb";
        if (entry.isLocal) {
            return entry;
        }
        entry.url = saveLocalClidState(entry.url, historyEntries);
        return entry;
    }, this);
    return {
        local: mergedLocalHistory,
        topHistory: mergedTopHistory
    };
}
function convertPageToThumb(page) {
    var output = {
        pinned: Boolean(page.pinned || page.fixed),
        url: page.url || page.url,
        sync: {}
    };
    [
        "title",
        "visits",
        "statParam"
    ].forEach(fieldName => {
        if (fieldName in page) {
            output[fieldName] = page[fieldName];
        }
    });
    [
        "Id",
        "Instance",
        "Timestamp",
        "InternalId"
    ].forEach(fieldName => {
        var dbField = "sync" + fieldName;
        var syncKey = fieldName[0].toLowerCase() + fieldName.substr(1);
        if (page[dbField]) {
            output.sync[syncKey] = page[dbField];
        }
    });
    return output;
}
function getForceAndPinnedThumbs(pinned, branded) {
    var output = {};
    var emptyPositions = [];
    for (var i = 0; i < MAX_PICKUP_LENGTH; i++) {
        if (pinned[i]) {
            output[i] = pinned[i];
        } else {
            emptyPositions.push(i);
        }
    }
    branded.filter(page => page.force).forEach(page => {
        var preferedIndex = page.preferedIndex;
        page = convertPageToThumb(page);
        if (output[preferedIndex] === undefined) {
            output[preferedIndex] = page;
        } else {
            if (emptyPositions.length) {
                output[emptyPositions.shift()] = page;
            }
        }
    });
    return output;
}
function createMostVisitedList(blocked, regexps, branded, historyEntries, free) {
    var output = [];
    var queueDomains = Object.create(null);
    while (branded.length || historyEntries.length || output.length < free) {
        var brandedPage = branded.length ? branded[0] : null;
        var historyPage = historyEntries.length ? historyEntries[0] : null;
        if (!historyPage && !brandedPage) {
            break;
        }
        var page = !historyPage || brandedPage && brandedPage.boost > historyPage.visits ? branded.shift() : historyEntries.shift();
        var domain = getHost(page.url);
        if (!domain || queueDomains[domain] || blocked.indexOf(domain) !== -1) {
            continue;
        }
        var isDeniedByRegexp = regexps.some(regexpString => {
            var regex = new RegExp(regexpString);
            return regex.test(page.url);
        });
        if (isDeniedByRegexp) {
            continue;
        }
        queueDomains[domain] = 1;
        getAliases(domain).forEach(alias => {
            queueDomains[alias] = 1;
        });
        page.pinned = 0;
        page.visits = page.visits || page.boost;
        output.push(page);
    }
    return output;
}
function getUrlFromPage({url}) {
    return url;
}
function beautifyMostVisited(mostVisited) {
    return mostVisited.map(page => {
        var url = page.url;
        if (url.length > 60) {
            url = url.slice(0, 58) + "...";
        }
        return {
            url: url,
            visits: page.visits
        };
    });
}
function compactThumbs(thumbs) {
    var maxIndex = Math.max.apply(Math, Object.keys(thumbs).map(key => parseInt(key, 10)));
    var currentIndex = 0;
    var emptyIndex = -1;
    for (var i = 0; i <= maxIndex; i++) {
        if (thumbs[currentIndex]) {
            if (emptyIndex !== -1) {
                thumbs[emptyIndex] = thumbs[currentIndex];
                delete thumbs[currentIndex];
                emptyIndex++;
            }
            currentIndex++;
            continue;
        }
        if (emptyIndex === -1) {
            emptyIndex = currentIndex;
        }
        currentIndex++;
    }
}
function processData(data) {
    messagesToDump = [];
    var iterateInternalStructure = (callback, index) => {
        Object.keys(internalStructure).forEach(index => {
            callback(internalStructure[index], parseInt(index, 10));
        });
    };
    var topHistory = data.topHistory;
    var blacklist = data.blacklist;
    var unsafe = data.unsafe;
    var internalStructure = data.internalStructure;
    var branded = data.branded;
    var options = data.options;
    var localHistory = data.localHistory;
    var prevMostVisitedList = data.prevMostVisitedList;
    var currentThumbsNum = data.currentThumbsNum;
    var maxThumbsCount = currentThumbsNum;
    if ("maxThumbsCount" in options) {
        maxThumbsCount = options.maxThumbsCount;
    }
    log("Options", options);
    log("Branded", branded.map(getUrlFromPage));
    var pinned = Object.create(null);
    var pinnedDomains = Object.create(null);
    var urlToPosition = Object.create(null);
    iterateInternalStructure((thumb, index) => {
        if (thumb.url && index < currentThumbsNum) {
            urlToPosition[thumb.url] = index;
        }
        if (thumb.pinned) {
            pinned[index] = thumb;
            var host = getHost(thumb.url);
            if (host) {
                pinnedDomains[host] = true;
                getAliases(host).forEach(alias => pinnedDomains[alias] = true);
            }
        }
    });
    branded.sort((pageA, pageB) => pageB.boost - pageA.boost);
    var brandedWithoutPinned = filterBrandedByPinned(branded, pinnedDomains);
    log("brandedWithoutPinned", brandedWithoutPinned.map(getUrlFromPage));
    var allBlockedDomains = Array.concat(data.unsafe, data.blacklist.domains);
    var mergedData = mergeHistory(topHistory, localHistory, unsafe, brandedWithoutPinned);
    var historyEntries = mergedData.local;
    var topHistoryEntries = mergedData.topHistory;
    var fixedThumbs = options.force ? getForceAndPinnedThumbs(pinned, brandedWithoutPinned) : pinned;
    for (var index in fixedThumbs) {
        var fixedThumb = fixedThumbs[index];
        if (fixedThumb.url) {
            var host = getHost(fixedThumb.url);
            if (host) {
                pinnedDomains[host] = true;
                allBlockedDomains.push(host);
                getAliases(host).forEach(alias => {
                    pinnedDomains[alias] = true;
                    allBlockedDomains.push(alias);
                });
                allBlockedDomains = allBlockedDomains.concat(getAliases(host));
            }
        }
    }
    log("Blocked domains", allBlockedDomains);
    var free = Math.max(MAX_PICKUP_LENGTH - Object.keys(fixedThumbs).length, 0);
    var mostVisitedList = createMostVisitedList(allBlockedDomains, blacklist.regexps, brandedWithoutPinned, historyEntries, free);
    log("Most visited", beautifyMostVisited(mostVisitedList));
    prevMostVisitedList.forEach(prevEntry => {
        var foundInCurrentList = false;
        var host = getHost(prevEntry.url);
        mostVisitedList.forEach(entry => {
            if (entry.url === prevEntry.url) {
                foundInCurrentList = true;
                entry.visits = Math.max(entry.visits || 0, prevEntry.visits);
                return;
            }
            var entryHost = getHost(entry.url);
            if (host === entryHost) {
                foundInCurrentList = true;
            } else {
                getAliases(entryHost).some(alias => {
                    if (alias === host) {
                        foundInCurrentList = true;
                        return true;
                    }
                    return false;
                });
            }
        });
        if (foundInCurrentList) {
            return;
        }
        var foundInPinned = Object.keys(fixedThumbs).some(thumbIndex => {
            var fixedThumb = fixedThumbs[thumbIndex];
            return fixedThumb.url === prevEntry.url;
        });
        if (foundInPinned) {
            return;
        }
        if (host && allBlockedDomains.indexOf(host) !== -1 || false) {
            return;
        }
        mostVisitedList.push(prevEntry);
    });
    var mostVisitedCopy = mostVisitedList.slice();
    topHistoryEntries = topHistoryEntries.filter(entry => {
        var host = getHost(entry.url);
        return !host || unsafe.indexOf(host) === -1;
    });
    var unpinnedCount = currentThumbsNum - Object.keys(fixedThumbs).length;
    var newThumbs = copyObj(fixedThumbs);
    log("Fixed thumbs", Object.keys(newThumbs).reduce((res, index) => {
        res[index] = newThumbs[index].url;
        return res;
    }, {}));
    mostVisitedList.sort((a, b) => {
        var aVisits = a.visits || 0;
        var bVisits = b.visits || 0;
        return bVisits - aVisits;
    });
    var i;
    if (mostVisitedList.length > 1) {
        var isShuffled = true;
        var currentItem;
        var currentItemPosition;
        var prevItemPosition;
        var prevItem;
        while (isShuffled) {
            isShuffled = false;
            for (i = 1; i < mostVisitedList.length; i++) {
                currentItem = mostVisitedList[i];
                prevItem = mostVisitedList[i - 1];
                currentItemPosition = urlToPosition[currentItem.url];
                prevItemPosition = urlToPosition[prevItem.url];
                if (typeof currentItemPosition === "number" && prevItem.visits === currentItem.visits) {
                    if (typeof prevItemPosition !== "number") {
                        [
                            mostVisitedList[i - 1],
                            mostVisitedList[i]
                        ] = [
                            currentItem,
                            prevItem
                        ];
                        isShuffled = true;
                        break;
                    }
                }
            }
        }
        for (i = 0; i < mostVisitedList.length; i++) {
            mostVisitedList[i].index = i;
        }
        isShuffled = true;
        while (isShuffled) {
            isShuffled = false;
            for (i = 1; i < mostVisitedList.length; i++) {
                currentItem = mostVisitedList[i];
                prevItem = mostVisitedList[i - 1];
                currentItemPosition = urlToPosition[currentItem.url];
                prevItemPosition = urlToPosition[prevItem.url];
                if (typeof currentItemPosition === "number" && prevItem.visits === currentItem.visits) {
                    if (typeof prevItemPosition === "number" && prevItem.index < currentItem.index) {
                        [
                            mostVisitedList[i - 1],
                            mostVisitedList[i]
                        ] = [
                            currentItem,
                            prevItem
                        ];
                        isShuffled = true;
                        break;
                    }
                }
            }
        }
    }
    log("Merged mostVisitedList: ", beautifyMostVisited(mostVisitedList));
    mostVisitedList = mostVisitedList.map((thumbData, i) => {
        var converted = convertPageToThumb(thumbData);
        converted.position = urlToPosition[thumbData.url];
        return converted;
    });
    var visibleMostVisitedList = mostVisitedList.slice(0, unpinnedCount);
    var invisibleMostVisitedList = mostVisitedList.slice(unpinnedCount, mostVisitedList.length);
    var freePositions = [];
    invisibleMostVisitedList.forEach(thumbData => {
        if (typeof thumbData.position === "number") {
            freePositions.push(thumbData.position);
            delete thumbData.position;
        }
    });
    var withFixPosition = [];
    var visibleWithoutPosition = [];
    visibleMostVisitedList.forEach(thumbData => {
        if (freePositions.length && typeof thumbData.position !== "number") {
            thumbData.position = freePositions.shift();
        }
        if (typeof thumbData.position === "number") {
            withFixPosition.push(thumbData);
        } else {
            visibleWithoutPosition.push(thumbData);
        }
    });
    log("Visible with fix position", withFixPosition.map(page => page.url));
    log("Visible without fix position", visibleWithoutPosition.map(page => page.url));
    log("Invisible", invisibleMostVisitedList.map(page => page.url));
    invisibleMostVisitedList = visibleWithoutPosition.concat(invisibleMostVisitedList);
    withFixPosition.forEach(thumbData => {
        if (!newThumbs[thumbData.position]) {
            newThumbs[thumbData.position] = thumbData;
        } else {
            invisibleMostVisitedList.unshift(thumbData);
        }
    });
    i = 0;
    while (invisibleMostVisitedList.length && maxThumbsCount) {
        newThumbs[i] = newThumbs[i] || invisibleMostVisitedList.shift();
        i++;
        maxThumbsCount--;
    }
    log("Really invisible (cache)", invisibleMostVisitedList.map(page => page.url));
    compactThumbs(newThumbs);
    return {
        newThumbs: newThumbs,
        topHistoryEntries: topHistoryEntries,
        messagesToDump: messagesToDump,
        mostVisited: mostVisitedCopy,
        cache: invisibleMostVisitedList
    };
}
this.onmessage = function onmessage(event) {
    var task = event.data.task;
    switch (task) {
    case "pickup":
        postMessage({
            task: "pickup",
            results: processData(event.data.data)
        });
        break;
    case "init":
        fromParam = event.data.fromParam;
        clckrUrlToHost = event.data.clckrUrlToHost;
        domainGroups = event.data.domainGroups;
        for (var [
                    groupName,
                    group
                ] in Iterator(domainGroups)) {
            group.forEach(host => hostToGroup[host] = groupName);
        }
        break;
    }
};
