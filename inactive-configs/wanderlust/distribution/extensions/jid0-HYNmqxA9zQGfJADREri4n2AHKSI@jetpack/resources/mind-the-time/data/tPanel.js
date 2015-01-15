/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 
function init() {
    const mode1Button = document.getElementById("mode1Button");
    const mode2Button = document.getElementById("mode2Button");
    const mode3Button = document.getElementById("mode3Button");
    const summaryButton = document.getElementById("summaryButton");
    mode1Button.onclick = function() {
        addon.port.emit("timerModeChange", 1);
    };
    mode2Button.onclick = function() {
        addon.port.emit("timerModeChange", 2);
    };
    mode3Button.onclick = function() {
        addon.port.emit("timerModeChange", 3);
    };
    summaryButton.onclick = function() {
        addon.port.emit("openSummary");
    };   
    window.addEventListener('click', function(event) {
        addon.port.emit('panelClicked'); 
    }, false);
}
