"use strict";
const EXPORTED_SYMBOLS = ["langDetector"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const DICTIONARIES = [
    "en",
    "fr",
    "de",
    "it",
    "ru",
    "es",
    "uk",
    "tr",
    "pl"
];
const LANG_TRESHOLD = 0.0003;
const MAX_LENGTH_STR = 5000;
const RESTRICTED_TAGS_REGEXP = /<(script|style|svg).*?>[\s\S]*?<\/\1>/gi;
const TAG_ELEMENT_REGEXP = /<\/?[\s\S]*?>/g;
const SPECIAL_SYMBOLS_REGEXP = /[\-\+\d_\u2010\u2011\u2012\u2013\u2014\u2015\u2016!@#$%^&*?.,:;(){}\[\]\/\\]/gi;
const HTML_ENTITIES_REGEXP = /&\w+;/gi;
let langDetector = {
    detect: function LangDetector_detect(text, isPlain) {
        let startTime = Date.now();
        if (!isPlain) {
            text = this._getPlainText(text);
        }
        if (!text) {
            return null;
        }
        this._setFrequency(this._getTrigrams(text.toLowerCase()));
        let scores = {};
        for (let lang in this._index) {
            let cosMult = 0;
            let sqrLangLength = 0;
            for (let trigram in this._frequency) {
                let trigramCount = this._index[lang][trigram];
                if (!trigramCount) {
                    continue;
                }
                let langTrigramFreq = trigramCount / this._index[lang].count;
                let trigramFreq = this._frequency[trigram];
                cosMult += langTrigramFreq * trigramFreq;
                sqrLangLength += langTrigramFreq * langTrigramFreq;
            }
            scores[lang] = cosMult / Math.sqrt(sqrLangLength) * this._index[lang].length;
        }
        let max = -Infinity;
        let language = null;
        for (let i in scores) {
            if (max < scores[i]) {
                max = scores[i];
                language = i;
            }
        }
        this._debug("Detected language: " + language + ". Time taken: " + (Date.now() - startTime) + "ms");
        return language;
    },
    _getPlainText: function LangDetector__getPlainText(html) {
        return (html || "").replace(RESTRICTED_TAGS_REGEXP, " ").replace(TAG_ELEMENT_REGEXP, " ").replace(HTML_ENTITIES_REGEXP, " ").replace(SPECIAL_SYMBOLS_REGEXP, " ").replace(/\s+/g, " ");
    },
    _getCleanText: function LangDetector__getCleanText(text) {
        return (text || "").replace(/&nbsp;/, " ").replace(/(?:&\w+;)|[\.,\?\*]/g, "");
    },
    get _index() {
        delete this._index;
        this._index = {};
        let startTime = new Date();
        let dictsDir = Services.io.newURI(__URI__, null, null);
        try {
            for (let lang of DICTIONARIES) {
                let uri = Services.io.newURI(dictsDir.resolve("dicts/" + lang + ".ngram.json"), null, null);
                let fileChannel = Services.io.newChannelFromURI(uri);
                let fileStream = fileChannel.open();
                let streamSize = fileStream.available();
                let converterStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
                try {
                    let data = {};
                    converterStream.init(fileStream, "UTF-8", streamSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
                    converterStream.readString(streamSize, data);
                    this._index[lang] = JSON.parse(data.value);
                } catch (e) {
                    Cu.reportError(e);
                    this._index[lang] = {};
                } finally {
                    converterStream.close();
                }
            }
        } catch (e) {
            Cu.reportError(e);
        }
        this._debug("Loaded all dictionaries in " + (new Date() - startTime) + "ms");
        return this._index;
    },
    _getTrigrams: function LangDetector__getTrigrams(text) {
        const N = 3;
        let trigrams = [];
        let cleanText = this._getCleanText(text).slice(0, MAX_LENGTH_STR);
        if (cleanText.length < N) {
            trigrams.push(cleanText);
            return trigrams;
        }
        for (let word of cleanText.split(/\s+/)) {
            if (!word) {
                continue;
            }
            let trigram;
            if (word.length < N) {
                trigram = "^" + word;
                trigrams.push(trigram);
                if (word.length === N - 1) {
                    trigram = word + "$";
                    trigrams.push(trigram);
                }
                continue;
            }
            let max = word.length - N;
            trigram = "^" + word.slice(0, N - 1);
            trigrams.push(trigram);
            for (let j = 0; j <= max; j++) {
                let trigram = word.slice(j, j + N);
                trigrams.push(trigram);
            }
            trigram = word.slice(max + 1, word.length) + "$";
            trigrams.push(trigram);
        }
        return trigrams;
    },
    _setFrequency: function LangDetector__setFrequency(trigrams) {
        this._frequency = {};
        for (let trigram of trigrams) {
            this._frequency[trigram] = (this._frequency[trigram] || 0) + 1;
        }
        for (let trigram in this._frequency) {
            this._frequency[trigram] /= trigrams.length;
        }
    },
    _frequency: {},
    _debug: function LangDetector__debug(message) {
    }
};
