/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

module.metadata = {
  "stability": "experimental"
};

const { emit, off } = require("api-utils/event/core");
const { when: unload } = require("api-utils/unload");
const { PrefsTarget } = require("api-utils/prefs/target");
const { id } = require("self");
const observers = require("api-utils/observer-service");

const ADDON_BRANCH = "extensions." + id + ".";
const BUTTON_PRESSED = id + "-cmdPressed";

const target = PrefsTarget({ branchName: ADDON_BRANCH });

// Listen to clicks on buttons
function buttonClick(subject, data) {
  emit(target, data);
}
observers.add(BUTTON_PRESSED, buttonClick);

// Make sure we cleanup listeners on unload.
unload(function() {
  observers.remove(BUTTON_PRESSED, buttonClick);
});

module.exports = target;
