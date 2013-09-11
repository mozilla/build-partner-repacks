"use strict";
const EXPORTED_SYMBOLS = ["colors"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
const DEFAULT_BGCOLOR = "e5e5e5";
const FONT_COLOR_THRESHOLD = 170;
const MAX_THRESHOLD = 238;
const MIN_THRESHOLD = 20;
const PASTEL_THRESHOLD = 92;
const colors = {
init: function Safebrowsing_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("Colors");
}
,
finalize: function Safebrowsing_finalize(doCleanup, callback) {
this._application = null;
this._logger = null;
}
,
getFontColorByBackgroundColor: function Colors_getFontColorByBackgroundColor(bgColor) {
bgColor = bgColor || DEFAULT_BGCOLOR;
const FONT_COLOR_THRESHOLD = 170;
var [red, green, blue] = [parseInt(bgColor.substr(0,2),16), parseInt(bgColor.substr(2,2),16), parseInt(bgColor.substr(4,2),16)];
var tone = (red + green + blue) / 3;
return tone < FONT_COLOR_THRESHOLD && (red < FONT_COLOR_THRESHOLD || green < FONT_COLOR_THRESHOLD) ? 1 : 0;
}
,
requestImageDominantColor: function Colors_requestImageDominantColor(url, callback) {
var self = this;
var hiddenWindow = misc.hiddenWindows.appWindow;
var hiddenWindowDoc = hiddenWindow.document;
var image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml","img");
const MOZ_ANNO_PREFIX = "moz-anno:favicon:";
if (url.indexOf(MOZ_ANNO_PREFIX) === 0)
url = url.replace(MOZ_ANNO_PREFIX,"");
image.onload = function imgOnLoad() {
if (image.width === 1 && image.height === 1)
return callback(null,null);
var canvas = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml","canvas");
var ctx = canvas.getContext("2d");
ctx.mozImageSmoothingEnabled = false;
var toRGB = function toRGB(num) (num < 16 ? "0" : "") + num.toString(16);
canvas.setAttribute("width",image.width);
canvas.setAttribute("height",image.height);
ctx.drawImage(image,0,0);
var imgPixels = ctx.getImageData(0,0,canvas.width,canvas.height);
var maxValueKey = null;
var colorsContainer = {
};
var pixelColorData = new Array(4);
for (let y = 0;y < imgPixels.height;y++) {
for (let x = 0;x < imgPixels.width;x++) {
let index = y * 4 * imgPixels.width + x * 4;
if (imgPixels.data[index + 3] === 0)
{
continue;
}

pixelColorData[0] = imgPixels.data[index];
pixelColorData[1] = imgPixels.data[index + 1];
pixelColorData[2] = imgPixels.data[index + 2];
pixelColorData[3] = imgPixels.data[index + 3];
if (pixelColorData[3] !== 255)
{
for (let z = 0;z < 3;z++) {
let colorStep = (255 - pixelColorData[z]) / 255;
pixelColorData[z] = Math.round(255 - colorStep * pixelColorData[3]);
}

}

let color = toRGB(pixelColorData[0]) + toRGB(pixelColorData[1]) + toRGB(pixelColorData[2]);
colorsContainer[color] = colorsContainer[color] || 0;
colorsContainer[color] += 1;
if (maxValueKey === null || colorsContainer[maxValueKey] < colorsContainer[color])
{
maxValueKey = color;
}

}

}

if (maxValueKey)
{
let [red, green, blue] = [parseInt(maxValueKey.substr(0,2),16), parseInt(maxValueKey.substr(2,2),16), parseInt(maxValueKey.substr(4,2),16)];
if (isAcidColor(red,green,blue))
{
red = Math.max(red,PASTEL_THRESHOLD);
green = Math.max(green,PASTEL_THRESHOLD);
blue = Math.max(blue,PASTEL_THRESHOLD);
maxValueKey = toRGB(red) + toRGB(green) + toRGB(blue);
}

}

self._logger.trace("Most frequent color for " + url + " is " + (maxValueKey || "undefined"));
callback(null,maxValueKey);
}
;
image.onerror = function imgOnError() {
callback(new Error("Failed to load image " + url));
}
;
image.src = url;
}
,
_application: null,
_logger: null};
function isAcidColor(red, green, blue) {
var sum = red + green + blue;
if (sum >= MAX_THRESHOLD * 2 && (red <= MIN_THRESHOLD || green <= MIN_THRESHOLD || blue <= MIN_THRESHOLD))
return true;
if (sum <= MAX_THRESHOLD + MIN_THRESHOLD * 2 && (red >= MAX_THRESHOLD || green >= MAX_THRESHOLD || blue >= MAX_THRESHOLD))
return true;
return false;
}

