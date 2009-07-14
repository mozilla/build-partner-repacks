Must copy in BrowserPlusInstaller, installer.config, and BrowserPlus.crt
from build/installer.

Create xpi:
  mac: zip -r <destdir>/browserplus.xpi .
  doze: 7z a -tzip -r <destdir>/browserplus.xpi .

Here's how things work:

- Extension has a preference file in defaults/preference/firstrun.js which
  sets the preference "extensions.browserplus@yahoo.com.firstrun" to true.
- Overlay javascript in chrome/content/browserplusOverlay.js attaches
  a load event listener which check for the firstrun preference.
- If firstrun is found and is true:
    - delete our extension preference branch so that other firefox windows
      won't see firstrun and try to install
    - run a headless browserplus install synchronously
    - remove the entire browserplus extension, which also eliminates any
      further overhead for our extension
