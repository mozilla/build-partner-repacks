"use strict";
const EXPORTED_SYMBOLS = ["layout"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const SCREEN_MGR = Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager);
const layout = {
    MAX_DIMENSION: 7,
    REGULAR_DIMENSION: 5,
    init: function Layout_init(application) {
        this._application = application;
        this._logger = application.getLogger("Layout");
    },
    finalize: function Layout_finalize() {
        this._application = null;
        this._logger = null;
    },
    _conf: [
        [
            1024,
            600,
            3,
            3
        ],
        [
            1024,
            768,
            3,
            3
        ],
        [
            1280,
            800,
            4,
            3
        ],
        [
            1280,
            1024,
            4,
            4
        ],
        [
            1366,
            768,
            4,
            3
        ],
        [
            1440,
            900,
            4,
            4
        ]
    ],
    getScreenSize: function Layout_getScreenSize() {
        let width = {};
        let height = {};
        let primaryScreen = SCREEN_MGR.primaryScreen;
        primaryScreen.GetRect({}, {}, width, height);
        return [
            width.value,
            height.value
        ];
    },
    getThumbsNumXY: function Layout_getThumbsNumXY() {
        let thumbsNumX = this._application.preferences.get("ftabs.layoutX", 0);
        let thumbsNumY = this._application.preferences.get("ftabs.layoutY", 0);
        if (thumbsNumX >= 1 && thumbsNumY >= 1 && thumbsNumX <= this.MAX_DIMENSION && thumbsNumY <= this.MAX_DIMENSION) {
            return [
                thumbsNumX,
                thumbsNumY
            ];
        }
        [
            thumbsNumX,
            thumbsNumY
        ] = this.getXYLayoutOfScreen();
        this._application.preferences.set("ftabs.layoutX", thumbsNumX);
        this._application.preferences.set("ftabs.layoutY", thumbsNumY);
        return [
            thumbsNumX,
            thumbsNumY
        ];
    },
    getThumbsNum: function Layout_getThumbsNum() {
        let [
            x,
            y
        ] = this.getThumbsNumXY();
        return x * y;
    },
    getThumbsXYOfThumbsNum: function Layout_getThumbsXYOfThumbsNum(num) {
        return num.split("x").map(nmb => parseInt(nmb, 10));
    },
    getXYLayoutOfScreen: function Layout_getXYLayoutOfScreen() {
        let XY = [];
        let [
            width,
            height
        ] = this.getScreenSize();
        if (width > 1599) {
            XY = [
                5,
                5
            ];
        } else if (width < 1024) {
            XY = [
                3,
                3
            ];
        } else {
            let conf = this._conf;
            let maxSum = [
                0,
                -1
            ];
            for (let i = 0, len = conf.length; i < len; i++) {
                let [
                    w,
                    h
                ] = conf[i];
                if (w > width || h > height)
                    continue;
                let sum = w + h;
                if (sum > maxSum[0]) {
                    maxSum[0] = sum;
                    maxSum[1] = i;
                }
            }
            if (maxSum[1] === -1) {
                XY = [
                    3,
                    3
                ];
            } else {
                XY = conf[maxSum[1]].slice(2);
            }
        }
        XY.sort((x, y) => y - x);
        return XY;
    },
    _getDefaults: function Layout__getDefaults() {
        return [
            {
                x: 3,
                y: 3
            },
            {
                x: 4,
                y: 3
            },
            {
                x: 4,
                y: 4
            },
            {
                x: 5,
                y: 4
            },
            {
                x: 5,
                y: 5
            }
        ];
    },
    getPossibleLayouts: function Layout_getPossibleLayouts() {
        let layouts = this._getDefaults();
        let [
            curX,
            curY
        ] = this.getThumbsNumXY();
        let [
            oldX,
            oldY
        ] = this._application.preferences.get("ftabs.oldThumbsLayout", "0x0").split("x").map(n => parseInt(n, 10));
        let current = curX + "x" + curY;
        layouts.push({
            x: curX,
            y: curY
        });
        if (oldX && oldY) {
            layouts.push({
                x: oldX,
                y: oldY
            });
        }
        let displayed = {};
        layouts = layouts.map(function (layout) {
            layout.text = layout.x + "x" + layout.y;
            return layout;
        }).filter(function (layout) {
            if (displayed[layout.text])
                return false;
            displayed[layout.text] = true;
            return true;
        }).sort((a, b) => a.x * a.y - b.x * b.y);
        return {
            current: current,
            layouts: layouts.map(layout => String(layout.text || layout.x * layout.y))
        };
    },
    get layoutX() parseInt(this._application.preferences.get("ftabs.layoutX"), 10),
    set layoutX(val) this._application.preferences.set("ftabs.layoutX", parseInt(val, 10)),
    get layoutY() parseInt(this._application.preferences.get("ftabs.layoutY"), 10),
    set layoutY(val) this._application.preferences.set("ftabs.layoutY", parseInt(val, 10))
};
