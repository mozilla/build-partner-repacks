const EXPORTED_SYMBOLS = ["version", "EMID", "kDebug", "kVariant", "ourEMIDs", ];

const version = "2.5.1";
const EMID = "toolbar@web.de";
// show debug dump statement on OS console and JS console
const kDebug = false;
// "dev", "release"=full, "browser"=bundle, "amo"=addons.mozilla.org
const kVariant = "browser";

// these are the various brands of this toolbar, and they conflict
const ourEMIDs = [
  "toolbar@web.de",
  "toolbar@gmx.net",
  "toolbar@mail.com",
  "toolbar@1und1.de",
  "toolbar@web.de"
];
