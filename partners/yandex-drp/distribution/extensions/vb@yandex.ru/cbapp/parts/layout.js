"use strict";
const EXPORTED_SYMBOLS = ["layout"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const SCREEN_MGR = Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager);
const layout = {
MAX_DIMENSION: 7,
REGULAR_DIMENSION: 5,
init: function Layout_init(application) {
this._application = application;
this._logger = application.getLogger("Layout");
}
,
finalize: function Layout_finalize() {
this._application = null;
this._logger = null;
}
,
_conf: [[1024, 600, 4, 2], [1024, 768, 4, 3], [1280, 800, 4, 3], [1280, 1024, 4, 4], [1366, 768, 4, 3], [1440, 900, 4, 4]],
getScreenSize: function Layout_getScreenSize() {
var width = {
};
var height = {
};
var primaryScreen = SCREEN_MGR.primaryScreen;
primaryScreen.GetRect({
},{
},width,height);
return [width.value, height.value];
}
,
getMaxThumbLayout: function Layout_getMaxThumbLayout() {
return this._application.preferences.get("ftabs.maxAvailableIncreased",false) ? this.MAX_DIMENSION : this.REGULAR_DIMENSION;
}
,
getMaxThumbLayoutXY: function Layout_getMaxThumbLayoutXY() {
var maxLayout = this.getMaxThumbLayout();
return [maxLayout, maxLayout];
}
,
getThumbsNumXY: function Layout_getThumbsNumXY() {
var thumbsNumX = this._application.preferences.get("ftabs.layoutX",0);
var thumbsNumY = this._application.preferences.get("ftabs.layoutY",0);
if (thumbsNumX >= 1 && thumbsNumY >= 1 && thumbsNumX <= this.MAX_DIMENSION && thumbsNumY <= this.MAX_DIMENSION)
{
return [thumbsNumX, thumbsNumY];
}

var [thumbsNumX, thumbsNumY] = this.getXYLayoutOfScreen();
this._application.preferences.set("ftabs.layoutX",thumbsNumX);
this._application.preferences.set("ftabs.layoutY",thumbsNumY);
return [thumbsNumX, thumbsNumY];
}
,
getThumbsNum: function Layout_getThumbsNum() {
var [x, y] = this.getThumbsNumXY();
return x * y;
}
,
getThumbsXYOfThumbsNum: function Layout_getThumbsXYOfThumbsNum(num) {
if (num.indexOf("x") !== - 1)
return num.split("x").map(function (nmb) parseInt(nmb,10));
num = parseInt(num,10);
var defaultLayouts = this._getDefaults();
var isDefault = defaultLayouts.some(function (n) n.x * n.y === num);
if (! isDefault)
{
num = this._application.preferences.get("ftabs.oldThumbsLayout","0x0");
return this.getThumbsXYOfThumbsNum(num);
}

var [width, height] = this.getScreenSize();
var xy = [1, num];
var y = num;
for (let x = 1;x < y;x++) {
y = num / x;
if (x * y === num && y % 1 === 0)
{
xy = [x, y];
}

}

if (width > height)
{
xy.sort(function (a, b) b - a);
}
 else
{
xy.sort();
}

return xy;
}
,
getXYLayoutOfScreen: function Layout_getXYLayoutOfScreen() {
var XY = [];
var [width, height] = this.getScreenSize();
if (width > 1599)
{
XY = this.getMaxThumbLayoutXY();
}
 else
if (width < 1024)
{
XY = [3, 2];
}
 else
{
let conf = this._conf;
let maxSum = [0, - 1];
for (let i = 0, len = conf.length;i < len;i++) {
let [w, h] = conf[i];
if (w > width || h > height)
continue;
let sum = w + h;
if (sum > maxSum[0])
{
maxSum[0] = sum;
maxSum[1] = i;
}

}

if (maxSum[1] === - 1)
{
XY = [4, 2];
}
 else
{
XY = conf[maxSum[1]].slice(2);
}

}

if (width < height)
{
XY.sort();
}
 else
{
XY.sort(function (x, y) y - x);
}

return XY;
}
,
_getDefaults: function Layout__getDefaults() {
var [maxX, maxY] = this.getMaxThumbLayoutXY();
var [width, height] = this.getScreenSize();
var isLandScape = width > height ? true : false;
var [minX, minY] = isLandScape ? [3, 2] : [2, 3];
var layouts = [];
for (let x = minX;x <= maxX;x++) {
for (let y = minY;y <= maxY;y++) {
if (isLandScape)
{
if (y > x && y >= minX && y <= maxX)
continue;
}
 else
{
if (y < x && x >= minY && x <= maxY)
continue;
}

layouts.push({
x: x,
y: y});
}

}

return layouts;
}
,
getPossibleLayouts: function Layout_getPossibleLayouts() {
var layouts = this._getDefaults();
var [curX, curY] = this.getThumbsNumXY();
var [oldX, oldY] = this._application.preferences.get("ftabs.oldThumbsLayout","0x0").split("x").map(function (n) parseInt(n,10));
var current;
var addCurrent = true;
var addOld = true;
for (let i = 0;i < layouts.length;i++) {
if (layouts[i].x === curX && layouts[i].y === curY)
{
layouts[i].isCurrent = true;
addCurrent = false;
}

if (oldX === 0 || oldY === 0 || layouts[i].x === oldX && layouts[i].y === oldY || oldX === curX && oldY === curY)
{
addOld = false;
}

}

if (addCurrent)
{
layouts.push({
x: curX,
y: curY,
isCurrent: true});
}

if (addOld)
{
layouts.push({
x: oldX,
y: oldY});
}

layouts.sort(function (a, b) a.x * a.y - b.x * b.y);
for (let i = 1;i < layouts.length;i++) {
let cur = layouts[i];
let prev = layouts[i - 1];
if (cur.x * cur.y === prev.x * prev.y)
{
prev.text = prev.x + "x" + prev.y;
cur.text = cur.x + "x" + cur.y;
}

}

for (let i = 0;i < layouts.length;i++) {
let cur = layouts[i];
if (cur.isCurrent)
{
current = cur.text ? cur.text : cur.x * cur.y + "";
}

}

return {
current: current,
layouts: layouts.map(function (layout) String(layout.text || layout.x * layout.y))};
}
,
get layoutX() parseInt(this._application.preferences.get("ftabs.layoutX"),10),
set layoutX(val) this._application.preferences.set("ftabs.layoutX",parseInt(val,10)),
get layoutY() parseInt(this._application.preferences.get("ftabs.layoutY"),10),
set layoutY(val) this._application.preferences.set("ftabs.layoutY",parseInt(val,10))};
