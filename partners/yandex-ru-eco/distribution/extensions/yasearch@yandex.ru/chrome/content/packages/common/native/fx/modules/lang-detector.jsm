"use strict";
const EXPORTED_SYMBOLS = ["langDetector"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const DEBUG = true;
const DICTS_JSON = [
    [
        "en",
        "/native/fx/modules/dicts/eng.ngram.json"
    ],
    [
        "fr",
        "/native/fx/modules/dicts/fre.ngram.json"
    ],
    [
        "de",
        "/native/fx/modules/dicts/ger.ngram.json"
    ],
    [
        "it",
        "/native/fx/modules/dicts/ita.ngram.json"
    ],
    [
        "ru",
        "/native/fx/modules/dicts/rus.ngram.json"
    ],
    [
        "es",
        "/native/fx/modules/dicts/spa.ngram.json"
    ],
    [
        "uk",
        "/native/fx/modules/dicts/ukr.ngram.json"
    ],
    [
        "tr",
        "/native/fx/modules/dicts/tur.ngram.json"
    ],
    [
        "pl",
        "/native/fx/modules/dicts/pol.ngram.json"
    ]
];
const LANG_TRESHOLD = 0.0003;
const MAX_LENGTH_STR = 5000;
const RESTRICTED_TAGS_REGEXP = /<(script|style|svg).*?>[\s\S]*?<\/\1>/gi;
const TAG_ELEMENT_REGEXP = /<\/?[\s\S]*?>/g;
let Utils = {
    init: function LangDetectorUtils_init(api) {
        this._api = api;
        this._logger = this._api.logger;
        Cu.import("resource://gre/modules/NetUtil.jsm");
    },
    log: function LangDetectorUtils_log() {
        if (DEBUG && this._logger) {
            this._logger.debug([].join.call(arguments, " "));
        }
    },
    loadFile: function LangDetectorUtils_loadFile(relatedPath) {
        if (this._api.Package.readTextFile) {
            return this._api.Package.readTextFile(relatedPath);
        }
        let channel = this._api.Package.getFileInputChannel(relatedPath);
        let inputStream = channel.contentStream;
        let streamSize;
        try {
            streamSize = inputStream.available();
        } catch (e) {
            return null;
        }
        let convStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
        convStream.init(inputStream, "UTF-8", streamSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        let output = null;
        try {
            let data = {};
            convStream.readString(streamSize, data);
            output = data.value;
        } catch (e) {
        }
        convStream.close();
        return output;
    },
    _api: null,
    _logger: null
};
let langDetector = {
    init: function LangDetector_init(api) {
        this._api = api;
        Utils.init(api);
    },
    detect: function LangDetector_detect(text, isPlain) {
        if (!text) {
            return null;
        }
        let startTime = Date.now();
        if (!isPlain) {
            text = this._getPlainText(text);
        }
        text = text.toLowerCase();
        if (this._cache.length && this._cache[0] === text) {
            return this._cache[1];
        }
        let trigrams = this._getTrigrams(text);
        this._setFreq(trigrams);
        let scores = {};
        for (let lang in this._index) {
            let cosMult = 0;
            let sqrLangLength = 0;
            for (let trigram in this._freq) {
                let trigramCount = this._index[lang][trigram];
                if (!trigramCount) {
                    continue;
                }
                let langTrigramFreq = trigramCount / this._index[lang].count;
                let trigramFreq = this._freq[trigram];
                cosMult += langTrigramFreq * trigramFreq;
                sqrLangLength += langTrigramFreq * langTrigramFreq;
            }
            scores[lang] = cosMult / Math.sqrt(sqrLangLength) * this._index[lang].length;
        }
        let max = -Infinity;
        let lang = null;
        for (let i in scores) {
            if (max < scores[i]) {
                max = scores[i];
                lang = i;
            }
        }
        this._cache[0] = text;
        this._cache[1] = lang;
        this._api.logger.debug("Detected language: " + lang + ". Time taken: " + (Date.now() - startTime) + "ms");
        return lang;
    },
    _getPlainText: function LangDetector__getPlainText(html) {
        return html.replace(RESTRICTED_TAGS_REGEXP, " ").replace(TAG_ELEMENT_REGEXP, " ").replace(/\s+/g, " ");
    },
    _getCleanText: function LangDetector__getCleanText(text) {
        return text.replace(/&nbsp;/, " ").replace(/(?:&\w+;)|[\.,\?\*]/g, "");
    },
    get _index() {
        delete this._index;
        this._index = {};
        let startTime = new Date();
        for (let i = 0, len = DICTS_JSON.length; i < len; i++) {
            let [
                lang,
                path
            ] = DICTS_JSON[i];
            this._index[lang] = {};
            let jsonString = Utils.loadFile(path);
            if (jsonString) {
                this._index[lang] = JSON.parse(jsonString);
            }
        }
        this._api.logger.config("Loaded all dictionaries in " + (new Date() - startTime) + "ms");
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
        let textArr = cleanText.split(/\s+/);
        for (let i = 0, len = textArr.length; i < len; i++) {
            let word = textArr[i];
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
    _setFreq: function LangDetector__setFreq(trigrams) {
        let count = trigrams.length;
        this._freq = {};
        for (let i = 0; i < count; i++) {
            let trigram = trigrams[i];
            if (this._freq[trigram]) {
                this._freq[trigram]++;
            } else {
                this._freq[trigram] = 1;
            }
        }
        for (let trigram in this._freq) {
            this._freq[trigram] = this._freq[trigram] / count;
        }
    },
    _debug: function LangDetector__debug(dict) {
        this._api.logger.debug(this._api.StrUtils.dumpValue(dict));
    },
    _freq: {},
    _cache: [],
    _api: null
};
