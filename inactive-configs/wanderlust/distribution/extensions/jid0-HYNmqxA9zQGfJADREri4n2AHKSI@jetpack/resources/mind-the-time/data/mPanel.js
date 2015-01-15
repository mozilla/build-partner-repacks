/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
 
function init() {
    addon.port.on("alert", function(time) {
        var textNode = document.createTextNode(time);
        alertMessage = document.getElementById("mPanelTime");
        alertMessage.innerHTML = "";
        alertMessage.appendChild(textNode);        
    });
    window.addEventListener('click', function(event) {
        addon.port.emit('alertClicked'); 
    }, false);
}