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

const DISTRIBUTION_ID = "msnus";
const LANDING_PAGE = "http://www.msn.com/?pc=MOZM";
const PREF_HOME = "browser.startup.homepage";
const PREF_HOME_RESET = "browser.startup.homepage_reset";
const PREF_KEYWORD = "keyword.URL";
const PREF_ENGINENAME = "browser.search.defaultenginename";
const SEARCH_DOMAIN = "www.bing.com";
const SEARCH_ICON = "data:image/x-icon;base64,AAABAAIAEBAAAAEACADaCwAAJgAAACAgAAABAAgAlAIAAAAMAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIAgAAAJCRaDYAAAAJcEhZcwAACxMAAAsTAQCanBgAAApPaUNDUFBob3Rvc2hvcCBJQ0MgcHJvZmlsZQAAeNqdU2dUU+kWPffe9EJLiICUS29SFQggUkKLgBSRJiohCRBKiCGh2RVRwRFFRQQbyKCIA46OgIwVUSwMigrYB+Qhoo6Do4iKyvvhe6Nr1rz35s3+tdc+56zznbPPB8AIDJZIM1E1gAypQh4R4IPHxMbh5C5AgQokcAAQCLNkIXP9IwEA+H48PCsiwAe+AAF40wsIAMBNm8AwHIf/D+pCmVwBgIQBwHSROEsIgBQAQHqOQqYAQEYBgJ2YJlMAoAQAYMtjYuMAUC0AYCd/5tMAgJ34mXsBAFuUIRUBoJEAIBNliEQAaDsArM9WikUAWDAAFGZLxDkA2C0AMElXZkgAsLcAwM4QC7IACAwAMFGIhSkABHsAYMgjI3gAhJkAFEbyVzzxK64Q5yoAAHiZsjy5JDlFgVsILXEHV1cuHijOSRcrFDZhAmGaQC7CeZkZMoE0D+DzzAAAoJEVEeCD8/14zg6uzs42jrYOXy3qvwb/ImJi4/7lz6twQAAA4XR+0f4sL7MagDsGgG3+oiXuBGheC6B194tmsg9AtQCg6dpX83D4fjw8RaGQudnZ5eTk2ErEQlthyld9/mfCX8BX/Wz5fjz89/XgvuIkgTJdgUcE+ODCzPRMpRzPkgmEYtzmj0f8twv//B3TIsRJYrlYKhTjURJxjkSajPMypSKJQpIpxSXS/2Ti3yz7Az7fNQCwaj4Be5EtqF1jA/ZLJxBYdMDi9wAA8rtvwdQoCAOAaIPhz3f/7z/9R6AlAIBmSZJxAABeRCQuVMqzP8cIAABEoIEqsEEb9MEYLMAGHMEF3MEL/GA2hEIkxMJCEEIKZIAccmAprIJCKIbNsB0qYC/UQB00wFFohpNwDi7CVbgOPXAP+mEInsEovIEJBEHICBNhIdqIAWKKWCOOCBeZhfghwUgEEoskIMmIFFEiS5E1SDFSilQgVUgd8j1yAjmHXEa6kTvIADKC/Ia8RzGUgbJRPdQMtUO5qDcahEaiC9BkdDGajxagm9BytBo9jDah59CraA/ajz5DxzDA6BgHM8RsMC7Gw0KxOCwJk2PLsSKsDKvGGrBWrAO7ifVjz7F3BBKBRcAJNgR3QiBhHkFIWExYTthIqCAcJDQR2gk3CQOEUcInIpOoS7QmuhH5xBhiMjGHWEgsI9YSjxMvEHuIQ8Q3JBKJQzInuZACSbGkVNIS0kbSblIj6SypmzRIGiOTydpka7IHOZQsICvIheSd5MPkM+Qb5CHyWwqdYkBxpPhT4ihSympKGeUQ5TTlBmWYMkFVo5pS3aihVBE1j1pCraG2Uq9Rh6gTNHWaOc2DFklLpa2ildMaaBdo92mv6HS6Ed2VHk6X0FfSy+lH6JfoA/R3DA2GFYPHiGcoGZsYBxhnGXcYr5hMphnTixnHVDA3MeuY55kPmW9VWCq2KnwVkcoKlUqVJpUbKi9Uqaqmqt6qC1XzVctUj6leU32uRlUzU+OpCdSWq1WqnVDrUxtTZ6k7qIeqZ6hvVD+kfln9iQZZw0zDT0OkUaCxX+O8xiALYxmzeCwhaw2rhnWBNcQmsc3ZfHYqu5j9HbuLPaqpoTlDM0ozV7NS85RmPwfjmHH4nHROCecop5fzforeFO8p4ikbpjRMuTFlXGuqlpeWWKtIq1GrR+u9Nq7tp52mvUW7WfuBDkHHSidcJ0dnj84FnedT2VPdpwqnFk09OvWuLqprpRuhu0R3v26n7pievl6Ankxvp955vef6HH0v/VT9bfqn9UcMWAazDCQG2wzOGDzFNXFvPB0vx9vxUUNdw0BDpWGVYZfhhJG50Tyj1UaNRg+MacZc4yTjbcZtxqMmBiYhJktN6k3umlJNuaYppjtMO0zHzczNos3WmTWbPTHXMueb55vXm9+3YFp4Wiy2qLa4ZUmy5FqmWe62vG6FWjlZpVhVWl2zRq2drSXWu627pxGnuU6TTque1mfDsPG2ybaptxmw5dgG2662bbZ9YWdiF2e3xa7D7pO9k326fY39PQcNh9kOqx1aHX5ztHIUOlY63prOnO4/fcX0lukvZ1jPEM/YM+O2E8spxGmdU5vTR2cXZ7lzg/OIi4lLgssulz4umxvG3ci95Ep09XFd4XrS9Z2bs5vC7ajbr+427mnuh9yfzDSfKZ5ZM3PQw8hD4FHl0T8Ln5Uwa9+sfk9DT4FntecjL2MvkVet17C3pXeq92HvFz72PnKf4z7jPDfeMt5ZX8w3wLfIt8tPw2+eX4XfQ38j/2T/ev/RAKeAJQFnA4mBQYFbAvv4enwhv44/Ottl9rLZ7UGMoLlBFUGPgq2C5cGtIWjI7JCtIffnmM6RzmkOhVB+6NbQB2HmYYvDfgwnhYeFV4Y/jnCIWBrRMZc1d9HcQ3PfRPpElkTem2cxTzmvLUo1Kj6qLmo82je6NLo/xi5mWczVWJ1YSWxLHDkuKq42bmy+3/zt84fineIL43sXmC/IXXB5oc7C9IWnFqkuEiw6lkBMiE44lPBBECqoFowl8hN3JY4KecIdwmciL9E20YjYQ1wqHk7ySCpNepLskbw1eSTFM6Us5bmEJ6mQvEwNTN2bOp4WmnYgbTI9Or0xg5KRkHFCqiFNk7Zn6mfmZnbLrGWFsv7Fbou3Lx6VB8lrs5CsBVktCrZCpuhUWijXKgeyZ2VXZr/Nico5lqueK83tzLPK25A3nO+f/+0SwhLhkralhktXLR1Y5r2sajmyPHF52wrjFQUrhlYGrDy4irYqbdVPq+1Xl65+vSZ6TWuBXsHKgsG1AWvrC1UK5YV969zX7V1PWC9Z37Vh+oadGz4ViYquFNsXlxV/2CjceOUbh2/Kv5nclLSpq8S5ZM9m0mbp5t4tnlsOlqqX5pcObg3Z2rQN31a07fX2Rdsvl80o27uDtkO5o788uLxlp8nOzTs/VKRU9FT6VDbu0t21Ydf4btHuG3u89jTs1dtbvPf9Psm+21UBVU3VZtVl+0n7s/c/romq6fiW+21drU5tce3HA9ID/QcjDrbXudTVHdI9VFKP1ivrRw7HH77+ne93LQ02DVWNnMbiI3BEeeTp9wnf9x4NOtp2jHus4QfTH3YdZx0vakKa8ppGm1Oa+1tiW7pPzD7R1ureevxH2x8PnDQ8WXlK81TJadrpgtOTZ/LPjJ2VnX1+LvncYNuitnvnY87fag9v77oQdOHSRf+L5zu8O85c8rh08rLb5RNXuFearzpfbep06jz+k9NPx7ucu5quuVxrue56vbV7ZvfpG543zt30vXnxFv/W1Z45Pd2983pv98X39d8W3X5yJ/3Oy7vZdyfurbxPvF/0QO1B2UPdh9U/W/7c2O/cf2rAd6Dz0dxH9waFg8/+kfWPD0MFj5mPy4YNhuueOD45OeI/cv3p/KdDz2TPJp4X/qL+y64XFi9++NXr187RmNGhl/KXk79tfKX96sDrGa/bxsLGHr7JeDMxXvRW++3Bd9x3He+j3w9P5Hwgfyj/aPmx9VPQp/uTGZOT/wQDmPP8YzMt2wAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAABBUlEQVR42mL8v4OBJMAEZ/0nTgMLnLXtitKRO9JmCi9cNR/wsP8mrOHfP8YbL4RvvBBWFXuvI/WGsJMYSHUSMujbY8LN/ttM4bmO1BtW5n+ENdipPmndbrHjqiIn6x9DuZc2yk8tlZ7hc5Kx/AtzxecMDAzff7Mcuys9/7gOAT8wMjAUOZ9x0XhI2A98HL+Eub/vuSG/8ozGmy+cEEF+zp/YNYjxfvPTv9O63fLpBx6ICCvz32DD24EGt7Fo4Gb/zcX2Z84RPbiIqfyLZJtL4rzfsDvJUf3R91+sC09o//7LJMn/NdXmkqHsSyzeQ0t8j9/znn8s7ql9Dy34cWogIbUSCQADAJ+jWQrH9LCsAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAACW0lEQVR4nGP8v5OBpoCJtsbTwQIWTKGUxe5mCi9M5V/oSL9mZf5HoQWMmHEQOD0AwuBg/WMo+8pB/ZGZwguyLcDiAzj48Zvl+D2pTz/YKLGAcBxcfSZCtulEWUAhGDQW3HstcOOF8P//jKRagC+SkQE/58/0pa7c7L9N5V+aKTw3kH3FxvKXmhYI83y3VXl64Jbs3htye2/IsbH8NZB9Zabw3FT+JR/nTypYwMDAEGBw+8AtWQj71x/mU/clT92XZGT8ry7+zlzxhbnic0n+LxRZIC/8yUju5blH4siC//8z3nghfOOF8MLj2jKCnydH7EXTRVoqCjC4g0f2yXteTEHSLNCVft0WcNhM4QXxiYmEIIIATcm3mpJvn37gmX7Q8OozYYLqycloTz/wLDulRYzpDMT4QFf6NZz95gvnyjMa+27I/SM6xxGwQJj7R6rtJQYGhk8/2NaeU9t+RfH3X2ZcihWEP5Fmgazg53qfY9zsv1ed0dh4UeXbL5yKudl/R5tdd9O6T4IFGhJvyz1OHbkts/qc2qfv7LiUMTIwOGk8irW4yo8jP2O3wEzxubHcy7I1Dq+/cOIymoGBQVn0Q5rtRTXx93jUYLFAX+b1sw88p+5L4tHGy/Er2uy6m9YDRsb/eJRht8BS+emCY7q4NDAyMLhpPYixuMbD/gu/0VD1WBtezz7w9O81vvNKEE1cTfxdmu0lZdEPxBiNzwIGBoa//xhXndFYfU4NUsnwcf6Ms7jmpPGQ1BoHpwUQcOOF0OT9RoayryJNr3Oz/ybRcCIsoBwMmkp/8FoAADmgy6ulKggYAAAAAElFTkSuQmCC";
const SEARCH_HOME_URL = "http://www.msn.com/?pc=MOZM";
const SEARCH_KEYWORD_URL = "http://www.bing.com/search?form=MOZMLP&pc=MOZM&q=";
const SEARCH_NAME = "Bing";
const SEARCH_POSITION = 0;
const SEARCH_URL = "http://www.bing.com/search?form=MOZMSP&pc=MOZM&q={searchTerms}";

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

// Get a MSN url with a partner code
function getMsnBase(path, from) {
  return "http://now.msn.com/" + path + "?pc=MOZM&source=" +
    platform + "-" + from;
}
