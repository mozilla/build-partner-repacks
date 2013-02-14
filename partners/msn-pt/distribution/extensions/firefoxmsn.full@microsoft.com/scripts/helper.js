/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bing Search for Firefox Helper Functions.
 *
 * The Initial Developer of the Original Code is The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Edward Lee <edilee@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

const HOME_SEARCH = JSON.stringify({
  name: "Bing",
  searchUrl: "http://www.bing.com/search?form=MOZMPB&pc=MOZM&q=_searchTerms_",
  image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAAZCAYAAACM9limAAAC7mlDQ1BJQ0MgUHJvZmlsZQAAeAGFVM9rE0EU%2FjZuqdAiCFprDrJ4kCJJWatoRdQ2%2FRFiawzbH7ZFkGQzSdZuNuvuJrWliOTi0SreRe2hB%2F%2BAHnrwZC9KhVpFKN6rKGKhFy3xzW5MtqXqwM5%2B8943731vdt8ADXLSNPWABOQNx1KiEWlsfEJq%2FIgAjqIJQTQlVdvsTiQGQYNz%2BXvn2HoPgVtWw3v7d7J3rZrStpoHhP1A4Eea2Sqw7xdxClkSAog836Epx3QI3%2BPY8uyPOU55eMG1Dys9xFkifEA1Lc5%2FTbhTzSXTQINIOJT1cVI%2BnNeLlNcdB2luZsbIEL1PkKa7zO6rYqGcTvYOkL2d9H5Os94%2BwiHCCxmtP0a4jZ71jNU%2F4mHhpObEhj0cGDX0%2BGAVtxqp%2BDXCFF8QTSeiVHHZLg3xmK79VvJKgnCQOMpkYYBzWkhP10xu%2BLqHBX0m1xOv4ndWUeF5jxNn3tTd70XaAq8wDh0MGgyaDUhQEEUEYZiwUECGPBoxNLJyPyOrBhuTezJ1JGq7dGJEsUF7Ntw9t1Gk3Tz%2BKCJxlEO1CJL8Qf4qr8lP5Xn5y1yw2Fb3lK2bmrry4DvF5Zm5Gh7X08jjc01efJXUdpNXR5aseXq8muwaP%2BxXlzHmgjWPxHOw%2B%2FEtX5XMlymMFMXjVfPqS4R1WjE3359sfzs94i7PLrXWc62JizdWm5dn%2FWpI%2B%2B6qvJPmVflPXvXx%2FGfNxGPiKTEmdornIYmXxS7xkthLqwviYG3HCJ2VhinSbZH6JNVgYJq89S9dP1t4vUZ%2FDPVRlBnM0lSJ93%2FCKmQ0nbkOb%2FqP28f8F%2BT3iuefKAIvbODImbptU3HvEKFlpW5zrgIXv9F98LZua6N%2BOPwEWDyrFq1SNZ8gvAEcdod6HugpmNOWls05Uocsn5O66cpiUsxQ20NSUtcl12VLFrOZVWLpdtiZ0x1uHKE5QvfEp0plk%2Fqv8RGw%2FbBS%2BfmsUtl%2BThrWgZf6b8C8%2FUXAeIuJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAMIklEQVRYCdVZe3BcVRn%2Fzrn37iOPJmm7SZAiUl6SUFseMkxngCCCgm1e7cYqIPyh5TlYFUUE2cQ%2FENEZQYpa7ExnqpYhS%2FMqpOKoRGCmZcqzTuIASnFsKc2mTdrNY3fvvef4%2B87NJpsm0OA4I5zpzb177jnf4%2Fc9z62INXf5JGwplHdE%2BWJlqrv%2BDdFGUidI0YceQhBpvf%2FnK6PlkdGHhBBfAokjQtO9Rbe83kMUvP%2FQZP8PG%2BwP4gk1BLW2QdnjRmtCa036uFmiZFxSnPyK6HhrcXlo%2Fdiw6xVHrZPHMv7W8Y3n1xTdrt%2BlNiEpoWeA%2FqH5zGI8PTEfWsEa6NafnNYtGZ%2BUCfq2JmgGMFq7wcL%2BpC3aBjytE1icmA1AAraHVxnCIDgF0kDSrIXar4yNeJniYicC9hhqd5EbGTbiJwJA4U2C4u2S57SO%2B%2B%2FPpw18agRAn%2BZjCM38IwTWxWvECWn1XSa1rvOYLcGKs0eg7yQwML8m4Ug7ELQ9nuMN1V%2F4bbEfKSuzwiJMGUyEXOFrmhCWn9bt8dE8YdGStALBAQkULtH6CdomdlOWVmBXuviz9DxdoN18KPF6uBzAIL7olJZkdIKiC22VC1MOHEKWcD3LtUK5Yd2eAJ9gTPOZ9lZj%2FXgSyiYMLV5Z1dBTJcKiKC%2Bz1ORnJ6LDujdxjJAiKluSJcqzL5JKXqwFfRq2CymhHhdKngn5NdC1RawJOQaAIMcc9t3c8uoopQa98FdI6DpkmRXYWCOdkhAzZCOrXBoQiTcA%2BOsg%2BGfXznUfaY8fNe9Z4fa4f8cdO8OP7CleSrtPT9Piw8W0PDWi%2F3TFIWNVeCB7mLjwMadySdUqZYkrSenzQXq5cEoiTIe9TOfS8Faxl%2Flokn9QGaf3cO%2FVx8zrtjbkwIQSk3eeq67fcZqy%2FHXYcxlkP1%2FYRTESFn4K0u4YyPh%2Fx7JdyA77cV9L0qmB3kTSAjtJfuZYvSX0uK%2FFaQj2lQwMrGxhtz8CebZAmqukU1yLi1R2BNO5vXi5D8p4AAmUxBlSOrUyUkHKHQXTibfAdWPKzj3KoLCQZ16zc4EbzTxvS%2FszGlx837v2ne0N29i6DEqsuWcdHr4jLOdCGSkn7WUB%2BLGDoPMa6I%2FBH8KQ9mxhR8%2BSoVLIcZTX7MP7hwc7Gx9mHuLyPls%2FW%2BdxSFY2dt8HyneQU7JQ2BFSE0Ps37txDeGCvnQ2OZEaAZ0gL8h4rBdCCQ9AyICn%2FMtTnY19xpuhBwNj8gIIAB84hhVma6URWw8robeVllXs27eljhmZcXL9U0VZ2z0VDvdlyLQBVi4DF7CY6FOudd3QjlUHKpq6ysHtObLDy4yXubmvpjpXP84EKpt7HhJ2%2BJsEwLSXYaS64em%2FBuc9%2BzuaDgdcsA7uLn3rXKXlNzB3I5TCBlZl%2FEkY4VoYIcfgxMpHfi9CpS1AlpUdh1wP2o7c8i5NHMgbysjs6Fqp1A9hjNVauZ6Qjo37Fu2Ln8BxFtuufONAzyoG0oxCYBSHlPa9AUvTuve6Gv6WX8T3vLUL5xbVb6%2BVtv0EmNSCIQAdf42c3CVOJgqM%2FN2YW8YbfS97%2FVBn4%2B8qm7puF6GSRwAiNFSDyKY3Yb6rkOZcfCobOi7VltwqhHUqQgRWH71%2FsKPhHtC7X4RL79a5UfghARRac6ir4Zk8PaYFyWFj%2BOnkqFrTswlOsl4rOIv2U9D1ooOdje%2Fwa%2Fa%2B%2FFqTbDGH1GtJUt57MEs9g8LW4MrDxHkwA%2FPAN8S2uOkx53DPmn7hi0bE1CC7qAwvWEFe6G4gP44dEiuZHUkpkHh5iBuw1ngmW5ZBYdc1lyEfKDLFh98hFw12Nz%2BHBLqBKwTSKITV1y5as3MJ6F%2Bv3XG0YRHspocYFF6fl5t5G65MG%2FrwMzzjW9rPvm3mQ6UxxP4G8xwUhCkA88Aojk2kxEcPdTb%2BE4KGOH65yeOcMHPgNxKf3rTe5XWD3fX%2FAOHfIDyAKzwBie0TazpOBQdO0vgHqeCzsYaeUrz7lLGUQk%2Bp9Qu8mFIxwS4f8CnkhWfOWasPmrzlSfUSBDzEIQjESy2duxK7EYGcHl2SivqYHJWeBfmOlxu0OB9BeWM0Ervg5QAZxVfIk3hbPuz4mQcDwyhZ2ke8C%2F9FnqTUAHLwPEbtAPcDGOoFxDcoQQdNS1yPlkKUrAEGb32yfeFli%2BE6i40iCmaWCqUCI5aaspL5ffwfNJM8BUEZICMXbBUC3NxS4Dc7u0O%2BFKfxujOiEyhFs4fp5ieLAwiebroFgIyQHufVHAWFu9i92N98IWwLtTxqXqZPCnywcOVcz32QF9ZBWBRryUwgsqCMJaxx3HkCu5gUqkDEQoQEa7BIuxo2ntdoAwGA49kC5sMOAEEiJLV6C0L%2FEUn5a8g5zHvDKS3PbP9379VHjJLcFOYHeyU8hn8iL90IL7mYFPolIUFTJM2ywvWYsMHnVbLs8%2FglXP4G3Hro5fUeE%2BeQ4fm5Brsl9bXCigkW9QYkRpgVsnjegAq5%2FeSFo3BybJ2Wj4ELBmCb9wg8hmwPqAfOwPBrDZiF%2Bi76qs8Jp2iJ8HM1GS%2BzEyF7m%2B5OIOxmDg77xa5zK6zzIHuYQNeqssc2ovz3mmg33ff0HlsLdR%2B47NCKPd9qrmrqukXrxl%2BxlYzyQJvq6gBQG3YliPr6YPa%2Fkn42wWkd5bf7NjRJqzmUmCH858eD6IqrmrvhjXkgphn%2Bb54EvNQvOtjRPBhr7ryC3PHNUPQSK1x8EXqePZVN3b1Q5gUp%2FCFIwBY7K0ahzyMPLuMch%2BSbUn5uI%2FqWH72fPHaqo%2BkpgHEX2ZGfIN5IS%2FollFrqkHpAd8Sn%2BgoDClNJMEh1VL7q6YpQyLsLM3cJDiN2Pjd7z2BXQ%2B%2FClmSZTSEf5XOGw%2BAXhpnEH77%2FNyPYB1flnEOQ%2F014d13l6yuu8%2F3sjXDFi1HCrxHSvoZzHsIOMiBdg5%2FKoEE34UyvDo2U3c%2F7uVppHYQZ%2F84PU8JQiR5E95jSUv8MneZChMWduezIOnjDVrTju2Cd%2FcqxU9L1YnBilEnrEsfR62S47JOcxNBHDILg9wHKFiYsRks0RbKccbj65Hnhzs%2B4eLJwumDFCR7zbcZUiHPboDcluB3YyhdXRJU7ukJp6xSErkTnjQD3R1BZqvH%2BTgC2CHNXxSqO7q1cu71BP7vmLY6M46uSzfHFwmjdsAVE%2F%2BJm07diqgHt%2BNlA%2FgfcnfJZQ3poIKQVttBWm7Y7l%2BZW%2FU1s7fRFaOPh7Vfvn8EACVk6RQDBIsvL2MpH8o3gNxBB71HiSPRN8xpB8tU51B3HKmGaKjcWxQknSDjDFcrowAdJVJ13tzf%2FC2T5mjWq13a0Ky%2F7JFnWechL50COJ3FQXqmfuX4syDPT5oLtAtMVKsUtfUjY52jhXSgUnYs8twBcbCx20R6n0R%2FuFb7%2FWk7K%2FuHOxhGWwOSjZAv6HqRFWCDmctdrlyD7i2wo14%2FT32gMJ1p4IzKv8C1X7A0aweluc5YmBROgGVrkW8ulDoUFub6XifTzobJQIW4MjUcCpIKtwWPFUqk3XeAubu48R2q5B%2B4QNccMN%2F29Qx1NPy3U32xgYPIXtbbim0Y7fxKYmjvRM6%2FnfSdaN9d7CGAMM9e7%2BcwZeVuRFfmah9z5NTgfdlSu7dV84flx5gVAZ8hickwAKV5Nluf8Rx8zXzswOxvka35yADQTJgnmaeTvxoPyPyY%2FMs2cC7wrv2Q%2B95n7De%2BpXDP1begEbYbho%2FkrwQePqVD64GUfzbdVzT03o44uR8XhXuM9HCwfYEnNuYg76tq4nvp8%2Bfaw1C%2Btdysbes5Do7gLy2yEkoX8eTv2PXp8KJ0QuY8iJHkl4C4jVnjBzYAClTmHrranKtVV%2F%2B2Z5Xfq86Vf3di9DF3NNpTsMEBB8Ui%2FWJ4NbTY6Tn3zDTT%2B2HoMhzvCWE1%2B9NosnCjKJQByx19Gct%2BstdqNjn4M51ckZPskKNqIjPZ1AFISVMaxXcp140M74gfMOQpHm0In%2BNgCw0rkjy2LGrtrUDLvRdf0RRkpqyB8cMPHNv4QxvnPQr%2BF4o7Tf2YYPaz7JtZtGhpe8Atz4sanlbn%2Bq%2BhjDYwBp6A5q1779FLlu5fiFH8ByuoZ6LxtRBluGt9G5auYewXNxPP4v7N0AOzcoPC7%2FwBfh%2BUgcZXzvgAAAABJRU5ErkJggg%3D%3D",
});
const LANDING_PAGE = "http://pt.msn.com/?pc=MOZM";
const PREF_HOME = "browser.startup.homepage";
const PREF_HOME_RESET = "browser.startup.homepage_reset";
const PREF_KEYWORD = "keyword.URL";
const SEARCH_DOMAIN = "www.bing.com";
const SEARCH_ICON = "data:image/x-icon;base64,AAABAAEAEBAAAAEAGABoAwAAFgAAACgAAAAQAAAAIAAAAAEAGAAAAAAAAAAAABMLAAATCwAAAAAAAAAAAAAVpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8ysf97zf%2B24%2F%2FF6f%2FF6f%2FF6f%2BK0%2F9QvP8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8krP%2BZ2P%2F%2F%2F%2F%2F%2F%2F%2F%2Fw%2Bf%2FF6f%2FF6f%2Fi9P%2F%2F%2F%2F%2F%2F%2F%2F%2FT7v9Bt%2F8Vpv8Vpv8Vpv8Vpv%2FT7v%2F%2F%2F%2F%2Fw%2Bf97zf8Vpv8Vpv8Vpv8Vpv9QvP%2FT7v%2F%2F%2F%2F%2Fw%2Bf9Bt%2F8Vpv8Vpv97zf%2F%2F%2F%2F%2F%2F%2F%2F9QvP8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8krP%2Fi9P%2F%2F%2F%2F%2Fi9P8Vpv8Vpv%2B24%2F%2F%2F%2F%2F%2Fi9P8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv%2BK0%2F%2F%2F%2F%2F%2F%2F%2F%2F8Vpv8Vpv%2FF6f%2F%2F%2F%2F%2F%2F%2F%2F8krP8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv%2Bn3v%2F%2F%2F%2F%2Fw%2Bf8Vpv8Vpv%2FF6f%2F%2F%2F%2F%2F%2F%2F%2F%2Bn3v8krP8Vpv8Vpv8Vpv8Vpv8Vpv9tx%2F%2F%2F%2F%2F%2F%2F%2F%2F%2BZ2P8Vpv8Vpv%2FF6f%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2Fi9P%2BK0%2F9QvP9QvP9tx%2F%2FF6f%2F%2F%2F%2F%2F%2F%2F%2F%2Bn3v8Vpv8Vpv8Vpv%2FF6f%2F%2F%2F%2F%2FT7v%2BZ2P%2Fi9P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2B24%2F9QvP8Vpv8Vpv8Vpv8Vpv%2FF6f%2F%2F%2F%2F%2FF6f8Vpv8Vpv8krP9QvP9QvP9Bt%2F8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv%2FF6f%2F%2F%2F%2F%2FF6f8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv9Bt%2F9QvP9Bt%2F8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8Vpv8AAHBsAABhdAAAbiAAAHJ0AABsaQAAdGkAACBDAABlbgAAUEEAAEVYAAAuQwAAOy4AAEU7AABBVAAAQ00AAC5W";
const SEARCH_HOME_URL = "http://pt.msn.com/?pc=MOZM";
const SEARCH_KEYWORD_URL = "http://www.bing.com/search?form=MOZMLB&pc=MOZM&q=";
const SEARCH_NAME = "Bing";
const SEARCH_POSITION = 0;
const SEARCH_URL = "http://www.bing.com/search?form=MOZMSB&pc=MOZM&q={searchTerms}";

// Look through tabs in the browser to see if any match
function findOpenTab(browser, checkTabAndURI) {
  let foundTab;
  Array.some(browser.tabs, function(tab) {
    // Check if there's an existing page
    try {
      // Use an activate navigation if it's still loading
      let {currentURI, webNavigation, __SS_data} = tab.linkedBrowser;
      let channel = webNavigation.documentChannel;
      if (channel != null)
        currentURI = channel.originalURI

      // Use the session restore entry if it's still restoring
      if (currentURI.spec == "about:blank" && __SS_data != null)
        currentURI = Services.io.newURI(__SS_data.entries[0].url, null, null);

      // Short circuit now that we found it
      if (checkTabAndURI(tab, currentURI)) {
        foundTab = tab;
        return true;
      }
    }
    catch(ex) {}
  });
  return foundTab;
}

#// Get a MSN url with a partner code
#function getMsnBase(path, from) {
#  return "http://msn.com/" + path + "?pc=MOZM&source=" +
#    platform + "-" + from;
#}
