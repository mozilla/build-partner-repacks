"use strict";
const EXPORTED_SYMBOLS = ["colors"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const DEFAULT_BGCOLOR = "f2f2f2";
const FONT_COLOR_THRESHOLD = 170;
const MAX_THRESHOLD = 238;
const MIN_THRESHOLD = 20;
const PASTEL_THRESHOLD = 92;
const CANVAS_SIZE_THRESHOLD = 800;
const colors = {
    init: function Safebrowsing_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Colors");
    },
    finalize: function Safebrowsing_finalize(doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    getFontColorByBackgroundColor: function Colors_getFontColorByBackgroundColor(bgColor) {
        bgColor = bgColor || DEFAULT_BGCOLOR;
        const FONT_COLOR_THRESHOLD = 170;
        let [
            red,
            green,
            blue
        ] = [
            parseInt(bgColor.substr(0, 2), 16),
            parseInt(bgColor.substr(2, 2), 16),
            parseInt(bgColor.substr(4, 2), 16)
        ];
        let tone = (red + green + blue) / 3;
        let isWhite = tone < FONT_COLOR_THRESHOLD && (red < FONT_COLOR_THRESHOLD || green < FONT_COLOR_THRESHOLD);
        return isWhite ? 1 : 0;
    },
    requestImageDominantColor: function Colors_requestImageDominantColor(url, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        let self = this;
        let hiddenWindow = misc.hiddenWindows.appWindow;
        let hiddenWindowDoc = hiddenWindow.document;
        let image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "img");
        const MOZ_ANNO_PREFIX = "moz-anno:favicon:";
        if (url.indexOf(MOZ_ANNO_PREFIX) === 0) {
            url = url.replace(MOZ_ANNO_PREFIX, "");
        }
        image.onload = function imgOnLoad() {
            if (image.width === 1 && image.height === 1) {
                return callback(new Error("1x1 favicon"));
            }
            let canvas = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            let ctx = canvas.getContext("2d");
            ctx.mozImageSmoothingEnabled = false;
            let canvasWidth = image.width;
            let canvasHeight = image.height;
            if (image.width > image.height) {
                if (options.minifyCanvas && image.width > CANVAS_SIZE_THRESHOLD) {
                    canvasWidth = CANVAS_SIZE_THRESHOLD;
                    canvasHeight = Math.round(canvasWidth * image.height / image.width);
                }
            } else {
                if (options.minifyCanvas && image.height > CANVAS_SIZE_THRESHOLD) {
                    canvasHeight = CANVAS_SIZE_THRESHOLD;
                    canvasWidth = Math.round(canvasHeight * image.width / image.height);
                }
            }
            canvas.setAttribute("width", canvasWidth);
            canvas.setAttribute("height", canvasHeight);
            ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
            let imgPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            options.startY = options.bottomQuarter ? Math.round(imgPixels.height * 0.75) : 0;
            options.startX = options.rightHalf ? Math.round(imgPixels.width / 2) : 0;
            options.url = url;
            callback(null, self.getPixelsDominantColor(imgPixels, options));
        };
        image.onerror = function imgOnError() {
            callback(new Error("Failed to load image " + url));
        };
        image.src = url;
    },
    getPixelsDominantColor: function Colors_getPixelsDominantColor(imgPixels, options) {
        let maxValueKey = null;
        let colorsContainer = Object.create(null);
        let pixelColorData = new Array(4);
        for (let y = options.startY; y < imgPixels.height; y++) {
            for (let x = options.startX; x < imgPixels.width; x++) {
                let index = y * 4 * imgPixels.width + x * 4;
                pixelColorData[0] = imgPixels.data[index];
                pixelColorData[1] = imgPixels.data[index + 1];
                pixelColorData[2] = imgPixels.data[index + 2];
                pixelColorData[3] = imgPixels.data[index + 3];
                if (isAlmostTransparent(pixelColorData[3])) {
                    continue;
                }
                if (pixelColorData[3] !== 255) {
                    for (let z = 0; z < 3; z++) {
                        let colorStep = (255 - pixelColorData[z]) / 255;
                        pixelColorData[z] = Math.round(255 - colorStep * pixelColorData[3]);
                    }
                }
                if (!options.preventSkipColors && (isAlmostWhite(pixelColorData) || isAlmostBlack(pixelColorData) || isLightGrey(pixelColorData))) {
                    continue;
                }
                let color = toRGB(pixelColorData[0]) + toRGB(pixelColorData[1]) + toRGB(pixelColorData[2]);
                colorsContainer[color] = colorsContainer[color] || 0;
                colorsContainer[color] += 1;
                if (maxValueKey === null || colorsContainer[maxValueKey] < colorsContainer[color]) {
                    maxValueKey = color;
                }
            }
        }
        if (maxValueKey) {
            let [
                red,
                green,
                blue
            ] = [
                parseInt(maxValueKey.substr(0, 2), 16),
                parseInt(maxValueKey.substr(2, 2), 16),
                parseInt(maxValueKey.substr(4, 2), 16)
            ];
            if (isAcidColor(red, green, blue)) {
                red = Math.max(red, PASTEL_THRESHOLD);
                green = Math.max(green, PASTEL_THRESHOLD);
                blue = Math.max(blue, PASTEL_THRESHOLD);
                maxValueKey = toRGB(red) + toRGB(green) + toRGB(blue);
            }
        }
        if (options.url) {
            this._logger.trace("Most frequent color for " + options.url + " is " + (maxValueKey || "undefined"));
        }
        return maxValueKey;
    },
    _application: null,
    _logger: null
};
function isAcidColor(red, green, blue) {
    let sum = red + green + blue;
    if (sum >= MAX_THRESHOLD * 2 && (red <= MIN_THRESHOLD || green <= MIN_THRESHOLD || blue <= MIN_THRESHOLD)) {
        return true;
    }
    if (sum <= MAX_THRESHOLD + MIN_THRESHOLD * 2 && (red >= MAX_THRESHOLD || green >= MAX_THRESHOLD || blue >= MAX_THRESHOLD)) {
        return true;
    }
    return false;
}
function toRGB(num) {
    return (num < 16 ? "0" : "") + num.toString(16);
}
function isAlmostTransparent(opacity) {
    return opacity < 230;
}
function isAlmostWhite(rgb) {
    let [
        red,
        green,
        blue
    ] = rgb;
    return red > 253 && green > 253 && blue > 253;
}
function isAlmostBlack(rgb) {
    let [
        red,
        green,
        blue
    ] = rgb;
    return red < 10 && green < 10 & blue < 10;
}
function isLightGrey(rgb) {
    let [
        red,
        green,
        blue
    ] = rgb;
    let meanValue = (red + green + blue) / 3;
    return Math.abs(meanValue - red) + Math.abs(meanValue - green) + Math.abs(meanValue - blue) < 15;
}
