"use strict";
const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
let howItWorks = document.querySelector("#howitworks");
let howItWorksElems = howItWorks.textContent.split("{button}");
let firstTextNode = document.createTextNode(howItWorksElems[0]);
let secondTextNode = document.createTextNode(howItWorksElems[1]);
let miniImage = document.createElementNS(XULNS, "image");
miniImage.classList.add("btn");
miniImage.setAttribute("width", 13);
miniImage.setAttribute("height", 14);
miniImage.setAttribute("src", "../../../../skin/dialogs/chevron-welcome/button.png");
howItWorks.textContent = "";
howItWorks.appendChild(firstTextNode);
howItWorks.appendChild(miniImage);
howItWorks.appendChild(secondTextNode);
document.querySelector("#toggleAllPanels").onclick = function () {
    let closeToolbars = this.getAttribute("data-action") === "close";
    window.chevron.collapseToolbars(closeToolbars);
    delete window.chevron.welcomeSlice;
    window.close();
};
function resizeWindowOnLoad() {
    let contentBO = document.documentElement.firstChild.boxObject;
    window.resizeWindowTo(contentBO.width, contentBO.height);
}
