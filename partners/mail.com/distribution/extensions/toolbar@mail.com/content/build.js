const EXPORTED_SYMBOLS = ["version", "EMID", "kDebug", "kVariant", "ourEMIDs", ];

const version = "2.10rc1";
const EMID = "toolbar@mail.com";
// "dev", "release"=full, "browser"=bundle, "amo"=addons.mozilla.org, "minimode"=full+minimode
const kVariant = "browser";

// these are the various brands of this toolbar, and they conflict
const ourEMIDs = [
  "toolbar@web.de",
  "toolbar@gmx.net",
  "toolbar@mail.com",
  "toolbar@1und1.de",
  "united.toolbar@mara.beonex.com"
];
