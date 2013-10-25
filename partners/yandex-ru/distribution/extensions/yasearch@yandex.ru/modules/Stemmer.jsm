"use strict";
const EXPORTED_SYMBOLS = ["Stemmer"];
var snowballs = Object.create(null);
function Stemmer(lang) {
this._lang = lang;
}

Stemmer.prototype = {
stem: function Stemmer_stem(word) this._stemmer(word),
get _stemmer() {
delete this._stemmer;
var _stemmerFn = (function _stemmerFn(word) {
this.setCurrent(word);
this.stem();
return this.getCurrent();
}
).bind(snowballs[this._lang] || (snowballs[this._lang] = new Snowball(this._lang)));
this.__defineGetter__("_stemmer",function _stemmer() _stemmerFn);
return this._stemmer;
}
};
function Snowball(lng) {
var stemName = lng.substring(0,1).toUpperCase() + lng.substring(1).toLowerCase() + "Stemmer";
return new stemFactory[stemName]();
}

function Among(s, substring_i, result, method) {
this.s_size = s.length;
this.s = this.toCharArray(s);
this.substring_i = substring_i;
this.result = result;
this.method = method;
}

Among.prototype.toCharArray = function (s) {
var sLength = s.length, charArr = new Array(sLength);
for (var i = 0;i < sLength;i++) charArr[i] = s.charCodeAt(i);
return charArr;
}
;
function SnowballProgram() {
var current;
return {
b: 0,
k: 0,
l: 0,
c: 0,
lb: 0,
s_c: function (word) {
current = word;
this.c = 0;
this.l = word.length;
this.lb = 0;
this.b = this.c;
this.k = this.l;
}
,
g_c: function () {
var result = current;
current = null;
return result;
}
,
i_g: function (s, min, max) {
if (this.c < this.l)
{
var ch = current.charCodeAt(this.c);
if (ch <= max && ch >= min)
{
ch -= min;
if (s[ch >> 3] & 1 << (ch & 7))
{
this.c++;
return true;
}

}

}

return false;
}
,
i_g_b: function (s, min, max) {
if (this.c > this.lb)
{
var ch = current.charCodeAt(this.c - 1);
if (ch <= max && ch >= min)
{
ch -= min;
if (s[ch >> 3] & 1 << (ch & 7))
{
this.c--;
return true;
}

}

}

return false;
}
,
o_g: function (s, min, max) {
if (this.c < this.l)
{
var ch = current.charCodeAt(this.c);
if (ch > max || ch < min)
{
this.c++;
return true;
}

ch -= min;
if (! (s[ch >> 3] & 1 << (ch & 7)))
{
this.c++;
return true;
}

}

return false;
}
,
o_g_b: function (s, min, max) {
if (this.c > this.lb)
{
var ch = current.charCodeAt(this.c - 1);
if (ch > max || ch < min)
{
this.c--;
return true;
}

ch -= min;
if (! (s[ch >> 3] & 1 << (ch & 7)))
{
this.c--;
return true;
}

}

return false;
}
,
e_s: function (s_size, s) {
if (this.l - this.c < s_size)
return false;
for (var i = 0;i < s_size;i++) if (current.charCodeAt(this.c + i) != s.charCodeAt(i))
return false;
this.c += s_size;
return true;
}
,
e_s_b: function (s_size, s) {
if (this.c - this.lb < s_size)
return false;
for (var i = 0;i < s_size;i++) if (current.charCodeAt(this.c - s_size + i) != s.charCodeAt(i))
return false;
this.c -= s_size;
return true;
}
,
f_a: function (v, v_size) {
var i = 0, j = v_size, c = this.c, l = this.l, common_i = 0, common_j = 0, first_key_inspected = false;
while (true) {
var k = i + (j - i >> 1), diff = 0, common = common_i < common_j ? common_i : common_j, w = v[k];
for (var i2 = common;i2 < w.s_size;i2++) {
if (c + common == l)
{
diff = - 1;
break;
}

diff = current.charCodeAt(c + common) - w.s[i2];
if (diff)
break;
common++;
}

if (diff < 0)
{
j = k;
common_j = common;
}
 else
{
i = k;
common_i = common;
}

if (j - i <= 1)
{
if (i > 0 || j == i || first_key_inspected)
break;
first_key_inspected = true;
}

}

while (true) {
var w = v[i];
if (common_i >= w.s_size)
{
this.c = c + w.s_size;
if (! w.method)
return w.result;
var res = w.method();
this.c = c + w.s_size;
if (res)
return w.result;
}

i = w.substring_i;
if (i < 0)
return 0;
}

}
,
f_a_b: function (v, v_size) {
var i = 0, j = v_size, c = this.c, lb = this.lb, common_i = 0, common_j = 0, first_key_inspected = false;
while (true) {
var k = i + (j - i >> 1), diff = 0, common = common_i < common_j ? common_i : common_j, w = v[k];
for (var i2 = w.s_size - 1 - common;i2 >= 0;i2--) {
if (c - common == lb)
{
diff = - 1;
break;
}

diff = current.charCodeAt(c - 1 - common) - w.s[i2];
if (diff)
break;
common++;
}

if (diff < 0)
{
j = k;
common_j = common;
}
 else
{
i = k;
common_i = common;
}

if (j - i <= 1)
{
if (i > 0 || j == i || first_key_inspected)
break;
first_key_inspected = true;
}

}

while (true) {
var w = v[i];
if (common_i >= w.s_size)
{
this.c = c - w.s_size;
if (! w.method)
return w.result;
var res = w.method();
this.c = c - w.s_size;
if (res)
return w.result;
}

i = w.substring_i;
if (i < 0)
return 0;
}

}
,
r_s: function (c_bra, c_ket, s) {
var adjustment = s.length - (c_ket - c_bra), left = current.substring(0,c_bra), right = current.substring(c_ket);
current = left + s + right;
this.l += adjustment;
if (this.c >= c_ket)
this.c += adjustment; else
if (this.c > c_bra)
this.c = c_bra;
return adjustment;
}
,
s_ch: function () {
if (this.b < 0 || this.b > this.k || this.k > this.l || this.l > current.length)
throw "faulty slice operation";
}
,
s_f: function (s) {
this.s_ch();
this.r_s(this.b,this.k,s);
}
,
s_d: function () {
this.s_f("");
}
,
i_: function (c_bra, c_ket, s) {
var adjustment = this.r_s(c_bra,c_ket,s);
if (c_bra <= this.b)
this.b += adjustment;
if (c_bra <= this.k)
this.k += adjustment;
}
,
s_t: function () {
this.s_ch();
return current.substring(this.b,this.k);
}
,
e_v_b: function (s) {
return this.e_s_b(s.length,s);
}
};
}

var stemFactory = {
DanishStemmer: function () {
var a_0 = [new Among("hed", - 1, 1), new Among("ethed", 0, 1), new Among("ered", - 1, 1), new Among("e", - 1, 1), new Among("erede", 3, 1), new Among("ende", 3, 1), new Among("erende", 5, 1), new Among("ene", 3, 1), new Among("erne", 3, 1), new Among("ere", 3, 1), new Among("en", - 1, 1), new Among("heden", 10, 1), new Among("eren", 10, 1), new Among("er", - 1, 1), new Among("heder", 13, 1), new Among("erer", 13, 1), new Among("s", - 1, 2), new Among("heds", 16, 1), new Among("es", 16, 1), new Among("endes", 18, 1), new Among("erendes", 19, 1), new Among("enes", 18, 1), new Among("ernes", 18, 1), new Among("eres", 18, 1), new Among("ens", 16, 1), new Among("hedens", 24, 1), new Among("erens", 24, 1), new Among("ers", 16, 1), new Among("ets", 16, 1), new Among("erets", 28, 1), new Among("et", - 1, 1), new Among("eret", 30, 1)], a_1 = [new Among("gd", - 1, - 1), new Among("dt", - 1, - 1), new Among("gt", - 1, - 1), new Among("kt", - 1, - 1)], a_2 = [new Among("ig", - 1, 1), new Among("lig", 0, 1), new Among("elig", 1, 1), new Among("els", - 1, 1), new Among("løst", - 1, 2)], g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 128], g_s_ending = [239, 254, 42, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], I_x, I_p1, S_ch, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_mark_regions() {
var v_1, c = sbp.c + 3;
I_p1 = sbp.l;
if (0 <= c && c <= sbp.l)
{
I_x = c;
while (true) {
v_1 = sbp.c;
if (sbp.i_g(g_v,97,248))
{
sbp.c = v_1;
break;
}

sbp.c = v_1;
if (v_1 >= sbp.l)
return;
sbp.c++;
}

while (! sbp.o_g(g_v,97,248)) {
if (sbp.c >= sbp.l)
return;
sbp.c++;
}

I_p1 = sbp.c;
if (I_p1 < I_x)
I_p1 = I_x;
}

}

function r_main_suffix() {
var a_v, v_1;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_0,32);
sbp.lb = v_1;
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
if (sbp.i_g_b(g_s_ending,97,229))
sbp.s_d();
break;
}

}

}

}

function r_consonant_pair() {
var v_1 = sbp.l - sbp.c, v_2;
if (sbp.c >= I_p1)
{
v_2 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
if (sbp.f_a_b(a_1,4))
{
sbp.b = sbp.c;
sbp.lb = v_2;
sbp.c = sbp.l - v_1;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

}
 else
sbp.lb = v_2;
}

}

function r_other_suffix() {
var a_v, v_1 = sbp.l - sbp.c, v_2, v_3;
sbp.k = sbp.c;
if (sbp.e_s_b(2,"st"))
{
sbp.b = sbp.c;
if (sbp.e_s_b(2,"ig"))
sbp.s_d();
}

sbp.c = sbp.l - v_1;
if (sbp.c >= I_p1)
{
v_2 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,5);
sbp.lb = v_2;
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_d();
v_3 = sbp.l - sbp.c;
r_consonant_pair();
sbp.c = sbp.l - v_3;
break;
case 2:
sbp.s_f("løs");
break;
}

}

}

}

function r_undouble() {
var v_1;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
if (sbp.o_g_b(g_v,97,248))
{
sbp.b = sbp.c;
S_ch = sbp.s_t(S_ch);
sbp.lb = v_1;
if (sbp.e_v_b(S_ch))
sbp.s_d();
}
 else
sbp.lb = v_1;
}

}

this.stem = function () {
var v_1 = sbp.c;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_main_suffix();
sbp.c = sbp.l;
r_consonant_pair();
sbp.c = sbp.l;
r_other_suffix();
sbp.c = sbp.l;
r_undouble();
return true;
}
;
}
,
DutchStemmer: function () {
var a_0 = [new Among("", - 1, 6), new Among("á", 0, 1), new Among("ä", 0, 1), new Among("é", 0, 2), new Among("ë", 0, 2), new Among("í", 0, 3), new Among("ï", 0, 3), new Among("ó", 0, 4), new Among("ö", 0, 4), new Among("ú", 0, 5), new Among("ü", 0, 5)], a_1 = [new Among("", - 1, 3), new Among("I", 0, 2), new Among("Y", 0, 1)], a_2 = [new Among("dd", - 1, - 1), new Among("kk", - 1, - 1), new Among("tt", - 1, - 1)], a_3 = [new Among("ene", - 1, 2), new Among("se", - 1, 3), new Among("en", - 1, 2), new Among("heden", 2, 1), new Among("s", - 1, 3)], a_4 = [new Among("end", - 1, 1), new Among("ig", - 1, 2), new Among("ing", - 1, 1), new Among("lijk", - 1, 3), new Among("baar", - 1, 4), new Among("bar", - 1, 5)], a_5 = [new Among("aa", - 1, - 1), new Among("ee", - 1, - 1), new Among("oo", - 1, - 1), new Among("uu", - 1, - 1)], g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128], g_v_I = [1, 0, 0, 17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128], g_v_j = [17, 67, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128], I_p2, I_p1, B_e_found, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_prelude() {
var a_v, v_1 = sbp.c, v_2, v_3;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_0,11);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("a");
continue;
case 2:
sbp.s_f("e");
continue;
case 3:
sbp.s_f("i");
continue;
case 4:
sbp.s_f("o");
continue;
case 5:
sbp.s_f("u");
continue;
case 6:
if (sbp.c >= sbp.l)
break;
sbp.c++;
continue;
}

}

break;
}

sbp.c = v_1;
sbp.b = v_1;
if (sbp.e_s(1,"y"))
{
sbp.k = sbp.c;
sbp.s_f("Y");
}
 else
sbp.c = v_1;
while (true) {
v_2 = sbp.c;
if (sbp.i_g(g_v,97,232))
{
v_3 = sbp.c;
sbp.b = v_3;
if (sbp.e_s(1,"i"))
{
sbp.k = sbp.c;
if (sbp.i_g(g_v,97,232))
{
sbp.s_f("I");
sbp.c = v_2;
}

}
 else
{
sbp.c = v_3;
if (sbp.e_s(1,"y"))
{
sbp.k = sbp.c;
sbp.s_f("Y");
sbp.c = v_2;
}
 else
if (habr1(v_2))
break;
}

}
 else
if (habr1(v_2))
break;
}

}

function habr1(v_1) {
sbp.c = v_1;
if (v_1 >= sbp.l)
return true;
sbp.c++;
return false;
}

function r_mark_regions() {
I_p1 = sbp.l;
I_p2 = I_p1;
if (! habr2())
{
I_p1 = sbp.c;
if (I_p1 < 3)
I_p1 = 3;
if (! habr2())
I_p2 = sbp.c;
}

}

function habr2() {
while (! sbp.i_g(g_v,97,232)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

while (! sbp.o_g(g_v,97,232)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

function r_postlude() {
var a_v;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_1,3);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("y");
break;
case 2:
sbp.s_f("i");
break;
case 3:
if (sbp.c >= sbp.l)
return;
sbp.c++;
break;
}

}

}

}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_undouble() {
var v_1 = sbp.l - sbp.c;
if (sbp.f_a_b(a_2,3))
{
sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

}

}

function r_e_ending() {
var v_1;
B_e_found = false;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"e"))
{
sbp.b = sbp.c;
if (r_R1())
{
v_1 = sbp.l - sbp.c;
if (sbp.o_g_b(g_v,97,232))
{
sbp.c = sbp.l - v_1;
sbp.s_d();
B_e_found = true;
r_undouble();
}

}

}

}

function r_en_ending() {
var v_1;
if (r_R1())
{
v_1 = sbp.l - sbp.c;
if (sbp.o_g_b(g_v,97,232))
{
sbp.c = sbp.l - v_1;
if (! sbp.e_s_b(3,"gem"))
{
sbp.c = sbp.l - v_1;
sbp.s_d();
r_undouble();
}

}

}

}

function r_standard_suffix() {
var a_v, v_1 = sbp.l - sbp.c, v_2, v_3, v_4, v_5, v_6;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,5);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_R1())
sbp.s_f("heid");
break;
case 2:
r_en_ending();
break;
case 3:
if (r_R1() && sbp.o_g_b(g_v_j,97,232))
sbp.s_d();
break;
}

}

sbp.c = sbp.l - v_1;
r_e_ending();
sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
if (sbp.e_s_b(4,"heid"))
{
sbp.b = sbp.c;
if (r_R2())
{
v_2 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"c"))
{
sbp.c = sbp.l - v_2;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"en"))
{
sbp.b = sbp.c;
r_en_ending();
}

}

}

}

sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,6);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_R2())
{
sbp.s_d();
v_3 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (sbp.e_s_b(2,"ig"))
{
sbp.b = sbp.c;
if (r_R2())
{
v_4 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"e"))
{
sbp.c = sbp.l - v_4;
sbp.s_d();
break;
}

}

}

sbp.c = sbp.l - v_3;
r_undouble();
}

break;
case 2:
if (r_R2())
{
v_5 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"e"))
{
sbp.c = sbp.l - v_5;
sbp.s_d();
}

}

break;
case 3:
if (r_R2())
{
sbp.s_d();
r_e_ending();
}

break;
case 4:
if (r_R2())
sbp.s_d();
break;
case 5:
if (r_R2() && B_e_found)
sbp.s_d();
break;
}

}

sbp.c = sbp.l - v_1;
if (sbp.o_g_b(g_v_I,73,232))
{
v_6 = sbp.l - sbp.c;
if (sbp.f_a_b(a_5,4) && sbp.o_g_b(g_v,97,232))
{
sbp.c = sbp.l - v_6;
sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_standard_suffix();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
EnglishStemmer: function () {
var a_0 = [new Among("arsen", - 1, - 1), new Among("commun", - 1, - 1), new Among("gener", - 1, - 1)], a_1 = [new Among("'", - 1, 1), new Among("'s'", 0, 1), new Among("'s", - 1, 1)], a_2 = [new Among("ied", - 1, 2), new Among("s", - 1, 3), new Among("ies", 1, 2), new Among("sses", 1, 1), new Among("ss", 1, - 1), new Among("us", 1, - 1)], a_3 = [new Among("", - 1, 3), new Among("bb", 0, 2), new Among("dd", 0, 2), new Among("ff", 0, 2), new Among("gg", 0, 2), new Among("bl", 0, 1), new Among("mm", 0, 2), new Among("nn", 0, 2), new Among("pp", 0, 2), new Among("rr", 0, 2), new Among("at", 0, 1), new Among("tt", 0, 2), new Among("iz", 0, 1)], a_4 = [new Among("ed", - 1, 2), new Among("eed", 0, 1), new Among("ing", - 1, 2), new Among("edly", - 1, 2), new Among("eedly", 3, 1), new Among("ingly", - 1, 2)], a_5 = [new Among("anci", - 1, 3), new Among("enci", - 1, 2), new Among("ogi", - 1, 13), new Among("li", - 1, 16), new Among("bli", 3, 12), new Among("abli", 4, 4), new Among("alli", 3, 8), new Among("fulli", 3, 14), new Among("lessli", 3, 15), new Among("ousli", 3, 10), new Among("entli", 3, 5), new Among("aliti", - 1, 8), new Among("biliti", - 1, 12), new Among("iviti", - 1, 11), new Among("tional", - 1, 1), new Among("ational", 14, 7), new Among("alism", - 1, 8), new Among("ation", - 1, 7), new Among("ization", 17, 6), new Among("izer", - 1, 6), new Among("ator", - 1, 7), new Among("iveness", - 1, 11), new Among("fulness", - 1, 9), new Among("ousness", - 1, 10)], a_6 = [new Among("icate", - 1, 4), new Among("ative", - 1, 6), new Among("alize", - 1, 3), new Among("iciti", - 1, 4), new Among("ical", - 1, 4), new Among("tional", - 1, 1), new Among("ational", 5, 2), new Among("ful", - 1, 5), new Among("ness", - 1, 5)], a_7 = [new Among("ic", - 1, 1), new Among("ance", - 1, 1), new Among("ence", - 1, 1), new Among("able", - 1, 1), new Among("ible", - 1, 1), new Among("ate", - 1, 1), new Among("ive", - 1, 1), new Among("ize", - 1, 1), new Among("iti", - 1, 1), new Among("al", - 1, 1), new Among("ism", - 1, 1), new Among("ion", - 1, 2), new Among("er", - 1, 1), new Among("ous", - 1, 1), new Among("ant", - 1, 1), new Among("ent", - 1, 1), new Among("ment", 15, 1), new Among("ement", 16, 1)], a_8 = [new Among("e", - 1, 1), new Among("l", - 1, 2)], a_9 = [new Among("succeed", - 1, - 1), new Among("proceed", - 1, - 1), new Among("exceed", - 1, - 1), new Among("canning", - 1, - 1), new Among("inning", - 1, - 1), new Among("earring", - 1, - 1), new Among("herring", - 1, - 1), new Among("outing", - 1, - 1)], a_10 = [new Among("andes", - 1, - 1), new Among("atlas", - 1, - 1), new Among("bias", - 1, - 1), new Among("cosmos", - 1, - 1), new Among("dying", - 1, 3), new Among("early", - 1, 9), new Among("gently", - 1, 7), new Among("howe", - 1, - 1), new Among("idly", - 1, 6), new Among("lying", - 1, 4), new Among("news", - 1, - 1), new Among("only", - 1, 10), new Among("singly", - 1, 11), new Among("skies", - 1, 2), new Among("skis", - 1, 1), new Among("sky", - 1, - 1), new Among("tying", - 1, 5), new Among("ugly", - 1, 8)], g_v = [17, 65, 16, 1], g_v_WXY = [1, 17, 65, 208, 1], g_valid_LI = [55, 141, 2], B_Y_found, I_p2, I_p1, habr = [r_Step_1b, r_Step_1c, r_Step_2, r_Step_3, r_Step_4, r_Step_5], sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_prelude() {
var v_1 = sbp.c, v_2;
B_Y_found = false;
sbp.b = sbp.c;
if (sbp.e_s(1,"'"))
{
sbp.k = sbp.c;
sbp.s_d();
}

sbp.c = v_1;
sbp.b = v_1;
if (sbp.e_s(1,"y"))
{
sbp.k = sbp.c;
sbp.s_f("Y");
B_Y_found = true;
}

sbp.c = v_1;
while (true) {
v_2 = sbp.c;
if (sbp.i_g(g_v,97,121))
{
sbp.b = sbp.c;
if (sbp.e_s(1,"y"))
{
sbp.k = sbp.c;
sbp.c = v_2;
sbp.s_f("Y");
B_Y_found = true;
continue;
}

}

if (v_2 >= sbp.l)
{
sbp.c = v_1;
return;
}

sbp.c = v_2 + 1;
}

}

function r_mark_regions() {
var v_1 = sbp.c;
I_p1 = sbp.l;
I_p2 = I_p1;
if (! sbp.f_a(a_0,3))
{
sbp.c = v_1;
if (habr1())
{
sbp.c = v_1;
return;
}

}

I_p1 = sbp.c;
if (! habr1())
I_p2 = sbp.c;
}

function habr1() {
while (! sbp.i_g(g_v,97,121)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

while (! sbp.o_g(g_v,97,121)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

function r_shortv() {
var v_1 = sbp.l - sbp.c;
if (! (sbp.o_g_b(g_v_WXY,89,121) && sbp.i_g_b(g_v,97,121) && sbp.o_g_b(g_v,97,121)))
{
sbp.c = sbp.l - v_1;
if (! sbp.o_g_b(g_v,97,121) || ! sbp.i_g_b(g_v,97,121) || sbp.c > sbp.lb)
return false;
}

return true;
}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_Step_1a() {
var a_v, v_1 = sbp.l - sbp.c;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_1,3);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
sbp.s_d();
}
 else
sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,6);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("ss");
break;
case 2:
var c = sbp.c - 2;
if (sbp.lb > c || c > sbp.l)
{
sbp.s_f("ie");
break;
}

sbp.c = c;
sbp.s_f("i");
break;
case 3:
do {
if (sbp.c <= sbp.lb)
return;
sbp.c--;
}
 while (! sbp.i_g_b(g_v,97,121));
sbp.s_d();
break;
}

}

}

function r_Step_1b() {
var a_v, v_1, v_3, v_4;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,6);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_R1())
sbp.s_f("ee");
break;
case 2:
v_1 = sbp.l - sbp.c;
while (! sbp.i_g_b(g_v,97,121)) {
if (sbp.c <= sbp.lb)
return;
sbp.c--;
}

sbp.c = sbp.l - v_1;
sbp.s_d();
v_3 = sbp.l - sbp.c;
a_v = sbp.f_a_b(a_3,13);
if (a_v)
{
sbp.c = sbp.l - v_3;
switch (a_v) {
case 1:
var c = sbp.c;
sbp.i_(sbp.c,sbp.c,"e");
sbp.c = c;
break;
case 2:
sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

break;
case 3:
if (sbp.c == I_p1)
{
v_4 = sbp.l - sbp.c;
if (r_shortv())
{
sbp.c = sbp.l - v_4;
var c = sbp.c;
sbp.i_(sbp.c,sbp.c,"e");
sbp.c = c;
}

}

break;
}

}

break;
}

}

}

function r_Step_1c() {
var v_1 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (! sbp.e_s_b(1,"y"))
{
sbp.c = sbp.l - v_1;
if (! sbp.e_s_b(1,"Y"))
return;
}

sbp.b = sbp.c;
if (sbp.o_g_b(g_v,97,121) && sbp.c > sbp.lb)
sbp.s_f("i");
}

function r_Step_2() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_5,24);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_f("tion");
break;
case 2:
sbp.s_f("ence");
break;
case 3:
sbp.s_f("ance");
break;
case 4:
sbp.s_f("able");
break;
case 5:
sbp.s_f("ent");
break;
case 6:
sbp.s_f("ize");
break;
case 7:
sbp.s_f("ate");
break;
case 8:
sbp.s_f("al");
break;
case 9:
sbp.s_f("ful");
break;
case 10:
sbp.s_f("ous");
break;
case 11:
sbp.s_f("ive");
break;
case 12:
sbp.s_f("ble");
break;
case 13:
if (sbp.e_s_b(1,"l"))
sbp.s_f("og");
break;
case 14:
sbp.s_f("ful");
break;
case 15:
sbp.s_f("less");
break;
case 16:
if (sbp.i_g_b(g_valid_LI,99,116))
sbp.s_d();
break;
}

}

}

}

function r_Step_3() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,9);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_f("tion");
break;
case 2:
sbp.s_f("ate");
break;
case 3:
sbp.s_f("al");
break;
case 4:
sbp.s_f("ic");
break;
case 5:
sbp.s_d();
break;
case 6:
if (r_R2())
sbp.s_d();
break;
}

}

}

}

function r_Step_4() {
var a_v, v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,18);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2())
{
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
v_1 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"s"))
{
sbp.c = sbp.l - v_1;
if (! sbp.e_s_b(1,"t"))
return;
}

sbp.s_d();
break;
}

}

}

}

function r_Step_5() {
var a_v, v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_8,2);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
v_1 = sbp.l - sbp.c;
if (! r_R2())
{
sbp.c = sbp.l - v_1;
if (! r_R1() || r_shortv())
return;
sbp.c = sbp.l - v_1;
}

sbp.s_d();
break;
case 2:
if (! r_R2() || ! sbp.e_s_b(1,"l"))
return;
sbp.s_d();
break;
}

}

}

function r_exception2() {
sbp.k = sbp.c;
if (sbp.f_a_b(a_9,8))
{
sbp.b = sbp.c;
return sbp.c <= sbp.lb;
}

return false;
}

function r_exception1() {
var a_v;
sbp.b = sbp.c;
a_v = sbp.f_a(a_10,18);
if (a_v)
{
sbp.k = sbp.c;
if (sbp.c >= sbp.l)
{
switch (a_v) {
case 1:
sbp.s_f("ski");
break;
case 2:
sbp.s_f("sky");
break;
case 3:
sbp.s_f("die");
break;
case 4:
sbp.s_f("lie");
break;
case 5:
sbp.s_f("tie");
break;
case 6:
sbp.s_f("idl");
break;
case 7:
sbp.s_f("gentl");
break;
case 8:
sbp.s_f("ugli");
break;
case 9:
sbp.s_f("earli");
break;
case 10:
sbp.s_f("onli");
break;
case 11:
sbp.s_f("singl");
break;
}

return true;
}

}

return false;
}

function r_postlude() {
var v_1;
if (B_Y_found)
{
while (true) {
v_1 = sbp.c;
sbp.b = v_1;
if (sbp.e_s(1,"Y"))
{
sbp.k = sbp.c;
sbp.c = v_1;
sbp.s_f("y");
continue;
}

sbp.c = v_1;
if (sbp.c >= sbp.l)
return;
sbp.c++;
}

}

}

this.stem = function () {
var v_1 = sbp.c;
if (! r_exception1())
{
sbp.c = v_1;
var c = sbp.c + 3;
if (0 <= c && c <= sbp.l)
{
sbp.c = v_1;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_Step_1a();
sbp.c = sbp.l;
if (! r_exception2())
for (var i = 0;i < habr.length;i++) {
sbp.c = sbp.l;
habr[i]();
}

sbp.c = sbp.lb;
r_postlude();
}

}

return true;
}
;
}
,
FinnishStemmer: function () {
var a_0 = [new Among("pa", - 1, 1), new Among("sti", - 1, 2), new Among("kaan", - 1, 1), new Among("han", - 1, 1), new Among("kin", - 1, 1), new Among("hän", - 1, 1), new Among("kään", - 1, 1), new Among("ko", - 1, 1), new Among("pä", - 1, 1), new Among("kö", - 1, 1)], a_1 = [new Among("lla", - 1, - 1), new Among("na", - 1, - 1), new Among("ssa", - 1, - 1), new Among("ta", - 1, - 1), new Among("lta", 3, - 1), new Among("sta", 3, - 1)], a_2 = [new Among("llä", - 1, - 1), new Among("nä", - 1, - 1), new Among("ssä", - 1, - 1), new Among("tä", - 1, - 1), new Among("ltä", 3, - 1), new Among("stä", 3, - 1)], a_3 = [new Among("lle", - 1, - 1), new Among("ine", - 1, - 1)], a_4 = [new Among("nsa", - 1, 3), new Among("mme", - 1, 3), new Among("nne", - 1, 3), new Among("ni", - 1, 2), new Among("si", - 1, 1), new Among("an", - 1, 4), new Among("en", - 1, 6), new Among("än", - 1, 5), new Among("nsä", - 1, 3)], a_5 = [new Among("aa", - 1, - 1), new Among("ee", - 1, - 1), new Among("ii", - 1, - 1), new Among("oo", - 1, - 1), new Among("uu", - 1, - 1), new Among("ää", - 1, - 1), new Among("öö", - 1, - 1)], a_6 = [new Among("a", - 1, 8), new Among("lla", 0, - 1), new Among("na", 0, - 1), new Among("ssa", 0, - 1), new Among("ta", 0, - 1), new Among("lta", 4, - 1), new Among("sta", 4, - 1), new Among("tta", 4, 9), new Among("lle", - 1, - 1), new Among("ine", - 1, - 1), new Among("ksi", - 1, - 1), new Among("n", - 1, 7), new Among("han", 11, 1), new Among("den", 11, - 1, r_VI), new Among("seen", 11, - 1, r_LONG), new Among("hen", 11, 2), new Among("tten", 11, - 1, r_VI), new Among("hin", 11, 3), new Among("siin", 11, - 1, r_VI), new Among("hon", 11, 4), new Among("hän", 11, 5), new Among("hön", 11, 6), new Among("ä", - 1, 8), new Among("llä", 22, - 1), new Among("nä", 22, - 1), new Among("ssä", 22, - 1), new Among("tä", 22, - 1), new Among("ltä", 26, - 1), new Among("stä", 26, - 1), new Among("ttä", 26, 9)], a_7 = [new Among("eja", - 1, - 1), new Among("mma", - 1, 1), new Among("imma", 1, - 1), new Among("mpa", - 1, 1), new Among("impa", 3, - 1), new Among("mmi", - 1, 1), new Among("immi", 5, - 1), new Among("mpi", - 1, 1), new Among("impi", 7, - 1), new Among("ejä", - 1, - 1), new Among("mmä", - 1, 1), new Among("immä", 10, - 1), new Among("mpä", - 1, 1), new Among("impä", 12, - 1)], a_8 = [new Among("i", - 1, - 1), new Among("j", - 1, - 1)], a_9 = [new Among("mma", - 1, 1), new Among("imma", 0, - 1)], g_AEI = [17, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8], g_V1 = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 32], g_V2 = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 32], g_particle_end = [17, 97, 24, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 32], B_ending_removed, S_x, I_p2, I_p1, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_mark_regions() {
I_p1 = sbp.l;
I_p2 = I_p1;
if (! habr1())
{
I_p1 = sbp.c;
if (! habr1())
I_p2 = sbp.c;
}

}

function habr1() {
var v_1;
while (true) {
v_1 = sbp.c;
if (sbp.i_g(g_V1,97,246))
break;
sbp.c = v_1;
if (v_1 >= sbp.l)
return true;
sbp.c++;
}

sbp.c = v_1;
while (! sbp.o_g(g_V1,97,246)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_particle_etc() {
var a_v, v_1;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_0,10);
if (a_v)
{
sbp.b = sbp.c;
sbp.lb = v_1;
switch (a_v) {
case 1:
if (! sbp.i_g_b(g_particle_end,97,246))
return;
break;
case 2:
if (! r_R2())
return;
break;
}

sbp.s_d();
}
 else
sbp.lb = v_1;
}

}

function r_possessive() {
var a_v, v_1, v_2;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,9);
if (a_v)
{
sbp.b = sbp.c;
sbp.lb = v_1;
switch (a_v) {
case 1:
v_2 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"k"))
{
sbp.c = sbp.l - v_2;
sbp.s_d();
}

break;
case 2:
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(3,"kse"))
{
sbp.b = sbp.c;
sbp.s_f("ksi");
}

break;
case 3:
sbp.s_d();
break;
case 4:
if (sbp.f_a_b(a_1,6))
sbp.s_d();
break;
case 5:
if (sbp.f_a_b(a_2,6))
sbp.s_d();
break;
case 6:
if (sbp.f_a_b(a_3,2))
sbp.s_d();
break;
}

}
 else
sbp.lb = v_1;
}

}

function r_LONG() {
return sbp.f_a_b(a_5,7);
}

function r_VI() {
return sbp.e_s_b(1,"i") && sbp.i_g_b(g_V2,97,246);
}

function r_case_ending() {
var a_v, v_1, v_2;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,30);
if (a_v)
{
sbp.b = sbp.c;
sbp.lb = v_1;
switch (a_v) {
case 1:
if (! sbp.e_s_b(1,"a"))
return;
break;
case 2:

case 9:
if (! sbp.e_s_b(1,"e"))
return;
break;
case 3:
if (! sbp.e_s_b(1,"i"))
return;
break;
case 4:
if (! sbp.e_s_b(1,"o"))
return;
break;
case 5:
if (! sbp.e_s_b(1,"ä"))
return;
break;
case 6:
if (! sbp.e_s_b(1,"ö"))
return;
break;
case 7:
v_2 = sbp.l - sbp.c;
if (! r_LONG())
{
sbp.c = sbp.l - v_2;
if (! sbp.e_s_b(2,"ie"))
{
sbp.c = sbp.l - v_2;
break;
}

}

sbp.c = sbp.l - v_2;
if (sbp.c <= sbp.lb)
{
sbp.c = sbp.l - v_2;
break;
}

sbp.c--;
sbp.b = sbp.c;
break;
case 8:
if (! sbp.i_g_b(g_V1,97,246) || ! sbp.o_g_b(g_V1,97,246))
return;
break;
}

sbp.s_d();
B_ending_removed = true;
}
 else
sbp.lb = v_1;
}

}

function r_other_endings() {
var a_v, v_1, v_2;
if (sbp.c >= I_p2)
{
v_1 = sbp.lb;
sbp.lb = I_p2;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,14);
if (a_v)
{
sbp.b = sbp.c;
sbp.lb = v_1;
if (a_v == 1)
{
v_2 = sbp.l - sbp.c;
if (sbp.e_s_b(2,"po"))
return;
sbp.c = sbp.l - v_2;
}

sbp.s_d();
}
 else
sbp.lb = v_1;
}

}

function r_i_plural() {
var v_1;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
if (sbp.f_a_b(a_8,2))
{
sbp.b = sbp.c;
sbp.lb = v_1;
sbp.s_d();
}
 else
sbp.lb = v_1;
}

}

function r_t_plural() {
var a_v, v_1, v_2, v_3, v_4, v_5;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"t"))
{
sbp.b = sbp.c;
v_2 = sbp.l - sbp.c;
if (sbp.i_g_b(g_V1,97,246))
{
sbp.c = sbp.l - v_2;
sbp.s_d();
sbp.lb = v_1;
v_3 = sbp.l - sbp.c;
if (sbp.c >= I_p2)
{
sbp.c = I_p2;
v_4 = sbp.lb;
sbp.lb = sbp.c;
sbp.c = sbp.l - v_3;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_9,2);
if (a_v)
{
sbp.b = sbp.c;
sbp.lb = v_4;
if (a_v == 1)
{
v_5 = sbp.l - sbp.c;
if (sbp.e_s_b(2,"po"))
return;
sbp.c = sbp.l - v_5;
}

sbp.s_d();
return;
}

}

}

}

sbp.lb = v_1;
}

}

function r_tidy() {
var v_1, v_2, v_3, v_4;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
v_2 = sbp.l - sbp.c;
if (r_LONG())
{
sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

}

sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (sbp.i_g_b(g_AEI,97,228))
{
sbp.b = sbp.c;
if (sbp.o_g_b(g_V1,97,246))
sbp.s_d();
}

sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"j"))
{
sbp.b = sbp.c;
v_3 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"o"))
{
sbp.c = sbp.l - v_3;
if (sbp.e_s_b(1,"u"))
sbp.s_d();
}
 else
sbp.s_d();
}

sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"o"))
{
sbp.b = sbp.c;
if (sbp.e_s_b(1,"j"))
sbp.s_d();
}

sbp.c = sbp.l - v_2;
sbp.lb = v_1;
while (true) {
v_4 = sbp.l - sbp.c;
if (sbp.o_g_b(g_V1,97,246))
{
sbp.c = sbp.l - v_4;
break;
}

sbp.c = sbp.l - v_4;
if (sbp.c <= sbp.lb)
return;
sbp.c--;
}

sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
S_x = sbp.s_t();
if (sbp.e_v_b(S_x))
sbp.s_d();
}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_mark_regions();
B_ending_removed = false;
sbp.lb = v_1;
sbp.c = sbp.l;
r_particle_etc();
sbp.c = sbp.l;
r_possessive();
sbp.c = sbp.l;
r_case_ending();
sbp.c = sbp.l;
r_other_endings();
sbp.c = sbp.l;
if (B_ending_removed)
{
r_i_plural();
sbp.c = sbp.l;
}
 else
{
sbp.c = sbp.l;
r_t_plural();
sbp.c = sbp.l;
}

r_tidy();
return true;
}
;
}
,
FrenchStemmer: function () {
var a_0 = [new Among("col", - 1, - 1), new Among("par", - 1, - 1), new Among("tap", - 1, - 1)], a_1 = [new Among("", - 1, 4), new Among("I", 0, 1), new Among("U", 0, 2), new Among("Y", 0, 3)], a_2 = [new Among("iqU", - 1, 3), new Among("abl", - 1, 3), new Among("Ièr", - 1, 4), new Among("ièr", - 1, 4), new Among("eus", - 1, 2), new Among("iv", - 1, 1)], a_3 = [new Among("ic", - 1, 2), new Among("abil", - 1, 1), new Among("iv", - 1, 3)], a_4 = [new Among("iqUe", - 1, 1), new Among("atrice", - 1, 2), new Among("ance", - 1, 1), new Among("ence", - 1, 5), new Among("logie", - 1, 3), new Among("able", - 1, 1), new Among("isme", - 1, 1), new Among("euse", - 1, 11), new Among("iste", - 1, 1), new Among("ive", - 1, 8), new Among("if", - 1, 8), new Among("usion", - 1, 4), new Among("ation", - 1, 2), new Among("ution", - 1, 4), new Among("ateur", - 1, 2), new Among("iqUes", - 1, 1), new Among("atrices", - 1, 2), new Among("ances", - 1, 1), new Among("ences", - 1, 5), new Among("logies", - 1, 3), new Among("ables", - 1, 1), new Among("ismes", - 1, 1), new Among("euses", - 1, 11), new Among("istes", - 1, 1), new Among("ives", - 1, 8), new Among("ifs", - 1, 8), new Among("usions", - 1, 4), new Among("ations", - 1, 2), new Among("utions", - 1, 4), new Among("ateurs", - 1, 2), new Among("ments", - 1, 15), new Among("ements", 30, 6), new Among("issements", 31, 12), new Among("ités", - 1, 7), new Among("ment", - 1, 15), new Among("ement", 34, 6), new Among("issement", 35, 12), new Among("amment", 34, 13), new Among("emment", 34, 14), new Among("aux", - 1, 10), new Among("eaux", 39, 9), new Among("eux", - 1, 1), new Among("ité", - 1, 7)], a_5 = [new Among("ira", - 1, 1), new Among("ie", - 1, 1), new Among("isse", - 1, 1), new Among("issante", - 1, 1), new Among("i", - 1, 1), new Among("irai", 4, 1), new Among("ir", - 1, 1), new Among("iras", - 1, 1), new Among("ies", - 1, 1), new Among("îmes", - 1, 1), new Among("isses", - 1, 1), new Among("issantes", - 1, 1), new Among("îtes", - 1, 1), new Among("is", - 1, 1), new Among("irais", 13, 1), new Among("issais", 13, 1), new Among("irions", - 1, 1), new Among("issions", - 1, 1), new Among("irons", - 1, 1), new Among("issons", - 1, 1), new Among("issants", - 1, 1), new Among("it", - 1, 1), new Among("irait", 21, 1), new Among("issait", 21, 1), new Among("issant", - 1, 1), new Among("iraIent", - 1, 1), new Among("issaIent", - 1, 1), new Among("irent", - 1, 1), new Among("issent", - 1, 1), new Among("iront", - 1, 1), new Among("ît", - 1, 1), new Among("iriez", - 1, 1), new Among("issiez", - 1, 1), new Among("irez", - 1, 1), new Among("issez", - 1, 1)], a_6 = [new Among("a", - 1, 3), new Among("era", 0, 2), new Among("asse", - 1, 3), new Among("ante", - 1, 3), new Among("ée", - 1, 2), new Among("ai", - 1, 3), new Among("erai", 5, 2), new Among("er", - 1, 2), new Among("as", - 1, 3), new Among("eras", 8, 2), new Among("âmes", - 1, 3), new Among("asses", - 1, 3), new Among("antes", - 1, 3), new Among("âtes", - 1, 3), new Among("ées", - 1, 2), new Among("ais", - 1, 3), new Among("erais", 15, 2), new Among("ions", - 1, 1), new Among("erions", 17, 2), new Among("assions", 17, 3), new Among("erons", - 1, 2), new Among("ants", - 1, 3), new Among("és", - 1, 2), new Among("ait", - 1, 3), new Among("erait", 23, 2), new Among("ant", - 1, 3), new Among("aIent", - 1, 3), new Among("eraIent", 26, 2), new Among("èrent", - 1, 2), new Among("assent", - 1, 3), new Among("eront", - 1, 2), new Among("ât", - 1, 3), new Among("ez", - 1, 2), new Among("iez", 32, 2), new Among("eriez", 33, 2), new Among("assiez", 33, 3), new Among("erez", 32, 2), new Among("é", - 1, 2)], a_7 = [new Among("e", - 1, 3), new Among("Ière", 0, 2), new Among("ière", 0, 2), new Among("ion", - 1, 1), new Among("Ier", - 1, 2), new Among("ier", - 1, 2), new Among("ë", - 1, 4)], a_8 = [new Among("ell", - 1, - 1), new Among("eill", - 1, - 1), new Among("enn", - 1, - 1), new Among("onn", - 1, - 1), new Among("ett", - 1, - 1)], g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 130, 103, 8, 5], g_keep_with_s = [1, 65, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128], I_p2, I_p1, I_pV, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr1(c1, c2, v_1) {
if (sbp.e_s(1,c1))
{
sbp.k = sbp.c;
if (sbp.i_g(g_v,97,251))
{
sbp.s_f(c2);
sbp.c = v_1;
return true;
}

}

return false;
}

function habr2(c1, c2, v_1) {
if (sbp.e_s(1,c1))
{
sbp.k = sbp.c;
sbp.s_f(c2);
sbp.c = v_1;
return true;
}

return false;
}

function r_prelude() {
var v_1, v_2;
while (true) {
v_1 = sbp.c;
if (sbp.i_g(g_v,97,251))
{
sbp.b = sbp.c;
v_2 = sbp.c;
if (habr1("u","U",v_1))
continue;
sbp.c = v_2;
if (habr1("i","I",v_1))
continue;
sbp.c = v_2;
if (habr2("y","Y",v_1))
continue;
}

sbp.c = v_1;
sbp.b = v_1;
if (! habr1("y","Y",v_1))
{
sbp.c = v_1;
if (sbp.e_s(1,"q"))
{
sbp.b = sbp.c;
if (habr2("u","U",v_1))
continue;
}

sbp.c = v_1;
if (v_1 >= sbp.l)
return;
sbp.c++;
}

}

}

function habr3() {
while (! sbp.i_g(g_v,97,251)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

while (! sbp.o_g(g_v,97,251)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

function r_mark_regions() {
var v_1 = sbp.c;
I_pV = sbp.l;
I_p1 = I_pV;
I_p2 = I_pV;
if (sbp.i_g(g_v,97,251) && sbp.i_g(g_v,97,251) && sbp.c < sbp.l)
sbp.c++; else
{
sbp.c = v_1;
if (! sbp.f_a(a_0,3))
{
sbp.c = v_1;
do {
if (sbp.c >= sbp.l)
{
sbp.c = I_pV;
break;
}

sbp.c++;
}
 while (! sbp.i_g(g_v,97,251));
}

}

I_pV = sbp.c;
sbp.c = v_1;
if (! habr3())
{
I_p1 = sbp.c;
if (! habr3())
I_p2 = sbp.c;
}

}

function r_postlude() {
var a_v, v_1;
while (true) {
v_1 = sbp.c;
sbp.b = v_1;
a_v = sbp.f_a(a_1,4);
if (! a_v)
break;
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("i");
break;
case 2:
sbp.s_f("u");
break;
case 3:
sbp.s_f("y");
break;
case 4:
if (sbp.c >= sbp.l)
return;
sbp.c++;
break;
}

}

}

function r_RV() {
return I_pV <= sbp.c;
}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_standard_suffix() {
var a_v, v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,43);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (! r_R2())
return false;
sbp.s_d();
break;
case 2:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"ic"))
{
sbp.b = sbp.c;
if (! r_R2())
sbp.s_f("iqU"); else
sbp.s_d();
}

break;
case 3:
if (! r_R2())
return false;
sbp.s_f("log");
break;
case 4:
if (! r_R2())
return false;
sbp.s_f("u");
break;
case 5:
if (! r_R2())
return false;
sbp.s_f("ent");
break;
case 6:
if (! r_RV())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,6);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_R2())
{
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

}

break;
case 2:
if (r_R2())
sbp.s_d(); else
if (r_R1())
sbp.s_f("eux");
break;
case 3:
if (r_R2())
sbp.s_d();
break;
case 4:
if (r_RV())
sbp.s_f("i");
break;
}

}

break;
case 7:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,3);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_R2())
sbp.s_d(); else
sbp.s_f("abl");
break;
case 2:
if (r_R2())
sbp.s_d(); else
sbp.s_f("iqU");
break;
case 3:
if (r_R2())
sbp.s_d();
break;
}

}

break;
case 8:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
{
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"ic"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d(); else
sbp.s_f("iqU");
break;
}

}

}

break;
case 9:
sbp.s_f("eau");
break;
case 10:
if (! r_R1())
return false;
sbp.s_f("al");
break;
case 11:
if (r_R2())
sbp.s_d(); else
if (! r_R1())
return false; else
sbp.s_f("eux");
break;
case 12:
if (! r_R1() || ! sbp.o_g_b(g_v,97,251))
return false;
sbp.s_d();
break;
case 13:
if (r_RV())
sbp.s_f("ant");
return false;
case 14:
if (r_RV())
sbp.s_f("ent");
return false;
case 15:
v_1 = sbp.l - sbp.c;
if (sbp.i_g_b(g_v,97,251) && r_RV())
{
sbp.c = sbp.l - v_1;
sbp.s_d();
}

return false;
}

return true;
}

return false;
}

function r_i_verb_suffix() {
var a_v, v_1;
if (sbp.c < I_pV)
return false;
v_1 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_5,35);
if (! a_v)
{
sbp.lb = v_1;
return false;
}

sbp.b = sbp.c;
if (a_v == 1)
{
if (! sbp.o_g_b(g_v,97,251))
{
sbp.lb = v_1;
return false;
}

sbp.s_d();
}

sbp.lb = v_1;
return true;
}

function r_verb_suffix() {
var a_v, v_2, v_3;
if (sbp.c < I_pV)
return false;
v_2 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,38);
if (! a_v)
{
sbp.lb = v_2;
return false;
}

sbp.b = sbp.c;
switch (a_v) {
case 1:
if (! r_R2())
{
sbp.lb = v_2;
return false;
}

sbp.s_d();
break;
case 2:
sbp.s_d();
break;
case 3:
sbp.s_d();
v_3 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"e"))
{
sbp.b = sbp.c;
sbp.s_d();
}
 else
sbp.c = sbp.l - v_3;
break;
}

sbp.lb = v_2;
return true;
}

function r_residual_suffix() {
var a_v, v_1 = sbp.l - sbp.c, v_2, v_4, v_5;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"s"))
{
sbp.b = sbp.c;
v_2 = sbp.l - sbp.c;
if (sbp.o_g_b(g_keep_with_s,97,232))
{
sbp.c = sbp.l - v_2;
sbp.s_d();
}
 else
sbp.c = sbp.l - v_1;
}
 else
sbp.c = sbp.l - v_1;
if (sbp.c >= I_pV)
{
v_4 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,7);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_R2())
{
v_5 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"s"))
{
sbp.c = sbp.l - v_5;
if (! sbp.e_s_b(1,"t"))
break;
}

sbp.s_d();
}

break;
case 2:
sbp.s_f("i");
break;
case 3:
sbp.s_d();
break;
case 4:
if (sbp.e_s_b(2,"gu"))
sbp.s_d();
break;
}

}

sbp.lb = v_4;
}

}

function r_un_double() {
var v_1 = sbp.l - sbp.c;
if (sbp.f_a_b(a_8,5))
{
sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

}

}

function r_un_accent() {
var v_1, v_2 = 1;
while (sbp.o_g_b(g_v,97,251)) v_2--;
if (v_2 <= 0)
{
sbp.k = sbp.c;
v_1 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"é"))
{
sbp.c = sbp.l - v_1;
if (! sbp.e_s_b(1,"è"))
return;
}

sbp.b = sbp.c;
sbp.s_f("e");
}

}

function habr5() {
if (! r_standard_suffix())
{
sbp.c = sbp.l;
if (! r_i_verb_suffix())
{
sbp.c = sbp.l;
if (! r_verb_suffix())
{
sbp.c = sbp.l;
r_residual_suffix();
return;
}

}

}

sbp.c = sbp.l;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"Y"))
{
sbp.b = sbp.c;
sbp.s_f("i");
}
 else
{
sbp.c = sbp.l;
if (sbp.e_s_b(1,"ç"))
{
sbp.b = sbp.c;
sbp.s_f("c");
}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
habr5();
sbp.c = sbp.l;
r_un_double();
sbp.c = sbp.l;
r_un_accent();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
GermanStemmer: function () {
var a_0 = [new Among("", - 1, 6), new Among("U", 0, 2), new Among("Y", 0, 1), new Among("ä", 0, 3), new Among("ö", 0, 4), new Among("ü", 0, 5)], a_1 = [new Among("e", - 1, 2), new Among("em", - 1, 1), new Among("en", - 1, 2), new Among("ern", - 1, 1), new Among("er", - 1, 1), new Among("s", - 1, 3), new Among("es", 5, 2)], a_2 = [new Among("en", - 1, 1), new Among("er", - 1, 1), new Among("st", - 1, 2), new Among("est", 2, 1)], a_3 = [new Among("ig", - 1, 1), new Among("lich", - 1, 1)], a_4 = [new Among("end", - 1, 1), new Among("ig", - 1, 2), new Among("ung", - 1, 1), new Among("lich", - 1, 3), new Among("isch", - 1, 2), new Among("ik", - 1, 2), new Among("heit", - 1, 3), new Among("keit", - 1, 4)], g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 32, 8], g_s_ending = [117, 30, 5], g_st_ending = [117, 30, 4], I_x, I_p2, I_p1, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr1(c1, c2, v_1) {
if (sbp.e_s(1,c1))
{
sbp.k = sbp.c;
if (sbp.i_g(g_v,97,252))
{
sbp.s_f(c2);
sbp.c = v_1;
return true;
}

}

return false;
}

function r_prelude() {
var v_1 = sbp.c, v_2, v_3, v_4, v_5;
while (true) {
v_2 = sbp.c;
sbp.b = v_2;
if (sbp.e_s(1,"ß"))
{
sbp.k = sbp.c;
sbp.s_f("ss");
}
 else
{
if (v_2 >= sbp.l)
break;
sbp.c = v_2 + 1;
}

}

sbp.c = v_1;
while (true) {
v_3 = sbp.c;
while (true) {
v_4 = sbp.c;
if (sbp.i_g(g_v,97,252))
{
v_5 = sbp.c;
sbp.b = v_5;
if (habr1("u","U",v_4))
break;
sbp.c = v_5;
if (habr1("y","Y",v_4))
break;
}

if (v_4 >= sbp.l)
{
sbp.c = v_3;
return;
}

sbp.c = v_4 + 1;
}

}

}

function habr2() {
while (! sbp.i_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

while (! sbp.o_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

function r_mark_regions() {
I_p1 = sbp.l;
I_p2 = I_p1;
var c = sbp.c + 3;
if (0 <= c && c <= sbp.l)
{
I_x = c;
if (! habr2())
{
I_p1 = sbp.c;
if (I_p1 < I_x)
I_p1 = I_x;
if (! habr2())
I_p2 = sbp.c;
}

}

}

function r_postlude() {
var a_v, v_1;
while (true) {
v_1 = sbp.c;
sbp.b = v_1;
a_v = sbp.f_a(a_0,6);
if (! a_v)
return;
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("y");
break;
case 2:

case 5:
sbp.s_f("u");
break;
case 3:
sbp.s_f("a");
break;
case 4:
sbp.s_f("o");
break;
case 6:
if (sbp.c >= sbp.l)
return;
sbp.c++;
break;
}

}

}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_standard_suffix() {
var a_v, v_1 = sbp.l - sbp.c, v_2, v_3, v_4;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_1,7);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(1,"s"))
{
sbp.b = sbp.c;
if (sbp.e_s_b(3,"nis"))
sbp.s_d();
}

break;
case 3:
if (sbp.i_g_b(g_s_ending,98,116))
sbp.s_d();
break;
}

}

}

sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,4);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
if (sbp.i_g_b(g_st_ending,98,116))
{
var c = sbp.c - 3;
if (sbp.lb <= c && c <= sbp.l)
{
sbp.c = c;
sbp.s_d();
}

}

break;
}

}

}

sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,8);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2())
{
switch (a_v) {
case 1:
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"ig"))
{
sbp.b = sbp.c;
v_2 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"e"))
{
sbp.c = sbp.l - v_2;
if (r_R2())
sbp.s_d();
}

}

break;
case 2:
v_3 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"e"))
{
sbp.c = sbp.l - v_3;
sbp.s_d();
}

break;
case 3:
sbp.s_d();
sbp.k = sbp.c;
v_4 = sbp.l - sbp.c;
if (! sbp.e_s_b(2,"er"))
{
sbp.c = sbp.l - v_4;
if (! sbp.e_s_b(2,"en"))
break;
}

sbp.b = sbp.c;
if (r_R1())
sbp.s_d();
break;
case 4:
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,2);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2() && a_v == 1)
sbp.s_d();
}

break;
}

}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_standard_suffix();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
HungarianStemmer: function () {
var a_0 = [new Among("cs", - 1, - 1), new Among("dzs", - 1, - 1), new Among("gy", - 1, - 1), new Among("ly", - 1, - 1), new Among("ny", - 1, - 1), new Among("sz", - 1, - 1), new Among("ty", - 1, - 1), new Among("zs", - 1, - 1)], a_1 = [new Among("á", - 1, 1), new Among("é", - 1, 2)], a_2 = [new Among("bb", - 1, - 1), new Among("cc", - 1, - 1), new Among("dd", - 1, - 1), new Among("ff", - 1, - 1), new Among("gg", - 1, - 1), new Among("jj", - 1, - 1), new Among("kk", - 1, - 1), new Among("ll", - 1, - 1), new Among("mm", - 1, - 1), new Among("nn", - 1, - 1), new Among("pp", - 1, - 1), new Among("rr", - 1, - 1), new Among("ccs", - 1, - 1), new Among("ss", - 1, - 1), new Among("zzs", - 1, - 1), new Among("tt", - 1, - 1), new Among("vv", - 1, - 1), new Among("ggy", - 1, - 1), new Among("lly", - 1, - 1), new Among("nny", - 1, - 1), new Among("tty", - 1, - 1), new Among("ssz", - 1, - 1), new Among("zz", - 1, - 1)], a_3 = [new Among("al", - 1, 1), new Among("el", - 1, 2)], a_4 = [new Among("ba", - 1, - 1), new Among("ra", - 1, - 1), new Among("be", - 1, - 1), new Among("re", - 1, - 1), new Among("ig", - 1, - 1), new Among("nak", - 1, - 1), new Among("nek", - 1, - 1), new Among("val", - 1, - 1), new Among("vel", - 1, - 1), new Among("ul", - 1, - 1), new Among("nál", - 1, - 1), new Among("nél", - 1, - 1), new Among("ból", - 1, - 1), new Among("ról", - 1, - 1), new Among("tól", - 1, - 1), new Among("bõl", - 1, - 1), new Among("rõl", - 1, - 1), new Among("tõl", - 1, - 1), new Among("ül", - 1, - 1), new Among("n", - 1, - 1), new Among("an", 19, - 1), new Among("ban", 20, - 1), new Among("en", 19, - 1), new Among("ben", 22, - 1), new Among("képpen", 22, - 1), new Among("on", 19, - 1), new Among("ön", 19, - 1), new Among("képp", - 1, - 1), new Among("kor", - 1, - 1), new Among("t", - 1, - 1), new Among("at", 29, - 1), new Among("et", 29, - 1), new Among("ként", 29, - 1), new Among("anként", 32, - 1), new Among("enként", 32, - 1), new Among("onként", 32, - 1), new Among("ot", 29, - 1), new Among("ért", 29, - 1), new Among("öt", 29, - 1), new Among("hez", - 1, - 1), new Among("hoz", - 1, - 1), new Among("höz", - 1, - 1), new Among("vá", - 1, - 1), new Among("vé", - 1, - 1)], a_5 = [new Among("án", - 1, 2), new Among("én", - 1, 1), new Among("ánként", - 1, 3)], a_6 = [new Among("stul", - 1, 2), new Among("astul", 0, 1), new Among("ástul", 0, 3), new Among("stül", - 1, 2), new Among("estül", 3, 1), new Among("éstül", 3, 4)], a_7 = [new Among("á", - 1, 1), new Among("é", - 1, 2)], a_8 = [new Among("k", - 1, 7), new Among("ak", 0, 4), new Among("ek", 0, 6), new Among("ok", 0, 5), new Among("ák", 0, 1), new Among("ék", 0, 2), new Among("ök", 0, 3)], a_9 = [new Among("éi", - 1, 7), new Among("áéi", 0, 6), new Among("ééi", 0, 5), new Among("é", - 1, 9), new Among("ké", 3, 4), new Among("aké", 4, 1), new Among("eké", 4, 1), new Among("oké", 4, 1), new Among("áké", 4, 3), new Among("éké", 4, 2), new Among("öké", 4, 1), new Among("éé", 3, 8)], a_10 = [new Among("a", - 1, 18), new Among("ja", 0, 17), new Among("d", - 1, 16), new Among("ad", 2, 13), new Among("ed", 2, 13), new Among("od", 2, 13), new Among("ád", 2, 14), new Among("éd", 2, 15), new Among("öd", 2, 13), new Among("e", - 1, 18), new Among("je", 9, 17), new Among("nk", - 1, 4), new Among("unk", 11, 1), new Among("ánk", 11, 2), new Among("énk", 11, 3), new Among("ünk", 11, 1), new Among("uk", - 1, 8), new Among("juk", 16, 7), new Among("ájuk", 17, 5), new Among("ük", - 1, 8), new Among("jük", 19, 7), new Among("éjük", 20, 6), new Among("m", - 1, 12), new Among("am", 22, 9), new Among("em", 22, 9), new Among("om", 22, 9), new Among("ám", 22, 10), new Among("ém", 22, 11), new Among("o", - 1, 18), new Among("á", - 1, 19), new Among("é", - 1, 20)], a_11 = [new Among("id", - 1, 10), new Among("aid", 0, 9), new Among("jaid", 1, 6), new Among("eid", 0, 9), new Among("jeid", 3, 6), new Among("áid", 0, 7), new Among("éid", 0, 8), new Among("i", - 1, 15), new Among("ai", 7, 14), new Among("jai", 8, 11), new Among("ei", 7, 14), new Among("jei", 10, 11), new Among("ái", 7, 12), new Among("éi", 7, 13), new Among("itek", - 1, 24), new Among("eitek", 14, 21), new Among("jeitek", 15, 20), new Among("éitek", 14, 23), new Among("ik", - 1, 29), new Among("aik", 18, 26), new Among("jaik", 19, 25), new Among("eik", 18, 26), new Among("jeik", 21, 25), new Among("áik", 18, 27), new Among("éik", 18, 28), new Among("ink", - 1, 20), new Among("aink", 25, 17), new Among("jaink", 26, 16), new Among("eink", 25, 17), new Among("jeink", 28, 16), new Among("áink", 25, 18), new Among("éink", 25, 19), new Among("aitok", - 1, 21), new Among("jaitok", 32, 20), new Among("áitok", - 1, 22), new Among("im", - 1, 5), new Among("aim", 35, 4), new Among("jaim", 36, 1), new Among("eim", 35, 4), new Among("jeim", 38, 1), new Among("áim", 35, 2), new Among("éim", 35, 3)], g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 17, 52, 14], I_p1, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_mark_regions() {
var v_1 = sbp.c, v_2;
I_p1 = sbp.l;
if (sbp.i_g(g_v,97,252))
{
while (true) {
v_2 = sbp.c;
if (sbp.o_g(g_v,97,252))
{
sbp.c = v_2;
if (! sbp.f_a(a_0,8))
{
sbp.c = v_2;
if (v_2 < sbp.l)
sbp.c++;
}

I_p1 = sbp.c;
return;
}

sbp.c = v_2;
if (v_2 >= sbp.l)
{
I_p1 = v_2;
return;
}

sbp.c++;
}

}

sbp.c = v_1;
if (sbp.o_g(g_v,97,252))
{
while (! sbp.i_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return;
sbp.c++;
}

I_p1 = sbp.c;
}

}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_v_ending() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_1,2);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_f("a");
break;
case 2:
sbp.s_f("e");
break;
}

}

}

}

function r_double() {
var v_1 = sbp.l - sbp.c;
if (! sbp.f_a_b(a_2,23))
return false;
sbp.c = sbp.l - v_1;
return true;
}

function r_undouble() {
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.k = sbp.c;
var c = sbp.c - 1;
if (sbp.lb <= c && c <= sbp.l)
{
sbp.c = c;
sbp.b = c;
sbp.s_d();
}

}

}

function r_instrum() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,2);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
if (a_v == 1 || a_v == 2)
if (! r_double())
return;
sbp.s_d();
r_undouble();
}

}

}

function r_case() {
sbp.k = sbp.c;
if (sbp.f_a_b(a_4,44))
{
sbp.b = sbp.c;
if (r_R1())
{
sbp.s_d();
r_v_ending();
}

}

}

function r_case_special() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_5,3);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_f("e");
break;
case 2:

case 3:
sbp.s_f("a");
break;
}

}

}

}

function r_case_other() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,6);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:

case 2:
sbp.s_d();
break;
case 3:
sbp.s_f("a");
break;
case 4:
sbp.s_f("e");
break;
}

}

}

}

function r_factive() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,2);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
if (a_v == 1 || a_v == 2)
if (! r_double())
return;
sbp.s_d();
r_undouble();
}

}

}

function r_plural() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_8,7);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_f("a");
break;
case 2:
sbp.s_f("e");
break;
case 3:

case 4:

case 5:

case 6:

case 7:
sbp.s_d();
break;
}

}

}

}

function r_owned() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_9,12);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:

case 4:

case 7:

case 9:
sbp.s_d();
break;
case 2:

case 5:

case 8:
sbp.s_f("e");
break;
case 3:

case 6:
sbp.s_f("a");
break;
}

}

}

}

function r_sing_owner() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_10,31);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:

case 4:

case 7:

case 8:

case 9:

case 12:

case 13:

case 16:

case 17:

case 18:
sbp.s_d();
break;
case 2:

case 5:

case 10:

case 14:

case 19:
sbp.s_f("a");
break;
case 3:

case 6:

case 11:

case 15:

case 20:
sbp.s_f("e");
break;
}

}

}

}

function r_plur_owner() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_11,42);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:

case 4:

case 5:

case 6:

case 9:

case 10:

case 11:

case 14:

case 15:

case 16:

case 17:

case 20:

case 21:

case 24:

case 25:

case 26:

case 29:
sbp.s_d();
break;
case 2:

case 7:

case 12:

case 18:

case 22:

case 27:
sbp.s_f("a");
break;
case 3:

case 8:

case 13:

case 19:

case 23:

case 28:
sbp.s_f("e");
break;
}

}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_instrum();
sbp.c = sbp.l;
r_case();
sbp.c = sbp.l;
r_case_special();
sbp.c = sbp.l;
r_case_other();
sbp.c = sbp.l;
r_factive();
sbp.c = sbp.l;
r_owned();
sbp.c = sbp.l;
r_sing_owner();
sbp.c = sbp.l;
r_plur_owner();
sbp.c = sbp.l;
r_plural();
return true;
}
;
}
,
ItalianStemmer: function () {
var a_0 = [new Among("", - 1, 7), new Among("qu", 0, 6), new Among("á", 0, 1), new Among("é", 0, 2), new Among("í", 0, 3), new Among("ó", 0, 4), new Among("ú", 0, 5)], a_1 = [new Among("", - 1, 3), new Among("I", 0, 1), new Among("U", 0, 2)], a_2 = [new Among("la", - 1, - 1), new Among("cela", 0, - 1), new Among("gliela", 0, - 1), new Among("mela", 0, - 1), new Among("tela", 0, - 1), new Among("vela", 0, - 1), new Among("le", - 1, - 1), new Among("cele", 6, - 1), new Among("gliele", 6, - 1), new Among("mele", 6, - 1), new Among("tele", 6, - 1), new Among("vele", 6, - 1), new Among("ne", - 1, - 1), new Among("cene", 12, - 1), new Among("gliene", 12, - 1), new Among("mene", 12, - 1), new Among("sene", 12, - 1), new Among("tene", 12, - 1), new Among("vene", 12, - 1), new Among("ci", - 1, - 1), new Among("li", - 1, - 1), new Among("celi", 20, - 1), new Among("glieli", 20, - 1), new Among("meli", 20, - 1), new Among("teli", 20, - 1), new Among("veli", 20, - 1), new Among("gli", 20, - 1), new Among("mi", - 1, - 1), new Among("si", - 1, - 1), new Among("ti", - 1, - 1), new Among("vi", - 1, - 1), new Among("lo", - 1, - 1), new Among("celo", 31, - 1), new Among("glielo", 31, - 1), new Among("melo", 31, - 1), new Among("telo", 31, - 1), new Among("velo", 31, - 1)], a_3 = [new Among("ando", - 1, 1), new Among("endo", - 1, 1), new Among("ar", - 1, 2), new Among("er", - 1, 2), new Among("ir", - 1, 2)], a_4 = [new Among("ic", - 1, - 1), new Among("abil", - 1, - 1), new Among("os", - 1, - 1), new Among("iv", - 1, 1)], a_5 = [new Among("ic", - 1, 1), new Among("abil", - 1, 1), new Among("iv", - 1, 1)], a_6 = [new Among("ica", - 1, 1), new Among("logia", - 1, 3), new Among("osa", - 1, 1), new Among("ista", - 1, 1), new Among("iva", - 1, 9), new Among("anza", - 1, 1), new Among("enza", - 1, 5), new Among("ice", - 1, 1), new Among("atrice", 7, 1), new Among("iche", - 1, 1), new Among("logie", - 1, 3), new Among("abile", - 1, 1), new Among("ibile", - 1, 1), new Among("usione", - 1, 4), new Among("azione", - 1, 2), new Among("uzione", - 1, 4), new Among("atore", - 1, 2), new Among("ose", - 1, 1), new Among("ante", - 1, 1), new Among("mente", - 1, 1), new Among("amente", 19, 7), new Among("iste", - 1, 1), new Among("ive", - 1, 9), new Among("anze", - 1, 1), new Among("enze", - 1, 5), new Among("ici", - 1, 1), new Among("atrici", 25, 1), new Among("ichi", - 1, 1), new Among("abili", - 1, 1), new Among("ibili", - 1, 1), new Among("ismi", - 1, 1), new Among("usioni", - 1, 4), new Among("azioni", - 1, 2), new Among("uzioni", - 1, 4), new Among("atori", - 1, 2), new Among("osi", - 1, 1), new Among("anti", - 1, 1), new Among("amenti", - 1, 6), new Among("imenti", - 1, 6), new Among("isti", - 1, 1), new Among("ivi", - 1, 9), new Among("ico", - 1, 1), new Among("ismo", - 1, 1), new Among("oso", - 1, 1), new Among("amento", - 1, 6), new Among("imento", - 1, 6), new Among("ivo", - 1, 9), new Among("ità", - 1, 8), new Among("istà", - 1, 1), new Among("istè", - 1, 1), new Among("istì", - 1, 1)], a_7 = [new Among("isca", - 1, 1), new Among("enda", - 1, 1), new Among("ata", - 1, 1), new Among("ita", - 1, 1), new Among("uta", - 1, 1), new Among("ava", - 1, 1), new Among("eva", - 1, 1), new Among("iva", - 1, 1), new Among("erebbe", - 1, 1), new Among("irebbe", - 1, 1), new Among("isce", - 1, 1), new Among("ende", - 1, 1), new Among("are", - 1, 1), new Among("ere", - 1, 1), new Among("ire", - 1, 1), new Among("asse", - 1, 1), new Among("ate", - 1, 1), new Among("avate", 16, 1), new Among("evate", 16, 1), new Among("ivate", 16, 1), new Among("ete", - 1, 1), new Among("erete", 20, 1), new Among("irete", 20, 1), new Among("ite", - 1, 1), new Among("ereste", - 1, 1), new Among("ireste", - 1, 1), new Among("ute", - 1, 1), new Among("erai", - 1, 1), new Among("irai", - 1, 1), new Among("isci", - 1, 1), new Among("endi", - 1, 1), new Among("erei", - 1, 1), new Among("irei", - 1, 1), new Among("assi", - 1, 1), new Among("ati", - 1, 1), new Among("iti", - 1, 1), new Among("eresti", - 1, 1), new Among("iresti", - 1, 1), new Among("uti", - 1, 1), new Among("avi", - 1, 1), new Among("evi", - 1, 1), new Among("ivi", - 1, 1), new Among("isco", - 1, 1), new Among("ando", - 1, 1), new Among("endo", - 1, 1), new Among("Yamo", - 1, 1), new Among("iamo", - 1, 1), new Among("avamo", - 1, 1), new Among("evamo", - 1, 1), new Among("ivamo", - 1, 1), new Among("eremo", - 1, 1), new Among("iremo", - 1, 1), new Among("assimo", - 1, 1), new Among("ammo", - 1, 1), new Among("emmo", - 1, 1), new Among("eremmo", 54, 1), new Among("iremmo", 54, 1), new Among("immo", - 1, 1), new Among("ano", - 1, 1), new Among("iscano", 58, 1), new Among("avano", 58, 1), new Among("evano", 58, 1), new Among("ivano", 58, 1), new Among("eranno", - 1, 1), new Among("iranno", - 1, 1), new Among("ono", - 1, 1), new Among("iscono", 65, 1), new Among("arono", 65, 1), new Among("erono", 65, 1), new Among("irono", 65, 1), new Among("erebbero", - 1, 1), new Among("irebbero", - 1, 1), new Among("assero", - 1, 1), new Among("essero", - 1, 1), new Among("issero", - 1, 1), new Among("ato", - 1, 1), new Among("ito", - 1, 1), new Among("uto", - 1, 1), new Among("avo", - 1, 1), new Among("evo", - 1, 1), new Among("ivo", - 1, 1), new Among("ar", - 1, 1), new Among("ir", - 1, 1), new Among("erà", - 1, 1), new Among("irà", - 1, 1), new Among("erò", - 1, 1), new Among("irò", - 1, 1)], g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 128, 8, 2, 1], g_AEIO = [17, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 128, 8, 2], g_CG = [17], I_p2, I_p1, I_pV, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr1(c1, c2, v_1) {
if (sbp.e_s(1,c1))
{
sbp.k = sbp.c;
if (sbp.i_g(g_v,97,249))
{
sbp.s_f(c2);
sbp.c = v_1;
return true;
}

}

return false;
}

function r_prelude() {
var a_v, v_1 = sbp.c, v_2, v_3, v_4;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_0,7);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("à");
continue;
case 2:
sbp.s_f("è");
continue;
case 3:
sbp.s_f("ì");
continue;
case 4:
sbp.s_f("ò");
continue;
case 5:
sbp.s_f("ù");
continue;
case 6:
sbp.s_f("qU");
continue;
case 7:
if (sbp.c >= sbp.l)
break;
sbp.c++;
continue;
}

}

break;
}

sbp.c = v_1;
while (true) {
v_2 = sbp.c;
while (true) {
v_3 = sbp.c;
if (sbp.i_g(g_v,97,249))
{
sbp.b = sbp.c;
v_4 = sbp.c;
if (habr1("u","U",v_3))
break;
sbp.c = v_4;
if (habr1("i","I",v_3))
break;
}

sbp.c = v_3;
if (sbp.c >= sbp.l)
{
sbp.c = v_2;
return;
}

sbp.c++;
}

}

}

function habr2(v_1) {
sbp.c = v_1;
if (! sbp.i_g(g_v,97,249))
return false;
while (! sbp.o_g(g_v,97,249)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function habr3() {
if (sbp.i_g(g_v,97,249))
{
var v_1 = sbp.c;
if (sbp.o_g(g_v,97,249))
{
while (! sbp.i_g(g_v,97,249)) {
if (sbp.c >= sbp.l)
return habr2(v_1);
sbp.c++;
}

return true;
}

return habr2(v_1);
}

return false;
}

function habr4() {
var v_1 = sbp.c, v_2;
if (! habr3())
{
sbp.c = v_1;
if (! sbp.o_g(g_v,97,249))
return;
v_2 = sbp.c;
if (sbp.o_g(g_v,97,249))
{
while (! sbp.i_g(g_v,97,249)) {
if (sbp.c >= sbp.l)
{
sbp.c = v_2;
if (sbp.i_g(g_v,97,249) && sbp.c < sbp.l)
sbp.c++;
return;
}

sbp.c++;
}

I_pV = sbp.c;
return;
}

sbp.c = v_2;
if (! sbp.i_g(g_v,97,249) || sbp.c >= sbp.l)
return;
sbp.c++;
}

I_pV = sbp.c;
}

function habr5() {
while (! sbp.i_g(g_v,97,249)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

while (! sbp.o_g(g_v,97,249)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function r_mark_regions() {
var v_1 = sbp.c;
I_pV = sbp.l;
I_p1 = I_pV;
I_p2 = I_pV;
habr4();
sbp.c = v_1;
if (habr5())
{
I_p1 = sbp.c;
if (habr5())
I_p2 = sbp.c;
}

}

function r_postlude() {
var a_v;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_1,3);
if (! a_v)
break;
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("i");
break;
case 2:
sbp.s_f("u");
break;
case 3:
if (sbp.c >= sbp.l)
return;
sbp.c++;
break;
}

}

}

function r_RV() {
return I_pV <= sbp.c;
}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_attached_pronoun() {
var a_v;
sbp.k = sbp.c;
if (sbp.f_a_b(a_2,37))
{
sbp.b = sbp.c;
a_v = sbp.f_a_b(a_3,5);
if (a_v && r_RV())
{
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
sbp.s_f("e");
break;
}

}

}

}

function r_standard_suffix() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,51);
if (! a_v)
return false;
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (! r_R2())
return false;
sbp.s_d();
break;
case 2:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"ic"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

break;
case 3:
if (! r_R2())
return false;
sbp.s_f("log");
break;
case 4:
if (! r_R2())
return false;
sbp.s_f("u");
break;
case 5:
if (! r_R2())
return false;
sbp.s_f("ente");
break;
case 6:
if (! r_RV())
return false;
sbp.s_d();
break;
case 7:
if (! r_R1())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,4);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2())
{
sbp.s_d();
if (a_v == 1)
{
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

}

}

}

break;
case 8:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_5,3);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
if (r_R2())
sbp.s_d();
}

break;
case 9:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
{
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"ic"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

}

}

break;
}

return true;
}

function r_verb_suffix() {
var a_v, v_1;
if (sbp.c >= I_pV)
{
v_1 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,87);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
sbp.s_d();
}

sbp.lb = v_1;
}

}

function habr6() {
var v_1 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (sbp.i_g_b(g_AEIO,97,242))
{
sbp.b = sbp.c;
if (r_RV())
{
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(1,"i"))
{
sbp.b = sbp.c;
if (r_RV())
{
sbp.s_d();
return;
}

}

}

}

sbp.c = sbp.l - v_1;
}

function r_vowel_suffix() {
habr6();
sbp.k = sbp.c;
if (sbp.e_s_b(1,"h"))
{
sbp.b = sbp.c;
if (sbp.i_g_b(g_CG,99,103))
if (r_RV())
sbp.s_d();
}

}

this.stem = function () {
var v_1 = sbp.c;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_attached_pronoun();
sbp.c = sbp.l;
if (! r_standard_suffix())
{
sbp.c = sbp.l;
r_verb_suffix();
}

sbp.c = sbp.l;
r_vowel_suffix();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
NorwegianStemmer: function () {
var a_0 = [new Among("a", - 1, 1), new Among("e", - 1, 1), new Among("ede", 1, 1), new Among("ande", 1, 1), new Among("ende", 1, 1), new Among("ane", 1, 1), new Among("ene", 1, 1), new Among("hetene", 6, 1), new Among("erte", 1, 3), new Among("en", - 1, 1), new Among("heten", 9, 1), new Among("ar", - 1, 1), new Among("er", - 1, 1), new Among("heter", 12, 1), new Among("s", - 1, 2), new Among("as", 14, 1), new Among("es", 14, 1), new Among("edes", 16, 1), new Among("endes", 16, 1), new Among("enes", 16, 1), new Among("hetenes", 19, 1), new Among("ens", 14, 1), new Among("hetens", 21, 1), new Among("ers", 14, 1), new Among("ets", 14, 1), new Among("et", - 1, 1), new Among("het", 25, 1), new Among("ert", - 1, 3), new Among("ast", - 1, 1)], a_1 = [new Among("dt", - 1, - 1), new Among("vt", - 1, - 1)], a_2 = [new Among("leg", - 1, 1), new Among("eleg", 0, 1), new Among("ig", - 1, 1), new Among("eig", 2, 1), new Among("lig", 2, 1), new Among("elig", 4, 1), new Among("els", - 1, 1), new Among("lov", - 1, 1), new Among("elov", 7, 1), new Among("slov", 7, 1), new Among("hetslov", 9, 1)], g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 128], g_s_ending = [119, 125, 149, 1], I_x, I_p1, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_mark_regions() {
var v_1, c = sbp.c + 3;
I_p1 = sbp.l;
if (0 <= c || c <= sbp.l)
{
I_x = c;
while (true) {
v_1 = sbp.c;
if (sbp.i_g(g_v,97,248))
{
sbp.c = v_1;
break;
}

if (v_1 >= sbp.l)
return;
sbp.c = v_1 + 1;
}

while (! sbp.o_g(g_v,97,248)) {
if (sbp.c >= sbp.l)
return;
sbp.c++;
}

I_p1 = sbp.c;
if (I_p1 < I_x)
I_p1 = I_x;
}

}

function r_main_suffix() {
var a_v, v_1, v_2;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_0,29);
sbp.lb = v_1;
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
v_2 = sbp.l - sbp.c;
if (sbp.i_g_b(g_s_ending,98,122))
sbp.s_d(); else
{
sbp.c = sbp.l - v_2;
if (sbp.e_s_b(1,"k") && sbp.o_g_b(g_v,97,248))
sbp.s_d();
}

break;
case 3:
sbp.s_f("er");
break;
}

}

}

}

function r_consonant_pair() {
var v_1 = sbp.l - sbp.c, v_2;
if (sbp.c >= I_p1)
{
v_2 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
if (sbp.f_a_b(a_1,2))
{
sbp.b = sbp.c;
sbp.lb = v_2;
sbp.c = sbp.l - v_1;
if (sbp.c > sbp.lb)
{
sbp.c--;
sbp.b = sbp.c;
sbp.s_d();
}

}
 else
sbp.lb = v_2;
}

}

function r_other_suffix() {
var a_v, v_1;
if (sbp.c >= I_p1)
{
v_1 = sbp.lb;
sbp.lb = I_p1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,11);
if (a_v)
{
sbp.b = sbp.c;
sbp.lb = v_1;
if (a_v == 1)
sbp.s_d();
}
 else
sbp.lb = v_1;
}

}

this.stem = function () {
var v_1 = sbp.c;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_main_suffix();
sbp.c = sbp.l;
r_consonant_pair();
sbp.c = sbp.l;
r_other_suffix();
return true;
}
;
}
,
PortugueseStemmer: function () {
var a_0 = [new Among("", - 1, 3), new Among("ã", 0, 1), new Among("õ", 0, 2)], a_1 = [new Among("", - 1, 3), new Among("a~", 0, 1), new Among("o~", 0, 2)], a_2 = [new Among("ic", - 1, - 1), new Among("ad", - 1, - 1), new Among("os", - 1, - 1), new Among("iv", - 1, 1)], a_3 = [new Among("ante", - 1, 1), new Among("avel", - 1, 1), new Among("ível", - 1, 1)], a_4 = [new Among("ic", - 1, 1), new Among("abil", - 1, 1), new Among("iv", - 1, 1)], a_5 = [new Among("ica", - 1, 1), new Among("ância", - 1, 1), new Among("ência", - 1, 4), new Among("ira", - 1, 9), new Among("adora", - 1, 1), new Among("osa", - 1, 1), new Among("ista", - 1, 1), new Among("iva", - 1, 8), new Among("eza", - 1, 1), new Among("logía", - 1, 2), new Among("idade", - 1, 7), new Among("ante", - 1, 1), new Among("mente", - 1, 6), new Among("amente", 12, 5), new Among("ável", - 1, 1), new Among("ível", - 1, 1), new Among("ución", - 1, 3), new Among("ico", - 1, 1), new Among("ismo", - 1, 1), new Among("oso", - 1, 1), new Among("amento", - 1, 1), new Among("imento", - 1, 1), new Among("ivo", - 1, 8), new Among("aça~o", - 1, 1), new Among("ador", - 1, 1), new Among("icas", - 1, 1), new Among("ências", - 1, 4), new Among("iras", - 1, 9), new Among("adoras", - 1, 1), new Among("osas", - 1, 1), new Among("istas", - 1, 1), new Among("ivas", - 1, 8), new Among("ezas", - 1, 1), new Among("logías", - 1, 2), new Among("idades", - 1, 7), new Among("uciones", - 1, 3), new Among("adores", - 1, 1), new Among("antes", - 1, 1), new Among("aço~es", - 1, 1), new Among("icos", - 1, 1), new Among("ismos", - 1, 1), new Among("osos", - 1, 1), new Among("amentos", - 1, 1), new Among("imentos", - 1, 1), new Among("ivos", - 1, 8)], a_6 = [new Among("ada", - 1, 1), new Among("ida", - 1, 1), new Among("ia", - 1, 1), new Among("aria", 2, 1), new Among("eria", 2, 1), new Among("iria", 2, 1), new Among("ara", - 1, 1), new Among("era", - 1, 1), new Among("ira", - 1, 1), new Among("ava", - 1, 1), new Among("asse", - 1, 1), new Among("esse", - 1, 1), new Among("isse", - 1, 1), new Among("aste", - 1, 1), new Among("este", - 1, 1), new Among("iste", - 1, 1), new Among("ei", - 1, 1), new Among("arei", 16, 1), new Among("erei", 16, 1), new Among("irei", 16, 1), new Among("am", - 1, 1), new Among("iam", 20, 1), new Among("ariam", 21, 1), new Among("eriam", 21, 1), new Among("iriam", 21, 1), new Among("aram", 20, 1), new Among("eram", 20, 1), new Among("iram", 20, 1), new Among("avam", 20, 1), new Among("em", - 1, 1), new Among("arem", 29, 1), new Among("erem", 29, 1), new Among("irem", 29, 1), new Among("assem", 29, 1), new Among("essem", 29, 1), new Among("issem", 29, 1), new Among("ado", - 1, 1), new Among("ido", - 1, 1), new Among("ando", - 1, 1), new Among("endo", - 1, 1), new Among("indo", - 1, 1), new Among("ara~o", - 1, 1), new Among("era~o", - 1, 1), new Among("ira~o", - 1, 1), new Among("ar", - 1, 1), new Among("er", - 1, 1), new Among("ir", - 1, 1), new Among("as", - 1, 1), new Among("adas", 47, 1), new Among("idas", 47, 1), new Among("ias", 47, 1), new Among("arias", 50, 1), new Among("erias", 50, 1), new Among("irias", 50, 1), new Among("aras", 47, 1), new Among("eras", 47, 1), new Among("iras", 47, 1), new Among("avas", 47, 1), new Among("es", - 1, 1), new Among("ardes", 58, 1), new Among("erdes", 58, 1), new Among("irdes", 58, 1), new Among("ares", 58, 1), new Among("eres", 58, 1), new Among("ires", 58, 1), new Among("asses", 58, 1), new Among("esses", 58, 1), new Among("isses", 58, 1), new Among("astes", 58, 1), new Among("estes", 58, 1), new Among("istes", 58, 1), new Among("is", - 1, 1), new Among("ais", 71, 1), new Among("eis", 71, 1), new Among("areis", 73, 1), new Among("ereis", 73, 1), new Among("ireis", 73, 1), new Among("áreis", 73, 1), new Among("éreis", 73, 1), new Among("íreis", 73, 1), new Among("ásseis", 73, 1), new Among("ésseis", 73, 1), new Among("ísseis", 73, 1), new Among("áveis", 73, 1), new Among("íeis", 73, 1), new Among("aríeis", 84, 1), new Among("eríeis", 84, 1), new Among("iríeis", 84, 1), new Among("ados", - 1, 1), new Among("idos", - 1, 1), new Among("amos", - 1, 1), new Among("áramos", 90, 1), new Among("éramos", 90, 1), new Among("íramos", 90, 1), new Among("ávamos", 90, 1), new Among("íamos", 90, 1), new Among("aríamos", 95, 1), new Among("eríamos", 95, 1), new Among("iríamos", 95, 1), new Among("emos", - 1, 1), new Among("aremos", 99, 1), new Among("eremos", 99, 1), new Among("iremos", 99, 1), new Among("ássemos", 99, 1), new Among("êssemos", 99, 1), new Among("íssemos", 99, 1), new Among("imos", - 1, 1), new Among("armos", - 1, 1), new Among("ermos", - 1, 1), new Among("irmos", - 1, 1), new Among("ámos", - 1, 1), new Among("arás", - 1, 1), new Among("erás", - 1, 1), new Among("irás", - 1, 1), new Among("eu", - 1, 1), new Among("iu", - 1, 1), new Among("ou", - 1, 1), new Among("ará", - 1, 1), new Among("erá", - 1, 1), new Among("irá", - 1, 1)], a_7 = [new Among("a", - 1, 1), new Among("i", - 1, 1), new Among("o", - 1, 1), new Among("os", - 1, 1), new Among("á", - 1, 1), new Among("í", - 1, 1), new Among("ó", - 1, 1)], a_8 = [new Among("e", - 1, 1), new Among("ç", - 1, 2), new Among("é", - 1, 1), new Among("ê", - 1, 1)], g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 19, 12, 2], I_p2, I_p1, I_pV, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_prelude() {
var a_v;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_0,3);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("a~");
continue;
case 2:
sbp.s_f("o~");
continue;
case 3:
if (sbp.c >= sbp.l)
break;
sbp.c++;
continue;
}

}

break;
}

}

function habr2() {
if (sbp.o_g(g_v,97,250))
{
while (! sbp.i_g(g_v,97,250)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

return true;
}

function habr3() {
if (sbp.i_g(g_v,97,250))
{
while (! sbp.o_g(g_v,97,250)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

}

I_pV = sbp.c;
return true;
}

function habr4() {
var v_1 = sbp.c, v_2, v_3;
if (sbp.i_g(g_v,97,250))
{
v_2 = sbp.c;
if (habr2())
{
sbp.c = v_2;
if (habr3())
return;
}
 else
I_pV = sbp.c;
}

sbp.c = v_1;
if (sbp.o_g(g_v,97,250))
{
v_3 = sbp.c;
if (habr2())
{
sbp.c = v_3;
if (! sbp.i_g(g_v,97,250) || sbp.c >= sbp.l)
return;
sbp.c++;
}

I_pV = sbp.c;
}

}

function habr5() {
while (! sbp.i_g(g_v,97,250)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

while (! sbp.o_g(g_v,97,250)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function r_mark_regions() {
var v_1 = sbp.c;
I_pV = sbp.l;
I_p1 = I_pV;
I_p2 = I_pV;
habr4();
sbp.c = v_1;
if (habr5())
{
I_p1 = sbp.c;
if (habr5())
I_p2 = sbp.c;
}

}

function r_postlude() {
var a_v;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_1,3);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("ã");
continue;
case 2:
sbp.s_f("õ");
continue;
case 3:
if (sbp.c >= sbp.l)
break;
sbp.c++;
continue;
}

}

break;
}

}

function r_RV() {
return I_pV <= sbp.c;
}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_standard_suffix() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_5,45);
if (! a_v)
return false;
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (! r_R2())
return false;
sbp.s_d();
break;
case 2:
if (! r_R2())
return false;
sbp.s_f("log");
break;
case 3:
if (! r_R2())
return false;
sbp.s_f("u");
break;
case 4:
if (! r_R2())
return false;
sbp.s_f("ente");
break;
case 5:
if (! r_R1())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,4);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2())
{
sbp.s_d();
if (a_v == 1)
{
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

}

}

}

break;
case 6:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,3);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
if (r_R2())
sbp.s_d();
}

break;
case 7:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,3);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
if (r_R2())
sbp.s_d();
}

break;
case 8:
if (! r_R2())
return false;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

break;
case 9:
if (! r_RV() || ! sbp.e_s_b(1,"e"))
return false;
sbp.s_f("ir");
break;
}

return true;
}

function r_verb_suffix() {
var a_v, v_1;
if (sbp.c >= I_pV)
{
v_1 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,120);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
sbp.s_d();
sbp.lb = v_1;
return true;
}

sbp.lb = v_1;
}

return false;
}

function r_residual_suffix() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,7);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
if (r_RV())
sbp.s_d();
}

}

function habr6(c1, c2) {
if (sbp.e_s_b(1,c1))
{
sbp.b = sbp.c;
var v_1 = sbp.l - sbp.c;
if (sbp.e_s_b(1,c2))
{
sbp.c = sbp.l - v_1;
if (r_RV())
sbp.s_d();
return false;
}

}

return true;
}

function r_residual_form() {
var a_v, v_1, v_2, v_3;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_8,4);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_RV())
{
sbp.s_d();
sbp.k = sbp.c;
v_1 = sbp.l - sbp.c;
if (habr6("u","g"))
habr6("i","c");
}

break;
case 2:
sbp.s_f("c");
break;
}

}

}

function habr1() {
if (! r_standard_suffix())
{
sbp.c = sbp.l;
if (! r_verb_suffix())
{
sbp.c = sbp.l;
r_residual_suffix();
return;
}

}

sbp.c = sbp.l;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"i"))
{
sbp.b = sbp.c;
if (sbp.e_s_b(1,"c"))
{
sbp.c = sbp.l;
if (r_RV())
sbp.s_d();
}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
habr1();
sbp.c = sbp.l;
r_residual_form();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
RomanianStemmer: function () {
var a_0 = [new Among("", - 1, 3), new Among("I", 0, 1), new Among("U", 0, 2)], a_1 = [new Among("ea", - 1, 3), new Among("aţia", - 1, 7), new Among("aua", - 1, 2), new Among("iua", - 1, 4), new Among("aţie", - 1, 7), new Among("ele", - 1, 3), new Among("ile", - 1, 5), new Among("iile", 6, 4), new Among("iei", - 1, 4), new Among("atei", - 1, 6), new Among("ii", - 1, 4), new Among("ului", - 1, 1), new Among("ul", - 1, 1), new Among("elor", - 1, 3), new Among("ilor", - 1, 4), new Among("iilor", 14, 4)], a_2 = [new Among("icala", - 1, 4), new Among("iciva", - 1, 4), new Among("ativa", - 1, 5), new Among("itiva", - 1, 6), new Among("icale", - 1, 4), new Among("aţiune", - 1, 5), new Among("iţiune", - 1, 6), new Among("atoare", - 1, 5), new Among("itoare", - 1, 6), new Among("ătoare", - 1, 5), new Among("icitate", - 1, 4), new Among("abilitate", - 1, 1), new Among("ibilitate", - 1, 2), new Among("ivitate", - 1, 3), new Among("icive", - 1, 4), new Among("ative", - 1, 5), new Among("itive", - 1, 6), new Among("icali", - 1, 4), new Among("atori", - 1, 5), new Among("icatori", 18, 4), new Among("itori", - 1, 6), new Among("ători", - 1, 5), new Among("icitati", - 1, 4), new Among("abilitati", - 1, 1), new Among("ivitati", - 1, 3), new Among("icivi", - 1, 4), new Among("ativi", - 1, 5), new Among("itivi", - 1, 6), new Among("icităi", - 1, 4), new Among("abilităi", - 1, 1), new Among("ivităi", - 1, 3), new Among("icităţi", - 1, 4), new Among("abilităţi", - 1, 1), new Among("ivităţi", - 1, 3), new Among("ical", - 1, 4), new Among("ator", - 1, 5), new Among("icator", 35, 4), new Among("itor", - 1, 6), new Among("ător", - 1, 5), new Among("iciv", - 1, 4), new Among("ativ", - 1, 5), new Among("itiv", - 1, 6), new Among("icală", - 1, 4), new Among("icivă", - 1, 4), new Among("ativă", - 1, 5), new Among("itivă", - 1, 6)], a_3 = [new Among("ica", - 1, 1), new Among("abila", - 1, 1), new Among("ibila", - 1, 1), new Among("oasa", - 1, 1), new Among("ata", - 1, 1), new Among("ita", - 1, 1), new Among("anta", - 1, 1), new Among("ista", - 1, 3), new Among("uta", - 1, 1), new Among("iva", - 1, 1), new Among("ic", - 1, 1), new Among("ice", - 1, 1), new Among("abile", - 1, 1), new Among("ibile", - 1, 1), new Among("isme", - 1, 3), new Among("iune", - 1, 2), new Among("oase", - 1, 1), new Among("ate", - 1, 1), new Among("itate", 17, 1), new Among("ite", - 1, 1), new Among("ante", - 1, 1), new Among("iste", - 1, 3), new Among("ute", - 1, 1), new Among("ive", - 1, 1), new Among("ici", - 1, 1), new Among("abili", - 1, 1), new Among("ibili", - 1, 1), new Among("iuni", - 1, 2), new Among("atori", - 1, 1), new Among("osi", - 1, 1), new Among("ati", - 1, 1), new Among("itati", 30, 1), new Among("iti", - 1, 1), new Among("anti", - 1, 1), new Among("isti", - 1, 3), new Among("uti", - 1, 1), new Among("işti", - 1, 3), new Among("ivi", - 1, 1), new Among("ităi", - 1, 1), new Among("oşi", - 1, 1), new Among("ităţi", - 1, 1), new Among("abil", - 1, 1), new Among("ibil", - 1, 1), new Among("ism", - 1, 3), new Among("ator", - 1, 1), new Among("os", - 1, 1), new Among("at", - 1, 1), new Among("it", - 1, 1), new Among("ant", - 1, 1), new Among("ist", - 1, 3), new Among("ut", - 1, 1), new Among("iv", - 1, 1), new Among("ică", - 1, 1), new Among("abilă", - 1, 1), new Among("ibilă", - 1, 1), new Among("oasă", - 1, 1), new Among("ată", - 1, 1), new Among("ită", - 1, 1), new Among("antă", - 1, 1), new Among("istă", - 1, 3), new Among("ută", - 1, 1), new Among("ivă", - 1, 1)], a_4 = [new Among("ea", - 1, 1), new Among("ia", - 1, 1), new Among("esc", - 1, 1), new Among("ăsc", - 1, 1), new Among("ind", - 1, 1), new Among("ând", - 1, 1), new Among("are", - 1, 1), new Among("ere", - 1, 1), new Among("ire", - 1, 1), new Among("âre", - 1, 1), new Among("se", - 1, 2), new Among("ase", 10, 1), new Among("sese", 10, 2), new Among("ise", 10, 1), new Among("use", 10, 1), new Among("âse", 10, 1), new Among("eşte", - 1, 1), new Among("ăşte", - 1, 1), new Among("eze", - 1, 1), new Among("ai", - 1, 1), new Among("eai", 19, 1), new Among("iai", 19, 1), new Among("sei", - 1, 2), new Among("eşti", - 1, 1), new Among("ăşti", - 1, 1), new Among("ui", - 1, 1), new Among("ezi", - 1, 1), new Among("âi", - 1, 1), new Among("aşi", - 1, 1), new Among("seşi", - 1, 2), new Among("aseşi", 29, 1), new Among("seseşi", 29, 2), new Among("iseşi", 29, 1), new Among("useşi", 29, 1), new Among("âseşi", 29, 1), new Among("işi", - 1, 1), new Among("uşi", - 1, 1), new Among("âşi", - 1, 1), new Among("aţi", - 1, 2), new Among("eaţi", 38, 1), new Among("iaţi", 38, 1), new Among("eţi", - 1, 2), new Among("iţi", - 1, 2), new Among("âţi", - 1, 2), new Among("arăţi", - 1, 1), new Among("serăţi", - 1, 2), new Among("aserăţi", 45, 1), new Among("seserăţi", 45, 2), new Among("iserăţi", 45, 1), new Among("userăţi", 45, 1), new Among("âserăţi", 45, 1), new Among("irăţi", - 1, 1), new Among("urăţi", - 1, 1), new Among("ârăţi", - 1, 1), new Among("am", - 1, 1), new Among("eam", 54, 1), new Among("iam", 54, 1), new Among("em", - 1, 2), new Among("asem", 57, 1), new Among("sesem", 57, 2), new Among("isem", 57, 1), new Among("usem", 57, 1), new Among("âsem", 57, 1), new Among("im", - 1, 2), new Among("âm", - 1, 2), new Among("ăm", - 1, 2), new Among("arăm", 65, 1), new Among("serăm", 65, 2), new Among("aserăm", 67, 1), new Among("seserăm", 67, 2), new Among("iserăm", 67, 1), new Among("userăm", 67, 1), new Among("âserăm", 67, 1), new Among("irăm", 65, 1), new Among("urăm", 65, 1), new Among("ârăm", 65, 1), new Among("au", - 1, 1), new Among("eau", 76, 1), new Among("iau", 76, 1), new Among("indu", - 1, 1), new Among("ându", - 1, 1), new Among("ez", - 1, 1), new Among("ească", - 1, 1), new Among("ară", - 1, 1), new Among("seră", - 1, 2), new Among("aseră", 84, 1), new Among("seseră", 84, 2), new Among("iseră", 84, 1), new Among("useră", 84, 1), new Among("âseră", 84, 1), new Among("iră", - 1, 1), new Among("ură", - 1, 1), new Among("âră", - 1, 1), new Among("ează", - 1, 1)], a_5 = [new Among("a", - 1, 1), new Among("e", - 1, 1), new Among("ie", 1, 1), new Among("i", - 1, 1), new Among("ă", - 1, 1)], g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 32, 0, 0, 4], B_standard_suffix_removed, I_p2, I_p1, I_pV, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr1(c1, c2) {
if (sbp.e_s(1,c1))
{
sbp.k = sbp.c;
if (sbp.i_g(g_v,97,259))
sbp.s_f(c2);
}

}

function r_prelude() {
var v_1, v_2;
while (true) {
v_1 = sbp.c;
if (sbp.i_g(g_v,97,259))
{
v_2 = sbp.c;
sbp.b = v_2;
habr1("u","U");
sbp.c = v_2;
habr1("i","I");
}

sbp.c = v_1;
if (sbp.c >= sbp.l)
{
break;
}

sbp.c++;
}

}

function habr2() {
if (sbp.o_g(g_v,97,259))
{
while (! sbp.i_g(g_v,97,259)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

return true;
}

function habr3() {
if (sbp.i_g(g_v,97,259))
{
while (! sbp.o_g(g_v,97,259)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

}

return false;
}

function habr4() {
var v_1 = sbp.c, v_2, v_3;
if (sbp.i_g(g_v,97,259))
{
v_2 = sbp.c;
if (habr2())
{
sbp.c = v_2;
if (! habr3())
{
I_pV = sbp.c;
return;
}

}
 else
{
I_pV = sbp.c;
return;
}

}

sbp.c = v_1;
if (sbp.o_g(g_v,97,259))
{
v_3 = sbp.c;
if (habr2())
{
sbp.c = v_3;
if (sbp.i_g(g_v,97,259) && sbp.c < sbp.l)
sbp.c++;
}

I_pV = sbp.c;
}

}

function habr5() {
while (! sbp.i_g(g_v,97,259)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

while (! sbp.o_g(g_v,97,259)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function r_mark_regions() {
var v_1 = sbp.c;
I_pV = sbp.l;
I_p1 = I_pV;
I_p2 = I_pV;
habr4();
sbp.c = v_1;
if (habr5())
{
I_p1 = sbp.c;
if (habr5())
I_p2 = sbp.c;
}

}

function r_postlude() {
var a_v;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_0,3);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("i");
continue;
case 2:
sbp.s_f("u");
continue;
case 3:
if (sbp.c >= sbp.l)
break;
sbp.c++;
continue;
}

}

break;
}

}

function r_RV() {
return I_pV <= sbp.c;
}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_step_0() {
var a_v, v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_1,16);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
sbp.s_f("a");
break;
case 3:
sbp.s_f("e");
break;
case 4:
sbp.s_f("i");
break;
case 5:
v_1 = sbp.l - sbp.c;
if (! sbp.e_s_b(2,"ab"))
{
sbp.c = sbp.l - v_1;
sbp.s_f("i");
}

break;
case 6:
sbp.s_f("at");
break;
case 7:
sbp.s_f("aţi");
break;
}

}

}

}

function r_combo_suffix() {
var a_v, v_1 = sbp.l - sbp.c;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,46);
if (a_v)
{
sbp.b = sbp.c;
if (r_R1())
{
switch (a_v) {
case 1:
sbp.s_f("abil");
break;
case 2:
sbp.s_f("ibil");
break;
case 3:
sbp.s_f("iv");
break;
case 4:
sbp.s_f("ic");
break;
case 5:
sbp.s_f("at");
break;
case 6:
sbp.s_f("it");
break;
}

B_standard_suffix_removed = true;
sbp.c = sbp.l - v_1;
return true;
}

}

return false;
}

function r_standard_suffix() {
var a_v, v_1;
B_standard_suffix_removed = false;
while (true) {
v_1 = sbp.l - sbp.c;
if (! r_combo_suffix())
{
sbp.c = sbp.l - v_1;
break;
}

}

sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,62);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2())
{
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
if (sbp.e_s_b(1,"ţ"))
{
sbp.b = sbp.c;
sbp.s_f("t");
}

break;
case 3:
sbp.s_f("ist");
break;
}

B_standard_suffix_removed = true;
}

}

}

function r_verb_suffix() {
var a_v, v_1, v_2;
if (sbp.c >= I_pV)
{
v_1 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_4,94);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
v_2 = sbp.l - sbp.c;
if (! sbp.o_g_b(g_v,97,259))
{
sbp.c = sbp.l - v_2;
if (! sbp.e_s_b(1,"u"))
break;
}

case 2:
sbp.s_d();
break;
}

}

sbp.lb = v_1;
}

}

function r_vowel_suffix() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_5,5);
if (a_v)
{
sbp.b = sbp.c;
if (r_RV() && a_v == 1)
sbp.s_d();
}

}

this.stem = function () {
var v_1 = sbp.c;
r_prelude();
sbp.c = v_1;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_step_0();
sbp.c = sbp.l;
r_standard_suffix();
sbp.c = sbp.l;
if (! B_standard_suffix_removed)
{
sbp.c = sbp.l;
r_verb_suffix();
sbp.c = sbp.l;
}

r_vowel_suffix();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
RussianStemmer: function () {
var a_0 = [new Among("в", - 1, 1), new Among("ив", 0, 2), new Among("ыв", 0, 2), new Among("вши", - 1, 1), new Among("ивши", 3, 2), new Among("ывши", 3, 2), new Among("вшись", - 1, 1), new Among("ившись", 6, 2), new Among("ывшись", 6, 2)], a_1 = [new Among("ее", - 1, 1), new Among("ие", - 1, 1), new Among("ое", - 1, 1), new Among("ые", - 1, 1), new Among("ими", - 1, 1), new Among("ыми", - 1, 1), new Among("ей", - 1, 1), new Among("ий", - 1, 1), new Among("ой", - 1, 1), new Among("ый", - 1, 1), new Among("ем", - 1, 1), new Among("им", - 1, 1), new Among("ом", - 1, 1), new Among("ым", - 1, 1), new Among("его", - 1, 1), new Among("ого", - 1, 1), new Among("ему", - 1, 1), new Among("ому", - 1, 1), new Among("их", - 1, 1), new Among("ых", - 1, 1), new Among("ею", - 1, 1), new Among("ою", - 1, 1), new Among("ую", - 1, 1), new Among("юю", - 1, 1), new Among("ая", - 1, 1), new Among("яя", - 1, 1)], a_2 = [new Among("ем", - 1, 1), new Among("нн", - 1, 1), new Among("вш", - 1, 1), new Among("ивш", 2, 2), new Among("ывш", 2, 2), new Among("щ", - 1, 1), new Among("ющ", 5, 1), new Among("ующ", 6, 2)], a_3 = [new Among("сь", - 1, 1), new Among("ся", - 1, 1)], a_4 = [new Among("ла", - 1, 1), new Among("ила", 0, 2), new Among("ыла", 0, 2), new Among("на", - 1, 1), new Among("ена", 3, 2), new Among("ете", - 1, 1), new Among("ите", - 1, 2), new Among("йте", - 1, 1), new Among("ейте", 7, 2), new Among("уйте", 7, 2), new Among("ли", - 1, 1), new Among("или", 10, 2), new Among("ыли", 10, 2), new Among("й", - 1, 1), new Among("ей", 13, 2), new Among("уй", 13, 2), new Among("л", - 1, 1), new Among("ил", 16, 2), new Among("ыл", 16, 2), new Among("ем", - 1, 1), new Among("им", - 1, 2), new Among("ым", - 1, 2), new Among("н", - 1, 1), new Among("ен", 22, 2), new Among("ло", - 1, 1), new Among("ило", 24, 2), new Among("ыло", 24, 2), new Among("но", - 1, 1), new Among("ено", 27, 2), new Among("нно", 27, 1), new Among("ет", - 1, 1), new Among("ует", 30, 2), new Among("ит", - 1, 2), new Among("ыт", - 1, 2), new Among("ют", - 1, 1), new Among("уют", 34, 2), new Among("ят", - 1, 2), new Among("ны", - 1, 1), new Among("ены", 37, 2), new Among("ть", - 1, 1), new Among("ить", 39, 2), new Among("ыть", 39, 2), new Among("ешь", - 1, 1), new Among("ишь", - 1, 2), new Among("ю", - 1, 2), new Among("ую", 44, 2)], a_5 = [new Among("а", - 1, 1), new Among("ев", - 1, 1), new Among("ов", - 1, 1), new Among("е", - 1, 1), new Among("ие", 3, 1), new Among("ье", 3, 1), new Among("и", - 1, 1), new Among("еи", 6, 1), new Among("ии", 6, 1), new Among("ами", 6, 1), new Among("ями", 6, 1), new Among("иями", 10, 1), new Among("й", - 1, 1), new Among("ей", 12, 1), new Among("ией", 13, 1), new Among("ий", 12, 1), new Among("ой", 12, 1), new Among("ам", - 1, 1), new Among("ем", - 1, 1), new Among("ием", 18, 1), new Among("ом", - 1, 1), new Among("ям", - 1, 1), new Among("иям", 21, 1), new Among("о", - 1, 1), new Among("у", - 1, 1), new Among("ах", - 1, 1), new Among("ях", - 1, 1), new Among("иях", 26, 1), new Among("ы", - 1, 1), new Among("ь", - 1, 1), new Among("ю", - 1, 1), new Among("ию", 30, 1), new Among("ью", 30, 1), new Among("я", - 1, 1), new Among("ия", 33, 1), new Among("ья", 33, 1)], a_6 = [new Among("ост", - 1, 1), new Among("ость", - 1, 1)], a_7 = [new Among("ейше", - 1, 1), new Among("н", - 1, 2), new Among("ейш", - 1, 1), new Among("ь", - 1, 3)], g_v = [33, 65, 8, 232], I_p2, I_pV, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr3() {
while (! sbp.i_g(g_v,1072,1103)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function habr4() {
while (! sbp.o_g(g_v,1072,1103)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function r_mark_regions() {
I_pV = sbp.l;
I_p2 = I_pV;
if (habr3())
{
I_pV = sbp.c;
if (habr4())
if (habr3())
if (habr4())
I_p2 = sbp.c;
}

}

function r_R2() {
return I_p2 <= sbp.c;
}

function habr2(a, n) {
var a_v, v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a,n);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
v_1 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"а"))
{
sbp.c = sbp.l - v_1;
if (! sbp.e_s_b(1,"я"))
return false;
}

case 2:
sbp.s_d();
break;
}

return true;
}

return false;
}

function r_perfective_gerund() {
return habr2(a_0,9);
}

function habr1(a, n) {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a,n);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
sbp.s_d();
return true;
}

return false;
}

function r_adjective() {
return habr1(a_1,26);
}

function r_adjectival() {
var a_v;
if (r_adjective())
{
habr2(a_2,8);
return true;
}

return false;
}

function r_reflexive() {
return habr1(a_3,2);
}

function r_verb() {
return habr2(a_4,46);
}

function r_noun() {
habr1(a_5,36);
}

function r_derivational() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,2);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2() && a_v == 1)
sbp.s_d();
}

}

function r_tidy_up() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,4);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_d();
sbp.k = sbp.c;
if (! sbp.e_s_b(1,"н"))
break;
sbp.b = sbp.c;
case 2:
if (! sbp.e_s_b(1,"н"))
break;
case 3:
sbp.s_d();
break;
}

}

}

this.stem = function () {
r_mark_regions();
sbp.c = sbp.l;
if (sbp.c < I_pV)
return false;
sbp.lb = I_pV;
if (! r_perfective_gerund())
{
sbp.c = sbp.l;
if (! r_reflexive())
sbp.c = sbp.l;
if (! r_adjectival())
{
sbp.c = sbp.l;
if (! r_verb())
{
sbp.c = sbp.l;
r_noun();
}

}

}

sbp.c = sbp.l;
sbp.k = sbp.c;
if (sbp.e_s_b(1,"и"))
{
sbp.b = sbp.c;
sbp.s_d();
}
 else
sbp.c = sbp.l;
r_derivational();
sbp.c = sbp.l;
r_tidy_up();
return true;
}
;
}
,
SpanishStemmer: function () {
var a_0 = [new Among("", - 1, 6), new Among("á", 0, 1), new Among("é", 0, 2), new Among("í", 0, 3), new Among("ó", 0, 4), new Among("ú", 0, 5)], a_1 = [new Among("la", - 1, - 1), new Among("sela", 0, - 1), new Among("le", - 1, - 1), new Among("me", - 1, - 1), new Among("se", - 1, - 1), new Among("lo", - 1, - 1), new Among("selo", 5, - 1), new Among("las", - 1, - 1), new Among("selas", 7, - 1), new Among("les", - 1, - 1), new Among("los", - 1, - 1), new Among("selos", 10, - 1), new Among("nos", - 1, - 1)], a_2 = [new Among("ando", - 1, 6), new Among("iendo", - 1, 6), new Among("yendo", - 1, 7), new Among("ándo", - 1, 2), new Among("iéndo", - 1, 1), new Among("ar", - 1, 6), new Among("er", - 1, 6), new Among("ir", - 1, 6), new Among("ár", - 1, 3), new Among("ér", - 1, 4), new Among("ír", - 1, 5)], a_3 = [new Among("ic", - 1, - 1), new Among("ad", - 1, - 1), new Among("os", - 1, - 1), new Among("iv", - 1, 1)], a_4 = [new Among("able", - 1, 1), new Among("ible", - 1, 1), new Among("ante", - 1, 1)], a_5 = [new Among("ic", - 1, 1), new Among("abil", - 1, 1), new Among("iv", - 1, 1)], a_6 = [new Among("ica", - 1, 1), new Among("ancia", - 1, 2), new Among("encia", - 1, 5), new Among("adora", - 1, 2), new Among("osa", - 1, 1), new Among("ista", - 1, 1), new Among("iva", - 1, 9), new Among("anza", - 1, 1), new Among("logía", - 1, 3), new Among("idad", - 1, 8), new Among("able", - 1, 1), new Among("ible", - 1, 1), new Among("ante", - 1, 2), new Among("mente", - 1, 7), new Among("amente", 13, 6), new Among("ación", - 1, 2), new Among("ución", - 1, 4), new Among("ico", - 1, 1), new Among("ismo", - 1, 1), new Among("oso", - 1, 1), new Among("amiento", - 1, 1), new Among("imiento", - 1, 1), new Among("ivo", - 1, 9), new Among("ador", - 1, 2), new Among("icas", - 1, 1), new Among("ancias", - 1, 2), new Among("encias", - 1, 5), new Among("adoras", - 1, 2), new Among("osas", - 1, 1), new Among("istas", - 1, 1), new Among("ivas", - 1, 9), new Among("anzas", - 1, 1), new Among("logías", - 1, 3), new Among("idades", - 1, 8), new Among("ables", - 1, 1), new Among("ibles", - 1, 1), new Among("aciones", - 1, 2), new Among("uciones", - 1, 4), new Among("adores", - 1, 2), new Among("antes", - 1, 2), new Among("icos", - 1, 1), new Among("ismos", - 1, 1), new Among("osos", - 1, 1), new Among("amientos", - 1, 1), new Among("imientos", - 1, 1), new Among("ivos", - 1, 9)], a_7 = [new Among("ya", - 1, 1), new Among("ye", - 1, 1), new Among("yan", - 1, 1), new Among("yen", - 1, 1), new Among("yeron", - 1, 1), new Among("yendo", - 1, 1), new Among("yo", - 1, 1), new Among("yas", - 1, 1), new Among("yes", - 1, 1), new Among("yais", - 1, 1), new Among("yamos", - 1, 1), new Among("yó", - 1, 1)], a_8 = [new Among("aba", - 1, 2), new Among("ada", - 1, 2), new Among("ida", - 1, 2), new Among("ara", - 1, 2), new Among("iera", - 1, 2), new Among("ía", - 1, 2), new Among("aría", 5, 2), new Among("ería", 5, 2), new Among("iría", 5, 2), new Among("ad", - 1, 2), new Among("ed", - 1, 2), new Among("id", - 1, 2), new Among("ase", - 1, 2), new Among("iese", - 1, 2), new Among("aste", - 1, 2), new Among("iste", - 1, 2), new Among("an", - 1, 2), new Among("aban", 16, 2), new Among("aran", 16, 2), new Among("ieran", 16, 2), new Among("ían", 16, 2), new Among("arían", 20, 2), new Among("erían", 20, 2), new Among("irían", 20, 2), new Among("en", - 1, 1), new Among("asen", 24, 2), new Among("iesen", 24, 2), new Among("aron", - 1, 2), new Among("ieron", - 1, 2), new Among("arán", - 1, 2), new Among("erán", - 1, 2), new Among("irán", - 1, 2), new Among("ado", - 1, 2), new Among("ido", - 1, 2), new Among("ando", - 1, 2), new Among("iendo", - 1, 2), new Among("ar", - 1, 2), new Among("er", - 1, 2), new Among("ir", - 1, 2), new Among("as", - 1, 2), new Among("abas", 39, 2), new Among("adas", 39, 2), new Among("idas", 39, 2), new Among("aras", 39, 2), new Among("ieras", 39, 2), new Among("ías", 39, 2), new Among("arías", 45, 2), new Among("erías", 45, 2), new Among("irías", 45, 2), new Among("es", - 1, 1), new Among("ases", 49, 2), new Among("ieses", 49, 2), new Among("abais", - 1, 2), new Among("arais", - 1, 2), new Among("ierais", - 1, 2), new Among("íais", - 1, 2), new Among("aríais", 55, 2), new Among("eríais", 55, 2), new Among("iríais", 55, 2), new Among("aseis", - 1, 2), new Among("ieseis", - 1, 2), new Among("asteis", - 1, 2), new Among("isteis", - 1, 2), new Among("áis", - 1, 2), new Among("éis", - 1, 1), new Among("aréis", 64, 2), new Among("eréis", 64, 2), new Among("iréis", 64, 2), new Among("ados", - 1, 2), new Among("idos", - 1, 2), new Among("amos", - 1, 2), new Among("ábamos", 70, 2), new Among("áramos", 70, 2), new Among("iéramos", 70, 2), new Among("íamos", 70, 2), new Among("aríamos", 74, 2), new Among("eríamos", 74, 2), new Among("iríamos", 74, 2), new Among("emos", - 1, 1), new Among("aremos", 78, 2), new Among("eremos", 78, 2), new Among("iremos", 78, 2), new Among("ásemos", 78, 2), new Among("iésemos", 78, 2), new Among("imos", - 1, 2), new Among("arás", - 1, 2), new Among("erás", - 1, 2), new Among("irás", - 1, 2), new Among("ís", - 1, 2), new Among("ará", - 1, 2), new Among("erá", - 1, 2), new Among("irá", - 1, 2), new Among("aré", - 1, 2), new Among("eré", - 1, 2), new Among("iré", - 1, 2), new Among("ió", - 1, 2)], a_9 = [new Among("a", - 1, 1), new Among("e", - 1, 2), new Among("o", - 1, 1), new Among("os", - 1, 1), new Among("á", - 1, 1), new Among("é", - 1, 2), new Among("í", - 1, 1), new Among("ó", - 1, 1)], g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 17, 4, 10], I_p2, I_p1, I_pV, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr1() {
if (sbp.o_g(g_v,97,252))
{
while (! sbp.i_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

return false;
}

return true;
}

function habr2() {
if (sbp.i_g(g_v,97,252))
{
var v_1 = sbp.c;
if (habr1())
{
sbp.c = v_1;
if (! sbp.i_g(g_v,97,252))
return true;
while (! sbp.o_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

}

return false;
}

return true;
}

function habr3() {
var v_1 = sbp.c, v_2;
if (habr2())
{
sbp.c = v_1;
if (! sbp.o_g(g_v,97,252))
return;
v_2 = sbp.c;
if (habr1())
{
sbp.c = v_2;
if (! sbp.i_g(g_v,97,252) || sbp.c >= sbp.l)
return;
sbp.c++;
}

}

I_pV = sbp.c;
}

function habr4() {
while (! sbp.i_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

while (! sbp.o_g(g_v,97,252)) {
if (sbp.c >= sbp.l)
return false;
sbp.c++;
}

return true;
}

function r_mark_regions() {
var v_1 = sbp.c;
I_pV = sbp.l;
I_p1 = I_pV;
I_p2 = I_pV;
habr3();
sbp.c = v_1;
if (habr4())
{
I_p1 = sbp.c;
if (habr4())
I_p2 = sbp.c;
}

}

function r_postlude() {
var a_v;
while (true) {
sbp.b = sbp.c;
a_v = sbp.f_a(a_0,6);
if (a_v)
{
sbp.k = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("a");
continue;
case 2:
sbp.s_f("e");
continue;
case 3:
sbp.s_f("i");
continue;
case 4:
sbp.s_f("o");
continue;
case 5:
sbp.s_f("u");
continue;
case 6:
if (sbp.c >= sbp.l)
break;
sbp.c++;
continue;
}

}

break;
}

}

function r_RV() {
return I_pV <= sbp.c;
}

function r_R1() {
return I_p1 <= sbp.c;
}

function r_R2() {
return I_p2 <= sbp.c;
}

function r_attached_pronoun() {
var a_v;
sbp.k = sbp.c;
if (sbp.f_a_b(a_1,13))
{
sbp.b = sbp.c;
a_v = sbp.f_a_b(a_2,11);
if (a_v && r_RV())
switch (a_v) {
case 1:
sbp.b = sbp.c;
sbp.s_f("iendo");
break;
case 2:
sbp.b = sbp.c;
sbp.s_f("ando");
break;
case 3:
sbp.b = sbp.c;
sbp.s_f("ar");
break;
case 4:
sbp.b = sbp.c;
sbp.s_f("er");
break;
case 5:
sbp.b = sbp.c;
sbp.s_f("ir");
break;
case 6:
sbp.s_d();
break;
case 7:
if (sbp.e_s_b(1,"u"))
sbp.s_d();
break;
}

}

}

function habr5(a, n) {
if (! r_R2())
return true;
sbp.s_d();
sbp.k = sbp.c;
var a_v = sbp.f_a_b(a,n);
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1 && r_R2())
sbp.s_d();
}

return false;
}

function habr6(c1) {
if (! r_R2())
return true;
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(2,c1))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

return false;
}

function r_standard_suffix() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_6,46);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (! r_R2())
return false;
sbp.s_d();
break;
case 2:
if (habr6("ic"))
return false;
break;
case 3:
if (! r_R2())
return false;
sbp.s_f("log");
break;
case 4:
if (! r_R2())
return false;
sbp.s_f("u");
break;
case 5:
if (! r_R2())
return false;
sbp.s_f("ente");
break;
case 6:
if (! r_R1())
return false;
sbp.s_d();
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_3,4);
if (a_v)
{
sbp.b = sbp.c;
if (r_R2())
{
sbp.s_d();
if (a_v == 1)
{
sbp.k = sbp.c;
if (sbp.e_s_b(2,"at"))
{
sbp.b = sbp.c;
if (r_R2())
sbp.s_d();
}

}

}

}

break;
case 7:
if (habr5(a_4,3))
return false;
break;
case 8:
if (habr5(a_5,3))
return false;
break;
case 9:
if (habr6("at"))
return false;
break;
}

return true;
}

return false;
}

function r_y_verb_suffix() {
var a_v, v_1;
if (sbp.c >= I_pV)
{
v_1 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_7,12);
sbp.lb = v_1;
if (a_v)
{
sbp.b = sbp.c;
if (a_v == 1)
{
if (! sbp.e_s_b(1,"u"))
return false;
sbp.s_d();
}

return true;
}

}

return false;
}

function r_verb_suffix() {
var a_v, v_1, v_2, v_3;
if (sbp.c >= I_pV)
{
v_1 = sbp.lb;
sbp.lb = I_pV;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_8,96);
sbp.lb = v_1;
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
v_2 = sbp.l - sbp.c;
if (sbp.e_s_b(1,"u"))
{
v_3 = sbp.l - sbp.c;
if (sbp.e_s_b(1,"g"))
sbp.c = sbp.l - v_3; else
sbp.c = sbp.l - v_2;
}
 else
sbp.c = sbp.l - v_2;
sbp.b = sbp.c;
case 2:
sbp.s_d();
break;
}

}

}

}

function r_residual_suffix() {
var a_v, v_1;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_9,8);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
if (r_RV())
sbp.s_d();
break;
case 2:
if (r_RV())
{
sbp.s_d();
sbp.k = sbp.c;
if (sbp.e_s_b(1,"u"))
{
sbp.b = sbp.c;
v_1 = sbp.l - sbp.c;
if (sbp.e_s_b(1,"g"))
{
sbp.c = sbp.l - v_1;
if (r_RV())
sbp.s_d();
}

}

}

break;
}

}

}

this.stem = function () {
var v_1 = sbp.c;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_attached_pronoun();
sbp.c = sbp.l;
if (! r_standard_suffix())
{
sbp.c = sbp.l;
if (! r_y_verb_suffix())
{
sbp.c = sbp.l;
r_verb_suffix();
}

}

sbp.c = sbp.l;
r_residual_suffix();
sbp.c = sbp.lb;
r_postlude();
return true;
}
;
}
,
SwedishStemmer: function () {
var a_0 = [new Among("a", - 1, 1), new Among("arna", 0, 1), new Among("erna", 0, 1), new Among("heterna", 2, 1), new Among("orna", 0, 1), new Among("ad", - 1, 1), new Among("e", - 1, 1), new Among("ade", 6, 1), new Among("ande", 6, 1), new Among("arne", 6, 1), new Among("are", 6, 1), new Among("aste", 6, 1), new Among("en", - 1, 1), new Among("anden", 12, 1), new Among("aren", 12, 1), new Among("heten", 12, 1), new Among("ern", - 1, 1), new Among("ar", - 1, 1), new Among("er", - 1, 1), new Among("heter", 18, 1), new Among("or", - 1, 1), new Among("s", - 1, 2), new Among("as", 21, 1), new Among("arnas", 22, 1), new Among("ernas", 22, 1), new Among("ornas", 22, 1), new Among("es", 21, 1), new Among("ades", 26, 1), new Among("andes", 26, 1), new Among("ens", 21, 1), new Among("arens", 29, 1), new Among("hetens", 29, 1), new Among("erns", 21, 1), new Among("at", - 1, 1), new Among("andet", - 1, 1), new Among("het", - 1, 1), new Among("ast", - 1, 1)], a_1 = [new Among("dd", - 1, - 1), new Among("gd", - 1, - 1), new Among("nn", - 1, - 1), new Among("dt", - 1, - 1), new Among("gt", - 1, - 1), new Among("kt", - 1, - 1), new Among("tt", - 1, - 1)], a_2 = [new Among("ig", - 1, 1), new Among("lig", 0, 1), new Among("els", - 1, 1), new Among("fullt", - 1, 3), new Among("löst", - 1, 2)], g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 32], g_s_ending = [119, 127, 149], I_x, I_p1, sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function r_mark_regions() {
var v_1, c = sbp.c + 3;
I_p1 = sbp.l;
if (0 <= c || c <= sbp.l)
{
I_x = c;
while (true) {
v_1 = sbp.c;
if (sbp.i_g(g_v,97,246))
{
sbp.c = v_1;
break;
}

sbp.c = v_1;
if (sbp.c >= sbp.l)
return;
sbp.c++;
}

while (! sbp.o_g(g_v,97,246)) {
if (sbp.c >= sbp.l)
return;
sbp.c++;
}

I_p1 = sbp.c;
if (I_p1 < I_x)
I_p1 = I_x;
}

}

function r_main_suffix() {
var a_v, v_2 = sbp.lb;
if (sbp.c >= I_p1)
{
sbp.lb = I_p1;
sbp.c = sbp.l;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_0,37);
sbp.lb = v_2;
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
if (sbp.i_g_b(g_s_ending,98,121))
sbp.s_d();
break;
}

}

}

}

function r_consonant_pair() {
var v_1 = sbp.lb;
if (sbp.c >= I_p1)
{
sbp.lb = I_p1;
sbp.c = sbp.l;
if (sbp.f_a_b(a_1,7))
{
sbp.c = sbp.l;
sbp.k = sbp.c;
if (sbp.c > sbp.lb)
{
sbp.b = --sbp.c;
sbp.s_d();
}

}

sbp.lb = v_1;
}

}

function r_other_suffix() {
var a_v, v_2;
if (sbp.c >= I_p1)
{
v_2 = sbp.lb;
sbp.lb = I_p1;
sbp.c = sbp.l;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_2,5);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_d();
break;
case 2:
sbp.s_f("lös");
break;
case 3:
sbp.s_f("full");
break;
}

}

sbp.lb = v_2;
}

}

this.stem = function () {
var v_1 = sbp.c;
r_mark_regions();
sbp.lb = v_1;
sbp.c = sbp.l;
r_main_suffix();
sbp.c = sbp.l;
r_consonant_pair();
sbp.c = sbp.l;
r_other_suffix();
return true;
}
;
}
,
TurkishStemmer: function () {
var a_0 = [new Among("m", - 1, - 1), new Among("n", - 1, - 1), new Among("miz", - 1, - 1), new Among("niz", - 1, - 1), new Among("muz", - 1, - 1), new Among("nuz", - 1, - 1), new Among("müz", - 1, - 1), new Among("nüz", - 1, - 1), new Among("mız", - 1, - 1), new Among("nız", - 1, - 1)], a_1 = [new Among("leri", - 1, - 1), new Among("ları", - 1, - 1)], a_2 = [new Among("ni", - 1, - 1), new Among("nu", - 1, - 1), new Among("nü", - 1, - 1), new Among("nı", - 1, - 1)], a_3 = [new Among("in", - 1, - 1), new Among("un", - 1, - 1), new Among("ün", - 1, - 1), new Among("ın", - 1, - 1)], a_4 = [new Among("a", - 1, - 1), new Among("e", - 1, - 1)], a_5 = [new Among("na", - 1, - 1), new Among("ne", - 1, - 1)], a_6 = [new Among("da", - 1, - 1), new Among("ta", - 1, - 1), new Among("de", - 1, - 1), new Among("te", - 1, - 1)], a_7 = [new Among("nda", - 1, - 1), new Among("nde", - 1, - 1)], a_8 = [new Among("dan", - 1, - 1), new Among("tan", - 1, - 1), new Among("den", - 1, - 1), new Among("ten", - 1, - 1)], a_9 = [new Among("ndan", - 1, - 1), new Among("nden", - 1, - 1)], a_10 = [new Among("la", - 1, - 1), new Among("le", - 1, - 1)], a_11 = [new Among("ca", - 1, - 1), new Among("ce", - 1, - 1)], a_12 = [new Among("im", - 1, - 1), new Among("um", - 1, - 1), new Among("üm", - 1, - 1), new Among("ım", - 1, - 1)], a_13 = [new Among("sin", - 1, - 1), new Among("sun", - 1, - 1), new Among("sün", - 1, - 1), new Among("sın", - 1, - 1)], a_14 = [new Among("iz", - 1, - 1), new Among("uz", - 1, - 1), new Among("üz", - 1, - 1), new Among("ız", - 1, - 1)], a_15 = [new Among("siniz", - 1, - 1), new Among("sunuz", - 1, - 1), new Among("sünüz", - 1, - 1), new Among("sınız", - 1, - 1)], a_16 = [new Among("lar", - 1, - 1), new Among("ler", - 1, - 1)], a_17 = [new Among("niz", - 1, - 1), new Among("nuz", - 1, - 1), new Among("nüz", - 1, - 1), new Among("nız", - 1, - 1)], a_18 = [new Among("dir", - 1, - 1), new Among("tir", - 1, - 1), new Among("dur", - 1, - 1), new Among("tur", - 1, - 1), new Among("dür", - 1, - 1), new Among("tür", - 1, - 1), new Among("dır", - 1, - 1), new Among("tır", - 1, - 1)], a_19 = [new Among("casına", - 1, - 1), new Among("cesine", - 1, - 1)], a_20 = [new Among("di", - 1, - 1), new Among("ti", - 1, - 1), new Among("dik", - 1, - 1), new Among("tik", - 1, - 1), new Among("duk", - 1, - 1), new Among("tuk", - 1, - 1), new Among("dük", - 1, - 1), new Among("tük", - 1, - 1), new Among("dık", - 1, - 1), new Among("tık", - 1, - 1), new Among("dim", - 1, - 1), new Among("tim", - 1, - 1), new Among("dum", - 1, - 1), new Among("tum", - 1, - 1), new Among("düm", - 1, - 1), new Among("tüm", - 1, - 1), new Among("dım", - 1, - 1), new Among("tım", - 1, - 1), new Among("din", - 1, - 1), new Among("tin", - 1, - 1), new Among("dun", - 1, - 1), new Among("tun", - 1, - 1), new Among("dün", - 1, - 1), new Among("tün", - 1, - 1), new Among("dın", - 1, - 1), new Among("tın", - 1, - 1), new Among("du", - 1, - 1), new Among("tu", - 1, - 1), new Among("dü", - 1, - 1), new Among("tü", - 1, - 1), new Among("dı", - 1, - 1), new Among("tı", - 1, - 1)], a_21 = [new Among("sa", - 1, - 1), new Among("se", - 1, - 1), new Among("sak", - 1, - 1), new Among("sek", - 1, - 1), new Among("sam", - 1, - 1), new Among("sem", - 1, - 1), new Among("san", - 1, - 1), new Among("sen", - 1, - 1)], a_22 = [new Among("miş", - 1, - 1), new Among("muş", - 1, - 1), new Among("müş", - 1, - 1), new Among("mış", - 1, - 1)], a_23 = [new Among("b", - 1, 1), new Among("c", - 1, 2), new Among("d", - 1, 3), new Among("ğ", - 1, 4)], g_vowel = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 8, 0, 0, 0, 0, 0, 0, 1], g_U = [1, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1], g_vowel1 = [1, 64, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], g_vowel2 = [17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 130], g_vowel3 = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], g_vowel4 = [17], g_vowel5 = [65], g_vowel6 = [65], B_c_s_n_s, I_strlen, g_habr = [["a", g_vowel1, 97, 305], ["e", g_vowel2, 101, 252], ["ı", g_vowel3, 97, 305], ["i", g_vowel4, 101, 105], ["o", g_vowel5, 111, 117], ["ö", g_vowel6, 246, 252], ["u", g_vowel5, 111, 117]], sbp = new SnowballProgram();
this.setCurrent = function (word) {
sbp.s_c(word);
}
;
this.getCurrent = function () {
return sbp.g_c();
}
;
function habr1(g_v, n1, n2) {
while (true) {
var v_1 = sbp.l - sbp.c;
if (sbp.i_g_b(g_v,n1,n2))
{
sbp.c = sbp.l - v_1;
break;
}

sbp.c = sbp.l - v_1;
if (sbp.c <= sbp.lb)
return false;
sbp.c--;
}

return true;
}

function r_check_vowel_harmony() {
var v_1, v_2;
v_1 = sbp.l - sbp.c;
habr1(g_vowel,97,305);
for (var i = 0;i < g_habr.length;i++) {
v_2 = sbp.l - sbp.c;
var habr = g_habr[i];
if (sbp.e_s_b(1,habr[0]) && habr1(habr[1],habr[2],habr[3]))
{
sbp.c = sbp.l - v_1;
return true;
}

sbp.c = sbp.l - v_2;
}

sbp.c = sbp.l - v_2;
if (! sbp.e_s_b(1,"ü") || ! habr1(g_vowel6,246,252))
return false;
sbp.c = sbp.l - v_1;
return true;
}

function habr2(f1, f2) {
var v_1 = sbp.l - sbp.c, v_2;
if (f1())
{
sbp.c = sbp.l - v_1;
if (sbp.c > sbp.lb)
{
sbp.c--;
v_2 = sbp.l - sbp.c;
if (f2())
{
sbp.c = sbp.l - v_2;
return true;
}

}

}

sbp.c = sbp.l - v_1;
if (f1())
{
sbp.c = sbp.l - v_1;
return false;
}

sbp.c = sbp.l - v_1;
if (sbp.c <= sbp.lb)
return false;
sbp.c--;
if (! f2())
return false;
sbp.c = sbp.l - v_1;
return true;
}

function habr3(f1) {
return habr2(f1,function () {
return sbp.i_g_b(g_vowel,97,305);
}
);
}

function r_mark_suffix_with_optional_n_consonant() {
return habr3(function () {
return sbp.e_s_b(1,"n");
}
);
}

function r_mark_suffix_with_optional_s_consonant() {
return habr3(function () {
return sbp.e_s_b(1,"s");
}
);
}

function r_mark_suffix_with_optional_y_consonant() {
return habr3(function () {
return sbp.e_s_b(1,"y");
}
);
}

function r_mark_suffix_with_optional_U_vowel() {
return habr2(function () {
return sbp.i_g_b(g_U,105,305);
}
,function () {
return sbp.o_g_b(g_vowel,97,305);
}
);
}

function r_mark_possessives() {
return sbp.f_a_b(a_0,10) && r_mark_suffix_with_optional_U_vowel();
}

function r_mark_sU() {
return r_check_vowel_harmony() && sbp.i_g_b(g_U,105,305) && r_mark_suffix_with_optional_s_consonant();
}

function r_mark_lArI() {
return sbp.f_a_b(a_1,2);
}

function r_mark_yU() {
return r_check_vowel_harmony() && sbp.i_g_b(g_U,105,305) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_nU() {
return r_check_vowel_harmony() && sbp.f_a_b(a_2,4);
}

function r_mark_nUn() {
return r_check_vowel_harmony() && sbp.f_a_b(a_3,4) && r_mark_suffix_with_optional_n_consonant();
}

function r_mark_yA() {
return r_check_vowel_harmony() && sbp.f_a_b(a_4,2) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_nA() {
return r_check_vowel_harmony() && sbp.f_a_b(a_5,2);
}

function r_mark_DA() {
return r_check_vowel_harmony() && sbp.f_a_b(a_6,4);
}

function r_mark_ndA() {
return r_check_vowel_harmony() && sbp.f_a_b(a_7,2);
}

function r_mark_DAn() {
return r_check_vowel_harmony() && sbp.f_a_b(a_8,4);
}

function r_mark_ndAn() {
return r_check_vowel_harmony() && sbp.f_a_b(a_9,2);
}

function r_mark_ylA() {
return r_check_vowel_harmony() && sbp.f_a_b(a_10,2) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_ki() {
return sbp.e_s_b(2,"ki");
}

function r_mark_ncA() {
return r_check_vowel_harmony() && sbp.f_a_b(a_11,2) && r_mark_suffix_with_optional_n_consonant();
}

function r_mark_yUm() {
return r_check_vowel_harmony() && sbp.f_a_b(a_12,4) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_sUn() {
return r_check_vowel_harmony() && sbp.f_a_b(a_13,4);
}

function r_mark_yUz() {
return r_check_vowel_harmony() && sbp.f_a_b(a_14,4) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_sUnUz() {
return sbp.f_a_b(a_15,4);
}

function r_mark_lAr() {
return r_check_vowel_harmony() && sbp.f_a_b(a_16,2);
}

function r_mark_nUz() {
return r_check_vowel_harmony() && sbp.f_a_b(a_17,4);
}

function r_mark_DUr() {
return r_check_vowel_harmony() && sbp.f_a_b(a_18,8);
}

function r_mark_cAsInA() {
return sbp.f_a_b(a_19,2);
}

function r_mark_yDU() {
return r_check_vowel_harmony() && sbp.f_a_b(a_20,32) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_ysA() {
return sbp.f_a_b(a_21,8) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_ymUs_() {
return r_check_vowel_harmony() && sbp.f_a_b(a_22,4) && r_mark_suffix_with_optional_y_consonant();
}

function r_mark_yken() {
return sbp.e_s_b(3,"ken") && r_mark_suffix_with_optional_y_consonant();
}

function habr4() {
var v_1 = sbp.l - sbp.c;
if (! r_mark_ymUs_())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yDU())
{
sbp.c = sbp.l - v_1;
if (! r_mark_ysA())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yken())
return true;
}

}

}

return false;
}

function habr5() {
if (r_mark_cAsInA())
{
var v_1 = sbp.l - sbp.c;
if (! r_mark_sUnUz())
{
sbp.c = sbp.l - v_1;
if (! r_mark_lAr())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yUm())
{
sbp.c = sbp.l - v_1;
if (! r_mark_sUn())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yUz())
sbp.c = sbp.l - v_1;
}

}

}

}

if (r_mark_ymUs_())
return false;
}

return true;
}

function habr6() {
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
var v_1 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (! r_mark_DUr())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yDU())
{
sbp.c = sbp.l - v_1;
if (! r_mark_ysA())
{
sbp.c = sbp.l - v_1;
if (! r_mark_ymUs_())
sbp.c = sbp.l - v_1;
}

}

}

B_c_s_n_s = false;
return false;
}

return true;
}

function habr7() {
if (! r_mark_nUz())
return true;
var v_1 = sbp.l - sbp.c;
if (! r_mark_yDU())
{
sbp.c = sbp.l - v_1;
if (! r_mark_ysA())
return true;
}

return false;
}

function habr8() {
var v_1 = sbp.l - sbp.c, v_2;
if (! r_mark_sUnUz())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yUz())
{
sbp.c = sbp.l - v_1;
if (! r_mark_sUn())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yUm())
return true;
}

}

}

sbp.b = sbp.c;
sbp.s_d();
v_2 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (! r_mark_ymUs_())
sbp.c = sbp.l - v_2;
return false;
}

function r_stem_nominal_verb_suffixes() {
var v_1 = sbp.l - sbp.c, v_2;
sbp.k = sbp.c;
B_c_s_n_s = true;
if (habr4())
{
sbp.c = sbp.l - v_1;
if (habr5())
{
sbp.c = sbp.l - v_1;
if (habr6())
{
sbp.c = sbp.l - v_1;
if (habr7())
{
sbp.c = sbp.l - v_1;
if (habr8())
{
sbp.c = sbp.l - v_1;
if (! r_mark_DUr())
return;
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
v_2 = sbp.l - sbp.c;
if (! r_mark_sUnUz())
{
sbp.c = sbp.l - v_2;
if (! r_mark_lAr())
{
sbp.c = sbp.l - v_2;
if (! r_mark_yUm())
{
sbp.c = sbp.l - v_2;
if (! r_mark_sUn())
{
sbp.c = sbp.l - v_2;
if (! r_mark_yUz())
sbp.c = sbp.l - v_2;
}

}

}

}

if (! r_mark_ymUs_())
sbp.c = sbp.l - v_2;
}

}

}

}

}

sbp.b = sbp.c;
sbp.s_d();
}

function r_stem_suffix_chain_before_ki() {
var v_1, v_2, v_3, v_4;
sbp.k = sbp.c;
if (r_mark_ki())
{
v_1 = sbp.l - sbp.c;
if (r_mark_DA())
{
sbp.b = sbp.c;
sbp.s_d();
v_2 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}
 else
{
sbp.c = sbp.l - v_2;
if (r_mark_possessives())
{
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}

}

return true;
}

sbp.c = sbp.l - v_1;
if (r_mark_nUn())
{
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
v_3 = sbp.l - sbp.c;
if (r_mark_lArI())
{
sbp.b = sbp.c;
sbp.s_d();
}
 else
{
sbp.c = sbp.l - v_3;
sbp.k = sbp.c;
if (! r_mark_possessives())
{
sbp.c = sbp.l - v_3;
if (! r_mark_sU())
{
sbp.c = sbp.l - v_3;
if (! r_stem_suffix_chain_before_ki())
return true;
}

}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}

return true;
}

sbp.c = sbp.l - v_1;
if (r_mark_ndA())
{
v_4 = sbp.l - sbp.c;
if (r_mark_lArI())
{
sbp.b = sbp.c;
sbp.s_d();
}
 else
{
sbp.c = sbp.l - v_4;
if (r_mark_sU())
{
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}
 else
{
sbp.c = sbp.l - v_4;
if (! r_stem_suffix_chain_before_ki())
return false;
}

}

return true;
}

}

return false;
}

function habr9(v_1) {
sbp.k = sbp.c;
if (! r_mark_ndA())
{
sbp.c = sbp.l - v_1;
if (! r_mark_nA())
return false;
}

var v_2 = sbp.l - sbp.c;
if (r_mark_lArI())
{
sbp.b = sbp.c;
sbp.s_d();
}
 else
{
sbp.c = sbp.l - v_2;
if (r_mark_sU())
{
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}
 else
{
sbp.c = sbp.l - v_2;
if (! r_stem_suffix_chain_before_ki())
return false;
}

}

return true;
}

function habr10(v_1) {
sbp.k = sbp.c;
if (! r_mark_ndAn())
{
sbp.c = sbp.l - v_1;
if (! r_mark_nU())
return false;
}

var v_2 = sbp.l - sbp.c;
if (! r_mark_sU())
{
sbp.c = sbp.l - v_2;
if (! r_mark_lArI())
return false;
}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

return true;
}

function habr11() {
var v_1 = sbp.l - sbp.c, v_2;
sbp.k = sbp.c;
if (! r_mark_nUn())
{
sbp.c = sbp.l - v_1;
if (! r_mark_ylA())
return false;
}

sbp.b = sbp.c;
sbp.s_d();
v_2 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
if (r_stem_suffix_chain_before_ki())
return true;
}

sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (! r_mark_possessives())
{
sbp.c = sbp.l - v_2;
if (! r_mark_sU())
{
sbp.c = sbp.l - v_2;
if (! r_stem_suffix_chain_before_ki())
return true;
}

}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

return true;
}

function habr12() {
var v_1 = sbp.l - sbp.c, v_2, v_3;
sbp.k = sbp.c;
if (! r_mark_DA())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yU())
{
sbp.c = sbp.l - v_1;
if (! r_mark_yA())
return false;
}

}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
v_2 = sbp.l - sbp.c;
if (r_mark_possessives())
{
sbp.b = sbp.c;
sbp.s_d();
v_3 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (! r_mark_lAr())
sbp.c = sbp.l - v_3;
}
 else
{
sbp.c = sbp.l - v_2;
if (! r_mark_lAr())
return true;
}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
r_stem_suffix_chain_before_ki();
return true;
}

function r_stem_noun_suffixes() {
var v_1 = sbp.l - sbp.c, v_2, v_3;
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
return;
}

sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
if (r_mark_ncA())
{
sbp.b = sbp.c;
sbp.s_d();
v_2 = sbp.l - sbp.c;
sbp.k = sbp.c;
if (r_mark_lArI())
{
sbp.b = sbp.c;
sbp.s_d();
}
 else
{
sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (! r_mark_possessives())
{
sbp.c = sbp.l - v_2;
if (! r_mark_sU())
{
sbp.c = sbp.l - v_2;
sbp.k = sbp.c;
if (! r_mark_lAr())
return;
sbp.b = sbp.c;
sbp.s_d();
if (! r_stem_suffix_chain_before_ki())
return;
}

}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}

return;
}

sbp.c = sbp.l - v_1;
if (habr9(v_1))
return;
sbp.c = sbp.l - v_1;
if (habr10(v_1))
return;
sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
if (r_mark_DAn())
{
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
v_3 = sbp.l - sbp.c;
if (r_mark_possessives())
{
sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}
 else
{
sbp.c = sbp.l - v_3;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}
 else
{
sbp.c = sbp.l - v_3;
r_stem_suffix_chain_before_ki();
}

}

return;
}

sbp.c = sbp.l - v_1;
if (habr11())
return;
sbp.c = sbp.l - v_1;
if (r_mark_lArI())
{
sbp.b = sbp.c;
sbp.s_d();
return;
}

sbp.c = sbp.l - v_1;
if (r_stem_suffix_chain_before_ki())
return;
sbp.c = sbp.l - v_1;
if (habr12())
return;
sbp.c = sbp.l - v_1;
sbp.k = sbp.c;
if (! r_mark_possessives())
{
sbp.c = sbp.l - v_1;
if (! r_mark_sU())
return;
}

sbp.b = sbp.c;
sbp.s_d();
sbp.k = sbp.c;
if (r_mark_lAr())
{
sbp.b = sbp.c;
sbp.s_d();
r_stem_suffix_chain_before_ki();
}

}

function r_post_process_last_consonants() {
var a_v;
sbp.k = sbp.c;
a_v = sbp.f_a_b(a_23,4);
if (a_v)
{
sbp.b = sbp.c;
switch (a_v) {
case 1:
sbp.s_f("p");
break;
case 2:
sbp.s_f("ç");
break;
case 3:
sbp.s_f("t");
break;
case 4:
sbp.s_f("k");
break;
}

}

}

function habr13() {
while (true) {
var v_1 = sbp.l - sbp.c;
if (sbp.i_g_b(g_vowel,97,305))
{
sbp.c = sbp.l - v_1;
break;
}

sbp.c = sbp.l - v_1;
if (sbp.c <= sbp.lb)
return false;
sbp.c--;
}

return true;
}

function habr14(v_1, c1, c2) {
sbp.c = sbp.l - v_1;
if (habr13())
{
var v_2 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,c1))
{
sbp.c = sbp.l - v_2;
if (! sbp.e_s_b(1,c2))
return true;
}

sbp.c = sbp.l - v_1;
var c = sbp.c;
sbp.i_(sbp.c,sbp.c,c2);
sbp.c = c;
return false;
}

return true;
}

function r_append_U_to_stems_ending_with_d_or_g() {
var v_1 = sbp.l - sbp.c;
if (! sbp.e_s_b(1,"d"))
{
sbp.c = sbp.l - v_1;
if (! sbp.e_s_b(1,"g"))
return;
}

if (habr14(v_1,"a","ı"))
if (habr14(v_1,"e","i"))
if (habr14(v_1,"o","u"))
habr14(v_1,"ö","ü");
}

function r_more_than_one_syllable_word() {
var v_1 = sbp.c, v_2 = 2, v_3;
while (true) {
v_3 = sbp.c;
while (! sbp.i_g(g_vowel,97,305)) {
if (sbp.c >= sbp.l)
{
sbp.c = v_3;
if (v_2 > 0)
return false;
sbp.c = v_1;
return true;
}

sbp.c++;
}

v_2--;
}

}

function habr15(v_1, n1, c1) {
while (! sbp.e_s(n1,c1)) {
if (sbp.c >= sbp.l)
return true;
sbp.c++;
}

I_strlen = n1;
if (I_strlen != sbp.l)
return true;
sbp.c = v_1;
return false;
}

function r_is_reserved_word() {
var v_1 = sbp.c;
if (habr15(v_1,2,"ad"))
{
sbp.c = v_1;
if (habr15(v_1,5,"soyad"))
return false;
}

return true;
}

function r_postlude() {
var v_1 = sbp.c;
if (r_is_reserved_word())
return false;
sbp.lb = v_1;
sbp.c = sbp.l;
r_append_U_to_stems_ending_with_d_or_g();
sbp.c = sbp.l;
r_post_process_last_consonants();
return true;
}

this.stem = function () {
if (r_more_than_one_syllable_word())
{
sbp.lb = sbp.c;
sbp.c = sbp.l;
r_stem_nominal_verb_suffixes();
sbp.c = sbp.l;
if (B_c_s_n_s)
{
r_stem_noun_suffixes();
sbp.c = sbp.lb;
if (r_postlude())
return true;
}

}

return false;
}
;
}
};
