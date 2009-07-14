/* ***** BEGIN LICENSE BLOCK *****
 * Green Goo
 * Copyright (C) 2007-2009  NTT Resonant Inc.
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 * ***** END LICENSE BLOCK ***** */


pref("extensions.greengoo.initialStartup",   false);
pref("extensions.greengoo.count.myCount",    0);
pref("extensions.greengoo.count.totalCount", 0);
pref("extensions.greengoo.count.totalCount.last",   "0");
pref("extensions.greengoo.count.totalCount.expire", 10800000); // 3 hours
pref("extensions.greengoo.count.totalCount.uri",    "http://grn000.goo.ne.jp/green/total.txt");
pref("extensions.greengoo.count.target",     "^http://green\\.search\\.goo\\.ne\\.jp/search(_en)?\\?([^&]*&)*MT=[^&]+");
pref("extensions.greengoo.count.level.0",    99);
pref("extensions.greengoo.count.level.1",    999);

pref("extensions.greengoo.style.image.top.width", 696);
