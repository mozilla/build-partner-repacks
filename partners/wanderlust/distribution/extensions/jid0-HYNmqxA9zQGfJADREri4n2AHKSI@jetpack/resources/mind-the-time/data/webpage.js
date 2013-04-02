/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Listens for time tracking events: page focus/blur and user activity

// FOCUS
function MTT_focusOn() {
    try { self.port.emit("focusOn")  }
    catch(e) { MTT_remove(); }
}
function MTT_focusOff() {
    try { self.port.emit("focusOff")  }
    catch(e) { MTT_remove(); }
}
document.addEventListener("focus", MTT_focusOn, false); 
document.addEventListener("blur" , MTT_focusOff, false);
self.port.emit("focusOn");
function MTT_remove() {
    document.removeEventListener("focus", MTT_focusOn, false);
    document.removeEventListener("blur", MTT_focusOff, false);
}
// ACTIVITY
function MTT_addListeners() {    
    setTimeout(function(){
        document.addEventListener("mousemove", MTT_activity, false);
        document.addEventListener("scroll", MTT_activity, false);
        document.addEventListener("keyup", MTT_activity, false);
    }, 30000);
};
function MTT_activity() {
    document.removeEventListener("mousemove", MTT_activity, false);
    document.removeEventListener("scroll", MTT_activity, false);
    document.removeEventListener("keyup", MTT_activity, false);
    try { self.port.emit("activity"); }
    catch(e) { }
};
MTT_addListeners();
self.port.on("addListeners", MTT_addListeners );